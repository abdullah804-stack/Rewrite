import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "../../../lib/prisma";
import { buildVoiceProfile } from "../../../lib/ai/build-profile";

export const runtime = "nodejs";
export const maxDuration = 60;

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

type CreateBody = {
  name: string;
  samples: string[];
  depth?: "quick" | "standard" | "full";
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Sign in to create a voice profile." },
      { status: 401 }
    );
  }

  const body = (await request.json()) as CreateBody;
  const { name, samples, depth = "standard" } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const cleanSamples = (samples ?? []).map((s) => s.trim()).filter(Boolean);
  if (cleanSamples.length === 0) {
    return NextResponse.json(
      { error: "At least one sample is required." },
      { status: 400 }
    );
  }

  const totalWords = cleanSamples.join(" ").split(/\s+/).length;
  if (totalWords < 100) {
    return NextResponse.json(
      { error: "Samples must total at least 100 words." },
      { status: 400 }
    );
  }

  // Enforce profile limit (free tier: 3)
  const existing = await prisma.voiceProfile.count({
    where: { userId: session.user.id },
  });
  if (existing >= 3) {
    return NextResponse.json(
      {
        error:
          "Free plan allows 3 voice profiles. Delete one to create another.",
      },
      { status: 403 }
    );
  }

  try {
    const profile = await buildVoiceProfile(cleanSamples, depth);

    const saved = await prisma.voiceProfile.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
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