import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Incoming Request Body:', body); 

    const { destination, startDate, endDate, interests } = body;

    const fakePlan = {
      destination,
      startDate,
      endDate,
      interests,
      plan: [
        { day: 1, activity: `Explore ${destination}'s city center `},
        { day: 2, activity: `Visit top attractions and try local food` },
        { day: 3, activity: `Enjoy a ${interests[0]} experience `},
      ],
    };

    return NextResponse.json(fakePlan);
  } catch (error) {
    console.error('API error:', error); // 👈 Important
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}