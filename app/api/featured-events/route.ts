// app/api/featured-events/route.ts
// Uses PredictHQ for homepage event discovery, falls back to internal events

import { NextResponse } from 'next/server';
import { searchPHQEvents } from '@/lib/services/predicthq';
import { getAllEvents } from '@/lib/eventService';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // ── LAYER 1: PredictHQ live events ─────────────────────────────────────
    // Must use real keyword terms — PredictHQ requires a non-empty 'q' param.
    // Empty string sends q= which returns nothing. Category handles type filtering.
    const [sports, music, festivals] = await Promise.all([
      searchPHQEvents({ keyword: 'championship',  categories: 'sports',    startDate: today, minRank: 50, limit: 4 }),
      searchPHQEvents({ keyword: 'concert tour',  categories: 'concerts',  startDate: today, minRank: 50, limit: 4 }),
      searchPHQEvents({ keyword: 'festival',      categories: 'festivals', startDate: today, minRank: 50, limit: 4 }),
    ]);

    console.log(`🌍 PHQ results — sports:${sports.length} music:${music.length} festivals:${festivals.length}`);

    const phqEvents = [
      ...sports.map(e =>    ({ ...e, category: 'sports'  as const })),
      ...music.map(e =>     ({ ...e, category: 'music'   as const })),
      ...festivals.map(e => ({ ...e, category: 'festival' as const })),
    ]
      .filter(e => e.date >= today)
      .filter((e, idx, arr) => arr.findIndex(x => x.id === e.id) === idx) // dedupe
      .sort((a, b) => b.rank - a.rank)
      .slice(0, 9);

    // ── LAYER 2: Internal events fallback ──────────────────────────────────
    // If PredictHQ returns nothing (key not set, quota exceeded, etc.)
    // always show something rather than an empty page.
    if (phqEvents.length === 0) {
      console.log('⚠️ PHQ returned empty — falling back to internal events');

      const internalEvents = getAllEvents()
        .filter(e => e.startDate >= today)
        .slice(0, 9)
        .map(e => ({
          id:         e.id,
          name:       e.name,
          category:   e.type as 'sports' | 'music' | 'festival',
          date:       e.startDate,
          city:       e.location.city,
          country:    e.location.country,
          venue:      e.location.venue,
          rank:       80, // static rank for display
          labels:     [],
          source:     'internal' as const,
        }));

      return NextResponse.json({ success: true, events: internalEvents });
    }

    return NextResponse.json({ success: true, events: phqEvents });

  } catch (error: any) {
    console.error('❌ Featured events error:', error);

    // Even on hard crash — return internal events so homepage never breaks
    try {
      const today = new Date().toISOString().split('T')[0];
      const fallback = getAllEvents()
        .filter(e => e.startDate >= today)
        .slice(0, 9)
        .map(e => ({
          id:       e.id,
          name:     e.name,
          category: e.type as 'sports' | 'music' | 'festival',
          date:     e.startDate,
          city:     e.location.city,
          country:  e.location.country,
          venue:    e.location.venue,
          rank:     80,
          labels:   [],
          source:   'internal' as const,
        }));
      return NextResponse.json({ success: true, events: fallback });
    } catch {
      return NextResponse.json({ success: false, error: error.message, events: [] });
    }
  }
}