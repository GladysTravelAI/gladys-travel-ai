// app/api/featured-events/route.ts
// PredictHQ for discovery, Ticketmaster for images, category fallbacks for the rest

import { NextResponse } from 'next/server';
import { searchPHQEvents } from '@/lib/services/predicthq';
import { searchTicketmasterEvents } from '@/lib/services/ticketmaster';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// High-quality Unsplash fallback images per category
// These are direct image URLs — no API key needed
const FALLBACK_IMAGES = {
  sports: [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80', // stadium crowd
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80', // football
    'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=800&q=80', // sports arena
  ],
  music: [
    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80', // concert crowd
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80', // live music
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80', // concert stage
  ],
  festival: [
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80', // festival crowd
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80', // festival lights
    'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80', // outdoor festival
  ],
  other: [
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80', // event crowd
  ],
};

function getFallbackImage(category: string, index: number): string {
  const images = FALLBACK_IMAGES[category as keyof typeof FALLBACK_IMAGES] || FALLBACK_IMAGES.other;
  return images[index % images.length];
}

export async function GET() {
  try {
    const today = new Date();
    const in30Days = new Date(today);
    in30Days.setDate(today.getDate() + 30);

    const startDate = today.toISOString().split('T')[0];
    const endDate   = in30Days.toISOString().split('T')[0];

    // ── Step 1: PredictHQ — ranked real events next 30 days ─────────────────
    const [sports, music, festivals] = await Promise.all([
      searchPHQEvents({ categories: 'sports',    startDate, endDate, minRank: 60, limit: 3 }),
      searchPHQEvents({ categories: 'concerts',  startDate, endDate, minRank: 60, limit: 3 }),
      searchPHQEvents({ categories: 'festivals', startDate, endDate, minRank: 60, limit: 3 }),
    ]);

    console.log(`🌍 PHQ — sports:${sports.length} music:${music.length} festivals:${festivals.length}`);

    const phqEvents = [
      ...sports.map(e =>    ({ ...e, category: 'sports'   as const })),
      ...music.map(e =>     ({ ...e, category: 'music'    as const })),
      ...festivals.map(e => ({ ...e, category: 'festival' as const })),
    ]
      .filter(e => e.date >= startDate && e.date <= endDate)
      .filter((e, i, arr) => arr.findIndex(x => x.id === e.id) === i)
      .sort((a, b) => b.rank - a.rank)
      .slice(0, 9);

    // ── Step 2: Staggered Ticketmaster enrichment ────────────────────────────
    // 250ms between calls = ~4 req/sec, safely under TM's 5/sec limit
    const enriched = [];
    for (let i = 0; i < phqEvents.length; i++) {
      const ev = phqEvents[i];
      try {
        const tmResults = await searchTicketmasterEvents({
          keyword:   ev.name,
          startDate: ev.date,
          endDate:   ev.endDate || ev.date,
          size:      1,
        });
        const tm = tmResults[0];
        enriched.push({
          ...ev,
          // Use Ticketmaster image if found, otherwise category fallback
          image:      tm?.image     || getFallbackImage(ev.category, i),
          ticketUrl:  tm?.ticketUrl || null,
          priceMin:   tm?.priceMin  || null,
          currency:   tm?.currency  || null,
          attraction: tm?.attraction || null,
        });
      } catch {
        // TM call failed — still show event with fallback image
        enriched.push({
          ...ev,
          image:      getFallbackImage(ev.category, i),
          ticketUrl:  null,
          priceMin:   null,
          currency:   null,
          attraction: null,
        });
      }
      await delay(250);
    }

    return NextResponse.json({ success: true, events: enriched });

  } catch (error: any) {
    console.error('❌ Featured events error:', error.message);
    return NextResponse.json({ success: false, error: error.message, events: [] });
  }
}