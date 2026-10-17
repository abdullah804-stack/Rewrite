import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";

const RETENTION_DAYS = 14;

function expiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + RETENTION_DAYS);
  return d;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documents = await prisma.document.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      revisions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return NextResponse.json({
    documents: documents.map((d) => ({
      id: d.id,
      title: d.title,
      preset: d.preset,
      projectId: d.projectId,
      updatedAt: d.updatedAt,
      revisionCount: d.revisions.length,
      latestRevisionId: d.revisions[0]?.id ?? null,
    })),
  });
}

type CreateBody = {
  title?: string;
  preset?: string;
  original: string;
  rewritten: string;
  provider?: string;
  mode?: string;
  profileId?: string;
  projectId?: string;
  styleReport?: unknown;
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to save revisions." }, { status: 401 });
  }

  const body = (await request.json()) as CreateBody;
  const original = (body.original ?? "").trim();
  const rewritten = (body.rewritten ?? "").trim();

  if (!original || !rewritten) {
    return NextResponse.json({ error: "Original and rewritten text are required." }, { status: 400 });
  }

  const wordCount = rewritten.split(/\s+/).length;
  const title = (body.title ?? "").trim() || deriveTitle(original);

  const document = await prisma.document.create({
    data: {
      userId: session.user.id,
      profileId: body.profileId ?? null,
      projectId: body.projectId ?? null,
      title,
      preset: body.preset ?? "blog",
      expiresAt: expiresAt(),
      revisions: {
        create: [
          { kind: "ORIGINAL", content: original, wordCount: original.split(/\s+/).length },
          { kind: "REWRITE", content: rewritten, wordCount, provider: body.provider ?? null, mode: body.mode ?? null, styleReport: (body.styleReport as object) ?? undefined },
        ],
      },
    },
    include: { revisions: true },
  });

  return NextResponse.json({ ok: true, document });
}

function deriveTitle(text: string): string {
  const firstLine = text.split("\n")[0].trim();
  const firstSentence = firstLine.split(/[.!?]/)[0].trim();
  return (firstSentence || "Untitled").slice(0, 80);
}