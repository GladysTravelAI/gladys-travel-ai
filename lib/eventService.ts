// lib/eventService.ts - Premium Event Discovery Service with Multiple APIs
// ✨ Opulent design system integration

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
// PREMIUM IMAGE SERVICE
// ============================================

class PremiumImageService {
  // Try Unsplash first (premium quality)
  async getUnsplashImage(query: string): Promise<string | null> {
    if (!UNSPLASH_ACCESS_KEY) return null;

    try {
      console.log(`🎨 Fetching premium image from Unsplash: "${query}"`);
      
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&order_by=relevant`,
        {
          headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` }
        }
      );

      if (!response.ok) return null;
      const data = await response.json();
      
      const imageUrl = data.results?.[0]?.urls?.regular || null;
      if (imageUrl) console.log('✅ Premium Unsplash image found');
      
      return imageUrl;
    } catch (error) {
      console.error('❌ Unsplash error:', error);
      return null;
    }
  }

  // Try Pexels second (high quality)
  async getPexelsImage(query: string): Promise<string | null> {
    if (!PEXELS_API_KEY) return null;

    try {
      console.log(`🎨 Fetching image from Pexels: "${query}"`);
      
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
        {
          headers: { 'Authorization': PEXELS_API_KEY }
        }
      );

      if (!response.ok) return null;
      const data = await response.json();
      
      const imageUrl = data.photos?.[0]?.src?.large || null;
      if (imageUrl) console.log('✅ Pexels image found');
      
      return imageUrl;
    } catch (error) {
      console.error('❌ Pexels error:', error);
      return null;
    }
  }

  // Try Google Custom Search last
  async getGoogleImage(query: string): Promise<string | null> {
    if (!GOOGLE_CUSTOM_SEARCH_KEY || !GOOGLE_SEARCH_ENGINE_ID) return null;

    try {
      console.log(`🔍 Fetching image from Google: "${query}"`);
      
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_CUSTOM_SEARCH_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&searchType=image&num=1&imgSize=large`
      );

      if (!response.ok) return null;
      const data = await response.json();
      
      const imageUrl = data.items?.[0]?.link || null;
      if (imageUrl) console.log('✅ Google image found');
      
      return imageUrl;
    } catch (error) {
      console.error('❌ Google Search error:', error);
      return null;
    }
  }

  // Get best available image (waterfall approach)
  async getEventImage(query: string): Promise<string> {
    console.log(`🎯 Searching for premium image: "${query}"`);
    
    // Try all sources in order
    const unsplashImage = await this.getUnsplashImage(query);
    if (unsplashImage) return unsplashImage;

    const pexelsImage = await this.getPexelsImage(query);
    if (pexelsImage) return pexelsImage;

    const googleImage = await this.getGoogleImage(query);
    if (googleImage) return googleImage;

    // Fallback to opulent gradient
    console.log('💎 Using opulent gradient placeholder');
    return this.getOpulentGradient(query);
  }

  // Generate beautiful opulent gradient placeholder
  private getOpulentGradient(eventName: string): string {
    const opulentGradients = [
      'linear-gradient(135deg, #f59e0b 0%, #f43f5e 50%, #9333ea 100%)', // Amber → Rose → Purple
      'linear-gradient(135deg, #fbbf24 0%, #ec4899 50%, #8b5cf6 100%)', // Gold → Pink → Purple
      'linear-gradient(135deg, #f97316 0%, #e11d48 50%, #7c3aed 100%)', // Orange → Rose → Violet
      'linear-gradient(135deg, #eab308 0%, #db2777 50%, #6366f1 100%)', // Yellow → Pink → Indigo
      'linear-gradient(135deg, #fb923c 0%, #f472b6 50%, #a855f7 100%)', // Light Orange → Pink → Purple
      'linear-gradient(135deg, #fcd34d 0%, #fb7185 50%, #c084fc 100%)', // Light Gold → Rose → Light Purple
      'linear-gradient(135deg, #d97706 0%, #be123c 50%, #7e22ce 100%)', // Dark Amber → Dark Rose → Dark Purple
      'linear-gradient(135deg, #ea580c 0%, #9f1239 50%, #6b21a8 100%)', // Burnt Orange → Crimson → Deep Purple
      'linear-gradient(135deg, #fdba74 0%, #fda4af 50%, #d8b4fe 100%)', // Peach → Light Rose → Lavender
      'linear-gradient(135deg, #fef3c7 0%, #fecdd3 50%, #e9d5ff 100%)'  // Cream → Blush → Lilac
    ];
    
    const index = eventName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % opulentGradients.length;
    return opulentGradients[index];
  }
}

// ============================================
// PREMIUM EVENT SERVICE
// ============================================

export class PremiumEventService {
  private imageService = new PremiumImageService();

  // Search Ticketmaster events with enhanced mapping
  async searchTicketmasterEvents(query: string, page: number = 0): Promise<any[]> {
    if (!TICKETMASTER_API_KEY) {
      console.warn('⚠️ Ticketmaster API key not configured');
      return [];
    }

    try {
      console.log(`🎫 Searching Ticketmaster for: "${query}"`);
      
      const params = new URLSearchParams({
        apikey: TICKETMASTER_API_KEY,
        keyword: query,
        size: '50',
        page: page.toString(),
        sort: 'date,asc',
        countryCode: 'US,CA,GB,DE,FR,ES,IT,AU,NZ,JP,BR,MX,AR,ZA,AE,SG,HK' // Global coverage
      });

      const response = await fetch(
        `https://app.ticketmaster.com/discovery/v2/events.json?${params}`,
        { 
          next: { revalidate: 1800 } // Cache for 30 minutes
        }
      );

      if (!response.ok) {
        console.error('❌ Ticketmaster API error:', response.status);
        return [];
      }

      const data = await response.json();
      const events = data._embedded?.events || [];
      
      console.log(`✅ Ticketmaster found ${events.length} events`);
      
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
      console.log(`🎟️ Searching SeatGeek for: "${query}"`);
      
      const params = new URLSearchParams({
        client_id: SEATGEEK_CLIENT_ID,
        q: query,
        per_page: '50',
        page: page.toString(),
        sort: 'datetime_local.asc'
      });

      const response = await fetch(
        `https://api.seatgeek.com/2/events?${params}`,
        { 
          next: { revalidate: 1800 }
        }
      );

      if (!response.ok) {
        console.error('❌ SeatGeek API error:', response.status);
        return [];
      }

      const data = await response.json();
      console.log(`✅ SeatGeek found ${data.events?.length || 0} events`);
      
      return this.mapSeatGeekEvents(data.events || []);
    } catch (error) {
      console.error('❌ SeatGeek search error:', error);
      return [];
    }
  }

  // Map Ticketmaster events to opulent format
  private async mapTicketmasterEvents(events: any[]): Promise<any[]> {
    return Promise.all(events.map(async (event) => {
      const venue = event._embedded?.venues?.[0];
      const priceRange = event.priceRanges?.[0];
      const classification = event.classifications?.[0];
      
      // Get premium image
      let imageUrl = event.images?.find((img: any) => img.width > 1000)?.url || 
                     event.images?.[0]?.url || '';
      
      // If no good image from API, fetch premium one
      if (!imageUrl || imageUrl.includes('placeholder') || imageUrl.includes('default')) {
        imageUrl = await this.imageService.getEventImage(`${event.name} ${venue?.city?.name || ''}`);
      }

      return {
        id: `tm-${event.id}`,
        name: event.name,
        genericName: this.generateGenericName(event.name, classification),
        type: this.categorizeEvent(classification?.segment?.name || 'Other'),
        sport: this.mapSportType(classification?.segment?.name, classification?.genre?.name),
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
        images: [imageUrl],
        priceRange: priceRange ? {
          min: priceRange.min || 0,
          max: priceRange.max || 0,
          currency: priceRange.currency || 'USD'
        } : { min: 0, max: 0, currency: 'USD' },
        url: event.url || '',
        description: event.info || event.pleaseNote || `Experience ${event.name} live! An unforgettable event you won't want to miss.`,
        highlights: this.generateHighlights(event, venue),
        source: 'ticketmaster',
        featured: false,
        priority: 10,
        tags: [
          classification?.segment?.name?.toLowerCase(),
          classification?.genre?.name?.toLowerCase(),
          classification?.subGenre?.name?.toLowerCase(),
          venue?.city?.name?.toLowerCase(),
          venue?.country?.name?.toLowerCase()
        ].filter(Boolean),
        disclaimer: 'This is an independent travel planning service. We are not affiliated with the event organizers or venues. All trademarks belong to their respective owners.'
      };
    }));
  }

  // Map SeatGeek events to opulent format
  private async mapSeatGeekEvents(events: any[]): Promise<any[]> {
    return Promise.all(events.map(async (event) => {
      // Get premium image
      let imageUrl = event.performers?.[0]?.image || '';
      
      if (!imageUrl) {
        imageUrl = await this.imageService.getEventImage(`${event.title} ${event.venue?.city || ''}`);
      }

      return {
        id: `sg-${event.id}`,
        name: event.title || event.short_title,
        genericName: this.generateGenericName(event.title, { type: event.type }),
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
        image: imageUrl,
        thumbnail: imageUrl,
        heroImage: imageUrl,
        images: [imageUrl],
        priceRange: {
          min: event.stats?.lowest_price || 0,
          max: event.stats?.highest_price || 0,
          currency: 'USD'
        },
        url: event.url || '',
        description: `${event.title} at ${event.venue?.name}. Experience this incredible live event!`,
        highlights: [
          `Live at ${event.venue?.name}`,
          `${event.venue?.city}, ${event.venue?.country}`,
          event.stats?.average_price ? `Average price: $${event.stats.average_price}` : null,
          event.venue?.capacity ? `Capacity: ${event.venue.capacity.toLocaleString()}` : null
        ].filter(Boolean),
        source: 'seatgeek',
        featured: false,
        priority: 10,
        tags: [event.type?.toLowerCase(), event.venue?.city?.toLowerCase()].filter(Boolean),
        disclaimer: 'Independent travel service. Not affiliated with event organizers or venues.'
      };
    }));
  }

  // Generate trademark-safe generic name
  private generateGenericName(originalName: string, classification: any): string {
    const type = classification?.segment?.name?.toLowerCase() || classification?.type?.toLowerCase() || '';
    const genre = classification?.genre?.name?.toLowerCase() || '';
    
    // If it's a generic event, keep the name
    if (!originalName.match(/\b(championship|cup|bowl|series|open|classic|prix|tour)\b/i)) {
      return originalName;
    }
    
    // Generate safe generic names for branded events
    if (type.includes('sport')) {
      if (genre.includes('football') || genre.includes('soccer')) return 'International Football Championship';
      if (genre.includes('basketball')) return 'Professional Basketball Game';
      if (genre.includes('baseball')) return 'Major League Baseball Game';
      if (genre.includes('american')) return 'American Football Championship';
      if (genre.includes('tennis')) return 'Tennis Championship';
      if (genre.includes('racing') || genre.includes('formula')) return 'International Racing Championship';
      return 'Professional Sports Event';
    }
    
    if (type.includes('music') || type.includes('concert')) {
      return 'Live Music Concert';
    }
    
    if (type.includes('festival')) {
      return 'Music & Arts Festival';
    }
    
    return originalName;
  }

  // Generate premium highlights
  private generateHighlights(event: any, venue: any): string[] {
    const highlights: string[] = [];
    
    if (venue?.name) highlights.push(`✨ Live at ${venue.name}`);
    if (venue?.city?.name) highlights.push(`📍 ${venue.city.name}, ${venue.country?.name || ''}`);
    if (event.dates?.start?.localTime) highlights.push(`🕐 ${event.dates.start.localTime}`);
    if (venue?.capacity) highlights.push(`👥 Capacity: ${venue.capacity.toLocaleString()}`);
    if (event.priceRanges?.[0]) highlights.push(`💎 From $${event.priceRanges[0].min}`);
    
    return highlights.slice(0, 5); // Max 5 highlights
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
  private mapSportType(segment: string, genre?: string): Event['sport'] {
    const combined = `${segment?.toLowerCase() || ''} ${genre?.toLowerCase() || ''}`;
    
    if (combined.includes('soccer') || (combined.includes('football') && !combined.includes('american'))) return 'football';
    if (combined.includes('american football') || combined.includes('nfl')) return 'american-football';
    if (combined.includes('basketball') || combined.includes('nba')) return 'basketball';
    if (combined.includes('baseball') || combined.includes('mlb')) return 'baseball';
    if (combined.includes('tennis')) return 'tennis';
    if (combined.includes('racing') || combined.includes('f1') || combined.includes('formula') || combined.includes('nascar')) return 'racing';
    if (combined.includes('hockey') || combined.includes('nhl')) return 'hockey';
    if (combined.includes('golf') || combined.includes('pga')) return 'golf';
    if (combined.includes('boxing') || combined.includes('mma') || combined.includes('ufc') || combined.includes('fight')) return 'boxing-mma';
    if (combined.includes('rugby')) return 'rugby';
    if (combined.includes('cricket')) return 'cricket';
    return undefined;
  }

  // Universal search across all available sources
  async universalSearch(query: string): Promise<any[]> {
    console.log(`🔍 Premium universal search for: "${query}"`);
    
    try {
      // Search all available APIs in parallel
      const [ticketmasterResults, seatgeekResults] = await Promise.all([
        this.searchTicketmasterEvents(query),
        this.searchSeatGeekEvents(query)
      ]);

      // Combine results
      const allResults = [...ticketmasterResults, ...seatgeekResults];
      
      console.log(`📊 Total results found: ${allResults.length}`);

      // Remove duplicates based on name similarity
      const uniqueResults = this.deduplicateEvents(allResults);
      
      console.log(`✨ Unique events after deduplication: ${uniqueResults.length}`);
      
      // Sort by date (upcoming first)
      return uniqueResults.sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    } catch (error) {
      console.error('❌ Universal search error:', error);
      return [];
    }
  }

  // Remove duplicate events (smart deduplication)
  private deduplicateEvents(events: any[]): any[] {
    const seen = new Map();
    
    return events.filter(event => {
      // Create a normalized key from name + date + venue
      const normalizedName = event.name.toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20); // First 20 chars
        
      const key = `${normalizedName}-${event.startDate}-${event.venue.city.toLowerCase()}`;
      
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
      'football': 'soccer premier league',
      'american-football': 'NFL football',
      'basketball': 'NBA basketball',
      'baseball': 'MLB baseball',
      'tennis': 'tennis ATP WTA',
      'racing': 'Formula 1 F1 racing',
      'hockey': 'NHL hockey',
      'golf': 'PGA golf',
      'boxing-mma': 'UFC boxing MMA',
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
    const queries = ['sports', 'concerts', 'festivals'];
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
export const eventService = new PremiumEventService();

// ============================================
// PREMIUM CACHING LAYER
// ============================================

interface CacheEntry {
  data: any;
  timestamp: number;
}

class PremiumEventCache {
  private cache: Map<string, CacheEntry> = new Map();
  private TTL = 1800000; // 30 minutes in milliseconds

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    console.log(`💾 Cached results for: "${key}"`);
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      console.log(`⏰ Cache expired for: "${key}"`);
      return null;
    }

    console.log(`✅ Cache hit for: "${key}"`);
    return entry.data;
  }

  clear(): void {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const eventCache = new PremiumEventCache();

// ============================================
// HELPER: Search with premium caching
// ============================================

export async function searchEventsWithCache(query: string): Promise<any[]> {
  const cacheKey = `search:${query.toLowerCase()}`;
  
  // Check cache first
  const cached = eventCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Fetch fresh premium data
  console.log(`🔄 Fetching fresh data for: "${query}"`);
  const results = await eventService.universalSearch(query);
  
  // Cache results
  eventCache.set(cacheKey, results);
  
  return results;
}

// ============================================
// HELPER: Get cache statistics
// ============================================

export function getCacheStats() {
  return eventCache.getStats();
}