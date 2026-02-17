// lib/eventLandmarkMaps.ts
// 🎯 Event Landmark Maps - Trademark-Safe Location Discovery
//
// STRATEGIC ARCHITECTURE:
// - Generates landmark and mapping data for events
// - Provides nearby attractions, venues, and points of interest
// - Uses factual, descriptive language for locations
// - Integrates with Google Maps/Mapbox for visualization
//
// LEGAL FRAMEWORK:
// - Location data is factual and publicly available
// - Venue names used for informational purposes only
// - No claims of affiliation with venues or landmarks

import { Event, isEventTrademarked } from './eventService';

// ==================== TYPE DEFINITIONS ====================

export interface EventLandmark {
  id: string;
  name: string;
  type: 'venue' | 'attraction' | 'hotel' | 'restaurant' | 'transport' | 'landmark';
  location: {
    lat: number;
    lng: number;
    address?: string;
    city: string;
    country: string;
  };
  description?: string;
  distance?: number; // Distance from event venue in km
  relevance: 'primary' | 'secondary' | 'tertiary';
  imageUrl?: string;
}

export interface EventMapData {
  eventId: string;
  eventName: string;
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
  landmarks: EventLandmark[];
  mapMetadata?: {
    isTrademarkedEvent: boolean;
    venueDisclaimer?: string;
  };
}

export interface EventDirections {
  from: string;
  to: string;
  mode: 'driving' | 'walking' | 'transit' | 'bicycling';
  distance?: string;
  duration?: string;
  mapsUrl: string;
}

// ==================== VENUE COORDINATES DATABASE ====================
// STRATEGIC: Pre-defined coordinates for major event venues
// This avoids repeated geocoding API calls

const VENUE_COORDINATES: Record<string, { lat: number; lng: number; address?: string }> = {
  // FIFA World Cup 2026 Venues
  'metlife-stadium': {
    lat: 40.8128,
    lng: -74.0742,
    address: 'MetLife Stadium, East Rutherford, NJ, USA'
  },
  'rose-bowl': {
    lat: 34.1614,
    lng: -118.1678,
    address: 'Rose Bowl Stadium, Pasadena, CA, USA'
  },
  'att-stadium': {
    lat: 32.7473,
    lng: -97.0945,
    address: 'AT&T Stadium, Arlington, TX, USA'
  },
  
  // Super Bowl
  'levis-stadium': {
    lat: 37.4032,
    lng: -121.9698,
    address: "Levi's Stadium, Santa Clara, CA, USA"
  },
  
  // Wimbledon
  'all-england-club': {
    lat: 51.4344,
    lng: -0.2149,
    address: 'All England Lawn Tennis and Croquet Club, London, UK'
  },
  
  // Coachella
  'empire-polo-club': {
    lat: 33.6803,
    lng: -116.2373,
    address: 'Empire Polo Club, Indio, CA, USA'
  },
  
  // Glastonbury
  'worthy-farm': {
    lat: 51.1530,
    lng: -2.5831,
    address: 'Worthy Farm, Pilton, Somerset, UK'
  },
  
  // Burning Man
  'black-rock-desert': {
    lat: 40.7864,
    lng: -119.2065,
    address: 'Black Rock Desert, Nevada, USA'
  },
  
  // Olympics 2028
  'la-memorial-coliseum': {
    lat: 34.0141,
    lng: -118.2879,
    address: 'Los Angeles Memorial Coliseum, Los Angeles, CA, USA'
  }
};

// ==================== VENUE MAPPING ====================
// STRATEGIC: Maps events to their primary venues

function getVenueCoordinatesForEvent(event: Event): { lat: number; lng: number; address?: string } | null {
  const venueKeyMap: Record<string, string> = {
    'fifa-world-cup-2026': 'metlife-stadium', // Final venue
    'super-bowl-lx-2026': 'levis-stadium',
    'wimbledon-2026': 'all-england-club',
    'coachella-2026': 'empire-polo-club',
    'glastonbury-2026': 'worthy-farm',
    'burning-man-2026': 'black-rock-desert',
    'summer-olympics-2028': 'la-memorial-coliseum'
  };
  
  const venueKey = venueKeyMap[event.id];
  if (venueKey && VENUE_COORDINATES[venueKey]) {
    return VENUE_COORDINATES[venueKey];
  }
  
  return null;
}

// ==================== LANDMARK GENERATION ====================
// STRATEGIC: Generate landmarks for event locations

/**
 * Get landmarks for an event
 * STRATEGIC: Returns nearby attractions, hotels, restaurants
 */
