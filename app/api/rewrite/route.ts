import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createHash } from "crypto";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { protect, restore, type ProtectedSpan } from "../../../lib/pipeline/protect";
import { chatWithFallback } from "../../../lib/ai/chat";
import { computeMetrics } from "../../../lib/pipeline/metrics";
import type { VoiceProfile } from "../../../lib/ai/schemas";
import { RewriteOutputSchema } from "../../../lib/ai/schemas";
import { buildGlossaryPrompt, validateGlossary } from "../../../lib/pipeline/glossary";
import { PRESETS, type PresetId } from "../../../config/presets";
import { hashRequest, getCachedResponse, setCachedResponse } from "../../../lib/ai/cache";
import { reserveUserWords, refundUserWords, reserveAnonRun, refundAnonRun, clientIp } from "../../../lib/pipeline/guard";
import { getLimits } from "../../../config/plans";
import { analyzeText, type TellReport } from "../../../lib/pipeline/aiTells";
import { makeStylePlan, renderStylePlan, type Intensity } from "../../../lib/pipeline/stylePlan";

export const runtime = "nodejs";
export const maxDuration = 60;

type Action = "rewrite" | "regen" | "selection";

const RewriteRequestSchema = z.object({
  action: z.enum(["rewrite", "regen", "selection"]).nullish(),
  text: z.string().min(1, "Text is required"),
  context: z.string().nullish(),
  sentenceIndex: z.number().nullish(),
  intensity: z.enum(["light", "balanced", "strong"]).nullish(),
  profileId: z.string().nullish(),
  glossaryId: z.string().nullish(),
  projectId: z.string().nullish(),
  preset: z.string().nullish(),
  seoSafe: z.boolean().nullish(),
  toneFormality: z.number().min(0).max(10).nullish(),
  toneDirectness: z.number().min(0).max(10).nullish(),
}).passthrough();

// These used to reference "Detector Evasion rules" that never existed in the prompt.
const INTENSITY_RULES: Record<Intensity, string> = {
  light: "Keep the overall order of ideas, but rewrite every sentence in fresh wording and fix any uniform rhythm.",
  balanced: "Restructure heavily: merge, split and reorder sentences so the result does not follow the draft sentence by sentence.",
  strong: "Rebuild the piece from the ideas up. Keep every fact and argument, but let the order, emphasis and sentence shapes be entirely your own.",
};

const OVERLAP_LIMIT: Record<Intensity, number> = { light: 0.3, balanced: 0.2, strong: 0.12 };

const PROMPT_VERSION = "v12-2026-11";
const TARGET_SCORE = 2;          // stop repairing once the local tell score is at or below this
const REPAIR_TIME_BUDGET_MS = 38_000;

const BASE_SYSTEM = `You are a writer reworking a draft in your own words. You are not an assistant explaining things; you are producing a piece of writing a real person could have written.

HARD RULES
1. Preserve every fact, number, name, claim and the logic connecting them. Never invent statistics, quotes, names, dates, credentials, or personal history. You may add stance ("I'd say"), hedges, and clearly illustrative generic examples.
2. Restructure, do not paraphrase sentence by sentence. Sentence boundaries and order should differ from the draft: merge, split, reorder.
3. Vary rhythm hard. Mix very short sentences (2-6 words) with long ones (25+ words). Never write three consecutive sentences of similar length or shape. Vary how sentences end; not every one should close on a tidy punchline.
4. Prefer the concrete over the abstract. Replace phrases like "sustainable practices" or "stakeholder alignment" with what they actually mean in this text.
5. Do not repeat key terms. After the first mention use pronouns, short references or synonyms. Never reuse the same sentence opener or connective twice.
6. Avoid stock AI constructions: "not just X, but Y", lists of exactly three, summarizing closers ("so, ultimately..."), em dashes, "it's important to note", "in today's world".
7. Write fresh wording every time. Do not reuse any example phrases from these instructions.
8. Keep placeholders such as [FACT_1] exactly as written.
9. Follow the "Style plan" in the user message. It is different every run.

OUTPUT FORMAT (CRITICAL)
Return valid JSON, nothing else:
{
  "paragraphs": [
    { "index": 0, "text": "..." }
  ]
}`;

