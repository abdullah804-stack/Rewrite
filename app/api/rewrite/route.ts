import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createHash } from "crypto";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { protect, restore, type ProtectedSpan } from "../../../lib/pipeline/protect";
import { chatWithFallback } from "../../../lib/ai/chat";
import { getProvider, getProviderOrder, hasApiKey, type ProviderId } from "../../../lib/ai/providers";
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
  // Benchmark-only: when it equals the BENCH_KEY env var, the request skips the cache and the quota.
  benchKey: z.string().nullish(),
}).passthrough();

const INTENSITY_RULES: Record<Intensity, string> = {
  light: "Keep the overall order of ideas, but rewrite every sentence in fresh wording and fix any uniform rhythm.",
  balanced: "Restructure heavily: merge, split and reorder sentences so the result does not follow the draft sentence by sentence.",
  strong: "Rebuild the piece from the ideas up. Keep every fact and argument, but let the order, emphasis and sentence shapes be entirely your own.",
};

const OVERLAP_LIMIT: Record<Intensity, number> = { light: 0.3, balanced: 0.2, strong: 0.12 };

const PROMPT_VERSION = "v14-2026-11"; // bumped: output no longer goes through the random injector
const TARGET_SCORE = 2;
const REPAIR_TIME_BUDGET_MS = 34_000;
// Do not start another generation round (or try another provider) after this point; the route limit is 60s.
const GENERATION_DEADLINE_MS = 38_000;

const BASE_SYSTEM = `You are a writer reworking a draft in your own words. You are not an assistant explaining things; you are producing a piece of writing a real person could have written.

HARD RULES
1. Preserve every fact, number, name, claim and the logic connecting them. Never invent statistics, quotes, names, dates, credentials, or personal history. You may add hedges and clearly illustrative generic examples.
2. Restructure, do not paraphrase sentence by sentence. Sentence boundaries and order should differ from the draft: merge, split, reorder.
3. Vary rhythm hard. Mix very short sentences (2-6 words) with long ones (25+ words). Never write three consecutive sentences of similar length or shape. Vary how sentences end; not every one should close on a tidy punchline.
4. Prefer the concrete over the abstract. Replace phrases like "sustainable practices" or "stakeholder alignment" with what they actually mean in this text.
5. Do not repeat key terms. After the first mention use pronouns, short references or synonyms. Never reuse the same sentence opener or connective twice.
6. Avoid stock AI constructions: "not just X, but Y", lists of exactly three, summarizing closers ("so, ultimately..."), em dashes, "it's important to note", "in today's world".
7. Write fresh wording every time. Do not reuse any example phrases from these instructions.
8. Keep placeholders such as [FACT_1] exactly as written.
9. Follow the "Style plan" in the user message. It is different every run.
10. Voice comes from word choice, rhythm and opinions about the subject. Never add commentary about yourself, your reactions, or your own wording (no self-corrections, no asides about what makes sense to you).
11. Every sentence must be complete and every pronoun must clearly refer to one thing. Never end on a question or a fragment.

OUTPUT FORMAT (CRITICAL)
Return valid JSON, nothing else:
{
  "paragraphs": [
    { "index": 0, "text": "..." }
  ]
}`;

const REPAIR_SYSTEM = `You are an editor fixing specific machine-sounding patterns in a piece of writing. Fix only the listed problems. Keep all facts, numbers, meaning and placeholders such as [FACT_1] exactly as they are. Do not add new facts. Return valid JSON only: { "paragraphs": [ { "index": 0, "text": "..." } ] } with the same number of paragraphs.`;

const EXTRACT_SYSTEM = `You turn a draft into a plain list of its claims so someone else can write it up from scratch. For each paragraph, list every distinct claim, argument and fact as a short, neutral statement in plain words. Do NOT reuse the draft's phrasing, jargon or stock phrases; replace them with plain equivalents. Keep numbers, names and placeholders such as [FACT_1] exactly. Do not add anything that is not in the draft. Return valid JSON only: { "paragraphs": [ { "index": 0, "claims": ["..."] } ] }`;

