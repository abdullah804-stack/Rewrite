import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/auth";
import { prisma } from "../../../../../lib/prisma";

export const runtime = "nodejs";

function generateSlug(): string {
  return randomBytes(8).toString("base64url");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  
  const enable = body?.enable !== false;
  const guestText = body?.text as string | undefined;

  // 1. Anonymous Magic Link flow
  if (id === "guest") {
    if (!guestText || !guestText.trim()) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }

    const slug = generateSlug();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    // Create a fake user to hold the document (or just use a generic guest ID)
    // We'll use a special guest user ID or just create an orphan document if we allow null userId.
    // Since our schema requires a userId, we will find or create a "guest" user.
    
    let guestUser = await prisma.user.findUnique({ where: { email: "guest@rewrite.app" } });
    if (!guestUser) {
      guestUser = await prisma.user.create({
        data: { email: "guest@rewrite.app", name: "Guest" }
      });
    }

    const document = await prisma.document.create({
      data: {
        userId: guestUser.id,
        title: "Guest Draft",
        preset: "custom",
        slug,
        isPublic: true,
        expiresAt,
        revisions: {
          create: [
            { kind: "REWRITE", content: guestText, wordCount: guestText.split(/\s+/).length }
          ]
        }
      }
    });

    return NextResponse.json({ ok: true, isPublic: true, slug: document.slug });
  }

  // 2. Authenticated flow (existing logic)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const document = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let slug = document.slug;
  if (enable && !slug) {
    slug = generateSlug();
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
      slug: enable ? slug : document.slug,
    },
  });

  return NextResponse.json({
    ok: true,
    isPublic: updated.isPublic,
    slug: updated.slug,
  });
}