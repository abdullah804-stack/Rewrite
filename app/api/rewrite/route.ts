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

const INTENSITY_RULES: Record<string, string> = {
  light: "Apply the Detector Evasion rules but keep most of the original structure.",
  balanced: "Aggressively apply the Detector Evasion rules. Restructure sentences completely to force high burstiness.",
  strong: "Maximally apply the Detector Evasion rules. Break every predictable pattern. The output must sound messy and human.",
};

const PROMPT_VERSION = "v5-2026-11";

const BASE_SYSTEM = `You are an expert at rewriting text to sound human and evade AI detectors.

INSTRUCTIONS:
1. Completely rewrite the provided text. Do NOT copy the original sentences.
2. Mix very short sentences (2-5 words) with very long ones (20+ words).
3. Delete AI buzzwords (Furthermore, Moreover, Ultimately, Delve, Landscape).
4. Use contractions (it's, don't) and start sentences with "And", "But", "So", or "Honestly". 
5. Keep placeholders like ⟦P1⟧ exactly as they are, in the same order.
6. Do NOT alter numbers, names, or citations.

OUTPUT FORMAT (CRITICAL)
You MUST return valid JSON matching this exact structure. Do not break the JSON syntax.
{
  "paragraphs": [
    { "index": 0, "text": "Your completely rewritten text goes here." }
  ]
}`;

