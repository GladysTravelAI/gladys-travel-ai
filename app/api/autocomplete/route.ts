// app/api/autocomplete/route.ts
// Returns Ticketmaster event + attraction suggestions as user types.
// QUOTA PROTECTION: server-side cache (10min TTL) + minimum 3 chars.
// Without caching: typing a 20-char query = 40 API calls.
// With caching:    same query by any user = 1 API call per 10 minutes.
// Ticketmaster free tier: 5,000 req/day — this keeps us well within limits.

import { NextRequest, NextResponse } from 'next/server'

// Node runtime — module-level cache persists across requests on same instance
export const runtime = 'nodejs'

// ── Server-side in-memory cache ───────────────────────────────────────────────
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes per unique query
const queryCache = new Map<string, { data: any; expiresAt: number }>()

interface Suggestion {
  id:       string
  name:     string
  type:     'event' | 'attraction' | 'venue'
  category: 'sports' | 'music' | 'festival' | 'other'
  date?:    string
  venue?:   string
  city?:    string
  image?:   string
}

function mapCategory(ev: any): Suggestion['category'] {
  const seg   = ev.classifications?.[0]?.segment?.name?.toLowerCase() ?? ''
  const genre = ev.classifications?.[0]?.genre?.name?.toLowerCase() ?? ''
  if (seg.includes('sport'))           return 'sports'
  if (genre.includes('festival'))      return 'festival'
  if (seg.includes('music'))           return 'music'
  return 'other'
}

export async function GET(req: NextRequest) {
  const key = process.env.TICKETMASTER_API_KEY
  if (!key) return NextResponse.json({ suggestions: [] })

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 3) return NextResponse.json({ suggestions: [] })

  // ── Cache hit? ──────────────────────────────────────────────────────────────
  const cacheKey   = q.toLowerCase()
  const cached     = queryCache.get(cacheKey)
  if (cached && Date.now() < cached.expiresAt) {
    console.log(`[autocomplete] cache hit: "${q}"`)
    return NextResponse.json(cached.data, {
      headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=1200' }
    })
  }

  try {
    // Run events + attractions search in parallel — only fires on cache miss
    const [eventsRes, attractionsRes] = await Promise.allSettled([
      // Events: upcoming only, top 5
      fetch(
        `https://app.ticketmaster.com/discovery/v2/events.json?` +
        new URLSearchParams({
          apikey:        key,
          keyword:       q,
          size:          '5',
          sort:          'relevance,desc',
          startDateTime: new Date().toISOString().split('.')[0] + 'Z',
        }),
        { signal: AbortSignal.timeout(4000) } as any
      ),
      // Attractions: artists, teams, etc.
      fetch(
        `https://app.ticketmaster.com/discovery/v2/attractions.json?` +
        new URLSearchParams({
          apikey:  key,
          keyword: q,
          size:    '5',
        }),
        { signal: AbortSignal.timeout(4000) } as any
      ),
    ])

    const suggestions: Suggestion[] = []
    const seen = new Set<string>()

    // Parse events
    if (eventsRes.status === 'fulfilled' && eventsRes.value.ok) {
      const data   = await eventsRes.value.json()
      const events = data._embedded?.events ?? []
      for (const ev of events) {
        const name  = ev.name
        const venue = ev._embedded?.venues?.[0]
        const date  = ev.dates?.start?.localDate
        const image = ev.images?.find((i: any) => i.ratio === '16_9' && i.width > 300)?.url

        if (!name || seen.has(name.toLowerCase())) continue
        seen.add(name.toLowerCase())

        suggestions.push({
          id:       ev.id,
          name,
          type:     'event',
          category: mapCategory(ev),
          date,
          venue:    venue?.name,
          city:     venue?.city?.name,
          image,
        })
      }
    }

    // Parse attractions (artists, teams)
    if (attractionsRes.status === 'fulfilled' && attractionsRes.value.ok) {
      const data        = await attractionsRes.value.json()
      const attractions = data._embedded?.attractions ?? []
      for (const att of attractions) {
        const name  = att.name
        const image = att.images?.find((i: any) => i.ratio === '16_9' && i.width > 300)?.url

        if (!name || seen.has(name.toLowerCase())) continue
        seen.add(name.toLowerCase())

        const cat = mapCategory(att)
        suggestions.push({
          id:       att.id,
          name,
          type:     'attraction',
          category: cat,
          image,
        })
      }
    }

    const result = { suggestions: suggestions.slice(0, 8) }

    // Store in cache — same query won't hit Ticketmaster again for 10 minutes
    queryCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL })

    // Evict old entries if cache grows too large (memory safety)
    if (queryCache.size > 500) {
      const now = Date.now()
      for (const [k, v] of queryCache.entries()) {
        if (v.expiresAt < now) queryCache.delete(k)
      }
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=1200' }
    })

  } catch (err: any) {
    console.error('[autocomplete] error:', err.message)
    return NextResponse.json({ suggestions: [] })
  }
}