// lib/tools/eventIntelTool.ts
// 🎫 EVENT INTELLIGENCE TOOL
// Searches: UniversalEvent registry + Ticketmaster + PredictHQ

import { searchEvents as registrySearch } from '@/lib/data/eventRegistry';
import { searchTicketmasterEvents } from '@/lib/services/ticketmaster';
import { searchPHQEvents } from '@/lib/services/predicthq';

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

    // LAYER 1: Internal registry (World Cup, F1, etc.) — highest priority
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
      source: 'registry',
    }));

    // LAYER 2 + 3: Ticketmaster + PredictHQ in parallel — only if no registry results
    let externalEvents: any[] = [];

    if (registryEvents.length === 0) {
      const [tmResult, phqResult] = await Promise.allSettled([
        searchTicketmasterEvents({ keyword: query, city, size: 10 }),
        searchPHQEvents({ keyword: query, city, limit: 10 }),
      ]);

      if (tmResult.status === 'fulfilled') {
        externalEvents.push(...tmResult.value.map(e => ({
          id:          `tm-${e.id}`,
          name:        e.name,
          type:        e.category,
          date:        e.date,
          time:        e.time,
          venue:       e.venue,
          city:        e.city,
          country:     e.country,
          countryCode: e.countryCode,
          ticketUrl:   e.ticketUrl,   // ← real Ticketmaster URL
          image:       e.image,
          priceMin:    e.priceMin,
          priceMax:    e.priceMax,
          currency:    e.currency,
          attraction:  e.attraction,
          status:      e.status,
          rank:        null,
          multi_city:  false,
          source:      'ticketmaster',
        })));
      } else {
        console.warn('⚠️ Ticketmaster search failed:', tmResult.reason);
      }

      if (phqResult.status === 'fulfilled') {
        externalEvents.push(...phqResult.value.map(e => ({
          id:          e.id,
          name:        e.name,
          type:        e.category,
          date:        e.date,
          time:        undefined,
          venue:       e.venue       || null,
          city:        e.city        || null,
          country:     e.country     || null,
          countryCode: e.countryCode || null,
          ticketUrl:   null,          // PredictHQ doesn't provide ticket URLs
          image:       null,
          priceMin:    null,
          priceMax:    null,
          currency:    null,
          attraction:  null,
          status:      'onsale',
          rank:        e.rank,        // phq_rank 0–100 → drives "Hot" badge
          multi_city:  false,
          source:      'predicthq',
        })));
      } else {
        console.warn('⚠️ PredictHQ search failed:', phqResult.reason);
      }

      // Deduplicate by name — keep Ticketmaster entry if same event appears in both
      const seen = new Set<string>();
      externalEvents = externalEvents.filter(e => {
        const key = e.name.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    const allEvents = [...registryEvents, ...externalEvents];

    return allEvents
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10);

  } catch (error) {
    console.error('❌ Event search failed:', error);
    return [];
  }
}