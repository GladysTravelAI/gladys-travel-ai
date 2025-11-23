import { NextRequest, NextResponse } from "next/server";

// Fallback activities for common destinations
const FALLBACK_ACTIVITIES: Record<string, any[]> = {
  'paris': [
    {
      name: "Eiffel Tower",
      type: "Landmark",
      duration: "2-3 hours",
      priceRange: "$$",
      rating: "4.8",
      bestTime: "Sunset",
      description: "Iconic iron tower with panoramic city views"
    },
    {
      name: "Louvre Museum",
      type: "Museum",
      duration: "3-4 hours",
      priceRange: "$$$",
      rating: "4.7",
      bestTime: "Morning",
      description: "World's largest art museum, home to Mona Lisa"
    },
    {
      name: "Seine River Cruise",
      type: "Tour",
      duration: "1-2 hours",
      priceRange: "$$",
      rating: "4.6",
      bestTime: "Evening",
      description: "Romantic boat tour along the Seine"
    }
  ],
  'tokyo': [
    {
      name: "Senso-ji Temple",
      type: "Cultural Site",
      duration: "1-2 hours",
      priceRange: "Free",
      rating: "4.7",
      bestTime: "Early morning",
      description: "Ancient Buddhist temple in Asakusa"
    },
    {
      name: "Shibuya Crossing",
      type: "Landmark",
      duration: "30 minutes",
      priceRange: "Free",
      rating: "4.6",
      bestTime: "Evening",
      description: "World's busiest pedestrian crossing"
    },
    {
      name: "TeamLab Borderless",
      type: "Museum",
      duration: "2-3 hours",
      priceRange: "$$$",
      rating: "4.9",
      bestTime: "Any time",
      description: "Immersive digital art museum"
    }
  ],
  'new york': [
    {
      name: "Central Park",
      type: "Park",
      duration: "2-4 hours",
      priceRange: "Free",
      rating: "4.8",
      bestTime: "Morning/Afternoon",
      description: "Iconic urban park in Manhattan"
    },
    {
      name: "Statue of Liberty",
      type: "Landmark",
      duration: "3-4 hours",
      priceRange: "$$",
      rating: "4.7",
      bestTime: "Morning",
      description: "Symbol of freedom and democracy"
    },
    {
      name: "Broadway Show",
      type: "Entertainment",
      duration: "2-3 hours",
      priceRange: "$$$$",
      rating: "4.9",
      bestTime: "Evening",
      description: "World-famous theater district"
    }
  ]
};

/**
 * Fetch activities from Google Places API
 */
async function fetchGoogleActivities(location: string, apiKey: string): Promise<any[]> {
  try {
    const query = `tourist attractions things to do in ${encodeURIComponent(location)}`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&type=tourist_attraction&key=${apiKey}`;

    console.log(`🔍 Google Places: Searching activities in ${location}`);

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      console.log(`Google Places: Request failed (${response.status})`);
      return [];
    }

    const data = await response.json();

    if (data.status !== "OK" || !Array.isArray(data.results)) {
      console.log(`Google Places: ${data.status || 'Invalid response'}`);
      return [];
    }

    const activities = data.results
      .slice(0, 12) // Limit to 12 activities
      .map((place: any, index: number) => ({
        id: place.place_id || `activity-${index}`,
        name: place.name,
        type: place.types?.includes('museum') ? 'Museum' :
              place.types?.includes('park') ? 'Park' :
              place.types?.includes('shopping_mall') ? 'Shopping' :
              place.types?.includes('amusement_park') ? 'Entertainment' :
              'Attraction',
        address: place.formatted_address || place.vicinity,
        rating: place.rating?.toString() || "4.0",
        priceRange: place.price_level 
          ? place.price_level === 0 ? "Free" : "$".repeat(place.price_level)
          : "$$",
        location: place.vicinity || location,
        photo: place.photos?.[0]
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
          : null,
        userRatingsTotal: place.user_ratings_total || 0,
        description: place.editorial_summary?.overview || 
                     `Popular ${place.types?.[0]?.replace(/_/g, ' ') || 'attraction'} in ${location}`,
        businessStatus: place.business_status,
        duration: "1-3 hours"
      }))
      .filter((a: any) => a.name && a.businessStatus !== 'CLOSED_PERMANENTLY');

    console.log(`✅ Google Places: Found ${activities.length} activities`);
    return activities;

  } catch (error: any) {
    console.error("Google Places API Error:", error.message);
    return [];
  }
}

/**
 * Generate AI-powered activity recommendations
 */
async function fetchAIActivities(location: string, tripType?: string): Promise<any[]> {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.log("OpenAI: API key not configured");
      return [];
    }

    console.log(`🤖 OpenAI: Generating activities for ${location}`);

    const prompt = `Generate a JSON array of 10 must-do activities and attractions in ${location}.
    ${tripType ? `Focus on ${tripType} activities.` : ''}
    
    Include a diverse mix:
    - Famous landmarks and must-sees
    - Cultural experiences
    - Outdoor activities
    - Museums/galleries
    - Local experiences
    - Free and paid options
    - Day and evening activities
    
    Format EXACTLY as:
    [
      {
        "name": "Activity Name",
        "type": "Museum|Landmark|Park|Tour|Entertainment|Cultural|Shopping|Food|Adventure|Nightlife",
        "duration": "1-2 hours",
        "priceRange": "Free|$|$$|$$$|$$$$",
        "rating": "4.5",
        "bestTime": "Morning|Afternoon|Evening|Any time",
        "description": "One sentence description"
      }
    ]
    
    Use REAL activity names. Make it realistic and exciting. Return ONLY the JSON array.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000
      }),
      signal: AbortSignal.timeout(20000)
    });

    if (!response.ok) {
      console.log(`OpenAI: Request failed (${response.status})`);
      return [];
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log("OpenAI: No valid JSON in response");
      return [];
    }

    const activities = JSON.parse(jsonMatch[0]);
    
    // Add IDs and placeholder images
    const activitiesWithExtras = activities.map((activity: any, index: number) => ({
      ...activity,
      id: `ai-activity-${index}`,
      photo: `https://images.unsplash.com/photo-${1506905925346 + index * 100}?w=800`,
      address: `${location}`,
      location: location
    }));

    console.log(`✅ OpenAI: Generated ${activitiesWithExtras.length} activities`);
    return activitiesWithExtras;

  } catch (error: any) {
    console.error("OpenAI Activities Error:", error.message);
    return [];
  }
}

