// app/api/gladys-chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

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

// ── Conversational fast-path ──────────────────────────────────────────────────

const CONVO_PATTERNS = [
  /^(hi|hey|hello|howdy|hiya|sup|yo|good\s?(morning|afternoon|evening|day))[!?.]*$/i,
  /^(what can you (do|help)|what are you|who are you|tell me about yourself)[?!.]*$/i,
  /^(thanks|thank you|thx|ty|cheers|great|awesome|nice|cool|perfect|got it|ok|okay|sure)[!.]*$/i,
  /^(bye|goodbye|see you|cya|later)[!.]*$/i,
]
const isConversational = (msg: string) =>
  CONVO_PATTERNS.some(p => p.test(msg.trim())) || msg.trim().length < 15

// ── Tools ─────────────────────────────────────────────────────────────────────

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  { type: 'function', function: { name: 'get_weather', description: 'Get current weather and 7-day forecast for a city', parameters: { type: 'object', properties: { city: { type: 'string' }, country: { type: 'string' } }, required: ['city'] } } },
  { type: 'function', function: { name: 'get_packing_list', description: 'Generate a smart packing list for a trip', parameters: { type: 'object', properties: { destination: { type: 'string' }, days: { type: 'number' }, eventType: { type: 'string', description: 'sports, music, festival, beach, city, ski' } }, required: ['destination', 'days'] } } },
  { type: 'function', function: { name: 'get_travel_tips', description: 'Get insider travel tips, must-dos, local food recommendations for a destination', parameters: { type: 'object', properties: { city: { type: 'string' }, country: { type: 'string' } }, required: ['city'] } } },
  { type: 'function', function: { name: 'check_flight_status', description: 'Check real-time flight status for a flight number', parameters: { type: 'object', properties: { flightNumber: { type: 'string', description: 'e.g. BA123, EK203, SA204' } }, required: ['flightNumber'] } } },
  { type: 'function', function: { name: 'find_nearby_attractions', description: 'Find restaurants, bars, landmarks, museums near a city', parameters: { type: 'object', properties: { city: { type: 'string' }, category: { type: 'string', enum: ['dining', 'nightlife', 'sights', 'outdoors', 'shopping', 'arts', 'all'] }, limit: { type: 'number' } }, required: ['city'] } } },
  {
    type: 'function',
    function: {
      name: 'find_football_fixtures',
      description: "Find upcoming football/soccer matches worldwide. Supports: Premier League, Champions League, World Cup 2026, La Liga, Bundesliga, Serie A, Ligue 1, MLS, NWSL, Women's Champions League, WSL, Copa America, AFCON, and more. Always use this for any football/soccer question.",
      parameters: {
        type: 'object',
        properties: {
          league:   { type: 'string', description: 'League or tournament e.g. "Premier League", "World Cup", "Champions League", "NWSL"' },
          team:     { type: 'string', description: 'Team name e.g. "Arsenal", "Real Madrid", "Portland Thorns"' },
          next:     { type: 'number', description: 'Number of fixtures (default 5, max 10)' },
          leagueId: { type: 'number', description: 'API-Football league ID if known' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_airport_info',
      description: 'Get airport navigation help — terminals, gates, lounges, transport to/from the airport, Uber/taxi pickup zones, security tips, and directions within the airport. Use when user asks about an airport, how to get somewhere from an airport, or needs directions inside an airport.',
      parameters: {
        type: 'object',
        properties: {
          airport:  { type: 'string', description: 'Airport name or IATA code e.g. "JFK", "Heathrow", "O\'Hare", "OR Tambo"' },
          query:    { type: 'string', description: 'What the user needs e.g. "Uber pickup", "Terminal 5 lounge", "gate directions", "transport to city center"' },
          terminal: { type: 'string', description: 'Specific terminal if known e.g. "Terminal 2", "International"' },
        },
        required: ['airport'],
      },
    },
  },
]

// ── Executors ─────────────────────────────────────────────────────────────────

async function executeWeather(args: { city: string; country?: string }) {
  try {
    const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(args.city)}&count=1&language=en&format=json`, { signal: AbortSignal.timeout(5000) }).then(r => r.json())
    if (!geo.results?.length) return { error: `City "${args.city}" not found` }
    const { latitude, longitude, name, country } = geo.results[0]
    const wx = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&current_weather=true&timezone=auto`, { signal: AbortSignal.timeout(5000) }).then(r => r.json())
    const codes: Record<number, string> = { 0: '☀️ Clear', 1: '🌤 Mostly clear', 2: '⛅ Partly cloudy', 3: '☁️ Overcast', 45: '🌫 Foggy', 51: '🌦 Drizzle', 61: '🌧 Rain', 71: '🌨 Snow', 80: '🌧 Showers', 95: '⛈ Thunderstorm' }
    const desc = (c: number) => codes[c] ?? '🌡 Unknown'
    return {
      city: name, country,
      today: { maxTemp: Math.round(wx.daily.temperature_2m_max[0]), minTemp: Math.round(wx.daily.temperature_2m_min[0]), code: wx.daily.weathercode[0], description: desc(wx.daily.weathercode[0]) },
      forecast: wx.daily.time.slice(0, 7).map((date: string, i: number) => ({ date, maxTemp: Math.round(wx.daily.temperature_2m_max[i]), minTemp: Math.round(wx.daily.temperature_2m_min[i]), code: wx.daily.weathercode[i], rain: wx.daily.precipitation_sum[i] })),
      summary: { advice: 'Check the forecast before packing — conditions can change quickly.' },
    }
  } catch { return { error: 'Weather service unavailable' } }
}

