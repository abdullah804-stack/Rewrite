import { z } from "zod";

export const VoiceProfileInterpretedSchema = z.object({
  summary: z.string().max(600),
  tone: z.array(z.string().max(40)).max(6),
  formality: z.enum(["casual", "conversational", "professional", "formal"]),
  humor: z.enum(["none", "dry", "light", "frequent"]),
  directness: z.enum(["soft", "balanced", "blunt"]),
  signatureMoves: z.array(z.string().max(160)).max(8),
  neverDoes: z.array(z.string().max(160)).max(8),
});

export type VoiceProfileInterpreted = z.infer<
  typeof VoiceProfileInterpretedSchema
>;

export const VoiceProfileSchema = z.object({
  version: z.literal(1),
  depth: z.enum(["builtin", "quick", "standard", "full"]),
  measured: z.object({
    sentenceLenMean: z.number().min(0).max(100),
    sentenceLenSd: z.number().min(0).max(60),
    paragraphLenMean: z.number().min(0).max(500),
    contractionRate: z.number().min(0).max(1),
    firstPersonRate: z.number().min(0).max(1),
    questionRate: z.number().min(0).max(1),
    emDashPer1k: z.number().min(0).max(100),
    semicolonPer1k: z.number().min(0).max(100),
    readingGrade: z.number().min(0).max(30),
    favoredWords: z.array(z.string()).max(40),
    avoidedWords: z.array(z.string()).max(40),
  }),
  interpreted: VoiceProfileInterpretedSchema,
  exemplars: z.array(z.string().max(500)).min(2).max(6),
});

export type VoiceProfile = z.infer<typeof VoiceProfileSchema>;

export const RewriteOutputSchema = z.object({
  paragraphs: z.array(
    z.object({
      index: z.number().int().min(0),
      text: z.string().min(1),
      changes: z.array(z.string().max(140)).max(5).optional(),
    })
  ),
});

export type RewriteOutput = z.infer<typeof RewriteOutputSchema>;