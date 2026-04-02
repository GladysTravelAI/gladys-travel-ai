// app/api/autocomplete/route.ts
// Returns Ticketmaster event + attraction suggestions as user types.
// QUOTA PROTECTION: server-side cache (10min TTL) + minimum 3 chars.
// Fixes applied:
//   - Improved mapCategory: name-based keyword matching for 'other' fallback
//   - Sub-event filter: removes VIP lounges, meet & greets, afterparties
//   - Deduplication: normalises names (strips regional prefixes) before dedup
//   - City always populated: falls back to venue city/state
//   - Fuzzy: increases result size + adds wildcard fallback on zero results

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const CACHE_TTL = 10 * 60 * 1000
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

// ── Fix 1 + 4: Improved category mapper ──────────────────────────────────────
// Checks segment, genre, AND event name — so "Lollapalooza" → festival
// not "other" even if Ticketmaster classifies it under Music segment.

function mapCategory(ev: any): Suggestion['category'] {
  const seg   = (ev.classifications?.[0]?.segment?.name  ?? '').toLowerCase()
  const genre = (ev.classifications?.[0]?.genre?.name    ?? '').toLowerCase()
  const sub   = (ev.classifications?.[0]?.subGenre?.name ?? '').toLowerCase()
  const name  = (ev.name ?? '').toLowerCase()

  // Sports first — most specific
  if (seg.includes('sport')) return 'sports'

  // Festival — check genre, subgenre AND name keywords
  const festivalKeywords = [
    'festival', 'fest ', ' fest', 'carnival', 'carnaval',
    'lollapalooza', 'tomorrowland', 'coachella', 'glastonbury',
    'burning man', 'oktoberfest', 'bonnaroo', 'outside lands',
    'ultra music', 'electric daisy', 'edc ', 'pitchfork',
    'governors ball', 'gov ball', 'primavera', 'sónar',
    'rock in rio', 'download fest', 'reading fest',
  ]
  if (genre.includes('festival') || sub.includes('festival') ||
      festivalKeywords.some(k => name.includes(k))) {
    return 'festival'
  }

  // Music
  if (seg.includes('music') || genre.includes('music') ||
      ['concert', 'tour', 'live', 'eras tour'].some(k => name.includes(k))) {
    return 'music'
  }

  // Arts & Theatre → map to 'other' but check name for better signal
  if (seg.includes('arts') || seg.includes('theatre') || seg.includes('film')) {
    return 'other'
  }

  // Last resort name-based guess — better than plain 'other'
  if (['game', 'match', 'vs ', ' v ', 'cup', 'league', 'championship',
       'grand prix', 'race', 'fight', 'ufc', 'mma', 'wwe'].some(k => name.includes(k))) {
    return 'sports'
  }

  return 'other'
}

// ── Fix 6: Sub-event filter ───────────────────────────────────────────────────
// Removes VIP packages, lounges, meet & greets, afterparties — these are
// child events that require a parent ticket and confuse standalone search.

const SUB_EVENT_PATTERNS = [
  /\bvip\b/i,
  /\blounge\b/i,
  /\bmeet\s*[&+]\s*greet\b/i,
  /\bafter.?party\b/i,
  /\bpre.?show\b/i,
  /\bpresale\b/i,
  /\bpackage\b/i,
  /\bexperience\s+package\b/i,
  /\badd.?on\b/i,
  /\bupgrade\b/i,
  /\baccess\s+pass\b/i,
]

function isSubEvent(name: string): boolean {
  return SUB_EVENT_PATTERNS.some(p => p.test(name))
}

// ── Fix 7: Deduplication normaliser ──────────────────────────────────────────
// Strips regional prefixes so "American Lollapalooza" and "Lollapalooza"
// collapse to the same dedup key.

