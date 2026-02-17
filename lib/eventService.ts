// lib/eventService.ts
// 🎯 Event Service - Trademark-Safe Data Layer with Travel Intelligence
//
// STRATEGIC ARCHITECTURE:
// - All event data and trademark logic centralized here
// - Real event names preserved for SEO and discoverability
// - Trademark metadata ensures legal compliance
// - Travel intelligence for optimal trip planning
// - UI components receive clean, pre-processed data
//
// LEGAL FRAMEWORK:
// - Trademarked events include proper ownership metadata
// - Disclaimers prevent any implication of affiliation
// - Factual, informational use only

// ==================== TYPE DEFINITIONS ====================

export type EventTrademark = {
  isTrademarked: boolean;
  trademarkOwner?: string;
  disclaimer?: string;
};

export type EventStatus = "upcoming" | "live" | "past";

export type Event = {
  id: string;
  name: string; // Real event name (e.g., "FIFA World Cup 2026")
  type: "sports" | "music" | "festival";
  location: {
    city: string;
    country: string;
    venue?: string;
  };
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
  description?: string;
  heroImage?: string;
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  officialUrl?: string;
  affiliateOnly?: boolean; // If true, we only provide affiliate links, not direct booking
  trademark?: EventTrademark;
  source?: string; // Data source
  // Travel Intelligence
  recommendedArrivalDaysBefore?: number;
  recommendedDepartureDaysAfter?: number;
};

// ==================== TRADEMARK METADATA HELPERS ====================
// STRATEGIC: Centralized trademark information for major events

const TRADEMARK_METADATA: Record<string, EventTrademark> = {
  'fifa-world-cup': {
    isTrademarked: true,
    trademarkOwner: 'FIFA (Fédération Internationale de Football Association)',
    disclaimer: 'GladysTravelAI is not affiliated with or endorsed by FIFA. FIFA World Cup™ is a trademark of FIFA.'
  },
  'olympics': {
    isTrademarked: true,
    trademarkOwner: 'International Olympic Committee (IOC)',
    disclaimer: 'GladysTravelAI is not affiliated with or endorsed by the IOC. Olympics™ and Olympic Games™ are trademarks of the IOC.'
  },
  'super-bowl': {
    isTrademarked: true,
    trademarkOwner: 'National Football League (NFL)',
    disclaimer: 'GladysTravelAI is not affiliated with or endorsed by the NFL. Super Bowl™ is a trademark of the NFL.'
  },
  'wimbledon': {
    isTrademarked: true,
    trademarkOwner: 'The All England Lawn Tennis Club (AELTC)',
    disclaimer: 'GladysTravelAI is not affiliated with or endorsed by the AELTC. Wimbledon™ is a trademark of the AELTC.'
  },
  'coachella': {
    isTrademarked: true,
    trademarkOwner: 'Goldenvoice',
    disclaimer: 'GladysTravelAI is not affiliated with or endorsed by Goldenvoice. Coachella™ is a trademark of Goldenvoice.'
  },
  'glastonbury': {
    isTrademarked: true,
    trademarkOwner: 'Glastonbury Festivals Ltd',
    disclaimer: 'GladysTravelAI is not affiliated with or endorsed by Glastonbury Festivals Ltd. Glastonbury™ is a trademark of Glastonbury Festivals Ltd.'
  },
  'burning-man': {
    isTrademarked: true,
    trademarkOwner: 'Burning Man Project',
    disclaimer: 'GladysTravelAI is not affiliated with or endorsed by Burning Man Project. Burning Man™ is a trademark of Burning Man Project.'
  },
};

// ==================== EVENT DATABASE ====================
// STRATEGIC: Curated events with full trademark metadata + travel intelligence
// Real event names for SEO, legal metadata for compliance, travel windows for optimization

