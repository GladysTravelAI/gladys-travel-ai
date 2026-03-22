// app/api/gladys-chat/stream/route.ts
// SSE streaming endpoint for GladysCompanion chat
// All 7 tools — same coverage as gladys-chat/route.ts

import { NextRequest } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── League → Season ───────────────────────────────────────────────────────────

const LEAGUE_SEASONS: Record<number, number> = {
  1: 2026, 9: 2024, 4: 2024, 6: 2024,
  2: 2024, 3: 2024, 848: 2024,
  39: 2024, 140: 2024, 78: 2024, 135: 2024, 61: 2024,
  94: 2024, 88: 2024,
  253: 2025, 262: 2025, 71: 2025, 128: 2025,
  21: 2024, 254: 2025, 57: 2024, 826: 2024,
}
const getSeasonForLeague = (id: number) => LEAGUE_SEASONS[id] ?? 2024

const LEAGUE_ID_MAP: Record<string, number> = {
  'premier league': 39, 'epl': 39, 'la liga': 140, 'bundesliga': 78,
  'serie a': 135, 'ligue 1': 61, 'champions league': 2, 'ucl': 2,
  'europa league': 3, 'conference league': 848, 'world cup': 1,
  'world cup 2026': 1, 'fifa world cup': 1, 'mls': 253, 'liga mx': 262,
  'brasileirao': 71, 'copa america': 9, 'euros': 4, 'afcon': 6,
  'eredivisie': 88, 'primeira liga': 94, 'nwsl': 254, 'wsl': 57,
  "women's champions league": 21, "women's ucl": 21,
}

