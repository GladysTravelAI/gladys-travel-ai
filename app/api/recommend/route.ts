import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userInput = body.preferences;

    if (!userInput) {
      return NextResponse.json({ error: "Missing required preferences" }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a smart travel planner AI. Plan detailed trips based on user input.",
        },
        {
          role: "user",
          content: userInput,
        },
      ],
      model: "gpt-4o",
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    return NextResponse.json({ recommendations: response });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 });
  }
}