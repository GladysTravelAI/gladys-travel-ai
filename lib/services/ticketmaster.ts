// lib/services/ticketmaster.ts
// Ticketmaster Discovery API v2

const TM_BASE = 'https://app.ticketmaster.com/discovery/v2';
const TM_KEY = process.env.TICKETMASTER_API_KEY!;

// ==================== TYPES ====================

export interface TMEvent {
  id: string;
  name: string;
  type: string;
  url: string;
  locale: string;
  dates: {
    start: {
      localDate: string;      // e.g. "2026-06-15"
      localTime?: string;     // e.g. "19:00:00"
      dateTime?: string;      // ISO
    };
    end?: {
      localDate?: string;
    };
    status: {
      code: 'onsale' | 'offsale' | 'cancelled' | 'postponed' | 'rescheduled';
    };
  };
  classifications: Array<{
    segment?: { name: string };  // "Sports", "Music", "Arts & Theatre"
    genre?: { name: string };    // "Basketball", "Rock", "Festival"
    subGenre?: { name: string };
  }>;
  _embedded?: {
    venues?: Array<{
      id: string;
      name: string;
      city: { name: string };
      country: { name: string; countryCode: string };
      state?: { name: string };
      address?: { line1: string };
      location?: { longitude: string; latitude: string };
    }>;
    attractions?: Array<{
      id: string;
      name: string;
      images?: Array<{ url: string; width: number; height: number }>;
    }>;
  };
  images?: Array<{
    url: string;
    width: number;
    height: number;
    ratio?: string;
  }>;
  priceRanges?: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
  pleaseNote?: string;
  info?: string;
}

export interface NormalizedEvent {
  id: string;
  name: string;
  category: 'sports' | 'music' | 'festival' | 'other';
  genre?: string;
  date: string;           // YYYY-MM-DD
  time?: string;          // HH:MM
  venue: string;
  city: string;
  country: string;
  countryCode: string;
  ticketUrl: string;
  image?: string;
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  status: string;
  attraction?: string;    // artist/team name
}

// ==================== CATEGORY MAPPING ====================

function mapCategory(event: TMEvent): NormalizedEvent['category'] {
  const segment = event.classifications?.[0]?.segment?.name?.toLowerCase() || '';
  const genre = event.classifications?.[0]?.genre?.name?.toLowerCase() || '';

  if (segment.includes('sports')) return 'sports';
  if (segment.includes('music')) {
    if (genre.includes('festival')) return 'festival';
    return 'music';
  }
  if (genre.includes('festival')) return 'festival';
  return 'other';
}

function getBestImage(images?: TMEvent['images']): string | undefined {
  if (!images?.length) return undefined;
  // Prefer 16:9 wide images
  const wide = images.find(i => i.ratio === '16_9' && i.width >= 1024);
  if (wide) return wide.url;
  // Fall back to largest
  return images.sort((a, b) => (b.width || 0) - (a.width || 0))[0]?.url;
}

function normalize(event: TMEvent): NormalizedEvent {
  const venue = event._embedded?.venues?.[0];
  const attraction = event._embedded?.attractions?.[0];
  const price = event.priceRanges?.[0];

  return {
    id: event.id,
    name: event.name,
    category: mapCategory(event),
    genre: event.classifications?.[0]?.genre?.name,
    date: event.dates.start.localDate,
    time: event.dates.start.localTime?.substring(0, 5),
    venue: venue?.name || '',
    city: venue?.city?.name || '',
    country: venue?.country?.name || '',
    countryCode: venue?.country?.countryCode || '',
    ticketUrl: event.url,
    image: getBestImage(event.images),
    priceMin: price?.min,
    priceMax: price?.max,
    currency: price?.currency,
    status: event.dates.status.code,
    attraction: attraction?.name,
  };
}

// ==================== API FUNCTIONS ====================

/**
 * Search for events by keyword. Returns normalized results.
 */
export async function searchTicketmasterEvents(params: {
  keyword: string;
  countryCode?: string;
  city?: string;
  startDate?: string;   // YYYY-MM-DD
  endDate?: string;
  size?: number;
  sort?: string;
}): Promise<NormalizedEvent[]> {
  if (!TM_KEY) {
    console.warn('⚠️ TICKETMASTER_API_KEY not set');
    return [];
  }

  const { keyword, countryCode, city, startDate, endDate, size = 5, sort = 'date,asc' } = params;

  const url = new URL(`${TM_BASE}/events.json`);
  url.searchParams.set('apikey', TM_KEY);
  url.searchParams.set('keyword', keyword);
  url.searchParams.set('size', String(size));
  url.searchParams.set('sort', sort);

  if (countryCode) url.searchParams.set('countryCode', countryCode);
  if (city)        url.searchParams.set('city', city);
  if (startDate)   url.searchParams.set('startDateTime', `${startDate}T00:00:00Z`);
  if (endDate)     url.searchParams.set('endDateTime', `${endDate}T23:59:59Z`);

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 300 } }); // 5-min cache
    if (!res.ok) {
      console.error('❌ Ticketmaster API error:', res.status, await res.text());
      return [];
    }

    const data = await res.json();
    const events: TMEvent[] = data._embedded?.events || [];
    return events.map(normalize);

  } catch (err) {
    console.error('❌ Ticketmaster fetch failed:', err);
    return [];
  }
}

/**
 * Get a single event by Ticketmaster event ID.
 */
export async function getTicketmasterEvent(eventId: string): Promise<NormalizedEvent | null> {
  if (!TM_KEY) return null;

  try {
    const res = await fetch(
      `${TM_BASE}/events/${eventId}.json?apikey=${TM_KEY}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;

    const event: TMEvent = await res.json();
    return normalize(event);
  } catch {
    return null;
  }
}

/**
 * Find the best single event match for a search query.
 * Picks the soonest future event with a valid venue.
 */
export async function findBestEventMatch(query: string): Promise<NormalizedEvent | null> {
  const results = await searchTicketmasterEvents({
    keyword: query,
    size: 10,
    sort: 'date,asc',
  });

  const today = new Date().toISOString().split('T')[0];

  // Filter to future events with venue data
  const valid = results.filter(e =>
    e.date >= today &&
    e.venue &&
    e.city &&
    e.status !== 'cancelled'
  );

  return valid[0] || null;
}