const REVIEW_SYSTEM = `You are an independent editorial reviewer evaluating a rewrite against its original.
You MUST evaluate four dimensions, each as "pass" or "fail":
1. naturalness
2. voice
3. meaning
4. grammar
Return JSON exactly in this shape: { "naturalness": "pass" | "fail", "voice": "pass" | "fail", "meaning": "pass" | "fail", "grammar": "pass" | "fail", "issues": [{ "index": 0, "reason": "..." }] }`;

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
  spans.forEach((span, i) => { aiReady = aiReady.replace(span.token, `[FACT_${i + 1}]`); });
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
  try {
    const session = await auth();
    const parsedBody = RewriteRequestSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsedBody.success) return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });

    const body = parsedBody.data;
    const action: Action = body.action ?? "rewrite";
    const rawText = body.text;
    const intensity = body.intensity ?? "balanced";
    const wordCount = rawText.trim().split(/\s+/).length;
    const limits = getLimits(session?.user?.id ?? null);

    if (wordCount > limits.maxWordsPerRun) return NextResponse.json({ error: `Text exceeds ${limits.maxWordsPerRun} word limit.` }, { status: 400 });
    if (!session?.user && wordCount > limits.anonymousWordsPerRun) return NextResponse.json({ error: `Sign in.` }, { status: 401 });

    const anonIp = session?.user?.id ? null : clientIp(request);
    let quotaReserved = false;
    if (session?.user?.id) {
      const budget = await reserveUserWords(session.user.id, wordCount, limits.rewriteWordsPerDay);
      if (!budget.ok) return NextResponse.json({ error: budget.reason }, { status: 429 });
      quotaReserved = true;
    } else if (anonIp) {
      const anonBudget = await reserveAnonRun(anonIp, limits.anonymousRunsPerDay);
      if (!anonBudget.ok) return NextResponse.json({ error: anonBudget.reason }, { status: 429 });
      quotaReserved = true;
    }

    let profileRecord = null;
    if (body.profileId && session?.user?.id) {
      const record = await prisma.voiceProfile.findUnique({ where: { id: body.profileId } });
      if (record && record.userId === session.user.id) profileRecord = { name: record.name, profile: record.profile };
    }

    let glossaryRecord = null;
    if (body.glossaryId && session?.user?.id) {
      glossaryRecord = await prisma.glossary.findUnique({ where: { id: body.glossaryId } });
      if (glossaryRecord && glossaryRecord.userId !== session.user.id) glossaryRecord = null;
    } else if (body.projectId && session?.user?.id) {
      const project = await prisma.project.findUnique({ where: { id: body.projectId } });
      if (project?.glossary && project.userId === session.user.id) glossaryRecord = project.glossary as any;
    }
    
    const glossaryBlock = glossaryRecord ? buildGlossaryPrompt(glossaryRecord) : "";
    const presetId = (body.preset ?? "custom") as PresetId;
    const presetBlock = PRESETS[presetId]?.instruction ? `\n\nFormat (${PRESETS[presetId].name}):\n${PRESETS[presetId].instruction}` : "";
    const toneBlock = buildToneBlock(body.toneFormality ?? 5, body.toneDirectness ?? 5);
    const extraPrompt = toneBlock + glossaryBlock + presetBlock + (profileRecord ? "\n" + buildVoiceBlock(profileRecord.profile as VoiceProfile) : "");
    const profileUsed = profileRecord ? { name: profileRecord.name } : null;

    if (action === "regen") return await handleRegen(rawText, body.context ?? "", extraPrompt, profileUsed);
    if (action === "selection") return await handleSelection(rawText, body.context ?? "", extraPrompt, profileUsed);

    const glossaryHash = glossaryBlock ? createHash("sha256").update(glossaryBlock).digest("hex") : null;
    const primaryModelName = "DeepSeek-V4.1-Flash"; 
    const cacheKey = hashRequest(PROMPT_VERSION, rawText, intensity, body.profileId ?? null, presetId, body.seoSafe ?? false, body.toneFormality ?? 5, body.toneDirectness ?? 5, glossaryHash, primaryModelName);
    const cachedData = await getCachedResponse<any>(cacheKey);

    if (cachedData && validateGlossary(cachedData.rewritten, glossaryRecord).ok) {
      if (session?.user?.id && quotaReserved) await refundUserWords(session.user.id, wordCount);
      else if (anonIp && quotaReserved) await refundAnonRun(anonIp);
      return NextResponse.json({ ...cachedData, provider: "Cache" });
    }

    const response = await handleFullRewrite(rawText, intensity, extraPrompt, profileUsed);
    
    if (response.status !== 200) {
      if (session?.user?.id && quotaReserved) await refundUserWords(session.user.id, wordCount);
      else if (anonIp && quotaReserved) await refundAnonRun(anonIp);
      return response;
    }

    const data = await response.json();
    if (!validateGlossary(data.rewritten, glossaryRecord).ok) {
      if (session?.user?.id && quotaReserved) await refundUserWords(session.user.id, wordCount);
      else if (anonIp && quotaReserved) await refundAnonRun(anonIp);
      return NextResponse.json({ error: "Validation failed." }, { status: 502 });
    }

    await setCachedResponse(cacheKey, data);
    if (session?.user?.id) {
      prisma.usageEvent.create({ data: { userId: session.user.id, kind: action, words: wordCount, provider: data.provider || null, day: new Date().toISOString().slice(0, 10) } }).catch(() => {});
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

async function handleFullRewrite(rawText: string, intensity: string, extraPrompt: string, profileUsed: { name: string } | null) {
  const { masked, spans } = protect(rawText);
  const aiReadyText = toAiPlaceholders(masked, spans);
  const maskedParagraphs = aiReadyText.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 0);

  const buildUserPrompt = () => `Rewrite the following draft.\n\nIntensity: ${INTENSITY_RULES[intensity]}${extraPrompt}\n\nDraft:\n"""\n${maskedParagraphs.map((p, i) => `[Paragraph ${i}]\n${p}`).join("\n\n")}\n"""\n\nReturn valid JSON with a "paragraphs" array.`;

  const attempts = [false, true];
  for (const strict of attempts) {
    const result = await chatWithFallback({ system: BASE_SYSTEM, user: buildUserPrompt(), maxTokens: 8000, temperature: 0.7 });

    let parsed: any;
    try {
      parsed = RewriteOutputSchema.parse(parseJsonLoose(result.text));
    } catch {
      if (strict) return NextResponse.json({ error: "Model returned invalid JSON after retry." }, { status: 502 });
      continue;
    }

    const joined = parsed.paragraphs.map((p: any) => p.text ?? "").join("\n\n");
    const { text: tokenized, usedFallback } = backToProtectedTokens(joined, spans);
    if (usedFallback || !verifySpansStrict(tokenized, spans).ok) {
      if (strict) return NextResponse.json({ error: "Protected spans dropped." }, { status: 502 });
      continue;
    }
    if (parsed.paragraphs.length !== maskedParagraphs.length) {
      if (strict) return NextResponse.json({ error: "Paragraph completeness failed." }, { status: 502 });
      continue;
    }

    let restoredText = restore(tokenized, spans);
    let finalChanges = parsed.paragraphs.flatMap((p: any) => p.changes || []);

    if (intensity !== "light") {
      const reviewPrompt = `Original:\n${rawText}\n\nRewritten:\n${restoredText}\n\nEvaluate on naturalness, voice, meaning, grammar. Return JSON: { "naturalness": "pass"|"fail", "voice": "pass"|"fail", "meaning": "pass"|"fail", "grammar": "pass"|"fail", "issues": [{ "index": 0, "reason": "..." }] }`;
      try {
        const verdict = parseJsonLoose((await chatWithFallback({ system: REVIEW_SYSTEM, user: reviewPrompt, maxTokens: 1000, temperature: 0.2 })).text) as any;
        if (verdict.meaning === "fail") {
          if (strict) return NextResponse.json({ error: "Reviewer detected meaning change." }, { status: 502 });
          continue;
        }
        if (verdict.issues && verdict.issues.length > 0) {
          const repairedParagraphs = [...parsed.paragraphs];
          for (const issue of verdict.issues) {
            const originalPara = rawText.split(/\n{2,}/)[issue.index];
            if (!originalPara) continue;
            const maskedParaObj = protect(originalPara);
            try {
              const patchedText = (await chatWithFallback({ system: BASE_SYSTEM, user: `Fix this issue: "${issue.reason}"\n\nText: ${maskedParaObj.masked}\n\nReturn plain text.`, maxTokens: 2000, temperature: 0.7 })).text.trim();
              if (verifySpansStrict(patchedText, maskedParaObj.spans).ok) {
                repairedParagraphs[issue.index] = { index: issue.index, text: patchedText, changes: repairedParagraphs[issue.index]?.changes };
                finalChanges.push(`Fixed: ${issue.reason}`);
              }
            } catch {}
          }
          const repairedJoined = repairedParagraphs.map((p) => p.text).join("\n\n");
          if (verifySpansStrict(repairedJoined, spans).ok) restoredText = restore(repairedJoined, spans);
        }
      } catch {}
    }

    return NextResponse.json({
      ok: true, action: "rewrite", original: rawText, rewritten: restoredText, paragraphs: parsed.paragraphs,
      provider: result.provider, model: result.model, before: computeMetrics(rawText), after: computeMetrics(restoredText),
      spansProtected: spans.length, profileUsed, changes: finalChanges.length > 0 ? finalChanges : undefined,
    });
  }
  return NextResponse.json({ error: "Rewrite failed after retry." }, { status: 502 });
}

