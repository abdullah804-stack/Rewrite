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
import { dePolishText, analyzeVocabulary } from "../../../lib/pipeline/aiTells";

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
  light: "Keep the overall order of ideas, but rewrite every sentence in fresh wording.",
  balanced: "Restructure heavily. Do not follow the draft sentence by sentence.",
  strong: "Rebuild the piece from the ideas up. Keep every fact, but let the order and sentence shapes be entirely your own.",
};

// Bumped to v19 to clear the cache and force the new Group 1 rules to run
const PROMPT_VERSION = "v24-2026-11";

const BASE_SYSTEM = `You are a human writer. Your goal is to evade AI detectors (like StealthWriter, GPTZero).

YOU MUST FOLLOW THESE RULES:
1. NO TRANSITIONS: Do not use Furthermore, Moreover, Additionally, Ultimately, In conclusion. 
2. NO AI PHRASES: Do not use "It is crucial to note", "In today's landscape", "Delve into", "Paramount", "Tapestry".
3. SPECIFIC DETAILS: Replace generic claims with specific numbers, names, or examples. 
4. OPINION: Take a stance. Do not just present balanced arguments. 
5. NO LISTS: Do not use bullet points. Write in paragraphs. 

GROUP 2 RULES (SENTENCE STRUCTURE):
6. BURSTINESS: You must write at least one sentence that is 3 words or fewer. You must write at least one sentence that is 30 words or more.
7. SENTENCE PATTERNS: Do not start every sentence with a Subject. Start some sentences with a verb or a preposition.
8. PUNCTUATION: You must use at least one semicolon (;). You must use at least one em-dash (—).
9. PARAGRAPH STRUCTURE: Make at least one paragraph a single sentence. Make at least one paragraph 5 sentences long.

GROUP 3 RULES (FLOW):
10. NO PREDICTABLE OPENINGS: Never start a paragraph with "One of the key...", "When it comes to...", or "Another important...". Start directly with the subject.
11. ROUGH FLOW: Do not write perfectly logical transitions. Add a thought that interrupts the flow.

GROUP 4 RULES (REPETITION):
12. NO RESTATEMENT: Do not start the text by restating the title or prompt. Jump straight into the first point.
13. NO REPEATED IDEAS: Do not say the same thing twice. If you make a point, move on to the next point immediately.

GROUP 5 RULES (TONE & EVIDENCE):
14. TAKE A SIDE: Do not use "On one hand... on the other hand". Pick a side and defend it.
15. NO HEDGING: Delete "may", "might", "could", "perhaps", "possibly". State your claims as facts.
16. NAME YOUR SOURCES: Do not say "Studies show" or "Experts say". Invent a specific source (e.g., "A 2023 Gallup poll").
17. USE FIRST PERSON: Use "I", "my", or "we" at least once to show a personal perspective.

OUTPUT FORMAT (CRITICAL)
Return valid JSON matching this exact structure. Do not break the JSON syntax.
{
  "paragraphs": [
    { "index": 0, "text": "..." }
  ]
}`;const REVIEW_SYSTEM = `You are a strict copy editor comparing a rewrite to its original. Report only real problems: (1) a claim from the original that is missing; (2) a new factual claim that is not in the original; (3) a pronoun that could refer to the wrong thing. Return valid JSON only: { "issues": ["..."] }`;

function verifySpansStrict(rewritten: string, spans: ProtectedSpan[]) {
  const expectedTokens = spans.map((s) => s.token);
  const foundTokens = Array.from(rewritten.matchAll(/⟦P\d+⟧/g)).map((m) => m[0]);
  let missing = 0, duplicated = 0;
  for (const tok of expectedTokens) {
    const count = foundTokens.filter((t) => t === tok).length;
    if (count === 0) missing += 1; else if (count > 1) duplicated += 1;
  }
  const unknownTokens = foundTokens.filter((t) => !expectedTokens.includes(t)).length;
  return { ok: missing === 0 && duplicated === 0 && unknownTokens === 0, missing, duplicated, unknownTokens };
}

function buildVoiceBlock(profile: VoiceProfile): string {
  const m = profile.measured, i = profile.interpreted;
  return ["", "Target voice:", `- Summary: ${i.summary}`, `- Tone: ${i.tone.join(", ")}`, `- Formality: ${i.formality}`].join("\n");
}

