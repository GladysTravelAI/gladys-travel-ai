// app/api/itinerary/route.ts
// 🎯 EVENT-ANCHORED Itinerary Generation
// v7.0: Real ticket URLs injected after generation instead of AI-hallucinated placeholders

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
// This runs AFTER OpenAI generation to replace any placeholder URL with the
// real Ticketmaster URL we already have from the event search phase.

function injectRealTicketUrl(data: ItineraryResponse, ticketUrl: string): ItineraryResponse {
  if (!ticketUrl || !data.days) return data;

  for (const day of data.days) {
    if (!day.isEventDay) continue;

    for (const period of ['morning', 'afternoon', 'evening'] as const) {
      const block = day[period] as any;
      if (block?.isEventBlock === true) {
        if (!block.eventDetails) block.eventDetails = {};
        block.eventDetails.ticketUrl = ticketUrl;
        console.log(`✅ Injected real ticket URL into Day ${day.day} ${period} block`);
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
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 6000,
      });

      const raw = response.choices[0].message?.content || "{}";
      let data: any;
      try { data = JSON.parse(raw); }
      catch (e) {
        if (attempt === maxRetries) throw e;
        continue;
      }

      if (!data.days || !Array.isArray(data.days) || data.days.length === 0) {
        if (attempt === maxRetries) throw new Error("Generated itinerary missing 'days' array");
        continue;
      }

      // Ensure at least one event day is flagged
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

// ── SYSTEM PROMPT ─────────────────────────────────────────────────────────────

function getSystemPrompt(): string {
  return `You are GladysTravelAI, an expert event-focused travel planner.

CORE PRINCIPLE: Users travel FOR AN EVENT. The event is the anchor.
Structure every trip in 3 phases: PRE-EVENT → EVENT DAY → POST-EVENT.

CRITICAL RULES:
- Return ONLY valid JSON. No markdown. No commentary.
- EVENT DAY must have "isEventDay": true
- The time block containing the event must have "isEventBlock": true
- Do NOT invent or guess ticket URLs — leave ticketUrl as null. Real URLs are injected separately.
- All dates: YYYY-MM-DD format. All costs: include currency symbol.

EXACT JSON STRUCTURE:
{
  "overview": "2-3 sentences emphasising the event",
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
    "highlights": ["5 highlights including THE EVENT"],
    "eventPhases": { "preEvent": 1, "eventDay": 1, "postEvent": 3 }
  },
  "budget": {
    "totalBudget": "$2,500 USD",
    "dailyAverage": "$500/day",
    "eventDayCost": "$800",
    "breakdown": {
      "accommodation": "$800",
      "transport": "$400",
      "food": "$600",
      "event": "$500",
      "activities": "$200"
    }
  },
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "city": "City",
      "theme": "Arrival & Exploration",
      "label": "Pre-Event Day 1",
      "isEventDay": false,
      "morning":   { "time": "9:00 AM – 12:00 PM", "activities": "...", "location": "...", "cost": "$50" },
      "afternoon": { "time": "12:00 PM – 6:00 PM",  "activities": "...", "location": "...", "cost": "$75" },
      "evening":   { "time": "6:00 PM – 11:00 PM",  "activities": "...", "location": "...", "cost": "$100" },
      "mealsAndDining": [
        { "meal": "Lunch",  "recommendation": "Restaurant name", "priceRange": "$15–25", "location": "Area" },
        { "meal": "Dinner", "recommendation": "Restaurant name", "priceRange": "$30–50", "location": "Area" }
      ],
      "tips": ["Practical tip 1", "Practical tip 2"]
    },
    {
      "day": 2,
      "date": "YYYY-MM-DD",
      "city": "City",
      "theme": "Event Day theme",
      "label": "EVENT DAY",
      "isEventDay": true,
      "morning":   { "time": "8:00 AM – 11:00 AM", "activities": "Light prep", "location": "Hotel", "cost": "$30" },
      "afternoon": { "time": "12:00 PM – 5:00 PM", "activities": "Pre-event fan zone", "location": "Venue area", "cost": "$80" },
      "evening": {
        "time": "5:00 PM – 11:00 PM",
        "activities": "THE EVENT: [event name] + post-event celebrations",
        "location": "Venue name",
        "cost": "$500",
        "isEventBlock": true,
        "eventDetails": {
          "doors": "5:00 PM",
          "startTime": "7:00 PM",
          "duration": "3–4 hours",
          "ticketUrl": null
        }
      },
      "mealsAndDining": [
        { "meal": "Breakfast", "recommendation": "Light spot", "priceRange": "$10–20", "location": "Near hotel" },
        { "meal": "Pre-Event",  "recommendation": "Quick bite",  "priceRange": "$15–25", "location": "Near venue" }
      ],
      "tips": [
        "Arrive at venue early to beat queues",
        "Check public transport options to the venue",
        "Bring valid ID and your ticket (print or digital)",
        "Stay hydrated — especially for outdoor events"
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

  return `Plan a ${days}-day event-focused trip.

EVENT:
- Name: ${eventName}
- Type: ${eventType}
- Date: ${eventDate} → This is Day ${eventDay} of ${days}
- Venue: ${eventVenue}
- Location: ${eventCity}${eventCountry ? `, ${eventCountry}` : ''}

TRAVELER:
- Budget: ${budget || 'Mid-range'}
- Group: ${groupType || 'solo'} (${groupSize || 1} ${groupSize === 1 ? 'person' : 'people'})
- Style: ${tripType || 'balanced'}

TRIP DATES:
${dates.map((d, i) => {
  const n = i + 1;
  const phase = n < eventDay ? 'PRE-EVENT' : n === eventDay ? `🎯 EVENT DAY — ${eventName}` : 'POST-EVENT';
  return `Day ${n} (${d}): ${phase}`;
}).join('\n')}

GUIDELINES:
PRE-EVENT: Light exploration, rest, get oriented. Don't exhaust the traveler.
EVENT DAY: Morning prep → afternoon pre-event activities/fan zone → evening: THE EVENT (isEventBlock: true, ticketUrl: null).
POST-EVENT: Full city mode — beaches, culture, food, nightlife, shopping.

IMPORTANT: Do NOT invent a ticketUrl. Set it to null. Return only valid JSON.`;
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  console.log('===== 🎯 ITINERARY API v7.0 =====');

  try {
    const body = await req.json();
    const {
      eventName, eventDate, eventVenue, eventCity, eventCountry,
      eventType = 'sports',
      // THE KEY ADDITION: real ticket URL from eventIntelTool → agent → HomeClient
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
      console.log(`🎯 ${eventName} (${eventType}) on ${eventDate} | ticketUrl: ${ticketUrl ? '✅ real' : '❌ none'}`);

      const data = await generateItineraryWithRetry(
        getSystemPrompt(),
        buildPrompt({
          eventName, eventDate, eventVenue,
          eventCity: eventCity || location || 'Unknown',
          eventCountry, eventType,
          userPreferences: { budget, tripType, groupType, groupSize, days, startDate, endDate }
        })
      );

      // ── INJECT REAL TICKET URL (the whole point of this refactor) ─────────
      const finalData = ticketUrl ? injectRealTicketUrl(data, ticketUrl) : data;

      const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Done in ${generationTime}s`);

      return NextResponse.json({
        ...finalData,
        metadata: {
          generatedAt: new Date().toISOString(),
          isEventAnchored: true,
          eventName, eventType, eventDate, eventVenue,
          eventCity: eventCity || location,
          eventCountry,
          ticketUrlSource: ticketUrl ? 'real' : 'none',
          groupSize, groupType, budget, tripType,
          generationTime: `${generationTime}s`,
          origin: origin || null,
          version: '7.0-real-ticket-urls'
        }
      });
    }

    // ── GENERIC FALLBACK ─────────────────────────────────────────────────────
    console.log(`⚠️ Generic path for: ${location}`);

    const dest = location || 'the destination';
    const startObj = startDate ? new Date(startDate) : new Date(Date.now() + 7 * 86400000);
    const dates = Array.from({ length: days }, (_, i) => {
      const d = new Date(startObj); d.setDate(d.getDate() + i); return d.toISOString().split('T')[0];
    });

    const genericPrompt = `Create a ${days}-day travel itinerary for ${dest}.
Budget: ${budget || 'Mid-range'} | Group: ${groupType || 'solo'} (${groupSize} people) | Style: ${tripType || 'balanced'}

Return valid JSON:
{
  "overview": "string",
  "tripSummary": {
    "totalDays": ${days},
    "cities": ["${dest}"],
    "highlights": ["highlight 1","highlight 2","highlight 3","highlight 4","highlight 5"],
    "eventPhases": { "preEvent": 0, "eventDay": 0, "postEvent": ${days} }
  },
  "budget": {
    "totalBudget": "$X,XXX USD",
    "dailyAverage": "$XXX/day",
    "breakdown": { "accommodation": "$XXX", "transport": "$XXX", "food": "$XXX", "event": "$0", "activities": "$XXX" }
  },
  "days": [
    ${dates.map((date, i) => JSON.stringify({
      day: i + 1, date, city: dest,
      theme: `Day ${i + 1}`, label: `Day ${i + 1}`, isEventDay: false,
      morning:   { time: "9:00 AM – 12:00 PM", activities: "Morning", location: "Area", cost: "$50" },
      afternoon: { time: "12:00 PM – 6:00 PM",  activities: "Afternoon", location: "Area", cost: "$75" },
      evening:   { time: "6:00 PM – 11:00 PM",  activities: "Evening", location: "Area", cost: "$100" },
      mealsAndDining: [
        { meal: "Lunch",  recommendation: "Local restaurant", priceRange: "$15–25", location: "Area" },
        { meal: "Dinner", recommendation: "Local restaurant", priceRange: "$30–50", location: "Area" }
      ],
      tips: ["Tip 1", "Tip 2"]
    })).join(',\n    ')}
  ]
}

Return only valid JSON. No markdown.`;

    const genericData = await generateItineraryWithRetry(
      "You are an expert travel planner. Return ONLY valid JSON. No markdown. No commentary.",
      genericPrompt
    );

    const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);

    return NextResponse.json({
      ...genericData,
      metadata: {
        generatedAt: new Date().toISOString(),
        isEventAnchored: false,
        groupSize, groupType, budget, tripType,
        generationTime: `${generationTime}s`,
        version: '7.0-generic'
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
    status: "operational",
    service: "GladysTravelAI Itinerary API",
    version: "7.0-real-ticket-urls",
    changes: "ticketUrl now injected from real Ticketmaster data, not AI-generated",
    requiredFields: {
      eventBased: ["eventName", "eventDate", "eventVenue", "eventType"],
      optional:   ["ticketUrl", "eventCity", "eventCountry", "startDate", "endDate", "budget", "groupSize", "groupType", "tripType"]
    }
  });
}