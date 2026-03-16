// app/api/gladys-chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ─── Conversational fast-path ─────────────────────────────────────────────────

const CONVERSATIONAL_PATTERNS = [
  /^(hi|hey|hello|howdy|hiya|sup|yo|good\s?(morning|afternoon|evening|day))[!?.]*$/i,
  /^(what can you (do|help)|what are you|who are you|tell me about yourself)[?!.]*$/i,
  /^(thanks|thank you|thx|ty|cheers|great|awesome|nice|cool|perfect|got it|ok|okay|sure|sounds good)[!.]*$/i,
  /^(bye|goodbye|see you|cya|later)[!.]*$/i,
]
function isConversational(msg: string): boolean {
  const t = msg.trim()
  return CONVERSATIONAL_PATTERNS.some(p => p.test(t)) || t.length < 15
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get current weather and 7-day forecast for a city',
      parameters: {
        type: 'object',
        properties: {
          city:    { type: 'string' },
          country: { type: 'string', description: 'Country code e.g. US, GB, ZA' },
        },
        required: ['city'],
      },
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
      description: 'Get insider travel tips, must-dos, local food recommendations for a destination',
      parameters: {
        type: 'object',
        properties: {
          city:    { type: 'string' },
          country: { type: 'string' },
        },
        required: ['city'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_flight_status',
      description: 'Check real-time flight status for a flight number',
      parameters: {
        type: 'object',
        properties: {
          flightNumber: { type: 'string', description: 'e.g. BA123, EK203, SA204' },
        },
        required: ['flightNumber'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_nearby_attractions',
      description: 'Find restaurants, bars, landmarks, museums, and things to do near a city or venue — perfect for exploring a destination around an event',
      parameters: {
        type: 'object',
        properties: {
          city:     { type: 'string', description: 'City name e.g. Los Angeles, Paris, Johannesburg' },
          category: {
            type: 'string',
            description: 'Type of place: dining, nightlife, sights, outdoors, shopping, arts, all',
            enum: ['dining', 'nightlife', 'sights', 'outdoors', 'shopping', 'arts', 'all'],
          },
          limit: { type: 'number', description: 'Number of results (default 8, max 15)' },
        },
        required: ['city'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_football_fixtures',
      description: 'Find upcoming football (soccer) matches and fixtures — leagues, teams, World Cup, Champions League, etc.',
      parameters: {
        type: 'object',
        properties: {
          league:   { type: 'string', description: 'League name or tournament e.g. "Premier League", "World Cup", "Champions League", "La Liga"' },
          team:     { type: 'string', description: 'Team name e.g. "Manchester United", "Real Madrid"' },
          next:     { type: 'number', description: 'Number of next fixtures to return (default 5)' },
          leagueId: { type: 'number', description: 'API-Football league ID if known' },
        },
      },
    },
  },
]

// ─── TOOL EXECUTORS ───────────────────────────────────────────────────────────

// Weather — Open-Meteo (free, no key)
async function executeWeather(args: { city: string; country?: string }) {
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(args.city)}&count=1&language=en&format=json`
    const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(5000) })
    const geo    = await geoRes.json()
    if (!geo.results?.length) return { error: `City "${args.city}" not found` }

    const { latitude, longitude, name, country } = geo.results[0]
    const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&current_weather=true&timezone=auto`
    const wxRes = await fetch(wxUrl, { signal: AbortSignal.timeout(5000) })
    const wx    = await wxRes.json()

    const codes: Record<number, string> = {
      0: '☀️ Clear', 1: '🌤 Mostly clear', 2: '⛅ Partly cloudy', 3: '☁️ Overcast',
      45: '🌫 Foggy', 51: '🌦 Drizzle', 61: '🌧 Rain', 71: '🌨 Snow', 80: '🌧 Showers',
      95: '⛈ Thunderstorm',
    }
    const desc = (c: number) => codes[c] ?? '🌡 Unknown'

    return {
      city: name, country,
      current: {
        temp:      Math.round(wx.current_weather.temperature),
        windspeed: Math.round(wx.current_weather.windspeed),
        condition: desc(wx.current_weather.weathercode),
      },
      forecast: wx.daily.time.slice(0, 7).map((date: string, i: number) => ({
        date,
        high:      Math.round(wx.daily.temperature_2m_max[i]),
        low:       Math.round(wx.daily.temperature_2m_min[i]),
        rain:      wx.daily.precipitation_sum[i],
        condition: desc(wx.daily.weathercode[i]),
      })),
    }
  } catch (e) {
    return { error: 'Weather service unavailable' }
  }
}

// Packing list — static, fast
function executePackingList(args: { destination: string; days: number; eventType?: string }) {
  const base    = ['Passport/ID', 'Phone + charger', 'Power bank', 'Travel insurance docs', 'Medications', 'Cash + cards']
  const clothes = [`${Math.ceil(args.days * 1.2)} t-shirts`, `${Math.ceil(args.days / 2)} trousers/jeans`, `${args.days} underwear/socks`, 'Light jacket or hoodie', 'Comfortable walking shoes']
  const event: Record<string, string[]> = {
    sports:   ['Team jersey or fan gear', 'Comfortable trainers', 'Sunscreen', 'Portable seat cushion', 'Binoculars (optional)'],
    music:    ['Earplugs', 'Comfortable shoes for standing', 'Light rain poncho', 'Portable phone charger', 'Small backpack'],
    festival: ['Tent/sleeping bag (if camping)', 'Wellies/waterproof shoes', 'Rain poncho', 'Reusable water bottle', 'Sunhat + sunscreen'],
    beach:    ['Swimwear', 'Sunscreen SPF50+', 'Beach towel', 'Flip flops', 'Sunglasses', 'Reef shoes'],
    city:     ['City map/offline maps', 'Day bag', 'Comfortable walking shoes', 'Umbrella', 'Smart outfit for restaurants'],
    ski:      ['Ski jacket + trousers', 'Thermal base layers', 'Ski gloves', 'Goggles', 'Helmet', 'Lip balm + sunscreen'],
  }
  const extras = args.eventType ? (event[args.eventType] ?? event.city) : event.city
  return { destination: args.destination, days: args.days, items: { essentials: base, clothing: clothes, eventSpecific: extras } }
}

// Travel tips — static, sync
function executeTravelTips(args: { city: string; country?: string }) {
  const tips: Record<string, any> = {
    'Los Angeles': {
      mustDo:    ['Walk the Hollywood Walk of Fame', 'Visit Griffith Observatory for city views', 'Explore Venice Beach boardwalk', 'Day trip to Santa Monica Pier'],
      food:      ['In-N-Out Burger', 'Grand Central Market downtown', 'Roscoe\'s Chicken & Waffles', 'Tacos from a truck in East LA'],
      transport: 'Rent a car or use Uber — LA is huge and public transit is limited',
      tips:      ['Book event parking in advance', 'Traffic is worst 7-9am and 4-7pm', 'Bring sunscreen year-round'],
    },
    'New York': {
      mustDo:    ['Walk the High Line', 'Visit Central Park', 'Brooklyn Bridge walk', 'Times Square at night'],
      food:      ['NYC pizza slice', 'Bagel with lox', 'Katz\'s Deli pastrami', 'Food trucks in Midtown'],
      transport: 'Use the subway — cheap and goes everywhere. Get a MetroCard.',
      tips:      ['Book restaurants ahead', 'Most museums are free on Friday evenings', 'Walk between attractions when possible'],
    },
    'London': {
      mustDo:    ['Tower of London', 'Buckingham Palace', 'Borough Market', 'Wembley Stadium tour'],
      food:      ['Fish & chips at a pub', 'Brick Lane curry', 'Afternoon tea', 'Borough Market street food'],
      transport: 'Use the Tube — get an Oyster card. Contactless bank cards also work.',
      tips:      ['Museums are free', 'Pubs close at 11pm', 'Tip 10-15% at restaurants'],
    },
    'Paris': {
      mustDo:    ['Eiffel Tower (book online)', 'Louvre Museum', 'Walk along the Seine', 'Montmartre neighbourhood'],
      food:      ['Croissant from a local boulangerie', 'Steak frites', 'French onion soup', 'Crêpes from a street vendor'],
      transport: 'Metro is excellent. Buy a carnet of 10 tickets for savings.',
      tips:      ['Many restaurants closed Sunday', 'Learn a few French phrases', 'Book Eiffel Tower 2 months ahead'],
    },
    'Dubai': {
      mustDo:    ['Burj Khalifa observation deck', 'Dubai Mall', 'Desert safari', 'Gold & Spice Souks'],
      food:      ['Shawarma from Al Safadi', 'Dubai-style camel burger', 'Breakfast at a rooftop café', 'Fresh juice from Bur Dubai'],
      transport: 'Metro is clean and cheap. Taxis are metered and affordable.',
      tips:      ['Dress modestly outside resorts', 'Alcohol only at licensed venues', 'Summer (Jun-Sep) is extremely hot'],
    },
    'Johannesburg': {
      mustDo:    ['Apartheid Museum', 'Soweto tour', 'Constitution Hill', 'Maboneng Precinct'],
      food:      ['Bunny chow', 'Braai (South African BBQ)', 'Kotas from a kota shop', 'Pap and boerewors'],
      transport: 'Rent a car or use Uber — public transport is limited in JHB.',
      tips:      ['Stay in Sandton, Rosebank or Maboneng', 'Don\'t walk alone at night in the CBD', 'Tap water is safe to drink'],
    },
  }

  const cityKey = Object.keys(tips).find(k => args.city.toLowerCase().includes(k.toLowerCase()))
  if (cityKey) return { city: args.city, ...tips[cityKey] }

  return {
    city: args.city,
    mustDo:    ['Explore the city centre', 'Visit local markets', 'Try the local cuisine', 'Check for guided tours'],
    food:      ['Ask locals for restaurant recommendations', 'Try street food safely', 'Look for markets and food halls'],
    transport: 'Research local transport options before arrival — check if a travel card is available.',
    tips:      ['Keep copies of your documents', 'Buy a local SIM card on arrival', 'Notify your bank before travelling'],
  }
}

// Flight status — AviationStack
async function executeFlightStatus(args: { flightNumber: string }) {
  try {
    const key = process.env.AVIATIONSTACK_API_KEY
    if (!key) return { error: 'Flight status service not configured' }
    const url = `http://api.aviationstack.com/v1/flights?access_key=${key}&flight_iata=${args.flightNumber.toUpperCase()}&limit=1`
    const res  = await fetch(url, { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    if (!data.data?.length) return { error: `No data found for flight ${args.flightNumber}` }
    const f = data.data[0]
    return {
      flight:      f.flight?.iata,
      airline:     f.airline?.name,
      status:      f.flight_status,
      departure: { airport: f.departure?.airport, scheduled: f.departure?.scheduled, actual: f.departure?.actual, terminal: f.departure?.terminal, gate: f.departure?.gate },
      arrival:   { airport: f.arrival?.airport,   scheduled: f.arrival?.scheduled,   actual: f.arrival?.actual,   terminal: f.arrival?.terminal,   gate: f.arrival?.gate   },
      delay:       f.departure?.delay ? `${f.departure.delay} min delay` : 'On time',
    }
  } catch {
    return { error: 'Flight status service unavailable' }
  }
}

// Foursquare nearby attractions
async function executeFindNearbyAttractions(args: { city: string; category?: string; limit?: number }) {
  try {
    const key = process.env.FOURSQUARE_API_KEY
    if (!key) return { error: 'Places service not configured' }

    // Category IDs for Foursquare v3
    const categoryMap: Record<string, string> = {
      dining:    '13000', // Food & Drink
      nightlife: '10032', // Nightlife
      sights:    '16000', // Landmarks & Outdoors
      outdoors:  '16000', // Landmarks & Outdoors
      shopping:  '17000', // Retail
      arts:      '10000', // Arts & Entertainment
      all:       '',
    }
    const cat = args.category ?? 'all'
    const categoryId = categoryMap[cat] ?? ''

    // First geocode the city using Open-Meteo (free)
    const geoRes  = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(args.city)}&count=1&language=en&format=json`,
      { signal: AbortSignal.timeout(5000) }
    )
    const geo = await geoRes.json()
    if (!geo.results?.length) return { error: `City "${args.city}" not found` }
    const { latitude, longitude } = geo.results[0]

    const limit  = Math.min(args.limit ?? 8, 15)
    const params = new URLSearchParams({
      ll:     `${latitude},${longitude}`,
      radius: '5000',
      limit:  String(limit),
      sort:   'POPULARITY',
      ...(categoryId && { categories: categoryId }),
    })

    const fsRes = await fetch(`https://api.foursquare.com/v3/places/search?${params}`, {
      headers: { Authorization: key, Accept: 'application/json' },
      signal:  AbortSignal.timeout(6000),
    })
    const fsData = await fsRes.json()

    if (!fsData.results?.length) return { city: args.city, places: [], message: 'No places found for this location' }

    const places = fsData.results.map((p: any) => ({
      name:     p.name,
      category: p.categories?.[0]?.name ?? 'Place',
      address:  p.location?.formatted_address ?? p.location?.address ?? '',
      distance: p.distance ? `${(p.distance / 1000).toFixed(1)}km away` : '',
      rating:   p.rating ? `${p.rating}/10` : null,
      link:     `https://foursquare.com/v/${p.fsq_id}`,
    }))

    return { city: args.city, category: cat, places }
  } catch (e) {
    return { error: 'Places service unavailable' }
  }
}

// API-Football fixtures
async function executeFindFootballFixtures(args: { league?: string; team?: string; next?: number; leagueId?: number }) {
  try {
    const key = process.env.API_FOOTBALL_KEY
    if (!key) return { error: 'Football data service not configured' }

    const next = args.next ?? 5

    // Map common league names to API-Football IDs
    const leagueIdMap: Record<string, number> = {
      'premier league':      39,
      'la liga':             140,
      'bundesliga':          78,
      'serie a':             135,
      'ligue 1':             61,
      'champions league':    2,
      'europa league':       3,
      'world cup':           1,
      'world cup 2026':      1,
      'mls':                 253,
      'eredivisie':          88,
      'liga portugal':       94,
      'super lig':           203,
      'african nations':     6,
      'afcon':               6,
      'copa america':        9,
      'euros':               4,
      'euro':                4,
    }

    let leagueId = args.leagueId
    if (!leagueId && args.league) {
      const normalized = args.league.toLowerCase()
      leagueId = Object.entries(leagueIdMap).find(([k]) => normalized.includes(k))?.[1]
    }

    const params = new URLSearchParams({ next: String(next) })
    if (leagueId)  params.append('league', String(leagueId))
    if (args.team) params.append('team',   args.team)
    // Current season
    params.append('season', '2024')

    const res  = await fetch(`https://v3.football.api-sports.io/fixtures?${params}`, {
      headers: {
        'x-apisports-key': key,
        'x-rapidapi-key':  key,
      },
      signal: AbortSignal.timeout(8000),
    })
    const data = await res.json()

    if (!data.response?.length) {
      return {
        league: args.league ?? 'Football',
        fixtures: [],
        message: `No upcoming fixtures found${args.league ? ` for ${args.league}` : ''}`,
      }
    }

    const fixtures = data.response.slice(0, next).map((f: any) => ({
      match:       `${f.teams.home.name} vs ${f.teams.away.name}`,
      league:      f.league.name,
      date:        new Date(f.fixture.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      time:        new Date(f.fixture.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      venue:       f.fixture.venue?.name ?? 'TBC',
      city:        f.fixture.venue?.city ?? '',
      status:      f.fixture.status?.long ?? 'Scheduled',
      homeTeam:    f.teams.home.name,
      awayTeam:    f.teams.away.name,
      homeLogo:    f.teams.home.logo,
      awayLogo:    f.teams.away.logo,
    }))

    return { league: args.league ?? data.response[0]?.league?.name, fixtures }
  } catch (e) {
    return { error: 'Football fixtures service unavailable' }
  }
}

// ─── TOOL ROUTER ──────────────────────────────────────────────────────────────

async function executeTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'get_weather':               return executeWeather(args)
    case 'get_packing_list':          return executePackingList(args)
    case 'get_travel_tips':           return executeTravelTips(args)
    case 'check_flight_status':       return executeFlightStatus(args)
    case 'find_nearby_attractions':   return executeFindNearbyAttractions(args)
    case 'find_football_fixtures':    return executeFindFootballFixtures(args)
    default:                          return { error: `Unknown tool: ${name}` }
  }
}

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Gladys, an expert AI travel companion specialising in event-based travel — sports matches, concerts, and festivals. You are warm, knowledgeable, and direct.

You have 6 tools:
- get_weather: Live 7-day forecast for any city
- get_packing_list: Smart packing list tailored to event type
- get_travel_tips: Insider tips, food, transport for any city
- check_flight_status: Real-time flight tracking
- find_nearby_attractions: Restaurants, bars, landmarks near any city via Foursquare
- find_football_fixtures: Upcoming football/soccer matches worldwide (Premier League, World Cup, Champions League, etc.)

Use tools proactively when the user's question clearly benefits from live data. For football questions, always use find_football_fixtures. For "what to do in [city]" always use find_nearby_attractions. For weather questions always use get_weather.

When presenting tool results: be concise, highlight the most useful 3-5 items, and always add a helpful travel insight. Never dump raw data — curate it.

The FIFA World Cup 2026 is hosted across the USA, Canada, and Mexico. Key venues: MetLife Stadium (NY/NJ), SoFi Stadium (LA), AT&T Stadium (Dallas), Levi's Stadium (San Francisco), Estadio Azteca (Mexico City), BC Place (Vancouver).`

// ─── ROUTE HANDLER ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json()
    if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 })

    // Fast path for conversational messages
    if (isConversational(message)) {
      const quick = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 200,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history.slice(-4),
          { role: 'user', content: message },
        ],
      })
      return NextResponse.json({ reply: quick.choices[0].message.content ?? 'How can I help with your trip?', toolName: null, toolResult: null })
    }

    // Tool-aware completion
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-6),
      { role: 'user', content: message },
    ]

    const first = await openai.chat.completions.create({
      model:       'gpt-4o-mini',
      max_tokens:  1000,
      tools,
      tool_choice: 'auto',
      messages,
    })

    const msg = first.choices[0].message

    // No tool call — return direct reply
    if (!msg.tool_calls?.length) {
      return NextResponse.json({ reply: msg.content ?? "I'm not sure about that — try asking about a specific city or event!", toolName: null, toolResult: null })
    }

    // Execute the first tool call
    const tc         = msg.tool_calls[0] as any
    const toolName   = (tc as any).function.name as string
    const toolArgs   = JSON.parse((tc as any).function.arguments as string)
    const toolResult = await executeTool(toolName, toolArgs)

    // Final reply with tool result in context
    const final = await openai.chat.completions.create({
      model:      'gpt-4o-mini',
      max_tokens: 800,
      messages: [
        ...messages,
        { role: 'assistant', content: null, tool_calls: msg.tool_calls },
        {
          role:         'tool',
          tool_call_id: tc.id,
          content:      JSON.stringify(toolResult),
        },
      ],
    })

    return NextResponse.json({
      reply:      final.choices[0].message.content ?? 'Here is what I found!',
      toolName,
      toolResult,
    })
  } catch (err: any) {
    console.error('[gladys-chat] error:', err)
    return NextResponse.json({ error: err.message ?? 'Something went wrong' }, { status: 500 })
  }
}