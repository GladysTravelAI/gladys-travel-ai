import { NextRequest, NextResponse } from "next/server";

// Fallback restaurant data for common destinations
const FALLBACK_RESTAURANTS: Record<string, any[]> = {
  'paris': [
    {
      name: "Le Jules Verne",
      cuisine: "French Fine Dining",
      priceRange: "$$$$",
      rating: "4.8",
      mustTry: "Duck confit",
      location: "Eiffel Tower",
      description: "Michelin-starred restaurant in the Eiffel Tower"
    },
    {
      name: "L'As du Fallafel",
      cuisine: "Middle Eastern",
      priceRange: "$",
      rating: "4.6",
      mustTry: "Falafel sandwich",
      location: "Le Marais",
      description: "Famous falafel spot in the Jewish quarter"
    },
    {
      name: "Breizh Café",
      cuisine: "Crêperie",
      priceRange: "$$",
      rating: "4.5",
      mustTry: "Buckwheat galettes",
      location: "Marais",
      description: "Authentic Breton crêpes and cider"
    }
  ],
  'tokyo': [
    {
      name: "Sukiyabashi Jiro",
      cuisine: "Sushi",
      priceRange: "$$$$",
      rating: "4.9",
      mustTry: "Omakase",
      location: "Ginza",
      description: "World-famous sushi by Jiro Ono"
    },
    {
      name: "Ichiran Ramen",
      cuisine: "Ramen",
      priceRange: "$",
      rating: "4.5",
      mustTry: "Tonkotsu ramen",
      location: "Shibuya",
      description: "Individual booth ramen experience"
    },
    {
      name: "Tsukiji Outer Market",
      cuisine: "Seafood",
      priceRange: "$$",
      rating: "4.7",
      mustTry: "Fresh sashimi",
      location: "Tsukiji",
      description: "Fresh seafood and street food"
    }
  ]
};

/**
 * Fetch restaurants from Google Places API
 */
async function fetchGoogleRestaurants(location: string, apiKey: string): Promise<any[]> {
  try {
    const query = `restaurants in ${encodeURIComponent(location)}`;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&type=restaurant&key=${apiKey}`;

    console.log(`🔍 Google Places: Searching restaurants in ${location}`);

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

    const restaurants = data.results
      .slice(0, 12) // Limit to 12 restaurants
      .map((place: any, index: number) => ({
        id: place.place_id || `restaurant-${index}`,
        name: place.name,
        cuisine: place.types?.find((t: string) => 
          ['restaurant', 'cafe', 'bar'].indexOf(t) === -1
        ) || "Restaurant",
        address: place.formatted_address || place.vicinity,
        rating: place.rating?.toString() || "4.0",
        priceRange: place.price_level 
          ? "$".repeat(place.price_level) 
          : "$$",
        location: place.vicinity || location,
        photo: place.photos?.[0]
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${apiKey}`
          : null,
        userRatingsTotal: place.user_ratings_total || 0,
        description: `Popular ${place.types?.[0] || 'restaurant'} in ${location}`
      }))
      .filter((r: any) => r.name); // Filter out invalid entries

    console.log(`✅ Google Places: Found ${restaurants.length} restaurants`);
    return restaurants;

  } catch (error: any) {
    console.error("Google Places API Error:", error.message);
    return [];
  }
}

/**
 * Generate AI-powered restaurant recommendations
 */
async function fetchAIRestaurants(location: string, tripType?: string): Promise<any[]> {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.log("OpenAI: API key not configured");
      return [];
    }

    console.log(`🤖 OpenAI: Generating restaurants for ${location}`);

    const prompt = `Generate a JSON array of 8 realistic, diverse restaurants in ${location}. 
    ${tripType ? `Consider trip style: ${tripType}` : ''}
    
    Include a mix of:
    - Local cuisine specialties
    - Budget-friendly options
    - Mid-range favorites
    - 1-2 upscale options
    - Different neighborhoods
    
    Format EXACTLY as:
    [
      {
        "name": "Restaurant Name",
        "cuisine": "Type of food",
        "priceRange": "$ or $$ or $$$ or $$$$",
        "rating": "4.5",
        "mustTry": "Signature dish",
        "location": "Neighborhood name",
        "description": "One sentence about the restaurant"
      }
    ]
    
    Make them realistic with REAL restaurant names if possible. Return ONLY the JSON array.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 1500
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

    const restaurants = JSON.parse(jsonMatch[0]);
    
    // Add IDs and placeholder images
    const restaurantsWithExtras = restaurants.map((rest: any, index: number) => ({
      ...rest,
      id: `ai-restaurant-${index}`,
      photo: `https://images.unsplash.com/photo-${1517248135467 + index * 100}?w=800`,
      address: `${rest.location}, ${location}`
    }));

    console.log(`✅ OpenAI: Generated ${restaurantsWithExtras.length} restaurants`);
    return restaurantsWithExtras;

  } catch (error: any) {
    console.error("OpenAI Restaurants Error:", error.message);
    return [];
  }
}

