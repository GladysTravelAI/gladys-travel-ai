// lib/eventsData.ts - Trademark-Safe Events Database

export interface EventTicket {
  category: string;
  price: number;
  currency: string;
  perks: string[];
  available: boolean;
  affiliateUrl: string;
  partner: string; // StubHub, Vivid Seats, etc.
}

export interface EventVenue {
  name: string;
  city: string;
  country: string;
  capacity: number;
  address: string;
  coordinates: { lat: number; lng: number };
}

export interface TravelPackage {
  id: string;
  name: string;
  description: string;
  includes: {
    flights: boolean;
    hotel: boolean;
    tickets: boolean;
    transfers: boolean;
    extras: string[];
  };
  price: number;
  duration: number;
  affiliateUrl: string;
  partner: string;
}

export interface Event {
  id: string;
  
  // Basic Info (Trademark-safe naming)
  name: string;
  genericName: string;
  type: 'sports' | 'music' | 'festival' | 'cultural' | 'exhibition';
  sport?: 'football' | 'american-football' | 'basketball' | 'tennis' | 'racing' | 'rugby' | 'multi-sport';
  
  // Dates & Location
  startDate: string;
  endDate: string;
  venue: EventVenue;
  
  // Visual Assets
  images: string[];
  heroImage: string;
  thumbnail: string;
  
  // Event Details
  description: string;
  highlights: string[];
  
  // Ticketing
  tickets: EventTicket[];
  estimatedTicketPrice: { min: number; max: number; currency: string };
  
  // Travel Packages
  packages: TravelPackage[];
  
  // Additional Info
  schedule?: Array<{
    date: string;
    time: string;
    event: string;
  }>;
  
  fanZone?: {
    location: string;
    activities: string[];
  };
  
  localInfo: {
    nearbyHotels: number;
    averageHotelPrice: number;
    transportation: string[];
  };
  
  // Marketing
  featured: boolean;
  priority: number;
  tags: string[];
  
  // Legal
  disclaimer: string;
}

// ============================================
// FEATURED EVENTS DATABASE
// ============================================

