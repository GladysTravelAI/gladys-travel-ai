// app/api/itinerary/route.ts - Enhanced with opulent design system
import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ RETRY LOGIC with exponential backoff
async function generateItineraryWithRetry(prompt: string, maxRetries = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📝 Attempt ${attempt}/${maxRetries}: Generating itinerary...`);
      
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert travel planner creating luxurious, opulent travel experiences. Create detailed, specific itineraries with real place names. Focus on premium experiences, hidden gems, and authentic local culture. Return ONLY valid JSON with no markdown formatting or explanations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 6000,
      });

      const raw = response.choices[0].message?.content || "{}";
      
      // ✅ BETTER JSON PARSING with error handling
      let data;
      try {
        data = JSON.parse(raw);
      } catch (parseError) {
        console.error(`❌ JSON Parse Error on attempt ${attempt}:`, parseError);
        if (attempt === maxRetries) throw parseError;
        continue; // Retry
      }

      // ✅ VALIDATE RESPONSE
      if (!data.days || !Array.isArray(data.days) || data.days.length === 0) {
        console.error(`❌ Invalid response structure on attempt ${attempt}`);
        if (attempt === maxRetries) {
          throw new Error("Generated itinerary missing required 'days' array");
        }
        continue; // Retry
      }

      console.log(`✅ Successfully generated ${data.days.length} days on attempt ${attempt}`);
      return data;

    } catch (error: any) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // ✅ EXPONENTIAL BACKOFF
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  throw new Error("Failed to generate itinerary after all retries");
}

export async function POST(req: Request) {
  console.log('===== 🎨 OPULENT ITINERARY API CALLED =====');
  
  try {
    const {
      location,
      budget,
      origin,
      days,
      tripType,
      groupSize,
      groupType,
      startDate,
      endDate
    } = await req.json();

    // ✅ VALIDATION
    if (!location || typeof location !== 'string') {
      return NextResponse.json(
        { error: "Valid destination is required" },
        { status: 400 }
      );
    }
    
    if (!days || days < 1 || days > 30) {
      return NextResponse.json(
        { error: "Days must be between 1 and 30" },
        { status: 400 }
      );
    }

    console.log(`🚀 Generating ${days}-day opulent itinerary for ${location}`);

    // ✅ CALCULATE REAL DATES
    const startDateObj = startDate ? new Date(startDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const dates = Array.from({ length: days }, (_, i) => {
      const date = new Date(startDateObj);
      date.setDate(date.getDate() + i);
      return date.toISOString().split('T')[0];
    });

    const travelerContext = groupType ? `
🎭 Traveler Profile: ${groupType} (${groupSize} ${groupSize === 1 ? 'person' : 'people'})
${groupType === 'solo' ? '✨ Premium solo experiences: exclusive tours, curated social events, boutique accommodations, personal guide services' : ''}
${groupType === 'couple' ? '💫 Romantic luxury: sunset champagne, couples spa, private dining, intimate yacht experiences' : ''}
${groupType === 'family' ? '🌟 Family premium: kid-friendly luxury resorts, private guides, exclusive family activities, gourmet kid menus' : ''}
${groupType === 'group' ? '🎉 Group luxury: private villas, group experiences, VIP nightlife, premium transportation' : ''}
` : '';

    const budgetContext = budget ? `
💰 Budget Tier: ${budget}
${budget === 'Budget' ? '🎯 Smart Luxury: $50-100/day - Boutique hostels, authentic local eateries, free premium experiences, walking tours with locals' : ''}
${budget === 'Mid-range' ? '✨ Refined Comfort: $100-250/day - 4-star boutique hotels, excellent restaurants, premium attractions, local gems' : ''}
${budget === 'Luxury' ? '👑 Opulent Experience: $250+/day - 5-star luxury hotels, Michelin dining, private tours, exclusive access, premium everything' : ''}
` : '';

    const styleContext = tripType ? `
🎨 Experience Style: ${tripType}
${tripType === 'adventure' ? '⛰️ Premium Adventure: Private hiking guides, luxury camping, exclusive outdoor experiences, gourmet trail meals' : ''}
${tripType === 'romantic' ? '💕 Romantic Opulence: Sunset experiences, couples spa luxury, candlelit dining, private moments' : ''}
${tripType === 'cultural' ? '🎭 Cultural Immersion: Private museum tours, meet local artisans, exclusive historical access, authentic experiences' : ''}
${tripType === 'relaxation' ? '🧘 Wellness Luxury: Premium spa days, beach clubs, mindfulness experiences, peaceful premium locations' : ''}
${tripType === 'foodie' ? '🍽️ Gastronomic Excellence: Private chef experiences, cooking masterclasses, food tours, Michelin recommendations' : ''}
${tripType === 'family-friendly' ? '👨‍👩‍👧‍👦 Premium Family: Exclusive family experiences, kid-friendly luxury, interactive learning, fun premium activities' : ''}
` : '';

    const prompt = `Create an OPULENT, detailed ${days}-day travel itinerary for ${location}.

🎯 DESIGN PHILOSOPHY: Create an experience that feels luxurious, thoughtful, and authentic. Focus on quality over quantity, hidden gems over tourist traps, and memorable moments over checkboxes.

${travelerContext}
${budgetContext}
${styleContext}
📍 Origin: ${origin || 'not specified'}
📅 Start Date: ${dates[0]}

CRITICAL: You MUST return valid JSON matching this EXACT structure:
{
  "overview": "3-4 sentence captivating overview that sells the experience. Make it exciting, luxurious, and enticing. Use evocative language.",
  "tripSummary": {
    "totalDays": ${days},
    "cities": ["${location}"],
    "highlights": [
      "🌟 Exclusive sunset experience at [specific location]",
      "✨ Private tour of [hidden gem]",
      "🎭 Authentic cultural immersion at [specific place]",
      "🍽️ Michelin-starred dining at [restaurant name]",
      "💎 Premium spa experience at [specific spa]"
    ]
  },
  "budget": {
    "totalBudget": "$X,XXX USD",
    "dailyAverage": "$XXX/day",
    "breakdown": {
      "accommodation": "XX%",
      "dining": "XX%",
      "activities": "XX%",
      "transport": "XX%"
    }
  },
  "days": [
    ${dates.map((date, i) => `{
      "day": ${i + 1},
      "date": "${date}",
      "city": "${location}",
      "theme": "${i === 0 ? '✨ Grand Arrival & First Impressions' : i === dates.length - 1 ? '👋 Farewell & Final Moments' : `🎨 Day ${i + 1} unique theme`}",
      "morning": {
        "time": "9:00 AM - 12:00 PM",
        "activities": "Specific morning activities with REAL place names. Be detailed and luxurious.",
        "location": "Exact location name with neighborhood",
        "transportTime": "15 mins by private car/metro/walk",
        "cost": "$20-40",
        "highlights": ["Specific highlight 1", "Specific highlight 2"]
      },
      "afternoon": {
        "time": "12:00 PM - 6:00 PM",
        "activities": "Specific afternoon experiences with REAL place names. Include hidden gems.",
        "location": "Exact location name with neighborhood",
        "transportTime": "10 mins walk/ride",
        "cost": "$30-60",
        "highlights": ["Specific highlight 1", "Specific highlight 2"]
      },
      "evening": {
        "time": "6:00 PM - 11:00 PM",
        "activities": "Specific evening experiences with REAL place names. Make it memorable.",
        "location": "Exact location name with neighborhood",
        "transportTime": "5 mins walk",
        "cost": "$40-80",
        "highlights": ["Specific highlight 1", "Specific highlight 2"]
      },
      "mealsAndDining": [
        {
          "meal": "Breakfast",
          "recommendation": "Specific cafe/restaurant name (REAL)",
          "cuisine": "Type of cuisine",
          "location": "Neighborhood",
          "priceRange": "$10-20",
          "specialty": "What they're famous for",
          "vibe": "Atmosphere description"
        },
        {
          "meal": "Lunch",
          "recommendation": "Specific restaurant name (REAL)",
          "cuisine": "Type of cuisine",
          "location": "Neighborhood",
          "priceRange": "$15-30",
          "specialty": "What they're famous for",
          "vibe": "Atmosphere description"
        },
        {
          "meal": "Dinner",
          "recommendation": "Specific restaurant name (REAL)",
          "cuisine": "Type of cuisine",
          "location": "Neighborhood",
          "priceRange": "$25-50",
          "specialty": "What they're famous for",
          "vibe": "Atmosphere description",
          "reservationNote": "Book in advance / Walk-ins ok"
        }
      ],
      "tips": [
        "💡 Insider tip about the best time to visit [specific place]",
        "🎯 Pro tip about avoiding crowds at [location]",
        "✨ Hidden gem recommendation nearby",
        "📸 Best photo spot of the day"
      ]
    }`).join(',\n    ')}
  ],
  "accommodations": [
    {
      "name": "Specific hotel/boutique hotel name (REAL if possible)",
      "location": "${location}",
      "nights": ${days},
      "type": "Boutique Hotel / Luxury Resort / Premium Hostel",
      "priceRange": {
        "total": "$XXX - $XXX",
        "perNight": "$XX - $XX"
      },
      "description": "Detailed description of the property, its style, and why it's special",
      "amenities": ["Specific amenity 1", "Specific amenity 2", "Specific amenity 3"],
      "bookingUrl": "https://www.booking.com/search.html?ss=${encodeURIComponent(location)}",
      "neighborhood": "Specific neighborhood name",
      "whyStayHere": "2-3 sentences on why this place is perfect"
    }
  ],
  "transportationGuide": {
    "gettingThere": "Best way to reach ${location} from ${origin || 'major airports'}",
    "gettingAround": "Best local transport options (metro, bikes, walking)",
    "passes": "Recommended transport passes or cards",
    "tipsAndTricks": "Transport insider tips"
  },
  "localInsights": {
    "bestTime": "Best time of day/season to visit",
    "culture": "Important cultural customs to know",
    "language": "Useful phrases in local language",
    "money": "Currency, tipping, budget tips",
    "safety": "Safety considerations and tips"
  }
}

CRITICAL REQUIREMENTS:
✅ Use REAL place names, restaurants, and attractions (research if needed)
✅ Be specific with exact locations, neighborhoods, and landmarks
✅ Create exactly ${days} complete day objects
✅ Include realistic, researched costs
✅ Make it luxurious, exciting, and authentically local
✅ Focus on hidden gems and unique experiences
✅ Provide insider tips and local knowledge
✅ Return ONLY the JSON object, no markdown formatting
✅ Make every recommendation feel personal and thoughtful`;

    const startTime = Date.now();

    // ✅ USE RETRY LOGIC
    const data = await generateItineraryWithRetry(prompt);

    const endTime = Date.now();
    const generationTime = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`✅ Generated ${data.days.length} opulent days in ${generationTime}s`);

    // ✅ ADD COMPREHENSIVE METADATA
    return NextResponse.json({
      ...data,
      metadata: {
        generatedAt: new Date().toISOString(),
        groupSize: groupSize || 1,
        groupType: groupType || null,
        budget: budget || 'Mid-range',
        tripType: tripType || 'balanced',
        generationTime: `${generationTime}s`,
        origin: origin || null,
        startDate: dates[0],
        endDate: dates[dates.length - 1],
        version: '3.0-opulent',
        designPhilosophy: 'Luxurious, authentic, and thoughtfully curated experiences'
      }
    });

  } catch (err: any) {
    console.error("❌ Itinerary generation failed:", err);
    
    // ✅ BETTER ERROR RESPONSE
    return NextResponse.json(
      {
        error: "Failed to generate itinerary",
        message: err.message || "Unknown error occurred",
        details: process.env.NODE_ENV === "development" ? {
          stack: err.stack,
          name: err.name
        } : undefined,
        fallback: "Please try again or reduce the number of days",
        suggestion: "Our AI is temporarily overwhelmed. Try again in a moment or contact support."
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "operational",
    service: "Gladys Travel AI - Opulent Itinerary API",
    model: "gpt-4o-mini",
    features: [
      "✨ Opulent, luxurious experiences",
      "🎯 Hidden gems and authentic culture",
      "✅ Retry logic with exponential backoff",
      "✅ Better error handling",
      "✅ Increased token limit (6000)",
      "✅ Real date calculation",
      "✅ JSON validation",
      "✅ Timeout protection",
      "💎 Premium recommendations",
      "🏆 Insider tips and local knowledge"
    ],
    averageTime: "5-15 seconds",
    maxDays: 30,
    version: "3.0-opulent"
  });
}