/**
 * Get fallback restaurants for common destinations
 */
function getFallbackRestaurants(location: string): any[] {
  const normalizedLocation = location.toLowerCase().trim();
  
  // Check for matches in fallback data
  for (const [city, restaurants] of Object.entries(FALLBACK_RESTAURANTS)) {
    if (normalizedLocation.includes(city)) {
      console.log(`✅ Fallback: Using curated restaurants for ${city}`);
      return restaurants.map((r, i) => ({ 
        ...r, 
        id: `fallback-${i}`,
        photo: `https://images.unsplash.com/photo-${1517248135467 + i * 100}?w=800`,
        address: `${r.location}, ${city}`
      }));
    }
  }
  
  // Generic restaurants
  console.log(`✅ Fallback: Using generic restaurants for ${location}`);
  return [
    {
      id: "generic-1",
      name: `${location} Bistro`,
      cuisine: "Local Cuisine",
      priceRange: "$$",
      rating: "4.3",
      mustTry: "Chef's special",
      location: "City Center",
      photo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
      description: "Popular local spot with authentic dishes",
      address: `Downtown, ${location}`
    },
    {
      id: "generic-2",
      name: "The Local Grill",
      cuisine: "Steakhouse",
      priceRange: "$$$",
      rating: "4.5",
      mustTry: "Ribeye steak",
      location: "Historic District",
      photo: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
      description: "Premium steaks and local wines",
      address: `Historic Quarter, ${location}`
    },
    {
      id: "generic-3",
      name: "Street Food Market",
      cuisine: "Street Food",
      priceRange: "$",
      rating: "4.4",
      mustTry: "Various street food",
      location: "Market Square",
      photo: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
      description: "Diverse street food vendors",
      address: `Market District, ${location}`
    },
    {
      id: "generic-4",
      name: "Café Central",
      cuisine: "Café",
      priceRange: "$",
      rating: "4.2",
      mustTry: "Coffee and pastries",
      location: "Downtown",
      photo: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
      description: "Cozy café with fresh pastries",
      address: `Main Street, ${location}`
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

    console.log(`🍽️ Restaurant search: ${location}`);

    let restaurants: any[] = [];

    // Strategy 1: Try Google Places API
    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACE_API_KEY;
    if (googleApiKey) {
      restaurants = await fetchGoogleRestaurants(location, googleApiKey);
      if (restaurants.length > 0) {
        return NextResponse.json({
          restaurants,
          source: "google_places",
          count: restaurants.length
        });
      }
    }

    // Strategy 2: Try AI-generated restaurants
    restaurants = await fetchAIRestaurants(location, tripType);
    if (restaurants.length > 0) {
      return NextResponse.json({
        restaurants,
        source: "ai_generated",
        count: restaurants.length,
        note: "AI-generated recommendations. Add GOOGLE_PLACES_API_KEY for real restaurant data."
      });
    }

    // Strategy 3: Use fallback restaurants
    restaurants = getFallbackRestaurants(location);
    return NextResponse.json({
      restaurants,
      source: "fallback",
      count: restaurants.length,
      note: "Using sample restaurants. Add API keys for real restaurant data."
    });

  } catch (error: any) {
    console.error("❌ Restaurants API Error:", error);
    
    // Return fallback even on error
    const restaurants = getFallbackRestaurants("your destination");
    
    return NextResponse.json({
      restaurants,
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
    service: "GladysTravelAI Restaurants API",
    sources: {
      google_places: hasGooglePlaces ? "configured" : "missing (add GOOGLE_PLACES_API_KEY)",
      ai_generated: hasOpenAI ? "available" : "unavailable",
      fallback: "always available"
    },
    recommendation: !hasGooglePlaces
      ? "Add GOOGLE_PLACES_API_KEY for real restaurant data with photos and reviews"
      : "All systems operational"
  });
}