const REVIEW_SYSTEM = `You are a strict copy editor comparing a rewrite to its original. Report only real problems: (1) a claim from the original that is missing or changed; (2) a new factual claim that is not in the original; (3) an incomplete sentence, a dangling question or fragment, or a pronoun that could refer to the wrong thing; (4) a subject mix-up (an action attributed to the wrong party). Return valid JSON only: { "issues": ["..."] }, with an empty list if there are none.`;

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
    const benchBypass = !!process.env.BENCH_KEY && body.benchKey === process.env.BENCH_KEY;
    if (benchBypass) {
      // Benchmark run: no quota reservation, so repeated runs do not eat the daily budget.
    } else if (userId) {
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
    // The cache key follows the configured provider chain, so changing providers or AI_PROVIDER_ORDER never serves old text.
    const primaryModelName = getProviderOrder().map((id) => `${id}:${getProvider(id).model}`).join("|");
    const cacheKey = hashRequest(PROMPT_VERSION, rawText, intensity, body.profileId ?? null, presetId, body.seoSafe ?? false, toneFormality, body.toneDirectness ?? 5, glossaryHash, primaryModelName);
    const cachedData = benchBypass ? null : await getCachedResponse<any>(cacheKey);

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

    if (!benchBypass) await setCachedResponse(cacheKey, data);
    if (userId && !benchBypass) {
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
  providerId: ProviderId;
  report: TellReport;
};

const GEN_PARAMS = { temperature: 1.0, topP: 0.95, frequencyPenalty: 0.4, presencePenalty: 0.3 };

function buildCandidate(resultText: string, provider: string, model: string, providerId: ProviderId, ctx: Ctx): Candidate | null {
  let parsed: any;
  try { parsed = RewriteOutputSchema.parse(parseJsonLoose(resultText)); } catch { return null; }
  if (!parsed.paragraphs || parsed.paragraphs.length !== ctx.expectedParas) return null;

  const joined = parsed.paragraphs.map((p: any) => p.text ?? "").join("\n\n");
  const { text: tokenized, usedFallback } = backToProtectedTokens(joined, ctx.spans);
  if (usedFallback || !verifySpansStrict(tokenized, ctx.spans).ok) return null;

  const restored = restore(tokenized, ctx.spans);
  if (restored.trim() === ctx.rawText.trim()) return null;

  const report = analyzeText(restored, ctx.rawText, { maxOverlap: ctx.overlapLimit });
  if (report.numbersMissing.length > 0) return null;

  return { paragraphs: parsed.paragraphs, tokenized, restored, provider, model, providerId, report };
}

async function extractClaims(paras: string[]): Promise<string[][] | null> {
  try {
    const user = paras.map((p, i) => `[Paragraph ${i}]\n${p}`).join("\n\n");
    const r = await chatWithFallback({ system: EXTRACT_SYSTEM, user, maxTokens: 3000, temperature: 0.3 });
    const arr = (parseJsonLoose(r.text) as any)?.paragraphs;
    if (!Array.isArray(arr) || arr.length !== paras.length) return null;
    const out: string[][] = arr.map((p: any) =>
      Array.isArray(p?.claims) ? p.claims.filter((c: unknown) => typeof c === "string" && (c as string).trim()) : []
    );
    if (!out.every((c) => c.length > 0)) return null;
    const need = paras.join(" ").match(/\[FACT_\d+\]/g) ?? [];
    const have = out.flat().join(" ");
    return need.every((t) => have.includes(t)) ? out : null;
  } catch { return null; }
}

async function reviewMeaning(original: string, rewritten: string): Promise<string[]> {
  try {
    const r = await chatWithFallback({
      system: REVIEW_SYSTEM,
      user: `Original:\n${original}\n\nRewrite:\n${rewritten}`,
      maxTokens: 600,
      temperature: 0.1,
    });
    const issues = (parseJsonLoose(r.text) as any)?.issues;
    return Array.isArray(issues) ? issues.filter((x: unknown) => typeof x === "string").slice(0, 5) : [];
  } catch { return []; }
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
  const elapsed = () => Date.now() - startedAt;

  const { masked, spans } = protect(rawText);
  const aiReadyText = toAiPlaceholders(masked, spans);
  const maskedParagraphs = aiReadyText.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 0);
  const ctx: Ctx = { rawText, spans, expectedParas: maskedParagraphs.length, overlapLimit: OVERLAP_LIMIT[intensity] };

  const seedBase = createHash("sha256").update(rawText + "|" + intensity + "|" + presetId).digest("hex").slice(0, 16);

  const claims = intensity === "light" ? null : await extractClaims(maskedParagraphs);
  const material = claims
    ? `Write the piece described below from scratch. These are the points to cover, in no required order. Do not follow this list's order or wording; build your own flow. Every point must appear.\n\n` +
      claims.map((c, i) => `[Paragraph ${i}]\n${c.map((x) => `- ${x}`).join("\n")}`).join("\n\n")
    : `Rewrite the draft below.\n\nDraft:\n"""\n${maskedParagraphs.map((p, i) => `[Paragraph ${i}]\n${p}`).join("\n\n")}\n"""`;

  // Every candidate in a request comes from the SAME provider, and the repair pass stays on it too.
  // Mixing models inside one request (and between requests) was producing inconsistent style.
  let transportFailed = false; // the provider errored or timed out (as opposed to returning unusable text)
  const generate = async (seed: string, providerId: ProviderId): Promise<Candidate | null> => {
    const plan = makeStylePlan({ seed, intensity, formality: toneFormality, preset: presetId });
    const user = `${material}\n\nIntensity: ${INTENSITY_RULES[intensity]}\n${renderStylePlan(plan)}${extraPrompt}\n\nReturn valid JSON with a "paragraphs" array (exactly ${ctx.expectedParas} paragraph(s), in order).`;
    try {
      const r = await chatWithFallback({ system: BASE_SYSTEM, user, maxTokens: 8000, ...GEN_PARAMS }, [providerId]);
      return buildCandidate(r.text, r.provider, r.model, r.providerId, ctx);
    } catch { transportFailed = true; return null; }
  };

  const n = intensity === "light" ? 1 : 2;
  let best: Candidate | null = null;
  const skippedProviders: string[] = [];
  for (const providerId of getProviderOrder()) {
    if (!hasApiKey(providerId)) { skippedProviders.push(`${providerId} (no API key)`); continue; }
    transportFailed = false;
    for (let round = 0; round < 2 && !best; round++) {
      // A provider that errored or timed out hands over to the next one straight away.
      // A second round on the same provider is only for unusable output (bad JSON, dropped spans).
      if (round > 0 && (transportFailed || elapsed() > GENERATION_DEADLINE_MS)) break;
      const batch = await Promise.all(Array.from({ length: n }, (_, i) => generate(`${seedBase}:${providerId}:${round}:${i}`, providerId)));
      for (const c of batch) if (c && (!best || c.report.score < best.report.score)) best = c;
    }
    if (best) break;
    skippedProviders.push(`${providerId} (${transportFailed ? "error or timeout" : "no valid output"})`);
    if (elapsed() > GENERATION_DEADLINE_MS) break;
  }
  if (!best) {
    return NextResponse.json({
      error: `Rewrite failed: model output invalid, dropped protected spans, or changed a number. Providers tried: ${skippedProviders.join(", ") || "none"}.`,
    }, { status: 502 });
  }

  const cost = (c: Candidate, iss: string[]) => c.report.score + iss.length * 2;
  let issues = elapsed() < REPAIR_TIME_BUDGET_MS ? await reviewMeaning(rawText, best.restored) : [];

  for (let pass = 0; pass < 2; pass++) {
    const problems = [...best.report.problems, ...issues.map((i) => `Meaning/clarity: ${i}`)];
    if ((best.report.score <= TARGET_SCORE && issues.length === 0) || problems.length === 0) break;
    if (elapsed() > REPAIR_TIME_BUDGET_MS) break;

    const current = toAiPlaceholders(best.tokenized, spans)
      .split(/\n{2,}/)
      .map((p, i) => `[Paragraph ${i}]\n${p.trim()}`)
      .join("\n\n");
    const user = `Problems to fix:\n${problems.map((p) => `- ${p}`).join("\n")}\n\nCurrent text:\n"""\n${current}\n"""\n\nReturn JSON with the same ${ctx.expectedParas} paragraph(s).`;
    try {
      const r = await chatWithFallback({ system: REPAIR_SYSTEM, user, maxTokens: 8000, ...GEN_PARAMS, temperature: 0.8 }, [best.providerId]);
      const fixed = buildCandidate(r.text, r.provider, r.model, r.providerId, ctx);
      if (!fixed) break;
      const fixedIssues = elapsed() < REPAIR_TIME_BUDGET_MS + 8_000 ? await reviewMeaning(rawText, fixed.restored) : issues;
      if (cost(fixed, fixedIssues) < cost(best, issues)) { best = fixed; issues = fixedIssues; } else break;
    } catch { break; }
  }

  // The text that was scored, repaired and checked is the text the user gets.
  // Nothing edits it afterwards: the old random post-processing broke grammar ("aI", "nASA"),
  // inserted the same stock phrases into every output, and made `rewritten` disagree with `paragraphs`.
  const finalOutput = best.restored;

  return NextResponse.json({
    ok: true, action: "rewrite", original: rawText, rewritten: finalOutput, paragraphs: best.paragraphs,
    provider: best.provider, model: best.model, providerId: best.providerId, providerFallback: skippedProviders, before: computeMetrics(rawText), after: computeMetrics(finalOutput),
    spansProtected: spans.length, profileUsed,
    tells: {
      score: best.report.score,
      burstiness: Number(best.report.burstiness.toFixed(2)),
      remaining: [...best.report.problems, ...issues.map((i) => `Meaning/clarity: ${i}`)],
      usedClaimExtraction: !!claims,
    },
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