const REGEN_SYSTEM = `You rewrite ONE sentence. Return an alternative that reads more naturally.\n1. Preserve meaning and protected tokens exactly, in their original order.\n2. Match the surrounding context.\n3. Return JSON only: { "text": "..." }`;
const SELECTION_SYSTEM = `You rewrite a selected passage. Rewrite only the selection so it fits the context.\n1. Preserve meaning and protected tokens exactly, in their original order.\n2. Return JSON only: { "text": "..." }`;

async function handleRegen(sentence: string, context: string, extraPrompt: string, profileUsed: { name: string } | null) {
  const { masked, spans } = protect(sentence);
  const { masked: maskedContext } = protect(context);
  const userPrompt = `Regenerate this sentence:\n"""\n${masked}\n"""\nContext:\n"""\n${maskedContext.slice(0, 1500)}\n"""\n${extraPrompt}\n\nReturn JSON: { "text": "..." }`;
  const result = await chatWithFallback({ system: REGEN_SYSTEM, user: userPrompt, maxTokens: 400, temperature: 0.7 });
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
  const result = await chatWithFallback({ system: SELECTION_SYSTEM, user: userPrompt, maxTokens: 800, temperature: 0.7 });
  let parsed: { text?: string };
  try { parsed = parseJsonLoose(result.text) as typeof parsed; } catch { return NextResponse.json({ error: "Invalid JSON." }, { status: 502 }); }
  if (typeof parsed.text !== "string") return NextResponse.json({ error: "Invalid shape." }, { status: 502 });
  const { text: tokenized, usedFallback } = backToProtectedTokens(parsed.text, spans);
  if (usedFallback || !verifySpansStrict(tokenized, spans).ok) return NextResponse.json({ error: "Dropped spans." }, { status: 502 });
  return NextResponse.json({ ok: true, action: "selection", original: selection, rewritten: restore(tokenized, spans), provider: result.provider, model: result.model, spansProtected: spans.length, profileUsed });
}