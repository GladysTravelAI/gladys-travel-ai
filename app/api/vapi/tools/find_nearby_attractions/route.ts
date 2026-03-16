import { NextRequest } from 'next/server'
import { toolSuccess, toolError } from '@/lib/vapiResponse'
import { buildTicketsLink } from '@/lib/affiliateLinks'

// PredictHQ — real-time events within radius of user's current location
// Combined with Ticketmaster nearby events for ticket availability

interface NearbyEvent {
  id: string
  title: string
  category: string
  rank: number
  date: string
  venue?: string
  distance?: string
  ticketUrl?: string
  priceFrom?: number
  description?: string
}

async function fetchNearbyPredictHQ(lat: number, lon: number): Promise<NearbyEvent[]> {
  const apiKey = process.env.PREDICTHQ_API_KEY
  if (!apiKey) return []

  const today = new Date().toISOString().split('T')[0]
  const weekAhead = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  try {
    const res = await fetch(
      `https://api.predicthq.com/v1/events/?` +
      `location_around.origin=${lat},${lon}` +
      `&location_around.offset=5km` +
      `&active.gte=${today}` +
      `&active.lte=${weekAhead}` +
      `&sort=rank` +
      `&limit=15` +
      `&state=active,predicted` +
      `&category=concerts,sports,community,conferences,expos,festivals,performing-arts`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
        next: { revalidate: 1800 },
      }
    )

    if (!res.ok) return []
    const data = await res.json()

    return (data.results ?? []).map((e: any) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      rank: e.rank,
      date: e.start,
      venue: e.entities?.find((ent: any) => ent.type === 'venue')?.name,
      ticketUrl: buildTicketsLink(e.title, '', e.start.split('T')[0]),
      description: e.description,
    }))
  } catch (err) {
    console.error('[find_nearby_attractions] PredictHQ error:', err)
    return []
  }
}

async function fetchNearbyTicketmaster(lat: number, lon: number): Promise<NearbyEvent[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY || process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY
  if (!apiKey) return []

  try {
    const res = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?` +
      `apikey=${apiKey}` +
      `&latlong=${lat},${lon}` +
      `&radius=10` +
      `&unit=km` +
      `&sort=relevance,desc` +
      `&size=10` +
      `&classificationName=music,sports,arts`,
      { next: { revalidate: 3600 } }
    )

    if (!res.ok) return []
    const data = await res.json()
    const events = data._embedded?.events ?? []

    return events.map((e: any) => {
      const venue = e._embedded?.venues?.[0]
      const priceRange = e.priceRanges?.[0]
      const image = e.images?.find((img: any) => img.ratio === '16_9' && !img.fallback)?.url

      return {
        id: e.id,
        title: e.name,
        category: e.classifications?.[0]?.segment?.name ?? 'Event',
        rank: 80, // Ticketmaster events are generally high-value
        date: e.dates?.start?.dateTime ?? e.dates?.start?.localDate,
        venue: venue?.name,
        ticketUrl: e.url, // Direct Ticketmaster link
        priceFrom: priceRange?.min,
        description: `${e.classifications?.[0]?.genre?.name ?? ''} at ${venue?.name ?? 'venue'}, ${venue?.city?.name ?? ''}`.trim(),
        image,
      }
    })
  } catch (err) {
    console.error('[find_nearby_attractions] Ticketmaster error:', err)
    return []
  }
}

// Merge and deduplicate results from both sources
function mergeEvents(phq: NearbyEvent[], tm: NearbyEvent[]): NearbyEvent[] {
  const seen = new Set<string>()
  const merged: NearbyEvent[] = []

  // Prioritize Ticketmaster (has real ticket links + prices)
  for (const e of tm) {
    const key = e.title.toLowerCase().substring(0, 20)
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(e)
    }
  }

  // Add PredictHQ for broader coverage (concerts, community, festivals)
  for (const e of phq) {
    const key = e.title.toLowerCase().substring(0, 20)
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(e)
    }
  }

  // Sort by rank descending
  return merged.sort((a, b) => b.rank - a.rank).slice(0, 8)
}

function buildUpsellMessage(events: NearbyEvent[], city: string, landmark?: string): string {
  if (!events.length) {
    return `I'm checking what's happening around ${city} right now. The area looks fairly quiet for events this week — but let me know if you want to explore further afield.`
  }

  const top = events[0]
  const hasTickets = top.ticketUrl && top.priceFrom

  if (landmark) {
    return `You're near ${landmark} — perfect timing! ${top.title} is happening nearby${top.venue ? ` at ${top.venue}` : ''}${top.priceFrom ? ` from $${top.priceFrom}` : ''}. Check your screen for tickets and ${events.length - 1} more events around you right now!`
  }

  return `${events.length} events happening around you in ${city}! The top pick is ${top.title}${top.venue ? ` at ${top.venue}` : ''}${top.priceFrom ? ` from $${top.priceFrom}` : ''}. ${hasTickets ? "I've got the ticket link ready on your screen." : "Check your screen for the full list!"}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { latitude, longitude, city, landmark } = body

    // Need either lat/lon OR city
    if (!latitude && !city) {
      return toolError('Need either latitude/longitude or a city name')
    }

    let lat = parseFloat(latitude)
    let lon = parseFloat(longitude)

    // Geocode city if no coordinates
    if ((!lat || !lon) && city) {
      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        )
        if (geoRes.ok) {
          const geoData = await geoRes.json()
          const loc = geoData.results?.[0]
          if (loc) { lat = loc.latitude; lon = loc.longitude }
        }
      } catch {}
    }

    if (!lat || !lon) {
      return toolError(`Could not determine location for: ${city}`)
    }

    // Fetch from both sources in parallel
    const [phqEvents, tmEvents] = await Promise.all([
      fetchNearbyPredictHQ(lat, lon),
      fetchNearbyTicketmaster(lat, lon),
    ])

    const events = mergeEvents(phqEvents, tmEvents)
    const displayCity = city || 'your current location'
    const message = buildUpsellMessage(events, displayCity, landmark)

    // Build affiliate cards for top 3
    const affiliateCards = events.slice(0, 3).map(e => ({
      service: 'StubHub',
      displayText: e.title,
      affiliateUrl: e.ticketUrl || buildTicketsLink(e.title, city || '', e.date?.split('T')[0] || ''),
      message: e.description || e.title,
    }))

    return toolSuccess({
      message,
      city: displayCity,
      landmark,
      events,
      affiliateCards,
      // Primary card for voice UI
      affiliateUrl: affiliateCards[0]?.affiliateUrl ?? null,
      displayText: affiliateCards[0]?.displayText ?? null,
      service: 'StubHub',
    })
  } catch (err) {
    console.error('[find_nearby_attractions]', err)
    return toolError('Failed to find nearby events')
  }
}