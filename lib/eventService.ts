// lib/liveEventService.ts - Live Event Integration with Ticketmaster
// ✨ Fetches real upcoming events with correct dates and relevant images

import { Event, FEATURED_EVENTS } from './event-data';
import { fetchImages } from './imageSearch';

const TICKETMASTER_API_KEY = process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY;

// ============================================
// TYPES
// ============================================

interface TicketmasterEvent {
  id: string;
  name: string;
  dates?: {
    start?: {
      localDate?: string;
      localTime?: string;
    };
    end?: {
      localDate?: string;
    };
  };
  images?: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  priceRanges?: Array<{
    min: number;
    max: number;
    currency: string;
  }>;
  classifications?: Array<{
    segment?: {
      name: string;
    };
    genre?: {
      name: string;
    };
    subGenre?: {
      name: string;
    };
  }>;
  _embedded?: {
    venues?: Array<{
      name: string;
      city?: {
        name: string;
      };
      country?: {
        name: string;
      };
      address?: {
        line1: string;
      };
      location?: {
        latitude: string;
        longitude: string;
      };
      capacity?: number;
    }>;
  };
  info?: string;
  pleaseNote?: string;
  url?: string;
}

interface SearchResult {
  id: string;
  name: string;
  startDate: string;
  venue: {
    name: string;
    city: string;
    country: string;
  };
  priceRange: {
    min: number;
    max: number;
    currency: string;
  } | null;
  url: string;
  image: string;
  description: string;
  source: string;
}

