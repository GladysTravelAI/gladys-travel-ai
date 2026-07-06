import { NextResponse } from "next/server";
import { getTextCompletion, MODELS } from "@/lib/anthropic/client";

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Call Claude here
  const reply = await getTextCompletion({
    messages: messages.map((m: any) => ({
      role: m.type === "user" ? "user" : "assistant",
      content: m.text,
    })),
    model: MODELS.fast,
    maxTokens: 500,
  }).catch(() => "Sorry, I couldn't respond.");

  return NextResponse.json({ reply });
}
