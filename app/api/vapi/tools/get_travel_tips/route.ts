import { NextRequest } from 'next/server'
import { toolSuccess, toolError } from '@/lib/vapiResponse'

// PredictHQ — real-time events by location
// Docs: https://docs.predicthq.com/api/events

interface PredictHQEvent {
  id: string
  title: string
  category: string
  rank: number
  start: string
  end?: string
  location: [number, number] // [lon, lat]
  entities: Array<{ name: string; type: string }>
  predicted_event_spend?: number
}

async function fetchLocalEvents(lat: number, lon: number, days: number): Promise<PredictHQEvent[]> {
  const apiKey = process.env.PREDICTHQ_API_KEY
  if (!apiKey) {
    console.warn('[get_travel_tips] No PREDICTHQ_API_KEY')
    return []
  }

  const startDate = new Date().toISOString().split('T')[0]
  const endDate = new Date(Date.now() + days * 86400000).toISOString().split('T')[0]

  try {
    const res = await fetch(
      `https://api.predicthq.com/v1/events/?` +
      `location_around.origin=${lat},${lon}` +
      `&location_around.offset=10km` +
      `&active.gte=${startDate}` +
      `&active.lte=${endDate}` +
      `&sort=rank` +
      `&limit=10` +
      `&state=active,predicted`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
        next: { revalidate: 3600 },
      }
    )

    if (!res.ok) return []
    const data = await res.json()
    return data.results ?? []
  } catch {
    return []
  }
}

