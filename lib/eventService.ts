// lib/eventService.ts - Dynamic Event Service with Multiple APIs

import { Event } from './event-data';

// ============================================
// API CONFIGURATION
// ============================================

const TICKETMASTER_API_KEY = process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY;
const SEATGEEK_CLIENT_ID = process.env.NEXT_PUBLIC_SEATGEEK_CLIENT_ID;
const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
const PEXELS_API_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY;
const GOOGLE_CUSTOM_SEARCH_KEY = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID;

// ============================================
// IMAGE SERVICE
// ============================================

class ImageService {
  // Try Unsplash first (best quality)
  async getUnsplashImage(query: string): Promise<string | null> {
    if (!UNSPLASH_ACCESS_KEY) return null;

    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
        {
          headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` }
        }
      );

      if (!response.ok) return null;
      const data = await response.json();
      
      return data.results?.[0]?.urls?.regular || null;
    } catch (error) {
      console.error('Unsplash error:', error);
      return null;
    }
  }

  // Try Pexels second
  async getPexelsImage(query: string): Promise<string | null> {
    if (!PEXELS_API_KEY) return null;

    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
        {
          headers: { 'Authorization': PEXELS_API_KEY }
        }
      );

      if (!response.ok) return null;
      const data = await response.json();
      
      return data.photos?.[0]?.src?.large || null;
    } catch (error) {
      console.error('Pexels error:', error);
      return null;
    }
  }

  // Try Google Custom Search last
  async getGoogleImage(query: string): Promise<string | null> {
    if (!GOOGLE_CUSTOM_SEARCH_KEY || !GOOGLE_SEARCH_ENGINE_ID) return null;

    try {
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_CUSTOM_SEARCH_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&searchType=image&num=1&imgSize=large`
      );

      if (!response.ok) return null;
      const data = await response.json();
      
      return data.items?.[0]?.link || null;
    } catch (error) {
      console.error('Google Search error:', error);
      return null;
    }
  }

  // Get best available image (waterfall approach)
  async getEventImage(query: string): Promise<string> {
    // Try all sources in order
    const unsplashImage = await this.getUnsplashImage(query);
    if (unsplashImage) return unsplashImage;

    const pexelsImage = await this.getPexelsImage(query);
    if (pexelsImage) return pexelsImage;

    const googleImage = await this.getGoogleImage(query);
    if (googleImage) return googleImage;

    // Fallback to gradient
    return this.getPlaceholderGradient(query);
  }

  // Generate beautiful gradient placeholder
  private getPlaceholderGradient(eventName: string): string {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)'
    ];
    
    const index = eventName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
    return gradients[index];
  }
}

// ============================================
// EVENT SERVICE
// ============================================

export class EventService {
  private imageService = new ImageService();

  // Search Ticketmaster events
  async searchTicketmasterEvents(query: string, page: number = 0): Promise<any[]> {
    if (!TICKETMASTER_API_KEY) {
      console.warn('⚠️ Ticketmaster API key not configured');
      return [];
    }

    try {
      const params = new URLSearchParams({
        apikey: TICKETMASTER_API_KEY,
        keyword: query,
        size: '50',
        page: page.toString(),
        sort: 'date,asc',
        countryCode: 'US,CA,GB,DE,FR,ES,IT,AU,MX,BR' // Major markets
      });

      const response = await fetch(
        `https://app.ticketmaster.com/discovery/v2/events.json?${params}`
      );

      if (!response.ok) {
        console.error('Ticketmaster API error:', response.status);
        return [];
      }

      const data = await response.json();
      const events = data._embedded?.events || [];
      
      console.log(`✅ Ticketmaster found ${events.length} events for "${query}"`);
      
      return this.mapTicketmasterEvents(events);
    } catch (error) {
      console.error('❌ Ticketmaster search error:', error);
      return [];
    }
  }

  // Search SeatGeek events (when approved)
  async searchSeatGeekEvents(query: string, page: number = 1): Promise<any[]> {
    if (!SEATGEEK_CLIENT_ID) {
      console.log('⏳ SeatGeek API pending approval');
      return [];
    }

    try {
      const params = new URLSearchParams({
        client_id: SEATGEEK_CLIENT_ID,
        q: query,
        per_page: '50',
        page: page.toString(),
        sort: 'datetime_local.asc'
      });

      const response = await fetch(
        `https://api.seatgeek.com/2/events?${params}`
      );

      if (!response.ok) {
        console.error('SeatGeek API error:', response.status);
        return [];
      }

      const data = await response.json();
      console.log(`✅ SeatGeek found ${data.events?.length || 0} events for "${query}"`);
      
      return this.mapSeatGeekEvents(data.events || []);
    } catch (error) {
      console.error('❌ SeatGeek search error:', error);
      return [];
    }
  }

