// app/api/emails/route.ts
// Unified email endpoint for GladysTravel.com
//
// POST /api/emails
// Body: { type: 'welcome', to, name? }
//       { type: 'trip',    to, name?, trip: TripEmailData }

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, buildWelcomeEmail, buildTripEmail, TripEmailData } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, to, name } = body;

    if (!type || !to) {
      return NextResponse.json({ error: 'Missing type or to' }, { status: 400 });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (type === 'welcome') {
      const html    = buildWelcomeEmail(name);
      const subject = name
        ? `Welcome to Gladys Travel, ${name.split(' ')[0]}! ✈️`
        : 'Welcome to Gladys Travel! ✈️';

      const result = await sendEmail({ to, subject, html });
      return NextResponse.json(result);
    }

    if (type === 'trip') {
      const trip: TripEmailData = body.trip;
      if (!trip?.eventName || !trip?.destination) {
        return NextResponse.json({ error: 'Missing trip data' }, { status: 400 });
      }

      // Attach display name to trip
      if (name) trip.userName = name;

      const html    = buildTripEmail(trip);
      const subject = `Your trip to ${trip.eventName} is saved 🎉`;

      const result = await sendEmail({ to, subject, html });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 });

  } catch (err: any) {
    console.error('[/api/emails]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}