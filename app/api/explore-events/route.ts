// app/api/explore-events/route.ts
// Powers the /events page — Ticketmaster discovery + API-Football search
// If keyword looks like football (team name, league, "UCL", "EPL" etc.) → also searches football

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

// ── HELPERS ────────────────────────────────────────────────────────────────────

function mapCategory(ev: any): 'sports' | 'music' | 'festival' | 'other' {
  const seg   = ev.classifications?.[0]?.segment?.name?.toLowerCase() ?? ''
  const genre = ev.classifications?.[0]?.genre?.name?.toLowerCase() ?? ''
  if (seg.includes('sport'))           return 'sports'
  if (genre.includes('festival'))      return 'festival'
  if (seg.includes('music'))           return 'music'
  return 'other'
}

function parseTicketmasterEvent(ev: any): LiveEvent | null {
  const venue = ev._embedded?.venues?.[0]
  const date  = ev.dates?.start?.localDate
  const time  = ev.dates?.start?.localTime
  if (!date) return null

  const image = ev.images?.find((i: any) => i.ratio === '16_9' && i.width > 500)?.url
             ?? ev.images?.find((i: any) => i.width > 300)?.url

  return {
    id:         ev.id,
    name:       ev.name,
    category:   mapCategory(ev),
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
  }
}

// ── FOOTBALL KEYWORD DETECTION ─────────────────────────────────────────────────
// Detect if the search is likely football-related

const FOOTBALL_KEYWORDS = [
  'football', 'soccer', 'world cup', 'ucl', 'epl', 'premier league',
  'la liga', 'bundesliga', 'serie a', 'ligue 1', 'champions league',
  'europa league', 'mls', 'nwsl', 'copa', 'fifa', 'uefa', 'league',
  'fc', 'united', 'city', 'real madrid', 'barcelona', 'arsenal',
  'liverpool', 'chelsea', 'manchester', 'juventus', 'milan', 'psg',
  'bayern', 'dortmund', 'atletico', 'inter', 'napoli', 'ajax',
  'benfica', 'porto', 'celtic', 'rangers', 'sporting',
]

function isFootballSearch(keyword: string): boolean {
  const k = keyword.toLowerCase()
  return FOOTBALL_KEYWORDS.some(w => k.includes(w))
}

// All leagues to search when football keyword detected
const ALL_FOOTBALL_LEAGUES = [
  { id: 1,   season: 2026 }, // World Cup 2026
  { id: 2,   season: 2024 }, // UCL
  { id: 3,   season: 2024 }, // Europa League
  { id: 39,  season: 2024 }, // Premier League
  { id: 140, season: 2024 }, // La Liga
  { id: 78,  season: 2024 }, // Bundesliga
  { id: 135, season: 2024 }, // Serie A
  { id: 61,  season: 2024 }, // Ligue 1
  { id: 253, season: 2025 }, // MLS
  { id: 21,  season: 2024 }, // Women's Champions League
  { id: 254, season: 2025 }, // NWSL
  { id: 57,  season: 2024 }, // WSL
]

// Segment IDs for Ticketmaster category filtering
const SEGMENT_IDS: Record<string, string> = {
  music:    'KZFzniwnSyZfZ7v7nJ',
  sports:   'KZFzniwnSyZfZ7v7nE',
  festival: 'KZFzniwnSyZfZ7v7nJ',
  arts:     'KZFzniwnSyZfZ7v7na',
}

// ── FOOTBALL TEAM/LEAGUE SEARCH ────────────────────────────────────────────────