function executePackingList(args: { destination: string; days: number; eventType?: string }) {
  const base = ['Passport/ID', 'Phone + charger', 'Power bank', 'Travel insurance docs', 'Medications', 'Cash + cards']
  const clothes = [`${Math.ceil(args.days * 1.2)} t-shirts`, `${Math.ceil(args.days / 2)} trousers/jeans`, `${args.days} underwear/socks`, 'Light jacket or hoodie', 'Comfortable walking shoes']
  const eventExtras: Record<string, string[]> = {
    sports: ['Team jersey or fan gear', 'Comfortable trainers', 'Sunscreen', 'Portable seat cushion'],
    music: ['Earplugs', 'Comfortable shoes for standing', 'Light rain poncho', 'Small backpack'],
    festival: ['Tent/sleeping bag (if camping)', 'Wellies/waterproof shoes', 'Rain poncho', 'Reusable water bottle'],
    beach: ['Swimwear', 'Sunscreen SPF50+', 'Beach towel', 'Flip flops', 'Sunglasses'],
    city: ['City map/offline maps', 'Day bag', 'Umbrella', 'Smart outfit for restaurants'],
    ski: ['Ski jacket + trousers', 'Thermal base layers', 'Ski gloves', 'Goggles', 'Helmet'],
  }
  const extras = args.eventType ? (eventExtras[args.eventType] ?? eventExtras.city) : eventExtras.city
  return {
    destination: args.destination, days: args.days,
    totalItems: base.length + clothes.length + extras.length,
    packingList: [
      { category: 'Essentials',   items: base,    essential: true  },
      { category: 'Clothing',     items: clothes, essential: true  },
      { category: 'For the event', items: extras,  essential: false },
    ],
    proTips: ['Roll clothes to save space', 'Pack a collapsible bag for souvenirs'],
    weatherContext: { avgTemp: 20 },
  }
}

