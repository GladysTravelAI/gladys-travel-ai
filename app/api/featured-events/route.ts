// app/api/featured-events/route.ts
// Fetches the world's BIGGEST upcoming events by targeting specific A-list
// attractions and major tournaments by name — not generic relevance sorting.

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

// ─── A-LIST TARGETS ───────────────────────────────────────────────────────────
// These are searched by keyword to guarantee the biggest names always appear
// when they have upcoming events on Ticketmaster.

const MUSIC_TARGETS = [
  { keyword: 'Beyonce',         rank: 99 },
  { keyword: 'Taylor Swift',    rank: 99 },
  { keyword: 'Coldplay',        rank: 97 },
  { keyword: 'Bad Bunny',       rank: 96 },
  { keyword: 'Drake',           rank: 95 },
  { keyword: 'Kendrick Lamar',  rank: 95 },
  { keyword: 'Billie Eilish',   rank: 94 },
  { keyword: 'The Weeknd',      rank: 94 },
  { keyword: 'Sabrina Carpenter', rank: 93 },
  { keyword: 'Olivia Rodrigo',  rank: 93 },
  { keyword: 'Coachella',       rank: 92 },
  { keyword: 'Glastonbury',     rank: 91 },
  { keyword: 'Lollapalooza',    rank: 90 },
  { keyword: 'Ultra Music Festival', rank: 89 },
]

const SPORTS_TARGETS = [
  { keyword: 'NBA Finals',              rank: 99 },
  { keyword: 'NFL',                     rank: 97 },
  { keyword: 'Champions League',        rank: 97 },
  { keyword: 'Formula 1',               rank: 96 },
  { keyword: 'Wimbledon',               rank: 95 },
  { keyword: 'Super Bowl',              rank: 99 },
  { keyword: 'Masters Golf',            rank: 93 },
  { keyword: 'UFC',                     rank: 94 },
  { keyword: 'WWE',                     rank: 91 },
  { keyword: 'Copa America',            rank: 93 },
  { keyword: 'Premier League',          rank: 90 },
  { keyword: 'Olympics',                rank: 98 },
]

// ─── FETCH SINGLE TICKETMASTER KEYWORD ───────────────────────────────────────

async function fetchByKeyword(
  key: string,
  keyword: string,
  rank: number,
  category: 'sports' | 'music' | 'festival'
): Promise<LiveEvent | null> {
  try {
    const params = new URLSearchParams({
      apikey:        key,
      keyword,
      size:          '1',
      sort:          'date,asc',
      startDateTime: new Date().toISOString().split('.')[0] + 'Z',
    })

    const res = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?${params}`,
      { signal: AbortSignal.timeout(6000), next: { revalidate: 3600 } } as any
    )

    if (!res.ok) return null
    const data   = await res.json()
    const ev     = data._embedded?.events?.[0]
    if (!ev) return null

    const venue    = ev._embedded?.venues?.[0]
    const date     = ev.dates?.start?.localDate
    const time     = ev.dates?.start?.localTime
    const image    = ev.images?.find((i: any) => i.ratio === '16_9' && i.width > 500)?.url
                  ?? ev.images?.find((i: any) => i.width > 300)?.url
    const priceMin = ev.priceRanges?.[0]?.min

    if (!date) return null

    return {
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
      priceMin:   priceMin ? Math.round(priceMin) : undefined,
      currency:   ev.priceRanges?.[0]?.currency,
      attraction: ev._embedded?.attractions?.[0]?.name ?? keyword,
      rank,
    }
  } catch {
    return null
  }
}

// ─── API-FOOTBALL top fixtures ────────────────────────────────────────────────

async function fetchFootballFeatured(): Promise<LiveEvent[]> {
  const key = process.env.API_FOOTBALL_KEY
  if (!key) return []

  try {
    // Champions League + EPL only for featured
    const results: LiveEvent[] = []
    await Promise.all([2, 39].map(async leagueId => {
      const res = await fetch(
        `https://v3.football.api-sports.io/fixtures?league=${leagueId}&next=2&season=2024`,
        { headers: { 'x-apisports-key': key }, signal: AbortSignal.timeout(6000) }
      )
      if (!res.ok) return
      const data = await res.json()
      for (const f of data.response ?? []) {
        const matchDate = new Date(f.fixture.date)
        results.push({
          id:         `football-${f.fixture.id}`,
          name:       `${f.teams.home.name} vs ${f.teams.away.name}`,
          category:   'sports',
          date:       matchDate.toISOString().split('T')[0],
          time:       matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
          venue:      f.fixture.venue?.name ?? 'TBC',
          city:       f.fixture.venue?.city ?? '',
          country:    '',
          image:      f.league.logo,
          ticketUrl:  undefined,
          attraction: f.league.name,
          rank:       leagueId === 2 ? 95 : 85,
        })
      }
    }))
    return results
  } catch {
    return []
  }
}