async function searchFootball(keyword: string, fbKey: string): Promise<LiveEvent[]> {
  const results: LiveEvent[] = []
  const k = keyword.toLowerCase()

  // First: try to find fixtures by team name
  try {
    const teamRes = await fetch(
      `https://v3.football.api-sports.io/teams?search=${encodeURIComponent(keyword)}`,
      { headers: { 'x-apisports-key': fbKey }, signal: AbortSignal.timeout(8000) }
    )
    if (teamRes.ok) {
      const teamData = await teamRes.json()
      const teams = (teamData.response ?? []).slice(0, 3) // top 3 matching teams

      // Fetch next fixtures for each matching team
      await Promise.allSettled(teams.map(async (t: any) => {
        const teamId = t.team?.id
        if (!teamId) return

        const fixRes = await fetch(
          `https://v3.football.api-sports.io/fixtures?team=${teamId}&next=5&status=NS`,
          { headers: { 'x-apisports-key': fbKey }, signal: AbortSignal.timeout(8000) }
        )
        if (!fixRes.ok) return
        const fixData = await fixRes.json()

        for (const f of fixData.response ?? []) {
          const matchDate = new Date(f.fixture.date)
          if (matchDate < new Date()) continue
          results.push({
            id:         `football-${f.fixture.id}`,
            name:       `${f.teams.home.name} vs ${f.teams.away.name}`,
            category:   'sports',
            date:       matchDate.toISOString().split('T')[0],
            time:       matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }),
            venue:      f.fixture.venue?.name ?? 'TBC',
            city:       f.fixture.venue?.city ?? '',
            country:    f.league?.country ?? '',
            image:      f.teams.home.logo || f.league?.logo,
            attraction: f.league?.name,
            rank:       75,
          })
        }
      }))
    }
  } catch {}

  // Second: search by league if keyword matches a league name
  const leagueMatch = ALL_FOOTBALL_LEAGUES.find(l => {
    if (k.includes('world cup') || k.includes('fifa'))     return l.id === 1
    if (k.includes('ucl') || k.includes('champions'))      return l.id === 2
    if (k.includes('europa'))                               return l.id === 3
    if (k.includes('premier') || k.includes('epl'))        return l.id === 39
    if (k.includes('la liga') || k.includes('laliga'))     return l.id === 140
    if (k.includes('bundesliga'))                           return l.id === 78
    if (k.includes('serie a') || k.includes('seriea'))     return l.id === 135
    if (k.includes('ligue 1') || k.includes('ligue1'))     return l.id === 61
    if (k.includes('mls'))                                  return l.id === 253
    if (k.includes('nwsl'))                                 return l.id === 254
    if (k.includes('wsl') || k.includes("women's super"))  return l.id === 57
    return false
  })

  if (leagueMatch) {
    try {
      const res = await fetch(
        `https://v3.football.api-sports.io/fixtures?league=${leagueMatch.id}&season=${leagueMatch.season}&next=10&status=NS`,
        { headers: { 'x-apisports-key': fbKey }, signal: AbortSignal.timeout(8000) }
      )
      if (res.ok) {
        const data = await res.json()
        for (const f of data.response ?? []) {
          const matchDate = new Date(f.fixture.date)
          if (matchDate < new Date()) continue
          results.push({
            id:         `football-${f.fixture.id}`,
            name:       `${f.teams.home.name} vs ${f.teams.away.name}`,
            category:   'sports',
            date:       matchDate.toISOString().split('T')[0],
            time:       matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }),
            venue:      f.fixture.venue?.name ?? 'TBC',
            city:       f.fixture.venue?.city ?? '',
            country:    f.league?.country ?? '',
            image:      f.teams.home.logo || f.league?.logo,
            attraction: f.league?.name,
            rank:       80,
          })
        }
      }
    } catch {}
  }

  // Deduplicate
  const seen = new Set<string>()
  return results.filter(ev => {
    if (seen.has(ev.id)) return false
    seen.add(ev.id)
    return true
  })
}

// ── ROUTE ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const tmKey = process.env.TICKETMASTER_API_KEY
  const fbKey = process.env.API_FOOTBALL_KEY

  if (!tmKey) {
    return NextResponse.json({ success: false, events: [], total: 0, error: 'API not configured' })
  }

  const { searchParams } = req.nextUrl
  const keyword  = searchParams.get('keyword')  ?? ''
  const category = searchParams.get('category') ?? 'all'
  const city     = searchParams.get('city')     ?? ''
  const page     = parseInt(searchParams.get('page') ?? '0')
  const size     = Math.min(parseInt(searchParams.get('size') ?? '20'), 40)

  try {
    // ── Ticketmaster search ──
    const isDefaultLoad = !keyword.trim() && !city.trim() && category === 'all'

    const tmParams = new URLSearchParams({
      apikey:        tmKey,
      size:          String(size),
      page:          String(page),
      sort:          keyword.trim() ? 'relevance,desc' : 'date,asc',
      startDateTime: new Date().toISOString().split('.')[0] + 'Z',
    })

    // For default initial load (no filters), scope to US for consistent popular results
    if (isDefaultLoad) tmParams.set('countryCode', 'US')

    if (keyword.trim())  tmParams.set('keyword', keyword.trim())
    if (category !== 'all' && SEGMENT_IDS[category]) {
      tmParams.set('segmentId', SEGMENT_IDS[category])
      if (category === 'festival') tmParams.set('genreId', 'KnvZfZ7vAvF')
    }
    if (city.trim()) tmParams.set('city', city.trim())

    // ── Run Ticketmaster + football in parallel ──
    const [tmRes, footballEvents] = await Promise.all([
      fetch(
        `https://app.ticketmaster.com/discovery/v2/events.json?${tmParams}`,
        { signal: AbortSignal.timeout(10000), next: { revalidate: 60 } } as any
      ),
      // Only search football if keyword is football-related and we have the key
      (keyword && isFootballSearch(keyword) && fbKey)
        ? searchFootball(keyword, fbKey)
        : Promise.resolve([]),
    ])

    if (!tmRes.ok) {
      console.warn('[explore-events] Ticketmaster error:', tmRes.status)
      // If Ticketmaster fails but we have football results, return those
      if (footballEvents.length > 0) {
        return NextResponse.json({
          success: true, events: footballEvents,
          total: footballEvents.length, pages: 1, page: 0, count: footballEvents.length,
        })
      }
      return NextResponse.json({ success: false, events: [], total: 0, error: `Ticketmaster ${tmRes.status}` })
    }

    const tmData  = await tmRes.json()
    const raw     = tmData._embedded?.events ?? []
    const total   = tmData.page?.totalElements ?? 0
    const pages   = tmData.page?.totalPages ?? 0

    const tmEvents = raw.map(parseTicketmasterEvent).filter(Boolean) as LiveEvent[]

    // ── Merge: football events at top if searched for football ──
    const allEvents = footballEvents.length > 0
      ? [...footballEvents, ...tmEvents]
      : tmEvents

    // Deduplicate merged results
    const seen    = new Set<string>()
    const events  = allEvents.filter(ev => {
      const key = ev.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return NextResponse.json({
      success: true,
      events,
      total:  total + footballEvents.length,
      pages,
      page,
      count:  events.length,
    })

  } catch (err: any) {
    console.error('[explore-events] error:', err)
    return NextResponse.json({ success: false, events: [], total: 0, error: err.message })
  }
}