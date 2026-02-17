// app/api/itinerary/route.ts
// 🎯 EVENT-ANCHORED Itinerary Generation - Trademark-Safe Architecture

import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ==================== STRATEGIC: Event-First Response Structure ====================
// This structure makes the UI render event-centric itineraries perfectly

interface EventAnchor {
  eventName: string;
  eventType: 'sports' | 'music' | 'festivals';
  eventDate: string;
  eventDay: number; // Which day number is the event (e.g., day 2 of 5)
  venue: string;
  city: string;
  country?: string;
}

interface TimeBlock {
  time: string;
  activities: string;
  location: string;
  cost: string;
  affiliateLinks?: {
    type: 'activity' | 'tour' | 'restaurant' | 'attraction';
    partner?: string;
    url?: string;
  }[];
}

interface EventBlock extends TimeBlock {
  isEventBlock: true; // CRITICAL: Marks this as THE EVENT
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
  label: string; // "Pre-Event Day 1" | "EVENT DAY" | "Post-Event Day 1"
  isEventDay: boolean; // CRITICAL: UI highlight trigger
  morning: TimeBlock;
  afternoon: TimeBlock | EventBlock; // Event usually happens afternoon/evening
  evening: TimeBlock | EventBlock;
  mealsAndDining?: Array<{
    meal: string;
    recommendation: string;
    priceRange: string;
    location: string;
    affiliateUrl?: string;
  }>;
  tips?: string[];
}

interface ItineraryResponse {
  overview: string;
  eventAnchor: EventAnchor; // CRITICAL: Event metadata
  tripSummary: {
    totalDays: number;
    cities: string[];
    highlights: string[];
    eventPhases: {
      preEvent: number; // Days before event
      eventDay: number; // Always 1
      postEvent: number; // Days after event
    };
  };
  budget: {
    totalBudget: string;
    dailyAverage: string;
    eventDayCost?: string; // Special cost for event day
    breakdown?: {
      accommodation: string;
      transport: string;
      food: string;
      event: string;
      activities: string;
    };
  };
  days: Day[];
}

// ==================== RETRY LOGIC ====================

async function generateItineraryWithRetry(
  systemPrompt: string, 
  userPrompt: string, 
  maxRetries = 3
): Promise<ItineraryResponse> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📝 Attempt ${attempt}/${maxRetries}: Generating event-anchored itinerary...`);
      
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
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
      try {
        data = JSON.parse(raw);
      } catch (parseError) {
        console.error(`❌ JSON Parse Error on attempt ${attempt}:`, parseError);
        if (attempt === maxRetries) throw parseError;
        continue;
      }

      // STRATEGIC: Validate event-centric structure
      if (!data.days || !Array.isArray(data.days) || data.days.length === 0) {
        console.error(`❌ Invalid response structure on attempt ${attempt}: missing days array`);
        if (attempt === maxRetries) {
          throw new Error("Generated itinerary missing required 'days' array");
        }
        continue;
      }

      // STRATEGIC: Ensure eventAnchor exists for event-based trips
      if (!data.eventAnchor && data.metadata?.isEventAnchored) {
        console.warn(`⚠️ Missing eventAnchor - reconstructing from metadata`);
        data.eventAnchor = {
          eventName: data.metadata.eventName || "Event",
          eventType: data.metadata.eventType || "sports",
          eventDate: data.days[0]?.date || new Date().toISOString().split('T')[0],
          eventDay: 1,
          venue: data.metadata.eventVenue || "TBD",
          city: data.metadata.eventCity || "TBD"
        };
      }

      // STRATEGIC: Validate at least one event day exists
      const hasEventDay = data.days.some((day: Day) => day.isEventDay === true);
      if (!hasEventDay && data.eventAnchor) {
        console.warn(`⚠️ No event day found - injecting event day`);
        const eventDayIndex = data.eventAnchor.eventDay - 1;
        if (data.days[eventDayIndex]) {
          data.days[eventDayIndex].isEventDay = true;
          data.days[eventDayIndex].label = "EVENT DAY";
        }
      }

      console.log(`✅ Successfully generated ${data.days.length} days on attempt ${attempt}`);
      return data as ItineraryResponse;

    } catch (error: any) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) throw error;
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error("Failed to generate itinerary after all retries");
}

// ==================== EVENT-FIRST SYSTEM PROMPT ====================

function getEventFirstSystemPrompt(): string {
  return `You are GladysTravelAI, an expert event-focused travel planner.