const REPAIR_SYSTEM = `You are an editor fixing specific machine-sounding patterns in a piece of writing. Fix only the listed problems. Keep all facts, numbers, meaning and placeholders such as [FACT_1] exactly as they are. Do not add new facts. Return valid JSON only: { "paragraphs": [ { "index": 0, "text": "..." } ] } with the same number of paragraphs.`;

function verifySpansStrict(rewritten: string, spans: ProtectedSpan[]) {
  const expectedTokens = spans.map((s) => s.token);
  const foundTokens = Array.from(rewritten.matchAll(/⟦P\d+⟧/g)).map((m) => m[0]);
  let missing = 0, duplicated = 0;
  for (const tok of expectedTokens) {
    const count = foundTokens.filter((t) => t === tok).length;
    if (count === 0) missing += 1; else if (count > 1) duplicated += 1;
  }
  const foundSet = new Set(foundTokens);
  const projection = expectedTokens.filter((t) => foundSet.has(t));
  const actual = foundTokens.filter((t) => expectedTokens.includes(t));
  let reordered = false;
  if (projection.length === actual.length) {
    for (let i = 0; i < projection.length; i++) if (projection[i] !== actual[i]) { reordered = true; break; }
  } else { reordered = true; }
  const unknownTokens = foundTokens.filter((t) => !expectedTokens.includes(t)).length;
  return { ok: missing === 0 && duplicated === 0 && unknownTokens === 0 && !reordered, missing, duplicated, reordered, unknownTokens };
}

function buildVoiceBlock(profile: VoiceProfile): string {
  const m = profile.measured, i = profile.interpreted;
  const lines = ["", "Target voice:", `- Summary: ${i.summary}`, `- Tone: ${i.tone.join(", ")}`, `- Formality: ${i.formality}`, `- Directness: ${i.directness}`, `- Humor: ${i.humor}`];
  if (m.sentenceLenMean > 0) lines.push(`- Sentence length: ~${Math.round(m.sentenceLenMean)} words.`);
  if (m.contractionRate > 0) lines.push(`- Contraction rate: ~${Math.round(m.contractionRate * 100)}%.`);
  if (i.signatureMoves.length > 0) lines.push(`- Signature moves: ${i.signatureMoves.join("; ")}`);
  if (i.neverDoes.length > 0) lines.push(`- Avoids: ${i.neverDoes.join("; ")}`);
  if (profile.exemplars.length > 0) {
    lines.push("Writing exemplars:");
    profile.exemplars.slice(0, 3).forEach((ex, idx) => lines.push(`Example ${idx + 1}:\n"""\n${ex}\n"""`));
  }
  return lines.join("\n");
}

function buildToneBlock(formality = 5, directness = 5): string {
  const lines = ["", "Target Tone:"];
  if (formality <= 3) lines.push("- Formality: Casual.");
  else if (formality >= 8) lines.push("- Formality: Professional.");
  if (directness <= 3) lines.push("- Directness: Soft.");
  else if (directness >= 8) lines.push("- Directness: Blunt.");
  return lines.join("\n");
}

function parseJsonLoose(text: string): unknown {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object found in model output");
    return JSON.parse(match[0]);
  }
}

function toAiPlaceholders(masked: string, spans: ProtectedSpan[]): string {
  let aiReady = masked;
  spans.forEach((span, i) => { aiReady = aiReady.split(span.token).join(`[FACT_${i + 1}]`); });
  return aiReady;
}

function backToProtectedTokens(aiText: string, spans: ProtectedSpan[]) {
  let result = aiText, usedFallback = false;
  spans.forEach((span, i) => {
    const placeholder = `[FACT_${i + 1}]`;
    if (!result.includes(placeholder)) usedFallback = true;
    result = result.split(placeholder).join(span.token);
  });
  return { text: result, usedFallback };
}