// Cache for live events (1 hour TTL)
let cachedEvents: { events: Event[]; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Fetch live upcoming events from Ticketmaster API
 * Returns properly formatted Event objects with real data and relevant images
 */
export async function fetchLiveEvents(limit: number = 6): Promise<Event[]> {
  // Check cache first
  if (cachedEvents && Date.now() - cachedEvents.timestamp < CACHE_TTL) {
    console.log('✅ Returning cached live events');
    return cachedEvents.events.slice(0, limit);
  }

  if (!TICKETMASTER_API_KEY) {
    console.warn('⚠️ Ticketmaster API key not configured - using curated events');
    return FEATURED_EVENTS.filter(e => e.featured).slice(0, limit);
  }

  try {
    console.log('🎫 Fetching live events from Ticketmaster...');
    
    // Fetch major upcoming events
    const params = new URLSearchParams({
      apikey: TICKETMASTER_API_KEY,
      size: String(limit * 3), // Fetch more for filtering
      sort: 'date,asc', // Upcoming first
      countryCode: 'US,CA,GB,DE,FR,ES,IT,AU,NZ,JP,MX,BR,AR,ZA',
      // Only major segments
      segmentName: 'Sports,Music',
      // Minimum venue capacity for major events
      minPrice: '50', // Filter out very cheap/small events
    });

    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?${params}`,
      { 
        next: { revalidate: 3600 }, // Cache for 1 hour
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }

    const data = await response.json();
    const events = data._embedded?.events || [];
    
    if (events.length === 0) {
      console.log('⚠️ No live events found - using curated events');
      return FEATURED_EVENTS.filter(e => e.featured).slice(0, limit);
    }

    console.log(`✅ Found ${events.length} live events from Ticketmaster`);
    
    // Map and enhance events with images
    const mappedEvents = await Promise.all(
      events.slice(0, limit).map((tmEvent: any) => mapTicketmasterEvent(tmEvent))
    );

    // Cache the results
    cachedEvents = {
      events: mappedEvents,
      timestamp: Date.now()
    };

    return mappedEvents;
  } catch (error) {
    console.error('❌ Error fetching live events:', error);
    // Fallback to curated events
    return FEATURED_EVENTS.filter(e => e.featured).slice(0, limit);
  }
}

/**
 * Map Ticketmaster event to our Event format with enhanced images
 */
async function mapTicketmasterEvent(tmEvent: TicketmasterEvent): Promise<Event> {
  const venue = tmEvent._embedded?.venues?.[0];
  const priceRange = tmEvent.priceRanges?.[0];
  const classification = tmEvent.classifications?.[0];
  
  // Get best image from Ticketmaster
  const images = tmEvent.images || [];
  let heroImage = images.find((img: any) => img.width >= 1024)?.url || 
                  images.find((img: any) => img.width >= 640)?.url ||
                  images[0]?.url;

  // If no good Ticketmaster image or it's generic, fetch from image services
  if (!heroImage || heroImage.includes('static.ticketmaster') || heroImage.includes('placeholder')) {
    try {
      // Fetch relevant images based on event name and location
      const searchQuery = `${tmEvent.name} ${venue?.city?.name || ''}`;
      const fetchedImages = await fetchImages(searchQuery);
      
      if (fetchedImages && fetchedImages.length > 0) {
        heroImage = fetchedImages[0].url;
        console.log(`✅ Enhanced image for "${tmEvent.name}"`);
      }
    } catch (error) {
      console.log(`⚠️ Could not fetch enhanced image for "${tmEvent.name}"`);
    }
  }

  // Fallback to high-quality Unsplash image
  if (!heroImage) {
    heroImage = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200';
  }

  // Format date properly
  const eventDate = new Date(tmEvent.dates?.start?.localDate || Date.now());
  const formattedDate = eventDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });

  // Build description
  const description = tmEvent.info || 
                     tmEvent.pleaseNote || 
                     `Experience ${tmEvent.name} live at ${venue?.name || 'a premier venue'}! ${
                       formattedDate
                     }. Don't miss this incredible event - get your tickets now!`;

  return {
    id: `tm-${tmEvent.id}`,
    name: tmEvent.name,
    genericName: tmEvent.name,
    type: mapEventType(classification?.segment?.name),
    sport: mapSportType(classification),
    startDate: tmEvent.dates?.start?.localDate || new Date().toISOString().split('T')[0],
    endDate: tmEvent.dates?.end?.localDate || tmEvent.dates?.start?.localDate || new Date().toISOString().split('T')[0],
    venue: {
      name: venue?.name || 'TBD',
      city: venue?.city?.name || 'TBD',
      country: venue?.country?.name || 'TBD',
      capacity: venue?.capacity || 50000,
      address: venue?.address?.line1 || '',
      coordinates: {
        lat: parseFloat(venue?.location?.latitude || '0'),
        lng: parseFloat(venue?.location?.longitude || '0')
      }
    },
    images: [heroImage],
    heroImage: heroImage,
    thumbnail: heroImage,
    description: description,
    highlights: [
      `🎫 Live at ${venue?.name || 'premier venue'}`,
      `📍 ${venue?.city?.name || 'Major city'}, ${venue?.country?.name || 'International'}`,
      priceRange?.min ? `💰 From ${priceRange.currency || 'USD'} $${priceRange.min}` : '💎 Premium tickets available',
      `🗓️ ${formattedDate}`,
      venue?.capacity ? `👥 Capacity: ${venue.capacity.toLocaleString()}` : '🏟️ Major venue',
    ],
    tickets: [
      {
        category: 'Standard Admission',
        price: priceRange?.min || 150,
        currency: priceRange?.currency || 'USD',
        perks: ['Event entry', 'Venue access', 'Official ticket'],
        available: true,
        affiliateUrl: tmEvent.url || '',
        partner: 'Ticketmaster'
      },
      ...(priceRange?.max && priceRange.max > (priceRange.min * 2) ? [{
        category: 'Premium Seating',
        price: Math.round((priceRange.min + priceRange.max) / 2),
        currency: priceRange.currency || 'USD',
        perks: ['Premium seating', 'Better views', 'VIP access'],
        available: true,
        affiliateUrl: tmEvent.url || '',
        partner: 'Ticketmaster'
      }] : [])
    ],
    estimatedTicketPrice: {
      min: priceRange?.min || 100,
      max: priceRange?.max || 1000,
      currency: priceRange?.currency || 'USD'
    },
    packages: [], // Can be added later
    localInfo: {
      nearbyHotels: 50,
      averageHotelPrice: 200,
      transportation: ['Uber/Lyft', 'Public transit', 'Taxi', 'Walking']
    },
    featured: true,
    priority: 10,
    tags: [
      classification?.segment?.name?.toLowerCase(),
      classification?.genre?.name?.toLowerCase(),
      classification?.subGenre?.name?.toLowerCase(),
      venue?.city?.name?.toLowerCase(),
      venue?.country?.name?.toLowerCase()
    ].filter(Boolean) as string[],
    disclaimer: '⚠️ Independent travel service. Not affiliated with Ticketmaster or event organizers. All trademarks belong to their respective owners.'
  } as Event;
}

// Helper functions
function mapEventType(segment: string | undefined): Event['type'] {
  if (!segment) return 'sports';
  const lower = segment.toLowerCase();
  if (lower.includes('sport')) return 'sports';
  if (lower.includes('music') || lower.includes('concert')) return 'music';
  if (lower.includes('festival')) return 'festival';
  if (lower.includes('art') || lower.includes('theatre') || lower.includes('family')) return 'cultural';
  if (lower.includes('exhibition')) return 'exhibition';
  return 'sports';
}

function mapSportType(classification: any): Event['sport'] | undefined {
  if (!classification) return undefined;
  
  const segment = classification.segment?.name?.toLowerCase() || '';
  const genre = classification.genre?.name?.toLowerCase() || '';
  const subGenre = classification.subGenre?.name?.toLowerCase() || '';
  const combined = `${segment} ${genre} ${subGenre}`;
  
  // Soccer/Football
  if (combined.includes('soccer') || (combined.includes('football') && !combined.includes('american'))) {
    return 'football';
  }
  
  // American Football
  if (combined.includes('american football') || combined.includes('nfl')) {
    return 'american-football';
  }
  
  // Basketball
  if (combined.includes('basketball') || combined.includes('nba')) {
    return 'basketball';
  }
  
  // Baseball
  if (combined.includes('baseball') || combined.includes('mlb')) {
    return 'baseball';
  }
  
  // Tennis
  if (combined.includes('tennis')) {
    return 'tennis';
  }
  
  // Racing
  if (combined.includes('racing') || combined.includes('formula') || combined.includes('motorsport') || 
      combined.includes('f1') || combined.includes('nascar')) {
    return 'racing';
  }
  
  // Hockey
  if (combined.includes('hockey') || combined.includes('nhl')) {
    return 'hockey';
  }
  
  // Golf
  if (combined.includes('golf') || combined.includes('pga')) {
    return 'golf';
  }
  
  // Boxing/MMA
  if (combined.includes('boxing') || combined.includes('mma') || combined.includes('ufc') || 
      combined.includes('wrestling') || combined.includes('fight')) {
    return 'boxing-mma';
  }
  
  // Rugby
  if (combined.includes('rugby')) {
    return 'rugby';
  }
  
  // Cricket
  if (combined.includes('cricket')) {
    return 'cricket';
  }
  
  // Multi-sport
  if (combined.includes('olympic') || combined.includes('multi') || combined.includes('games')) {
    return 'multi-sport';
  }
  
  return undefined;
}

/**
 * Clear the events cache (useful for testing or manual refresh)
 */
export function clearEventsCache(): void {
  cachedEvents = null;
  console.log('🗑️ Events cache cleared');
}

/**
 * Get cache stats for debugging
 */
export function getEventsCacheStats(): { cached: boolean; age: number | null; count: number } {
  if (!cachedEvents) {
    return { cached: false, age: null, count: 0 };
  }
  
  return {
    cached: true,
    age: Date.now() - cachedEvents.timestamp,
    count: cachedEvents.events.length
  };
}

// ============================================
// UNIVERSAL SEARCH & COMPATIBILITY
// ============================================

/**
 * Universal search for events (searches Ticketmaster)
 * This maintains compatibility with existing code that uses eventService.universalSearch()
 */
export async function universalSearch(query: string): Promise<SearchResult[]> {
  if (!TICKETMASTER_API_KEY) {
    console.warn('⚠️ Ticketmaster API key not configured');
    return [];
  }

  try {
    console.log(`🔍 Universal search for: "${query}"`);
    
    const params = new URLSearchParams({
      apikey: TICKETMASTER_API_KEY,
      keyword: query,
      size: '20',
      sort: 'date,asc',
      countryCode: 'US,CA,GB,DE,FR,ES,IT,AU,NZ,JP,MX,BR,AR,ZA'
    });

    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?${params}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      console.error('❌ Ticketmaster API error:', response.status);
      return [];
    }

    const data = await response.json();
    const events: TicketmasterEvent[] = data._embedded?.events || [];
    
    console.log(`✅ Universal search found ${events.length} events`);
    
    // Map to simpler format for compatibility
    return events.map((event: TicketmasterEvent): SearchResult => {
      const venue = event._embedded?.venues?.[0];
      const priceRange = event.priceRanges?.[0];
      
      return {
        id: event.id,
        name: event.name,
        startDate: event.dates?.start?.localDate || new Date().toISOString().split('T')[0],
        venue: {
          name: venue?.name || 'TBD',
          city: venue?.city?.name || 'TBD',
          country: venue?.country?.name || 'TBD'
        },
        priceRange: priceRange ? {
          min: priceRange.min,
          max: priceRange.max,
          currency: priceRange.currency
        } : null,
        url: event.url || '',
        image: event.images?.find((img) => img.width >= 640)?.url || event.images?.[0]?.url || '',
        description: event.info || event.pleaseNote || '',
        source: 'ticketmaster'
      };
    });
  } catch (error) {
    console.error('❌ Universal search error:', error);
    return [];
  }
}

/**
 * Cached search for events page
 * This is an alias for universalSearch for backward compatibility
 */
export async function searchEventsWithCache(query?: string): Promise<SearchResult[]> {
  // If no query, return featured events
  if (!query || query.trim() === '') {
    console.log('🎫 No query provided, using default search');
    // Return some default results or empty array
    return [];
  }
  
  // Use universalSearch which already has the logic
  return universalSearch(query);
}

/**
 * Export eventService object for compatibility with existing code
 */
export const eventService = {
  universalSearch,
  fetchLiveEvents,
  clearEventsCache,
  getEventsCacheStats,
  searchEventsWithCache
};

/**
 * Also export as default for maximum compatibility
 */
export default eventService;