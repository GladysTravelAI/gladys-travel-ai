// app/api/itinerary/route.ts
// 🎯 EVENT-ANCHORED Itinerary Generation
// v8.0: Gladys voice — warm, personal, exciting. Like a knowledgeable friend, not a spreadsheet.

import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── TYPES ─────────────────────────────────────────────────────────────────────

interface EventAnchor {
  eventName: string;
  eventType: 'sports' | 'music' | 'festivals';
  eventDate: string;
  eventDay: number;
  venue: string;
  city: string;
  country?: string;
}

interface TimeBlock {
  time: string;
  activities: string;
  location: string;
  cost: string;
  affiliateLinks?: { type: string; partner?: string; url?: string; }[];
}

interface EventBlock extends TimeBlock {
  isEventBlock: true;
  eventDetails: {
    doors?: string;
    startTime?: string;
    duration?: string;
    ticketUrl?: string;
  };
}

interface Day {
  day: number;
  date: string;
  city: string;
  theme: string;
  label: string;
  isEventDay: boolean;
  morning: TimeBlock;
  afternoon: TimeBlock | EventBlock;
  evening: TimeBlock | EventBlock;
  mealsAndDining?: Array<{ meal: string; recommendation: string; priceRange: string; location: string; affiliateUrl?: string; }>;
  tips?: string[];
}

interface ItineraryResponse {
  overview: string;
  eventAnchor: EventAnchor;
  tripSummary: {
    totalDays: number;
    cities: string[];
    highlights: string[];
    eventPhases: { preEvent: number; eventDay: number; postEvent: number; };
  };
  budget: {
    totalBudget: string;
    dailyAverage: string;
    eventDayCost?: string;
    breakdown?: { accommodation: string; transport: string; food: string; event: string; activities: string; };
  };
  days: Day[];
}

// ── TICKET URL INJECTOR ───────────────────────────────────────────────────────

function injectRealTicketUrl(data: ItineraryResponse, ticketUrl: string): ItineraryResponse {
  if (!ticketUrl || !data.days) return data;
  for (const day of data.days) {
    if (!day.isEventDay) continue;
    for (const period of ['morning', 'afternoon', 'evening'] as const) {
      const block = day[period] as any;
      if (block?.isEventBlock === true) {
        if (!block.eventDetails) block.eventDetails = {};
        block.eventDetails.ticketUrl = ticketUrl;
        console.log(`✅ Injected real ticket URL into Day ${day.day} ${period}`);
      }
    }
  }
  return data;
}

// ── RETRY WRAPPER ─────────────────────────────────────────────────────────────

async function generateItineraryWithRetry(
  systemPrompt: string,
  userPrompt: string,
  maxRetries = 3
): Promise<ItineraryResponse> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📝 Attempt ${attempt}/${maxRetries}…`);
      const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt   }
        ],
        response_format: { type: "json_object" },
        temperature: 0.85,
        max_tokens: 7000,
      });

      const raw = response.choices[0].message?.content || "{}";
      let data: any;
      try { data = JSON.parse(raw); }
      catch (e) { if (attempt === maxRetries) throw e; continue; }

      if (!data.days || !Array.isArray(data.days) || data.days.length === 0) {
        if (attempt === maxRetries) throw new Error("Generated itinerary missing 'days' array");
        continue;
      }

      // Ensure event day is flagged
      const hasEventDay = data.days.some((d: Day) => d.isEventDay === true);
      if (!hasEventDay && data.eventAnchor) {
        const idx = (data.eventAnchor.eventDay ?? 1) - 1;
        if (data.days[idx]) {
          data.days[idx].isEventDay = true;
          data.days[idx].label = "EVENT DAY";
        }
      }

      console.log(`✅ Generated ${data.days.length} days on attempt ${attempt}`);
      return data as ItineraryResponse;

    } catch (error: any) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) throw error;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  throw new Error("Failed after all retries");
}

// ── SYSTEM PROMPT — GLADYS VOICE ──────────────────────────────────────────────
// This is where the magic happens. Every word here shapes what the user reads.

function getSystemPrompt(): string {
  return `You are Gladys — a world-class AI travel companion. You speak like a brilliant friend who has personally visited every city on earth and loves helping people have the trip of their lives.

