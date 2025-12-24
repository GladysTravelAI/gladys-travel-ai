import { NextRequest, NextResponse } from "next/server";
import { FEATURED_EVENTS, getFeaturedEvents, getEventsByType, searchEvents } from "@/lib/event-data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const featured = searchParams.get('featured');
    const query = searchParams.get('q');

    let events = FEATURED_EVENTS;

    // Filter by type
    if (type && type !== 'all') {
      events = getEventsByType(type as any);
    }

    // Filter featured only
    if (featured === 'true') {
      events = getFeaturedEvents();
    }

    // Search
    if (query) {
      events = searchEvents(query);
    }

    return NextResponse.json({ 
      success: true,
      events,
      count: events.length
    });
  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json({ 
      success: false,
      events: [],
      error: 'Failed to fetch events'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { destination, startDate, endDate, sport } = await req.json();

    // Filter events based on criteria
    let events = FEATURED_EVENTS;

    if (destination) {
      events = events.filter(event =>
        event.venue.city.toLowerCase().includes(destination.toLowerCase()) ||
        event.venue.country.toLowerCase().includes(destination.toLowerCase())
      );
    }

    if (sport) {
      events = events.filter(event => event.sport === sport);
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      events = events.filter(event => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        return (eventStart >= start && eventStart <= end) ||
               (eventEnd >= start && eventEnd <= end);
      });
    }

    return NextResponse.json({
      success: true,
      events,
      count: events.length
    });
  } catch (error) {
    console.error('Events POST error:', error);
    return NextResponse.json({
      success: false,
      events: [],
      error: 'Failed to search events'
    }, { status: 500 });
  }
}