  // Map Ticketmaster events to our format
  private async mapTicketmasterEvents(events: any[]): Promise<any[]> {
    return Promise.all(events.map(async (event) => {
      const venue = event._embedded?.venues?.[0];
      const priceRange = event.priceRanges?.[0];
      
      // Get high-quality image
      let imageUrl = event.images?.find((img: any) => img.width > 1000)?.url || 
                     event.images?.[0]?.url || '';
      
      // If no good image from API, try to fetch one
      if (!imageUrl || imageUrl.includes('placeholder')) {
        imageUrl = await this.imageService.getEventImage(event.name);
      }

      return {
        id: `tm-${event.id}`,
        name: event.name,
        type: this.categorizeEvent(event.classifications?.[0]?.segment?.name || 'Other'),
        sport: this.mapSportType(event.classifications?.[0]?.segment?.name),
        startDate: event.dates?.start?.localDate || '',
        endDate: event.dates?.end?.localDate || event.dates?.start?.localDate || '',
        venue: {
          name: venue?.name || 'TBD',
          city: venue?.city?.name || 'TBD',
          country: venue?.country?.name || 'TBD',
          address: venue?.address?.line1 || '',
          capacity: venue?.capacity || 0,
          coordinates: {
            lat: parseFloat(venue?.location?.latitude || '0'),
            lng: parseFloat(venue?.location?.longitude || '0')
          }
        },
        image: imageUrl,
        thumbnail: imageUrl,
        heroImage: imageUrl,
        priceRange: priceRange ? {
          min: priceRange.min || 0,
          max: priceRange.max || 0,
          currency: priceRange.currency || 'USD'
        } : { min: 0, max: 0, currency: 'USD' },
        url: event.url || '',
        description: event.info || `Experience ${event.name} live!`,
        source: 'ticketmaster',
        tags: [
          event.classifications?.[0]?.segment?.name?.toLowerCase(),
          event.classifications?.[0]?.genre?.name?.toLowerCase(),
          venue?.city?.name?.toLowerCase()
        ].filter(Boolean)
      };
    }));
  }

  // Map SeatGeek events to our format
  private mapSeatGeekEvents(events: any[]): any[] {
    return events.map(event => ({
      id: `sg-${event.id}`,
      name: event.title || event.short_title,
      type: this.categorizeEvent(event.type),
      sport: this.mapSportType(event.type),
      startDate: event.datetime_local?.split('T')[0] || '',
      endDate: event.datetime_local?.split('T')[0] || '',
      venue: {
        name: event.venue?.name || 'TBD',
        city: event.venue?.city || 'TBD',
        country: event.venue?.country || 'TBD',
        address: event.venue?.address || '',
        capacity: event.venue?.capacity || 0,
        coordinates: {
          lat: event.venue?.location?.lat || 0,
          lng: event.venue?.location?.lon || 0
        }
      },
      image: event.performers?.[0]?.image || '',
      thumbnail: event.performers?.[0]?.image || '',
      heroImage: event.performers?.[0]?.image || '',
      priceRange: {
        min: event.stats?.lowest_price || 0,
        max: event.stats?.highest_price || 0,
        currency: 'USD'
      },
      url: event.url || '',
      description: `${event.title} at ${event.venue?.name}`,
      source: 'seatgeek',
      tags: [event.type?.toLowerCase(), event.venue?.city?.toLowerCase()].filter(Boolean)
    }));
  }

  // Categorize event type
  private categorizeEvent(classification: string): 'sports' | 'music' | 'festival' | 'cultural' | 'exhibition' {
    const lower = classification?.toLowerCase() || '';
    if (lower.includes('sport')) return 'sports';
    if (lower.includes('music') || lower.includes('concert')) return 'music';
    if (lower.includes('festival')) return 'festival';
    if (lower.includes('art') || lower.includes('theater') || lower.includes('family')) return 'cultural';
    return 'cultural';
  }

