import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Call GPT-5 here
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-5-mini",
      messages: messages.map((m: any) => ({
        role: m.type === "user" ? "user" : "assistant",
        content: m.text,
      })),
      max_tokens: 500,
    }),
  });

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't respond.";

  return NextResponse.json({ reply });
}