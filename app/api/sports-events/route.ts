// app/api/sports-events/route.ts - TRADEMARK-SAFE SPORTS EVENTS

import { NextRequest, NextResponse } from "next/server";

interface SportingEvent {
  id: string;
  name: string; // Generic name, no trademarks
  sport: 'Football' | 'Basketball' | 'Tennis' | 'Rugby' | 'Cricket' | 'Formula 1';
  date: string;
  startDate?: string;
  endDate?: string;
  location: {
    city: string;
    country: string;
    venue: string;
  };
  teams?: string[]; // National teams or clubs
  category: 'International' | 'Club' | 'Championship';
  ticketInfo?: {
    available: boolean;
    estimatedPrice: string;
    officialUrl?: string;
  };
  travelPackage?: {
    flights: boolean;
    hotels: boolean;
    tickets: boolean;
    estimatedCost: string;
  };
}

// ⚠️ TRADEMARK-SAFE: We describe events generically
const SUMMER_2026_FOOTBALL_TOURNAMENT: SportingEvent[] = [
  // Opening Matches
  {
    id: 'int-football-2026-001',
    name: 'International Football Tournament - Opening Match',
    sport: 'Football',
    date: '2026-06-11',
    location: {
      city: 'Mexico City',
      country: 'Mexico',
      venue: 'Estadio Azteca'
    },
    category: 'International',
    ticketInfo: {
      available: true,
      estimatedPrice: '$200 - $500',
      officialUrl: 'Check official FIFA channels'
    },
    travelPackage: {
      flights: true,
      hotels: true,
      tickets: false,
      estimatedCost: '$2,500 - $4,000'
    }
  },
  // USA Venues
  {
    id: 'int-football-2026-002',
    name: 'International Football Matches - Los Angeles',
    sport: 'Football',
    startDate: '2026-06-12',
    endDate: '2026-07-10',
    date: '2026-06-12',
    location: {
      city: 'Los Angeles',
      country: 'USA',
      venue: 'SoFi Stadium'
    },
    category: 'International',
    ticketInfo: {
      available: true,
      estimatedPrice: '$150 - $800',
    },
    travelPackage: {
      flights: true,
      hotels: true,
      tickets: false,
      estimatedCost: '$3,000 - $5,500'
    }
  },
  {
    id: 'int-football-2026-003',
    name: 'International Football Matches - New York/New Jersey',
    sport: 'Football',
    startDate: '2026-06-15',
    endDate: '2026-07-19',
    date: '2026-06-15',
    location: {
      city: 'East Rutherford',
      country: 'USA',
      venue: 'MetLife Stadium'
    },
    teams: ['Final Match Host'],
    category: 'International',
    ticketInfo: {
      available: true,
      estimatedPrice: '$300 - $2,000',
    },
    travelPackage: {
      flights: true,
      hotels: true,
      tickets: false,
      estimatedCost: '$4,000 - $8,000'
    }
  },
  {
    id: 'int-football-2026-004',
    name: 'International Football Matches - Miami',
    sport: 'Football',
    startDate: '2026-06-13',
    endDate: '2026-07-03',
    date: '2026-06-13',
    location: {
      city: 'Miami',
      country: 'USA',
      venue: 'Hard Rock Stadium'
    },
    category: 'International',
    ticketInfo: {
      available: true,
      estimatedPrice: '$180 - $700',
    },
    travelPackage: {
      flights: true,
      hotels: true,
      tickets: false,
      estimatedCost: '$2,800 - $5,000'
    }
  },
  // Canada Venues
  {
    id: 'int-football-2026-005',
    name: 'International Football Matches - Toronto',
    sport: 'Football',
    startDate: '2026-06-12',
    endDate: '2026-06-26',
    date: '2026-06-12',
    location: {
      city: 'Toronto',
      country: 'Canada',
      venue: 'BMO Field'
    },
    category: 'International',
    ticketInfo: {
      available: true,
      estimatedPrice: '$160 - $600',
    },
    travelPackage: {
      flights: true,
      hotels: true,
      tickets: false,
      estimatedCost: '$2,600 - $4,500'
    }
  },
  {
    id: 'int-football-2026-006',
    name: 'International Football Matches - Vancouver',
    sport: 'Football',
    startDate: '2026-06-13',
    endDate: '2026-06-27',
    date: '2026-06-13',
    location: {
      city: 'Vancouver',
      country: 'Canada',
      venue: 'BC Place'
    },
    category: 'International',
    ticketInfo: {
      available: true,
      estimatedPrice: '$170 - $650',
    },
    travelPackage: {
      flights: true,
      hotels: true,
      tickets: false,
      estimatedCost: '$2,700 - $4,800'
    }
  },
  // More USA Cities
  {
    id: 'int-football-2026-007',
    name: 'International Football Matches - Dallas',
    sport: 'Football',
    startDate: '2026-06-12',
    endDate: '2026-06-28',
    date: '2026-06-12',
    location: {
      city: 'Dallas',
      country: 'USA',
      venue: 'AT&T Stadium'
    },
    category: 'International',
    ticketInfo: {
      available: true,
      estimatedPrice: '$160 - $700',
    }
  },
  {
    id: 'int-football-2026-008',
    name: 'International Football Matches - Atlanta',
    sport: 'Football',
    startDate: '2026-06-14',
    endDate: '2026-07-01',
    date: '2026-06-14',
    location: {
      city: 'Atlanta',
      country: 'USA',
      venue: 'Mercedes-Benz Stadium'
    },
    category: 'International'
  }
];