export async function POST(request: Request) {
  // Quota bookkeeping lives outside the try block so a thrown error can still refund.
  let quotaReserved = false;
  let userId: string | null = null;
  let anonIp: string | null = null;
  let wordCount = 0;
  const refund = async () => {
    if (!quotaReserved) return;
    quotaReserved = false;
    try {
      if (userId) await refundUserWords(userId, wordCount);
      else if (anonIp) await refundAnonRun(anonIp);
    } catch {}
  };

  try {
    const session = await auth();
    const parsedBody = RewriteRequestSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsedBody.success) return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });

    const body = parsedBody.data;
    const action: Action = body.action ?? "rewrite";
    const rawText = body.text;
    const intensity = (body.intensity ?? "balanced") as Intensity;
    wordCount = rawText.trim().split(/\s+/).length;
    const limits = getLimits(session?.user?.id ?? null);

    if (wordCount > limits.maxWordsPerRun) return NextResponse.json({ error: `Text exceeds ${limits.maxWordsPerRun} word limit.` }, { status: 400 });
    if (!session?.user && wordCount > limits.anonymousWordsPerRun) return NextResponse.json({ error: `Sign in.` }, { status: 401 });

    userId = session?.user?.id ?? null;
    anonIp = userId ? null : clientIp(request);
    if (userId) {
      const budget = await reserveUserWords(userId, wordCount, limits.rewriteWordsPerDay);
      if (!budget.ok) return NextResponse.json({ error: budget.reason }, { status: 429 });
      quotaReserved = true;
    } else if (anonIp) {
      const anonBudget = await reserveAnonRun(anonIp, limits.anonymousRunsPerDay);
      if (!anonBudget.ok) return NextResponse.json({ error: anonBudget.reason }, { status: 429 });
      quotaReserved = true;
    }

    let profileRecord: { name: string; profile: unknown } | null = null;
    if (body.profileId && userId) {
      const record = await prisma.voiceProfile.findUnique({ where: { id: body.profileId } });
      if (record && record.userId === userId) profileRecord = { name: record.name, profile: record.profile };
    }

    let glossaryRecord: any = null;
    if (body.glossaryId && userId) {
      glossaryRecord = await prisma.glossary.findUnique({ where: { id: body.glossaryId } });
      if (glossaryRecord && glossaryRecord.userId !== userId) glossaryRecord = null;
    } else if (body.projectId && userId) {
      const project = await prisma.project.findUnique({ where: { id: body.projectId } });
      if (project?.glossary && project.userId === userId) glossaryRecord = project.glossary as any;
    }

    const glossaryBlock = glossaryRecord ? buildGlossaryPrompt(glossaryRecord) : "";
    const presetId = (body.preset ?? "custom") as PresetId;
    const presetBlock = PRESETS[presetId]?.instruction ? `\n\nFormat (${PRESETS[presetId].name}):\n${PRESETS[presetId].instruction}` : "";
    const toneFormality = body.toneFormality ?? 5;
    const toneBlock = buildToneBlock(toneFormality, body.toneDirectness ?? 5);
    const extraPrompt = toneBlock + glossaryBlock + presetBlock + (profileRecord ? "\n" + buildVoiceBlock(profileRecord.profile as VoiceProfile) : "");
    const profileUsed = profileRecord ? { name: profileRecord.name } : null;

    if (action === "regen" || action === "selection") {
      const res = action === "regen"
        ? await handleRegen(rawText, body.context ?? "", extraPrompt, profileUsed)
        : await handleSelection(rawText, body.context ?? "", extraPrompt, profileUsed);
      if (res.status !== 200) await refund();
      return res;
    }

    const glossaryHash = glossaryBlock ? createHash("sha256").update(glossaryBlock).digest("hex") : null;
    const primaryModelName = "DeepSeek-V4.1-Flash";
    const cacheKey = hashRequest(PROMPT_VERSION, rawText, intensity, body.profileId ?? null, presetId, body.seoSafe ?? false, toneFormality, body.toneDirectness ?? 5, glossaryHash, primaryModelName);
    const cachedData = await getCachedResponse<any>(cacheKey);

    if (cachedData && validateGlossary(cachedData.rewritten, glossaryRecord).ok) {
      await refund();
      return NextResponse.json({ ...cachedData, provider: "Cache" });
    }

    const response = await handleFullRewrite({ rawText, intensity, extraPrompt, profileUsed, presetId, toneFormality });
    if (response.status !== 200) { await refund(); return response; }

    const data = await response.json();
    if (!validateGlossary(data.rewritten, glossaryRecord).ok) {
      await refund();
      return NextResponse.json({ error: "Validation failed." }, { status: 502 });
    }

    await setCachedResponse(cacheKey, data);
    if (userId) {
      prisma.usageEvent.create({ data: { userId, kind: action, words: wordCount, provider: data.provider || null, day: new Date().toISOString().slice(0, 10) } }).catch(() => {});
    }
    return NextResponse.json(data);
  } catch (err) {
    await refund();
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/* Full rewrite: best-of-N candidates -> local scoring -> targeted repair */
/* ------------------------------------------------------------------ */

type Ctx = {
  rawText: string;
  spans: ProtectedSpan[];
  expectedParas: number;
  overlapLimit: number;
};

type Candidate = {
  paragraphs: { index: number; text: string; changes?: string[] }[];
  tokenized: string;
  restored: string;
  provider: string;
  model: string;
  report: TellReport;
};

// Temperature/top_p/penalties: higher entropy is the single biggest lever on
// perplexity/burstiness. See the optional chat.ts patch for how these are applied.
const GEN_PARAMS = { temperature: 1.0, topP: 0.95, frequencyPenalty: 0.4, presencePenalty: 0.3 };

function buildCandidate(resultText: string, provider: string, model: string, ctx: Ctx): Candidate | null {
  let parsed: any;
  try { parsed = RewriteOutputSchema.parse(parseJsonLoose(resultText)); } catch { return null; }
  if (!parsed.paragraphs || parsed.paragraphs.length !== ctx.expectedParas) return null;

  const joined = parsed.paragraphs.map((p: any) => p.text ?? "").join("\n\n");
  const { text: tokenized, usedFallback } = backToProtectedTokens(joined, ctx.spans);
  if (usedFallback || !verifySpansStrict(tokenized, ctx.spans).ok) return null;

  const restored = restore(tokenized, ctx.spans);
  if (restored.trim() === ctx.rawText.trim()) return null;

  const report = analyzeText(restored, ctx.rawText, { maxOverlap: ctx.overlapLimit });
  if (report.numbersMissing.length > 0) return null; // a number was lost or altered

  return { paragraphs: parsed.paragraphs, tokenized, restored, provider, model, report };
}

async function handleFullRewrite(args: {
  rawText: string;
  intensity: Intensity;
  extraPrompt: string;
  profileUsed: { name: string } | null;
  presetId: PresetId;
  toneFormality: number;
}) {
  const { rawText, intensity, extraPrompt, profileUsed, presetId, toneFormality } = args;
  const startedAt = Date.now();

  const { masked, spans } = protect(rawText);
  const aiReadyText = toAiPlaceholders(masked, spans);
  const maskedParagraphs = aiReadyText.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 0);
  const ctx: Ctx = { rawText, spans, expectedParas: maskedParagraphs.length, overlapLimit: OVERLAP_LIMIT[intensity] };

  const seedBase = createHash("sha256").update(rawText + "|" + intensity + "|" + presetId).digest("hex").slice(0, 16);
  const draftBlock = `Draft:\n"""\n${maskedParagraphs.map((p, i) => `[Paragraph ${i}]\n${p}`).join("\n\n")}\n"""`;

  const generate = async (seed: string): Promise<Candidate | null> => {
    const plan = makeStylePlan({ seed, intensity, formality: toneFormality, preset: presetId });
    const user = `Rewrite the draft below.\n\nIntensity: ${INTENSITY_RULES[intensity]}\n${renderStylePlan(plan)}${extraPrompt}\n\n${draftBlock}\n\nReturn valid JSON with a "paragraphs" array (same number of paragraphs, same order).`;
    try {
      const r = await chatWithFallback({ system: BASE_SYSTEM, user, maxTokens: 8000, ...GEN_PARAMS });
      return buildCandidate(r.text, r.provider, r.model, ctx);
    } catch { return null; }
  };

  // 1) best-of-N: two differently-styled candidates in parallel (one for "light")
  const n = intensity === "light" ? 1 : 2;
  let best: Candidate | null = null;
  for (let round = 0; round < 2 && !best; round++) {
    const batch = await Promise.all(Array.from({ length: n }, (_, i) => generate(`${seedBase}:${round}:${i}`)));
    for (const c of batch) if (c && (!best || c.report.score < best.report.score)) best = c;
  }
  if (!best) return NextResponse.json({ error: "Rewrite failed: model output invalid, dropped protected spans, or changed a number." }, { status: 502 });

  // 2) targeted repair: feed the specific measured problems back to the model
  for (let pass = 0; pass < 2; pass++) {
    if (best.report.score <= TARGET_SCORE || best.report.problems.length === 0) break;
    if (Date.now() - startedAt > REPAIR_TIME_BUDGET_MS) break;

    const current = toAiPlaceholders(best.tokenized, spans)
      .split(/\n{2,}/)
      .map((p, i) => `[Paragraph ${i}]\n${p.trim()}`)
      .join("\n\n");
    const user = `Problems to fix:\n${best.report.problems.map((p) => `- ${p}`).join("\n")}\n\nCurrent text:\n"""\n${current}\n"""\n\nReturn JSON with the same ${ctx.expectedParas} paragraph(s).`;
    try {
      const r = await chatWithFallback({ system: REPAIR_SYSTEM, user, maxTokens: 8000, ...GEN_PARAMS, temperature: 0.8 });
      const fixed = buildCandidate(r.text, r.provider, r.model, ctx);
      if (fixed && fixed.report.score < best.report.score) best = fixed; else break;
    } catch { break; }
  }

  return NextResponse.json({
    ok: true, action: "rewrite", original: rawText, rewritten: best.restored, paragraphs: best.paragraphs,
    provider: best.provider, model: best.model, before: computeMetrics(rawText), after: computeMetrics(best.restored),
    spansProtected: spans.length, profileUsed,
    tells: { score: best.report.score, burstiness: Number(best.report.burstiness.toFixed(2)), remaining: best.report.problems },
  });
}

