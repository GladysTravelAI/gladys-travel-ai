// lib/eventImageSearch.ts
// Event-focused image fetching for concerts, sports, festivals, shows
// Prioritizes event venues, performers, and event atmosphere over city landmarks

import type { PlaceImage } from '@/lib/Image';
import { buildUnsplashAttribution, buildPexelsAttribution } from '@/lib/Image';

// ==================== EVENT TYPE DETECTION ====================

export type EventType = 
  | 'concert' 
  | 'music_festival' 
  | 'sports' 
  | 'theater' 
  | 'comedy' 
  | 'exhibition' 
  | 'conference'
  | 'generic';

interface EventContext {
  eventName: string;
  eventType: EventType;
  venue?: string;
  artist?: string;
  team?: string;
  destination: string;
}

/**
 * Parse event information from search query
 * Examples:
 * - "Taylor Swift Eras Tour Paris" → { eventName: "Eras Tour", artist: "Taylor Swift", type: "concert" }
 * - "Lakers vs Warriors LA" → { team: "Lakers", type: "sports" }
 * - "Coachella 2024" → { eventName: "Coachella", type: "music_festival" }
 */
export function parseEventContext(query: string): EventContext {
  const normalized = query.toLowerCase();
  
  // Detect event type
  let eventType: EventType = 'generic';
  
  if (/(concert|tour|show|live|performance)/i.test(query)) {
    eventType = 'concert';
  } else if (/(festival|fest|music festival)/i.test(query)) {
    eventType = 'music_festival';
  } else if (/(game|match|championship|vs|league|nba|nfl|mlb|nhl|soccer|football)/i.test(query)) {
    eventType = 'sports';
  } else if (/(broadway|theater|theatre|play|musical)/i.test(query)) {
    eventType = 'theater';
  } else if (/(comedy|stand-up|comedian)/i.test(query)) {
    eventType = 'comedy';
  } else if (/(exhibition|expo|art show|gallery)/i.test(query)) {
    eventType = 'exhibition';
  } else if (/(conference|summit|convention)/i.test(query)) {
    eventType = 'conference';
  }
  
  return {
    eventName: query,
    eventType,
    destination: '', // To be extracted
  };
}

// ==================== EVENT-SPECIFIC SEARCH QUERIES ====================

/**
 * Build search queries optimized for event images
 */
function buildEventSearchQueries(context: EventContext): string[] {
  const queries: string[] = [];
  
  switch (context.eventType) {
    case 'concert':
      if (context.artist) {
        queries.push(`${context.artist} concert live performance`);
        queries.push(`${context.artist} on stage crowd`);
      }
      if (context.venue) {
        queries.push(`${context.venue} concert hall inside`);
      }
      queries.push(`concert crowd lights stage atmosphere`);
      break;
      
    case 'music_festival':
      queries.push(`${context.eventName} festival crowd stage`);
      queries.push(`music festival outdoor concert atmosphere`);
      queries.push(`festival stage lights crowd energy`);
      break;
      
    case 'sports':
      if (context.team) {
        queries.push(`${context.team} game stadium crowd`);
      }
      if (context.venue) {
        queries.push(`${context.venue} stadium inside packed crowd`);
      }
      queries.push(`stadium sports game crowd atmosphere`);
      break;
      
    case 'theater':
      queries.push(`${context.eventName} theater performance`);
      queries.push(`broadway theater stage audience`);
      queries.push(`theater performance live show`);
      break;
      
    case 'comedy':
      queries.push(`comedy show stand-up performance`);
      queries.push(`comedy club audience laughing`);
      break;
      
    case 'exhibition':
      queries.push(`${context.eventName} exhibition gallery`);
      queries.push(`art exhibition museum gallery visitors`);
      break;
      
    case 'conference':
      queries.push(`${context.eventName} conference attendees`);
      queries.push(`conference keynote audience networking`);
      break;
      
    default:
      queries.push(`${context.eventName} event venue atmosphere`);
  }
  
  return queries;
}

// ==================== EVENT IMAGE FETCHERS ====================

/**
 * Fetch event-specific images from Unsplash
 * Prioritizes event atmosphere, venues, and performances
 */