CORE PRINCIPLE:
Users travel FOR AN EVENT (sports, music, festivals), then explore the city before and after.
The EVENT is the ANCHOR. Everything else supports it.

EVENT TYPES & EXAMPLES (USE GENERIC DESCRIPTIONS):
- sports: International football finals, major basketball championships, global tennis tournaments, racing competitions
- music: Major artist concerts, international music festivals, touring performances
- festivals: Cultural celebrations, seasonal festivals, food festivals, art exhibitions

YOUR JOB:
1. Identify the EVENT DAY (when the event happens)
2. Structure the trip in 3 phases:
   - PRE-EVENT: Light exploration, arrival, rest, getting oriented
   - EVENT DAY: Event + nearby activities optimized for event attendees
   - POST-EVENT: Full city discovery (beaches, food, culture, nightlife)

3. Generate a structured JSON response with:
   - Event anchor metadata
   - Day-by-day itinerary
   - Clear labels: "Pre-Event Day 1", "EVENT DAY", "Post-Event Day 1"
   - Event block with special formatting
   - Budget breakdown with categories
   - Affiliate-ready structure (hotels, activities, dining)

CRITICAL: YOU MUST RETURN ONLY VALID JSON. NO MARKDOWN. NO COMMENTARY. NO EXPLANATIONS. JUST PURE JSON.

RESPONSE STRUCTURE (EXACT FORMAT REQUIRED):
{
  "overview": "2-3 sentence trip overview emphasizing the event",
  "eventAnchor": {
    "eventName": "Exact event name provided by user",
    "eventType": "sports|music|festivals",
    "eventDate": "YYYY-MM-DD",
    "eventDay": 2,
    "venue": "Stadium/Arena/Festival Grounds name",
    "city": "City name",
    "country": "Country name"
  },
  "tripSummary": {
    "totalDays": 5,
    "cities": ["City"],
    "highlights": ["5 key highlights including THE EVENT"],
    "eventPhases": {
      "preEvent": 1,
      "eventDay": 1,
      "postEvent": 3
    }
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
      "theme": "Arrival & Beach Exploration",
      "label": "Pre-Event Day 1",
      "isEventDay": false,
      "morning": {
        "time": "9:00 AM - 12:00 PM",
        "activities": "Light activities, settle in",
        "location": "Area name",
        "cost": "$50"
      },
      "afternoon": {
        "time": "12:00 PM - 6:00 PM",
        "activities": "Afternoon exploration",
        "location": "Area name",
        "cost": "$75"
      },
      "evening": {
        "time": "6:00 PM - 11:00 PM",
        "activities": "Evening dining and relaxation",
        "location": "Area name",
        "cost": "$100"
      },
      "mealsAndDining": [
        {
          "meal": "Lunch",
          "recommendation": "Specific restaurant name",
          "priceRange": "$15-25",
          "location": "Address or area"
        },
        {
          "meal": "Dinner",
          "recommendation": "Specific restaurant name",
          "priceRange": "$30-50",
          "location": "Address or area"
        }
      ],
      "tips": ["Useful, specific tips for the day"]
    },
    {
      "day": 2,
      "date": "YYYY-MM-DD",
      "city": "City",
      "theme": "Event Name - Description",
      "label": "EVENT DAY",
      "isEventDay": true,
      "morning": {
        "time": "8:00 AM - 11:00 AM",
        "activities": "Light breakfast, prepare for event",
        "location": "Hotel area",
        "cost": "$30"
      },
      "afternoon": {
        "time": "12:00 PM - 6:00 PM",
        "activities": "Pre-event activities, fan zone, stadium atmosphere",
        "location": "Venue area",
        "cost": "$100"
      },
      "evening": {
        "time": "6:00 PM - 11:00 PM",
        "activities": "THE EVENT: [Event Name] + Post-event celebrations",
        "location": "Venue name",
        "cost": "$500",
        "isEventBlock": true,
        "eventDetails": {
          "doors": "5:00 PM",
          "startTime": "7:00 PM",
          "duration": "3-4 hours",
          "ticketUrl": "https://example.com/tickets"
        }
      },
      "mealsAndDining": [
        {
          "meal": "Breakfast",
          "recommendation": "Light breakfast spot",
          "priceRange": "$10-20",
          "location": "Near hotel"
        },
        {
          "meal": "Pre-Event Snack",
          "recommendation": "Quick bite near venue",
          "priceRange": "$15-25",
          "location": "Near venue"
        }
      ],
      "tips": [
        "Arrive at venue early to avoid crowds",
        "Check parking or public transport options",
        "Bring required items (ID, tickets, etc.)",
        "Stay hydrated throughout the event"
      ]
    }
  ]
}