  // Map to sport type
  private mapSportType(classification: string): Event['sport'] {
    const lower = classification?.toLowerCase() || '';
    if (lower.includes('soccer') || (lower.includes('football') && !lower.includes('american'))) return 'football';
    if (lower.includes('american football') || lower.includes('nfl')) return 'american-football';
    if (lower.includes('basketball') || lower.includes('nba')) return 'basketball';
    if (lower.includes('baseball') || lower.includes('mlb')) return 'baseball';
    if (lower.includes('tennis')) return 'tennis';
    if (lower.includes('racing') || lower.includes('f1') || lower.includes('formula') || lower.includes('nascar')) return 'racing';
    if (lower.includes('hockey') || lower.includes('nhl')) return 'hockey';
    if (lower.includes('golf') || lower.includes('pga')) return 'golf';
    if (lower.includes('boxing') || lower.includes('mma') || lower.includes('ufc') || lower.includes('fight')) return 'boxing-mma';
    if (lower.includes('rugby')) return 'rugby';
    if (lower.includes('cricket')) return 'cricket';
    return undefined;
  }

  // Universal search across all available sources
  async universalSearch(query: string): Promise<any[]> {
    console.log(`🔍 Searching for: "${query}"`);
    
    try {
      // Search all available APIs in parallel
      const [ticketmasterResults, seatgeekResults] = await Promise.all([
        this.searchTicketmasterEvents(query),
        this.searchSeatGeekEvents(query)
      ]);

      // Combine results
      const allResults = [...ticketmasterResults, ...seatgeekResults];
      
      console.log(`📊 Total results: ${allResults.length}`);

      // Remove duplicates based on name similarity
      const uniqueResults = this.deduplicateEvents(allResults);
      
      // Sort by date
      return uniqueResults.sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    } catch (error) {
      console.error('❌ Universal search error:', error);
      return [];
    }
  }

  // Remove duplicate events
  private deduplicateEvents(events: any[]): any[] {
    const seen = new Map();
    
    return events.filter(event => {
      // Create a simple key from name + date + venue
      const key = `${event.name.toLowerCase()}-${event.startDate}-${event.venue.city}`.replace(/\s+/g, '');
      
      if (seen.has(key)) {
        return false;
      }
      
      seen.set(key, true);
      return true;
    });
  }

  // Get events by sport
  async getEventsBySport(sport: string, limit: number = 50): Promise<any[]> {
    const sportQueries: Record<string, string> = {
      'football': 'soccer',
      'american-football': 'NFL',
      'basketball': 'NBA',
      'baseball': 'MLB',
      'tennis': 'tennis',
      'racing': 'Formula 1',
      'hockey': 'NHL',
      'golf': 'PGA',
      'boxing-mma': 'UFC',
      'rugby': 'rugby',
      'cricket': 'cricket'
    };

    const query = sportQueries[sport] || sport;
    const results = await this.universalSearch(query);
    return results.slice(0, limit);
  }

  // Get events by city
  async getEventsByCity(city: string, limit: number = 50): Promise<any[]> {
    const results = await this.universalSearch(city);
    return results.slice(0, limit);
  }

  // Get upcoming events (generic)
  async getUpcomingEvents(limit: number = 20): Promise<any[]> {
    // Search for popular upcoming events
    const queries = ['sports', 'concert', 'festival'];
    const results = await Promise.all(
      queries.map(q => this.universalSearch(q))
    );
    
    const allEvents = results.flat();
    const uniqueEvents = this.deduplicateEvents(allEvents);
    
    return uniqueEvents
      .filter(e => new Date(e.startDate) > new Date())
      .slice(0, limit);
  }
}

// Export singleton instance
export const eventService = new EventService();

// ============================================
// CACHING LAYER
// ============================================

interface CacheEntry {
  data: any;
  timestamp: number;
}

class EventCache {
  private cache: Map<string, CacheEntry> = new Map();
  private TTL = 1800000; // 30 minutes in milliseconds

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const eventCache = new EventCache();

// ============================================
// HELPER: Search with caching
// ============================================

export async function searchEventsWithCache(query: string): Promise<any[]> {
  const cacheKey = `search:${query.toLowerCase()}`;
  
  // Check cache first
  const cached = eventCache.get(cacheKey);
  if (cached) {
    console.log('📦 Returning cached results');
    return cached;
  }
  
  // Fetch fresh data
  const results = await eventService.universalSearch(query);
  
  // Cache results
  eventCache.set(cacheKey, results);
  
  return results;
}