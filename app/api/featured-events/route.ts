// app/api/featured-events/route.ts
// Real-time football + Ticketmaster events
// Football: World Cup 2026, UCL, EPL, La Liga, Bundesliga, Serie A, Ligue 1, MLS, NWSL, Women's UCL
// Ticketmaster: sports + music segments (2 requests only)

import { NextRequest, NextResponse } from 'next/server'

interface LiveEvent {
  id:          string
  name:        string
  category:    'sports' | 'music' | 'festival' | 'other'
  date:        string
  time?:       string
  venue:       string
  city:        string
  country:     string
  image?:      string
  ticketUrl?:  string
  priceMin?:   number
  currency?:   string
  attraction?: string
  rank?:       number
}

// ── FOOTBALL LEAGUES ───────────────────────────────────────────────────────────
// ── SERVER-SIDE CACHE ─────────────────────────────────────────────────────────
// Football API: 100 req/day free tier — cache results for 1 hour
// Ticketmaster: cache for 2 hours — events don't change minute-to-minute

interface CacheEntry<T> {
  data:      T;
  expiresAt: number;
}

const footballCache: { current: CacheEntry<LiveEvent[]> | null } = { current: null }
const ticketmasterCache: { current: CacheEntry<LiveEvent[]> | null } = { current: null }

const FOOTBALL_TTL    = 60 * 60 * 1000  // 1 hour  — saves ~19 req/hour
const TICKETMASTER_TTL = 2 * 60 * 60 * 1000 // 2 hours — saves ~10 req/hr

function getCached<T>(cache: { current: CacheEntry<T> | null }): T | null {
  if (cache.current && Date.now() < cache.current.expiresAt) {
    return cache.current.data
  }
  return null
}

function setCached<T>(cache: { current: CacheEntry<T> | null }, data: T, ttl: number) {
  cache.current = { data, expiresAt: Date.now() + ttl }
}

// API-Football free plan: 100 requests/day
// We batch smartly — one request per league, all run in parallel

// Reduced to 8 leagues — saves API quota (was 19 = 19 req, now 8 = 8 req per cache miss)
// Results cached for 1 hour so this only fires ~24x/day maximum
// Seasons: European leagues run Aug-May. 2025 = the 2025/26 season (current as of Mar 2026)
const FOOTBALL_LEAGUES = [
  // ── Tier 1: Global tournaments ──
  { id: 1,   name: 'FIFA World Cup 2026',      season: 2026, rank: 99, fixtures: 5 },
  { id: 2,   name: 'UEFA Champions League',    season: 2025, rank: 97, fixtures: 4 },

  // ── Top 5 European leagues (2025/26 season) ──
  { id: 39,  name: 'Premier League',           season: 2025, rank: 93, fixtures: 3 },
  { id: 140, name: 'La Liga',                  season: 2025, rank: 91, fixtures: 3 },
  { id: 78,  name: 'Bundesliga',               season: 2025, rank: 90, fixtures: 3 },
  { id: 135, name: 'Serie A',                  season: 2025, rank: 89, fixtures: 3 },
  { id: 61,  name: 'Ligue 1',                  season: 2025, rank: 87, fixtures: 2 },

  // ── Women's football ──
  { id: 21,  name: "Women's Champions League", season: 2025, rank: 85, fixtures: 3 },
]

// ── FETCH FOOTBALL ─────────────────────────────────────────────────────────────

