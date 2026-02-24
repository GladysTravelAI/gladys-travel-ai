// app/api/featured-events/route.ts
// Uses PredictHQ for homepage event discovery

import { NextResponse } from 'next/server';
import { searchPHQEvents } from '@/lib/services/predicthq';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [sports, music, festivals] = await Promise.all([
      searchPHQEvents({ keyword: 'sports', categories: 'sports', startDate: today, minRank: 50, limit: 4 }),
      searchPHQEvents({ keyword: 'concert',  categories: 'concerts', startDate: today, minRank: 50, limit: 4 }),
      searchPHQEvents({ keyword: 'festival', categories: 'festivals', startDate: today, minRank: 50, limit: 4 }),
    ]);

    console.log(`🌍 PHQ results — sports:${sports.length} music:${music.length} festivals:${festivals.length}`);

    const events = [
      ...sports.map(e => ({ ...e, category: 'sports' as const })),
      ...music.map(e => ({ ...e, category: 'music' as const })),
      ...festivals.map(e => ({ ...e, category: 'festival' as const })),
    ]
      .filter(e => e.city && e.date >= today)
      .filter((e, idx, arr) => arr.findIndex(x => x.id === e.id) === idx)
      .sort((a, b) => b.rank - a.rank)
      .slice(0, 9);

    return NextResponse.json({ success: true, events });

  } catch (error: any) {
    console.error('❌ Featured events error:', error);
    return NextResponse.json({ success: false, error: error.message, events: [] });
  }
}