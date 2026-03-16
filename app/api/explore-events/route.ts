// app/api/explore-events/route.ts
// Full Ticketmaster discovery search — powers the /events page.
// Accepts: keyword, category, city, page, size

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

function mapCategory(ev: any): 'sports' | 'music' | 'festival' | 'other' {
  const seg   = ev.classifications?.[0]?.segment?.name?.toLowerCase() ?? ''
  const genre = ev.classifications?.[0]?.genre?.name?.toLowerCase() ?? ''
  if (seg.includes('sport'))                   return 'sports'
  if (genre.includes('festival'))              return 'festival'
  if (seg.includes('music'))                   return 'music'
  return 'other'
}

function parseEvent(ev: any): LiveEvent | null {
  const venue    = ev._embedded?.venues?.[0]
  const date     = ev.dates?.start?.localDate
  const time     = ev.dates?.start?.localTime
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

// Segment IDs for Ticketmaster category filtering
const SEGMENT_IDS: Record<string, string> = {
  music:    'KZFzniwnSyZfZ7v7nJ',
  sports:   'KZFzniwnSyZfZ7v7nE',
  festival: 'KZFzniwnSyZfZ7v7nJ', // music segment — filter by genre below
  arts:     'KZFzniwnSyZfZ7v7na',
}

export async function GET(req: NextRequest) {
  const key = process.env.TICKETMASTER_API_KEY
  if (!key) {
    return NextResponse.json({ success: false, events: [], total: 0, error: 'API not configured' })
  }

  const { searchParams } = req.nextUrl
  const keyword  = searchParams.get('keyword')  ?? ''
  const category = searchParams.get('category') ?? 'all'
  const city     = searchParams.get('city')     ?? ''
  const page     = parseInt(searchParams.get('page') ?? '0')
  const size     = Math.min(parseInt(searchParams.get('size') ?? '20'), 40)

  try {
    const params = new URLSearchParams({
      apikey:        key,
      size:          String(size),
      page:          String(page),
      sort:          keyword ? 'relevance,desc' : 'date,asc',
      startDateTime: new Date().toISOString().split('.')[0] + 'Z',
    })

    // Keyword search
    if (keyword.trim()) params.set('keyword', keyword.trim())

    // Category filter
    if (category !== 'all' && SEGMENT_IDS[category]) {
      params.set('segmentId', SEGMENT_IDS[category])
      if (category === 'festival') params.set('genreId', 'KnvZfZ7vAvF') // Festival genre
    }

    // City filter
    if (city.trim()) params.set('city', city.trim())

    const res = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?${params}`,
      { signal: AbortSignal.timeout(10000), next: { revalidate: 60 } } as any
    )

    if (!res.ok) {
      console.warn('[explore-events] Ticketmaster error:', res.status)
      return NextResponse.json({ success: false, events: [], total: 0, error: `Ticketmaster ${res.status}` })
    }

    const data   = await res.json()
    const raw    = data._embedded?.events ?? []
    const total  = data.page?.totalElements ?? 0
    const pages  = data.page?.totalPages ?? 0

    const events = raw
      .map(parseEvent)
      .filter(Boolean) as LiveEvent[]

    return NextResponse.json({
      success: true,
      events,
      total,
      pages,
      page,
      count: events.length,
    })

  } catch (err: any) {
    console.error('[explore-events] error:', err)
    return NextResponse.json({ success: false, events: [], total: 0, error: err.message })
  }
}