async function fetchFootballEvents(): Promise<LiveEvent[]> {
  const key = process.env.API_FOOTBALL_KEY
  if (!key) { console.warn('[featured-events] API_FOOTBALL_KEY not set'); return [] }

  // Return cached data if still fresh — saves 19 API requests per hour
  const cached = getCached(footballCache)
  if (cached) {
    console.log('[featured-events] Football: serving from cache')
    return cached
  }

  const results: LiveEvent[] = []
  const errors: string[]     = []

  // Run all leagues in parallel — API-Football allows it
  await Promise.allSettled(
    FOOTBALL_LEAGUES.map(async league => {
      try {
        const params = new URLSearchParams({
          league: String(league.id),
          season: String(league.season),
          next:   String(league.fixtures),
          // Note: don't combine 'next' with 'status' — API-Football doesn't support it
        })

        const res = await fetch(
          `https://v3.football.api-sports.io/fixtures?${params}`,
          {
            headers: { 'x-apisports-key': key },
            signal:  AbortSignal.timeout(12000),
          }
        )

        if (!res.ok) {
          errors.push(`${league.name}: ${res.status}`)
          return
        }

        const data = await res.json()

        // Check for API errors (quota, auth, etc.)
        if (data.errors && Object.keys(data.errors).length > 0) {
          const errMsg = JSON.stringify(data.errors)
          console.warn(`[featured-events] Football API error (${league.name}): ${errMsg}`)
          return
        }

        // Log result count per league for debugging
        const count = (data.response ?? []).length
        if (count > 0) {
          console.log(`[featured-events] ${league.name}: ${count} fixtures`)
        }

        const fixtures = data.response ?? []

        for (const f of fixtures) {
          const matchDate = new Date(f.fixture.date)
          // Skip past matches
          if (matchDate < new Date()) continue

          const home = f.teams?.home?.name ?? 'Home'
          const away = f.teams?.away?.name ?? 'Away'

          // Use team logos if available, fall back to league logo
          const image = f.teams?.home?.logo || f.league?.logo || undefined

          results.push({
            id:         `football-${f.fixture.id}`,
            name:       `${home} vs ${away}`,
            category:   'sports',
            date:       matchDate.toISOString().split('T')[0],
            time:       matchDate.toLocaleTimeString('en-US', {
                          hour: '2-digit', minute: '2-digit', hour12: false,
                          timeZone: 'UTC',
                        }),
            venue:      f.fixture.venue?.name ?? 'TBC',
            city:       f.fixture.venue?.city ?? '',
            country:    f.league?.country ?? '',
            image,
            ticketUrl:  undefined, // API-Football doesn't provide ticket URLs
            attraction: league.name,
            rank:       league.rank,
          })
        }
      } catch (err: any) {
        errors.push(`${league.name}: ${err.message}`)
      }
    })
  )

  if (errors.length > 0) {
    console.warn(`[featured-events] Football fetch errors (${errors.length}):`, errors.slice(0, 5))
  }

  console.log(`[featured-events] Football: ${results.length} fixtures from ${FOOTBALL_LEAGUES.length} leagues`)

  // Store in cache for 1 hour
  if (results.length > 0) {
    setCached(footballCache, results, FOOTBALL_TTL)
    console.log('[featured-events] Football: results cached for 1 hour')
  }

  return results
}

// ── FETCH TICKETMASTER ─────────────────────────────────────────────────────────
// Only 2 requests — sports segment + music segment

async function fetchTicketmasterEvents(): Promise<LiveEvent[]> {
  const key = process.env.TICKETMASTER_API_KEY
  if (!key) { console.warn('[featured-events] TICKETMASTER_API_KEY not set'); return [] }

  // Return cached data if still fresh
  const cached = getCached(ticketmasterCache)
  if (cached) {
    console.log('[featured-events] Ticketmaster: serving from cache')
    return cached
  }

  const segments = [
    { id: 'KZFzniwnSyZfZ7v7nE', label: 'sports',   rank: 75 },  // Sports segment
    { id: 'KZFzniwnSyZfZ7v7nJ', label: 'music',    rank: 75 },  // Music segment
    // Festivals: use music segment + festival genre filter
    // Ticketmaster festival genre ID: KnvZfZ7vAe1
  ]

  const results: LiveEvent[] = []

  await Promise.allSettled(segments.map(async seg => {
    try {
      const params = new URLSearchParams({
        apikey:        key,
        segmentId:     seg.id,
        size:          '20',
        sort:          'relevance,desc',
        startDateTime: new Date().toISOString().split('.')[0] + 'Z',
      })

      const res = await fetch(
        `https://app.ticketmaster.com/discovery/v2/events.json?${params}`,
        { signal: AbortSignal.timeout(10000) } as any
      )

      if (!res.ok) {
        console.warn(`[featured-events] Ticketmaster ${seg.label}: ${res.status}`)
        return
      }

      const data   = await res.json()
      const events = data._embedded?.events ?? []

      for (const ev of events) {
        const venue    = ev._embedded?.venues?.[0]
        const date     = ev.dates?.start?.localDate
        const time     = ev.dates?.start?.localTime
        if (!date) continue

        const image = ev.images?.find((i: any) => i.ratio === '16_9' && i.width > 500)?.url
                   ?? ev.images?.find((i: any) => i.width > 300)?.url

        const segName   = ev.classifications?.[0]?.segment?.name?.toLowerCase() ?? ''
        const genreName = ev.classifications?.[0]?.genre?.name?.toLowerCase() ?? ''
        const evName = (ev.name ?? '').toLowerCase()
        const subGenre = (ev.classifications?.[0]?.subGenre?.name ?? '').toLowerCase()
        // Festival detection: check genre, subGenre AND event name keywords
        const festKeywords = ['festival', 'fest ', ' fest', 'carnival', 'lollapalooza',
          'tomorrowland', 'glastonbury', 'bonnaroo', 'coachella', 'burning man',
          'rock in rio', 'outside lands', 'primavera', 'governors ball',
          'pitchfork', 'ultra music', 'electric daisy']
        const isFestival = genreName.includes('festival') ||
          subGenre.includes('festival') ||
          festKeywords.some(k => evName.includes(k))

        let category: LiveEvent['category'] = 'other'
        if (segName.includes('sport'))  category = 'sports'
        else if (isFestival)            category = 'festival'
        else if (segName.includes('music')) category = 'music'

        results.push({
          id:         ev.id,
          name:       ev.name,
          category,
          date,
          time:       time?.slice(0, 5),
          venue:      venue?.name ?? '',
          city:       venue?.city?.name ?? '',
          country:    venue?.country?.name ?? '',
          image,
          ticketUrl:  ev.url,
          priceMin:   ev.priceRanges?.[0]?.min ? Math.round(ev.priceRanges[0].min) : undefined,
          currency:   ev.priceRanges?.[0]?.currency,
          attraction: ev._embedded?.attractions?.[0]?.name,
          rank:       seg.rank,
        })
      }
    } catch (err: any) {
      console.error(`[featured-events] Ticketmaster ${seg.label} error:`, err.message)
    }
  }))

  // Store in cache for 10 minutes
  if (results.length > 0) {
    setCached(ticketmasterCache, results, TICKETMASTER_TTL)
    console.log('[featured-events] Ticketmaster: results cached for 2 hours')
  }

  return results
}