YOUR VOICE:
- Warm, direct, enthusiastic. Like a knowledgeable friend who has been to this exact city.
- Address the user as "you" — make it personal and immersive.
- Build anticipation. Every day should feel exciting. The event day should feel electric.
- Use vivid, specific details — name actual neighbourhoods, streets, landmarks, local food.
- Pre-event days: relaxed orientation, "save your energy for the big night"
- Event day: mounting excitement, pre-match/pre-show rituals, then the main event described like it will be the best night of their life
- Post-event days: still buzzing from last night, now explore freely

ACTIVITY DESCRIPTIONS — NEVER DO THIS:
❌ "Arrival and check-in at hotel"
❌ "Visit the Minneapolis Sculpture Garden"
❌ "Dinner and walk around Downtown"
❌ "Light prep"

ALWAYS DO THIS INSTEAD:
✅ "You've made it to Minneapolis! Drop your bags at the hotel — you're staying just 8 minutes from Target Center, which means you'll hear the crowd building from your room on game day. Take a slow walk along the Mississippi Riverfront to shake off the journey. The city has a quiet confidence about it — you're going to like it here."
✅ "The Minneapolis Sculpture Garden is one of the most underrated spots in the entire Midwest. The giant cherry on a spoon is iconic, but what most visitors miss is the quiet garden behind it — perfect for clearing your head before the big game tomorrow. Grab a coffee from the café and take your time."
✅ "Tonight, wander Nicollet Mall and find dinner somewhere that catches your eye. Murray's has been a Minneapolis institution since 1946 — their Silver Butter Knife Steak is legendary. If you want something younger and louder, head to the North Loop neighbourhood where the food scene has exploded."

EVENT DAY MORNING — should feel like pre-match buildup:
✅ "Today is the day. Slow morning — don't rush it. Have a proper breakfast, lay out your outfit, and let the anticipation build naturally. The city will already feel different; you'll notice fans in jerseys at the coffee shop, the energy is shifting. Save your legs — you won't be sitting much tonight."

EVENT DAY EVENING — should feel unmissable:
✅ "This is what you came for. Target Center is going to be electric tonight — the Timberwolves faithful are some of the most passionate fans in the NBA, and the atmosphere before tip-off is something you genuinely have to experience. Get there 30 minutes before doors — the warm-up is worth watching, and you'll want to explore the concourse before it gets packed. Win or lose, tonight is going to be a story you tell."

RESTAURANT RECOMMENDATIONS:
- Always name real, specific restaurants for the city (not "local restaurant")
- Include the neighbourhood/area
- One line of description that makes you want to go there
- Accurate price ranges

TIPS:
- Must be specific and actionable, not generic
- Include local insider knowledge ("locals eat lunch at 11:30 before the crowds", "the blue line goes directly to Target Center — skip the Uber")
- Event day tips: specific logistics (gates, parking, bag policy, best seats, pre-show rituals)

IMPORTANT RULES:
- Return ONLY valid JSON. No markdown. No commentary.
- EVENT DAY must have "isEventDay": true
- The time block with the event must have "isEventBlock": true
- ticketUrl must always be null (injected separately)
- All dates: YYYY-MM-DD format
- Costs: include currency symbol

