// lib/eventImageSearch.ts
// 🎯 Event Image Search — Ticketmaster-first, Unsplash/Pexels fallback
//
// Priority chain:
//   1. Ticketmaster images (already on event object from API)
//   2. Ticketmaster Images API (by event ID, for fresh fetch)
//   3. Unsplash (generic but real photos)
//   4. Pexels (generic but real photos)
//   5. Gradient fallback (handled in UI)

import { Event, isEventTrademarked } from './eventService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EventImageSearchResult {
  eventId: string;
  eventName: string;
  searchQuery: string;
  images: EventImage[];
  searchMetadata?: {
    isTrademarkedEvent: boolean;
    searchStrategy: 'ticketmaster' | 'generic' | 'venue' | 'location' | 'descriptive';
  };
}

export interface EventImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  photographer?: string;
  source: 'ticketmaster' | 'unsplash' | 'pexels' | 'local';
  alt: string;
  width?: number;
  height?: number;
}

// ─── Ticketmaster image shape (raw API) ──────────────────────────────────────

interface TicketmasterImage {
  ratio: '16_9' | '3_2' | '4_3' | string;
  url: string;
  width: number;
  height: number;
  fallback: boolean;
}

// ─── Pick best Ticketmaster image ─────────────────────────────────────────────
// Ticketmaster returns multiple sizes/ratios per event.
// We want: 16_9 ratio, non-fallback, largest available.

export function pickBestTicketmasterImage(
  images: TicketmasterImage[],
  preferRatio: '16_9' | '3_2' | '4_3' = '16_9'
): TicketmasterImage | null {
  if (!images?.length) return null;

  // Prefer non-fallback images
  const real = images.filter(img => !img.fallback);
  const pool = real.length > 0 ? real : images;

  // Prefer requested ratio
  const byRatio = pool.filter(img => img.ratio === preferRatio);
  const candidates = byRatio.length > 0 ? byRatio : pool;

  // Pick largest by width
  return candidates.reduce((best, img) =>
    (img.width ?? 0) > (best.width ?? 0) ? img : best
  );
}

// ─── Extract images already on the Event object ───────────────────────────────
// Ticketmaster events fetched via the Discovery API already carry images[].
// This handles that case without an extra API call.

export function extractTicketmasterImages(event: Event): EventImage[] {
  // Support both event.images (Ticketmaster shape) and event.imageUrl (mapped shape)
  const raw = (event as any).images as TicketmasterImage[] | undefined;

  if (raw?.length) {
    return raw
      .filter(img => img.url)
      .sort((a, b) => {
        // Non-fallback first, then by width descending
        if (a.fallback !== b.fallback) return a.fallback ? 1 : -1;
        return (b.width ?? 0) - (a.width ?? 0);
      })
      .map(img => ({
        id: `${event.id}-tm-${img.ratio}-${img.width}`,
        url: img.url,
        thumbnailUrl: img.url, // Ticketmaster URLs are already sized
        source: 'ticketmaster' as const,
        alt: event.name,
        width: img.width,
        height: img.height,
      }));
  }

  // Already-mapped single imageUrl
  const singleUrl = (event as any).imageUrl || (event as any).image || (event as any).heroImage;
  if (singleUrl) {
    return [{
      id: `${event.id}-mapped`,
      url: singleUrl,
      thumbnailUrl: singleUrl,
      source: 'ticketmaster' as const,
      alt: event.name,
    }];
  }

  return [];
}

// ─── Ticketmaster Images API (fresh fetch by event ID) ───────────────────────
// Only used when the event object doesn't already carry images.
// https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/#event-image-v2

