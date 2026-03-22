// app/api/maps-directions/route.ts
// Server-side proxy for Google Maps Directions API
// Keeps the API key out of the browser

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!key) {
    return NextResponse.json({ status: 'ERROR', error: 'Maps not configured' })
  }

  const { searchParams } = req.nextUrl
  const origin      = searchParams.get('origin')
  const destination = searchParams.get('destination')
  const mode        = searchParams.get('mode') ?? 'driving'

  if (!origin || !destination) {
    return NextResponse.json({ status: 'ERROR', error: 'origin and destination required' })
  }

  try {
    const params = new URLSearchParams({
      origin,
      destination,
      mode,
      key,
      units:    'metric',
      language: 'en',
    })

    const res  = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${params}`,
      { signal: AbortSignal.timeout(8000) }
    )
    const data = await res.json()

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ status: 'ERROR', error: err.message })
  }
}