// lib/tools/eventIntelTool.ts
// 🎫 EVENT INTELLIGENCE TOOL
// Registry → always enriched with Ticketmaster + PredictHQ

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

    // ── LAYER 1: Internal registry ──────────────────────────────────────────
    const registryEvents = registrySearch(query).map(e => ({
      id:         e.event_id,
      name:       e.name,
      type:       e.category,
      date:       e.start_date,
      end_date:   e.end_date,
      venue:      e.multi_city ? 'Multiple Venues' : (e.venues[0]?.name || e.cities[0]?.name),
      city:       e.multi_city ? 'Multiple Cities' : e.cities[0]?.name,
      country:    e.multi_city ? 'Multiple Countries' : e.cities[0]?.country,
      multi_city: e.multi_city,
      // These will be enriched below
      ticketUrl:  null as string | null,
      image:      null as string | null,
      priceMin:   null as number | null,
      priceMax:   null as number | null,
      currency:   null as string | null,
      attraction: null as string | null,
      source:     'registry',
    }));

    // ── ALWAYS run Ticketmaster + PredictHQ ─────────────────────────────────
    // Registry events are enriched with real ticket URLs + images from TM.
    // External APIs also provide additional events registry doesn't know about.
    const [tmResult, phqResult] = await Promise.allSettled([
      searchTicketmasterEvents({ keyword: query, city, size: 10 }),
      searchPHQEvents({ keyword: query, city, limit: 10 }),
    ]);

    const tmEvents = tmResult.status === 'fulfilled' ? tmResult.value : [];
    const phqEvents = phqResult.status === 'fulfilled' ? phqResult.value : [];

    if (tmResult.status === 'rejected')  console.warn('⚠️ Ticketmaster failed:', tmResult.reason);
    if (phqResult.status === 'rejected') console.warn('⚠️ PredictHQ failed:', phqResult.reason);

    // ── ENRICH registry events with Ticketmaster data ────────────────────────
    // For each registry event, find the best TM match by name similarity
    const enrichedRegistry = registryEvents.map(regEvent => {
      const tmMatch = tmEvents.find(tm =>
        tm.name.toLowerCase().includes(regEvent.name.toLowerCase().substring(0, 15)) ||
        regEvent.name.toLowerCase().includes(tm.name.toLowerCase().substring(0, 15))
      );
      if (tmMatch) {
        return {
          ...regEvent,
          ticketUrl:  tmMatch.ticketUrl  || null,
          image:      tmMatch.image      || null,
          priceMin:   tmMatch.priceMin   || null,
          priceMax:   tmMatch.priceMax   || null,
          currency:   tmMatch.currency   || null,
          attraction: tmMatch.attraction || null,
          // Use TM venue/city if more specific than registry
          venue:      tmMatch.venue      || regEvent.venue,
          city:       (!regEvent.multi_city && tmMatch.city) ? tmMatch.city : regEvent.city,
        };
      }
      return regEvent;
    });

    // ── External events not already in registry ──────────────────────────────
    const registryNames = new Set(registryEvents.map(e => e.name.toLowerCase()));

    const externalTM = tmEvents
      .filter(e => !registryNames.has(e.name.toLowerCase()))
      .map(e => ({
        id:         `tm-${e.id}`,
        name:       e.name,
        type:       e.category,
        date:       e.date,
        end_date:   e.date,
        venue:      e.venue,
        city:       e.city,
        country:    e.country,
        multi_city: false,
        ticketUrl:  e.ticketUrl,
        image:      e.image,
        priceMin:   e.priceMin,
        priceMax:   e.priceMax,
        currency:   e.currency,
        attraction: e.attraction,
        rank:       null,
        source:     'ticketmaster',
      }));

    const externalPHQ = phqEvents
      .filter(e => !registryNames.has(e.name.toLowerCase()))
      .map(e => ({
        id:         e.id,
        name:       e.name,
        type:       e.category,
        date:       e.date,
        end_date:   e.endDate || e.date,
        venue:      e.venue   || null,
        city:       e.city    || null,
        country:    e.country || null,
        multi_city: false,
        ticketUrl:  null,
        image:      null,
        priceMin:   null,
        priceMax:   null,
        currency:   null,
        attraction: null,
        rank:       e.rank,
        source:     'predicthq',
      }));

    // ── MERGE: registry first (enriched), then TM, then PHQ ─────────────────
    const allEvents = [...enrichedRegistry, ...externalTM, ...externalPHQ];

    // Deduplicate by name
    const seen = new Set<string>();
    const deduped = allEvents.filter(e => {
      const key = e.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return deduped
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10);

  } catch (error) {
    console.error('❌ Event search failed:', error);
    return [];
  }
}