export async function getEventLandmarks(event: Event): Promise<EventLandmark[]> {
  const landmarks: EventLandmark[] = [];
  const venueCoords = getVenueCoordinatesForEvent(event);
  
  if (!venueCoords) {
    console.warn(`⚠️ No venue coordinates for event: ${event.id}`);
    return generateGenericLandmarks(event);
  }
  
  // Primary landmark: Event venue
  landmarks.push({
    id: `${event.id}-venue`,
    name: event.location.venue || 'Event Venue',
    type: 'venue',
    location: {
      lat: venueCoords.lat,
      lng: venueCoords.lng,
      address: venueCoords.address,
      city: event.location.city,
      country: event.location.country
    },
    description: `Primary venue for ${event.name}`,
    relevance: 'primary'
  });
  
  // Add event-specific landmarks
  const specificLandmarks = getEventSpecificLandmarks(event, venueCoords);
  landmarks.push(...specificLandmarks);
  
  return landmarks;
}

/**
 * Get event-specific landmarks
 * STRATEGIC: Curated landmarks for specific events
 */
function getEventSpecificLandmarks(
  event: Event,
  venueCoords: { lat: number; lng: number }
): EventLandmark[] {
  const landmarks: EventLandmark[] = [];
  
  // Event-specific landmark data
  const landmarkData: Record<string, EventLandmark[]> = {
    'fifa-world-cup-2026': [
      {
        id: 'times-square',
        name: 'Times Square',
        type: 'attraction',
        location: {
          lat: 40.7580,
          lng: -73.9855,
          city: 'New York',
          country: 'USA'
        },
        description: 'Iconic landmark in Midtown Manhattan',
        relevance: 'secondary'
      },
      {
        id: 'statue-of-liberty',
        name: 'Statue of Liberty',
        type: 'attraction',
        location: {
          lat: 40.6892,
          lng: -74.0445,
          city: 'New York',
          country: 'USA'
        },
        description: 'Historic monument and symbol of freedom',
        relevance: 'secondary'
      }
    ],
    'coachella-2026': [
      {
        id: 'palm-springs',
        name: 'Palm Springs',
        type: 'attraction',
        location: {
          lat: 33.8303,
          lng: -116.5453,
          city: 'Palm Springs',
          country: 'USA'
        },
        description: 'Nearby desert resort city',
        relevance: 'secondary'
      }
    ],
    'wimbledon-2026': [
      {
        id: 'wimbledon-village',
        name: 'Wimbledon Village',
        type: 'attraction',
        location: {
          lat: 51.4220,
          lng: -0.2069,
          city: 'London',
          country: 'UK'
        },
        description: 'Historic village center near the tennis grounds',
        relevance: 'secondary'
      }
    ]
  };
  
  return landmarkData[event.id] || [];
}

/**
 * Generate generic landmarks when specific data unavailable
 * STRATEGIC: Fallback landmark generation
 */
function generateGenericLandmarks(event: Event): EventLandmark[] {
  return [
    {
      id: `${event.id}-city-center`,
      name: `${event.location.city} City Center`,
      type: 'landmark',
      location: {
        lat: 0, // Would need geocoding
        lng: 0,
        city: event.location.city,
        country: event.location.country
      },
      description: `Central area of ${event.location.city}`,
      relevance: 'secondary'
    }
  ];
}

// ==================== MAP DATA GENERATION ====================

/**
 * Generate complete map data for an event
 * STRATEGIC: Returns everything needed to render an event map
 */
export async function getEventMapData(event: Event): Promise<EventMapData> {
  const landmarks = await getEventLandmarks(event);
  const venueCoords = getVenueCoordinatesForEvent(event);
  const isTrademarked = isEventTrademarked(event);
  
  // Default center (use venue if available, otherwise city center)
  const center = venueCoords || { lat: 0, lng: 0 };
  
  // Generate venue disclaimer for trademarked events
  let venueDisclaimer: string | undefined;
  if (isTrademarked && event.trademark?.disclaimer) {
    venueDisclaimer = event.trademark.disclaimer;
  }
  
  return {
    eventId: event.id,
    eventName: event.name,
    center,
    zoom: 12, // Default zoom level
    landmarks,
    mapMetadata: {
      isTrademarkedEvent: isTrademarked,
      venueDisclaimer
    }
  };
}

// ==================== DIRECTIONS GENERATION ====================

/**
 * Generate Google Maps directions URL
 * STRATEGIC: Creates deep link to Google Maps for navigation
 */
