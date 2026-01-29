// lib/search-intent-classifier.ts
// 🧠 Classifies search queries as event-led, experience-led, or destination-led

export type SearchIntent = 'event-led' | 'experience-led' | 'destination-led';

export interface SearchIntentResult {
  intent: SearchIntent;
  confidence: number;
  entityType?: 'artist' | 'team' | 'festival' | 'league' | 'venue' | 'city' | 'generic';
  suggestedQuery?: string;
  explanation?: string;
}

// 🎯 ENTITY DATABASES

// Major sports teams
const SPORTS_TEAMS = [
  // NBA
  'lakers', 'celtics', 'warriors', 'heat', 'knicks', 'bulls', 'nets', 'clippers',
  'bucks', 'mavericks', 'nuggets', 'suns', 'raptors', '76ers', 'sixers',
  
  // NFL
  'patriots', 'cowboys', 'packers', 'steelers', '49ers', 'eagles', 'chiefs',
  'ravens', 'seahawks', 'rams', 'broncos',
  
  // MLB
  'yankees', 'red sox', 'dodgers', 'cubs', 'giants', 'astros', 'braves',
  
  // Soccer
  'barcelona', 'real madrid', 'manchester united', 'liverpool', 'chelsea',
  'arsenal', 'bayern munich', 'juventus', 'psg', 'man city', 'inter milan',
  'ac milan', 'ajax', 'benfica', 'porto',
  
  // Other
  'maple leafs', 'canadiens', 'bruins', 'blackhawks', 'penguins'
];

// Major artists (top touring artists)
const ARTISTS = [
  'taylor swift', 'beyonce', 'drake', 'ed sheeran', 'coldplay', 'billie eilish',
  'the weeknd', 'bruno mars', 'post malone', 'ariana grande', 'travis scott',
  'imagine dragons', 'twenty one pilots', 'maroon 5', 'justin bieber',
  'rihanna', 'harry styles', 'dua lipa', 'lady gaga', 'adele', 'kanye west',
  'kendrick lamar', 'eminem', 'metallica', 'guns n roses', 'rolling stones',
  'paul mccartney', 'u2', 'bts', 'blackpink', 'bad bunny', 'karol g'
];

// Major festivals
const FESTIVALS = [
  'coachella', 'glastonbury', 'tomorrowland', 'lollapalooza', 'burning man',
  'ultra', 'edc', 'bonnaroo', 'sxsw', 'comic con', 'sundance', 'cannes',
  'oktoberfest', 'mardi gras', 'carnival', 'art basel', 'electric daisy',
  'creamfields', 'reading festival', 'leeds festival', 'wireless festival'
];

// Sports leagues & competitions
const LEAGUES_COMPETITIONS = [
  'nba', 'nfl', 'mlb', 'nhl', 'mls', 'premier league', 'la liga', 'serie a',
  'bundesliga', 'champions league', 'europa league', 'world cup', 'super bowl',
  'world series', 'stanley cup', 'march madness', 'ncaa', 'uefa', 'fifa',
  'olympics', 'commonwealth games', 'f1', 'formula 1', 'formula one', 'moto gp',
  'wimbledon', 'us open', 'french open', 'australian open', 'masters', 'pga',
  'ufc', 'boxing', 'wrestlemania', 'wwe'
];

// Experience keywords (indicate user wants event type, not specific event)
const EXPERIENCE_KEYWORDS = [
  'concert', 'game', 'match', 'festival', 'show', 'tournament', 'championship',
  'race', 'fight', 'tour', 'performance', 'exhibition', 'conference', 'convention'
];

// Cities (to detect destination searches)
const MAJOR_CITIES = [
  'london', 'paris', 'new york', 'tokyo', 'los angeles', 'chicago', 'miami',
  'barcelona', 'rome', 'amsterdam', 'dubai', 'singapore', 'hong kong', 'sydney',
  'melbourne', 'toronto', 'vancouver', 'berlin', 'madrid', 'lisbon', 'vienna',
  'prague', 'budapest', 'athens', 'istanbul', 'bangkok', 'seoul', 'mumbai',
  'delhi', 'shanghai', 'beijing', 'moscow', 'sao paulo', 'rio de janeiro',
  'buenos aires', 'mexico city', 'cape town', 'johannesburg', 'cairo'
];

/**
 * Classify a search query into event-led, experience-led, or destination-led
 */
