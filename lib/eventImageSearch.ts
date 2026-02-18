// lib/eventImageSearch.ts
// 🎯 Event Image Search - Trademark-Safe Image Discovery
//
// STRATEGIC ARCHITECTURE:
// - Generates image search queries for events
// - Avoids trademarked terms in search queries where appropriate
// - Uses factual, descriptive language for image discovery
// - Integrates with Unsplash/Pexels APIs for event imagery
//
// LEGAL FRAMEWORK:
// - Image searches use descriptive terms, not trademark claims
// - Trademark metadata preserved but not used in external API calls
// - Fair use: searching for images of publicly observable events

import { Event, isEventTrademarked } from './eventService';

// ==================== TYPE DEFINITIONS ====================

export interface EventImageSearchResult {
  eventId: string;
  eventName: string;
  searchQuery: string;
  images: EventImage[];
  searchMetadata?: {
    isTrademarkedEvent: boolean;
    searchStrategy: 'generic' | 'venue' | 'location' | 'descriptive';
  };
}

export interface EventImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  photographer?: string;
  source: 'unsplash' | 'pexels' | 'local';
  alt: string;
  width?: number;
  height?: number;
}

// ==================== SEARCH QUERY GENERATION ====================

export function generateImageSearchQuery(event: Event): string {
  const isTrademarked = isEventTrademarked(event);
  if (isTrademarked) {
    return generateDescriptiveSearchQuery(event);
  } else {
    return generateDirectSearchQuery(event);
  }
}

function generateDirectSearchQuery(event: Event): string {
  return `${event.name} ${event.location.city}`;
}

function generateDescriptiveSearchQuery(event: Event): string {
  const { type, location } = event;
  const descriptiveMap: Record<string, string> = {
    'fifa-world-cup-2026': 'soccer football stadium north america',
    'super-bowl-lx-2026': 'american football championship stadium',
    'wimbledon-2026': 'tennis grass court championship london',
    'summer-olympics-2028': 'olympic stadium sports los angeles',
    'coachella-2026': 'music festival desert california',
    'glastonbury-2026': 'music festival uk countryside',
    'burning-man-2026': 'desert art festival nevada',
  };
  if (descriptiveMap[event.id]) {
    return descriptiveMap[event.id];
  }
  const typeMap = {
    sports: 'sports stadium arena',
    music: 'concert music festival',
    festival: 'festival celebration event'
  };
  return `${typeMap[type]} ${location.city} ${location.country}`;
}

export function generateSearchQueryVariations(event: Event): string[] {
  const queries: string[] = [];
  queries.push(generateImageSearchQuery(event));
  if (event.location.venue) {
    queries.push(`${event.location.venue} ${event.location.city}`);
  }
  queries.push(`${event.location.city} ${event.location.country} landmark`);
  const typeQueries = {
    sports: `${event.location.city} sports arena stadium`,
    music: `${event.location.city} music venue concert`,
    festival: `${event.location.city} festival celebration`
  };
  queries.push(typeQueries[event.type]);
  return queries;
}

// ==================== IMAGE SEARCH INTEGRATION ====================

export async function searchEventImages(
  event: Event,
  limit: number = 10
): Promise<EventImageSearchResult> {
  const searchQuery = generateImageSearchQuery(event);
  const isTrademarked = isEventTrademarked(event);
  console.log(`🔍 Searching images for "${event.name}" using query: "${searchQuery}"`);
  const mockImages: EventImage[] = generateMockImages(event, limit);
  return {
    eventId: event.id,
    eventName: event.name,
    searchQuery,
    images: mockImages,
    searchMetadata: {
      isTrademarkedEvent: isTrademarked,
      searchStrategy: isTrademarked ? 'descriptive' : 'generic'
    }
  };
}

export async function searchUnsplashImages(
  event: Event,
  limit: number = 10
): Promise<EventImage[]> {
  const searchQuery = generateImageSearchQuery(event);
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.warn('⚠️ UNSPLASH_ACCESS_KEY not found, using mock images');
    return generateMockImages(event, limit);
  }
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=${limit}`,
      { headers: { 'Authorization': `Client-ID ${accessKey}` } }
    );
    if (!response.ok) throw new Error(`Unsplash API error: ${response.status}`);
    const data = await response.json();
    return data.results.map((photo: any) => ({
      id: photo.id,
      url: photo.urls.regular,
      thumbnailUrl: photo.urls.thumb,
      photographer: photo.user.name,
      source: 'unsplash' as const,
      alt: photo.alt_description || `Image of ${event.name}`,
      width: photo.width,
      height: photo.height
    }));
  } catch (error) {
    console.error('❌ Unsplash search failed:', error);
    return generateMockImages(event, limit);
  }
}

export async function searchPexelsImages(
  event: Event,
  limit: number = 10
): Promise<EventImage[]> {
  const searchQuery = generateImageSearchQuery(event);
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ PEXELS_API_KEY not found, using mock images');
    return generateMockImages(event, limit);
  }
  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=${limit}`,
      { headers: { 'Authorization': apiKey } }
    );
    if (!response.ok) throw new Error(`Pexels API error: ${response.status}`);
    const data = await response.json();
    return data.photos.map((photo: any) => ({
      id: photo.id.toString(),
      url: photo.src.large,
      thumbnailUrl: photo.src.medium,
      photographer: photo.photographer,
      source: 'pexels' as const,
      alt: photo.alt || `Image of ${event.name}`,
      width: photo.width,
      height: photo.height
    }));
  } catch (error) {
    console.error('❌ Pexels search failed:', error);
    return generateMockImages(event, limit);
  }
}

