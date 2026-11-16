import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createHash } from "crypto";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { getOwnedProfile } from "../../../lib/ownership";
import { protect, restore, type ProtectedSpan } from "../../../lib/pipeline/protect";
import { chatWithFallback } from "../../../lib/ai/chat";
import { computeMetrics } from "../../../lib/pipeline/metrics";
import { RewriteOutputSchema, VoiceProfileSchema, type VoiceProfile } from "../../../lib/ai/schemas";
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
  light: "Make light edits for clarity and flow. Keep the structure and wording where they already work.",
  balanced: "Restate each sentence in fresh, clear wording while preserving its claims, qualifications, and emphasis. Keep exact wording only for quotations, names, technical terms, or protected text.",
  strong: "Substantially restructure the sentences and, where useful, the order of ideas. Preserve all claims, qualifications, and the author's intent; keep exact wording only for quotations, names, technical terms, or protected text.",
};

const PROMPT_VERSION = "v28-2026-11";

const BASE_SYSTEM = `You are a careful editor. Rewrite the supplied draft to improve clarity, readability, and flow while preserving its meaning.

Rules:
- Preserve every factual claim, number, name, quotation, citation, qualification, and uncertainty. Do not add information or invent sources, examples, opinions, or personal experiences.
- Keep the author's point of view and intended audience. Do not add first-person language unless it is present in the draft.
- Use natural wording appropriate to the requested tone. Do not force slang, sentence-length patterns, punctuation, or awkward imperfections.
- Keep useful transitions, lists, and paragraph breaks when they help the reader. Remove only genuinely redundant wording.
- Follow the selected editing intensity. Light edits may keep clear sentences; balanced and strong edits should restate eligible sentences without changing their meaning.
- Do not reword quotations, names, technical terms, or protected exact text merely to make them different.

Return valid JSON matching this exact structure. Do not include any other text:
{
  "paragraphs": [
    { "index": 0, "text": "..." }
  ]
}`;

const REVIEW_SYSTEM = `You are a strict copy editor comparing a rewrite to its original. Report only real problems: (1) a claim from the original that is missing; (2) a new factual claim that is not in the original; (3) a pronoun that could refer to the wrong thing. Return valid JSON only: { "issues": ["..."] }`;

function buildVoiceBlock(profile: VoiceProfile): string {
  const voice = profile.interpreted;
  return [
    "",
    "Voice profile:",
    `- Summary: ${voice.summary}`,
    `- Tone: ${voice.tone.join(", ")}`,
    `- Formality: ${voice.formality}; directness: ${voice.directness}; humor: ${voice.humor}.`,
    ...(voice.signatureMoves.length ? [`- Style preferences: ${voice.signatureMoves.join("; ")}`] : []),
    ...(voice.neverDoes.length ? [`- Avoid these habits: ${voice.neverDoes.join("; ")}`] : []),
    "- Apply these style traits only; do not copy facts or subject matter from profile samples.",
  ].join("\n");
}

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

function buildToneBlock(formality = 5, directness = 5): string {
  const lines = ["", "Target Tone:"];
  if (formality <= 3) lines.push("- Use a casual, conversational register.");
  else if (formality >= 8) lines.push("- Use a professional, formal register.");
  else lines.push("- Use a neutral, conversational register.");
  if (directness <= 3) lines.push("- Use tactful, measured phrasing.");
  else if (directness >= 8) lines.push("- State the point directly without becoming abrupt.");
  else lines.push("- Use balanced, straightforward phrasing.");
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
    let selectedProfile: { name: string; avatar: string; profile: VoiceProfile } | null = null;
    if (body.profileId) {
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Sign in to use a voice profile." }, { status: 401 });
      }
      const savedProfile = await getOwnedProfile(session.user.id, body.profileId);
      if (!savedProfile) {
        return NextResponse.json({ error: "Voice profile not found." }, { status: 404 });
      }
      const profile = VoiceProfileSchema.safeParse(savedProfile.profile);
      if (!profile.success) {
        return NextResponse.json({ error: "Saved voice profile data is invalid." }, { status: 500 });
      }
      selectedProfile = { name: savedProfile.name, avatar: savedProfile.avatar, profile: profile.data };
    }

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
    const voiceBlock = selectedProfile ? buildVoiceBlock(selectedProfile.profile) : "";
    const extraPrompt = buildToneBlock(body.toneFormality ?? 5, body.toneDirectness ?? 5) + voiceBlock + presetBlock;

    const glossaryHash = createHash("sha256").update(extraPrompt).digest("hex");
    const primaryModelName = "openai/gpt-oss-120b"; 
    const cacheKey = hashRequest(PROMPT_VERSION, rawText, intensity, body.profileId ?? null, presetId, body.seoSafe ?? false, body.toneFormality ?? 5, body.toneDirectness ?? 5, glossaryHash, primaryModelName);
    const cachedData = await getCachedResponse<any>(cacheKey);

    if (cachedData) {
      await refund();
      return NextResponse.json({ ...cachedData, provider: "Cache" });
    }

    const { masked, spans } = protect(rawText);
    const aiReadyText = toAiPlaceholders(masked, spans);
    const maskedParagraphs = aiReadyText.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 0);

    const userPrompt = `Edit the following draft.\n\nEditing intensity: ${INTENSITY_RULES[intensity]}\n${extraPrompt}\n\nDraft:\n"""\n${maskedParagraphs.map((p, i) => `[Paragraph ${i}]\n${p}`).join("\n\n")}\n"""\n\nReturn the requested JSON.`;

    const result = await chatWithFallback({ system: BASE_SYSTEM, user: userPrompt, maxTokens: 8000, temperature: 0.4 });

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

    const restoredText = restore(tokenized, spans);

    const data = {
      ok: true, action: "rewrite", original: rawText, rewritten: restoredText, paragraphs: parsed.paragraphs,
      provider: result.provider, model: result.model, before: computeMetrics(rawText), after: computeMetrics(restoredText),
      spansProtected: spans.length,
      profileUsed: selectedProfile ? { name: selectedProfile.name, avatar: selectedProfile.avatar } : null,
      changes: []
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