// Generate AI-powered travel itinerary for sports event
async function generateEventTravelPlan(event: SportingEvent, userPrefs: any): Promise<any> {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return null;

    const prompt = `Create a 5-day travel itinerary for someone attending a football match in ${event.location.city}, ${event.location.country} on ${event.date}.

Include:
- 2 days before the match (sightseeing, local experiences)
- Match day activities and tips
- 2 days after the match (recovery, exploration)
- Where to watch if they don't have tickets
- Fan zones and social activities
- Local food and nightlife
- Transportation tips

Budget: ${userPrefs?.budget || 'Mid-range'}
Group: ${userPrefs?.groupType || 'solo'}

Return as JSON:
{
  "title": "5-Day ${event.location.city} Football Trip",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "activities": ["Activity 1", "Activity 2"],
      "tips": ["Tip 1", "Tip 2"]
    }
  ],
  "matchDayTips": ["Tip 1", "Tip 2"],
  "budgetBreakdown": {
    "accommodation": "$XXX",
    "food": "$XXX",
    "transport": "$XXX",
    "match_ticket": "$XXX",
    "total": "$XXX"
  }
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    return JSON.parse(data.choices[0]?.message?.content || "{}");

  } catch (error) {
    console.error("Failed to generate event travel plan:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sport, year, city, teamPreference, userPrefs } = await req.json();

    console.log(`🏆 Sports events search: ${sport} ${year} ${city || 'all cities'}`);

    let events = [...SUMMER_2026_FOOTBALL_TOURNAMENT];

    // Filter by sport
    if (sport && sport !== 'all') {
      events = events.filter(e => e.sport.toLowerCase() === sport.toLowerCase());
    }

    // Filter by city
    if (city) {
      events = events.filter(e => 
        e.location.city.toLowerCase().includes(city.toLowerCase()) ||
        e.location.country.toLowerCase().includes(city.toLowerCase())
      );
    }

    // Filter by team (for following your team)
    if (teamPreference) {
      events = events.filter(e => 
        e.teams?.some(t => t.toLowerCase().includes(teamPreference.toLowerCase()))
      );
    }

    // Sort by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Generate travel plans for each event if requested
    if (userPrefs?.generateItinerary) {
      const eventsWithPlans = await Promise.all(
        events.map(async (event) => ({
          ...event,
          travelPlan: await generateEventTravelPlan(event, userPrefs)
        }))
      );
      
      return NextResponse.json({
        events: eventsWithPlans,
        count: eventsWithPlans.length,
        source: "curated_with_ai",
        disclaimer: "Event names are generic. Check official sources for trademarked names and ticket sales."
      });
    }

    return NextResponse.json({
      events,
      count: events.length,
      source: "curated",
      tip: "Add ?generateItinerary=true to get full travel plans for each match",
      disclaimer: "Event names are generic. Visit official organizing body websites for trademarked names and ticket sales."
    });

  } catch (error: any) {
    console.error("Sports events API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sports events", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "operational",
    service: "Sports Events Travel Planner (Trademark-Safe)",
    available_events: {
      "2026_summer_football": {
        event: "Major International Football Tournament",
        dates: "June 11 - July 19, 2026",
        countries: ["USA", "Canada", "Mexico"],
        cities: 16,
        matches: "80+ matches",
        note: "Travel packages available for all venues"
      }
    },
    features: [
      "✅ Venue-specific travel planning",
      "✅ Multi-city packages",
      "✅ Fan experience guides",
      "✅ Budget breakdowns",
      "✅ AI-generated itineraries",
      "⚠️ Trademark-compliant naming"
    ],
    usage: {
      all_events: "POST /api/sports-events { sport: 'Football', year: 2026 }",
      specific_city: "POST /api/sports-events { sport: 'Football', city: 'Los Angeles' }",
      with_itinerary: "POST /api/sports-events { sport: 'Football', city: 'Miami', userPrefs: { generateItinerary: true } }"
    },
    legal_notice: "Event names intentionally generic to avoid trademark infringement. Users should verify official names and ticket sources independently."
  });
}