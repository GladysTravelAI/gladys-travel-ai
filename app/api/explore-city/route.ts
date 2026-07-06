// app/api/explore-city/route.ts
import { NextRequest, NextResponse } from 'next/server'

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

const CATEGORIES = [
  { label: 'Restaurants', emoji: '🍽', id: '13000' },
  { label: 'Attractions', emoji: '🏛', id: '16000' },
  { label: 'Nightlife',   emoji: '🍸', id: '13003' }, // fixed: 13003 = Night Club in v3
  { label: 'Shopping',    emoji: '🛍', id: '17000' },
]

// Try multiple city name formats until one returns results
const cityVariants = (city: string): string[] => {
  const clean = city.trim()
  // If already has a comma (e.g. "Columbus, OH"), just use it + add USA
  if (clean.includes(',')) return [clean, `${clean}, USA`]
  // Otherwise try bare name, then common US format
  return [clean, `${clean}, USA`]
}

async function fetchCategory(
  key: string,
  near: string,
  cat: typeof CATEGORIES[0]
): Promise<CategoryResult> {
  const params = new URLSearchParams({
    near,
    limit:      '6',
    sort:       'RELEVANCE',
    categories: cat.id,
    fields:     'fsq_id,name,categories,location,distance,rating', // explicit fields
  })

  const res = await fetch(
    `https://api.foursquare.com/v3/places/search?${params}`,
    {
      headers: { Authorization: key, Accept: 'application/json' },
      signal:  AbortSignal.timeout(8000),
    }
  )

  if (!res.ok) {
    const errText = await res.text()
    console.error(`[explore-city] Foursquare ${cat.label} ${res.status}:`, errText)
    return { ...cat, places: [] }
  }

  const data = await res.json()
  console.log(`[explore-city] ${cat.label} raw count:`, data.results?.length ?? 0)

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

  return { label: cat.label, emoji: cat.emoji, places }
}

export async function GET(req: NextRequest) {
  const key  = process.env.FOURSQUARE_API_KEY
  const city = req.nextUrl.searchParams.get('city')?.trim()

  if (!key) {
    console.error('[explore-city] FOURSQUARE_API_KEY not set')
    return NextResponse.json({ error: 'Places not configured' }, { status: 500 })
  }
  if (!city) return NextResponse.json({ error: 'City required' }, { status: 400 })

  console.log(`[explore-city] Fetching places for: "${city}"`)

  const variants = cityVariants(city)
  
  for (const nearQuery of variants) {
    console.log(`[explore-city] Trying near="${nearQuery}"`)
    
    try {
      const results = await Promise.allSettled(
        CATEGORIES.map(cat => fetchCategory(key, nearQuery, cat))
      )

      const categories: CategoryResult[] = results
        .filter((r): r is PromiseFulfilledResult<CategoryResult> => r.status === 'fulfilled')
        .map(r => r.value)
        .filter(c => c.places.length > 0)

      console.log(`[explore-city] "${nearQuery}": ${categories.length} categories with results`)

      if (categories.length > 0) {
        return NextResponse.json({
          success: true,
          city,
          resolvedAs: nearQuery,
          categories,
        }, {
          headers: { 'Cache-Control': 'public, s-maxage=3600' },
        })
      }
      // No results with this variant — try next
    } catch (err: any) {
      console.error(`[explore-city] Error with "${nearQuery}":`, err.message)
    }
  }

  // All variants failed
  return NextResponse.json(
    { success: false, error: 'No places found for this city' },
    { status: 200 }
  )
}