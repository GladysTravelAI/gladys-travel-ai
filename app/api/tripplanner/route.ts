import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { destination, startDate, endDate, interests } = await req.json();

  // Basic validation
  if (!destination || !startDate || !endDate || !interests) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  // Simulated AI response (you can replace this with OpenAI API later)
  const itinerary = {
    destination,
    startDate,
    endDate,
    interests,
    plan: [
      {
        day: 1,
        activity: `Explore top attractions in ${destination}`,
      },
      {
        day: 2,
        activity: `Enjoy ${interests[0]} experiences and local cuisine`,
      },
      {
        day: 3,
        activity: `Relax and reflect on your journey`,
      },
    ],
  };

  return NextResponse.json(itinerary);
}