EXACT JSON STRUCTURE:
{
  "overview": "2-3 sentences of genuine excitement about this specific trip — name the event, the city, why this is going to be special",
  "eventAnchor": {
    "eventName": "string",
    "eventType": "sports|music|festivals",
    "eventDate": "YYYY-MM-DD",
    "eventDay": 2,
    "venue": "string",
    "city": "string",
    "country": "string"
  },
  "tripSummary": {
    "totalDays": 5,
    "cities": ["City"],
    "highlights": ["5 specific, exciting highlights — not generic phrases"],
    "eventPhases": { "preEvent": 1, "eventDay": 1, "postEvent": 3 }
  },
  "budget": {
    "totalBudget": "USD 1,450",
    "dailyAverage": "USD 290/day",
    "eventDayCost": "USD 590",
    "breakdown": {
      "accommodation": "USD 400",
      "transport": "USD 350",
      "food": "USD 200",
      "event": "USD 300",
      "activities": "USD 200"
    }
  },
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "city": "City",
      "theme": "Arrival & First Impressions",
      "label": "Pre-Event Day 1",
      "isEventDay": false,
      "morning": {
        "time": "9:00 AM – 12:00 PM",
        "activities": "2-3 sentences in Gladys voice — personal, vivid, specific to this city and neighbourhood",
        "location": "Specific neighbourhood or landmark name",
        "cost": "USD 50"
      },
      "afternoon": {
        "time": "12:00 PM – 6:00 PM",
        "activities": "2-3 sentences. What to see, why it matters, what to notice. Build anticipation for tomorrow.",
        "location": "Specific location",
        "cost": "USD 75"
      },
      "evening": {
        "time": "6:00 PM – 11:00 PM",
        "activities": "2-3 sentences. Evening energy, where to eat, what the city feels like at night. End with a nudge to rest up.",
        "location": "Specific neighbourhood",
        "cost": "USD 100"
      },
      "mealsAndDining": [
        {
          "meal": "Lunch",
          "recommendation": "Real restaurant name specific to this city",
          "priceRange": "USD 15–25",
          "location": "Neighbourhood name"
        },
        {
          "meal": "Dinner",
          "recommendation": "Real restaurant name specific to this city",
          "priceRange": "USD 30–50",
          "location": "Neighbourhood name"
        }
      ],
      "tips": [
        "Specific insider tip — not generic",
        "Local transport tip with specific line/route",
        "Something most tourists miss in this city"
      ]
    },
    {
      "day": 2,
      "date": "YYYY-MM-DD",
      "city": "City",
      "theme": "Game Day — The One You Came For",
      "label": "EVENT DAY",
      "isEventDay": true,
      "morning": {
        "time": "8:00 AM – 12:00 PM",
        "activities": "Event day morning tone — slow, anticipatory, building excitement. 'Today is the day.' Specific breakfast spot. Describe the city energy on event day.",
        "location": "Hotel area / nearby breakfast spot",
        "cost": "USD 30"
      },
      "afternoon": {
        "time": "12:00 PM – 5:00 PM",
        "activities": "Pre-event build-up. Fan zones, venue area exploration, merchandise, atmosphere. Get there early. Why this matters.",
        "location": "Venue surroundings / fan zone",
        "cost": "USD 80"
      },
      "evening": {
        "time": "5:00 PM – 11:00 PM",
        "activities": "The main event — described with genuine excitement. What the atmosphere is like, what to expect inside, post-event celebrations. This is the climax of the trip.",
        "location": "Venue name",
        "cost": "USD 400",
        "isEventBlock": true,
        "eventDetails": {
          "doors": "5:00 PM",
          "startTime": "7:00 PM",
          "duration": "3–4 hours",
          "ticketUrl": null
        }
      },
      "mealsAndDining": [
        {
          "meal": "Breakfast",
          "recommendation": "Specific breakfast spot near hotel",
          "priceRange": "USD 10–20",
          "location": "Near hotel"
        },
        {
          "meal": "Pre-Event Snack",
          "recommendation": "Best food spot near the venue",
          "priceRange": "USD 15–25",
          "location": "Near venue"
        }
      ],
      "tips": [
        "Specific gate/entrance advice for this venue",
        "Bag policy and what not to bring",
        "Best transport option to the venue (specific line/route)",
        "Arrive X minutes before doors — here's why",
        "One thing most first-timers don't know about this venue or event"
      ]
    }
  ]
}`;
}

// ── USER PROMPT BUILDER ───────────────────────────────────────────────────────

function buildPrompt(eventData: {
  eventName: string;
  eventDate: string;
  eventVenue: string;
  eventCity: string;
  eventType: 'sports' | 'music' | 'festivals';
  eventCountry?: string;
  userPreferences: {
    budget?: string;
    tripType?: string;
    groupType?: string;
    groupSize?: number;
    days: number;
    startDate?: string;
    endDate?: string;
  };
}): string {
  const { eventName, eventDate, eventVenue, eventCity, eventType, eventCountry, userPreferences } = eventData;
  const { budget, tripType, groupType, groupSize, days, startDate } = userPreferences;

  let eventDay = Math.ceil(days / 2);
  if (startDate && eventDate) {
    const diff = Math.floor((new Date(eventDate).getTime() - new Date(startDate).getTime()) / 86400000);
    if (diff >= 0 && diff < days) eventDay = diff + 1;
  }

  const tripStart = startDate
    ? new Date(startDate)
    : new Date(new Date(eventDate).getTime() - (eventDay - 1) * 86400000);

  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date(tripStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  // Categorise each day clearly
  const dayBreakdown = dates.map((d, i) => {
    const n    = i + 1;
    const isEv = n === eventDay;
    const phase = n < eventDay
      ? `Pre-Event Day ${n} — explore ${eventCity}, rest, build anticipation`
      : isEv
      ? `⭐ EVENT DAY — ${eventName} at ${eventVenue}. This day must feel electric.`
      : `Post-Event Day — still buzzing, now explore ${eventCity} fully`;
    return `  Day ${n} (${d}): ${phase}`;
  }).join('\n');

  const budgetContext = budget === 'luxury'
    ? 'Luxury traveler — recommend upscale restaurants, premium experiences, no budget compromise'
    : budget === 'budget'
    ? 'Budget-conscious — great value options, free attractions, street food gems'
    : 'Mid-range — a mix of quality experiences without being extravagant';

  const groupContext = groupSize && groupSize > 1
    ? `Group of ${groupSize} ${groupType || 'friends'} — include group-friendly activities and restaurants with good group tables`
    : 'Solo traveler — include tips for meeting locals, safe solo navigation, best bars/spots to be alone without feeling alone';

  return `Create a ${days}-day itinerary for this trip. Write in Gladys voice — warm, personal, exciting. Make the user FEEL the trip.