// ── Tools ─────────────────────────────────────────────────────────────────────

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get current weather and 7-day forecast for a city',
      parameters: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_packing_list',
      description: 'Generate a smart packing list for a trip',
      parameters: {
        type: 'object',
        properties: {
          destination: { type: 'string' },
          days:        { type: 'number' },
          eventType:   { type: 'string', description: 'sports, music, festival, beach, city, ski' },
        },
        required: ['destination', 'days'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_travel_tips',
      description: 'Get insider travel tips, must-dos, local food for a destination city',
      parameters: { type: 'object', properties: { city: { type: 'string' } }, required: ['city'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_flight_status',
      description: 'Check real-time flight status for a flight number e.g. BA123, EK203',
      parameters: { type: 'object', properties: { flightNumber: { type: 'string' } }, required: ['flightNumber'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_nearby_attractions',
      description: 'Find restaurants, bars, landmarks, museums near a city',
      parameters: {
        type: 'object',
        properties: {
          city:     { type: 'string' },
          category: { type: 'string', enum: ['dining', 'nightlife', 'sights', 'outdoors', 'shopping', 'arts', 'all'] },
          limit:    { type: 'number' },
        },
        required: ['city'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_football_fixtures',
      description: "Find upcoming football/soccer matches worldwide — Premier League, Champions League, World Cup 2026, La Liga, Bundesliga, Serie A, MLS, NWSL, Women's UCL, Copa America, AFCON and more. Always use for football questions.",
      parameters: {
        type: 'object',
        properties: {
          league:   { type: 'string' },
          team:     { type: 'string' },
          next:     { type: 'number' },
          leagueId: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_airport_info',
      description: 'Get airport navigation help — terminals, transport to/from airport, Uber pickup zones, lounges, security tips. Use when user asks about an airport or needs directions inside one.',
      parameters: {
        type: 'object',
        properties: {
          airport:  { type: 'string', description: 'Airport name or IATA code e.g. "JFK", "Heathrow", "OR Tambo"' },
          query:    { type: 'string' },
          terminal: { type: 'string' },
        },
        required: ['airport'],
      },
    },
  },
]

// ── Executors ─────────────────────────────────────────────────────────────────

async function executeWeather(args: { city: string }) {
  try {
    const geo = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(args.city)}&count=1&language=en&format=json`
    ).then(r => r.json())
    if (!geo.results?.length) return { error: `City not found: ${args.city}` }
    const { latitude, longitude, name, country } = geo.results[0]
    const wx = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&current_weather=true&timezone=auto`
    ).then(r => r.json())
    const codes: Record<number, string> = {
      0: '☀️ Clear', 1: '🌤 Mostly clear', 2: '⛅ Partly cloudy', 3: '☁️ Overcast',
      45: '🌫 Foggy', 51: '🌦 Drizzle', 61: '🌧 Rain', 71: '🌨 Snow',
      80: '🌧 Showers', 95: '⛈ Thunderstorm',
    }
    const desc = (c: number) => codes[c] ?? '🌡 Unknown'
    return {
      city: name, country,
      today: {
        maxTemp: Math.round(wx.daily.temperature_2m_max[0]),
        minTemp: Math.round(wx.daily.temperature_2m_min[0]),
        code:    wx.daily.weathercode[0],
        description: desc(wx.daily.weathercode[0]),
      },
      forecast: wx.daily.time.slice(0, 7).map((date: string, i: number) => ({
        date,
        maxTemp: Math.round(wx.daily.temperature_2m_max[i]),
        minTemp: Math.round(wx.daily.temperature_2m_min[i]),
        code:    wx.daily.weathercode[i],
        rain:    wx.daily.precipitation_sum[i],
      })),
      summary: { advice: 'Check the forecast before packing.' },
    }
  } catch { return { error: 'Weather service unavailable' } }
}

function executePackingList(args: { destination: string; days: number; eventType?: string }) {
  const base    = ['Passport/ID', 'Phone + charger', 'Power bank', 'Travel insurance docs', 'Medications', 'Cash + cards']
  const clothes = [
    `${Math.ceil(args.days * 1.2)} t-shirts`,
    `${Math.ceil(args.days / 2)} trousers/jeans`,
    `${args.days} underwear/socks`,
    'Light jacket or hoodie',
    'Comfortable walking shoes',
  ]
  const eventExtras: Record<string, string[]> = {
    sports:   ['Team jersey or fan gear', 'Comfortable trainers', 'Sunscreen', 'Portable seat cushion'],
    music:    ['Earplugs', 'Comfortable shoes for standing', 'Light rain poncho', 'Small backpack'],
    festival: ['Wellies/waterproof shoes', 'Rain poncho', 'Reusable water bottle', 'Sunhat'],
    beach:    ['Swimwear', 'Sunscreen SPF50+', 'Beach towel', 'Flip flops', 'Sunglasses'],
    city:     ['Day bag', 'Umbrella', 'Smart outfit for restaurants'],
    ski:      ['Ski jacket + trousers', 'Thermal base layers', 'Ski gloves', 'Goggles', 'Helmet'],
  }
  const extras = args.eventType ? (eventExtras[args.eventType] ?? eventExtras.city) : eventExtras.city
  return {
    destination: args.destination,
    days:        args.days,
    totalItems:  base.length + clothes.length + extras.length,
    packingList: [
      { category: 'Essentials',    items: base,    essential: true  },
      { category: 'Clothing',      items: clothes, essential: true  },
      { category: 'For the event', items: extras,  essential: false },
    ],
    proTips:       ['Roll clothes to save space', 'Pack a collapsible bag for souvenirs'],
    weatherContext: { avgTemp: 20 },
  }
}

function executeGetTravelTips(args: { city: string }) {
  const tips: Record<string, any> = {
    'London':      { mustDo: ['Tower of London', 'Borough Market', 'Tate Modern', 'Notting Hill'],          localFood: ['Fish & chips at a pub', 'Brick Lane curry', 'Borough Market street food'],   watchOut: ['Pubs close at 11pm'] },
    'Paris':       { mustDo: ['Eiffel Tower (book online)', 'Louvre', 'Montmartre', 'Seine walk'],          localFood: ['Croissant from a boulangerie', 'Steak frites', 'French onion soup'],           watchOut: ['Book Eiffel Tower 2 months ahead'] },
    'New York':    { mustDo: ['High Line', 'Central Park', 'Brooklyn Bridge', 'Times Square'],              localFood: ['NYC pizza slice', "Katz's Deli pastrami", 'Bagel with lox'],                  watchOut: ['Book restaurants ahead on weekends'] },
    'Los Angeles': { mustDo: ['Griffith Observatory', 'Venice Beach', 'Santa Monica Pier'],                localFood: ['In-N-Out Burger', 'Tacos from a truck in East LA'],                           watchOut: ['Traffic is worst 7–9am and 4–7pm'] },
    'Dubai':       { mustDo: ['Burj Khalifa', 'Desert safari', 'Gold Souk'],                               localFood: ['Shawarma from Al Safadi', 'Fresh juice from Bur Dubai'],                      watchOut: ['Dress modestly outside resorts'] },
    'Madrid':      { mustDo: ['Prado Museum', 'Retiro Park', 'Bernabeu tour'],                             localFood: ['Bocadillo de calamares', 'Churros with chocolate'],                           watchOut: ['Dinner rarely before 9pm'] },
    'Barcelona':   { mustDo: ['Sagrada Familia', 'Park Guell', 'Camp Nou'],                                localFood: ['Pan con tomate', 'Tapas at El Xampanyet'],                                    watchOut: ['Pickpockets on Las Ramblas'] },
    'Munich':      { mustDo: ['Allianz Arena tour', 'Marienplatz', 'BMW Museum'],                          localFood: ['Weisswurst with pretzels', 'Beer at a Biergarten'],                           watchOut: ['Hotels book out during Oktoberfest'] },
    'Johannesburg':{ mustDo: ['Apartheid Museum', 'Soweto tour', 'Maboneng Precinct'],                     localFood: ['Bunny chow', 'Braai', 'Kota'],                                                watchOut: ["Don't walk alone at night in the CBD"] },
  }
  const key = Object.keys(tips).find(k => args.city.toLowerCase().includes(k.toLowerCase()))
  return key
    ? { city: args.city, tips: tips[key], localEvents: [] }
    : {
        city: args.city,
        tips: {
          mustDo:    ['Explore the city centre', 'Visit local markets', 'Try the local cuisine'],
          localFood: ['Ask locals for restaurant recommendations'],
          watchOut:  ['Keep copies of your documents'],
        },
        localEvents: [],
      }
}

async function executeFlightStatus(args: { flightNumber: string }) {
  try {
    const key = process.env.AVIATIONSTACK_API_KEY
    if (!key) return { error: 'Flight status not configured' }
    const url  = `http://api.aviationstack.com/v1/flights?access_key=${key}&flight_iata=${args.flightNumber.toUpperCase()}&limit=1`
    const data = await fetch(url, { signal: AbortSignal.timeout(5000) }).then(r => r.json())
    if (!data.data?.length) return { error: `No data found for flight ${args.flightNumber}` }
    const f = data.data[0]
    return {
      flightNumber: f.flight?.iata,
      airline:      f.airline?.name,
      status:       f.flight_status,
      departure: {
        airport: f.departure?.airport, iata: f.departure?.iata,
        scheduled: f.departure?.scheduled, estimated: f.departure?.estimated,
        gate: f.departure?.gate, delay: f.departure?.delay,
      },
      arrival: {
        airport: f.arrival?.airport, iata: f.arrival?.iata,
        scheduled: f.arrival?.scheduled, estimated: f.arrival?.estimated,
        gate: f.arrival?.gate,
      },
      recoveryOptions: [],
    }
  } catch { return { error: 'Flight status unavailable' } }
}

async function executeFindNearbyAttractions(args: { city: string; category?: string; limit?: number }) {
  try {
    const key = process.env.FOURSQUARE_API_KEY
    if (!key) return { error: 'Places not configured' }
    const categoryMap: Record<string, string> = {
      dining: '13000', nightlife: '10032', sights: '16000',
      outdoors: '16000', shopping: '17000', arts: '10000', all: '',
    }
    const geo = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(args.city)}&count=1&language=en&format=json`
    ).then(r => r.json())
    if (!geo.results?.length) return { error: `City not found: ${args.city}` }
    const { latitude, longitude } = geo.results[0]
    const cat        = args.category ?? 'all'
    const categoryId = categoryMap[cat] ?? ''
    const params     = new URLSearchParams({
      ll:     `${latitude},${longitude}`,
      radius: '5000',
      limit:  String(Math.min(args.limit ?? 8, 15)),
      sort:   'POPULARITY',
      ...(categoryId && { categories: categoryId }),
    })
    const fsData = await fetch(
      `https://api.foursquare.com/v3/places/search?${params}`,
      { headers: { Authorization: key, Accept: 'application/json' } }
    ).then(r => r.json())
    if (!fsData.results?.length) return { city: args.city, places: [] }
    return {
      city: args.city,
      category: cat,
      places: fsData.results.map((p: any) => ({
        name:     p.name,
        category: p.categories?.[0]?.name ?? 'Place',
        address:  p.location?.formatted_address ?? '',
        distance: p.distance ? `${(p.distance / 1000).toFixed(1)}km away` : '',
        rating:   p.rating ? `${p.rating}/10` : null,
        link:     `https://foursquare.com/v/${p.fsq_id}`,
      })),
    }
  } catch { return { error: 'Places service unavailable' } }
}

async function executeFindFootballFixtures(args: { league?: string; team?: string; next?: number; leagueId?: number }) {
  try {
    const key = process.env.API_FOOTBALL_KEY
    if (!key) return { error: 'Football data not configured' }
    const next     = Math.min(args.next ?? 5, 10)
    let leagueId   = args.leagueId
    if (!leagueId && args.league) {
      const norm = args.league.toLowerCase()
      leagueId   = Object.entries(LEAGUE_ID_MAP).find(([k]) => norm.includes(k))?.[1]
    }
    const season = leagueId ? getSeasonForLeague(leagueId) : 2024
    const params = new URLSearchParams({ next: String(next), season: String(season), status: 'NS' })
    if (leagueId) params.append('league', String(leagueId))
    const data = await fetch(
      `https://v3.football.api-sports.io/fixtures?${params}`,
      { headers: { 'x-apisports-key': key } }
    ).then(r => r.json())
    if (!data.response?.length) return { league: args.league ?? 'Football', fixtures: [] }
    return {
      league: args.league ?? data.response[0]?.league?.name ?? 'Football',
      fixtures: data.response.slice(0, next).map((f: any) => ({
        match:    `${f.teams.home.name} vs ${f.teams.away.name}`,
        league:   f.league.name,
        date:     new Date(f.fixture.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        time:     new Date(f.fixture.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        venue:    f.fixture.venue?.name ?? 'TBC',
        city:     f.fixture.venue?.city ?? '',
        homeTeam: f.teams.home.name,
        awayTeam: f.teams.away.name,
        homeLogo: f.teams.home.logo,
        awayLogo: f.teams.away.logo,
      })),
    }
  } catch { return { error: 'Football fixtures unavailable' } }
}

const AIRPORTS: Record<string, any> = {
  JFK: {
    name: 'John F. Kennedy International Airport', city: 'New York',
    transport: { subway: 'AirTrain JFK to Jamaica or Howard Beach (E/J/Z/A lines) · $8.25', taxi: '$52–70 flat rate to Manhattan (30–60 min)', uber: 'Follow AirTrain to designated rideshare lot' },
    lounges: ['American Admirals Club (T8)', 'Delta Sky Club (T4)', 'JetBlue Mint Lounge (T5)'],
    tips: ['Allow 3+ hours for international departures', 'AirTrain connects all terminals', 'Cell signal patchy in underground sections'],
  },
  LHR: {
    name: 'Heathrow Airport', city: 'London',
    transport: { tube: 'Elizabeth Line or Piccadilly Line · £6–13 · 30–45 min', heathrowExpress: 'To Paddington · £25–37 · 15 min', taxi: 'Black cab approx £50–90 to central London' },
    lounges: ['British Airways Galleries (T5)', 'Virgin Atlantic Clubhouse (T3)', 'Plaza Premium (T2, T3)'],
    tips: ['T5 is BA only — confirm your terminal before travel', 'Allow 45+ min for security at peak times', 'Heathrow Express is fastest to Paddington'],
  },
  DXB: {
    name: 'Dubai International Airport', city: 'Dubai',
    transport: { metro: 'Dubai Metro Red Line · AED 9–14 · 30–35 min to city', taxi: 'AED 70–120 to city center', uber: 'Pickup from designated zones at each terminal' },
    lounges: ['Emirates First Class Lounge (T3)', 'Emirates Business Lounge (T3)', 'Marhaba Lounge (T1, T2, T3)'],
    tips: ['T3 is one of the largest terminals — allow extra walking time', 'Duty free is exceptional', 'Prayer rooms on every concourse'],
  },
  ORD: {
    name: "O'Hare International Airport", city: 'Chicago',
    transport: { train: 'CTA Blue Line direct to Loop · $5 · 45 min', taxi: '$40–55 to downtown', uber: 'Pickup from lower level, follow rideshare signs' },
    lounges: ['United Club (T1, T2)', 'American Admirals Club (T3)', 'Escape Lounge (T5)'],
    tips: ['Terminals 1–3 connected airside, T5 requires exiting security', 'Blue Line train runs 24/7'],
  },
  JNB: {
    name: 'O.R. Tambo International Airport', city: 'Johannesburg',
    transport: { gautrain: 'Gautrain to Sandton · R165 · 15 min — fastest option', taxi: 'Official Airport Taxis only — use the rank inside arrivals', uber: 'Pickup from designated Uber zone on arrivals level' },
    lounges: ['SLOW Lounge (Domestic A)', 'SLOW Lounge (International B)', 'British Airways Lounge (International)'],
    tips: ['Use Gautrain or pre-booked transport — avoid unofficial taxis', 'Uber is available but must be booked inside the terminal', 'Allow 2.5 hours for international departures'],
  },
  CPT: {
    name: 'Cape Town International Airport', city: 'Cape Town',
    transport: { taxi: 'Taxi recommended · R300–500 to city', uber: 'Pickup from designated zones outside arrivals', shuttles: 'Airport shuttle services to major hotels' },
    lounges: ['SLOW Lounge (Domestic)', 'SLOW Lounge (International)', 'British Airways Lounge (International)'],
    tips: ['Domestic and international are connected', 'Uber is reliable and affordable', 'Car rental desks in arrivals hall'],
  },
  CDG: {
    name: 'Charles de Gaulle Airport', city: 'Paris',
    transport: { rer: 'RER B to Paris city center · €11.45 · 25–35 min', taxi: '€55–70 fixed rate to left bank, €50–60 to right bank' },
    lounges: ['Air France Lounge (T2E, T2F)', 'Aspire Lounge (T1)', 'No.1 Traveller (T2E)'],
    tips: ['Terminal 2 is massive — allow 20+ min between gates', 'RER B can be unreliable — allow extra time'],
  },
  BCN: {
    name: 'Barcelona El Prat Airport', city: 'Barcelona',
    transport: { aerobus: 'Aerobus to Placa de Catalunya · €6.75 · 35 min', metro: 'Metro L9 to city · €5.15 · 35–45 min', taxi: '€35–45 to city center' },
    lounges: ['Sala VIP Pau Casals (T1)', 'Aspire Lounge (T1)'],
    tips: ['T1 and T2 are 15 min apart — confirm your terminal', 'Aerobus is most convenient for the city center'],
  },
}

function executeGetAirportInfo(args: { airport: string; query?: string; terminal?: string }) {
  const code    = args.airport.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)
  const airport = AIRPORTS[code] ?? null

  if (!airport) {
    return {
      airport:  args.airport,
      found:    false,
      guidance: [
        "Follow overhead signs — airports are well signposted by airline and terminal",
        'Rideshare pickup is usually signposted "TNC" or "Rideshare" in arrivals',
        'Ask any airport staff member for directions',
        'Use the airport official app or website for live gate assignments',
      ],
      uber: `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${encodeURIComponent(args.airport + ' Airport')}`,
      maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(args.airport + ' airport')}`,
    }
  }

  return {
    airport:   airport.name,
    city:      airport.city,
    found:     true,
    terminals: args.terminal
      ? [args.terminal]
      : undefined,
    transport: airport.transport,
    lounges:   airport.lounges,
    tips:      airport.tips,
    uberLink:  `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${encodeURIComponent(airport.name)}`,
    mapsLink:  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(airport.name)}`,
  }
}

async function executeTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'get_weather':             return executeWeather(args)
    case 'get_packing_list':        return executePackingList(args)
    case 'get_travel_tips':         return executeGetTravelTips(args)
    case 'check_flight_status':     return executeFlightStatus(args)
    case 'find_nearby_attractions': return executeFindNearbyAttractions(args)
    case 'find_football_fixtures':  return executeFindFootballFixtures(args)
    case 'get_airport_info':        return executeGetAirportInfo(args)
    default:                        return { error: `Unknown tool: ${name}` }
  }
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Gladys, an expert AI travel companion specialising in event-based travel. Warm, knowledgeable, direct.

Tools:
- get_weather: Live 7-day forecast for any city
- get_packing_list: Smart packing list by event type
- get_travel_tips: Insider tips, food, transport for any city
- check_flight_status: Real-time flight tracking by flight number
- find_nearby_attractions: Restaurants, bars, landmarks via Foursquare
- find_football_fixtures: Upcoming matches — Premier League, Champions League, World Cup 2026, La Liga, Bundesliga, Serie A, MLS, NWSL, WSL, and more
- get_airport_info: Airport navigation, transport options, lounges, Uber pickup zones

Rules:
- Football questions → ALWAYS call find_football_fixtures
- Weather questions → call get_weather
- Packing questions → call get_packing_list
- "What to do in [city]" → call find_nearby_attractions
- Travel tips → call get_travel_tips
- Flight number questions → call check_flight_status
- Airport questions → call get_airport_info

World Cup 2026: USA, Canada, Mexico. Season = 2026.`

// ── SSE helpers ───────────────────────────────────────────────────────────────

function sseChunk(obj: any) {
  return `data: ${JSON.stringify(obj)}\n\n`
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { message, history = [], context, userContext } = await req.json()
    if (!message?.trim()) return new Response('Message required', { status: 400 })

    const systemContent = userContext
      ? `${SYSTEM_PROMPT}\n\n${userContext}`
      : SYSTEM_PROMPT

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemContent },
      ...history.slice(-6),
      { role: 'user', content: message },
    ]

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: any) =>
          controller.enqueue(encoder.encode(sseChunk(obj)))

        try {
          // Step 1: check if a tool call is needed
          const first = await openai.chat.completions.create({
            model:       'gpt-4o-mini',
            max_tokens:  1000,
            tools,
            tool_choice: 'auto',
            messages,
          })

          const msg = first.choices[0].message

          if (msg.tool_calls?.length) {
            // ── Tool call path ──────────────────────────────────────────────
            const tc         = msg.tool_calls[0] as any
            const toolName   = tc.function.name as string
            const toolArgs   = JSON.parse(tc.function.arguments as string)

            // Signal to client that a tool is running (empty text chunk)
            send({ type: 'text', text: '' })

            // Execute the tool
            const toolResult = await executeTool(toolName, toolArgs)

            // Send the tool result to client so it can render the card
            send({ type: 'tool', toolName, toolResult })

            // Stream the final reply with tool context
            const streamReply = await openai.chat.completions.create({
              model:      'gpt-4o-mini',
              max_tokens: 600,
              stream:     true,
              messages: [
                ...messages,
                { role: 'assistant', content: null, tool_calls: msg.tool_calls },
                { role: 'tool', tool_call_id: tc.id, content: JSON.stringify(toolResult) },
              ],
            })

            for await (const chunk of streamReply) {
              const text = chunk.choices[0]?.delta?.content ?? ''
              if (text) send({ type: 'text', text })
            }

          } else {
            // ── Direct streaming reply ──────────────────────────────────────
            const streamReply = await openai.chat.completions.create({
              model:      'gpt-4o-mini',
              max_tokens: 600,
              stream:     true,
              messages,
            })

            for await (const chunk of streamReply) {
              const text = chunk.choices[0]?.delta?.content ?? ''
              if (text) send({ type: 'text', text })
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()

        } catch (err: any) {
          send({ type: 'text', text: "Sorry, hit a snag — try again!" })
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type':  'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection':    'keep-alive',
      },
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}