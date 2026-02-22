// lib/tools/eventIntelTool.ts
// 🎫 EVENT INTELLIGENCE TOOL
// Searches: new registry (UniversalEvent) + old eventService + Ticketmaster

import { getAllEvents } from '@/lib/eventService';
import { searchEvents as registrySearch } from '@/lib/data/eventRegistry';
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

    // LAYER 1: New UniversalEvent registry (World Cup, etc.)
    const registryEvents = registrySearch(query).map(e => ({
      id: e.event_id,
      name: e.name,
      type: e.category,
      date: e.start_date,
      end_date: e.end_date,
      venue: e.multi_city ? 'Multiple Venues' : (e.venues[0]?.name || e.cities[0]?.name),
      city: e.multi_city ? 'Multiple Cities' : e.cities[0]?.name,
      country: e.multi_city ? 'Multiple Countries' : e.cities[0]?.country,
      multi_city: e.multi_city,
      source: 'registry'
    }));

    // LAYER 2: Old internal event service
    let legacyEvents = getAllEvents().filter(e =>
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.location.city.toLowerCase().includes(query.toLowerCase())
    );

    if (city) {
      legacyEvents = legacyEvents.filter(e =>
        e.location.city.toLowerCase().includes(city.toLowerCase())
      );
    }

    const formattedLegacy = legacyEvents.map(e => ({
      id: e.id,
      name: e.name,
      type: e.type,
      date: e.startDate,
      venue: e.location.venue || e.location.city,
      city: e.location.city,
      country: e.location.country,
      price_range: e.priceRange,
      image: e.heroImage,
      multi_city: false,
      source: 'internal'
    }));

    // Deduplicate — registry takes priority over legacy for same event
    const registryIds = new Set(registryEvents.map(e => e.id));
    const dedupedLegacy = formattedLegacy.filter(e => !registryIds.has(e.id));

    const combinedInternal = [...registryEvents, ...dedupedLegacy];

    // LAYER 3: Ticketmaster fallback if no internal results
    let externalEvents: any[] = [];
    if (combinedInternal.length === 0) {
      try {
        const tmResults = await searchTicketmasterEvents(query, city);
        externalEvents = tmResults.map(e => ({
          id: e.id,
          name: e.name,
          type: e.type,
          date: e.startDate,
          venue: e.location.venue || e.location.city,
          city: e.location.city,
          country: e.location.country,
          price_range: e.priceRange,
          image: e.heroImage,
          multi_city: false,
          source: 'ticketmaster'
        }));
      } catch (error) {
        console.warn('Ticketmaster search failed:', error);
      }
    }

    const allEvents = [...combinedInternal, ...externalEvents];

    return allEvents
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10);

  } catch (error) {
    console.error('Event search failed:', error);
    return [];
  }
}