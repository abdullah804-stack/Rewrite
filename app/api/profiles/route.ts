import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { buildVoiceProfile } from "../../../lib/ai/build-profile";

export const runtime = "nodejs";
export const maxDuration = 60;

// Step 15: Input limits (Audit §9E #5)
const MAX_SAMPLES = 10;
const MAX_WORDS_TOTAL = 5000;
const MAX_CHARS_PER_SAMPLE = 50000;

const CreateBodySchema = z.object({
  name: z.string().min(1).max(100),
  samples: z
    .array(z.string())
    .min(1, "At least one sample is required.")
    .max(MAX_SAMPLES, `Maximum ${MAX_SAMPLES} samples allowed.`),
  depth: z.enum(["quick", "standard", "full"]).optional().default("standard"),
  avatar: z.string().optional().default("minimalist"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profiles = await prisma.voiceProfile.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ profiles });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Sign in to create a voice profile." },
      { status: 401 }
    );
  }

  // Step 15: Zod validation of request body
  const rawBody = await request.json().catch(() => ({}));
  const parsed = CreateBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.format() },
      { status: 400 }
    );
  }

  const { name, samples, depth, avatar } = parsed.data;

  const cleanSamples = samples.map((s) => s.trim()).filter(Boolean);
  if (cleanSamples.length === 0) {
    return NextResponse.json(
      { error: "At least one sample is required." },
      { status: 400 }
    );
  }

  // Step 15: Per-sample character limit
  for (let i = 0; i < cleanSamples.length; i++) {
    if (cleanSamples[i].length > MAX_CHARS_PER_SAMPLE) {
      return NextResponse.json(
        {
          error: `Sample ${i + 1} is too long (max ${MAX_CHARS_PER_SAMPLE.toLocaleString()} characters).`,
        },
        { status: 400 }
      );
    }
  }

  const totalWords = cleanSamples.join(" ").split(/\s+/).length;
  if (totalWords < 100) {
    return NextResponse.json(
      { error: "Samples must total at least 100 words." },
      { status: 400 }
    );
  }

  // Step 15: Total word cap
  if (totalWords > MAX_WORDS_TOTAL) {
    return NextResponse.json(
      {
        error: `Samples exceed the ${MAX_WORDS_TOTAL.toLocaleString()}-word limit. Please trim them down.`,
      },
      { status: 400 }
    );
  }

  const existing = await prisma.voiceProfile.count({
    where: { userId: session.user.id },
  });
  if (existing >= 3) {
    return NextResponse.json(
      { error: "Free plan allows 3 voice profiles. Delete one to create another." },
      { status: 403 }
    );
  }

  try {
    const profile = await buildVoiceProfile(cleanSamples, depth);

    const saved = await prisma.voiceProfile.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        avatar,
        depth,
        profile: profile as unknown as object,
        sampleWords: totalWords,
        version: 1,
      },
    });

    return NextResponse.json({ ok: true, profile: saved });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 502 }
    );
  }
}