// app/api/featured-events/route.ts
// Fetches UPCOMING events (next 30 days) from PredictHQ + enriches with Ticketmaster images

import { NextResponse } from 'next/server';
import { searchPHQEvents } from '@/lib/services/predicthq';
import { searchTicketmasterEvents } from '@/lib/services/ticketmaster';

export async function GET() {
  try {
    const today = new Date();
    const in30Days = new Date(today);
    in30Days.setDate(today.getDate() + 30);

    const startDate = today.toISOString().split('T')[0];
    const endDate   = in30Days.toISOString().split('T')[0];

    // ── 1. Fetch ranked upcoming events from PredictHQ ──────────────────────
    // Do NOT send q param at all for broad discovery — category + date does the filtering.
    // minRank:60 ensures only crowd-drawing events worth travelling to.
    const [sports, music, festivals] = await Promise.all([
      searchPHQEvents({ keyword: undefined, categories: 'sports',    startDate, endDate, minRank: 60, limit: 6 }),
      searchPHQEvents({ keyword: undefined, categories: 'concerts',  startDate, endDate, minRank: 60, limit: 6 }),
      searchPHQEvents({ keyword: undefined, categories: 'festivals', startDate, endDate, minRank: 60, limit: 6 }),
    ]);

    console.log(`🌍 PHQ — sports:${sports.length} music:${music.length} festivals:${festivals.length}`);

    const phqEvents = [
      ...sports.map(e =>    ({ ...e, category: 'sports'   as const })),
      ...music.map(e =>     ({ ...e, category: 'music'    as const })),
      ...festivals.map(e => ({ ...e, category: 'festival' as const })),
    ]
      .filter(e => e.date >= startDate && e.date <= endDate)
      .filter((e, i, arr) => arr.findIndex(x => x.id === e.id) === i) // dedupe
      .sort((a, b) => b.rank - a.rank)
      .slice(0, 9);

    // ── 2. Enrich with Ticketmaster images + ticket URLs ────────────────────
    // PredictHQ has no images. For each PHQ event, try to find a matching
    // Ticketmaster event to pull image + real ticket URL.
    const enriched = await Promise.all(
      phqEvents.map(async (ev) => {
        try {
          const tmResults = await searchTicketmasterEvents({
            keyword: ev.name,
            city: ev.city || undefined,
            startDate: ev.date,
            endDate: ev.date,
            size: 1,
          });
          const tm = tmResults[0];
          return {
            ...ev,
            image:     tm?.image     || null,
            ticketUrl: tm?.ticketUrl || null,
            priceMin:  tm?.priceMin  || null,
            currency:  tm?.currency  || null,
            attraction: tm?.attraction || null,
          };
        } catch {
          return { ...ev, image: null, ticketUrl: null, priceMin: null, currency: null, attraction: null };
        }
      })
    );

    // ── 3. Fallback: if PHQ returned nothing, use Ticketmaster directly ─────
    if (enriched.length === 0) {
      console.log('⚠️ PHQ empty — using Ticketmaster directly');

      const [tmSports, tmMusic, tmFestivals] = await Promise.all([
        searchTicketmasterEvents({ keyword: 'sports game',    startDate, endDate, size: 3 }),
        searchTicketmasterEvents({ keyword: 'concert',        startDate, endDate, size: 3 }),
        searchTicketmasterEvents({ keyword: 'festival',       startDate, endDate, size: 3 }),
      ]);

      const tmEvents = [
        ...tmSports.map(e =>    ({ ...e, category: 'sports'   as const, rank: 70, labels: [], source: 'ticketmaster' as const })),
        ...tmMusic.map(e =>     ({ ...e, category: 'music'    as const, rank: 70, labels: [], source: 'ticketmaster' as const })),
        ...tmFestivals.map(e => ({ ...e, category: 'festival' as const, rank: 70, labels: [], source: 'ticketmaster' as const })),
      ]
        .filter(e => e.date >= startDate)
        .slice(0, 9);

      return NextResponse.json({ success: true, events: tmEvents });
    }

    return NextResponse.json({ success: true, events: enriched });

  } catch (error: any) {
    console.error('❌ Featured events error:', error);
    return NextResponse.json({ success: false, error: error.message, events: [] });
  }
}