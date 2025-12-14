import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  console.log('===== FAST ITINERARY API CALLED =====');
  try {
    const {
      location,
      budget,
      origin,
      days,
      tripType,
      groupSize,
      groupType
    } = await req.json();

    if (!location) {
      return NextResponse.json(
        { error: "Destination is required" },
        { status: 400 }
      );
    }
    if (!days) {
      return NextResponse.json(
        { error: "Trip duration (days) is required" },
        { status: 400 }
      );
    }

    console.log(`🚀 Generating ${days}-day itinerary for ${location}`);
    console.log(`Budget: ${budget}, Type: ${tripType}, Group: ${groupType} (${groupSize})`);

    const travelerContext = groupType ? `
Traveler Profile: ${groupType} (${groupSize} ${groupSize === 1 ? 'person' : 'people'})
${groupType === 'solo' ? '- Solo-friendly activities, social hostels, meeting travelers' : ''}
${groupType === 'couple' ? '- Romantic experiences, couples activities, intimate dining' : ''}
${groupType === 'family' ? '- Kid-friendly activities, family restaurants, not too much walking' : ''}
${groupType === 'group' ? '- Group activities, shared experiences, nightlife' : ''}
` : '';

    const budgetContext = budget ? `
Budget: ${budget}
${budget === 'Budget' ? '- $50-100/day: hostels, street food, free attractions' : ''}
${budget === 'Mid-range' ? '- $100-250/day: 3-4 star hotels, nice restaurants' : ''}
${budget === 'Luxury' ? '- $250+/day: 5-star hotels, fine dining, private tours' : ''}
` : '';

    const styleContext = tripType ? `
Travel Style: ${tripType}
${tripType === 'adventure' ? '- Hiking, outdoor activities, nature' : ''}
${tripType === 'romantic' ? '- Sunset spots, couples spa, romantic dinners' : ''}
${tripType === 'cultural' ? '- Museums, historical sites, local traditions' : ''}
${tripType === 'relaxation' ? '- Spa, beach, wellness, peaceful spots' : ''}
${tripType === 'foodie' ? '- Food tours, cooking classes, local markets' : ''}
${tripType === 'family-friendly' ? '- Theme parks, kid activities, family restaurants' : ''}
` : '';

    const prompt = `Create a detailed ${days}-day travel itinerary for ${location}.

${travelerContext}
${budgetContext}
${styleContext}
Origin: ${origin || 'not specified'}

Return ONLY valid JSON with this structure:
{
  "overview": "Exciting 2-sentence overview of the trip",
  "tripSummary": {
    "totalDays": ${days},
    "cities": ["${location}"],
    "highlights": ["Top 5 experiences"]
  },
  "budget": {
    "totalBudget": "$X,XXX USD",
    "dailyAverage": "$XXX/day"
  },
  "days": [
    ${Array.from({ length: days }, (_, i) => `{
      "day": ${i + 1},
      "date": "2025-06-${String(i + 15).padStart(2, '0')}",
      "city": "${location}",
      "theme": "Day theme",
      "morning": {
        "time": "9:00 AM - 12:00 PM",
        "activities": "Specific morning activities",
        "cost": "$20-40"
      },
      "afternoon": {
        "time": "12:00 PM - 6:00 PM",
        "activities": "Specific afternoon activities",
        "cost": "$30-60"
      },
      "evening": {
        "time": "6:00 PM - 11:00 PM",
        "activities": "Specific evening activities",
        "cost": "$40-80"
      },
      "mealsAndDining": [
        {"meal": "Breakfast", "recommendation": "Specific place", "priceRange": "$10-20"},
        {"meal": "Lunch", "recommendation": "Specific place", "priceRange": "$15-30"},
        {"meal": "Dinner", "recommendation": "Specific place", "priceRange": "$25-50"}
      ]
    }`).join(',\n    ')}
  ],
  "accommodations": [{
    "name": "Hotel name",
    "nights": ${days},
    "priceRange": {"total": "$XXX"}
  }]
}

IMPORTANT: Create exactly ${days} complete day objects. Be specific with real place names.`;

    const startTime = Date.now();

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // Fast and cheap
      messages: [
        {
          role: "system",
          content: "You are an expert travel planner. Create detailed, specific itineraries with real place names. Return only valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 4000,
    });

    const endTime = Date.now();
    console.log(`✅ Generated in ${((endTime - startTime) / 1000).toFixed(2)}s`);

    const raw = response.choices[0].message?.content || "{}";
    const data = JSON.parse(raw);

    if (!data.days || data.days.length === 0) {
      console.error('❌ No days in response');
      return NextResponse.json(
        { error: "Failed to generate itinerary" },
        { status: 500 }
      );
    }

    console.log(`✅ Generated ${data.days.length} days`);

    return NextResponse.json({
      ...data,
      metadata: {
        generatedAt: new Date().toISOString(),
        groupSize: groupSize || 1,
        groupType: groupType || null,
        budget: budget || 'moderate',
        tripType: tripType || 'balanced',
        generationTime: `${((endTime - startTime) / 1000).toFixed(2)}s`
      }
    });

  } catch (err: any) {
    console.error("❌ Itinerary generation failed:", err);
    return NextResponse.json(
      {
        error: "Failed to generate itinerary",
        details: process.env.NODE_ENV === "development" ? err.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "operational",
    service: "Gladys Fast Itinerary API",
    model: "gpt-4o-mini",
    averageTime: "5-10 seconds"
  });
}