async function fetchEventImagesUnsplash(
  context: EventContext,
  apiKey: string
): Promise<PlaceImage[]> {
  try {
    const queries = buildEventSearchQueries(context);
    let allImages: PlaceImage[] = [];
    
    // Search for each query
    for (const query of queries.slice(0, 2)) {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Client-ID ${apiKey}` },
      });
      
      if (!response.ok) continue;
      
      const data = await response.json();
      const images = (data.results || []).map((photo: any) => ({
        url: photo.urls.regular,
        attributions: buildUnsplashAttribution(photo.user.name, photo.user.links.html),
        source: 'unsplash' as const,
        photographer: photo.user.name,
        width: photo.width,
        height: photo.height,
      }));
      
      allImages = [...allImages, ...images];
    }
    
    // Remove duplicates and limit
    const uniqueImages = Array.from(
      new Map(allImages.map(img => [img.url, img])).values()
    ).slice(0, 5);
    
    return uniqueImages;
  } catch (error) {
    console.error('❌ Event Images Unsplash Error:', error);
    return [];
  }
}

/**
 * Fetch event-specific images from Pexels
 */
async function fetchEventImagesPexels(
  context: EventContext,
  apiKey: string
): Promise<PlaceImage[]> {
  try {
    const queries = buildEventSearchQueries(context);
    let allImages: PlaceImage[] = [];
    
    for (const query of queries.slice(0, 2)) {
      const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': apiKey },
      });
      
      if (!response.ok) continue;
      
      const data = await response.json();
      const images = (data.photos || []).map((photo: any) => ({
        url: photo.src.large2x || photo.src.large,
        attributions: buildPexelsAttribution(photo.photographer, photo.photographer_url),
        source: 'pexels' as const,
        photographer: photo.photographer,
        width: photo.width,
        height: photo.height,
      }));
      
      allImages = [...allImages, ...images];
    }
    
    const uniqueImages = Array.from(
      new Map(allImages.map(img => [img.url, img])).values()
    ).slice(0, 5);
    
    return uniqueImages;
  } catch (error) {
    console.error('❌ Event Images Pexels Error:', error);
    return [];
  }
}

/**
 * Fetch venue images from Google Places
 * Perfect for stadiums, concert halls, theaters
 */
async function fetchVenueImages(
  venueName: string,
  apiKey: string
): Promise<PlaceImage[]> {
  try {
    // Find place ID
    const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(venueName)}&inputtype=textquery&fields=place_id&key=${apiKey}`;
    
    const findResponse = await fetch(findPlaceUrl);
    const findData = await findResponse.json();
    
    if (findData.status !== 'OK' || !findData.candidates?.[0]?.place_id) {
      return [];
    }
    
    const placeId = findData.candidates[0].place_id;
    
    // Get venue photos
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=photos,name&key=${apiKey}`;
    
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();
    
    if (!detailsData.result?.photos) {
      return [];
    }
    
    const images: PlaceImage[] = detailsData.result.photos
      .slice(0, 3)
      .map((photo: any) => ({
        url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photoreference=${photo.photo_reference}&key=${apiKey}`,
        attributions: photo.html_attributions[0] || '<a href="https://maps.google.com">Google Maps User</a>',
        source: 'google_places' as const,
        width: photo.width,
        height: photo.height,
      }));
    
    console.log(`✅ Venue Images: Found ${images.length} photos of ${venueName}`);
    return images;
  } catch (error) {
    console.error('❌ Venue Images Error:', error);
    return [];
  }
}

// ==================== MAIN EVENT IMAGE FETCHER ====================

/**
 * Fetch images for an event with intelligent fallback
 * 
 * Priority:
 * 1. Venue photos (if venue name provided)
 * 2. Event-specific images (Unsplash/Pexels with event context)
 * 3. Generic event type images
 * 
 * @param query - Event search query (e.g., "Taylor Swift Eras Tour Paris")
 * @param venueName - Optional specific venue name for Google Places
 * @returns Array of PlaceImage objects with event-focused content
 */
export async function fetchEventImages(
  query: string,
  venueName?: string
): Promise<PlaceImage[]> {
  const context = parseEventContext(query);
  
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || process.env.GOOGLE_PLACES_API_KEY;
  const unsplashKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_ACCESS_KEY;
  const pexelsKey = process.env.NEXT_PUBLIC_PEXELS_API_KEY || process.env.PEXELS_API_KEY;
  
  let allImages: PlaceImage[] = [];
  
  // Strategy 1: Venue photos (most specific)
  if (venueName && googleKey) {
    console.log(`🏟️ Fetching venue images for: ${venueName}`);
    const venueImages = await fetchVenueImages(venueName, googleKey);
    allImages = [...allImages, ...venueImages];
  }
  
  // Strategy 2: Event-specific images from Unsplash
  if (unsplashKey) {
    console.log(`🎵 Fetching event images from Unsplash: ${query}`);
    const unsplashImages = await fetchEventImagesUnsplash(context, unsplashKey);
    allImages = [...allImages, ...unsplashImages];
  }
  
  // Strategy 3: Event-specific images from Pexels
  if (pexelsKey && allImages.length < 5) {
    console.log(`🎵 Fetching event images from Pexels: ${query}`);
    const pexelsImages = await fetchEventImagesPexels(context, pexelsKey);
    allImages = [...allImages, ...pexelsImages];
  }
  
  // Remove duplicates and limit to 6 images
  const uniqueImages = Array.from(
    new Map(allImages.map(img => [img.url, img])).values()
  ).slice(0, 6);
  
  console.log(`✅ Event Images: Returning ${uniqueImages.length} images for "${query}"`);
  
  return uniqueImages;
}

/**
 * Combined fetcher: Event images + Destination images
 * Perfect for "Event + Things to do" pages
 * 
 * @param eventQuery - Event search (e.g., "Taylor Swift in Paris")
 * @param destination - City name (e.g., "Paris")
 * @param venueName - Optional venue name
 * @returns Object with separate event and destination images
 */
export async function fetchEventAndDestinationImages(
  eventQuery: string,
  destination: string,
  venueName?: string
) {
  // Import destination fetcher dynamically to avoid circular dependency
  const { fetchImages: fetchDestinationImages } = await import('./imageSearch');
  
  const [eventImages, destinationImages] = await Promise.all([
    fetchEventImages(eventQuery, venueName),
    fetchDestinationImages(destination),
  ]);
  
  return {
    event: eventImages,
    destination: destinationImages,
    combined: [...eventImages, ...destinationImages.slice(0, 3)],
  };
}