function executeTravelTips(args: { city: string }) {
  const tips: Record<string, any> = {
    'London':      { mustDo: ['Tower of London', 'Borough Market', 'Tate Modern', 'Notting Hill'], localFood: ['Fish & chips at a pub', 'Brick Lane curry', 'Borough Market street food'], watchOut: ['Pubs close at 11pm'] },
    'Paris':       { mustDo: ['Eiffel Tower (book online)', 'Louvre', 'Montmartre', 'Seine walk'], localFood: ['Croissant from a boulangerie', 'Steak frites', 'French onion soup'], watchOut: ['Book Eiffel Tower 2 months ahead'] },
    'New York':    { mustDo: ['High Line', 'Central Park', 'Brooklyn Bridge', 'Times Square'], localFood: ['NYC pizza slice', "Katz's Deli pastrami", 'Bagel with lox'], watchOut: ['Book restaurants ahead on weekends'] },
    'Los Angeles': { mustDo: ['Griffith Observatory', 'Venice Beach', 'Santa Monica Pier'], localFood: ['In-N-Out Burger', 'Tacos from a truck in East LA'], watchOut: ['Traffic is worst 7-9am and 4-7pm'] },
    'Dubai':       { mustDo: ['Burj Khalifa', 'Desert safari', 'Gold Souk'], localFood: ['Shawarma from Al Safadi', 'Fresh juice from Bur Dubai'], watchOut: ['Dress modestly outside resorts'] },
    'Madrid':      { mustDo: ['Prado Museum', 'Retiro Park', 'Bernabéu tour'], localFood: ['Bocadillo de calamares', 'Churros with chocolate'], watchOut: ['Dinner rarely before 9pm'] },
    'Barcelona':   { mustDo: ['Sagrada Família', 'Park Güell', 'Camp Nou'], localFood: ['Pan con tomate', 'Tapas at El Xampanyet'], watchOut: ['Pickpockets on Las Ramblas'] },
    'Munich':      { mustDo: ['Allianz Arena tour', 'Marienplatz', 'BMW Museum'], localFood: ['Weisswurst with pretzels', 'Beer at a Biergarten'], watchOut: ['Hotels book out during Oktoberfest'] },
    'Johannesburg':{ mustDo: ['Apartheid Museum', 'Soweto tour', 'Maboneng Precinct'], localFood: ['Bunny chow', 'Braai', 'Kota'], watchOut: ["Don't walk alone at night in the CBD"] },
  }
  const key = Object.keys(tips).find(k => args.city.toLowerCase().includes(k.toLowerCase()))
  return key
    ? { city: args.city, tips: tips[key], localEvents: [] }
    : { city: args.city, tips: { mustDo: ['Explore the city centre', 'Visit local markets', 'Try the local cuisine'], localFood: ['Ask locals for recommendations'], watchOut: ['Keep copies of your documents'] }, localEvents: [] }
}

async function executeFlightStatus(args: { flightNumber: string }) {
  try {
    const key = process.env.AVIATIONSTACK_API_KEY
    if (!key) return { error: 'Flight status service not configured' }
    const data = await fetch(`http://api.aviationstack.com/v1/flights?access_key=${key}&flight_iata=${args.flightNumber.toUpperCase()}&limit=1`, { signal: AbortSignal.timeout(5000) }).then(r => r.json())
    if (!data.data?.length) return { error: `No data found for flight ${args.flightNumber}` }
    const f = data.data[0]
    return {
      flightNumber: f.flight?.iata, airline: f.airline?.name, status: f.flight_status,
      departure: { airport: f.departure?.airport, iata: f.departure?.iata, scheduled: f.departure?.scheduled, estimated: f.departure?.estimated, gate: f.departure?.gate, delay: f.departure?.delay },
      arrival:   { airport: f.arrival?.airport,   iata: f.arrival?.iata,   scheduled: f.arrival?.scheduled,   estimated: f.arrival?.estimated,   gate: f.arrival?.gate },
      recoveryOptions: [],
    }
  } catch { return { error: 'Flight status service unavailable' } }
}