export function getEventDirectionsUrl(
  event: Event,
  origin?: string,
  mode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'driving'
): string {
  const venueCoords = getVenueCoordinatesForEvent(event);
  
  if (!venueCoords) {
    console.warn(`⚠️ No venue coordinates for event: ${event.id}`);
    return `https://www.google.com/maps/search/${encodeURIComponent(event.location.city)}`;
  }
  
  const destination = `${venueCoords.lat},${venueCoords.lng}`;
  const params = new URLSearchParams({
    api: '1',
    destination,
    travelmode: mode
  });
  
  if (origin) {
    params.append('origin', origin);
  }
  
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * Generate directions data
 * STRATEGIC: Structured directions data for UI display
 */
export function getEventDirections(
  event: Event,
  origin?: string,
  mode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'driving'
): EventDirections {
  const venueCoords = getVenueCoordinatesForEvent(event);
  const destination = event.location.venue || event.location.city;
  
  return {
    from: origin || 'Your location',
    to: destination,
    mode,
    mapsUrl: getEventDirectionsUrl(event, origin, mode)
  };
}

// ==================== NEARBY SEARCH ====================

/**
 * Get nearby hotels for an event
 * STRATEGIC: Returns hotels near event venue
 * 
 * NOTE: This is a mock implementation. In production, integrate with
 * Google Places API, Booking.com API, or similar
 */
export async function getNearbyHotels(
  event: Event,
  radius: number = 5 // km
): Promise<EventLandmark[]> {
  console.log(`🏨 Searching hotels near ${event.name} within ${radius}km`);
  
  // TODO: Integrate with Google Places API or similar
  // Example: const response = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius * 1000}&type=lodging`);
  
  // Mock implementation
  return [
    {
      id: `${event.id}-hotel-1`,
      name: `Hotel near ${event.location.city}`,
      type: 'hotel',
      location: {
        lat: 0,
        lng: 0,
        city: event.location.city,
        country: event.location.country
      },
      description: 'Accommodation near event venue',
      relevance: 'secondary'
    }
  ];
}

/**
 * Get nearby restaurants for an event
 * STRATEGIC: Returns restaurants near event venue
 */
export async function getNearbyRestaurants(
  event: Event,
  radius: number = 2 // km
): Promise<EventLandmark[]> {
  console.log(`🍽️ Searching restaurants near ${event.name} within ${radius}km`);
  
  // TODO: Integrate with Google Places API or similar
  
  // Mock implementation
  return [
    {
      id: `${event.id}-restaurant-1`,
      name: `Restaurant in ${event.location.city}`,
      type: 'restaurant',
      location: {
        lat: 0,
        lng: 0,
        city: event.location.city,
        country: event.location.country
      },
      description: 'Dining near event venue',
      relevance: 'tertiary'
    }
  ];
}

/**
 * Get nearby transport hubs
 * STRATEGIC: Returns airports, train stations, etc.
 */
export async function getNearbyTransport(
  event: Event,
  radius: number = 50 // km
): Promise<EventLandmark[]> {
  console.log(`🚆 Searching transport near ${event.name} within ${radius}km`);
  
  // TODO: Integrate with transport APIs
  
  // Mock implementation
  return [
    {
      id: `${event.id}-airport`,
      name: `${event.location.city} Airport`,
      type: 'transport',
      location: {
        lat: 0,
        lng: 0,
        city: event.location.city,
        country: event.location.country
      },
      description: 'Nearest major airport',
      relevance: 'secondary'
    }
  ];
}

// ==================== MAP EMBED GENERATION ====================

/**
 * Generate Google Maps embed URL
 * STRATEGIC: Creates embeddable map URL for iframes
 */
export function getMapEmbedUrl(event: Event, zoom: number = 12): string {
  const venueCoords = getVenueCoordinatesForEvent(event);
  
  if (!venueCoords) {
    return `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(event.location.city)}`;
  }
  
  const params = new URLSearchParams({
    key: process.env.GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY',
    q: `${venueCoords.lat},${venueCoords.lng}`,
    zoom: zoom.toString()
  });
  
  return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
}

/**
 * Generate Mapbox static map URL
 * STRATEGIC: Creates static map image URL
 */
export function getStaticMapUrl(
  event: Event,
  width: number = 600,
  height: number = 400,
  zoom: number = 12
): string {
  const venueCoords = getVenueCoordinatesForEvent(event);
  
  if (!venueCoords) {
    return `https://via.placeholder.com/${width}x${height}?text=${encodeURIComponent(event.location.city)}`;
  }
  
  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN || 'YOUR_TOKEN';
  
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${venueCoords.lng},${venueCoords.lat},${zoom}/${width}x${height}?access_token=${mapboxToken}`;
}

// ==================== EXPORT UTILITIES ====================

/**
 * Calculate distance between two coordinates (Haversine formula)
 * STRATEGIC: Used to calculate distances from event venue
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/**
 * Legacy compatibility: getEventVenueCoordinates
 * @deprecated Use getVenueCoordinatesForEvent() instead
 */
export function getEventVenueCoordinates(eventId: string): { lat: number; lng: number } | null {
  console.warn('⚠️ getEventVenueCoordinates is deprecated. Use getVenueCoordinatesForEvent() with Event object instead.');
  
  const venueKey = eventId.replace(/-\d{4}$/, ''); // Remove year suffix
  return VENUE_COORDINATES[venueKey] || null;
}