/**
 * Get fallback activities for common destinations
 */
function getFallbackActivities(location: string): any[] {
  const normalizedLocation = location.toLowerCase().trim();
  
  // Check for matches in fallback data
  for (const [city, activities] of Object.entries(FALLBACK_ACTIVITIES)) {
    if (normalizedLocation.includes(city)) {
      console.log(`✅ Fallback: Using curated activities for ${city}`);
      return activities.map((a, i) => ({ 
        ...a, 
        id: `fallback-${i}`,
        photo: `https://images.unsplash.com/photo-${1506905925346 + i * 100}?w=800`,
        address: `${a.name}, ${city}`,
        location: city
      }));
    }
  }
  
  // Generic activities
  console.log(`✅ Fallback: Using generic activities for ${location}`);
  return [
    {
      id: "generic-1",
      name: `${location} City Tour`,
      type: "Tour",
      duration: "2-3 hours",
      priceRange: "$$",
      rating: "4.4",
      bestTime: "Morning",
      photo: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
      description: "Comprehensive city walking tour with local guide",
      address: `City Center, ${location}`,
      location: location
    },
    {
      id: "generic-2",
      name: "Local Market Experience",
      type: "Cultural",
      duration: "1-2 hours",
      priceRange: "$",
      rating: "4.5",
      bestTime: "Morning",
      photo: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800",
      description: "Explore local markets and street food",
      address: `Market District, ${location}`,
      location: location
    },
    {
      id: "generic-3",
      name: "City Museum",
      type: "Museum",
      duration: "2-3 hours",
      priceRange: "$$",
      rating: "4.3",
      bestTime: "Any time",
      photo: "https://images.unsplash.com/photo-1565183997392-2f1339720c2c?w=800",
      description: "Local history and culture museum",
      address: `Museum Quarter, ${location}`,
      location: location
    },
    {
      id: "generic-4",
      name: "Parks & Gardens",
      type: "Park",
      duration: "1-2 hours",
      priceRange: "Free",
      rating: "4.6",
      bestTime: "Afternoon",
      photo: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800",
      description: "Relax in beautiful public gardens",
      address: `Green District, ${location}`,
      location: location
    },
    {
      id: "generic-5",
      name: "Food & Wine Tour",
      type: "Food",
      duration: "3-4 hours",
      priceRange: "$$$",
      rating: "4.7",
      bestTime: "Evening",
      photo: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
      description: "Taste local specialties and wines",
      address: `Food District, ${location}`,
      location: location
    }
  ];
}

/**
 * Main POST endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const { location, tripType } = await req.json();

    if (!location || location.trim() === "") {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 }
      );
    }

    console.log(`🎢 Activities search: ${location}${tripType ? ` (${tripType})` : ''}`);

    let activities: any[] = [];

    // Strategy 1: Try Google Places API
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACE_API_KEY;
    if (googleApiKey) {
      activities = await fetchGoogleActivities(location, googleApiKey);
      if (activities.length > 0) {
        return NextResponse.json({
          activities,
          source: "google_places",
          count: activities.length
        });
      }
    }

    // Strategy 2: Try AI-generated activities
    activities = await fetchAIActivities(location, tripType);
    if (activities.length > 0) {
      return NextResponse.json({
        activities,
        source: "ai_generated",
        count: activities.length,
        note: "AI-generated recommendations. Add GOOGLE_PLACES_API_KEY for real attraction data."
      });
    }

    // Strategy 3: Use fallback activities
    activities = getFallbackActivities(location);
    return NextResponse.json({
      activities,
      source: "fallback",
      count: activities.length,
      note: "Using sample activities. Add API keys for real attraction data."
    });

  } catch (error: any) {
    console.error("❌ Activities API Error:", error);
    
    // Return fallback even on error
    const activities = getFallbackActivities("your destination");
    
    return NextResponse.json({
      activities,
      source: "error_fallback",
      error: "API error occurred",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  const hasGooglePlaces = !!(process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACE_API_KEY);
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  return NextResponse.json({
    status: "operational",
    service: "GladysTravelAI Activities API",
    sources: {
      google_places: hasGooglePlaces ? "configured" : "missing (add GOOGLE_PLACES_API_KEY)",
      ai_generated: hasOpenAI ? "available" : "unavailable",
      fallback: "always available"
    },
    recommendation: !hasGooglePlaces
      ? "Add GOOGLE_PLACES_API_KEY for real attraction data with photos and reviews"
      : "All systems operational"
  });
}