// app/api/flights/route.ts
// ⚠️  Flight search is coming soon — returns coming_soon flag for now
// When ready: integrate TravelPayouts flight search (already configured in travelpayoutsFlightTool.ts)

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { origin, destination, departDate, returnDate, passengers = 1 } = body

    // Coming soon — TravelPayouts integration in progress
    // Remove this block and uncomment below when affiliate is approved
    return NextResponse.json({
      coming_soon: true,
      flights: [],
      message: 'Flight search launching soon. Join the waitlist at gladystravel.com',
    })

    /*
    // ─── FUTURE: TravelPayouts flight search ──────────────────────────────────
    // Uncomment when TravelPayouts affiliate is active

    const { executeFlightSearch } = await import('@/lib/tools/travelpayoutsFlightTool')

    const flights = await executeFlightSearch({
      origin:         origin || 'JNB',
      destination:    destination || '',
      departure_date: departDate || getDefaultDate(7),
      return_date:    returnDate || getDefaultDate(14),
    })

    return NextResponse.json({ flights, coming_soon: false })
    */
  } catch (error: any) {
    console.error('[flights] error:', error)
    return NextResponse.json({ coming_soon: true, flights: [], error: error.message }, { status: 500 })
  }
}

function getDefaultDate(daysAhead: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return d.toISOString().split('T')[0]
}