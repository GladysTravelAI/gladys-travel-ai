// app/api/explore-city/route.ts
// Direct Foursquare API — returns places in 4 categories for a given city
// Called by NearbyStrip in ItineraryView

import { NextRequest, NextResponse } from 'next/server'

// Node runtime — more reliable env var access than edge on Vercel
export const runtime = 'nodejs'

interface Place {
  id:       string
  name:     string
  category: string
  address:  string
  distance: string
  rating?:  string
  link:     string
  icon?:    string
}

interface CategoryResult {
  label:  string
  emoji:  string
  places: Place[]
}

// Foursquare v3 category IDs (v2 IDs like 10032 do not work in v3)
// Full list: https://location.foursquare.com/places/docs/categories
const CATEGORIES = [
  { label: 'Restaurants', emoji: '🍽', id: '13000' }, // Dining and Drinking (parent)
  { label: 'Attractions', emoji: '🏛', id: '16000' }, // Landmarks and Outdoors (parent)
  { label: 'Nightlife',   emoji: '🍸', id: '13002' }, // Bar — correct v3 ID (was 10032 v2)
  { label: 'Shopping',    emoji: '🛍', id: '17000' }, // Retail (parent)
]

export async function GET(req: NextRequest) {
  const key  = process.env.FOURSQUARE_API_KEY
  const city = req.nextUrl.searchParams.get('city')?.trim()

  if (!key) {
    console.error('[explore-city] FOURSQUARE_API_KEY is not set in environment variables')
    return NextResponse.json({ error: 'Places not configured' }, { status: 500 })
  }
  if (!city) return NextResponse.json({ error: 'City required' }, { status: 400 })

  console.log(`[explore-city] Fetching places for: ${city}`)

  try {
    // Use Foursquare's built-in 'near' parameter — handles geocoding internally.
    // This is more reliable than our own geocoding step and one fewer API call.
    const results = await Promise.allSettled(
      CATEGORIES.map(async cat => {
        const params = new URLSearchParams({
          near:       city,        // Foursquare geocodes the city name directly
          limit:      '6',
          sort:       'RELEVANCE', // Valid v3 sort: RELEVANCE | RATING | DISTANCE
          categories: cat.id,
        })

        const res  = await fetch(
          `https://api.foursquare.com/v3/places/search?${params}`,
          {
            headers: { Authorization: key, Accept: 'application/json' },
            signal:  AbortSignal.timeout(8000),
          }
        )
        if (!res.ok) {
          const errText = await res.text()
          console.error(`[explore-city] Foursquare ${cat.label} error ${res.status}:`, errText)
          return { ...cat, places: [] } as CategoryResult
        }

        const data = await res.json()
        const places: Place[] = (data.results ?? []).map((p: any) => ({
          id:       p.fsq_id,
          name:     p.name,
          category: p.categories?.[0]?.name ?? cat.label,
          address:  p.location?.formatted_address ?? p.location?.locality ?? '',
          distance: p.distance
            ? p.distance < 1000
              ? `${p.distance}m away`
              : `${(p.distance / 1000).toFixed(1)}km away`
            : '',
          rating:   p.rating ? `${p.rating.toFixed(1)}` : undefined,
          link:     `https://foursquare.com/v/${p.fsq_id}`,
          icon:     p.categories?.[0]?.icon
            ? `${p.categories[0].icon.prefix}64${p.categories[0].icon.suffix}`
            : undefined,
        }))

        return { label: cat.label, emoji: cat.emoji, places } as CategoryResult
      })
    )

    const categories: CategoryResult[] = results
      .filter((r): r is PromiseFulfilledResult<CategoryResult> => r.status === 'fulfilled')
      .map(r => r.value)
      .filter(c => c.places.length > 0)

    console.log(`[explore-city] ${city}: ${categories.length} categories, ${categories.reduce((s,c) => s + c.places.length, 0)} places`)

    if (categories.length === 0) {
      return NextResponse.json({ success: false, error: 'No places found for this city' }, { status: 200 })
    }

    return NextResponse.json({
      success: true,
      city,
      categories,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=3600' }, // cache 1hr
    })

  } catch (err: any) {
    console.error('[explore-city]', err.message)
    return NextResponse.json({ error: 'Failed to load places' }, { status: 500 })
  }
}