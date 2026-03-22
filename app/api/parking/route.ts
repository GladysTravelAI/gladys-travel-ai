// app/api/parking/route.ts
// Find parking near a venue using Google Maps Places API

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!key) return NextResponse.json({ error: 'Maps not configured' })

  const { searchParams } = req.nextUrl
  const venue = searchParams.get('venue')
  const city  = searchParams.get('city')

  if (!venue) return NextResponse.json({ error: 'venue required' }, { status: 400 })

  try {
    // Step 1: Geocode the venue to get lat/lng
    const geoRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(`${venue}, ${city}`)}&key=${key}`,
      { signal: AbortSignal.timeout(8000) }
    )
    const geoData = await geoRes.json()
    const location = geoData.results?.[0]?.geometry?.location

    if (!location) {
      return NextResponse.json({ error: 'Could not geocode venue', parking: [] })
    }

    // Step 2: Nearby search for parking lots/garages
    const placesRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
      new URLSearchParams({
        location: `${location.lat},${location.lng}`,
        radius:   '800',  // 800m radius
        type:     'parking',
        key,
      }),
      { signal: AbortSignal.timeout(8000) }
    )
    const placesData = await placesRes.json()
    const results    = placesData.results ?? []

    // Step 3: Build parking options with distance
    const parking = results.slice(0, 8).map((p: any) => {
      const plat   = p.geometry?.location?.lat
      const plng   = p.geometry?.location?.lng
      const dist   = getDistance(location.lat, location.lng, plat, plng)
      const walkMin = Math.ceil(dist / 80) // ~80m/min walking speed

      return {
        id:          p.place_id,
        name:        p.name,
        address:     p.vicinity,
        distance:    dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`,
        walkTime:    `${walkMin} min walk`,
        walkMinutes: walkMin,
        rating:      p.rating,
        openNow:     p.opening_hours?.open_now,
        lat:         plat,
        lng:         plng,
        mapsUrl:     `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
        // Affiliate links — SpotHero & ParkWhiz
        spothero:    `https://spothero.com/search?lat=${plat}&lng=${plng}&utm_source=gladystravel`,
        parkwhiz:    `https://www.parkwhiz.com/search/?location=${encodeURIComponent(p.name + ' ' + (p.vicinity ?? ''))}&utm_source=gladystravel`,
      }
    }).sort((a: any, b: any) => a.walkMinutes - b.walkMinutes)

    return NextResponse.json({
      venue,
      city,
      lat:     location.lat,
      lng:     location.lng,
      parking,
      note:    'Prices vary — book in advance via SpotHero or ParkWhiz to save up to 50%',
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message, parking: [] })
  }
}

// Haversine distance in metres
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R    = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a    = Math.sin(dLat / 2) ** 2 +
               Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
               Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}