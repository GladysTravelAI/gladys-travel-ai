// app/api/featured-events/route.ts
// Returns real live events for homepage discovery section

import { NextResponse } from 'next/server';
import { searchTicketmasterEvents } from '@/lib/services/ticketmaster';

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Fetch broadly across segments — no specific keywords that might miss
    const [sports, music, festivals] = await Promise.all([
      searchTicketmasterEvents({
        keyword: 'NBA NFL soccer UFC',
        startDate: today,
        size: 4,
        sort: 'date,asc',
      }),
      searchTicketmasterEvents({
        keyword: 'concert tour live',
        startDate: today,
        size: 4,
        sort: 'date,asc',
      }),
      searchTicketmasterEvents({
        keyword: 'festival',
        startDate: today,
        size: 4,
        sort: 'date,asc',
      }),
    ]);

    const events = [
      ...sports.map(e => ({ ...e, category: 'sports' as const })),
      ...music.map(e => ({ ...e, category: e.category === 'festival' ? 'festival' as const : 'music' as const })),
      ...festivals.map(e => ({ ...e, category: 'festival' as const })),
    ]
      .filter(e =>
        e.city &&          // must have a city
        e.date >= today && // future only
        e.status !== 'cancelled'
      )
      // deduplicate by id
      .filter((e, idx, arr) => arr.findIndex(x => x.id === e.id) === idx)
      .slice(0, 9);

    console.log(`✅ Featured events: ${events.length} returned`);
    return NextResponse.json({ success: true, events });

  } catch (error: any) {
    console.error('❌ Featured events error:', error);
    return NextResponse.json({ success: false, events: [] });
  }
}