// Destination-specific tips database (enriched with local knowledge)
function getDestinationTips(city: string): {
  mustDo: string[]
  localFood: string[]
  transport: string[]
  watchOut: string[]
  bestAreas: string[]
} {
  const c = city.toLowerCase()

  const destinations: Record<string, ReturnType<typeof getDestinationTips>> = {
    'madrid': {
      mustDo: ['Prado Museum (book tickets in advance)', 'Retiro Park on Sunday morning', 'Bernabéu Stadium tour', 'Flamenco show in Lavapiés', 'Walk the Gran Vía at night'],
      localFood: ['Bocadillo de calamares (the city\'s iconic squid sandwich)', 'Cocido Madrileño (hearty stew)', 'Churros con chocolate at Chocolatería San Ginés', 'Vermouth hour (La Hora del Vermú) on Sundays'],
      transport: ['Metro is excellent — get a 10-trip card', 'Avoid taxis near Plaza Mayor (overpriced)', 'Walk between Sol, Opera, and La Latina — it\'s flat and beautiful'],
      watchOut: ['Pickpockets on the Metro Line 1 and Puerta del Sol', 'Restaurants near tourist spots inflate prices — go one street back', 'Many locals eat lunch 2-4pm and dinner after 9pm'],
      bestAreas: ['Malasaña for trendy bars and cafés', 'La Latina for tapas', 'Chueca for nightlife', 'Salamanca for luxury shopping'],
    },
    'barcelona': {
      mustDo: ['Sagrada Família (book months ahead for peak season)', 'Park Güell early morning (sunrise = no crowds)', 'La Barceloneta beach', 'Gothic Quarter walking tour', 'Camp Nou if you\'re a football fan'],
      localFood: ['Pa amb tomàquet (bread rubbed with tomato)', 'Patatas bravas in El Born', 'Fresh seafood on La Barceloneta', 'Cava (Catalan sparkling wine) is better and cheaper than Champagne'],
      transport: ['T-Casual 10-trip Metro card is best value', 'Avoid La Rambla — tourist trap, high pickpocket risk', 'Bike rentals are everywhere and work well'],
      watchOut: ['La Rambla pickpockets are notorious — keep bags in front', 'Sagrada Família without a ticket = 2+ hour queue', 'Many beaches get extremely crowded July-August'],
      bestAreas: ['El Born for boutiques and bars', 'Gràcia for local neighbourhood feel', 'Eixample for architecture', 'Poblenou for creative scene'],
    },
    'new york': {
      mustDo: ['Walk the High Line early morning', 'Brooklyn Bridge at sunset', 'Central Park on weekends', 'MOMA (free on Friday evenings)', 'A Broadway show (discount tickets at TKTS booth in Times Square)'],
      localFood: ['Bagel with lox from a proper NYC deli', 'Dollar pizza slice from a local spot — not tourist pizza', 'Hot dog from a street cart', 'Smash burger from J.G. Melon or Shake Shack', 'Brunch culture — try it on a Sunday'],
      transport: ['Subway is the only way to move — get a MetroCard or use contactless', 'Avoid yellow cabs for anything more than 10 blocks', 'Citi Bike is surprisingly useful for short trips'],
      watchOut: ['Times Square is a tourist trap for everything — food, souvenirs, shows', 'Jaywalking is normal and expected', 'Tipping is mandatory — 18-22% at restaurants'],
      bestAreas: ['West Village for dinner', 'Williamsburg for nightlife', 'SoHo for shopping', 'Harlem for authentic culture'],
    },
    'london': {
      mustDo: ['Borough Market on a weekday morning', 'Tate Modern (free)', 'Walk from Westminster Bridge to Tower Bridge along the South Bank', 'Portobello Road Market on Saturday', 'A proper Sunday roast'],
      localFood: ['Full English breakfast', 'Fish and chips (go to a proper chippie, not tourist ones)', 'Pie and mash in East London', 'Afternoon tea (Bea\'s of Bloomsbury is affordable)', 'Dishoom for Indian food (queue for it — worth it)'],
      transport: ['Oyster card or contactless is essential', 'Avoid the Tube 8-9:30am and 5:30-7pm if you can', 'The Elizabeth Line is new and underused by tourists'],
      watchOut: ['Everything is expensive — budget accordingly', 'Weather changes every 20 minutes — always carry a light jacket', 'Queuing is religion — respect it'],
      bestAreas: ['Shoreditch for creative nightlife', 'Notting Hill for Sunday strolls', 'Soho for theatre and restaurants', 'Brixton for music and culture'],
    },
    'dubai': {
      mustDo: ['Burj Khalifa sunset (book the 148th floor, not 124th)', 'Old Dubai — Al Fahidi and the Gold Souk', 'Desert safari at least once', 'Ski Dubai if you have kids', 'Dubai Frame for the view'],
      localFood: ['Al Ustad Special Restaurant for Iranian kebabs', 'Ravi Restaurant — legendary Pakistani food', 'Friday brunch culture (it\'s an institution)', 'Fresh juices from roadside stands', 'Luqaimat (local sweet dumplings)'],
      transport: ['Metro is excellent and air-conditioned — use it', 'Uber is reliable and affordable', 'Never walk more than one block in summer (heat is dangerous)'],
      watchOut: ['Alcohol only in licensed venues', 'Dress modestly at souks and malls', 'Friday is the quietest day — many things close', 'Summer heat (June-September) is extreme — 45°C+'],
      bestAreas: ['Dubai Marina for modern lifestyle', 'JBR Beach for beach clubs', 'Downtown for Burj Khalifa area', 'Deira for authentic old Dubai'],
    },
  }

  // Try exact match first, then partial
  const key = Object.keys(destinations).find(k => c.includes(k) || k.includes(c))
  if (key) return destinations[key]

  // Generic fallback
  return {
    mustDo: [`Research ${city}'s top-rated landmarks on Google Maps`, 'Ask your hotel concierge for local recommendations', 'Download the city\'s transit app before you arrive'],
    localFood: ['Try the local market for authentic food', 'Avoid restaurants right next to tourist attractions', 'Ask locals where they eat — always better'],
    transport: ['Get a local transit card on arrival', 'Ride-hailing apps (Uber or local equivalent) for safety', 'Walk when distances are under 20 minutes'],
    watchOut: ['Keep valuables secure in busy tourist areas', 'Check local customs before you go', 'Carry some local cash for smaller vendors'],
    bestAreas: [`Download an offline map of ${city} before you arrive`],
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { city, country, arrival_date, departure_date, event_name } = body

    if (!city) return toolError('Missing required parameter: city')

    const stayDays = arrival_date && departure_date
      ? Math.ceil((new Date(departure_date).getTime() - new Date(arrival_date).getTime()) / 86400000)
      : 5

    // Geocode for PredictHQ
    let localEvents: PredictHQEvent[] = []
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
      )
      if (geoRes.ok) {
        const geoData = await geoRes.json()
        const loc = geoData.results?.[0]
        if (loc) {
          localEvents = await fetchLocalEvents(loc.latitude, loc.longitude, stayDays)
        }
      }
    } catch {
      // Continue without local events
    }

    const tips = getDestinationTips(city)

    // Format local events for voice
    const eventHighlights = localEvents
      .filter(e => e.rank >= 50)
      .slice(0, 3)
      .map(e => {
        const date = new Date(e.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        return `${e.title} on ${date}`
      })

    const topTip = tips.mustDo[0]
    const foodTip = tips.localFood[0]
    const watchOut = tips.watchOut[0]

    let message = `Here are my insider tips for ${city}. `
    if (event_name) message += `Since you're going for ${event_name}, `
    message += `Don't miss: ${topTip}. `
    message += `For food: ${foodTip}. `
    if (eventHighlights.length > 0) message += `Also happening while you're there: ${eventHighlights.join(', ')}. `
    message += `One thing to watch out for: ${watchOut}. Check your screen for the full breakdown!`

    return toolSuccess({
      message,
      city,
      tips,
      localEvents: localEvents.slice(0, 5).map(e => ({
        id: e.id,
        title: e.title,
        category: e.category,
        rank: e.rank,
        date: e.start,
        spend: e.predicted_event_spend,
      })),
      stayDays,
    })
  } catch (err) {
    console.error('[get_travel_tips]', err)
    return toolError('Failed to get travel tips')
  }
}