// app/api/featured-events/route.ts
// Returns real live events for homepage discovery section

import { NextResponse } from 'next/server';
import { searchTicketmasterEvents } from '@/lib/services/ticketmaster';

export async function GET() {
  try {
    // Fetch across categories in parallel
    const [sports, music, festivals] = await Promise.all([
      searchTicketmasterEvents({ keyword: 'championship final', size: 3, sort: 'relevance,desc' }),
      searchTicketmasterEvents({ keyword: 'concert tour 2026',  size: 3, sort: 'relevance,desc' }),
      searchTicketmasterEvents({ keyword: 'festival 2026',      size: 3, sort: 'relevance,desc' }),
    ]);

    const events = [
      ...sports.map(e => ({ ...e, category: 'sports' as const })),
      ...music.map(e => ({ ...e, category: 'music' as const })),
      ...festivals.map(e => ({ ...e, category: 'festival' as const })),
    ]
      .filter(e => e.image && e.city) // only show events with images
      .slice(0, 9);

    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    console.error('Featured events error:', error);
    return NextResponse.json({ success: false, events: [] });
  }
}