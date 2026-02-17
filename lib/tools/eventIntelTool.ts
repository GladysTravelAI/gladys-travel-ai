// lib/tools/eventIntelTool.ts
// 🎫 EVENT INTELLIGENCE TOOL
// Searches internal events + Ticketmaster

import { getAllEvents } from '@/lib/eventService';
import { searchTicketmasterEvents } from '@/lib/ticketmasterService';

export const eventIntelToolDefinition = {
  type: 'function' as const,
  function: {
    name: 'search_events',
    description: 'Search for live events (sports, concerts, festivals) by team, artist, or location',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (team name, artist, event type, or city)'
        },
        city: {
          type: 'string',
          description: 'Optional: Filter by city'
        },
        event_type: {
          type: 'string',
          enum: ['sports', 'music', 'festival', 'all'],
          description: 'Optional: Event type filter'
        }
      },
      required: ['query']
    }
  }
};

export async function executeEventSearch(args: {
  query: string;
  city?: string;
  event_type?: string;
}) {
  try {
    const { query, city } = args;
    
    // LAYER 1: Internal structured events
    let internalEvents = getAllEvents().filter(e =>
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.location.city.toLowerCase().includes(query.toLowerCase())
    );
    
    if (city) {
      internalEvents = internalEvents.filter(e =>
        e.location.city.toLowerCase().includes(city.toLowerCase())
      );
    }
    
    // LAYER 2: Ticketmaster fallback
    let externalEvents: any[] = [];
    if (internalEvents.length === 0) {
      try {
        externalEvents = await searchTicketmasterEvents(query, city);
      } catch (error) {
        console.warn('Ticketmaster search failed:', error);
      }
    }
    
    // Merge and format
    const allEvents = [
      ...internalEvents.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
        date: e.startDate,
        venue: e.location.venue || e.location.city,
        city: e.location.city,
        country: e.location.country,
        price_range: e.priceRange,
        image: e.heroImage,
        source: 'internal'
      })),
      ...externalEvents.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
        date: e.startDate,
        venue: e.location.venue || e.location.city,
        city: e.location.city,
        country: e.location.country,
        price_range: e.priceRange,
        image: e.heroImage,
        source: 'ticketmaster'
      }))
    ];
    
    // Sort by date, limit to 10
    return allEvents
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10);
    
  } catch (error) {
    console.error('Event search failed:', error);
    return [];
  }
}