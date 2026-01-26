// lib/event-data.ts - Premium Events Database with Trademark-Safe Naming
// ✨ Opulent design system integration

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
  name: string; // Original name (may include trademarks)
  genericName: string; // Safe alternative name
  type: 'sports' | 'music' | 'festival' | 'cultural' | 'exhibition';
  sport?: 'football' | 'american-football' | 'basketball' | 'baseball' | 'tennis' | 'racing' | 'rugby' | 'multi-sport' | 'golf' | 'hockey' | 'boxing-mma' | 'cricket';
  
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
// FEATURED EVENTS DATABASE - OPULENT EDITION
// ============================================

export const FEATURED_EVENTS: Event[] = [
  {
    id: 'intl-football-2026',
    name: 'FIFA World Cup 2026™',
    genericName: '2026 International Football Championship',
    type: 'sports',
    sport: 'football',
    startDate: '2026-06-11',
    endDate: '2026-07-19',
    venue: {
      name: 'Multiple Premium Venues',
      city: 'USA, Canada, Mexico',
      country: 'North America',
      capacity: 80000,
      address: '16 world-class host cities',
      coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    images: [
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
      'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800'
    ],
    heroImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600',
    description: '✨ Experience the pinnacle of international football! The world\'s most prestigious tournament brings together 48 elite national teams competing across 16 spectacular host cities in North America. Witness history as nations battle for glory in the beautiful game. From electric atmospheres to unforgettable moments, immerse yourself in the passion, drama, and excellence of world-class football with our premium travel packages, VIP hospitality experiences, and expertly curated itineraries.',
    highlights: [
      '⚽ 48 elite teams competing for ultimate glory',
      '🌎 16 world-class host cities across 3 nations',
      '✨ Premium hospitality & VIP experiences',
      '🎫 Exclusive tickets with best-in-class seating',
      '🏆 Follow your team across multiple cities',
      '💎 Luxury accommodations near stadiums',
      '🎯 Expert-guided cross-border travel',
      '🌟 AI-powered trip updates as teams advance'
    ],
    tickets: [
      {
        category: 'Standard Seating',
        price: 250,
        currency: 'USD',
        perks: ['Match ticket', 'Stadium access', 'Digital souvenir'],
        available: true,
        affiliateUrl: 'https://stubhub.com/world-cup-tickets',
        partner: 'StubHub'
      },
      {
        category: 'Premium View',
        price: 800,
        currency: 'USD',
        perks: ['Premium seating', 'Hospitality lounge access', 'Complimentary food & beverages', 'Meet & greet opportunities'],
        available: true,
        affiliateUrl: 'https://vividseats.com/world-cup',
        partner: 'Vivid Seats'
      },
      {
        category: 'VIP Experience',
        price: 2500,
        currency: 'USD',
        perks: ['Best seats in house', 'Exclusive VIP lounge', 'Premium dining experience', 'Player meet & greet', 'Concierge service'],
        available: true,
        affiliateUrl: 'https://seatgeek.com/world-cup',
        partner: 'SeatGeek'
      }
    ],
    estimatedTicketPrice: { min: 250, max: 5000, currency: 'USD' },
    packages: [
      {
        id: 'pkg-football-la',
        name: 'Los Angeles Luxury Experience',
        description: '✨ 5-day premium package including round-trip flights, 4-star hotel with city views, premium match tickets, private transfers, exclusive city tour, and welcome dinner at a Michelin-starred restaurant. Experience LA in style while following your team!',
        includes: {
          flights: true,
          hotel: true,
          tickets: true,
          transfers: true,
          extras: ['Private city tour', 'Welcome dinner at Michelin restaurant', 'Fan zone VIP access', 'Concierge service']
        },
        price: 4500,
        duration: 5,
        affiliateUrl: 'https://booking.com/world-cup',
        partner: 'Booking.com'
      },
      {
        id: 'pkg-football-miami',
        name: 'Miami Beach Football Getaway',
        description: '🌴 4-day beachfront paradise package combining world-class football with Miami\'s vibrant energy. Includes beachfront resort, match tickets, ocean-view dining, and exclusive beach club access. Where football meets paradise!',
        includes: {
          flights: true,
          hotel: true,
          tickets: true,
          transfers: true,
          extras: ['Beachfront resort access', '$200 restaurant vouchers', 'Beach club day pass', 'Sunset yacht cruise']
        },
        price: 3800,
        duration: 4,
        affiliateUrl: 'https://expedia.com/world-cup',
        partner: 'Expedia'
      },
      {
        id: 'pkg-football-multi-city',
        name: 'Multi-City Champion Package',
        description: '🏆 The ultimate 14-day journey following your team across 3 host cities. Includes all flights, premium hotels, match tickets, VIP lounge access, and private transfers. For the true football devotee.',
        includes: {
          flights: true,
          hotel: true,
          tickets: true,
          transfers: true,
          extras: ['3 cities, 4 matches', 'VIP lounge access', 'Private meet & greet', 'Exclusive memorabilia', 'Dedicated travel concierge']
        },
        price: 12500,
        duration: 14,
        affiliateUrl: 'https://booking.com/world-cup-premium',
        partner: 'Booking.com'
      }
    ],
    schedule: [
      { date: '2026-06-11', time: '14:00', event: 'Opening Match - Group Stage Begins' },
      { date: '2026-06-26', time: '18:00', event: 'Round of 32 Begins' },
      { date: '2026-07-02', time: '16:00', event: 'Quarter Finals' },
      { date: '2026-07-07', time: '19:00', event: 'Semi Finals' },
      { date: '2026-07-19', time: '15:00', event: 'Grand Final - Championship Match' }
    ],
    fanZone: {
      location: 'Times Square, NYC & Multiple Cities',
      activities: ['Live match viewing on giant screens', 'International food trucks', 'Live music performances', 'Fan meetups & watch parties', 'Interactive football experiences', 'Cultural celebrations']
    },
    localInfo: {
      nearbyHotels: 150,
      averageHotelPrice: 350,
      transportation: ['Metro systems', 'Uber/Lyft', 'Dedicated team shuttles', 'Walking distances', 'Inter-city trains']
    },
    featured: true,
    priority: 1,
    tags: ['football', 'soccer', 'international', 'north-america', '2026', 'world-cup', 'multi-city', 'premium', 'luxury'],
    disclaimer: '⚠️ IMPORTANT: This is an independent travel planning service. We are not affiliated with, endorsed by, or connected to FIFA, the FIFA World Cup™, or official tournament organizers. FIFA World Cup™ is a registered trademark of FIFA. All trademarks belong to their respective owners. We provide travel services only.'
  },
  
  {
    id: 'super-bowl-2025',
    name: 'Super Bowl LIX',
    genericName: 'NFL Championship Game 2025',
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
      'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800',
      'https://images.unsplash.com/photo-1508754854856-b3e0bc215f2e?w=800',
      'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800'
    ],
    heroImage: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=600',
    description: '🏈 The biggest spectacle in American sports returns to the Big Easy! Experience the ultimate championship showdown where legends are made and dreams come true. Beyond the game, immerse yourself in New Orleans\' incredible culture with world-class jazz, Creole cuisine, French Quarter celebrations, and unforgettable pre-game festivities. This is more than a game—it\'s an experience of a lifetime in one of America\'s most vibrant cities.',
    highlights: [
      '🏆 Championship game with best seats available',
      '🎭 Pre-game festival with A-list performances',
      '🎵 Live concerts featuring chart-topping artists',
      '🎉 French Quarter VIP celebrations',
      '🍷 Bourbon Street premium experiences',
      '✨ VIP hospitality packages with all-inclusive access',
      '🎪 NFL Experience interactive exhibits',
      '💎 Once-in-a-lifetime memories'
    ],
    tickets: [
      {
        category: 'Upper Deck',
        price: 6000,
        currency: 'USD',
        perks: ['Championship game ticket', 'Stadium access', 'Digital commemorative ticket', 'Event program'],
        available: true,
        affiliateUrl: 'https://stubhub.com/super-bowl',
        partner: 'StubHub'
      },
      {
        category: 'Club Seats',
        price: 15000,
        currency: 'USD',
        perks: ['Premium club seating', 'Climate-controlled club lounge', 'All-inclusive food & premium drinks', 'Private restrooms', 'VIP entrance'],
        available: true,
        affiliateUrl: 'https://vividseats.com/super-bowl',
        partner: 'Vivid Seats'
      },
      {
        category: 'Luxury Suite',
        price: 45000,
        currency: 'USD',
        perks: ['Private luxury suite', 'Premium catering', 'Personal attendant', 'Meet & greet opportunities', 'Exclusive lounge access', 'Parking pass'],
        available: true,
        affiliateUrl: 'https://seatgeek.com/super-bowl-suites',
        partner: 'SeatGeek'
      }
    ],
    estimatedTicketPrice: { min: 6000, max: 50000, currency: 'USD' },
    packages: [
      {
        id: 'pkg-nola-premium',
        name: 'NOLA Premium Experience',
        description: '🎭 4-day luxury package featuring game tickets, 5-star French Quarter hotel, VIP pre-game party, exclusive French Quarter food tour, jazz club access, and private riverboat cruise. Experience New Orleans like a champion!',
        includes: {
          flights: true,
          hotel: true,
          tickets: true,
          transfers: true,
          extras: ['VIP pre-game party', 'French Quarter food tour', 'Jazz club VIP access', 'Private riverboat cruise', 'Welcome cocktail reception']
        },
        price: 12000,
        duration: 4,
        affiliateUrl: 'https://booking.com/super-bowl',
        partner: 'Booking.com'
      },
      {
        id: 'pkg-nola-ultimate',
        name: 'Ultimate Championship Package',
        description: '👑 The crown jewel of packages! 5-day all-inclusive experience with club seats, 5-star suite, private helicopter tour, celebrity chef dinner, VIP party access, and personal concierge. Live like a champion!',
        includes: {
          flights: true,
          hotel: true,
          tickets: true,
          transfers: true,
          extras: ['Club seat tickets', 'Helicopter city tour', 'Celebrity chef private dinner', 'VIP party passes', 'Personal concierge 24/7', 'Spa day package']
        },
        price: 25000,
        duration: 5,
        affiliateUrl: 'https://expedia.com/super-bowl-luxury',
        partner: 'Expedia'
      }
    ],
    schedule: [
      { date: '2025-02-07', time: '18:00', event: 'NFL Honors Awards Ceremony' },
      { date: '2025-02-08', time: '14:00', event: 'Super Bowl Live Festival' },
      { date: '2025-02-08', time: '20:00', event: 'Commissioner\'s Party' },
      { date: '2025-02-09', time: '15:30', event: 'Pre-Game Show' },
      { date: '2025-02-09', time: '18:30', event: 'Championship Game Kickoff' }
    ],
    fanZone: {
      location: 'Champion Square & French Quarter',
      activities: ['NFL Experience interactive zone', 'Live music stages', 'Food & drink festivals', 'Autograph sessions', 'Photo opportunities with Lombardi Trophy', 'Virtual reality experiences']
    },
    localInfo: {
      nearbyHotels: 85,
      averageHotelPrice: 600,
      transportation: ['Streetcar (historic)', 'Uber/Lyft', 'Walking (French Quarter)', 'Shuttle buses', 'Private car service']
    },
    featured: true,
    priority: 2,
    tags: ['american-football', 'nfl', 'super-bowl', 'new-orleans', '2025', 'championship', 'luxury', 'premium'],
    disclaimer: '⚠️ Independent travel service not affiliated with the NFL, Super Bowl, or official event organizers. Super Bowl and NFL are registered trademarks of the National Football League. All trademarks belong to their respective owners.'
  },

  {
    id: 'la-olympics-2028',
    name: 'LA 2028 Summer Olympics',
    genericName: 'Los Angeles Olympic Games 2028',
    type: 'sports',
    sport: 'multi-sport',
    startDate: '2028-07-21',
    endDate: '2028-08-06',
    venue: {
      name: 'Multiple Olympic Venues',
      city: 'Los Angeles',
      country: 'USA',
      capacity: 70000,
      address: 'Greater Los Angeles area',
      coordinates: { lat: 34.0522, lng: -118.2437 }
    },
    images: [
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
      'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800',
      'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=800'
    ],
    heroImage: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600',
    description: '🏅 Witness history as Los Angeles hosts the world\'s premier multi-sport celebration! Over 10,000 elite athletes from 200+ nations will compete in 50+ Olympic sports, showcasing human excellence at its peak. From the iconic Opening Ceremony to heart-stopping finals, experience the magic of the Olympic spirit combined with LA\'s unbeatable entertainment, beaches, and Hollywood glamour. This is where champions are made and legacies are written.',
    highlights: [
      '🌟 50+ Olympic sports & 300+ medal events',
      '🌍 200+ nations competing for glory',
      '✨ Spectacular opening & closing ceremonies',
      '🏖️ Iconic LA beaches & world-class entertainment',
      '🎬 Hollywood glamour meets Olympic excellence',
      '🏟️ State-of-the-art venues across LA',
      '🎫 Premium hospitality packages available',
      '💫 Once-in-a-generation sporting spectacle'
    ],
    tickets: [
      {
        category: 'Session Tickets',
        price: 150,
        currency: 'USD',
        perks: ['Single session access', 'Stadium entry', 'Official program', 'Public transport pass'],
        available: true,
        affiliateUrl: 'https://ticketmaster.com/olympics',
        partner: 'Ticketmaster'
      },
      {
        category: 'Multi-Day Pass',
        price: 800,
        currency: 'USD',
        perks: ['Multiple session access', 'Priority entry lanes', 'Official souvenir package', 'Digital photo memories', 'Fan zone access'],
        available: true,
        affiliateUrl: 'https://stubhub.com/olympics',
        partner: 'StubHub'
      },
      {
        category: 'VIP Olympic Experience',
        price: 5000,
        currency: 'USD',
        perks: ['10-day all-access pass', 'VIP lounge access', 'Premium seating all venues', 'Exclusive meet & greets', 'Behind-the-scenes tours', 'Concierge service'],
        available: true,
        affiliateUrl: 'https://vividseats.com/olympics-vip',
        partner: 'Vivid Seats'
      }
    ],
    estimatedTicketPrice: { min: 150, max: 5000, currency: 'USD' },
    packages: [
      {
        id: 'pkg-la-games',
        name: 'LA Olympics Complete Experience',
        description: '🏅 10-day comprehensive Olympic package featuring tickets to multiple sports, 4-star hotel near venues, opening ceremony access, beach club day pass, Hollywood tour, and daily breakfast. Experience the Games and LA in perfect harmony!',
        includes: {
          flights: true,
          hotel: true,
          tickets: true,
          transfers: true,
          extras: ['Opening ceremony ticket', 'Multiple sports access (5+ events)', 'Hollywood studio tour', 'Santa Monica beach club pass', 'Daily breakfast buffet']
        },
        price: 8500,
        duration: 10,
        affiliateUrl: 'https://expedia.com/olympics',
        partner: 'Expedia'
      },
      {
        id: 'pkg-la-luxury',
        name: 'Luxury Olympic Getaway',
        description: '👑 14-day ultimate luxury experience with 5-star Beverly Hills hotel, VIP tickets to 10+ events, private yacht party, celebrity chef dinners, helicopter tours, and dedicated concierge. Olympics like never before!',
        includes: {
          flights: true,
          hotel: true,
          tickets: true,
          transfers: true,
          extras: ['5-star Beverly Hills suite', 'VIP tickets to 10+ events', 'Private yacht party', 'Celebrity chef experiences', 'Helicopter city tour', 'Spa package', '24/7 concierge']
        },
        price: 28000,
        duration: 14,
        affiliateUrl: 'https://booking.com/olympics-luxury',
        partner: 'Booking.com'
      }
    ],
    schedule: [
      { date: '2028-07-21', time: '19:00', event: 'Opening Ceremony - LA Memorial Coliseum' },
      { date: '2028-07-22', time: '09:00', event: 'Competitions Begin - Multiple Venues' },
      { date: '2028-08-05', time: '20:00', event: 'Final Day Competitions' },
      { date: '2028-08-06', time: '19:00', event: 'Closing Ceremony - Grand Finale' }
    ],
    fanZone: {
      location: 'LA Live & Multiple Locations',
      activities: ['Live sport viewing on giant screens', 'Interactive Olympic exhibits', 'Meet & greet with athletes', 'International food pavilions', 'Live music & performances', 'Olympic merchandise shops', 'Photo ops with mascots']
    },
    localInfo: {
      nearbyHotels: 250,
      averageHotelPrice: 400,
      transportation: ['Metro (extended for Games)', 'Olympic shuttle buses', 'Uber/Lyft', 'Walking', 'Bike share', 'Dedicated Olympic lanes']
    },
    featured: true,
    priority: 3,
    tags: ['multi-sport', 'olympics', 'international', 'los-angeles', '2028', 'summer-games', 'luxury', 'premium', 'athletics'],
    disclaimer: '⚠️ Independent travel service. Not affiliated with the IOC (International Olympic Committee), LA 2028, or official organizing committee. Olympic rings and related marks are registered trademarks of the IOC. All trademarks belong to their respective owners.'
  },

  {
    id: 'coachella-2025',
    name: 'Coachella Music Festival 2025',
    genericName: 'Desert Music & Arts Festival',
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
      'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800',
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800'
    ],
    heroImage: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600',
    description: '🎵 The ultimate music and arts festival experience in the California desert! Three days of world-class performances featuring chart-topping headliners, breakthrough artists, and legendary DJs across multiple stages. Beyond music, immerse yourself in massive art installations, gourmet food from celebrity chefs, fashion-forward crowds, and unforgettable desert sunsets. This is where music, art, and culture collide under the stars.',
    highlights: [
      '🎤 150+ world-class musical acts & DJs',
      '🎨 Breathtaking large-scale art installations',
      '🌅 Two incredible weekends to choose from',
      '⛺ Premium camping & glamping experiences',
      '👗 Fashion-forward desert style showcase',
      '🍷 Gourmet food & craft cocktail gardens',
      '📸 Instagram-worthy moments everywhere',
      '✨ Desert magic under starlit skies'
    ],
    tickets: [
      {
        category: 'General Admission',
        price: 549,
        currency: 'USD',
        perks: ['3-day festival pass', 'All stages access', 'Art installations', 'Food vendor access'],
        available: true,
        affiliateUrl: 'https://stubhub.com/coachella',
        partner: 'StubHub'
      },
      {
        category: 'VIP Pass',
        price: 1119,
        currency: 'USD',
        perks: ['VIP viewing areas', 'Premium viewing decks', 'Air-conditioned restrooms', 'Complimentary food vouchers', 'VIP entrance lanes', 'Exclusive lounges'],
        available: true,
        affiliateUrl: 'https://vividseats.com/coachella',
        partner: 'Vivid Seats'
      },
      {
        category: 'Platinum Experience',
        price: 2500,
        currency: 'USD',
        perks: ['Ultra-premium viewing', 'Backstage tours', 'Artist meet & greets', 'Private chef experiences', 'Luxury camping option', 'Concierge service', 'Exclusive parties'],
        available: true,
        affiliateUrl: 'https://seatgeek.com/coachella-platinum',
        partner: 'SeatGeek'
      }
    ],
    estimatedTicketPrice: { min: 549, max: 2500, currency: 'USD' },
    packages: [
      {
        id: 'pkg-coachella-weekend',
        name: 'Coachella Weekend Package',
        description: '🌴 4-day desert festival experience including 3-day GA pass, boutique hotel in Palm Springs, festival shuttle pass, pool party access, and welcome kit with essentials. Your complete Coachella adventure!',
        includes: {
          flights: true,
          hotel: true,
          tickets: true,
          transfers: true,
          extras: ['Festival shuttle pass', 'Pool party access', 'Welcome kit with essentials', 'Pre-festival mixer', 'Late checkout']
        },
        price: 2800,
        duration: 4,
        affiliateUrl: 'https://booking.com/coachella',
        partner: 'Booking.com'
      },
      {
        id: 'pkg-coachella-luxury',
        name: 'Luxury Desert Experience',
        description: '✨ 5-day VIP luxury package with VIP festival pass, 5-star resort with private pool, luxury car rental, VIP lounge access, spa treatments, and gourmet dinner reservations. Festival glamour elevated!',
        includes: {
          flights: true,
          hotel: true,
          tickets: true,
          transfers: true,
          extras: ['VIP festival passes', '5-star resort suite', 'Luxury car rental', 'Spa day package', 'Gourmet dinner reservations', 'VIP lounge access']
        },
        price: 6500,
        duration: 5,
        affiliateUrl: 'https://expedia.com/coachella-luxury',
        partner: 'Expedia'
      }
    ],
    schedule: [
      { date: '2025-04-11', time: '12:00', event: 'Gates Open - Weekend 1 Day 1' },
      { date: '2025-04-12', time: '12:00', event: 'Weekend 1 Day 2' },
      { date: '2025-04-13', time: '12:00', event: 'Weekend 1 Day 3 - Closing Night' },
      { date: '2025-04-18', time: '12:00', event: 'Gates Open - Weekend 2 Day 1' },
      { date: '2025-04-19', time: '12:00', event: 'Weekend 2 Day 2' },
      { date: '2025-04-20', time: '12:00', event: 'Weekend 2 Day 3 - Festival Finale' }
    ],
    fanZone: {
      location: 'Throughout Festival Grounds',
      activities: ['Silent disco dance parties', 'Interactive art experiences', 'Celebrity chef food tastings', 'Fashion pop-ups', 'Yoga & wellness sessions', 'Photo booth installations', 'Craft cocktail gardens']
    },
    localInfo: {
      nearbyHotels: 45,
      averageHotelPrice: 350,
      transportation: ['Festival shuttle (included with many tickets)', 'Uber/Lyft', 'On-site camping', 'Rental cars', 'Rideshare designated zones']
    },
    featured: true,
    priority: 4,
    tags: ['music', 'festival', 'california', 'coachella', 'desert', 'indie', 'edm', 'fashion', 'art', 'premium'],
    disclaimer: '⚠️ Independent travel service. Coachella is a registered trademark of Goldenvoice, LLC. Not affiliated with or endorsed by festival organizers. All trademarks belong to their respective owners.'
  },

  {
    id: 'monaco-grand-prix-2025',
    name: 'Monaco Grand Prix 2025',
    genericName: 'Monte Carlo International Racing Championship',
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
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800',
      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'
    ],
    heroImage: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600',
    description: '🏁 The crown jewel of motorsport! The Monaco Grand Prix represents the pinnacle of racing prestige, where the world\'s fastest drivers navigate the legendary Monte Carlo street circuit at breathtaking speeds. Experience unparalleled glamour with luxury yachts in Port Hercules, champagne celebrations, celebrity sightings, and the electrifying atmosphere of racing through one of the world\'s most exclusive locations. This is motorsport royalty at its finest.',
    highlights: [
      '🏎️ Most prestigious race on the F1 calendar',
      '🌊 Exclusive yacht viewing experiences',
      '👑 Monaco\'s unmatched luxury & glamour',
      '🎪 3-day weekend: Practice, Qualifying, Race',
      '🍾 Champagne celebrations at legendary spots',
      '✨ Celebrity sightings & VIP parties',
      '🏨 5-star hotels with harbor views',
      '💎 Once-in-a-lifetime racing experience'
    ],
    tickets: [
      {
        category: 'Grandstand Seats',
        price: 800,
        currency: 'EUR',
        perks: ['3-day pass (Fri-Sun)', 'Covered seating', 'Prime viewing location', 'Race program'],
        available: true,
        affiliateUrl: 'https://f1experiences.com/monaco',
        partner: 'F1 Experiences'
      },
      {
        category: 'Champions Club',
        price: 3500,
        currency: 'EUR',
        perks: ['Premium hospitality', 'Gourmet dining', 'Open bar', 'Pit lane walk access', 'Driver appearances', 'VIP entrance'],
        available: true,
        affiliateUrl: 'https://f1experiences.com/monaco-champions',
        partner: 'F1 Experiences'
      },
      {
        category: 'Paddock Club',
        price: 8000,
        currency: 'EUR',
        perks: ['Ultimate F1 experience', 'Paddock access all 3 days', 'Michelin-starred dining', 'Champagne service', 'Pit lane walk', 'Driver meet & greets', 'Team garage tours', 'VIP gift bag'],
        available: true,
        affiliateUrl: 'https://f1experiences.com/monaco-paddock',
        partner: 'F1 Experiences'
      }
    ],
    estimatedTicketPrice: { min: 800, max: 15000, currency: 'EUR' },
    packages: [
      {
        id: 'pkg-monaco-luxury',
        name: 'Monaco Luxury Racing Experience',
        description: '👑 5-day ultimate Monaco package featuring 5-star Hotel de Paris, Champions Club tickets, exclusive yacht party in Port Hercules, casino night at Monte Carlo, helicopter scenic tour, and private driver. Experience Monaco like F1 royalty!',
        includes: {
          flights: true,
          hotel: true,
          tickets: true,
          transfers: true,
          extras: ['5-star Hotel de Paris', 'Exclusive yacht party', 'Casino night at Monte Carlo', 'Helicopter scenic tour', 'Private driver service', 'Welcome champagne']
        },
        price: 18000,
        duration: 5,
        affiliateUrl: 'https://booking.com/monaco-f1',
        partner: 'Booking.com'
      },
      {
        id: 'pkg-monaco-royal',
        name: 'Royal Monaco Package',
        description: '💎 The ultimate 6-day experience with Paddock Club access, penthouse suite at Fairmont, private yacht for race viewing, Michelin 3-star dinners, helicopter transfers, and personal concierge. Pure Monaco excellence!',
        includes: {
          flights: true,
          hotel: true,
          tickets: true,
          transfers: true,
          extras: ['Paddock Club all-access', 'Penthouse suite', 'Private yacht race viewing', 'Michelin 3-star dinners (3 nights)', 'Helicopter transfers', 'Personal concierge', 'VIP nightclub access']
        },
        price: 45000,
        duration: 6,
        affiliateUrl: 'https://expedia.com/monaco-royal',
        partner: 'Expedia'
      }
    ],
    schedule: [
      { date: '2025-05-23', time: '13:00', event: 'Free Practice 1 & 2' },
      { date: '2025-05-24', time: '12:00', event: 'Free Practice 3' },
      { date: '2025-05-24', time: '15:00', event: 'Qualifying Session' },
      { date: '2025-05-25', time: '14:00', event: 'Main Race - Monaco Grand Prix' }
    ],
    fanZone: {
      location: 'Port Hercules & Casino Square',
      activities: ['F1 simulator experiences', 'Driver autograph sessions', 'Historic F1 car displays', 'Racing memorabilia shops', 'Live entertainment', 'Yacht parties (VIP)', 'Casino events']
    },
    localInfo: {
      nearbyHotels: 30,
      averageHotelPrice: 800,
      transportation: ['Walking (Monaco is small)', 'Taxi', 'Helicopter transfers', 'Private yacht', 'Luxury car service', 'Hotel shuttles']
    },
    featured: true,
    priority: 5,
    tags: ['racing', 'formula-1', 'f1', 'monaco', 'luxury', 'motorsport', 'premium', 'glamour', 'exclusive'],
    disclaimer: '⚠️ Independent travel service. Not affiliated with Formula 1, FIA, Monaco Grand Prix organizers, or Automobile Club de Monaco. Formula 1, F1, and related marks are trademarks of Formula One Licensing BV. All trademarks belong to their respective owners.'
  },

  // Additional Premium Events
  {
    id: 'wimbledon-2025',
    name: 'Wimbledon Championships 2025',
    genericName: 'London Tennis Championship',
    type: 'sports',
    sport: 'tennis',
    startDate: '2025-06-30',
    endDate: '2025-07-13',
    venue: {
      name: 'All England Lawn Tennis Club',
      city: 'London',
      country: 'United Kingdom',
      capacity: 42000,
      address: 'Church Road, Wimbledon, London SW19 5AE',
      coordinates: { lat: 51.4343, lng: -0.2141 }
    },
    images: [
      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800',
      'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=800'
    ],
    heroImage: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200',
    thumbnail: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600',
    description: '🎾 The most prestigious tennis tournament in the world! Experience the tradition, excellence, and British elegance of the Championships. Watch tennis legends compete on perfectly manicured grass courts while enjoying strawberries and cream, Pimm\'s, and the unique atmosphere of this historic sporting event. Pure tennis heritage combined with London\'s finest hospitality.',
    highlights: [
      '🏆 Most prestigious Grand Slam tournament',
      '🌱 Iconic grass court tennis',
      '🍓 Traditional strawberries & cream',
      '🎩 Royal Box celebrity sightings',
      '🇬🇧 Quintessentially British experience',
      '✨ 2 weeks of world-class tennis',
      '👑 Centre Court legends in action',
      '💚 Historic sporting tradition'
    ],
    tickets: [
      {
        category: 'Ground Pass',
        price: 150,
        currency: 'GBP',
        perks: ['Access to outer courts', 'Henman Hill viewing', 'Food courts access', 'Souvenir shop'],
        available: true,
        affiliateUrl: 'https://stubhub.com/wimbledon',
        partner: 'StubHub'
      },
      {
        category: 'Centre Court',
        price: 800,
        currency: 'GBP',
        perks: ['Centre Court reserved seat', 'Full day access', 'Premium viewing', 'Official program'],
        available: true,
        affiliateUrl: 'https://vividseats.com/wimbledon',
        partner: 'Vivid Seats'
      },
      {
        category: 'Debenture Hospitality',
        price: 2500,
        currency: 'GBP',
        perks: ['Best Centre Court seats', 'Exclusive lounge access', 'Gourmet dining', 'Champagne service', 'VIP facilities'],
        available: true,
        affiliateUrl: 'https://seatgeek.com/wimbledon-vip',
        partner: 'SeatGeek'
      }
    ],
    estimatedTicketPrice: { min: 150, max: 3000, currency: 'GBP' },
    packages: [
      {
        id: 'pkg-wimbledon-classic',
        name: 'Classic Wimbledon Experience',
        description: '🎾 5-day London package with Centre Court tickets, 4-star hotel near Wimbledon, traditional afternoon tea, Thames river cruise, and West End show tickets. Experience the Championships and London!',
        includes: {
          flights: true,
          hotel: true,
          tickets: true,
          transfers: true,
          extras: ['Centre Court tickets (2 days)', 'Traditional afternoon tea', 'Thames river cruise', 'West End theatre tickets', 'London Eye tickets']
        },
        price: 4500,
        duration: 5,
        affiliateUrl: 'https://booking.com/wimbledon',
        partner: 'Booking.com'
      }
    ],
    localInfo: {
      nearbyHotels: 60,
      averageHotelPrice: 250,
      transportation: ['London Underground (District Line)', 'Bus', 'Taxi', 'Uber', 'Walking from station']
    },
    featured: true,
    priority: 6,
    tags: ['tennis', 'wimbledon', 'london', 'grand-slam', 'sports', 'british', 'premium', 'tradition'],
    disclaimer: '⚠️ Independent travel service. Not affiliated with The Championships, Wimbledon, The All England Lawn Tennis Club, or official tournament organizers. Wimbledon and related marks are trademarks of the All England Lawn Tennis Club. All trademarks belong to their respective owners.'
  }
];