async function executeFindNearbyAttractions(args: { city: string; category?: string; limit?: number }) {
  try {
    const key = process.env.FOURSQUARE_API_KEY
    if (!key) return { error: 'Places service not configured' }
    const categoryMap: Record<string, string> = { dining: '13000', nightlife: '10032', sights: '16000', outdoors: '16000', shopping: '17000', arts: '10000', all: '' }
    const cat = args.category ?? 'all'
    const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(args.city)}&count=1&language=en&format=json`, { signal: AbortSignal.timeout(5000) }).then(r => r.json())
    if (!geo.results?.length) return { error: `City "${args.city}" not found` }
    const { latitude, longitude } = geo.results[0]
    const categoryId = categoryMap[cat] ?? ''
    const params = new URLSearchParams({ ll: `${latitude},${longitude}`, radius: '5000', limit: String(Math.min(args.limit ?? 8, 15)), sort: 'POPULARITY', ...(categoryId && { categories: categoryId }) })
    const fsData = await fetch(`https://api.foursquare.com/v3/places/search?${params}`, { headers: { Authorization: key, Accept: 'application/json' }, signal: AbortSignal.timeout(6000) }).then(r => r.json())
    if (!fsData.results?.length) return { city: args.city, places: [] }
    return {
      city: args.city, category: cat,
      places: fsData.results.map((p: any) => ({ name: p.name, category: p.categories?.[0]?.name ?? 'Place', address: p.location?.formatted_address ?? '', distance: p.distance ? `${(p.distance / 1000).toFixed(1)}km away` : '', rating: p.rating ? `${p.rating}/10` : null, link: `https://foursquare.com/v/${p.fsq_id}` })),
    }
  } catch { return { error: 'Places service unavailable' } }
}

async function executeFindFootballFixtures(args: { league?: string; team?: string; next?: number; leagueId?: number }) {
  try {
    const key = process.env.API_FOOTBALL_KEY
    if (!key) return { error: 'Football data service not configured' }

    const next     = Math.min(args.next ?? 5, 10)
    let leagueId   = args.leagueId
    if (!leagueId && args.league) {
      const norm = args.league.toLowerCase()
      leagueId   = Object.entries(LEAGUE_ID_MAP).find(([k]) => norm.includes(k))?.[1]
    }
    const season = leagueId ? getSeasonForLeague(leagueId) : 2024

    // Search by team name first if provided
    if (args.team && !leagueId) {
      try {
        const teamRes = await fetch(`https://v3.football.api-sports.io/teams?search=${encodeURIComponent(args.team)}`, { headers: { 'x-apisports-key': key }, signal: AbortSignal.timeout(6000) })
        if (teamRes.ok) {
          const teamData = await teamRes.json()
          const teamId   = teamData.response?.[0]?.team?.id
          if (teamId) {
            const fixRes = await fetch(`https://v3.football.api-sports.io/fixtures?team=${teamId}&next=${next}&status=NS`, { headers: { 'x-apisports-key': key }, signal: AbortSignal.timeout(8000) })
            if (fixRes.ok) {
              const fixData = await fixRes.json()
              if (fixData.response?.length) return formatFixtures(fixData.response, args.league ?? args.team ?? 'Football')
            }
          }
        }
      } catch {}
    }

    const params = new URLSearchParams({ next: String(next), season: String(season), status: 'NS' })
    if (leagueId) params.append('league', String(leagueId))

    const res  = await fetch(`https://v3.football.api-sports.io/fixtures?${params}`, { headers: { 'x-apisports-key': key }, signal: AbortSignal.timeout(8000) })
    const data = await res.json()

    if (!data.response?.length) return { league: args.league ?? 'Football', fixtures: [], message: `No upcoming fixtures found${args.league ? ` for ${args.league}` : ''}` }
    return formatFixtures(data.response, args.league ?? data.response[0]?.league?.name ?? 'Football')
  } catch { return { error: 'Football fixtures service unavailable' } }
}

