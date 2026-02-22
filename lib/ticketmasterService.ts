// lib/ticketmasterService.ts
// 🎯 Ticketmaster API Integration - Event Discovery Fallback

import { Event } from '@/lib/eventService';

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
// Supports both server-side (TICKETMASTER_API_KEY) and
// client-side (NEXT_PUBLIC_TICKETMASTER_API_KEY) env vars

function getApiKey(): string | undefined {
  return process.env.TICKETMASTER_API_KEY || 
         process.env.NEXT_PUBLIC_TICKETMASTER_API_KEY;
}

function ensureApiKey(): string {
  const key = getApiKey();
  if (!key) {
    throw new Error('Ticketmaster API key not configured. Set TICKETMASTER_API_KEY in environment variables.');
  }
  return key;
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
  
  const largestImage = tmEvent.images
    ?.sort((a, b) => b.width - a.width)[0]?.url;

  const segmentName = tmEvent.classifications?.[0]?.segment?.name?.toLowerCase() || '';
  let eventType: "sports" | "music" | "festival" = "music";
  
  if (segmentName.includes('sports')) {
    eventType = 'sports';
  } else if (segmentName.includes('music') || segmentName.includes('concert')) {
    eventType = 'music';
  } else if (segmentName.includes('festival') || segmentName.includes('fair')) {
    eventType = 'festival';
  }

  const priceRange = tmEvent.priceRanges?.[0];
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
    affiliateOnly: true,
    trademark: undefined,
    source: 'Ticketmaster'
  };
}

// ==================== VALIDATION & FILTERING ====================

function isValidEvent(event: Event): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!event.location.city || event.location.city === 'Unknown') return false;
  if (!event.location.country || event.location.country === 'Unknown') return false;
  if (!event.startDate) return false;
  
  try {
    const eventDate = new Date(event.startDate);
    if (eventDate < today) return false;
  } catch (error) {
    console.warn('Invalid date for event:', event.id);
    return false;
  }
  
  return true;
}

// ==================== CATEGORY SEARCH ====================

export async function searchTicketmasterEventsByCategory(
  category: 'sports' | 'music' | 'festival',
  city?: string,
  limit: number = 10
): Promise<Event[]> {
  const apiKey = ensureApiKey();
  
  const classificationMap = {
    sports: 'KZFzniwnSyZfZ7v7nE',
    music: 'KZFzniwnSyZfZ7v7nJ',
    festival: 'KZFzniwnSyZfZ7v7na'
  };
  
  const params = new URLSearchParams({
    apikey: apiKey,
    classificationId: classificationMap[category],
    size: limit.toString(),
    sort: 'date,asc'
  });
  
  if (city) params.append('city', city);
  
  try {
    const response = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`
    );
    
    if (!response.ok) throw new Error(`Ticketmaster API error: ${response.status}`);
    
    const data: TicketmasterSearchResponse = await response.json();
    
    if (!data._embedded?.events) return [];
    
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