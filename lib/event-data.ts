// lib/event-data.ts
// 🎯 Event Database - Trademark-Safe Architecture

// ==================== TYPE DEFINITIONS ====================

export type EventTrademark = {
  isTrademarked: boolean;
  trademarkOwner?: string;
  disclaimer?: string;
};

export type EventLocation = {
  city: string;
  country: string;
  venueName?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
};

export type Event = {
  id: string;
  name: string;
  slug: string;
  type: "sports" | "music" | "festival";
  description: string;
  location: EventLocation;
  startDate: string;
  endDate: string;
  officialUrl?: string;
  affiliateOnly?: boolean;
  imageQuery?: string;
  trademark?: EventTrademark;
  featured?: boolean;
  sport?: string;
};

// ==================== TRADEMARK METADATA ====================

const TRADEMARK_FIFA: EventTrademark = {
  isTrademarked: true,
  trademarkOwner: 'FIFA (Fédération Internationale de Football Association)',
  disclaimer: 'GladysTravelAI is not affiliated with or endorsed by FIFA. FIFA World Cup™ is a trademark of FIFA.'
};

const TRADEMARK_NFL: EventTrademark = {
  isTrademarked: true,
  trademarkOwner: 'National Football League (NFL)',
  disclaimer: 'GladysTravelAI is not affiliated with or endorsed by the NFL. Super Bowl™ is a trademark of the NFL.'
};

const TRADEMARK_IOC: EventTrademark = {
  isTrademarked: true,
  trademarkOwner: 'International Olympic Committee (IOC)',
  disclaimer: 'GladysTravelAI is not affiliated with or endorsed by the IOC. Olympics™ and Olympic Games™ are trademarks of the IOC.'
};

const TRADEMARK_COACHELLA: EventTrademark = {
  isTrademarked: true,
  trademarkOwner: 'Goldenvoice, LLC',
  disclaimer: 'GladysTravelAI is not affiliated with or endorsed by Goldenvoice. Coachella™ is a trademark of Goldenvoice, LLC.'
};

const TRADEMARK_F1: EventTrademark = {
  isTrademarked: true,
  trademarkOwner: 'Formula One Licensing BV',
  disclaimer: 'GladysTravelAI is not affiliated with or endorsed by Formula 1 or FIA. Formula 1™, F1™, and related marks are trademarks of Formula One Licensing BV.'
};

const TRADEMARK_WIMBLEDON: EventTrademark = {
  isTrademarked: true,
  trademarkOwner: 'The All England Lawn Tennis Club (AELTC)',
  disclaimer: 'GladysTravelAI is not affiliated with or endorsed by the AELTC. Wimbledon™ is a trademark of the All England Lawn Tennis Club.'
};

// ==================== EVENTS DATABASE ====================

