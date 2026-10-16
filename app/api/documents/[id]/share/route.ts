import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/auth";
import { prisma } from "../../../../../lib/prisma";

export const runtime = "nodejs";

function generateSlug(): string {
  return randomBytes(8).toString("base64url");
}

/** POST /api/documents/[id]/share — turn sharing on or off, and return the slug */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const enable = body?.enable !== false;

  const document = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Generate a slug if the user wants it public and we don't have one yet
  let slug = document.slug;
  if (enable && !slug) {
    slug = generateSlug();
    // Retry on collision (extremely unlikely, but be safe)
    for (let i = 0; i < 3; i++) {
      const existing = await prisma.document.findUnique({ where: { slug } });
      if (!existing) break;
      slug = generateSlug();
    }
  }

  const updated = await prisma.document.update({
    where: { id: document.id },
    data: {
      isPublic: enable,
      slug: enable ? slug : document.slug, // keep the slug so re-enabling works
    },
  });

  return NextResponse.json({
    ok: true,
    isPublic: updated.isPublic,
    slug: updated.slug,
  });
}