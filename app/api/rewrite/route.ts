import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "../../../lib/prisma";
import { protect, restore, verifySpans } from "../../../lib/pipeline/protect";
import { chatWithFallback } from "../../../lib/ai/chat";
import { computeMetrics } from "../../../lib/pipeline/metrics";
import type { VoiceProfile } from "../../../lib/ai/schemas";
import { buildGlossaryPrompt, validateGlossary } from "../../../lib/pipeline/glossary";
import { PRESETS, type PresetId } from "../../../config/presets";
import {
  checkUserWordBudget,
  recordUserWords,
  checkAnonRunBudget,
  recordAnonRun,
  clientIp,
} from "../../../lib/pipeline/guard";
import { getLimits } from "../../../config/plans";

export const runtime = "nodejs";
export const maxDuration = 60;

type Action = "rewrite" | "regen" | "selection";

type Body = {
  action?: Action;
  text: string;
  context?: string;
  sentenceIndex?: number;
  intensity?: "light" | "balanced" | "strong";
  profileId?: string;
  glossaryId?: string;
  projectId?: string;
  preset?: PresetId;
  seoSafe?: boolean;
};

const INTENSITY_RULES: Record<string, string> = {
  light: "Change about 30% of sentences. Prefer word-level and phrase-level edits.",
  balanced: "Change about 60% of sentences. Sentence-level edits are allowed.",
  strong: "Change about 90% of sentences. You may reorder within a paragraph.",
};

const BASE_SYSTEM = `You are a writing editor. The user gives you a draft that may contain AI-generated language. Rewrite it so it reads like a human wrote it.

Core rules:
1. Preserve meaning exactly. Do not add facts.
2. Tokens like ⟦P1⟧, ⟦P2⟧ are protected spans. Reproduce each token exactly once.
3. Remove stock phrases, hedges, corporate jargon, and LLM tells.
4. Vary sentence length.
5. Return JSON only: { "paragraphs": [{ "index": 0, "text": "..." }] }`;

const REGEN_SYSTEM = `You rewrite ONE sentence. Return an alternative that reads more naturally.
1. Preserve meaning and protected tokens exactly.
2. Match the surrounding context.
3. Return JSON only: { "text": "..." }`;

const SELECTION_SYSTEM = `You rewrite a selected passage. Rewrite only the selection so it fits the context.
1. Preserve meaning and protected tokens exactly.
2. Return JSON only: { "text": "..." }`;

function buildVoiceBlock(profile: VoiceProfile): string {
  const m = profile.measured;
  const i = profile.interpreted;
  const lines = [
    "Target voice (match this):",
    `- Summary: ${i.summary}`,
    `- Tone: ${i.tone.join(", ")}`,
    `- Sentence length: ${m.sentenceLenMean} words`,
  ];
  return lines.join("\n");
}