function formatFixtures(response: any[], leagueName: string) {
  return {
    league: leagueName,
    fixtures: response.map((f: any) => ({
      match:    `${f.teams.home.name} vs ${f.teams.away.name}`,
      league:   f.league.name,
      date:     new Date(f.fixture.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      time:     new Date(f.fixture.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      venue:    f.fixture.venue?.name ?? 'TBC',
      city:     f.fixture.venue?.city ?? '',
      status:   f.fixture.status?.long ?? 'Scheduled',
      homeTeam: f.teams.home.name, awayTeam: f.teams.away.name,
      homeLogo: f.teams.home.logo, awayLogo: f.teams.away.logo,
    })),
  }
}

// ── Airport info ──────────────────────────────────────────────────────────────

// Comprehensive airport database
const AIRPORTS: Record<string, any> = {
  // ── USA ──
  JFK: {
    name: 'John F. Kennedy International Airport', city: 'New York',
    terminals: ['Terminal 1', 'Terminal 2', 'Terminal 4', 'Terminal 5', 'Terminal 7', 'Terminal 8'],
    transport: { subway: 'AirTrain JFK → Jamaica or Howard Beach (E/J/Z/A lines) · $8.25', taxi: '$52–70 flat rate to Manhattan (30–60 min)', uber: 'Pickup: Follow AirTrain to designated rideshare lot', bus: 'NYC Express Bus to Midtown · $19' },
    lounges: ['American Admirals Club (T8)', 'Delta Sky Club (T4)', 'JetBlue Mint Lounge (T5)', 'Priority Pass lounges in T1 and T4'],
    tips: ['Allow 3+ hours for international departures', 'Security longest at T4 during peak hours', 'AirTrain connects all terminals — use it instead of driving between terminals', 'Cell signal patchy in underground sections'],
  },
  LHR: {
    name: 'Heathrow Airport', city: 'London',
    terminals: ['Terminal 2 (Star Alliance)', 'Terminal 3 (Oneworld)', 'Terminal 4', 'Terminal 5 (British Airways)'],
    transport: { tube: 'Elizabeth Line or Piccadilly Line to central London · £6–13 · 30–45 min', heathrowExpress: 'Heathrow Express to Paddington · £25–37 · 15 min', taxi: 'Black cab ~£50–90 to central London', uber: 'Pickup from designated zones outside each terminal' },
    lounges: ['British Airways Galleries (T5)', 'Virgin Atlantic Clubhouse (T3)', 'No. 1 Traveller lounges (T2, T3)', 'Plaza Premium (T2, T3)'],
    tips: ['T5 is BA only — confirm your terminal before travel', 'Transfer between terminals via free inter-terminal train', 'Security can take 45+ min — arrive 3 hours early for international', 'Heathrow Express is fastest to Paddington'],
  },
  DXB: {
    name: 'Dubai International Airport', city: 'Dubai',
    terminals: ['Terminal 1 (non-Emirates)', 'Terminal 2 (flydubai)', 'Terminal 3 (Emirates)'],
    transport: { metro: 'Dubai Metro Red Line · Stations at T1 and T3 · AED 9–14 · 30–35 min to city', taxi: 'Dubai Taxi AED 70–120 to city center', uber: 'Pickup from designated zones at each terminal' },
    lounges: ['Emirates First Class Lounge (T3)', 'Emirates Business Lounge (T3)', 'Marhaba Lounge (T1, T2, T3)', 'Plaza Premium (T1)'],
    tips: ['T3 is one of the worlds largest terminals — allow extra walking time', 'Duty free is exceptional — budget time', 'Prayer rooms on every concourse', 'Airside transit hotel if you have a long layover'],
  },
  ORD: {
    name: "O'Hare International Airport", city: 'Chicago',
    terminals: ['Terminal 1 (United)', 'Terminal 2 (United domestic)', 'Terminal 3 (American)', 'Terminal 5 (International)'],
    transport: { train: 'CTA Blue Line direct to Loop · $5 · 45 min', taxi: '$40–55 to downtown', uber: 'Pickup from lower level, follow rideshare signs' },
    lounges: ['United Club (T1, T2)', 'American Admirals Club (T3)', 'Escape Lounge (T5)'],
    tips: ['Terminals 1-3 connected airside, T5 requires exiting security', 'O Hare can have extreme weather delays in winter', 'Blue Line train runs 24/7'],
  },
  CPT: {
    name: 'Cape Town International Airport', city: 'Cape Town',
    terminals: ['Domestic Terminal', 'International Terminal'],
    transport: { taxi: 'MyCiTi bus limited — taxi recommended · R300–500 to city', uber: 'Pickup from designated zones outside arrivals', shuttles: 'Airport shuttle services to major hotels' },
    lounges: ['SLOW Lounge (Domestic)', 'SLOW Lounge (International)', 'British Airways Lounge (International)'],
    tips: ['Domestic and international are connected', 'Uber is reliable and affordable', 'Car rental desks in arrivals hall'],
  },
  JNB: {
    name: 'O.R. Tambo International Airport', city: 'Johannesburg',
    terminals: ['Terminal A (Domestic)', 'Terminal B (International)', 'Terminal C (Regional Africa)'],
    transport: { gautrain: 'Gautrain to Sandton · R165 · 15 min (fastest option)', taxi: 'Official Airport Taxis only — pre-book or use the taxi rank inside arrivals', uber: 'Pickup from designated Uber zone on arrivals level' },
    lounges: ['SLOW Lounge (Domestic A)', 'SLOW Lounge (International B)', 'British Airways Lounge (International)'],
    tips: ['Use Gautrain or pre-booked transport — avoid unofficial taxis', 'Uber is available but must be booked inside the terminal', 'International and domestic terminals are connected airside', 'Allow 2.5 hours for international departures'],
  },
  CDG: {
    name: 'Charles de Gaulle Airport', city: 'Paris',
    terminals: ['Terminal 1', 'Terminal 2 (A-G)', 'Terminal 3'],
    transport: { rer: 'RER B to Paris city center · €11.45 · 25–35 min', taxi: '€55–70 fixed rate to left bank, €50–60 to right bank', uber: 'Pickup from designated zones' },
    lounges: ['Air France Lounge (T2E, T2F)', 'Aspire Lounge (T1, T2F)', 'No.1 Traveller (T2E)'],
    tips: ['Terminal 2 is massive — allow 20+ min to walk between gates', 'CDG Shuttle runs between terminals', 'RER B can be unreliable — allow extra time', 'T2G is the furthest — most budget airlines use it'],
  },
  BCN: {
    name: 'Barcelona El Prat Airport', city: 'Barcelona',
    terminals: ['Terminal 1 (major airlines)', 'Terminal 2 (low-cost)'],
    transport: { aerobus: 'Aerobus to Plaça de Catalunya · €6.75 · 35 min', metro: 'Metro L9 Sud to city · €5.15 · 35–45 min', taxi: '€35–45 to city center', uber: 'Available at T1' },
    lounges: ['Sala VIP Pau Casals (T1)', 'Aspire Lounge (T1)'],
    tips: ['T1 and T2 are 15 min apart — confirm your terminal', 'Aerobus is most convenient for the city center', 'Metro requires 2 transfers to reach the centre'],
  },
}

function executeGetAirportInfo(args: { airport: string; query?: string; terminal?: string }) {
  const code    = args.airport.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)
  const q       = (args.query ?? '').toLowerCase()
  const airport = AIRPORTS[code] ?? null

  // Build response even without full airport data
  const genericResponse = {
    airport:  args.airport,
    found:    false,
    query:    args.query,
    guidance: [
      `Search "${args.airport} airport map" for the official terminal map`,
      "Use the airport's official app if available for real-time gate info",
      'Rideshare pickup is usually signposted "TNC" or "Rideshare" in arrivals',
      "Ask airport information staff for directions — they're usually near baggage claim",
    ],
    uber:  `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${encodeURIComponent(args.airport + ' Airport')}`,
    maps:  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(args.airport + ' airport')}`,
  }

  if (!airport) return genericResponse

  // Filter response based on query intent
  const response: any = {
    airport:   airport.name,
    city:      airport.city,
    found:     true,
    terminals: args.terminal
      ? [airport.terminals.find((t: string) => t.toLowerCase().includes(args.terminal!.toLowerCase())) ?? args.terminal]
      : airport.terminals,
  }

  if (!q || q.includes('transport') || q.includes('get to') || q.includes('city') || q.includes('taxi') || q.includes('uber') || q.includes('train') || q.includes('subway') || q.includes('metro')) {
    response.transport = airport.transport
    response.uberLink  = `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${encodeURIComponent(airport.name)}`
  }
  if (!q || q.includes('lounge') || q.includes('vip') || q.includes('wait')) {
    response.lounges = airport.lounges
  }
  if (!q || q.includes('tip') || q.includes('advice') || q.includes('security') || q.includes('know')) {
    response.tips = airport.tips
  }
  if (q.includes('gate') || q.includes('direction') || q.includes('navigate') || q.includes('find')) {
    response.navigation = [
      'Follow overhead signs — airports are well-signposted',
      'Ask any airport staff member for directions',
      `Use the ${airport.name} official app or website for live gate assignments`,
      'Allow 10–15 min walking time between distant gates',
    ]
  }

  response.mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(airport.name)}`
  return response
}

async function executeTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'get_weather':             return executeWeather(args)
    case 'get_packing_list':        return executePackingList(args)
    case 'get_travel_tips':         return executeTravelTips(args)
    case 'check_flight_status':     return executeFlightStatus(args)
    case 'find_nearby_attractions': return executeFindNearbyAttractions(args)
    case 'find_football_fixtures':  return executeFindFootballFixtures(args)
    case 'get_airport_info':        return executeGetAirportInfo(args)
    default:                        return { error: `Unknown tool: ${name}` }
  }
}