CRITICAL RULES:
- RETURN ONLY VALID JSON - NO MARKDOWN, NO COMMENTARY
- The EVENT DAY must have "isEventDay": true
- Event blocks must have "isEventBlock": true
- At least one time block on event day must be the main event
- Use real venue names and locations when provided
- Budget breakdown should be realistic and detailed
- Tips should be practical and event-specific
- Include specific restaurant/venue recommendations
- All dates must be in YYYY-MM-DD format
- All costs must include currency symbol and amount`;
}

// ==================== EVENT-ANCHORED PROMPT BUILDER ====================

function buildEventAnchoredPrompt(eventData: {
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
  const {
    eventName,
    eventDate,
    eventVenue,
    eventCity,
    eventType,
    eventCountry,
    userPreferences
  } = eventData;

  const { budget, tripType, groupType, groupSize, days, startDate, endDate } = userPreferences;

  // STRATEGIC: Calculate event day position
  let eventDay = Math.ceil(days / 2); // Default: event in the middle
  
  if (startDate && eventDate) {
    const start = new Date(startDate);
    const event = new Date(eventDate);
    const daysDiff = Math.floor((event.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff >= 0 && daysDiff < days) {
      eventDay = daysDiff + 1;
    }
  }

  // STRATEGIC: Calculate date range
  const eventDateObj = new Date(eventDate);
  const tripStartDate = startDate 
    ? new Date(startDate)
    : new Date(eventDateObj.getTime() - (eventDay - 1) * 24 * 60 * 60 * 1000);
  
  const dates = Array.from({ length: days }, (_, i) => {
    const date = new Date(tripStartDate);
    date.setDate(date.getDate() + i);
    return date.toISOString().split('T')[0];
  });

  return `Create a ${days}-day EVENT-FOCUSED itinerary.

🎯 EVENT DETAILS:
Event: ${eventName}
Type: ${eventType}
Date: ${eventDate} (This is Day ${eventDay} of ${days})
Venue: ${eventVenue}
Location: ${eventCity}${eventCountry ? `, ${eventCountry}` : ''}

👥 TRAVELER:
Budget: ${budget || 'Mid-range'}
Group: ${groupType || 'solo'} (${groupSize || 1} ${groupSize === 1 ? 'person' : 'people'})
Style: ${tripType || 'balanced'}

📅 TRIP STRUCTURE:
${dates.map((date, i) => {
  const dayNum = i + 1;
  const isEventDay = dayNum === eventDay;
  const phase = dayNum < eventDay 
    ? 'PRE-EVENT' 
    : dayNum === eventDay 
    ? 'EVENT DAY' 
    : 'POST-EVENT';
  
  return `Day ${dayNum} (${date}): ${isEventDay ? `🎯 ${eventName.toUpperCase()}` : phase}`;
}).join('\n')}

STRATEGIC GUIDELINES:

PRE-EVENT DAYS (Days ${eventDay > 1 ? `1-${eventDay - 1}` : 'none'}):
- Light exploration, arrival activities
- Rest and prepare for the event
- Nearby attractions (beaches, landmarks, local food)
- Don't exhaust travelers before the main event