export const FEATURED_EVENTS: Event[] = [
  {
    id: 'fifa-world-cup-2026',
    name: 'FIFA World Cup 2026',
    slug: 'fifa-world-cup-2026',
    type: 'sports',
    description: 'The pinnacle of international football returns to North America with 48 teams competing across 16 host cities in the USA, Canada, and Mexico. Experience the world\'s most prestigious football tournament with matches spanning from June to July 2026.',
    location: {
      city: 'Multiple Cities',
      country: 'USA, Canada, Mexico',
      venueName: 'Various Stadiums',
      coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    startDate: '2026-06-11',
    endDate: '2026-07-19',
    officialUrl: 'https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026',
    affiliateOnly: true,
    imageQuery: 'soccer football stadium north america',
    trademark: TRADEMARK_FIFA,
    featured: true
  },

  {
    id: 'super-bowl-lix-2025',
    name: 'Super Bowl LIX',
    slug: 'super-bowl-lix-2025',
    type: 'sports',
    description: 'The biggest spectacle in American sports returns to New Orleans! Watch the NFL championship game at the iconic Caesars Superdome, featuring world-class halftime entertainment and unforgettable moments in the Big Easy.',
    location: {
      city: 'New Orleans',
      country: 'USA',
      venueName: 'Caesars Superdome',
      coordinates: { lat: 29.9511, lng: -90.0812 }
    },
    startDate: '2025-02-09',
    endDate: '2025-02-09',
    officialUrl: undefined,
    affiliateOnly: true,
    imageQuery: 'american football championship stadium superdome',
    trademark: TRADEMARK_NFL,
    featured: true
  },

  {
    id: 'la-olympics-2028',
    name: 'Summer Olympics 2028',
    slug: 'la-olympics-2028',
    type: 'sports',
    description: 'Los Angeles hosts the world\'s premier multi-sport celebration! Over 10,000 athletes from 200+ nations compete in 50+ Olympic sports across iconic LA venues. Witness athletic excellence combined with Hollywood glamour.',
    location: {
      city: 'Los Angeles',
      country: 'USA',
      venueName: 'Multiple Olympic Venues',
      coordinates: { lat: 34.0522, lng: -118.2437 }
    },
    startDate: '2028-07-21',
    endDate: '2028-08-06',
    officialUrl: 'https://www.la28.org/',
    affiliateOnly: true,
    imageQuery: 'olympic stadium sports los angeles',
    trademark: TRADEMARK_IOC,
    featured: true
  },

  {
    id: 'coachella-2025',
    name: 'Coachella Valley Music and Arts Festival 2025',
    slug: 'coachella-2025',
    type: 'music',
    description: 'The ultimate desert music and arts festival featuring 150+ world-class artists, massive art installations, and unforgettable California sunset performances. Two weekends of music, fashion, and culture in the Coachella Valley.',
    location: {
      city: 'Indio',
      country: 'USA',
      venueName: 'Empire Polo Club',
      coordinates: { lat: 33.6803, lng: -116.2374 }
    },
    startDate: '2025-04-11',
    endDate: '2025-04-20',
    officialUrl: 'https://www.coachella.com/',
    affiliateOnly: true,
    imageQuery: 'music festival desert california coachella valley',
    trademark: TRADEMARK_COACHELLA,
    featured: true
  },

  {
    id: 'monaco-grand-prix-2025',
    name: 'Monaco Grand Prix 2025',
    slug: 'monaco-grand-prix-2025',
    type: 'sports',
    description: 'The crown jewel of motorsport! Experience Formula 1 racing through the legendary Monte Carlo street circuit, surrounded by luxury yachts, champagne celebrations, and the unmatched glamour of Monaco.',
    location: {
      city: 'Monaco',
      country: 'Monaco',
      venueName: 'Circuit de Monaco',
      coordinates: { lat: 43.7384, lng: 7.4246 }
    },
    startDate: '2025-05-23',
    endDate: '2025-05-25',
    officialUrl: undefined,
    affiliateOnly: true,
    imageQuery: 'formula 1 racing monte carlo monaco',
    trademark: TRADEMARK_F1,
    featured: true
  },

  {
    id: 'wimbledon-2025',
    name: 'Wimbledon Championships 2025',
    slug: 'wimbledon-2025',
    type: 'sports',
    description: 'The most prestigious tennis tournament in the world! Experience championship tennis on perfectly manicured grass courts at the All England Club, complete with British tradition, strawberries and cream, and world-class competition.',
    location: {
      city: 'London',
      country: 'United Kingdom',
      venueName: 'All England Lawn Tennis Club',
      coordinates: { lat: 51.4343, lng: -0.2141 }
    },
    startDate: '2025-06-30',
    endDate: '2025-07-13',
    officialUrl: 'https://www.wimbledon.com/',
    affiliateOnly: true,
    imageQuery: 'tennis grass court championship london wimbledon',
    trademark: TRADEMARK_WIMBLEDON,
    featured: true
  },

  {
    id: 'rio-carnival-2026',
    name: 'Rio Carnival 2026',
    slug: 'rio-carnival-2026',
    type: 'festival',
    description: 'The world\'s most famous carnival celebration! Experience five days of spectacular samba parades, vibrant costumes, street parties, and Brazilian culture at its most colorful and energetic in Rio de Janeiro.',
    location: {
      city: 'Rio de Janeiro',
      country: 'Brazil',
      venueName: 'Sambadrome & City Streets',
      coordinates: { lat: -22.9068, lng: -43.1729 }
    },
    startDate: '2026-02-13',
    endDate: '2026-02-17',
    officialUrl: undefined,
    affiliateOnly: false,
    imageQuery: 'rio carnival samba parade brazil',
    trademark: undefined,
    featured: true
  },

  {
    id: 'oktoberfest-2025',
    name: 'Oktoberfest 2025',
    slug: 'oktoberfest-2025',
    type: 'festival',
    description: 'The world\'s largest Volksfest! Experience authentic Bavarian culture with traditional beer tents, live music, regional cuisine, and centuries-old traditions at Munich\'s legendary Theresienwiese grounds.',
    location: {
      city: 'Munich',
      country: 'Germany',
      venueName: 'Theresienwiese',
      coordinates: { lat: 48.1319, lng: 11.5497 }
    },
    startDate: '2025-09-20',
    endDate: '2025-10-05',
    officialUrl: 'https://www.oktoberfest.de/',
    affiliateOnly: false,
    imageQuery: 'oktoberfest beer tents munich germany',
    trademark: undefined,
    featured: true
  },

  {
    id: 'burning-man-2025',
    name: 'Burning Man 2025',
    slug: 'burning-man-2025',
    type: 'festival',
    description: 'An annual experiment in radical self-expression and self-reliance in Nevada\'s Black Rock Desert. Experience massive art installations, theme camps, and a temporary city built on community, creativity, and participation.',
    location: {
      city: 'Black Rock City',
      country: 'USA',
      venueName: 'Black Rock Desert',
      coordinates: { lat: 40.7864, lng: -119.2065 }
    },
    startDate: '2025-08-24',
    endDate: '2025-09-01',
    officialUrl: 'https://burningman.org/',
    affiliateOnly: false,
    imageQuery: 'burning man desert art festival nevada',
    trademark: {
      isTrademarked: true,
      trademarkOwner: 'Burning Man Project',
      disclaimer: 'GladysTravelAI is not affiliated with or endorsed by Burning Man Project. Burning Man™ is a trademark of Burning Man Project.'
    },
    featured: true
  },

  {
    id: 'glastonbury-2025',
    name: 'Glastonbury Festival 2025',
    slug: 'glastonbury-2025',
    type: 'music',
    description: 'The legendary five-day festival of contemporary performing arts! Experience world-class music, dance, comedy, theatre, and circus acts across dozens of stages on a working farm in Somerset, England.',
    location: {
      city: 'Pilton',
      country: 'United Kingdom',
      venueName: 'Worthy Farm',
      coordinates: { lat: 51.1530, lng: -2.5831 }
    },
    startDate: '2025-06-25',
    endDate: '2025-06-29',
    officialUrl: 'https://www.glastonburyfestivals.co.uk/',
    affiliateOnly: true,
    imageQuery: 'glastonbury music festival uk countryside',
    trademark: {
      isTrademarked: true,
      trademarkOwner: 'Glastonbury Festivals Ltd',
      disclaimer: 'GladysTravelAI is not affiliated with or endorsed by Glastonbury Festivals Ltd. Glastonbury™ is a trademark of Glastonbury Festivals Ltd.'
    },
    featured: true
  }
];

// ==================== HELPER FUNCTIONS ====================

export const getFeaturedEvents = (): Event[] => {
  return FEATURED_EVENTS.filter(event => event.featured === true)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
};

export const getEventById = (id: string): Event | undefined => {
  return FEATURED_EVENTS.find(event => event.id === id);
};

export const getEventBySlug = (slug: string): Event | undefined => {
  return FEATURED_EVENTS.find(event => event.slug === slug);
};

export const getEventsByType = (type: Event['type']): Event[] => {
  return FEATURED_EVENTS.filter(event => event.type === type)
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
  if (!query || query.trim().length === 0) {
    return FEATURED_EVENTS;
  }

  const searchTerm = query.toLowerCase().trim();
  
  return FEATURED_EVENTS.filter(event =>
    event.name.toLowerCase().includes(searchTerm) ||
    event.description.toLowerCase().includes(searchTerm) ||
    event.location.city.toLowerCase().includes(searchTerm) ||
    event.location.country.toLowerCase().includes(searchTerm) ||
    event.location.venueName?.toLowerCase().includes(searchTerm) ||
    event.slug.toLowerCase().includes(searchTerm)
  ).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
};

export const getEventsByCity = (city: string): Event[] => {
  return FEATURED_EVENTS.filter(event => 
    event.location.city.toLowerCase().includes(city.toLowerCase())
  ).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
};

export const getEventsByCountry = (country: string): Event[] => {
  return FEATURED_EVENTS.filter(event => 
    event.location.country.toLowerCase().includes(country.toLowerCase())
  ).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
};

export const getTrademarkedEvents = (): Event[] => {
  return FEATURED_EVENTS.filter(event => event.trademark?.isTrademarked === true);
};

export const getEventsByDateRange = (startDate: Date, endDate: Date): Event[] => {
  return FEATURED_EVENTS.filter(event => {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    
    return (
      (eventStart >= startDate && eventStart <= endDate) ||
      (eventEnd >= startDate && eventEnd <= endDate) ||
      (eventStart <= startDate && eventEnd >= endDate)
    );
  }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
};