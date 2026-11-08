import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/auth";
import { prisma } from "../../../../../lib/prisma";
import { redis } from "../../../../../lib/ratelimit";

export const runtime = "nodejs";

function generateSlug(): string {
  return randomBytes(8).toString("base64url");
}

function clientIp(request: Request): string {
  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
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
    // Step 14: Rate limit anonymous guest shares (Audit §9E #6)
    // Max 3 guest shares per IP per hour to prevent database abuse.
    const ip = clientIp(request);
    const rateLimitKey = `ratelimit:guest-share:${ip}`;
    
    try {
      const current = await redis.get<number>(rateLimitKey);
      if (current && current >= 3) {
        return NextResponse.json(
          { error: "Too many guest shares. Please try again later." },
          { status: 429 }
        );
      }
      
      const newCount = await redis.incr(rateLimitKey);
      if (newCount === 1) {
        // First request in this window: set 1-hour expiry
        await redis.expire(rateLimitKey, 3600);
      }
    } catch {
      // If Redis is down, allow the request (don't block users due to infra)
    }

    if (!guestText || !guestText.trim()) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }

    const slug = generateSlug();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

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