function stripJsonFences(text: string): string {
  return text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = (await request.json()) as Body;
    const action: Action = body.action ?? "rewrite";
    const rawText = body.text ?? "";
    const intensity = body.intensity ?? "balanced";
    const profileId = body.profileId;
    const glossaryId = body.glossaryId;
    const presetId = body.preset ?? "custom";
    const seoSafe = body.seoSafe ?? false;

    if (!rawText.trim()) return NextResponse.json({ error: "Text is required" }, { status: 400 });

    const wordCount = rawText.trim().split(/\s+/).length;
    const limits = getLimits(session?.user?.id ?? null);

    if (wordCount > limits.maxWordsPerRun) {
      return NextResponse.json({ error: `Text exceeds ${limits.maxWordsPerRun} word limit.` }, { status: 400 });
    }

    if (!session?.user && wordCount > limits.anonymousWordsPerRun) {
      return NextResponse.json({ error: `Sign in to rewrite more than ${limits.anonymousWordsPerRun} words.` }, { status: 401 });
    }

    const anonIp = session?.user?.id ? null : clientIp(request);

    if (session?.user?.id) {
      const budget = await checkUserWordBudget(session.user.id, wordCount, limits.rewriteWordsPerDay);
      if (!budget.ok) return NextResponse.json({ error: budget.reason }, { status: 429 });
    } else if (anonIp) {
      const anonBudget = await checkAnonRunBudget(anonIp, limits.anonymousRunsPerDay);
      if (!anonBudget.ok) return NextResponse.json({ error: anonBudget.reason }, { status: 429 });
    }

    let voiceBlock = "";
    let profileUsed: { name: string } | null = null;
    if (profileId && session?.user?.id) {
      const record = await prisma.voiceProfile.findFirst({ where: { id: profileId, userId: session.user.id } });
      if (record) {
        voiceBlock = "\n\n" + buildVoiceBlock(record.profile as unknown as VoiceProfile);
        profileUsed = { name: record.name };
      }
    }

    let glossaryBlock = "";
    let glossaryRecord = null;
    
    // 1. Check global glossary first
    if (glossaryId && session?.user?.id) {
      glossaryRecord = await prisma.glossary.findFirst({ where: { id: glossaryId, userId: session.user.id } });
      if (glossaryRecord) {
        glossaryBlock = buildGlossaryPrompt(glossaryRecord);
      }
    } 
    // 2. If no global glossary, check for a project-specific glossary
    else if (body.projectId && session?.user?.id) {
      const project = await prisma.project.findUnique({
        where: { id: body.projectId, userId: session.user.id }
      });
      if (project?.glossary) {
        glossaryRecord = project.glossary as any;
        glossaryBlock = buildGlossaryPrompt(glossaryRecord);
      }
    }

    let presetBlock = "";
    if (PRESETS[presetId] && PRESETS[presetId].instruction) {
      presetBlock = `\n\nFormat & Style (${PRESETS[presetId].name}):\n${PRESETS[presetId].instruction}`;
    }

    let seoBlock = "";
    if (seoSafe) {
      seoBlock = "\n\nSEO-Safe Mode: Do NOT change any Markdown headings (lines starting with #). Do NOT change the casing or phrasing of the main topic keywords.";
    }

    const extraPrompt = voiceBlock + glossaryBlock + presetBlock + seoBlock;

    if (action === "regen") {
      return await handleRegen(rawText, body.context ?? "", extraPrompt, profileUsed);
    }

    if (action === "selection") {
      return await handleSelection(rawText, body.context ?? "", extraPrompt, profileUsed);
    }

    const response = await handleFullRewrite(rawText, intensity, extraPrompt, profileUsed);

    if (response.status === 200) {
      const data = await response.json(); 
      const validation = validateGlossary(data.rewritten, glossaryRecord);
      
      if (!validation.ok) {
        return NextResponse.json(
          { error: `Validation failed: ${validation.error}` },
          { status: 502 }
        );
      }

      if (session?.user?.id) {
        await recordUserWords(session.user.id, wordCount);
        prisma.usageEvent.create({
          data: { userId: session.user.id, kind: action, words: wordCount, provider: null, day: new Date().toISOString().slice(0, 10) },
        }).catch(() => {});
      } else if (anonIp) {
        await recordAnonRun(anonIp);
      }

      return NextResponse.json(data); 
    }

    return response;
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes("All providers failed") || msg.includes("429") || msg.includes("503")) {
      return NextResponse.json({ error: "All providers are currently at capacity. Please try again." }, { status: 503 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function handleFullRewrite(rawText: string, intensity: string, extraPrompt: string, profileUsed: { name: string } | null) {
  const { masked, spans } = protect(rawText);
  const maskedParagraphs = masked.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 0);

  const userPrompt = `Rewrite the following draft.

Intensity: ${INTENSITY_RULES[intensity]}${extraPrompt}

Draft:
"""
${maskedParagraphs.map((p, i) => `[Paragraph ${i}]\n${p}`).join("\n\n")}
"""

Return JSON: { "paragraphs": [{ "index": 0, "text": "..." }] }`;

  const result = await chatWithFallback({ system: BASE_SYSTEM, user: userPrompt, maxTokens: 4000, temperature: 0.7 });

  let parsed: { paragraphs: { index: number; text: string }[] };
  try {
    parsed = JSON.parse(stripJsonFences(result.text));
  } catch {
    return NextResponse.json({ error: "Model returned invalid JSON." }, { status: 502 });
  }

  const joined = parsed.paragraphs.map((p) => p.text).join("\n\n");
  if (!verifySpans(joined, spans).ok) {
    return NextResponse.json({ error: "Model dropped protected spans." }, { status: 502 });
  }

  const restoredParagraphs = parsed.paragraphs.map((p) => ({ index: p.index, text: restore(p.text, spans) }));
  const rewrittenText = restoredParagraphs.map((p) => p.text).join("\n\n");

  return NextResponse.json({
    ok: true, action: "rewrite", original: rawText, rewritten: rewrittenText,
    paragraphs: restoredParagraphs, provider: result.provider, model: result.model,
    before: computeMetrics(rawText), after: computeMetrics(rewrittenText),
    spansProtected: spans.length, profileUsed,
  });
}

async function handleRegen(sentence: string, context: string, extraPrompt: string, profileUsed: { name: string } | null) {
  const { masked, spans } = protect(sentence);
  const { masked: maskedContext } = protect(context);
  const userPrompt = `Regenerate this sentence:\n"""\n${masked}\n"""\nContext:\n"""\n${maskedContext.slice(0, 1500)}\n"""\n${extraPrompt}\n\nReturn JSON: { "text": "..." }`;
  const result = await chatWithFallback({ system: REGEN_SYSTEM, user: userPrompt, maxTokens: 400, temperature: 0.85 });
  
  let parsed: { text: string };
  try { parsed = JSON.parse(stripJsonFences(result.text)); } catch {
    return NextResponse.json({ error: "Model returned invalid JSON." }, { status: 502 });
  }
  if (!verifySpans(parsed.text, spans).ok) return NextResponse.json({ error: "Dropped spans." }, { status: 502 });
  
  return NextResponse.json({
    ok: true, action: "regen", original: sentence, rewritten: restore(parsed.text, spans),
    provider: result.provider, model: result.model, spansProtected: spans.length, profileUsed,
  });
}

async function handleSelection(selection: string, context: string, extraPrompt: string, profileUsed: { name: string } | null) {
  const { masked, spans } = protect(selection);
  const { masked: maskedContext } = protect(context);
  const userPrompt = `Rewrite this selection:\n"""\n${masked}\n"""\nContext:\n"""\n${maskedContext.slice(0, 1500)}\n"""\n${extraPrompt}\n\nReturn JSON: { "text": "..." }`;
  const result = await chatWithFallback({ system: SELECTION_SYSTEM, user: userPrompt, maxTokens: 800, temperature: 0.7 });
  
  let parsed: { text: string };
  try { parsed = JSON.parse(stripJsonFences(result.text)); } catch {
    return NextResponse.json({ error: "Model returned invalid JSON." }, { status: 502 });
  }
  if (!verifySpans(parsed.text, spans).ok) return NextResponse.json({ error: "Dropped spans." }, { status: 502 });
  
  return NextResponse.json({
    ok: true, action: "selection", original: selection, rewritten: restore(parsed.text, spans),
    provider: result.provider, model: result.model, spansProtected: spans.length, profileUsed,
  });
}