const EVENTS_DATABASE: Event[] = [
  // ==================== SPORTS EVENTS ====================
  {
    id: 'fifa-world-cup-2026',
    name: 'FIFA World Cup 2026',
    type: 'sports',
    location: {
      city: 'Multiple Cities',
      country: 'USA, Canada, Mexico',
      venue: 'Various Stadiums'
    },
    startDate: '2026-06-11',
    endDate: '2026-07-19',
    description: 'The 2026 FIFA World Cup will be hosted across North America, featuring 48 teams in the expanded tournament format.',
    priceRange: {
      min: 500,
      max: 5000,
      currency: 'USD'
    },
    officialUrl: 'https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026',
    affiliateOnly: true,
    trademark: TRADEMARK_METADATA['fifa-world-cup'],
    source: 'FIFA Official',
    recommendedArrivalDaysBefore: 2,
    recommendedDepartureDaysAfter: 2
  },
  {
    id: 'super-bowl-lx-2026',
    name: 'Super Bowl LX',
    type: 'sports',
    location: {
      city: 'Santa Clara',
      country: 'USA',
      venue: "Levi's Stadium"
    },
    startDate: '2026-02-08',
    endDate: '2026-02-08',
    description: 'The 60th edition of the Super Bowl, the championship game of the National Football League.',
    priceRange: {
      min: 3000,
      max: 20000,
      currency: 'USD'
    },
    affiliateOnly: true,
    trademark: TRADEMARK_METADATA['super-bowl'],
    source: 'NFL Official',
    recommendedArrivalDaysBefore: 2,
    recommendedDepartureDaysAfter: 1
  },
  {
    id: 'wimbledon-2026',
    name: 'Wimbledon Championships 2026',
    type: 'sports',
    location: {
      city: 'London',
      country: 'United Kingdom',
      venue: 'All England Lawn Tennis and Croquet Club'
    },
    startDate: '2026-06-29',
    endDate: '2026-07-12',
    description: 'The oldest tennis tournament in the world, held on outdoor grass courts in Wimbledon, London.',
    priceRange: {
      min: 100,
      max: 2000,
      currency: 'GBP'
    },
    affiliateOnly: true,
    trademark: TRADEMARK_METADATA['wimbledon'],
    source: 'Wimbledon Official',
    recommendedArrivalDaysBefore: 1,
    recommendedDepartureDaysAfter: 1
  },
  {
    id: 'summer-olympics-2028',
    name: 'Summer Olympics 2028',
    type: 'sports',
    location: {
      city: 'Los Angeles',
      country: 'USA',
      venue: 'Various Venues'
    },
    startDate: '2028-07-21',
    endDate: '2028-08-06',
    description: 'The Games of the XXXIV Olympiad, returning to Los Angeles for the third time.',
    priceRange: {
      min: 50,
      max: 3000,
      currency: 'USD'
    },
    affiliateOnly: true,
    trademark: TRADEMARK_METADATA['olympics'],
    source: 'IOC Official',
    recommendedArrivalDaysBefore: 3,
    recommendedDepartureDaysAfter: 2
  },

  // ==================== MUSIC EVENTS ====================
  {
    id: 'coachella-2026',
    name: 'Coachella Valley Music and Arts Festival 2026',
    type: 'music',
    location: {
      city: 'Indio',
      country: 'USA',
      venue: 'Empire Polo Club'
    },
    startDate: '2026-04-10',
    endDate: '2026-04-19',
    description: 'Annual music and arts festival featuring diverse genres and immersive art installations.',
    priceRange: {
      min: 400,
      max: 2000,
      currency: 'USD'
    },
    affiliateOnly: true,
    trademark: TRADEMARK_METADATA['coachella'],
    source: 'Coachella Official',
    recommendedArrivalDaysBefore: 1,
    recommendedDepartureDaysAfter: 1
  },
  {
    id: 'glastonbury-2026',
    name: 'Glastonbury Festival 2026',
    type: 'music',
    location: {
      city: 'Pilton',
      country: 'United Kingdom',
      venue: 'Worthy Farm'
    },
    startDate: '2026-06-24',
    endDate: '2026-06-28',
    description: 'Legendary five-day festival of contemporary performing arts, featuring music, dance, comedy, theatre, and more.',
    priceRange: {
      min: 300,
      max: 500,
      currency: 'GBP'
    },
    affiliateOnly: true,
    trademark: TRADEMARK_METADATA['glastonbury'],
    source: 'Glastonbury Official',
    recommendedArrivalDaysBefore: 1,
    recommendedDepartureDaysAfter: 1
  },

  // ==================== FESTIVAL EVENTS ====================
  {
    id: 'burning-man-2026',
    name: 'Burning Man 2026',
    type: 'festival',
    location: {
      city: 'Black Rock City',
      country: 'USA',
      venue: 'Black Rock Desert'
    },
    startDate: '2026-08-30',
    endDate: '2026-09-07',
    description: 'Annual event focused on community, art, self-expression, and self-reliance in the Nevada desert.',
    priceRange: {
      min: 500,
      max: 1500,
      currency: 'USD'
    },
    affiliateOnly: false,
    trademark: TRADEMARK_METADATA['burning-man'],
    source: 'Burning Man Official'
  },
  {
    id: 'rio-carnival-2026',
    name: 'Rio Carnival 2026',
    type: 'festival',
    location: {
      city: 'Rio de Janeiro',
      country: 'Brazil',
      venue: 'Various Locations'
    },
    startDate: '2026-02-13',
    endDate: '2026-02-17',
    description: 'World-famous carnival celebration featuring samba parades, street parties, and vibrant costumes.',
    priceRange: {
      min: 50,
      max: 1000,
      currency: 'BRL'
    },
    affiliateOnly: false,
    trademark: undefined, // Not trademarked - public cultural event
    source: 'Public Event'
  },
  {
    id: 'oktoberfest-2026',
    name: 'Oktoberfest 2026',
    type: 'festival',
    location: {
      city: 'Munich',
      country: 'Germany',
      venue: 'Theresienwiese'
    },
    startDate: '2026-09-19',
    endDate: '2026-10-04',
    description: "The world's largest Volksfest, featuring beer tents, traditional Bavarian music, and cultural celebrations.",
    priceRange: {
      min: 0,
      max: 500,
      currency: 'EUR'
    },
    affiliateOnly: false,
    trademark: undefined, // Not trademarked - public cultural event
    source: 'Public Event'
  },
];