// ── DEDUPLICATE & SORT ─────────────────────────────────────────────────────────

function processEvents(events: LiveEvent[]): LiveEvent[] {
  const seen  = new Set<string>()
  const today = new Date()

  // Step 1: Filter and deduplicate
  const valid = events.filter(ev => {
    if (!ev.name || !ev.date) return false
    if (new Date(ev.date) < today) return false
    const key = ev.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Step 2: Sort by date (soonest first) within each category
  valid.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Step 3: Category-balanced selection — max 40% any single category
  // Target mix out of 20 results: ~7 sports, ~7 music, ~4 festival, ~2 other
  const buckets: Record<string, LiveEvent[]> = {
    sports: [], music: [], festival: [], other: []
  }
  for (const ev of valid) {
    const cat = ev.category ?? 'other'
    buckets[cat].push(ev)
  }

  const result: LiveEvent[] = []
  const TOTAL = 20
  const CAPS  = { sports: 8, music: 8, festival: 6, other: 4 }

  // Interleave: take one from each non-empty bucket in rotation until TOTAL
  const order: Array<keyof typeof CAPS> = ['music', 'sports', 'festival', 'sports', 'music', 'festival', 'other']
  const taken: Record<string, number>   = { sports: 0, music: 0, festival: 0, other: 0 }
  let   round = 0

  while (result.length < TOTAL) {
    const cat    = order[round % order.length] as string
    const bucket = buckets[cat]
    if (bucket.length > 0 && taken[cat] < CAPS[cat as keyof typeof CAPS]) {
      result.push(bucket.shift()!)
      taken[cat]++
    }
    round++
    // Safety: if all buckets empty, break
    if (Object.values(buckets).every(b => b.length === 0)) break
  }

  return result
}

// ── ROUTE ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    // Football disabled on free plan (seasons 2025/2026 require paid subscription)
    // Re-enable by uncommenting fetchFootballEvents() once upgraded to Pro plan
    const [tmResult] = await Promise.allSettled([
      fetchTicketmasterEvents(),
      // fetchFootballEvents(), // ← uncomment after upgrading API-Football plan
    ])

    const all = [
      ...(tmResult.status === 'fulfilled' ? tmResult.value : []),
    ]

    const events = processEvents(all)

    if (events.length === 0) {
      console.warn('[featured-events] All APIs returned empty')
      // Return empty — no hardcoded fallback. UI handles empty state gracefully.
      return NextResponse.json({ success: true, events: [], source: 'empty' })
    }

    return NextResponse.json({
      success: true,
      events,
      count:  events.length,
      source: 'live',
    })

  } catch (err: any) {
    console.error('[featured-events] route error:', err)
    // On error return empty — never show fake hardcoded events to real users
    return NextResponse.json({ success: true, events: [], source: 'error' })
  }
}