export async function getEventHeroImage(event: Event): Promise<EventImage | null> {
  if (event.heroImage) {
    return {
      id: `${event.id}-hero`,
      url: event.heroImage,
      thumbnailUrl: event.heroImage,
      source: 'local',
      alt: event.name
    };
  }
  const images = await searchUnsplashImages(event, 1);
  return images[0] || null;
}

// ==================== MOCK IMAGES ====================

function generateMockImages(event: Event, limit: number): EventImage[] {
  const mockImages: EventImage[] = [];
  for (let i = 0; i < limit; i++) {
    mockImages.push({
      id: `${event.id}-mock-${i}`,
      url: `https://picsum.photos/seed/${event.id}-${i}/1200/800`,
      thumbnailUrl: `https://picsum.photos/seed/${event.id}-${i}/400/300`,
      photographer: 'Mock Photographer',
      source: 'local',
      alt: `${event.name} - Image ${i + 1}`,
      width: 1200,
      height: 800
    });
  }
  return mockImages;
}

// ==================== EXPORT UTILITIES ====================

export function generateImageAltText(event: Event): string {
  const isTrademarked = isEventTrademarked(event);
  if (isTrademarked) {
    const typeDescriptions = {
      sports: 'sporting event',
      music: 'music festival',
      festival: 'festival celebration'
    };
    return `${typeDescriptions[event.type]} in ${event.location.city}, ${event.location.country}`;
  } else {
    return `${event.name} in ${event.location.city}, ${event.location.country}`;
  }
}

export function getImageAttribution(image: EventImage): string {
  switch (image.source) {
    case 'unsplash':
      return `Photo by ${image.photographer || 'Unknown'} on Unsplash`;
    case 'pexels':
      return `Photo by ${image.photographer || 'Unknown'} on Pexels`;
    case 'local':
      return image.photographer || 'GladysTravelAI';
    default:
      return 'Image source unknown';
  }
}

/**
 * Legacy compatibility: searchEventImagesByName
 * @deprecated Use searchEventImages() instead
 */
export async function searchEventImagesByName(
  eventName: string,
  limit: number = 10
): Promise<EventImage[]> {
  console.warn('⚠️ searchEventImagesByName is deprecated. Use searchEventImages() with Event object instead.');
  return generateMockImages(
    {
      id: 'legacy',
      name: eventName,
      type: 'sports',
      location: { city: 'Unknown', country: 'Unknown' },
      startDate: '',
      endDate: ''
    },
    limit
  );
}

// ==================== API ROUTE EXPORTS ====================

/**
 * Fetch images for a single event
 * Used by app/api/images/route.ts
 * Combines Unsplash + Pexels results up to the requested limit
 */
export async function fetchEventImages(
  event: Event,
  limit: number = 10
): Promise<EventImage[]> {
  const unsplashImages = await searchUnsplashImages(event, Math.ceil(limit / 2));

  if (unsplashImages.length >= limit) {
    return unsplashImages.slice(0, limit);
  }

  const remaining = limit - unsplashImages.length;
  const pexelsImages = await searchPexelsImages(event, remaining);

  return [...unsplashImages, ...pexelsImages].slice(0, limit);
}

/**
 * Fetch images for both an event and its destination city
 * Used by app/api/images/route.ts
 * Returns a structured object with separate event and destination image arrays
 */
export async function fetchEventAndDestinationImages(
  event: Event,
  limit: number = 20
): Promise<{
  eventImages: EventImage[];
  destinationImages: EventImage[];
}> {
  const half = Math.ceil(limit / 2);

  // Event-specific images
  const eventImages = await fetchEventImages(event, half);

  // Destination images using city as search context
  const destinationEvent: Event = {
    ...event,
    id: `${event.id}-destination`,
    name: `${event.location.city} ${event.location.country} travel destination landmark`,
  };

  const destinationImages = await fetchEventImages(destinationEvent, half);

  return {
    eventImages,
    destinationImages,
  };
}