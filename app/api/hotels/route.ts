// app/api/hotels/route.ts
// ⚠️  Hotel search is coming soon — returns coming_soon flag for now
// When ready: integrate TravelPayouts hotel search (already configured in travelpayoutsHotelTool.ts)

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { destination, checkIn, checkOut, guests = 2 } = body

    if (!destination || typeof destination !== 'string') {
      return NextResponse.json({ error: 'Destination is required' }, { status: 400 })
    }

    // Coming soon — Booking.com affiliate approval in progress
    // Remove this block and uncomment below when affiliate is approved
    return NextResponse.json({
      coming_soon: true,
      hotels: [],
      message: 'Hotel booking launching soon. Join the waitlist at gladystravel.com',
    })

    /*
    // ─── FUTURE: TravelPayouts hotel search ───────────────────────────────────
    // Uncomment when Booking.com affiliate is approved

    const { executeHotelSearch } = await import('@/lib/tools/travelpayoutsHotelTool')

    const hotels = await executeHotelSearch({
      city:      destination,
      check_in:  checkIn  || getDefaultDate(30),
      check_out: checkOut || getDefaultDate(33),
      guests,
    })

    return NextResponse.json({ hotels, coming_soon: false })
    */
  } catch (error: any) {
    console.error('[hotels] error:', error)
    return NextResponse.json({ coming_soon: true, hotels: [], error: error.message }, { status: 500 })
  }
}

function getDefaultDate(daysAhead: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return d.toISOString().split('T')[0]
}