export async function fetchTicketmasterImages(eventId: string): Promise<EventImage[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY || process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY;
  if (!apiKey) {
    console.warn('[eventImageSearch] No TICKETMASTER_API_KEY — skipping TM image fetch');
    return [];
  }

  // Strip source prefix if present (e.g. "tm-1234" → "1234")
  const tmId = eventId.replace(/^tm-/i, '');

  try {
    const res = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events/${tmId}/images.json?apikey=${apiKey}`,
      { next: { revalidate: 3600 } } // Cache 1hr — images don't change often
    );

    if (!res.ok) {
      console.warn(`[eventImageSearch] TM images API ${res.status} for event ${tmId}`);
      return [];
    }

    const data = await res.json();
    const raw: TicketmasterImage[] = data?.images ?? [];

    return raw
      .filter(img => img.url)
      .sort((a, b) => {
        if (a.fallback !== b.fallback) return a.fallback ? 1 : -1;
        return (b.width ?? 0) - (a.width ?? 0);
      })
      .map(img => ({
        id: `${tmId}-${img.ratio}-${img.width}`,
        url: img.url,
        thumbnailUrl: img.url,
        source: 'ticketmaster' as const,
        alt: `Event image`,
        width: img.width,
        height: img.height,
      }));
  } catch (err) {
    console.error('[eventImageSearch] TM images fetch failed:', err);
    return [];
  }
}

// ─── Unsplash fallback ────────────────────────────────────────────────────────

export async function searchUnsplashImages(event: Event, limit = 5): Promise<EventImage[]> {
  const query = generateImageSearchQuery(event);
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return generateMockImages(event, limit);

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${limit}&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${key}` }, next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error(`Unsplash ${res.status}`);
    const data = await res.json();

    return (data.results ?? []).map((p: any) => ({
      id: p.id,
      url: p.urls.regular,
      thumbnailUrl: p.urls.thumb,
      photographer: p.user.name,
      source: 'unsplash' as const,
      alt: p.alt_description || event.name,
      width: p.width,
      height: p.height,
    }));
  } catch (err) {
    console.warn('[eventImageSearch] Unsplash failed:', err);
    return generateMockImages(event, limit);
  }
}

// ─── Pexels fallback ──────────────────────────────────────────────────────────