EVENT DAY (Day ${eventDay} - ${eventDate}):
- Morning: Light activities, breakfast, prepare
- Afternoon/Evening: THE EVENT at ${eventVenue}
  * Include pre-event activities (fan zones, atmosphere)
  * Event start time, doors opening time, duration
  * Realistic ticket cost estimates
  * What to bring, parking/transport, arrival tips
- Post-event: Celebrations, nightlife near ${eventCity}
- CRITICAL: Event block must have "isEventBlock": true

POST-EVENT DAYS (Days ${eventDay < days ? `${eventDay + 1}-${days}` : 'none'}):
- Full city discovery mode
- Beaches, culture, museums, food tours
- Shopping, nightlife, hidden gems
- Recovery activities (spa, beach, relaxation)

EVENT-SPECIFIC RECOMMENDATIONS:
${eventType === 'sports' ? `
- Best viewing locations and seating recommendations
- Pre-event gathering spots and sports bars
- Team merchandise and memorabilia locations
- Public transportation to venue
- Post-event celebration hotspots
` : eventType === 'music' ? `
- Best accommodation near venue for easy access
- Pre-show dinner spots within walking distance
- Merchandise and artist meet-and-greet information
- After-party and club recommendations
- Sound check and early entry opportunities
` : `
- Festival ground layout and navigation tips
- Best days/times to attend specific attractions
- What to wear, bring, and prepare
- Nearby accommodation with shuttle service
- Food vendors and local cuisine options
- Rest areas and chill-out zones
`}

BUDGET BREAKDOWN REQUIREMENTS:
- Accommodation: Hotels/Airbnb costs for ${days} nights
- Transport: Flights, local transport, parking
- Food: All meals and dining experiences
- Event: Ticket costs and event-specific expenses
- Activities: Tours, attractions, entertainment

RETURN ONLY VALID JSON following the exact structure in the system prompt. NO MARKDOWN. NO EXPLANATIONS.`;
}

// ==================== MAIN API HANDLER ====================

export async function POST(req: Request) {
  console.log('===== 🎯 EVENT-FIRST ITINERARY API CALLED =====');
  
  try {
    const body = await req.json();
    const {
      // STRATEGIC: Event details (PRIMARY for event-first)
      eventName,
      eventDate,
      eventVenue,
      eventCity,
      eventCountry,
      eventType = 'sports',
      
      // Trip details
      location, // Fallback if eventCity not provided
      budget,
      origin,
      days = 3,
      tripType,
      groupSize = 1,
      groupType,
      startDate,
      endDate
    } = body;

    console.log('📥 Request:', { 
      eventName, 
      eventDate, 
      eventVenue, 
      eventCity, 
      eventType,
      days 
    });

    // STRATEGIC: Validation
    const isEventAnchored = eventName && eventDate && eventVenue;
    
    if (!isEventAnchored && !location) {
      return NextResponse.json(
        { 
          error: "Event details required",
          message: "Provide eventName, eventDate, and eventVenue for event-focused trips. Or provide location for generic itineraries.",
          requiredFields: {
            eventBased: ["eventName", "eventDate", "eventVenue", "eventCity", "eventType"],
            generic: ["location"]
          }
        },
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

    // ==================== EVENT-ANCHORED PATH ====================
    
    if (isEventAnchored) {
      console.log(`🎯 EVENT-ANCHORED: ${eventName} (${eventType}) on ${eventDate}`);
      
      const eventData = {
        eventName,
        eventDate,
        eventVenue,
        eventCity: eventCity || location || 'Unknown',
        eventCountry,
        eventType: eventType as 'sports' | 'music' | 'festivals',
        userPreferences: {
          budget,
          tripType,
          groupType,
          groupSize,
          days,
          startDate,
          endDate
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
          eventType,
          eventDate,
          eventVenue,
          eventCity: eventCity || location,
          eventCountry,
          groupSize: groupSize || 1,
          groupType: groupType || null,
          budget: budget || 'Mid-range',
          tripType: tripType || 'balanced',
          generationTime: `${generationTime}s`,
          origin: origin || null,
          version: '6.0-trademark-safe'
        }
      });
    }

    // ==================== FALLBACK: Generic Itinerary ====================
    
    console.log(`⚠️ GENERIC PATH: No event details, generating for ${location}`);
    
    const fallbackDest = location || eventCity || 'destination';
    const startDateObj = startDate ? new Date(startDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const dates = Array.from({ length: days }, (_, i) => {
      const date = new Date(startDateObj);
      date.setDate(date.getDate() + i);
      return date.toISOString().split('T')[0];
    });

    const genericPrompt = `Create a ${days}-day travel itinerary for ${fallbackDest}.