// ==================== FEATURED EVENTS ====================
// STRATEGIC: Manually curated list of high-priority events

const FEATURED_EVENT_IDS = [
  'fifa-world-cup-2026',
  'super-bowl-lx-2026',
  'coachella-2026',
  'rio-carnival-2026',
];

// ==================== EVENT STATUS FUNCTIONS ====================

/**
 * Get event status based on current date
 * STRATEGIC: Real-time event status for dynamic UI
 */
export function getEventStatus(event: Event): EventStatus {
  const now = new Date();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "live";
  return "past";
}

/**
 * Generate intelligent travel window for event
 * STRATEGIC: Optimizes arrival/departure based on event type and duration
 */
export function generateEventTravelWindow(event: Event) {
  const arrivalOffset = event.recommendedArrivalDaysBefore ?? 1;
  const departureOffset = event.recommendedDepartureDaysAfter ?? 1;

  const eventStart = new Date(event.startDate);
  const eventEnd = new Date(event.endDate);

  const arrivalDate = new Date(eventStart);
  arrivalDate.setDate(arrivalDate.getDate() - arrivalOffset);

  const departureDate = new Date(eventEnd);
  departureDate.setDate(departureDate.getDate() + departureOffset);

  return {
    arrivalDate,
    departureDate,
  };
}

// ==================== EXPORT FUNCTIONS ====================

/**
 * Get all events
 */
export function getAllEvents(): Event[] {
  return [...EVENTS_DATABASE];
}

/**
 * Get events by type
 */
export function getEventsByType(type: Event['type']): Event[] {
  return EVENTS_DATABASE.filter(event => event.type === type);
}

/**
 * Get featured events
 */
export function getFeaturedEvents(): Event[] {
  return EVENTS_DATABASE.filter(event => FEATURED_EVENT_IDS.includes(event.id));
}

/**
 * Get event by ID
 */
export function getEventById(id: string): Event | null {
  return EVENTS_DATABASE.find(event => event.id === id) || null;
}

/**
 * Search events by query
 * STRATEGIC: Searches name, location, description
 */
export function searchEventsByQuery(events: Event[], query: string): Event[] {
  const searchTerm = query.toLowerCase().trim();
  
  return events.filter(event =>
    event.name.toLowerCase().includes(searchTerm) ||
    event.location.city.toLowerCase().includes(searchTerm) ||
    event.location.country.toLowerCase().includes(searchTerm) ||
    event.description?.toLowerCase().includes(searchTerm) ||
    event.type.toLowerCase().includes(searchTerm)
  );
}

/**
 * Filter events by location
 * STRATEGIC: Matches city or country
 */
export function filterEventsByLocation(events: Event[], location: string): Event[] {
  const searchTerm = location.toLowerCase().trim();
  
  return events.filter(event =>
    event.location.city.toLowerCase().includes(searchTerm) ||
    event.location.country.toLowerCase().includes(searchTerm) ||
    event.location.venue?.toLowerCase().includes(searchTerm)
  );
}

/**
 * Filter events by date range
 * STRATEGIC: Returns events that overlap with the search range
 */
export function filterEventsByDateRange(
  events: Event[], 
  startDate: string, 
  endDate: string
): Event[] {
  const searchStart = new Date(startDate);
  const searchEnd = new Date(endDate);
  
  // Validate dates
  if (isNaN(searchStart.getTime()) || isNaN(searchEnd.getTime())) {
    throw new Error('Invalid date range');
  }
  
  return events.filter(event => {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    
    // Event overlaps with search range if:
    // - Event starts within search range, OR
    // - Event ends within search range, OR
    // - Event spans entire search range
    return (
      (eventStart >= searchStart && eventStart <= searchEnd) ||
      (eventEnd >= searchStart && eventEnd <= searchEnd) ||
      (eventStart <= searchStart && eventEnd >= searchEnd)
    );
  });
}

/**
 * Check if event is trademarked
 */
export function isEventTrademarked(event: Event): boolean {
  return event.trademark?.isTrademarked === true;
}

/**
 * Get trademark disclaimer for event
 */
export function getTrademarkDisclaimer(event: Event): string | null {
  return event.trademark?.disclaimer || null;
}

/**
 * Get all trademarked events
 * STRATEGIC: Useful for compliance reporting
 */
export function getTrademarkedEvents(): Event[] {
  return EVENTS_DATABASE.filter(event => isEventTrademarked(event));
}

/**
 * Legacy compatibility: fetchLiveEvents
 * STRATEGIC: Maintains backward compatibility with existing code
 * @deprecated Use getAllEvents() or getEventsByType() instead
 */
export async function fetchLiveEvents(limit: number = 10): Promise<Event[]> {
  console.warn('⚠️ fetchLiveEvents is deprecated. Use getAllEvents() instead.');
  return getAllEvents().slice(0, limit);
}