// ─── ROUTE ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const key = process.env.TICKETMASTER_API_KEY

  if (!key) {
    return NextResponse.json({ success: true, events: getFallbackEvents(), source: 'fallback' })
  }

  try {
    // Stagger requests to stay under Ticketmaster rate limit (5 req/sec)
    // Batch in groups of 4 with 300ms delay between batches

    const allTargets = [
      ...MUSIC_TARGETS.map(t => ({ ...t, category: 'music' as const })),
      ...SPORTS_TARGETS.map(t => ({ ...t, category: 'sports' as const })),
    ]

    const results: LiveEvent[] = []
    const batchSize = 4

    for (let i = 0; i < Math.min(allTargets.length, 20); i += batchSize) {
      const batch = allTargets.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(t => fetchByKeyword(key, t.keyword, t.rank, t.category))
      )
      results.push(...batchResults.filter(Boolean) as LiveEvent[])
      if (i + batchSize < allTargets.length) {
        await new Promise(r => setTimeout(r, 300))
      }
    }

    // Add football fixtures
    const footballEvents = await fetchFootballFeatured()
    results.push(...footballEvents)

    // Deduplicate, sort by rank desc then date asc, take top 16
    const seen = new Set<string>()
    const final = results
      .filter(ev => {
        if (!ev.name || !ev.date) return false
        // Only future events
        if (new Date(ev.date) < new Date()) return false
        const key = ev.name.toLowerCase().slice(0, 40)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .sort((a, b) => {
        // Sort by rank desc, then date asc
        const rankDiff = (b.rank ?? 0) - (a.rank ?? 0)
        if (rankDiff !== 0) return rankDiff
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })
      .slice(0, 16)

    if (final.length === 0) {
      return NextResponse.json({ success: true, events: getFallbackEvents(), source: 'fallback' })
    }

    return NextResponse.json({ success: true, events: final, count: final.length })

  } catch (err: any) {
    console.error('[featured-events] error:', err)
    return NextResponse.json({ success: true, events: getFallbackEvents(), source: 'fallback' })
  }
}

// ─── FALLBACK ─────────────────────────────────────────────────────────────────

function getFallbackEvents(): LiveEvent[] {
  const d = (n: number) => {
    const dt = new Date(); dt.setDate(dt.getDate() + n)
    return dt.toISOString().split('T')[0]
  }
  return [
    { id: 'f1', name: 'Beyoncé — Cowboy Carter World Tour',         category: 'music',   date: d(20),  venue: 'SoFi Stadium',      city: 'Los Angeles',   country: 'USA',    rank: 99, image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800', ticketUrl: 'https://www.ticketmaster.com' },
    { id: 'f2', name: 'Taylor Swift — The Eras Tour',               category: 'music',   date: d(25),  venue: 'MetLife Stadium',   city: 'New York',      country: 'USA',    rank: 99, image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800', ticketUrl: 'https://www.ticketmaster.com' },
    { id: 'f3', name: 'North America 2026 Football Championship',   category: 'sports',  date: d(88),  venue: 'MetLife Stadium',   city: 'New York',      country: 'USA',    rank: 99, image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800', ticketUrl: 'https://www.ticketmaster.com' },
    { id: 'f4', name: 'NBA Finals 2026',                            category: 'sports',  date: d(60),  venue: 'Chase Center',      city: 'San Francisco', country: 'USA',    rank: 98, image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800', ticketUrl: 'https://www.ticketmaster.com' },
    { id: 'f5', name: 'Coldplay — Music of the Spheres World Tour', category: 'music',   date: d(30),  venue: 'Wembley Stadium',   city: 'London',        country: 'UK',     rank: 97, image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800', ticketUrl: 'https://www.ticketmaster.com' },
    { id: 'f6', name: 'Formula 1 Monaco Grand Prix 2026',           category: 'sports',  date: d(70),  venue: 'Circuit de Monaco', city: 'Monaco',        country: 'Monaco', rank: 96, image: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=800', ticketUrl: 'https://www.ticketmaster.com' },
    { id: 'f7', name: 'Coachella Valley Music & Arts Festival',     category: 'festival',date: d(35),  venue: 'Empire Polo Club',  city: 'Indio',         country: 'USA',    rank: 92, image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800', ticketUrl: 'https://www.ticketmaster.com' },
    { id: 'f8', name: 'Champions League Final 2026',                category: 'sports',  date: d(75),  venue: 'Wembley Stadium',   city: 'London',        country: 'UK',     rank: 95, image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800', ticketUrl: 'https://www.ticketmaster.co.uk' },
  ]
}