⚠️ NOTE: This is a GENERIC itinerary (no specific event).

Budget: ${budget || 'Mid-range'}
Group: ${groupType || 'solo'} (${groupSize} people)
Style: ${tripType || 'balanced'}

CRITICAL: RETURN ONLY VALID JSON. NO MARKDOWN. NO COMMENTARY.

Return valid JSON with this structure:
{
  "overview": "Brief trip overview",
  "tripSummary": {
    "totalDays": ${days},
    "cities": ["${fallbackDest}"],
    "highlights": ["5 highlights"],
    "eventPhases": {
      "preEvent": 0,
      "eventDay": 0,
      "postEvent": ${days}
    }
  },
  "budget": {
    "totalBudget": "$X,XXX USD",
    "dailyAverage": "$XXX/day",
    "breakdown": {
      "accommodation": "$XXX",
      "transport": "$XXX",
      "food": "$XXX",
      "event": "$0",
      "activities": "$XXX"
    }
  },
  "days": [
    ${dates.map((date, i) => `{
      "day": ${i + 1},
      "date": "${date}",
      "city": "${fallbackDest}",
      "theme": "Day ${i + 1} theme",
      "label": "Day ${i + 1}",
      "isEventDay": false,
      "morning": {"time": "9:00 AM - 12:00 PM", "activities": "Morning activities", "location": "Location", "cost": "$XX"},
      "afternoon": {"time": "12:00 PM - 6:00 PM", "activities": "Afternoon activities", "location": "Location", "cost": "$XX"},
      "evening": {"time": "6:00 PM - 11:00 PM", "activities": "Evening activities", "location": "Location", "cost": "$XX"},
      "mealsAndDining": [
        {"meal": "Lunch", "recommendation": "Restaurant", "priceRange": "$XX-XX", "location": "Area"},
        {"meal": "Dinner", "recommendation": "Restaurant", "priceRange": "$XX-XX", "location": "Area"}
      ],
      "tips": ["Tip 1", "Tip 2"]
    }`).join(',\n    ')}
  ]
}`;

    const systemPrompt = `You are an expert travel planner. Create detailed itineraries with real place names. CRITICAL: Return ONLY valid JSON. NO MARKDOWN. NO COMMENTARY. NO EXPLANATIONS.`;
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
        version: '6.0-generic-fallback',
        warning: 'For event-based trips, provide eventName, eventDate, eventVenue, and eventType.'
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
    service: "GladysTravelAI - Event-Centric Itinerary API",
    model: "gpt-4o-mini",
    version: "6.0-trademark-safe",
    features: [
      "🎯 Event-anchored trip planning",
      "📅 Pre-event, event day, post-event phases",
      "🏆 Sports, Music, Festival specialization",
      "✅ Structured JSON with event blocks",
      "💎 Venue-optimized recommendations",
      "🔗 Affiliate-ready output",
      "🔄 Fallback to generic itineraries",
      "⚖️ Trademark-safe architecture"
    ],
    requiredFields: {
      eventBased: {
        required: ["eventName", "eventDate", "eventVenue", "eventType"],
        optional: ["eventCity", "eventCountry", "startDate", "endDate", "budget", "groupSize", "groupType", "tripType"]
      },
      generic: {
        required: ["location", "days"],
        optional: ["budget", "groupSize", "groupType", "tripType", "startDate", "endDate"]
      }
    },
    eventTypes: ["sports", "music", "festivals"],
    maxDays: 14
  });
}