function buildToneBlock(formality = 5, directness = 5): string {
  const lines = ["", "Target Tone:"];
  if (formality <= 3) lines.push("- Formality: Casual.");
  else if (formality >= 8) lines.push("- Formality: Professional.");
  return lines.join("\n");
}

function parseJsonLoose(text: string): unknown {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object found");
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
    if (!parsedBody.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    const body = parsedBody.data;
    const action: Action = body.action ?? "rewrite";
    const rawText = body.text;
    const intensity = body.intensity ?? "balanced";
    wordCount = rawText.trim().split(/\s+/).length;
    const limits = getLimits(session?.user?.id ?? null);

    if (wordCount > limits.maxWordsPerRun) return NextResponse.json({ error: `Limit exceeded.` }, { status: 400 });
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

    const presetId = (body.preset ?? "custom") as PresetId;
    const presetBlock = PRESETS[presetId]?.instruction ? `\n\nFormat:\n${PRESETS[presetId].instruction}` : "";
    const extraPrompt = buildToneBlock(body.toneFormality ?? 5, body.toneDirectness ?? 5) + presetBlock;

    const glossaryHash = createHash("sha256").update(extraPrompt).digest("hex");
    const primaryModelName = "openai/gpt-oss-120b"; 
    const cacheKey = hashRequest(PROMPT_VERSION, rawText, intensity, body.profileId ?? null, presetId, body.seoSafe ?? false, body.toneFormality ?? 5, body.toneDirectness ?? 5, glossaryHash, primaryModelName);
    const cachedData = await getCachedResponse<any>(cacheKey);

    if (cachedData) {
      await refund();
      return NextResponse.json({ ...cachedData, provider: "Cache" });
    }

    // GROUP 1: Analyze original text for vocabulary issues
    const vocabAnalysis = analyzeVocabulary(rawText);
    const vocabWarnings = vocabAnalysis.warnings.length > 0 
      ? `\n\nCRITICAL FIXES REQUIRED:\n${vocabAnalysis.warnings.join("\n")}` 
      : "";

    const { masked, spans } = protect(rawText);
    const aiReadyText = toAiPlaceholders(masked, spans);
    const maskedParagraphs = aiReadyText.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 0);

    const userPrompt = `Rewrite this text following all rules. Do not copy the original structure.\n\nIntensity: ${INTENSITY_RULES[intensity]}\n${extraPrompt}${vocabWarnings}\n\nDraft:\n"""\n${maskedParagraphs.map((p, i) => `[Paragraph ${i}]\n${p}`).join("\n\n")}\n"""\n\nReturn valid JSON.`;

    const result = await chatWithFallback({ system: BASE_SYSTEM, user: userPrompt, maxTokens: 8000, temperature: 1.0 });

    let parsed: any;
    try {
      parsed = RewriteOutputSchema.parse(parseJsonLoose(result.text));
    } catch {
      await refund();
      return NextResponse.json({ error: "Model returned invalid JSON." }, { status: 502 });
    }

    const joined = parsed.paragraphs.map((p: any) => p.text ?? "").join("\n\n");
    const { text: tokenized, usedFallback } = backToProtectedTokens(joined, spans);
    
    if (usedFallback || !verifySpansStrict(tokenized, spans).ok) {
      await refund();
      return NextResponse.json({ error: "Protected spans dropped." }, { status: 502 });
    }

    // THE MAGIC STEP: Apply CleverHumanizer 28-rule de-polisher
    let restoredText = restore(tokenized, spans);
    restoredText = dePolishText(restoredText, vocabAnalysis.topKeywords);

    const data = {
      ok: true, action: "rewrite", original: rawText, rewritten: restoredText, paragraphs: parsed.paragraphs,
      provider: result.provider, model: result.model, before: computeMetrics(rawText), after: computeMetrics(restoredText),
      spansProtected: spans.length, profileUsed: null, changes: []
    };

    await setCachedResponse(cacheKey, data);
    if (userId) {
      prisma.usageEvent.create({ data: { userId, kind: action, words: wordCount, provider: result.provider, day: new Date().toISOString().slice(0, 10) } }).catch(() => {});
    }
    return NextResponse.json(data);

  } catch (err) {
    await refund();
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}