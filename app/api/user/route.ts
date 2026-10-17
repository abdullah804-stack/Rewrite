import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Because of onDelete: Cascade in the Prisma schema, this deletes the user,
    // their accounts, sessions, voice profiles, glossaries, documents, revisions,
    // and usage events.
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}