/* ------------------------------------------------------------------ */
/* Regen / selection (unchanged apart from sharing the refund logic)   */
/* ------------------------------------------------------------------ */

const REGEN_SYSTEM = `You rewrite ONE sentence. Return an alternative that reads more naturally.\n1. Preserve meaning and protected tokens exactly, in their original order.\n2. Match the surrounding context.\n3. Return JSON only: { "text": "..." }`;
const SELECTION_SYSTEM = `You rewrite a selected passage. Rewrite only the selection so it fits the context.\n1. Preserve meaning and protected tokens exactly, in their original order.\n2. Return JSON only: { "text": "..." }`;

async function handleRegen(sentence: string, context: string, extraPrompt: string, profileUsed: { name: string } | null) {
  const { masked, spans } = protect(sentence);
  const { masked: maskedContext } = protect(context);
  const userPrompt = `Regenerate this sentence:\n"""\n${masked}\n"""\nContext:\n"""\n${maskedContext.slice(0, 1500)}\n"""\n${extraPrompt}\n\nReturn JSON: { "text": "..." }`;
  const result = await chatWithFallback({ system: REGEN_SYSTEM, user: userPrompt, maxTokens: 400, temperature: 0.8 });
  let parsed: { text?: string };
  try { parsed = parseJsonLoose(result.text) as typeof parsed; } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 502 }); }
  if (typeof parsed.text !== "string") return NextResponse.json({ error: "Invalid shape." }, { status: 502 });
  const { text: tokenized, usedFallback } = backToProtectedTokens(parsed.text, spans);
  if (usedFallback || !verifySpansStrict(tokenized, spans).ok) return NextResponse.json({ error: "Dropped spans." }, { status: 502 });
  return NextResponse.json({ ok: true, action: "regen", original: sentence, rewritten: restore(tokenized, spans), provider: result.provider, model: result.model, spansProtected: spans.length, profileUsed });
}

async function handleSelection(selection: string, context: string, extraPrompt: string, profileUsed: { name: string } | null) {
  const { masked, spans } = protect(selection);
  const { masked: maskedContext } = protect(context);
  const userPrompt = `Rewrite this selection:\n"""\n${masked}\n"""\nContext:\n"""\n${maskedContext.slice(0, 1500)}\n"""\n${extraPrompt}\n\nReturn JSON: { "text": "..." }`;
  const result = await chatWithFallback({ system: SELECTION_SYSTEM, user: userPrompt, maxTokens: 800, temperature: 0.8 });
  let parsed: { text?: string };
  try { parsed = parseJsonLoose(result.text) as typeof parsed; } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 502 }); }
  if (typeof parsed.text !== "string") return NextResponse.json({ error: "Invalid shape." }, { status: 502 });
  const { text: tokenized, usedFallback } = backToProtectedTokens(parsed.text, spans);
  if (usedFallback || !verifySpansStrict(tokenized, spans).ok) return NextResponse.json({ error: "Dropped spans." }, { status: 502 });
  return NextResponse.json({ ok: true, action: "selection", original: selection, rewritten: restore(tokenized, spans), provider: result.provider, model: result.model, spansProtected: spans.length, profileUsed });
}