═══ THE EVENT ═══
Name:    ${eventName}
Type:    ${eventType}
Date:    ${eventDate} (this is Day ${eventDay} of ${days})
Venue:   ${eventVenue}
City:    ${eventCity}${eventCountry ? `, ${eventCountry}` : ''}

═══ THE TRAVELER ═══
Budget:  ${budgetContext}
Group:   ${groupContext}
Style:   ${tripType || 'balanced — mix of culture, food, relaxation and excitement'}

═══ TRIP TIMELINE ═══
${dayBreakdown}

═══ CITY KNOWLEDGE REQUIRED ═══
You MUST use real, specific knowledge of ${eventCity}:
- Real restaurant names and neighbourhoods (not "local restaurant" or "downtown area")
- Real landmarks, parks, museums, streets
- Real transport lines (subway, tram, bus numbers)
- Real local knowledge — what locals actually do, eat, where they go
- Venue-specific knowledge for ${eventVenue} — entrances, transport, fan culture

═══ TONE REMINDERS ═══
- PRE-EVENT days: relaxed, curious, "the city is warming you up for the big night"
- EVENT DAY morning: slow and anticipatory — "today is the day, don't rush it"
- EVENT DAY evening: electric, immersive — describe the atmosphere, the crowd, what it FEELS like
- POST-EVENT days: celebratory energy, full exploration mode, "you've earned it"

