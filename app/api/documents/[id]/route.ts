import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

/** GET /api/documents/[id] — fetch a single document with all revisions */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const document = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
    include: {
      revisions: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ document });
}

type AddRevisionBody = {
  kind: "REWRITE" | "EDIT";
  content: string;
  provider?: string;
  mode?: string;
  styleReport?: unknown;
  intensity?: "LIGHT" | "BALANCED" | "STRONG";
};

/** POST /api/documents/[id] — add a new revision to an existing document */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as AddRevisionBody;

  const content = (body.content ?? "").trim();
  if (!content) {
    return NextResponse.json(
      { error: "Content is required." },
      { status: 400 }
    );
  }

  const document = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const revision = await prisma.revision.create({
    data: {
      documentId: document.id,
      kind: body.kind ?? "REWRITE",
      content,
      wordCount: content.split(/\s+/).length,
      provider: body.provider ?? null,
      mode: body.mode ?? null,
      styleReport: (body.styleReport as object) ?? undefined,
      intensity: body.intensity ?? undefined,
    },
  });

  await prisma.document.update({
    where: { id: document.id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true, revision });
}

/** DELETE /api/documents/[id] — remove a document */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const result = await prisma.document.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}