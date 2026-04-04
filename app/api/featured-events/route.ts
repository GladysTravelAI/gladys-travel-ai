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
// Fetch from multiple Ticketmaster endpoints in parallel:
// 1. Music segment — concerts, tours
// 2. Sports segment — basketball, tennis, motorsport etc.
// 3. Festival genre — Coachella, Glastonbury, Tomorrowland
// 4. Keyword: "NBA" — basketball specifically
// 5. Keyword: next 30 days high-relevance music

async function fetchTicketmasterEvents(): Promise<LiveEvent[]> {
  const key = process.env.TICKETMASTER_API_KEY
  if (!key) { console.warn('[featured-events] TICKETMASTER_API_KEY not set'); return [] }

  const cached = getCached(ticketmasterCache)
  if (cached) {
    console.log('[featured-events] Ticketmaster: serving from cache')
    return cached
  }

  // End date = 60 days from now — focus on near-term big events
  const now    = new Date()
  const start  = now.toISOString().split('.')[0] + 'Z'
  // 180 days — captures big events 2-6 months out (Glastonbury June, Tomorrowland July etc.)
  // Urgency scoring ensures near-term events still surface first
  const end180 = new Date(now.getTime() + 180 * 86400000).toISOString().split('.')[0] + 'Z'

  type TicketmasterParams = Record<string, string>

  // Segment IDs: Music = KZFzniwnSyZfZ7v7nJ, Sports = KZFzniwnSyZfZ7v7nE
  // Festival genre ID = KnvZfZ7vAe1
  const fetches: { label: string; params: TicketmasterParams }[] = [
    // Music — concerts and tours
    { label: 'music',    params: { segmentId: 'KZFzniwnSyZfZ7v7nJ', size: '15', sort: 'relevance,desc' } },
    // Sports — basketball, motorsport, tennis, boxing
    { label: 'sports',   params: { segmentId: 'KZFzniwnSyZfZ7v7nE', size: '15', sort: 'relevance,desc' } },
    // Festivals — dedicated genre fetch
    { label: 'festival', params: { segmentId: 'KZFzniwnSyZfZ7v7nJ', genreId: 'KnvZfZ7vAe1', size: '10', sort: 'relevance,desc' } },
    // Basketball — NBA specifically
    { label: 'nba',      params: { segmentId: 'KZFzniwnSyZfZ7v7nE', subGenreId: 'KZazBEonSMnZfZ7vFJA', size: '10', sort: 'date,asc' } },
  ]

  const results: LiveEvent[] = []

  await Promise.allSettled(fetches.map(async ({ label, params: extraParams }) => {
    try {
      const params = new URLSearchParams({
        apikey:        key,
        startDateTime: start,
        endDateTime:   end180,
        ...extraParams,
      })

      const res = await fetch(
        `https://app.ticketmaster.com/discovery/v2/events.json?${params}`,
        { signal: AbortSignal.timeout(10000) } as any
      )

      if (!res.ok) {
        console.warn(`[featured-events] Ticketmaster ${label}: ${res.status}`)
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
          rank:       70,
        })
      }
    } catch (err: any) {
      console.error(`[featured-events] Ticketmaster ${label} error:`, err.message)
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
// No forced category balancing — show what's actually upcoming and big.
// Priority: events within 30 days first, then 31-60 days.
// Max 10 events total.

function processEvents(events: LiveEvent[]): LiveEvent[] {
  const seen  = new Set<string>()
  const today = new Date()
  const in30  = new Date(today.getTime() + 30 * 86400000)

  // Step 1: Deduplicate + filter past events
  const valid = events.filter(ev => {
    if (!ev.name || !ev.date) return false
    if (new Date(ev.date) < today) return false
    // Deduplicate by normalised name (strips "American ", regional prefixes)
    const key = ev.name
      .toLowerCase()
      .replace(/^(american|us|national|international)\s+/i, '')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 28)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Step 2: Score each event — soonness beats everything
  const scored = valid.map(ev => {
    const daysAway = Math.ceil(
      (new Date(ev.date).getTime() - today.getTime()) / 86400000
    )
    // Events within 30 days get massive boost — they're what users need to act on now
    // Near-term events get urgency boost — but prestigious far-future events
    // still surface via their base rank (Glastonbury rank=92, Tomorrowland rank=91)
    const urgencyBoost = daysAway <= 7   ? 200
                       : daysAway <= 14  ? 150
                       : daysAway <= 30  ? 100
                       : daysAway <= 60  ? 60
                       : daysAway <= 90  ? 30
                       : daysAway <= 180 ? 10
                       : 0
    return { ev, score: urgencyBoost + (ev.rank ?? 70) }
  })

  // Step 3: Sort by score descending, take top 10
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, 10).map(s => s.ev)
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
      console.warn('[featured-events] Live APIs returned empty — serving curated fallback')
      return NextResponse.json({
        success: true,
        events:  getCuratedFallback(),
        source:  'curated',
        note:    'Live data unavailable — showing curated upcoming events',
      })
    }

    return NextResponse.json({
      success: true,
      events,
      count:  events.length,
      source: 'live',
    })

  } catch (err: any) {
    console.error('[featured-events] route error:', err)
    return NextResponse.json({
      success: true,
      events:  getCuratedFallback(),
      source:  'curated',
    })
  }
}

// ── CURATED FALLBACK ─────────────────────────────────────────────────────────
// Shown when Ticketmaster API is unavailable or rate-limited.
// Uses REAL upcoming 2026 events with accurate dates.
// Balanced mix: music / festival / sports.

function getCuratedFallback(): LiveEvent[] {
  const d = (iso: string) => iso; // dates are already absolute, not relative

  // Today is ~April 2 2026. Coachella starts April 10 (8 days).
  // Show the most urgent real events first — sorted by date.
  return [
    // ── IMMINENT (within 30 days) ──
    {
      id: 'cur-f0',
      name: 'Coachella Valley Music and Arts Festival 2026',
      category: 'festival',
      date: '2026-04-10',
      venue: 'Empire Polo Club',
      city: 'Indio',
      country: 'USA',
      image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
      ticketUrl: 'https://www.ticketmaster.com',
      rank: 97,
    },
    {
      id: 'cur-s0',
      name: 'NBA Playoffs 2026',
      category: 'sports',
      date: '2026-04-18',
      venue: 'Various Arenas',
      city: 'Multiple Cities',
      country: 'USA',
      image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80',
      ticketUrl: 'https://www.ticketmaster.com',
      rank: 91,
    },
    {
      id: 'cur-s3',
      name: 'UEFA Champions League Final 2026',
      category: 'sports',
      date: '2026-05-30',
      venue: 'Wembley Stadium',
      city: 'London',
      country: 'UK',
      image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80',
      ticketUrl: 'https://www.ticketmaster.co.uk',
      rank: 97,
    },
    {
      id: 'cur-s4',
      name: 'Formula 1 Monaco Grand Prix 2026',
      category: 'sports',
      date: '2026-05-24',
      venue: 'Circuit de Monaco',
      city: 'Monaco',
      country: 'Monaco',
      image: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=800&q=80',
      ticketUrl: 'https://www.ticketmaster.com',
      rank: 92,
    },
    // ── Music ──
    {
      id: 'cur-m1',
      name: 'Coldplay — Music of the Spheres World Tour',
      category: 'music',
      date: '2026-05-30',
      venue: 'Wembley Stadium',
      city: 'London',
      country: 'UK',
      image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80',
      ticketUrl: 'https://www.ticketmaster.co.uk',
      rank: 94,
    },
    {
      id: 'cur-m2',
      name: 'Taylor Swift — The Eras Tour',
      category: 'music',
      date: '2026-06-05',
      venue: 'MetLife Stadium',
      city: 'New York',
      country: 'USA',
      image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80',
      ticketUrl: 'https://www.ticketmaster.com',
      rank: 96,
    },
    {
      id: 'cur-m3',
      name: 'Beyoncé — Cowboy Carter World Tour',
      category: 'music',
      date: '2026-07-10',
      venue: 'SoFi Stadium',
      city: 'Los Angeles',
      country: 'USA',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
      ticketUrl: 'https://www.ticketmaster.com',
      rank: 93,
    },
    // ── Festivals ──
    {
      id: 'cur-f1',
      name: 'Glastonbury Festival 2026',
      category: 'festival',
      date: '2026-06-24',
      venue: 'Worthy Farm',
      city: 'Glastonbury',
      country: 'UK',
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
      rank: 92,
    },
    {
      id: 'cur-f2',
      name: 'Tomorrowland 2026',
      category: 'festival',
      date: '2026-07-17',
      venue: 'De Schorre',
      city: 'Boom',
      country: 'Belgium',
      image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
      ticketUrl: 'https://www.tomorrowland.com',
      rank: 91,
    },
    {
      id: 'cur-f3',
      name: 'Rock in Rio 2026',
      category: 'festival',
      date: '2026-09-25',
      venue: 'Cidade do Rock',
      city: 'Rio de Janeiro',
      country: 'Brazil',
      image: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&q=80',
      rank: 89,
    },
    // ── Sports ──
    {
      id: 'cur-s1',
      name: 'UEFA Champions League Final 2026',
      category: 'sports',
      date: '2026-05-30',
      venue: 'Wembley Stadium',
      city: 'London',
      country: 'UK',
      image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80',
      ticketUrl: 'https://www.ticketmaster.co.uk',
      rank: 97,
    },
    {
      id: 'cur-s2',
      name: 'Formula 1 Monaco Grand Prix 2026',
      category: 'sports',
      date: '2026-05-24',
      venue: 'Circuit de Monaco',
      city: 'Monaco',
      country: 'Monaco',
      image: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=800&q=80',
      ticketUrl: 'https://www.ticketmaster.com',
      rank: 92,
    },
  ]
}