// ============================================
// HELPER FUNCTIONS - OPULENT EDITION
// ============================================

export const getFeaturedEvents = (): Event[] => {
  return FEATURED_EVENTS
    .filter(event => event.featured)
    .sort((a, b) => a.priority - b.priority);
};

export const getEventById = (id: string): Event | undefined => {
  return FEATURED_EVENTS.find(event => event.id === id);
};

export const getEventsByType = (type: Event['type']): Event[] => {
  return FEATURED_EVENTS
    .filter(event => event.type === type)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
};

export const getEventsBySport = (sport: Event['sport']): Event[] => {
  return FEATURED_EVENTS
    .filter(event => event.sport === sport)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
};

export const getUpcomingEvents = (limit?: number): Event[] => {
  const now = new Date();
  const upcoming = FEATURED_EVENTS
    .filter(event => new Date(event.startDate) > now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  
  return limit ? upcoming.slice(0, limit) : upcoming;
};

export const searchEvents = (query: string): Event[] => {
  const lowerQuery = query.toLowerCase();
  return FEATURED_EVENTS.filter(event =>
    event.name.toLowerCase().includes(lowerQuery) ||
    event.genericName.toLowerCase().includes(lowerQuery) ||
    event.description.toLowerCase().includes(lowerQuery) ||
    event.venue.city.toLowerCase().includes(lowerQuery) ||
    event.venue.country.toLowerCase().includes(lowerQuery) ||
    event.tags.some(tag => tag.includes(lowerQuery))
  );
};

export const getEventsByCity = (city: string): Event[] => {
  return FEATURED_EVENTS
    .filter(event => event.venue.city.toLowerCase().includes(city.toLowerCase()))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
};

export const getEventsByCountry = (country: string): Event[] => {
  return FEATURED_EVENTS
    .filter(event => event.venue.country.toLowerCase().includes(country.toLowerCase()))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
};

export const getPremiumEvents = (): Event[] => {
  return FEATURED_EVENTS
    .filter(event => event.estimatedTicketPrice.min >= 1000)
    .sort((a, b) => b.estimatedTicketPrice.min - a.estimatedTicketPrice.min);
};

export const getEventsByDateRange = (startDate: Date, endDate: Date): Event[] => {
  return FEATURED_EVENTS
    .filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate >= startDate && eventDate <= endDate;
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
};