export const FEATURED_EVENTS: Event[] = [
  {
    id: 'intl-football-2026',
    name: '2026 International Football Championship',
    genericName: 'North America Football Tournament',
    type: 'sports',
    sport: 'football',
    startDate: '2026-06-11',
    endDate: '2026-07-19',
    venue: {
      name: 'Multiple Venues',
      city: 'USA, Canada, Mexico',
      country: 'North America',
      capacity: 80000,
      address: '16 host cities',
      coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    images: [
      '/events/football-2026-1.jpg',
      '/events/football-2026-2.jpg',
      '/events/football-2026-3.jpg'
    ],
    heroImage: '/events/football-2026-hero.jpg',
    thumbnail: '/events/football-2026-thumb.jpg',
    description: 'Experience the world\'s premier international football tournament featuring 48 national teams competing across 16 host cities in North America. Witness history as the beautiful game comes to the USA, Canada, and Mexico in June-July 2026.',
    highlights: [
      '48 teams competing for glory',
      '104 matches across 16 cities',
      'Historic three-nation tournament',
      'World-class stadiums',
      'Incredible fan experiences'
    ],
    tickets: [
      {
        category: 'Standard Seating',
        price: 250,
        currency: 'USD',
        perks: ['Match ticket', 'Stadium access'],
        available: true,
        affiliateUrl: 'https://stubhub.com/...',
        partner: 'StubHub'
      },
      {
        category: 'Premium View',
        price: 800,
        currency: 'USD',
        perks: ['Premium seating', 'Hospitality lounge', 'Food & beverages'],
        available: true,
        affiliateUrl: 'https://vividseats.com/...',
        partner: 'Vivid Seats'
      },
      {
        category: 'VIP Experience',
        price: 2500,
        currency: 'USD',
        perks: ['Best seats', 'Meet & greet', 'Exclusive lounge', 'Premium dining'],
        available: true,
        affiliateUrl: 'https://seatgeek.com/...',
        partner: 'SeatGeek'
      }
    ],
    estimatedTicketPrice: { min: 250, max: 5000, currency: 'USD' },
    packages: [
      {
        id: 'pkg-football-la',
        name: 'Los Angeles Experience Package',
        description: '5 days including flights, hotel, match tickets, and city tours',
        includes: {
          flights: true,
          hotel: true,
          tickets: true,
          transfers: true,
          extras: ['City tour', 'Welcome dinner', 'Fan zone access']
        },
        price: 4500,
        duration: 5,
        affiliateUrl: 'https://booking.com/...',
        partner: 'Booking.com'
      },
      {
        id: 'pkg-football-miami',
        name: 'Miami Beach Football Trip',
        description: '4 days of football and beach relaxation',
        includes: {
          flights: true,
          hotel: true,
          tickets: true,
          transfers: true,
          extras: ['Beach access', 'Restaurant vouchers']
        },
        price: 3800,
        duration: 4,
        affiliateUrl: 'https://expedia.com/...',
        partner: 'Expedia'
      }
    ],
    schedule: [
      { date: '2026-06-11', time: '14:00', event: 'Opening Match' },
      { date: '2026-07-19', time: '15:00', event: 'Final' }
    ],
    fanZone: {
      location: 'Times Square, NYC',
      activities: ['Live viewing', 'Food trucks', 'Music performances', 'Fan meetups']
    },
    localInfo: {
      nearbyHotels: 150,
      averageHotelPrice: 350,
      transportation: ['Metro', 'Uber', 'Team buses', 'Walking']
    },
    featured: true,
    priority: 1,
    tags: ['football', 'soccer', 'international', 'north-america', '2026'],
    disclaimer: 'This is an independent travel planning service. We are not affiliated with FIFA or the official tournament organizers. All trademarks belong to their respective owners.'
  },
  
  {
    id: 'championship-game-feb-2025',
    name: 'February Championship Game 2025',
    genericName: 'Professional Football Final',
    type: 'sports',
    sport: 'american-football',
    startDate: '2025-02-09',
    endDate: '2025-02-09',
    venue: {
      name: 'Caesars Superdome',
      city: 'New Orleans',
      country: 'USA',
      capacity: 73208,
      address: '1500 Sugar Bowl Dr, New Orleans, LA 70112',
      coordinates: { lat: 29.9511, lng: -90.0812 }
    },
    images: [
      '/events/championship-2025-1.jpg',
      '/events/championship-2025-2.jpg'
    ],
    heroImage: '/events/championship-2025-hero.jpg',
    thumbnail: '/events/championship-2025-thumb.jpg',
    description: 'The biggest game in American football returns to New Orleans! Experience the ultimate championship showdown in the vibrant city of NOLA with incredible parties, concerts, and once-in-a-lifetime football action.',
    highlights: [
      'Championship game tickets',
      'Pre-game festival events',
      'Live concerts and performances',
      'French Quarter celebrations',
      'VIP hospitality packages'
    ],
    tickets: [
      {
        category: 'Upper Deck',
        price: 6000,
        currency: 'USD',
        perks: ['Game ticket', 'Stadium access'],
        available: true,
        affiliateUrl: 'https://stubhub.com/...',
        partner: 'StubHub'
      },
      {
        category: 'Club Seats',
        price: 15000,
        currency: 'USD',
        perks: ['Premium seating', 'Club lounge', 'All-inclusive food & drinks'],
        available: true,
        affiliateUrl: 'https://vividseats.com/...',
        partner: 'Vivid Seats'
      }
    ],
    estimatedTicketPrice: { min: 6000, max: 50000, currency: 'USD' },
    packages: [
      {
        id: 'pkg-nola-premium',
        name: 'NOLA Premium Experience',
        description: '4-day package with game tickets, luxury hotel, and VIP experiences',
        includes: {
          flights: true,
          hotel: true,
          tickets: true,
          transfers: true,
          extras: ['Pre-game party', 'French Quarter tour', 'VIP lounge access']
        },
        price: 12000,
        duration: 4,
        affiliateUrl: 'https://booking.com/...',
        partner: 'Booking.com'
      }
    ],
    localInfo: {
      nearbyHotels: 85,
      averageHotelPrice: 600,
      transportation: ['Streetcar', 'Uber', 'Walk', 'Shuttle']
    },
    featured: true,
    priority: 2,
    tags: ['american-football', 'championship', 'new-orleans', '2025'],
    disclaimer: 'Independent travel service not affiliated with the NFL or official event organizers.'
  },

  {
    id: 'la-summer-games-2028',
    name: '2028 Los Angeles International Games',
    genericName: 'LA Summer Games',
    type: 'sports',
    sport: 'multi-sport',
    startDate: '2028-07-21',
    endDate: '2028-08-06',
    venue: {
      name: 'Multiple Venues',
      city: 'Los Angeles',
      country: 'USA',
      capacity: 70000,
      address: 'Los Angeles area',
      coordinates: { lat: 34.0522, lng: -118.2437 }
    },
    images: [
      '/events/la-2028-1.jpg',
      '/events/la-2028-2.jpg'
    ],
    heroImage: '/events/la-2028-hero.jpg',
    thumbnail: '/events/la-2028-thumb.jpg',
    description: 'Los Angeles hosts the world\'s premier multi-sport competition featuring athletes from over 200 nations competing in 50+ sports. Experience the magic of global athletic excellence in the City of Angels.',
    highlights: [
      '50+ sports competitions',
      '200+ nations competing',
      'Opening & closing ceremonies',
      'LA beaches and entertainment',
      'World-class venues'
    ],
    tickets: [
      {
        category: 'Session Tickets',
        price: 150,
        currency: 'USD',
        perks: ['Single session access', 'Stadium entry'],
        available: true,
        affiliateUrl: 'https://ticketmaster.com/...',
        partner: 'Ticketmaster'
      },
      {
        category: 'Multi-Day Pass',
        price: 800,
        currency: 'USD',
        perks: ['Multiple sessions', 'Priority entry', 'Souvenir'],
        available: true,
        affiliateUrl: 'https://stubhub.com/...',
        partner: 'StubHub'
      }
    ],
    estimatedTicketPrice: { min: 150, max: 5000, currency: 'USD' },
    packages: [
      {
        id: 'pkg-la-games',
        name: 'LA Games Complete Package',
        description: '10-day experience with multiple event tickets and hotel',
        includes: {
          flights: true,
          hotel: true,
          tickets: true,
          transfers: true,
          extras: ['Opening ceremony', 'Multiple sports', 'City tour']
        },
        price: 8500,
        duration: 10,
        affiliateUrl: 'https://expedia.com/...',
        partner: 'Expedia'
      }
    ],
    localInfo: {
      nearbyHotels: 250,
      averageHotelPrice: 400,
      transportation: ['Metro', 'Uber', 'Shuttle', 'Walk']
    },
    featured: true,
    priority: 3,
    tags: ['multi-sport', 'international', 'los-angeles', '2028', 'summer'],
    disclaimer: 'Independent travel service. Not affiliated with the IOC or official organizing committee.'
  },

  {
    id: 'coachella-2025',
    name: 'Coachella Music Festival 2025',
    genericName: 'Desert Music Festival',
    type: 'music',
    startDate: '2025-04-11',
    endDate: '2025-04-20',
    venue: {
      name: 'Empire Polo Club',
      city: 'Indio',
      country: 'USA',
      capacity: 125000,
      address: '81-800 Avenue 51, Indio, CA 92201',
      coordinates: { lat: 33.6803, lng: -116.2374 }
    },
    images: [
      '/events/coachella-2025-1.jpg',
      '/events/coachella-2025-2.jpg'
    ],
    heroImage: '/events/coachella-2025-hero.jpg',
    thumbnail: '/events/coachella-2025-thumb.jpg',
    description: 'The ultimate music and arts festival in the California desert. Experience world-class performances, incredible art installations, and unforgettable moments under the stars.',
    highlights: [
      '150+ musical acts',
      'Massive art installations',
      '2 weekends of music',
      'Desert camping experience',
      'Fashion and culture'
    ],
    tickets: [
      {
        category: 'General Admission',
        price: 549,
        currency: 'USD',
        perks: ['3-day pass', 'All stages access'],
        available: true,
        affiliateUrl: 'https://stubhub.com/...',
        partner: 'StubHub'
      },
      {
        category: 'VIP Pass',
        price: 1119,
        currency: 'USD',
        perks: ['VIP areas', 'Premium viewing', 'Air-conditioned restrooms', 'Food vouchers'],
        available: true,
        affiliateUrl: 'https://vividseats.com/...',
        partner: 'Vivid Seats'
      }
    ],
    estimatedTicketPrice: { min: 549, max: 2500, currency: 'USD' },
    packages: [
      {
        id: 'pkg-coachella-weekend',
        name: 'Coachella Weekend Package',
        description: '4-day festival experience with hotel and transportation',
        includes: {
          flights: true,
          hotel: true,
          tickets: true,
          transfers: true,
          extras: ['Shuttle pass', 'Welcome kit']
        },
        price: 2800,
        duration: 4,
        affiliateUrl: 'https://booking.com/...',
        partner: 'Booking.com'
      }
    ],
    localInfo: {
      nearbyHotels: 45,
      averageHotelPrice: 350,
      transportation: ['Shuttle', 'Uber', 'Camping', 'Rental car']
    },
    featured: true,
    priority: 4,
    tags: ['music', 'festival', 'california', 'coachella', 'desert'],
    disclaimer: 'Independent travel service. Coachella is a trademark of Goldenvoice LLC.'
  },

  {
    id: 'monaco-grand-prix-2025',
    name: 'Monaco Grand Prix 2025',
    genericName: 'Monte Carlo Racing Event',
    type: 'sports',
    sport: 'racing',
    startDate: '2025-05-23',
    endDate: '2025-05-25',
    venue: {
      name: 'Circuit de Monaco',
      city: 'Monaco',
      country: 'Monaco',
      capacity: 37000,
      address: 'Monte Carlo, Monaco',
      coordinates: { lat: 43.7384, lng: 7.4246 }
    },
    images: [
      '/events/monaco-gp-2025-1.jpg',
      '/events/monaco-gp-2025-2.jpg'
    ],
    heroImage: '/events/monaco-gp-hero.jpg',
    thumbnail: '/events/monaco-gp-thumb.jpg',
    description: 'The most prestigious motor racing event on the calendar. Experience the glamour of Monaco as the world\'s fastest cars race through the iconic streets of Monte Carlo.',
    highlights: [
      'Street circuit racing',
      'Luxury yacht viewing',
      'Monaco glamour',
      'Practice, qualifying, and race',
      'VIP hospitality'
    ],
    tickets: [
      {
        category: 'Grandstand Seats',
        price: 800,
        currency: 'EUR',
        perks: ['3-day pass', 'Covered seating'],
        available: true,
        affiliateUrl: 'https://f1experiences.com/...',
        partner: 'F1 Experiences'
      },
      {
        category: 'Paddock Club',
        price: 8000,
        currency: 'EUR',
        perks: ['Paddock access', 'Gourmet dining', 'Pit lane walk', 'Driver appearances'],
        available: true,
        affiliateUrl: 'https://f1experiences.com/...',
        partner: 'F1 Experiences'
      }
    ],
    estimatedTicketPrice: { min: 800, max: 15000, currency: 'EUR' },
    packages: [
      {
        id: 'pkg-monaco-luxury',
        name: 'Monaco Luxury Experience',
        description: '5-day Monaco Grand Prix package with 5-star hotel and yacht party',
        includes: {
          flights: true,
          hotel: true,
          tickets: true,
          transfers: true,
          extras: ['Yacht party', 'Casino night', 'Helicopter tour']
        },
        price: 18000,
        duration: 5,
        affiliateUrl: 'https://booking.com/...',
        partner: 'Booking.com'
      }
    ],
    localInfo: {
      nearbyHotels: 30,
      averageHotelPrice: 800,
      transportation: ['Walk', 'Taxi', 'Helicopter', 'Yacht']
    },
    featured: false,
    priority: 5,
    tags: ['racing', 'formula1', 'monaco', 'luxury', 'motorsport'],
    disclaimer: 'Independent travel service. Not affiliated with Formula 1 or Monaco Grand Prix organizers.'
  }
];

// Helper functions
export const getFeaturedEvents = (): Event[] => {
  return FEATURED_EVENTS.filter(event => event.featured)
    .sort((a, b) => a.priority - b.priority);
};

export const getEventById = (id: string): Event | undefined => {
  return FEATURED_EVENTS.find(event => event.id === id);
};

export const getEventsByType = (type: Event['type']): Event[] => {
  return FEATURED_EVENTS.filter(event => event.type === type);
};

export const getUpcomingEvents = (): Event[] => {
  const now = new Date();
  return FEATURED_EVENTS.filter(event => new Date(event.startDate) > now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
};

export const searchEvents = (query: string): Event[] => {
  const lowerQuery = query.toLowerCase();
  return FEATURED_EVENTS.filter(event =>
    event.name.toLowerCase().includes(lowerQuery) ||
    event.description.toLowerCase().includes(lowerQuery) ||
    event.venue.city.toLowerCase().includes(lowerQuery) ||
    event.tags.some(tag => tag.includes(lowerQuery))
  );
};