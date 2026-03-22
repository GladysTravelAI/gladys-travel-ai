// app/api/live-match/route.ts
// Live match data: football scores/lineups via API-Football + concert setlists via setlist.fm

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const type       = searchParams.get('type') ?? 'football'   // 'football' | 'concert'
  const fixtureId  = searchParams.get('fixtureId')            // API-Football fixture ID
  const artistName = searchParams.get('artist')               // for setlist.fm
  const eventDate  = searchParams.get('date')                 // YYYY-MM-DD

  if (type === 'football' && fixtureId) {
    return fetchFootballLive(fixtureId)
  }

  if (type === 'concert' && artistName) {
    return fetchConcertSetlist(artistName, eventDate)
  }

  return NextResponse.json({ error: 'Missing required params' }, { status: 400 })
}

// ── FOOTBALL LIVE ─────────────────────────────────────────────────────────────

async function fetchFootballLive(fixtureId: string) {
  const key = process.env.API_FOOTBALL_KEY
  if (!key) return NextResponse.json({ error: 'Football API not configured' })

  try {
    const [liveRes, lineupsRes, eventsRes] = await Promise.all([
      fetch(`https://v3.football.api-sports.io/fixtures?id=${fixtureId}`,
        { headers: { 'x-apisports-key': key }, signal: AbortSignal.timeout(8000) }),
      fetch(`https://v3.football.api-sports.io/fixtures/lineups?fixture=${fixtureId}`,
        { headers: { 'x-apisports-key': key }, signal: AbortSignal.timeout(8000) }),
      fetch(`https://v3.football.api-sports.io/fixtures/events?fixture=${fixtureId}`,
        { headers: { 'x-apisports-key': key }, signal: AbortSignal.timeout(8000) }),
    ])

    const [liveData, lineupsData, eventsData] = await Promise.all([
      liveRes.json(), lineupsRes.json(), eventsRes.json(),
    ])

    const fixture  = liveData.response?.[0]
    if (!fixture) return NextResponse.json({ error: 'Fixture not found' })

    const status   = fixture.fixture?.status
    const score    = fixture.goals
    const elapsed  = fixture.fixture?.status?.elapsed
    const lineups  = lineupsData.response ?? []
    const events   = eventsData.response ?? []

    // Parse match events (goals, cards, subs)
    const goals = events.filter((e: any) => e.type === 'Goal').map((e: any) => ({
      minute:   e.time?.elapsed,
      team:     e.team?.name,
      player:   e.player?.name,
      assist:   e.assist?.name,
      type:     e.detail, // Normal Goal, Own Goal, Penalty
    }))

    const cards = events.filter((e: any) => e.type === 'Card').map((e: any) => ({
      minute: e.time?.elapsed,
      team:   e.team?.name,
      player: e.player?.name,
      type:   e.detail, // Yellow Card, Red Card
    }))

    const substitutions = events.filter((e: any) => e.type === 'subst').map((e: any) => ({
      minute:  e.time?.elapsed,
      team:    e.team?.name,
      playerIn:  e.assist?.name,
      playerOut: e.player?.name,
    }))

    return NextResponse.json({
      type:     'football',
      fixture:  fixtureId,
      status: {
        code:    status?.short,
        label:   status?.long,
        elapsed, // minutes played
        isLive:  ['1H', 'HT', '2H', 'ET', 'P', 'BT'].includes(status?.short),
        isEnded: ['FT', 'AET', 'PEN'].includes(status?.short),
      },
      teams: {
        home: {
          name:  fixture.teams?.home?.name,
          logo:  fixture.teams?.home?.logo,
          score: score?.home,
        },
        away: {
          name:  fixture.teams?.away?.name,
          logo:  fixture.teams?.away?.logo,
          score: score?.away,
        },
      },
      lineups: lineups.map((l: any) => ({
        team:        l.team?.name,
        formation:   l.formation,
        startingXI:  l.startXI?.map((p: any) => ({ name: p.player?.name, number: p.player?.number, pos: p.player?.pos })) ?? [],
        substitutes: l.substitutes?.map((p: any) => ({ name: p.player?.name, number: p.player?.number })) ?? [],
      })),
      goals,
      cards,
      substitutions,
      venue: fixture.fixture?.venue?.name,
      city:  fixture.fixture?.venue?.city,
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message })
  }
}

// ── CONCERT SETLIST ───────────────────────────────────────────────────────────

async function fetchConcertSetlist(artistName: string, eventDate?: string | null) {
  try {
    // setlist.fm free API — no key required for basic search
    const params = new URLSearchParams({
      artistName,
      ...(eventDate && { date: eventDate.split('-').reverse().join('-') }), // DD-MM-YYYY format
    })

    const res = await fetch(
      `https://api.setlist.fm/rest/1.0/search/setlists?${params}`,
      {
        headers: {
          'x-api-key': process.env.SETLISTFM_API_KEY ?? 'api-key', // free tier works without key
          'Accept':    'application/json',
        },
        signal: AbortSignal.timeout(8000),
      }
    )

    if (!res.ok) {
      // Fallback: return empty setlist structure
      return NextResponse.json({
        type:       'concert',
        artist:     artistName,
        setlist:    [],
        tourName:   null,
        venue:      null,
        date:       eventDate,
        note:       'Setlist not yet available — will update once the show starts',
      })
    }

    const data = await res.json()
    const mostRecent = data.setlist?.[0]

    if (!mostRecent) {
      return NextResponse.json({
        type:    'concert',
        artist:  artistName,
        setlist: [],
        note:    'No setlist found yet for this show',
      })
    }

    // Flatten all songs from all sets
    const songs: string[] = []
    for (const set of mostRecent.sets?.set ?? []) {
      for (const song of set.song ?? []) {
        if (song.name) songs.push(song.name)
      }
    }

    return NextResponse.json({
      type:     'concert',
      artist:   artistName,
      tourName: mostRecent.tour?.name,
      venue:    mostRecent.venue?.name,
      city:     mostRecent.venue?.city?.name,
      date:     mostRecent.eventDate,
      setlist:  songs,
      source:   'setlist.fm',
      note:     songs.length > 0
        ? `${songs.length} songs from the most recent show`
        : 'Setlist not yet posted — check back after the show starts',
    })

  } catch (err: any) {
    return NextResponse.json({
      type:    'concert',
      artist:  artistName,
      setlist: [],
      note:    'Setlist service temporarily unavailable',
    })
  }
}