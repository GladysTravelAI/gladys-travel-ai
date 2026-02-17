// lib/ticketmasterService.ts
// 🎯 Ticketmaster API Integration - Event Discovery Fallback
//
// STRATEGIC ARCHITECTURE:
// - Provides fallback event discovery when internal events don't match
// - Normalizes Ticketmaster data to internal Event structure
// - Maintains type safety throughout
// - Production-ready error handling

import { Event } from '@/lib/eventService';

// ==================== TICKETMASTER TYPES ====================

interface TicketmasterVenue {
  name: string;
  city?: { name: string };
  country?: { name: string; countryCode: string };
  location?: {
    latitude: string;
    longitude: string;
  };
}

interface TicketmasterPriceRange {
  type: string;
  currency: string;
  min: number;
  max: number;
}

interface TicketmasterEvent {
  id: string;
  name: string;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
    };
    end?: {
      localDate: string;
    };
  };
  _embedded?: {
    venues?: TicketmasterVenue[];
  };
  images?: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  classifications?: Array<{
    segment?: { name: string };
    genre?: { name: string };
  }>;
  priceRanges?: TicketmasterPriceRange[];
  url?: string;
  info?: string;
}

interface TicketmasterSearchResponse {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

// ==================== API KEY CHECK ====================

const API_KEY = process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY;

function ensureApiKey(): string {
  if (!API_KEY) {
    throw new Error('Ticketmaster API key not configured. Set NEXT_PUBLIC_TICKETMASTER_API_KEY in environment variables.');
  }
  return API_KEY;
}

// ==================== MAIN SEARCH FUNCTION ====================

export async function searchTicketmasterEvents(
  keyword: string,
  city?: string
): Promise<Event[]> {
  const apiKey = ensureApiKey();
  
  const params = new URLSearchParams({
    apikey: apiKey,
    keyword,
    size: '10',
    sort: 'date,asc'
  });

  if (city) {
    params.append('city', city);
  }

  try {
    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Ticketmaster API error: ${response.status} - ${errorText}`);
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }

    const data: TicketmasterSearchResponse = await response.json();

    if (!data._embedded?.events || data._embedded.events.length === 0) {
      console.log('No Ticketmaster events found for query:', keyword);
      return [];
    }

    // Normalize and filter events
    const normalizedEvents = data._embedded.events
      .map(normalizeTicketmasterEvent)
      .filter(isValidEvent);

    console.log(`✅ Found ${normalizedEvents.length} valid Ticketmaster events`);
    return normalizedEvents;

  } catch (error) {
    console.error('Ticketmaster search error:', error);
    throw error;
  }
}

// ==================== NORMALIZER ====================

function normalizeTicketmasterEvent(tmEvent: TicketmasterEvent): Event {
  const venue = tmEvent._embedded?.venues?.[0];
  
  // Get largest image
  const largestImage = tmEvent.images
    ?.sort((a, b) => b.width - a.width)[0]?.url;

  // Map Ticketmaster segment to our event type
  const segmentName = tmEvent.classifications?.[0]?.segment?.name?.toLowerCase() || '';
  let eventType: "sports" | "music" | "festival" = "music"; // Default
  
  if (segmentName.includes('sports')) {
    eventType = 'sports';
  } else if (segmentName.includes('music') || segmentName.includes('concert')) {
    eventType = 'music';
  } else if (segmentName.includes('festival') || segmentName.includes('fair')) {
    eventType = 'festival';
  }

  // Get price range if available
  const priceRange = tmEvent.priceRanges?.[0];

  // Build description
  const venueName = venue?.name || 'venue';
  const cityName = venue?.city?.name || 'this city';
  const description = tmEvent.info || `${tmEvent.name} at ${venueName} in ${cityName}`;

  return {
    id: `tm-${tmEvent.id}`,
    name: tmEvent.name,
    type: eventType,
    location: {
      city: venue?.city?.name || 'Unknown',
      country: venue?.country?.name || 'Unknown',
      venue: venue?.name
    },
    startDate: tmEvent.dates.start.localDate,
    endDate: tmEvent.dates.end?.localDate || tmEvent.dates.start.localDate,
    description,
    heroImage: largestImage,
    priceRange: priceRange ? {
      min: priceRange.min,
      max: priceRange.max,
      currency: priceRange.currency
    } : undefined,
    officialUrl: tmEvent.url,
    affiliateOnly: true, // Ticketmaster events are affiliate-only
    trademark: undefined, // Ticketmaster events don't have our trademark metadata
    source: 'Ticketmaster'
  };
}

// ==================== VALIDATION & FILTERING ====================

function isValidEvent(event: Event): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Filter out events without essential data
  if (!event.location.city || event.location.city === 'Unknown') {
    return false;
  }
  
  if (!event.location.country || event.location.country === 'Unknown') {
    return false;
  }
  
  if (!event.startDate) {
    return false;
  }
  
  // Filter out past events
  try {
    const eventDate = new Date(event.startDate);
    if (eventDate < today) {
      return false;
    }
  } catch (error) {
    console.warn('Invalid date for event:', event.id);
    return false;
  }
  
  return true;
}

// ==================== ADDITIONAL SEARCH OPTIONS ====================

export async function searchTicketmasterEventsByCategory(
  category: 'sports' | 'music' | 'festival',
  city?: string,
  limit: number = 10
): Promise<Event[]> {
  const apiKey = ensureApiKey();
  
  // Map our categories to Ticketmaster classification IDs
  const classificationMap = {
    sports: 'KZFzniwnSyZfZ7v7nE', // Sports
    music: 'KZFzniwnSyZfZ7v7nJ', // Music
    festival: 'KZFzniwnSyZfZ7v7na'  // Festivals
  };
  
  const params = new URLSearchParams({
    apikey: apiKey,
    classificationId: classificationMap[category],
    size: limit.toString(),
    sort: 'date,asc'
  });
  
  if (city) {
    params.append('city', city);
  }
  
  try {
    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`
    );
    
    if (!response.ok) {
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }
    
    const data: TicketmasterSearchResponse = await response.json();
    
    if (!data._embedded?.events) {
      return [];
    }
    
    return data._embedded.events
      .map(normalizeTicketmasterEvent)
      .filter(isValidEvent);
      
  } catch (error) {
    console.error('Ticketmaster category search error:', error);
    return [];
  }
}

// ==================== EVENT BY ID ====================

export async function getTicketmasterEventById(ticketmasterId: string): Promise<Event | null> {
  const apiKey = ensureApiKey();
  
  // Remove 'tm-' prefix if present
  const cleanId = ticketmasterId.startsWith('tm-') 
    ? ticketmasterId.substring(3) 
    : ticketmasterId;
  
  try {
    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events/${cleanId}.json?apikey=${apiKey}`
    );
    
    if (!response.ok) {
      console.error(`Ticketmaster event not found: ${cleanId}`);
      return null;
    }
    
    const tmEvent: TicketmasterEvent = await response.json();
    const event = normalizeTicketmasterEvent(tmEvent);
    
    return isValidEvent(event) ? event : null;
    
  } catch (error) {
    console.error('Ticketmaster event fetch error:', error);
    return null;
  }
}