// lib/services/predicthq.ts
// 🌍 PredictHQ Event Intelligence API
// Fills gaps Ticketmaster doesn't cover:
// - Football/soccer matches globally
// - Festivals in Africa, Asia, Middle East
// - Free events, marathons, parades
// - Demand impact scores for hotel/flight pricing

const PHQ_BASE = 'https://api.predicthq.com/v1';
const PHQ_KEY = process.env.PREDICTHQ_API_KEY!;

// ==================== TYPES ====================

export interface PHQEvent {
  id: string;
  title: string;
  category: string;        // "sports", "concerts", "festivals", "community", etc.
  labels: string[];        // ["music", "festival", "outdoor"], etc.
  start: string;           // ISO datetime
  end: string;
  timezone: string;
  country: string;         // "US", "ZA", "GB", etc.
  location: [number, number]; // [longitude, latitude]
  geo?: {
    address?: {
      city?: string;
      county?: string;
      state?: string;
      country_code?: string;
    };
    formatted_address?: string;
  };
  rank: number;            // 0-100, higher = more impactful
  local_rank?: number;
  phq_attendance?: number; // Predicted attendance
  entities?: Array<{
    entity_id: string;
    name: string;
    type: string;          // "venue", "organisation"
    formatted_address?: string;
  }>;
  description?: string;
  private: boolean;
  state: 'active' | 'deleted' | 'cancelled' | 'postponed';
}

export interface NormalizedPHQEvent {
  id: string;
  name: string;
  category: 'sports' | 'music' | 'festival' | 'other';
  labels: string[];
  date: string;            // YYYY-MM-DD
  endDate?: string;
  city: string;
  country: string;
  countryCode: string;
  venue?: string;
  rank: number;            // demand impact 0-100
  attendance?: number;
  description?: string;
  source: 'predicthq';
}

// ==================== CATEGORY MAPPING ====================

function mapPHQCategory(category: string, labels: string[]): NormalizedPHQEvent['category'] {
  if (category === 'sports') return 'sports';
  if (category === 'concerts') return 'music';
  if (category === 'festivals') return 'festival';
  if (labels.includes('music')) return 'music';
  if (labels.includes('festival')) return 'festival';
  if (labels.includes('sport')) return 'sports';
  return 'other';
}

function normalize(e: PHQEvent): NormalizedPHQEvent {
  const venue = e.entities?.find(en => en.type === 'venue');
  const city = e.geo?.address?.city || e.geo?.formatted_address?.split(',')[0] || '';
  const countryCode = e.geo?.address?.country_code || e.country || '';

  return {
    id: `phq-${e.id}`,
    name: e.title,
    category: mapPHQCategory(e.category, e.labels),
    labels: e.labels,
    date: e.start.split('T')[0],
    endDate: e.end ? e.end.split('T')[0] : undefined,
    city,
    country: countryCode,
    countryCode,
    venue: venue?.name,
    rank: e.rank,
    attendance: e.phq_attendance,
    description: e.description,
    source: 'predicthq',
  };
}

// ==================== API FUNCTIONS ====================

/**
 * Search PredictHQ events by keyword and optional location
 */
export async function searchPHQEvents(params: {
  keyword: string;
  countryCode?: string;
  city?: string;
  startDate?: string;   // YYYY-MM-DD
  endDate?: string;
  categories?: string;  // comma-separated: "sports,concerts,festivals"
  minRank?: number;     // filter low-impact events
  limit?: number;
}): Promise<NormalizedPHQEvent[]> {
  if (!PHQ_KEY) {
    console.warn('⚠️ PREDICTHQ_API_KEY not set');
    return [];
  }

  const {
    keyword,
    countryCode,
    city,
    startDate,
    endDate,
    categories = 'sports,concerts,festivals,community',
    minRank = 30,
    limit = 10,
  } = params;

  const url = new URL(`${PHQ_BASE}/events/`);
  url.searchParams.set('q', keyword);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('sort', 'rank');
  url.searchParams.set('category', categories);
  url.searchParams.set('rank.gte', String(minRank));
  url.searchParams.set('state', 'active');

  if (countryCode) url.searchParams.set('country', countryCode.toUpperCase());
  if (city)        url.searchParams.set('place.name', city);
  if (startDate)   url.searchParams.set('start.gte', startDate);
  if (endDate)     url.searchParams.set('start.lte', endDate);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${PHQ_KEY}`,
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }, // 5-min cache
    });

    if (!res.ok) {
      console.error('❌ PredictHQ API error:', res.status, await res.text());
      return [];
    }

    const data = await res.json();
    const events: PHQEvent[] = data.results || [];

    const today = new Date().toISOString().split('T')[0];
    return events
      .map(normalize)
      .filter(e => e.date >= today && e.state !== 'cancelled')
      .sort((a, b) => b.rank - a.rank); // highest impact first

  } catch (err) {
    console.error('❌ PredictHQ fetch failed:', err);
    return [];
  }
}

/**
 * Find best single event match for a query
 */
export async function findBestPHQMatch(query: string): Promise<NormalizedPHQEvent | null> {
  const results = await searchPHQEvents({
    keyword: query,
    minRank: 40,
    limit: 5,
  });
  return results[0] || null;
}

/**
 * Get demand impact score for a city on specific dates
 * Useful for showing users "prices will be higher due to X event"
 */
export async function getDemandImpact(params: {
  city: string;
  countryCode: string;
  startDate: string;
  endDate: string;
}): Promise<{ rank: number; topEvents: NormalizedPHQEvent[] }> {
  const events = await searchPHQEvents({
    keyword: params.city,
    countryCode: params.countryCode,
    startDate: params.startDate,
    endDate: params.endDate,
    minRank: 50,
    limit: 5,
  });

  const avgRank = events.length > 0
    ? Math.round(events.reduce((sum, e) => sum + e.rank, 0) / events.length)
    : 0;

  return { rank: avgRank, topEvents: events };
}