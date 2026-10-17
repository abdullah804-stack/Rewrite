import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { documents: true } },
    },
  });

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const project = await prisma.project.create({
    data: {
      userId: session.user.id,
      name: body.name.trim(),
    },
  });

  return NextResponse.json({ ok: true, project });
}