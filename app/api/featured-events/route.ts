// app/api/featured-events/route.ts
// Fetches real events from Ticketmaster using segment IDs (2 requests only — no rate limiting)
// + API-Football for top football fixtures (2 requests)

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

// ── TICKETMASTER — only 2 requests, no rate limit risk ────────────────────────

async function fetchTicketmasterEvents(): Promise<LiveEvent[]> {
  const key = process.env.TICKETMASTER_API_KEY
  if (!key) { console.warn('[featured-events] TICKETMASTER_API_KEY not set'); return [] }

  try {
    const segments = [
      { id: 'KZFzniwnSyZfZ7v7nE', label: 'sports', rank: 80 },
      { id: 'KZFzniwnSyZfZ7v7nJ', label: 'music',  rank: 75 },
    ]

    const results: LiveEvent[] = []

    await Promise.all(segments.map(async seg => {
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
        console.warn(`[featured-events] Ticketmaster ${seg.label} failed: ${res.status}`)
        return
      }

      const data   = await res.json()
      const events = data._embedded?.events ?? []

      for (const ev of events) {
        const venue    = ev._embedded?.venues?.[0]
        const date     = ev.dates?.start?.localDate
        const time     = ev.dates?.start?.localTime
        const image    = ev.images?.find((i: any) => i.ratio === '16_9' && i.width > 500)?.url
                      ?? ev.images?.find((i: any) => i.width > 300)?.url
        const priceMin = ev.priceRanges?.[0]?.min
        if (!date) continue

        const segName   = ev.classifications?.[0]?.segment?.name?.toLowerCase() ?? ''
        const genreName = ev.classifications?.[0]?.genre?.name?.toLowerCase() ?? ''
        let category: LiveEvent['category'] = 'other'
        if (segName.includes('sport'))           category = 'sports'
        else if (genreName.includes('festival')) category = 'festival'
        else if (segName.includes('music'))      category = 'music'

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
          priceMin:   priceMin ? Math.round(priceMin) : undefined,
          currency:   ev.priceRanges?.[0]?.currency,
          attraction: ev._embedded?.attractions?.[0]?.name,
          rank:       seg.rank,
        })
      }
    }))

    return results
  } catch (err) {
    console.error('[featured-events] Ticketmaster error:', err)
    return []
  }
}

// ── API-FOOTBALL — top upcoming fixtures (2 requests) ─────────────────────────

async function fetchFootballEvents(): Promise<LiveEvent[]> {
  const key = process.env.API_FOOTBALL_KEY
  if (!key) return []

  try {
    const results: LiveEvent[] = []
    await Promise.all([2, 39].map(async leagueId => {
      const res = await fetch(
        `https://v3.football.api-sports.io/fixtures?league=${leagueId}&next=3&season=2024`,
        { headers: { 'x-apisports-key': key }, signal: AbortSignal.timeout(8000) }
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
          rank:       leagueId === 2 ? 90 : 82,
        })
      }
    }))
    return results
  } catch (err) {
    console.error('[featured-events] API-Football error:', err)
    return []
  }
}

// ── DEDUPLICATE & SORT ────────────────────────────────────────────────────────

function deduplicateAndSort(events: LiveEvent[]): LiveEvent[] {
  const seen = new Set<string>()
  return events
    .filter(ev => {
      if (!ev.name || !ev.date) return false
      if (new Date(ev.date) < new Date()) return false
      const key = ev.name.toLowerCase().slice(0, 35)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => {
      const rankDiff = (b.rank ?? 0) - (a.rank ?? 0)
      if (rankDiff !== 0) return rankDiff
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })
    .slice(0, 16)
}

// ── ROUTE ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const [tmResult, fbResult] = await Promise.allSettled([
      fetchTicketmasterEvents(),
      fetchFootballEvents(),
    ])

    const all = [
      ...(tmResult.status === 'fulfilled' ? tmResult.value : []),
      ...(fbResult.status === 'fulfilled' ? fbResult.value : []),
    ]

    const events = deduplicateAndSort(all)

    if (events.length === 0) {
      return NextResponse.json({ success: true, events: getFallbackEvents(), source: 'fallback' })
    }

    return NextResponse.json({ success: true, events, count: events.length })

  } catch (err: any) {
    console.error('[featured-events] route error:', err)
    return NextResponse.json({ success: true, events: getFallbackEvents(), source: 'fallback' })
  }
}

// ── FALLBACK (shown if all APIs fail) ─────────────────────────────────────────

function getFallbackEvents(): LiveEvent[] {
  const d = (n: number) => {
    const dt = new Date(); dt.setDate(dt.getDate() + n)
    return dt.toISOString().split('T')[0]
  }
  return [
    { id: 'f1', name: 'North America 2026 Football Championship', category: 'sports',   date: d(87),  venue: 'MetLife Stadium',    city: 'New York',     country: 'USA',    rank: 99, ticketUrl: 'https://www.ticketmaster.com',    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800' },
    { id: 'f2', name: 'UEFA Champions League Final 2026',         category: 'sports',   date: d(74),  venue: 'Wembley Stadium',    city: 'London',       country: 'UK',     rank: 95, ticketUrl: 'https://www.ticketmaster.co.uk', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800' },
    { id: 'f3', name: 'Coachella Valley Music & Arts Festival',   category: 'festival', date: d(30),  venue: 'Empire Polo Club',   city: 'Indio',        country: 'USA',    rank: 91, ticketUrl: 'https://www.ticketmaster.com',    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800' },
    { id: 'f4', name: 'NBA Finals 2026',                          category: 'sports',   date: d(55),  venue: 'Chase Center',       city: 'San Francisco',country: 'USA',    rank: 90, ticketUrl: 'https://www.ticketmaster.com',    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800' },
    { id: 'f5', name: 'Glastonbury Festival 2026',                category: 'festival', date: d(100), venue: 'Worthy Farm',        city: 'Glastonbury',  country: 'UK',     rank: 88, ticketUrl: 'https://glastonbury.seetickets.com', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800' },
    { id: 'f6', name: 'Formula 1 Monaco Grand Prix 2026',         category: 'sports',   date: d(70),  venue: 'Circuit de Monaco',  city: 'Monaco',       country: 'Monaco', rank: 92, ticketUrl: 'https://www.ticketmaster.com',    image: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=800' },
    { id: 'f7', name: 'Coldplay — Music of the Spheres World Tour',category: 'music',   date: d(25),  venue: 'Wembley Stadium',    city: 'London',       country: 'UK',     rank: 94, ticketUrl: 'https://www.ticketmaster.co.uk', image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800' },
    { id: 'f8', name: 'Taylor Swift — The Eras Tour',             category: 'music',    date: d(40),  venue: 'MetLife Stadium',    city: 'New York',     country: 'USA',    rank: 99, ticketUrl: 'https://www.ticketmaster.com',    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800' },
  ]
}