export function classifySearchIntent(query: string): SearchIntentResult {
  const normalized = query.toLowerCase().trim();
  
  // 🎯 PRIORITY 1: Event-Led (Specific entities)
  
  // Check for sports teams
  for (const team of SPORTS_TEAMS) {
    if (normalized.includes(team)) {
      return {
        intent: 'event-led',
        confidence: 0.95,
        entityType: 'team',
        suggestedQuery: query,
        explanation: `Detected sports team: "${team}". Searching for ${team} games.`
      };
    }
  }
  
  // Check for artists
  for (const artist of ARTISTS) {
    if (normalized.includes(artist)) {
      return {
        intent: 'event-led',
        confidence: 0.95,
        entityType: 'artist',
        suggestedQuery: query,
        explanation: `Detected artist: "${artist}". Searching for ${artist} concerts.`
      };
    }
  }
  
  // Check for festivals
  for (const festival of FESTIVALS) {
    if (normalized.includes(festival)) {
      return {
        intent: 'event-led',
        confidence: 0.95,
        entityType: 'festival',
        suggestedQuery: query,
        explanation: `Detected festival: "${festival}".`
      };
    }
  }
  
  // Check for leagues/competitions
  for (const league of LEAGUES_COMPETITIONS) {
    if (normalized.includes(league)) {
      return {
        intent: 'event-led',
        confidence: 0.9,
        entityType: 'league',
        suggestedQuery: query,
        explanation: `Detected competition: "${league}".`
      };
    }
  }
  
  // 🎯 PRIORITY 2: Experience-Led (Generic event types)
  
  for (const keyword of EXPERIENCE_KEYWORDS) {
    if (normalized.includes(keyword)) {
      return {
        intent: 'experience-led',
        confidence: 0.85,
        entityType: 'generic',
        suggestedQuery: query,
        explanation: `User looking for "${keyword}" experiences.`
      };
    }
  }
  
  // 🎯 PRIORITY 3: Destination-Led (City names - lowest priority)
  
  for (const city of MAJOR_CITIES) {
    if (normalized === city || normalized.startsWith(city + ' ') || normalized.endsWith(' ' + city)) {
      return {
        intent: 'destination-led',
        confidence: 0.7,
        entityType: 'city',
        suggestedQuery: query,
        explanation: `Detected city: "${city}". This is a destination search - checking for events in ${city}.`
      };
    }
  }
  
  // 🎯 DEFAULT: If unclear, assume experience-led (safer default)
  
  return {
    intent: 'experience-led',
    confidence: 0.5,
    entityType: 'generic',
    suggestedQuery: query,
    explanation: `Unable to classify clearly. Defaulting to experience search.`
  };
}

/**
 * Check if a query is definitely event-related
 */
export function isEventQuery(query: string): boolean {
  const result = classifySearchIntent(query);
  return result.intent !== 'destination-led';
}

/**
 * Get event type hint for search optimization
 */
export function getEventTypeHint(query: string): string | null {
  const normalized = query.toLowerCase();
  
  // Sports
  if (SPORTS_TEAMS.some(team => normalized.includes(team)) ||
      LEAGUES_COMPETITIONS.some(league => normalized.includes(league))) {
    return 'sports';
  }
  
  // Music
  if (ARTISTS.some(artist => normalized.includes(artist)) ||
      normalized.includes('concert') || normalized.includes('tour')) {
    return 'music';
  }
  
  // Festivals
  if (FESTIVALS.some(festival => normalized.includes(festival)) ||
      normalized.includes('festival')) {
    return 'festival';
  }
  
  return null;
}

/**
 * Enhanced search intent with recommendations
 */
export function analyzeSearchIntent(query: string): {
  intent: SearchIntentResult;
  shouldSearchEvents: boolean;
  shouldSearchDestinations: boolean;
  recommendedAction: 'search-events' | 'search-destinations' | 'search-both';
  userMessage?: string;
} {
  const intent = classifySearchIntent(query);
  
  // Event-led: ONLY search events
  if (intent.intent === 'event-led') {
    return {
      intent,
      shouldSearchEvents: true,
      shouldSearchDestinations: false,
      recommendedAction: 'search-events',
      userMessage: `Searching for ${intent.entityType} events: "${query}"`
    };
  }
  
  // Experience-led: Search events, maybe destinations
  if (intent.intent === 'experience-led') {
    return {
      intent,
      shouldSearchEvents: true,
      shouldSearchDestinations: false,
      recommendedAction: 'search-events',
      userMessage: `Searching for events matching: "${query}"`
    };
  }
  
  // Destination-led: Check both (events in that city first)
  return {
    intent,
    shouldSearchEvents: true,
    shouldSearchDestinations: true,
    recommendedAction: 'search-both',
    userMessage: `Searching for events in ${query}`
  };
}

// Export convenience functions
export const searchIntent = {
  classify: classifySearchIntent,
  isEventQuery,
  getEventTypeHint,
  analyze: analyzeSearchIntent
};

export default searchIntent;