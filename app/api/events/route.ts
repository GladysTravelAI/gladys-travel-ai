// app/api/events/route.ts
// 🎯 Event Discovery API - Trademark-Safe Architecture with Travel Intelligence
//
// LEGAL FRAMEWORK:
// This API provides informational access to publicly observable events.
// Events retain their real names for SEO and informational purposes.
// Trademark metadata is included to ensure proper legal compliance.
// GladysTravelAI aggregates public event information for travel planning only.

import { NextRequest, NextResponse } from "next/server";
import { 
  getAllEvents,
  getEventsByType,
  getFeaturedEvents,
  searchEventsByQuery,
  filterEventsByLocation,
  filterEventsByDateRange,
  getEventStatus,
  generateEventTravelWindow,
  type Event
} from "@/lib/eventService";

// ==================== RESPONSE TYPE ====================

interface EventsAPIResponse {
  success: boolean;
  events: any[]; // Enriched events with status and travel window
  count: number;
  metadata?: {
    query?: string;
    filters?: {
      type?: string;
      featured?: boolean;
      destination?: string;
      dateRange?: {
        start: string;
        end: string;
      };
    };
    source: string;
    timestamp: string;
    trademarkNotice?: string;
  };
  error?: string;
}

// ==================== TRADEMARK NOTICE ====================
// STRATEGIC: Centralized legal notice for API responses
// This appears when trademarked events are in the response

const TRADEMARK_NOTICE = 
  "Event names and trademarks are property of their respective owners. " +
  "GladysTravelAI is an independent travel planning service not affiliated with, " +
  "endorsed by, or sponsored by any event organizer or trademark owner.";

// ==================== HELPER: Check if response contains trademarked events ====================

function containsTrademarkedEvents(events: Event[]): boolean {
  return events.some(event => event.trademark?.isTrademarked === true);
}

// ==================== GET /api/events ====================
// STRATEGIC: Event discovery and filtering
// Returns events with full trademark metadata + travel intelligence

export async function GET(req: NextRequest): Promise<NextResponse<EventsAPIResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    
    // Extract query parameters
    const type = searchParams.get('type');
    const featured = searchParams.get('featured');
    const query = searchParams.get('q');

    // STRATEGIC: Start with appropriate base dataset
    let events: Event[] = [];

    if (featured === 'true') {
      // Featured events only
      events = getFeaturedEvents();
    } else if (type && type !== 'all') {
      // Filter by type
      const validTypes: Array<Event['type']> = ['sports', 'music', 'festival'];
      
      if (validTypes.includes(type as Event['type'])) {
        events = getEventsByType(type as Event['type']);
      } else {
        // Invalid type - return empty
        events = [];
      }
    } else {
      // All events
      events = getAllEvents();
    }

    // Apply text search if provided
    if (query && query.trim()) {
      events = searchEventsByQuery(events, query.trim());
    }

    // STRATEGIC: Enrich events with real-time intelligence
    const enrichedEvents = events.map(event => ({
      ...event,
      status: getEventStatus(event),
      travelWindow: generateEventTravelWindow(event),
    }));

    // STRATEGIC: Add trademark notice if response contains trademarked events
    const hasTrademarkedEvents = containsTrademarkedEvents(events);

    return NextResponse.json({
      success: true,
      events: enrichedEvents,
      count: enrichedEvents.length,
      metadata: {
        query: query || undefined,
        filters: {
          type: type || undefined,
          featured: featured === 'true' || undefined,
        },
        source: 'GladysTravelAI Event Database',
        timestamp: new Date().toISOString(),
        trademarkNotice: hasTrademarkedEvents ? TRADEMARK_NOTICE : undefined
      }
    });

  } catch (error) {
    console.error('❌ Events GET error:', error);
    
    return NextResponse.json({
      success: false,
      events: [],
      count: 0,
      error: 'Failed to fetch events'
    }, { status: 500 });
  }
}

// ==================== POST /api/events ====================
// STRATEGIC: Advanced event search with multiple criteria
// Returns events with full trademark metadata + travel intelligence

export async function POST(req: NextRequest): Promise<NextResponse<EventsAPIResponse>> {
  try {
    const body = await req.json();
    
    // Extract search criteria
    const {
      destination,    // City or country name
      startDate,      // ISO date string
      endDate,        // ISO date string
      type,           // 'sports' | 'music' | 'festival'
    } = body;

    // STRATEGIC: Start with appropriate base dataset
    let events: Event[] = [];

    if (type && type !== 'all') {
      const validTypes: Array<Event['type']> = ['sports', 'music', 'festival'];
      
      if (validTypes.includes(type)) {
        events = getEventsByType(type as Event['type']);
      } else {
        events = getAllEvents();
      }
    } else {
      events = getAllEvents();
    }

    // Filter by destination (city or country)
    if (destination && typeof destination === 'string') {
      events = filterEventsByLocation(events, destination);
    }

    // Filter by date range
    if (startDate && endDate) {
      try {
        events = filterEventsByDateRange(events, startDate, endDate);
      } catch (dateError) {
        console.warn('⚠️ Invalid date range provided:', { startDate, endDate });
        // Continue without date filtering
      }
    }

    // STRATEGIC: Enrich events with real-time intelligence
    const enrichedEvents = events.map(event => ({
      ...event,
      status: getEventStatus(event),
      travelWindow: generateEventTravelWindow(event),
    }));

    // STRATEGIC: Add trademark notice if response contains trademarked events
    const hasTrademarkedEvents = containsTrademarkedEvents(events);

    return NextResponse.json({
      success: true,
      events: enrichedEvents,
      count: enrichedEvents.length,
      metadata: {
        filters: {
          type: type || undefined,
          destination: destination || undefined,
          dateRange: (startDate && endDate) ? {
            start: startDate,
            end: endDate
          } : undefined,
        },
        source: 'GladysTravelAI Event Database',
        timestamp: new Date().toISOString(),
        trademarkNotice: hasTrademarkedEvents ? TRADEMARK_NOTICE : undefined
      }
    });

  } catch (error) {
    console.error('❌ Events POST error:', error);
    
    return NextResponse.json({
      success: false,
      events: [],
      count: 0,
      error: 'Failed to search events'
    }, { status: 500 });
  }
}