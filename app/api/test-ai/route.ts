import { NextResponse } from "next/server";
import { chatWithFallback } from "../../../lib/ai/chat";

export async function GET() {
  try {
    const result = await chatWithFallback({
      system: "You are a helpful assistant. Reply in one short sentence.",
      user: "Say hello and tell me which model you are.",
    });

    return NextResponse.json({
      ok: true,
      provider: result.provider,
      model: result.model,
      text: result.text,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}