import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const doc = await prisma.document.findUnique({
    where: { slug, isPublic: true },
    include: {
      revisions: { orderBy: { createdAt: "desc" } },
      comments: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ document: doc });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();

  if (!body.authorName?.trim() || !body.content?.trim()) {
    return NextResponse.json({ error: "Name and comment are required" }, { status: 400 });
  }

  const doc = await prisma.document.findUnique({ where: { slug, isPublic: true } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: {
      documentId: doc.id,
      authorName: body.authorName.trim(),
      content: body.content.trim(),
    },
  });

  return NextResponse.json({ ok: true, comment });
}