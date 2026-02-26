// lib/services/predicthq.ts
// 🌍 PredictHQ Event Intelligence API

const PHQ_BASE = 'https://api.predicthq.com/v1';
const PHQ_KEY = process.env.PREDICTHQ_API_KEY!;

// ==================== TYPES ====================

export interface PHQEvent {
  id: string;
  title: string;
  category: string;
  labels: string[];
  start: string;
  end: string;
  timezone: string;
  country: string;
  location: [number, number];
  geo?: {
    address?: {
      city?: string;
      county?: string;
      state?: string;
      country_code?: string;
    };
    formatted_address?: string;
  };
  rank: number;
  local_rank?: number;
  phq_attendance?: number;
  entities?: Array<{
    entity_id: string;
    name: string;
    type: string;
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
  date: string;
  endDate?: string;
  city: string;
  country: string;
  countryCode: string;
  venue?: string;
  rank: number;
  attendance?: number;
  description?: string;
  source: 'predicthq';
}

// ==================== CATEGORY MAPPING ====================

function mapPHQCategory(category: string, labels: string[]): NormalizedPHQEvent['category'] {
  if (category === 'sports')    return 'sports';
  if (category === 'concerts')  return 'music';
  if (category === 'festivals') return 'festival';
  if (labels.includes('music'))    return 'music';
  if (labels.includes('festival')) return 'festival';
  if (labels.includes('sport'))    return 'sports';
  return 'other';
}

function normalize(e: PHQEvent): NormalizedPHQEvent {
  const venue = e.entities?.find(en => en.type === 'venue');
  const city = e.geo?.address?.city || e.geo?.formatted_address?.split(',')[0] || '';
  const countryCode = e.geo?.address?.country_code || e.country || '';

  return {
    id:          `phq-${e.id}`,
    name:        e.title,
    category:    mapPHQCategory(e.category, e.labels),
    labels:      e.labels,
    date:        e.start.split('T')[0],
    endDate:     e.end ? e.end.split('T')[0] : undefined,
    city,
    country:     countryCode,
    countryCode,
    venue:       venue?.name,
    rank:        e.rank,
    attendance:  e.phq_attendance,
    description: e.description,
    source:      'predicthq',
  };
}

// ==================== SEARCH ====================

export async function searchPHQEvents(params: {
  keyword?: string;         // optional — omit for broad category discovery
  countryCode?: string;
  city?: string;
  startDate?: string;
  endDate?: string;
  categories?: string;
  minRank?: number;
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

  // CRITICAL: only set q when keyword is a real non-empty string.
  // q= (empty string) returns ZERO results from PredictHQ.
  // Omitting q entirely = broad discovery filtered by category + date.
  if (keyword && keyword.trim().length > 0) {
    url.searchParams.set('q', keyword.trim());
  }

  url.searchParams.set('limit',    String(limit));
  url.searchParams.set('sort',     '-rank');
  url.searchParams.set('category', categories);
  url.searchParams.set('rank.gte', String(minRank));
  url.searchParams.set('state',    'active');

  if (countryCode) url.searchParams.set('country',    countryCode.toUpperCase());
  if (city)        url.searchParams.set('place.name', city);
  if (startDate)   url.searchParams.set('start.gte',  startDate);
  if (endDate)     url.searchParams.set('start.lte',  endDate);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${PHQ_KEY}`,
        'Accept':        'application/json',
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error('❌ PredictHQ API error:', res.status, await res.text());
      return [];
    }

    const data = await res.json();
    const events: PHQEvent[] = data.results || [];
    const today = new Date().toISOString().split('T')[0];

    return events
      .filter(e => e.state !== 'cancelled' && e.state !== 'deleted' && e.state !== 'postponed')
      .map(normalize)
      .filter(e => e.date >= today)
      .sort((a, b) => b.rank - a.rank);

  } catch (err) {
    console.error('❌ PredictHQ fetch failed:', err);
    return [];
  }
}

export async function findBestPHQMatch(query: string): Promise<NormalizedPHQEvent | null> {
  const results = await searchPHQEvents({ keyword: query, minRank: 40, limit: 5 });
  return results[0] || null;
}

export async function getDemandImpact(params: {
  city: string;
  countryCode: string;
  startDate: string;
  endDate: string;
}): Promise<{ rank: number; topEvents: NormalizedPHQEvent[] }> {
  const events = await searchPHQEvents({
    keyword:     params.city,
    countryCode: params.countryCode,
    startDate:   params.startDate,
    endDate:     params.endDate,
    minRank:     50,
    limit:       5,
  });

  const avgRank = events.length > 0
    ? Math.round(events.reduce((sum, e) => sum + e.rank, 0) / events.length)
    : 0;

  return { rank: avgRank, topEvents: events };
}