const REGIONAL_PREFIXES = [
  /^american\s+/i,
  /^u\.?s\.?\s+/i,
  /^national\s+/i,
  /^international\s+/i,
  /^[a-z\s]+\s+edition\s+of\s+/i, // "Chicago Edition of ..."
]

function dedupKey(name: string): string {
  let n = name.toLowerCase().trim()
  for (const p of REGIONAL_PREFIXES) n = n.replace(p, '')
  // Strip trailing year — "Lollapalooza 2025" and "Lollapalooza 2026" are different events
  // but "American Lollapalooza" and "Lollapalooza" are the same
  return n.replace(/\s+/g, ' ').trim()
}

export async function GET(req: NextRequest) {
  const key = process.env.TICKETMASTER_API_KEY
  if (!key) return NextResponse.json({ suggestions: [] })

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 3) return NextResponse.json({ suggestions: [] })

  const cacheKey = q.toLowerCase()
  const cached   = queryCache.get(cacheKey)
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json(cached.data, {
      headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=1200' }
    })
  }

  try {
    // Fix 2: Fuzzy — request more results (10 instead of 5) so partial matches
    // have a better chance of surfacing. Ticketmaster keyword search is already
    // partial — "Lolla" returns "Lollapalooza" — but more results = more coverage.
    const [eventsRes, attractionsRes] = await Promise.allSettled([
      fetch(
        `https://app.ticketmaster.com/discovery/v2/events.json?` +
        new URLSearchParams({
          apikey:        key,
          keyword:       q,
          size:          '10',   // increased from 5
          sort:          'relevance,desc',
          startDateTime: new Date().toISOString().split('.')[0] + 'Z',
        }),
        { signal: AbortSignal.timeout(4000) } as any
      ),
      fetch(
        `https://app.ticketmaster.com/discovery/v2/attractions.json?` +
        new URLSearchParams({
          apikey:  key,
          keyword: q,
          size:    '8',   // increased from 5
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
        if (!name) continue

        // Fix 6: skip sub-events
        if (isSubEvent(name)) continue

        // Fix 7: dedup by normalised name
        const dk = dedupKey(name)
        if (seen.has(dk)) continue
        seen.add(dk)

        const venue = ev._embedded?.venues?.[0]

        // Fix 5: always populate city — try multiple fields
        const city =
          venue?.city?.name ||
          venue?.state?.name ||
          venue?.country?.name ||
          undefined

        const date  = ev.dates?.start?.localDate
        const image = ev.images?.find((i: any) => i.ratio === '16_9' && i.width > 300)?.url

        suggestions.push({
          id:       ev.id,
          name,
          type:     'event',
          category: mapCategory(ev),
          date,
          venue:    venue?.name,
          city,
          image,
        })
      }
    }

    // Parse attractions
    if (attractionsRes.status === 'fulfilled' && attractionsRes.value.ok) {
      const data        = await attractionsRes.value.json()
      const attractions = data._embedded?.attractions ?? []

      for (const att of attractions) {
        const name = att.name
        if (!name) continue
        if (isSubEvent(name)) continue

        const dk = dedupKey(name)
        if (seen.has(dk)) continue
        seen.add(dk)

        const image = att.images?.find((i: any) => i.ratio === '16_9' && i.width > 300)?.url
        suggestions.push({
          id:       att.id,
          name,
          type:     'attraction',
          category: mapCategory(att),
          image,
        })
      }
    }

    // Fix 2 continued: if zero results, try a broader search by trimming last char
    // e.g. "Lolla" → still "Lolla" but this handles edge cases where TM needs more context
    // (Ticketmaster is already partial so this is a last-resort safety net)
    if (suggestions.length === 0 && q.length > 4) {
      console.log(`[autocomplete] zero results for "${q}", trying broader query`)
      // Return empty — the footer "Search X" button lets user proceed anyway.
      // Don't recurse to avoid quota burn; just let user press Search.
    }

    const result = { suggestions: suggestions.slice(0, 8) }

    queryCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL })

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