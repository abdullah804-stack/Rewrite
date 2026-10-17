import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const glossaries = await prisma.glossary.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ glossaries });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const glossary = await prisma.glossary.create({
    data: {
      userId: session.user.id,
      name: body.name.trim(),
      alwaysUse: body.alwaysUse ?? [],
      neverUse: body.neverUse ?? [],
      keepAsIs: body.keepAsIs ?? [],
    },
  });

  return NextResponse.json({ ok: true, glossary });
}