// app/api/itinerary-event-first/route.ts
// 🎯 EVENT-ANCHORED Itinerary Generation

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { buildEventAnchoredPrompt, getEventFirstSystemPrompt } from "@/lib/prompts/event-first-system";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Retry logic with exponential backoff
async function generateItineraryWithRetry(systemPrompt: string, userPrompt: string, maxRetries = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📝 Attempt ${attempt}/${maxRetries}: Generating event-anchored itinerary...`);
      
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 6000,
      });

      const raw = response.choices[0].message?.content || "{}";
      
      let data;
      try {
        data = JSON.parse(raw);
      } catch (parseError) {
        console.error(`❌ JSON Parse Error on attempt ${attempt}:`, parseError);
        if (attempt === maxRetries) throw parseError;
        continue;
      }

      // Validate response
      if (!data.days || !Array.isArray(data.days) || data.days.length === 0) {
        console.error(`❌ Invalid response structure on attempt ${attempt}`);
        if (attempt === maxRetries) {
          throw new Error("Generated itinerary missing required 'days' array");
        }
        continue;
      }

      // Validate event anchor
      if (!data.eventAnchor) {
        console.warn(`⚠️ Missing eventAnchor in response - adding it`);
        data.eventAnchor = {
          eventName: "Event",
          eventDate: data.days[0]?.date || new Date().toISOString().split('T')[0],
          eventDay: 1,
          venue: "TBD",
          city: "TBD"
        };
      }

      console.log(`✅ Successfully generated ${data.days.length} days on attempt ${attempt}`);
      return data;

    } catch (error: any) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error("Failed to generate itinerary after all retries");
}

export async function POST(req: Request) {
  console.log('===== 🎯 EVENT-FIRST ITINERARY API CALLED =====');
  
  try {
    const body = await req.json();
    const {
      // Event details (REQUIRED for event-first)
      eventName,
      eventDate,
      eventVenue,
      eventCity,
      eventType = 'sports',
      
      // Trip details
      location, // fallback if eventCity not provided
      budget,
      origin,
      days = 3,
      tripType,
      groupSize = 1,
      groupType,
      startDate,
      endDate
    } = body;

    console.log('📥 Request:', { eventName, eventDate, eventVenue, eventCity, days });

    // 🎯 VALIDATION: Check if this is an event-anchored request
    const isEventAnchored = eventName && eventDate && eventVenue;
    
    if (!isEventAnchored && !location) {
      return NextResponse.json(
        { error: "Either event details (eventName, eventDate, eventVenue) or location is required" },
        { status: 400 }
      );
    }
    
    if (!days || days < 1 || days > 14) {
      return NextResponse.json(
        { error: "Days must be between 1 and 14" },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // 🎯 BUILD EVENT-FIRST PROMPT
    if (isEventAnchored) {
      console.log(`🎯 EVENT-ANCHORED: Generating trip for ${eventName} on ${eventDate}`);
      
      const eventData = {
        eventName,
        eventDate,
        eventVenue,
        eventCity: eventCity || location || 'TBD',
        eventType,
        userPreferences: {
          budget,
          tripType,
          groupType,
          groupSize,
          days
        }
      };

      const systemPrompt = getEventFirstSystemPrompt();
      const userPrompt = buildEventAnchoredPrompt(eventData);

      const data = await generateItineraryWithRetry(systemPrompt, userPrompt);

      const endTime = Date.now();
      const generationTime = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`✅ Generated event-anchored itinerary in ${generationTime}s`);

      return NextResponse.json({
        ...data,
        metadata: {
          generatedAt: new Date().toISOString(),
          isEventAnchored: true,
          eventName,
          eventDate,
          eventVenue,
          eventCity: eventCity || location,
          groupSize: groupSize || 1,
          groupType: groupType || null,
          budget: budget || 'Mid-range',
          tripType: tripType || 'balanced',
          generationTime: `${generationTime}s`,
          origin: origin || null,
          version: '4.0-event-first'
        }
      });
    }

    // 🔄 FALLBACK: Generic destination itinerary (legacy support)
    console.log(`⚠️ GENERIC ITINERARY: No event details provided, generating for ${location}`);
    
    const fallbackDest = location || eventCity || 'destination';
    const startDateObj = startDate ? new Date(startDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const dates = Array.from({ length: days }, (_, i) => {
      const date = new Date(startDateObj);
      date.setDate(date.getDate() + i);
      return date.toISOString().split('T')[0];
    });

    const genericPrompt = `Create a ${days}-day travel itinerary for ${fallbackDest}.

⚠️ NOTE: This is a GENERIC itinerary because no specific event was provided.

Budget: ${budget || 'Mid-range'}
Group: ${groupType || 'solo'} (${groupSize} people)
Style: ${tripType || 'balanced'}

Return valid JSON with this structure:
{
  "overview": "Brief trip overview",
  "tripSummary": {
    "totalDays": ${days},
    "cities": ["${fallbackDest}"],
    "highlights": ["5 highlights"]
  },
  "budget": {
    "totalBudget": "$X,XXX USD",
    "dailyAverage": "$XXX/day"
  },
  "days": [
    ${dates.map((date, i) => `{
      "day": ${i + 1},
      "date": "${date}",
      "city": "${fallbackDest}",
      "theme": "Day ${i + 1} theme",
      "morning": {"time": "9:00 AM - 12:00 PM", "activities": "...", "location": "...", "cost": "$XX"},
      "afternoon": {"time": "12:00 PM - 6:00 PM", "activities": "...", "location": "...", "cost": "$XX"},
      "evening": {"time": "6:00 PM - 11:00 PM", "activities": "...", "location": "...", "cost": "$XX"},
      "mealsAndDining": [...],
      "tips": [...]
    }`).join(',\n    ')}
  ]
}`;

    const systemPrompt = `You are an expert travel planner. Create detailed itineraries with real place names. Return ONLY valid JSON.`;
    const data = await generateItineraryWithRetry(systemPrompt, genericPrompt);

    const endTime = Date.now();
    const generationTime = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`✅ Generated generic itinerary in ${generationTime}s`);

    return NextResponse.json({
      ...data,
      metadata: {
        generatedAt: new Date().toISOString(),
        isEventAnchored: false,
        groupSize: groupSize || 1,
        groupType: groupType || null,
        budget: budget || 'Mid-range',
        tripType: tripType || 'balanced',
        generationTime: `${generationTime}s`,
        origin: origin || null,
        version: '4.0-event-first-fallback',
        warning: 'This is a generic itinerary. For event-based trips, provide eventName, eventDate, and eventVenue.'
      }
    });

  } catch (err: any) {
    console.error("❌ Itinerary generation failed:", err);
    
    return NextResponse.json(
      {
        error: "Failed to generate itinerary",
        message: err.message || "Unknown error occurred",
        details: process.env.NODE_ENV === "development" ? {
          stack: err.stack,
          name: err.name
        } : undefined,
        suggestion: "Try again or contact support."
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "operational",
    service: "GladysTravelAI - Event-First Itinerary API",
    model: "gpt-4o-mini",
    features: [
      "🎯 Event-anchored itinerary generation",
      "📅 Automatic event day detection",
      "🕒 Before/during/after event structure",
      "✅ Retry logic with exponential backoff",
      "✅ JSON validation",
      "💎 Premium event-focused recommendations",
      "🔄 Fallback to generic itineraries"
    ],
    requiredFields: {
      eventAnchored: ["eventName", "eventDate", "eventVenue", "days"],
      generic: ["location", "days"]
    },
    maxDays: 14,
    version: "4.0-event-first"
  });
}