export async function searchPexelsImages(event: Event, limit = 5): Promise<EventImage[]> {
  const query = generateImageSearchQuery(event);
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${limit}&orientation=landscape`,
      { headers: { Authorization: key }, next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error(`Pexels ${res.status}`);
    const data = await res.json();

    return (data.photos ?? []).map((p: any) => ({
      id: String(p.id),
      url: p.src.large,
      thumbnailUrl: p.src.medium,
      photographer: p.photographer,
      source: 'pexels' as const,
      alt: p.alt || event.name,
      width: p.width,
      height: p.height,
    }));
  } catch (err) {
    console.warn('[eventImageSearch] Pexels failed:', err);
    return [];
  }
}

// ─── Primary export: getEventHeroImage ───────────────────────────────────────
// Used by EventNotificationToast, event cards, and any component needing
// a single best image for an event.
//
// Priority:
//   1. Images already on event.images[] (Ticketmaster, no extra API call)
//   2. Ticketmaster Images API (fresh fetch)
//   3. Unsplash
//   4. Pexels
//   5. null (UI shows gradient fallback)

export async function getEventHeroImage(event: Event): Promise<EventImage | null> {
  // ① Already on the event object — free, instant, most relevant
  const fromEvent = extractTicketmasterImages(event);
  if (fromEvent.length > 0) {
    const best = fromEvent.find(img => {
      // Prefer 16:9 ratio images (wide format = best for hero)
      const id = img.id.toLowerCase();
      return id.includes('16_9') || id.includes('16-9');
    }) || fromEvent[0];
    return best;
  }

  // ② Ticketmaster Images API (event has an ID but no images pre-loaded)
  const tmImages = await fetchTicketmasterImages(event.id);
  if (tmImages.length > 0) {
    const best = tmImages.find(img => img.id.includes('16_9')) || tmImages[0];
    return best;
  }

  // ③ Unsplash fallback
  const unsplash = await searchUnsplashImages(event, 1);
  if (unsplash.length > 0) return unsplash[0];

  // ④ Pexels fallback
  const pexels = await searchPexelsImages(event, 1);
  if (pexels.length > 0) return pexels[0];

  // ⑤ Nothing found — UI handles gradient fallback
  return null;
}

// ─── Fetch multiple images for an event detail page ──────────────────────────

export async function fetchEventImages(event: Event, limit = 10): Promise<EventImage[]> {
  // Try Ticketmaster first (most relevant)
  const fromEvent = extractTicketmasterImages(event);
  if (fromEvent.length >= limit) return fromEvent.slice(0, limit);

  if (fromEvent.length > 0) {
    // Supplement with Unsplash for variety
    const remaining = limit - fromEvent.length;
    const unsplash = await searchUnsplashImages(event, remaining);
    return [...fromEvent, ...unsplash].slice(0, limit);
  }

  // No TM images — try fetching via API
  const tmFresh = await fetchTicketmasterImages(event.id);
  if (tmFresh.length > 0) return tmFresh.slice(0, limit);

  // Full Unsplash + Pexels fallback
  const half = Math.ceil(limit / 2);
  const [unsplash, pexels] = await Promise.all([
    searchUnsplashImages(event, half),
    searchPexelsImages(event, half),
  ]);
  return [...unsplash, ...pexels].slice(0, limit);
}

// ─── Destination images (city/venue context) ──────────────────────────────────

export async function fetchEventAndDestinationImages(event: Event, limit = 20): Promise<{
  eventImages: EventImage[];
  destinationImages: EventImage[];
}> {
  const half = Math.ceil(limit / 2);
  const eventImages = await fetchEventImages(event, half);

  // Destination = city landmark photos (always Unsplash/Pexels — no TM equivalent)
  const destEvent: Event = {
    ...event,
    id: `${event.id}-destination`,
    name: `${event.location.city} ${event.location.country} travel destination`,
  };
  const destinationImages = await fetchEventImages(destEvent, half);

  return { eventImages, destinationImages };
}

// ─── Search query generation (for Unsplash/Pexels fallback) ──────────────────

export function generateImageSearchQuery(event: Event): string {
  if (isEventTrademarked(event)) {
    return generateDescriptiveSearchQuery(event);
  }
  return `${event.name} ${event.location.city}`;
}

function generateDescriptiveSearchQuery(event: Event): string {
  const descriptiveMap: Record<string, string> = {
    'fifa-world-cup-2026':  'soccer football stadium north america 2026',
    'super-bowl-lx-2026':   'american football championship stadium',
    'wimbledon-2026':        'tennis grass court championship london',
    'summer-olympics-2028':  'olympic stadium sports los angeles',
    'coachella-2026':        'music festival desert california stage',
    'glastonbury-2026':      'music festival uk countryside crowd',
    'burning-man-2026':      'desert art festival nevada night',
  };

  if (descriptiveMap[event.id]) return descriptiveMap[event.id];

  const typeMap: Record<string, string> = {
    sports:   `sports stadium arena ${event.location.city}`,
    music:    `concert music festival ${event.location.city}`,
    festival: `festival celebration ${event.location.city}`,
  };

  return typeMap[event.type] || `${event.location.city} ${event.location.country} event`;
}

export function generateSearchQueryVariations(event: Event): string[] {
  const queries = [generateImageSearchQuery(event)];
  if (event.location.venue) queries.push(`${event.location.venue} ${event.location.city}`);
  queries.push(`${event.location.city} ${event.location.country} landmark`);
  return queries;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function generateImageAltText(event: Event): string {
  if (isEventTrademarked(event)) {
    const typeDescriptions: Record<string, string> = {
      sports:   'sporting event',
      music:    'music festival',
      festival: 'festival celebration',
    };
    return `${typeDescriptions[event.type] || 'event'} in ${event.location.city}, ${event.location.country}`;
  }
  return `${event.name} in ${event.location.city}, ${event.location.country}`;
}

export function getImageAttribution(image: EventImage): string {
  switch (image.source) {
    case 'ticketmaster': return 'Ticketmaster';
    case 'unsplash':     return `Photo by ${image.photographer || 'Unknown'} on Unsplash`;
    case 'pexels':       return `Photo by ${image.photographer || 'Unknown'} on Pexels`;
    default:             return 'Gladys Travel';
  }
}

export async function searchEventImages(event: Event, limit = 10): Promise<EventImageSearchResult> {
  const images = await fetchEventImages(event, limit);
  const isTrademarked = isEventTrademarked(event);
  const hasTM = images.some(img => img.source === 'ticketmaster');

  return {
    eventId: event.id,
    eventName: event.name,
    searchQuery: generateImageSearchQuery(event),
    images,
    searchMetadata: {
      isTrademarkedEvent: isTrademarked,
      searchStrategy: hasTM ? 'ticketmaster' : isTrademarked ? 'descriptive' : 'generic',
    },
  };
}

// ─── Mock fallback ────────────────────────────────────────────────────────────

function generateMockImages(event: Event, limit: number): EventImage[] {
  return Array.from({ length: limit }, (_, i) => ({
    id: `${event.id}-mock-${i}`,
    url: `https://picsum.photos/seed/${event.id}-${i}/1200/800`,
    thumbnailUrl: `https://picsum.photos/seed/${event.id}-${i}/400/300`,
    photographer: 'Picsum',
    source: 'local' as const,
    alt: `${event.name} - Image ${i + 1}`,
    width: 1200,
    height: 800,
  }));
}

// ─── Legacy compat ────────────────────────────────────────────────────────────

/** @deprecated Use searchEventImages() with Event object instead */
export async function searchEventImagesByName(eventName: string, limit = 10): Promise<EventImage[]> {
  console.warn('[eventImageSearch] searchEventImagesByName is deprecated');
  return generateMockImages(
    { id: 'legacy', name: eventName, type: 'sports', location: { city: 'Unknown', country: 'Unknown' }, startDate: '', endDate: '' },
    limit
  );
}