ticketUrl must be null. Return ONLY valid JSON.`;
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  console.log('===== 🎯 ITINERARY API v8.0 — Gladys Voice =====');

  try {
    const body = await req.json();
    const {
      eventName, eventDate, eventVenue, eventCity, eventCountry,
      eventType = 'sports',
      ticketUrl,
      location,
      budget, origin, days = 3, tripType, groupSize = 1, groupType, startDate, endDate
    } = body;

    const isEventAnchored = eventName && eventDate && eventVenue;

    if (!isEventAnchored && !location) {
      return NextResponse.json(
        { error: "Provide eventName + eventDate + eventVenue, or a location for generic trips." },
        { status: 400 }
      );
    }

    if (!days || days < 1 || days > 14) {
      return NextResponse.json({ error: "Days must be between 1 and 14" }, { status: 400 });
    }

    const startTime = Date.now();

    // ── EVENT-ANCHORED PATH ──────────────────────────────────────────────────
    if (isEventAnchored) {
      console.log(`🎯 ${eventName} | ${eventCity} | ${eventDate} | ticketUrl: ${ticketUrl ? '✅' : '❌'}`);

      const data = await generateItineraryWithRetry(
        getSystemPrompt(),
        buildPrompt({
          eventName, eventDate, eventVenue,
          eventCity: eventCity || location || 'the destination',
          eventCountry, eventType,
          userPreferences: { budget, tripType, groupType, groupSize, days, startDate, endDate }
        })
      );

      const finalData = ticketUrl ? injectRealTicketUrl(data, ticketUrl) : data;
      const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Done in ${generationTime}s`);

      return NextResponse.json({
        ...finalData,
        metadata: {
          generatedAt:   new Date().toISOString(),
          isEventAnchored: true,
          eventName, eventType, eventDate, eventVenue,
          eventCity: eventCity || location,
          eventCountry,
          ticketUrlSource: ticketUrl ? 'real' : 'none',
          groupSize, groupType, budget, tripType,
          generationTime: `${generationTime}s`,
          origin: origin || null,
          version: '8.0-gladys-voice'
        }
      });
    }

    // ── GENERIC FALLBACK ─────────────────────────────────────────────────────
    console.log(`⚠️ Generic path for: ${location}`);
    const dest     = location || 'the destination';
    const startObj = startDate ? new Date(startDate) : new Date(Date.now() + 7 * 86400000);
    const dates    = Array.from({ length: days }, (_, i) => {
      const d = new Date(startObj); d.setDate(d.getDate() + i); return d.toISOString().split('T')[0];
    });

    const genericSystemPrompt = `You are Gladys — a warm, knowledgeable AI travel companion. Write travel itineraries in a personal, vivid voice. Address the user as "you". Use real restaurant names and landmarks for the destination. Never write generic filler like "local restaurant" or "explore the area". Return ONLY valid JSON.`;

    const genericPrompt = `Create a ${days}-day travel itinerary for ${dest}.
Budget: ${budget || 'Mid-range'} | Group: ${groupType || 'solo'} (${groupSize} ${groupSize === 1 ? 'person' : 'people'}) | Style: ${tripType || 'balanced'}
Dates: ${dates[0]} to ${dates[dates.length - 1]}

Write in Gladys voice — warm, personal, specific. Use real places in ${dest}.

Return this JSON structure with ${days} days, each with morning/afternoon/evening time blocks (each with vivid 2-3 sentence descriptions), mealsAndDining with real restaurant names, and specific tips.`;

    const genericData = await generateItineraryWithRetry(genericSystemPrompt, genericPrompt);
    const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);

    return NextResponse.json({
      ...genericData,
      metadata: {
        generatedAt: new Date().toISOString(),
        isEventAnchored: false,
        groupSize, groupType, budget, tripType,
        generationTime: `${generationTime}s`,
        version: '8.0-generic'
      }
    });

  } catch (err: any) {
    console.error("❌ Itinerary generation failed:", err);
    return NextResponse.json(
      {
        error: "Failed to generate itinerary",
        message: err.message || "Unknown error",
        suggestion: "Try again or contact hello@gladystravel.com"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status:  "operational",
    service: "GladysTravelAI Itinerary API",
    version: "8.0-gladys-voice",
    changes: "Gladys voice prompt — warm, personal, city-specific. No more generic descriptions."
  });
}