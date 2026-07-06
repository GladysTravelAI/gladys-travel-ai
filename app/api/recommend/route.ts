import { NextRequest, NextResponse } from "next/server";
import { getTextCompletion, MODELS } from "@/lib/anthropic/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userInput = body.preferences;

    if (!userInput) {
      return NextResponse.json({ error: "Missing required preferences" }, { status: 400 });
    }

    const response = await getTextCompletion({
      system: "You are a smart travel planner AI. Plan detailed trips based on user input.",
      messages: [{ role: "user", content: userInput }],
      model: MODELS.heavy,
      maxTokens: 4000,
      temperature: 0.7,
    });

    return NextResponse.json({ recommendations: response });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
  }
}