const SYSTEM_PROMPT = `You are Gladys, an expert AI travel companion specialising in event-based travel — sports matches, concerts, and festivals. Warm, knowledgeable, direct.

Tools available:
- get_weather: Live 7-day forecast
- get_packing_list: Smart packing list by event type
- get_travel_tips: Insider tips, food, transport for any city
- check_flight_status: Real-time flight tracking
- find_nearby_attractions: Restaurants, bars, landmarks via Foursquare
- find_football_fixtures: Upcoming matches — Premier League, Champions League, World Cup 2026, La Liga, Bundesliga, Serie A, Ligue 1, MLS, NWSL, Women's UCL, and more

RULES:
- For ANY football/soccer question → ALWAYS call find_football_fixtures
- For "what to do in [city]" → call find_nearby_attractions
- For weather questions → call get_weather
- For packing questions → call get_packing_list
- Present max 5 fixtures clearly. After showing fixtures say "Tap any match to plan your trip"

World Cup 2026: USA, Canada, Mexico. Season = 2026. Venues: MetLife (NY/NJ), SoFi (LA), AT&T (Dallas), Levi's (SF), Azteca (Mexico City), BC Place (Vancouver).`

export async function POST(req: NextRequest) {
  try {
    const { message, history = [], context } = await req.json()
    if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 })

    if (isConversational(message)) {
      const quick = await openai.chat.completions.create({
        model: 'gpt-4o-mini', max_tokens: 200,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history.slice(-4), { role: 'user', content: message }],
      })
      return NextResponse.json({ reply: quick.choices[0].message.content ?? 'How can I help with your trip?', toolName: null, toolResult: null })
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-6),
      { role: 'user', content: message },
    ]

    const first = await openai.chat.completions.create({ model: 'gpt-4o-mini', max_tokens: 1000, tools, tool_choice: 'auto', messages })
    const msg   = first.choices[0].message

    if (!msg.tool_calls?.length) {
      return NextResponse.json({ reply: msg.content ?? "I'm not sure about that — try asking about a specific city or event!", toolName: null, toolResult: null })
    }

    const tc         = msg.tool_calls[0] as any
    const toolName   = tc.function.name as string
    const toolArgs   = JSON.parse(tc.function.arguments as string)
    const toolResult = await executeTool(toolName, toolArgs)

    const final = await openai.chat.completions.create({
      model: 'gpt-4o-mini', max_tokens: 800,
      messages: [...messages, { role: 'assistant', content: null, tool_calls: msg.tool_calls }, { role: 'tool', tool_call_id: tc.id, content: JSON.stringify(toolResult) }],
    })

    return NextResponse.json({ reply: final.choices[0].message.content ?? 'Here is what I found!', toolName, toolResult })
  } catch (err: any) {
    console.error('[gladys-chat] error:', err)
    return NextResponse.json({ error: err.message ?? 'Something went wrong' }, { status: 500 })
  }
}