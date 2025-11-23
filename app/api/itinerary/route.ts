import { NextResponse } from "next/server";
import OpenAI from "openai";
// We use our mock data file to build the context
import { STADIUMS, MATCHES } from "@/lib/event-data";
import { ItineraryData } from "@/lib/mock-itinerary"; // Import our main type

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  console.log('===== ENHANCED ITINERARY API (GPT-5.1) CALLED =====');
  try {
    const { 
      location, 
      budget, 
      origin, 
      days, 
      tripType,
      team, // A team to follow (generic)
      matchIds, // Specific event IDs to attend (generic)
      optimize, 
      groupSize,
      groupType // 'solo' | 'couple' | 'family' | 'group'
    } = await req.json();

    // Input validation
    if (!location && !team && !(matchIds && matchIds.length > 0)) {
      return NextResponse.json(
        { error: "A destination, team, or event ID is required" },
        { status: 400 }
      );
    }
    if (!days) {
      return NextResponse.json(
        { error: "Trip duration (days) is required" },
        { status: 400 }
      );
    }

    const isEventTrip = !!(team || (matchIds && matchIds.length > 0));

    // Get event context if applicable
    let eventContext = '';
    let relevantStadiums: any[] = [];
    let relevantMatches: any[] = [];
    
    if (isEventTrip) {
      // 1. Find relevant matches
      if (team) {
        relevantMatches = MATCHES.filter(m => 
          m.team1 === team || m.team2 === team
        );
      } else if (matchIds) {
        relevantMatches = MATCHES.filter(m => matchIds.includes(m.id));
      }

      // 2. Get all unique stadiums for those matches
      const matchStadiums = [...new Set(relevantMatches.map(m => m.stadium))];
      
      // 3. Find stadium data
      relevantStadiums = STADIUMS.filter(s => 
        matchStadiums.includes(s.name) ||
        (location && (
          location.toLowerCase().includes(s.city.toLowerCase()) ||
          location.toLowerCase().includes(s.country.toLowerCase())
        ))
      );

      // 4. Build the generic event context
      eventContext = `
      This itinerary is for a major sporting event.
      
      ${relevantStadiums.length > 0 ? `
      VENUES IN THIS ITINERARY:
      ${relevantStadiums.map(s => `
        - ${s.name} in ${s.city}
          Capacity: ${s.capacity.toLocaleString()}
          Nearest Airport: ${s.nearestAirport.name} (${s.nearestAirport.code})
          Event Day Hotel Multiplier: ${s.matchDayPricing.hotelMultiplier}x normal price
      `).join('\n')}
      ` : ''}

      ${relevantMatches.length > 0 ? `
      EVENTS TO ATTEND:
      ${relevantMatches.map(m => `
        - Event ${m.matchNumber}: ${m.team1} vs ${m.team2}
          Date: ${m.date}
          Venue: ${m.stadium}
          Ticket Range: $${m.ticketPriceRange.min}-${m.ticketPriceRange.max}
      `).join('\n')}
      ` : ''}

      IMPORTANT EVENT PLANNING FACTORS:
      - Hotel prices are ${relevantStadiums[0]?.matchDayPricing.hotelMultiplier || 2.5}x higher on event days.
      - Book hotels at least ${relevantStadiums[0]?.matchDayPricing.advanceBookingRequired || '6 months'} in advance.
      - Include pre-event activities (fan zones, pre-game meals).
      - Include post-event celebrations and safe return to hotel.
      - Factor in traffic and security screening times (arrive 2-3 hours early).
      ${optimize ? '- OPTIMIZE route to minimize travel time and costs between venues.' : ''}
      `;
    }

    const promptLocation = location || (relevantStadiums.length > 0 ? `the area around ${relevantStadiums.map(s => s.city).join(' and ')}` : 'the requested area');

    // Build traveler context based on group type
    const travelerContext = groupType ? `
    TRAVELER PROFILE:
    - Group Type: ${groupType}
    - Group Size: ${groupSize || 1} ${(groupSize || 1) === 1 ? 'person' : 'people'}
    ${groupType === 'solo' ? '- Focus on: solo-friendly activities, social hostels, safe neighborhoods, meeting other travelers' : ''}
    ${groupType === 'couple' ? '- Focus on: romantic experiences, couples activities, intimate dining, scenic spots for photos' : ''}
    ${groupType === 'family' ? '- Focus on: kid-friendly activities, family restaurants, safe areas, not too much walking, early dinners' : ''}
    ${groupType === 'group' ? '- Focus on: group activities, shared experiences, group dining options, nightlife, adventure activities' : ''}
    ` : '';

    // Build budget context
    const budgetContext = budget ? `
    BUDGET LEVEL: ${budget.toUpperCase()}
    ${budget === 'budget' ? '- Target $50-100/day. Focus on: hostels, street food, free attractions, public transport, budget activities.' : ''}
    ${budget === 'mid-range' ? '- Target $100-250/day. Focus on: 3-4 star hotels, nice restaurants, mix of paid/free attractions, some tours.' : ''}
    ${budget === 'luxury' ? '- Target $250+/day. Focus on: 5-star hotels, fine dining, private tours, premium experiences, first-class transport.' : ''}
    ` : '';

    // Build trip style context
    const styleContext = tripType ? `
    TRAVEL STYLE: ${tripType.toUpperCase()}
    ${tripType === 'adventure' ? '- Include: hiking, water sports, outdoor activities, adrenaline experiences, nature exploration.' : ''}
    ${tripType === 'romantic' ? '- Include: sunset spots, couples spa, romantic dinners, scenic walks, wine tasting, intimate experiences.' : ''}
    ${tripType === 'cultural' ? '- Include: museums, historical sites, local traditions, art galleries, heritage tours, local crafts.' : ''}
    ${tripType === 'relaxation' ? '- Include: spa treatments, beach time, slow mornings, yoga, wellness activities, peaceful spots.' : ''}
    ${tripType === 'foodie' ? '- Include: food tours, cooking classes, local markets, famous restaurants, street food, wine/beer experiences.' : ''}
    ${tripType === 'nightlife' ? '- Include: rooftop bars, clubs, live music venues, night markets, evening entertainment, late dinners.' : ''}
    ${tripType === 'family-friendly' ? '- Include: theme parks, kid-friendly museums, playgrounds, family restaurants, interactive activities.' : ''}
    ${tripType === 'luxury' ? '- Include: Michelin restaurants, exclusive experiences, VIP access, premium services, luxury shopping.' : ''}
    ` : '';

    // --- FULLY COMPLETED JSON PROMPT ---
    const prompt = `
    Create a DETAILED and OPTIMIZED travel itinerary JSON for EXACTLY ${days} days in ${promptLocation}.
    
    ${travelerContext}
    ${budgetContext}
    ${styleContext}
    ${eventContext}
    
    Origin: ${origin || 'not specified'}
    
    CRITICAL: You MUST create a plan for ALL ${days} days. Do not create fewer days than requested.
    IMPORTANT: Tailor ALL recommendations to match the traveler profile, budget level, and travel style above.
    
    ${optimize ? `
    ROUTE OPTIMIZATION REQUIREMENTS:
    - Arrange activities geographically to minimize travel time.
    - Group nearby attractions on the same day.
    - Suggest most efficient transportation methods.
    ` : ''}

    Return a JSON object with this EXACT structure. Do not skip any fields. Create ${days} complete day objects in the "days" array.
    {
      "overview": "Compelling 2-3 sentence overview highlighting key experiences.",
      "tripSummary": {
        "totalDays": ${days},
        "cities": ["List", "of", "City names"],
        "eventsAttending": ${relevantMatches.length},
        "venues": ["List", "of", "Venue names"],
        "highlights": ["Top 5 experiences", "Highlight 2", "Highlight 3", "Highlight 4", "Highlight 5"]
      },
      "budget": {
        "totalBudget": "Total estimated cost in USD (e.g., '$3,500 USD')",
        "breakdown": {
          "accommodation": "Estimated cost (e.g., '$1,200')",
          "transportation": "Estimated cost (e.g., '$800')",
          "tickets": "Estimated cost (e.g., '$500')",
          "food": "Estimated cost (e.g., '$600')",
          "activities": "Estimated cost (e.g., '$400')",
          "contingency": "Estimated cost (e.g., '$350')"
        },
        "dailyAverage": "Cost per day per person (e.g., '$700/day')",
        "savingTips": [
          "Book hotels 6+ months early.",
          "Use public transport on event days."
        ]
      },
      "days": [
        // REPEAT THIS STRUCTURE FOR ALL ${days} DAYS
        {
          "day": 1,
          "date": "YYYY-MM-DD",
          "city": "City name",
          "theme": "Day theme (e.g., 'Arrival & City Exploration')",
          "morning": {
            "time": "9:00 AM - 12:00 PM",
            "activities": "Detailed plan for morning activities.",
            "location": "Specific area/neighborhood",
            "transportTime": "e.g., '15 minutes from hotel'",
            "cost": "e.g., '$30-50'"
          },
          "afternoon": {
            "time": "12:00 PM - 6:00 PM",
            "activities": "Detailed plan for afternoon activities.",
            "location": "Specific area",
            "transportTime": "e.g., '10 minutes from morning location'",
            "cost": "e.g., '$50-80'"
          },
          "evening": {
            "time": "6:00 PM - 11:00 PM",
            "activities": "Detailed plan for evening activities.",
            "location": "Specific area",
            "transportTime": "e.g., '20 minutes'",
            "cost": "e.g., '$60-100'"
          },
          "event": ${isEventTrip ? `{ 
            "hasEvent": true,
            "startTime": "e.g., '7:00 PM'",
            "venue": "Venue name",
            "teams": "Team 1 vs Team 2",
            "arrivalTime": "e.g., '4:30 PM (2.5 hours early)'",
            "preEventActivities": ["Fan zone", "Team meetups"],
            "postEventPlan": "Safe return to hotel via..."
          }` : 'null'},
          "mealsAndDining": [
            {
              "meal": "Breakfast",
              "recommendation": "Specific restaurant name or 'Hotel breakfast'",
              "cuisine": "Type",
              "location": "Address/area",
              "priceRange": "e.g., '$15-25'"
            },
            {
              "meal": "Lunch",
              "recommendation": "Specific restaurant name",
              "cuisine": "Type",
              "location": "Address/area",
              "priceRange": "e.g., '$20-35'"
            },
            {
              "meal": "Dinner",
              "recommendation": "Specific restaurant name",
              "cuisine": "Type",
              "location": "Address/area",
              "priceRange": "e.g., '$40-80'"
            }
          ],
          "transportation": {
            "method": "Metro/Uber/Walk/Rental Car",
            "totalTime": "e.g., '1.5 hours'",
            "totalCost": "e.g., '$20'"
          },
          "tips": [
            "Wear comfortable shoes.",
            "Bring sunscreen."
          ]
        }
        // Continue for days 2, 3, 4... up to day ${days}
      ],
      "accommodations": [
        {
          "name": "Specific hotel name",
          "checkIn": "YYYY-MM-DD",
          "checkOut": "YYYY-MM-DD",
          "nights": ${days},
          "location": "Neighborhood, distance from venue",
          "description": "Modern hotel with rooftop pool",
          "rating": 4.5,
          "priceRange": {
            "normal": "e.g., '$180/night'",
            "eventDay": "e.g., '$450/night (2.5x multiplier)'",
            "total": "e.g., '$960'"
          },
          "bookingUrl": "https://booking.com/example"
        }
      ],
      "flights": ${origin ? `[
        {
          "route": "${origin} → Primary City",
          "date": "YYYY-MM-DD",
          "estimatedCost": "e.g., '$400-600'",
          "airlines": ["United", "Delta", "American"],
          "tips": ["Book 3 months early"]
        }
      ]` : '[]'},
      "localTips": {
        "language": "Key phrases if not English",
        "currency": "e.g., 'USD ($)' or 'Mexican Peso (MXN)'",
        "customs": "Brief cultural etiquette tip",
        "safety": "Primary safety tip (e.g., 'Stay in groups on event days')",
        "eventTips": [
          "Fan zones open 4 hours before kickoff.",
          "Check venue bag policy online."
        ]
      }
    }
    
    REMEMBER: Create EXACTLY ${days} day objects with complete details for each day. Make it SPECIFIC and REALISTIC with actual place names, realistic pricing, and event-day considerations.
    Fill ALL fields for ALL ${days} days.
    `;

    console.log(`🚀 Using GPT-5.1 with medium reasoning for ${days}-day itinerary`);

    const response = await client.chat.completions.create({
      model: "gpt-5.1", // 🎯 UPGRADED TO GPT-5.1
      messages: [
        {
          role: "system",
          content: "You are Gladys, an expert travel planner specializing in complex, event-based itineraries. You create detailed, optimized JSON itineraries with specific recommendations, realistic pricing, and insider tips. You must fill every field in the requested JSON structure and create the EXACT number of days requested by the user."
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      response_format: { type: "json_object" },
      reasoning_effort: "medium", // Use adaptive reasoning for complex itinerary planning
      // Note: GPT-5.1 doesn't support temperature - it uses reasoning_effort instead
      max_completion_tokens: 8000, // GPT-5.1 uses max_completion_tokens instead of max_tokens
    });

    const raw = response.choices[0].message?.content || "{}";
    let data: any;

    try {
      data = JSON.parse(raw);
    } catch (parseError) {
      console.error("Invalid JSON from OpenAI:", raw);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // --- VALIDATION: Ensure we got the correct number of days ---
    if (!data.days || data.days.length !== days) {
      console.warn(`⚠️ GPT-5.1 returned ${data.days?.length || 0} days instead of ${days}. Adjusting...`);
      // If we got fewer days, we'll still return what we got with a warning
      // In production, you might want to retry the request
    }

    // --- SANITIZATION & METADATA ---
    const sanitizedData: ItineraryData = {
      overview: data.overview || `Your ${days}-day adventure in ${promptLocation} awaits!`,
      tripSummary: data.tripSummary || {
        totalDays: days,
        cities: [location],
        eventsAttending: relevantMatches.length,
        venues: relevantStadiums.map(s => s.name),
        highlights: []
      },
      budget: data.budget || {
        totalBudget: "N/A",
        breakdown: {},
        dailyAverage: "N/A",
        savingTips: []
      },
      days: Array.isArray(data.days) ? data.days : [],
      accommodations: Array.isArray(data.accommodations) ? data.accommodations : [],
      flights: Array.isArray(data.flights) ? data.flights : [],
      localTips: data.localTips || {},
      // Add metadata
      metadata: {
        generatedAt: new Date().toISOString(),
        eventFocused: isEventTrip,
        team: team || null,
        eventCount: relevantMatches.length,
        optimized: optimize || false,
        groupSize: groupSize || 1,
        groupType: groupType || null,
        budget: budget || 'moderate',
        tripType: tripType || 'balanced'
      }
    };

    console.log(`✅ GPT-5.1 enhanced itinerary generated for ${promptLocation} - ${days} days (${data.days?.length || 0} days received)`);
    if (team) console.log(`   Following team: ${team}`);
    if (relevantMatches.length > 0) console.log(`   ${relevantMatches.length} events included`);

    return NextResponse.json(sanitizedData);
    
  } catch (err: any) {
    console.error("Itinerary generation failed:", err);
    return NextResponse.json(
      { 
        error: "Failed to generate itinerary", 
        details: process.env.NODE_ENV === "development" ? err.message : undefined 
      },
      { status: 500 }
    );
  }
}

// GET handler for health checks
export async function GET() {
  return NextResponse.json({ 
    status: "operational",
    service: "GladysTravelAI Enhanced Itinerary API",
    version: "3.0.0-GPT5.1",
    model: "gpt-5.1",
    features: [
      "GPT-5.1 Adaptive Reasoning",
      "Major Event & Tournament Planning",
      "Event-Day Scheduling",
      "Team-Follow Itineraries",
      "Route Optimization",
      "Multi-City Planning",
      "Group Travel Support",
      "Flexible Day Count (1-30 days)"
    ]
  });
}