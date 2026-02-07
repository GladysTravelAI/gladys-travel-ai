// lib/eventLandmarkMaps.ts
// EVENT-FIRST landmark mapping for GladysTravelAI
// Prioritizes event venues, stadiums, concert halls, and festival grounds

/**
 * EVENT TYPE DEFINITIONS
 * Maps to Ticketmaster categories and GladysTravelAI event types
 */
export type EventType = 
  | 'concert' 
  | 'sports' 
  | 'festival' 
  | 'theater' 
  | 'comedy'
  | 'arts'
  | 'family'
  | 'conference'
  | 'explore'; // For general city exploration

/**
 * LANDMARK MAP DATA
 * Comprehensive data about a destination's venues and landmarks
 */
export interface LandmarkMapData {
  destination: string;
  venues: {
    concerts: string[];
    sports: string[];
    festivals: string[];
    theaters: string[];
  };
  landmarks: string[];
  topVenues: string[]; // Combined top 5 venues across all categories
  searchQuery: string; // Optimized search query for images/maps
}

/**
 * EVENT VENUE MAPPING
 * Maps major cities to their iconic event venues
 * Priority: Event venues > Tourist landmarks
 */
export const EVENT_VENUES: Record<string, {
  concerts: string[];
  sports: string[];
  festivals: string[];
  theaters: string[];
  general: string[];
}> = {
  // ==================== NORTH AMERICA ====================
  'new york': {
    concerts: ['madison square garden', 'barclays center', 'radio city music hall', 'apollo theater'],
    sports: ['yankee stadium', 'citi field', 'madison square garden', 'barclays center'],
    festivals: ['central park summerstage', 'governors ball', 'electric zoo', 'bryant park'],
    theaters: ['broadway theater district', 'lincoln center', 'carnegie hall'],
    general: ['times square', 'central park', 'brooklyn bridge', 'statue of liberty']
  },
  'los angeles': {
    concerts: ['hollywood bowl', 'staples center', 'the forum', 'greek theatre'],
    sports: ['dodger stadium', 'staples center', 'rose bowl', 'sofi stadium'],
    festivals: ['coachella valley', 'outside lands', 'fyi fest'],
    theaters: ['dolby theatre', 'pantages theatre', 'greek theatre'],
    general: ['hollywood sign', 'santa monica pier', 'griffith observatory', 'venice beach']
  },
  'chicago': {
    concerts: ['united center', 'aragon ballroom', 'metro', 'riviera theatre'],
    sports: ['wrigley field', 'soldier field', 'united center', 'guaranteed rate field'],
    festivals: ['lollapalooza', 'pitchfork music festival', 'chicago blues festival', 'grant park'],
    theaters: ['chicago theatre', 'steppenwolf theatre', 'goodman theatre'],
    general: ['cloud gate bean', 'millennium park', 'navy pier', 'willis tower']
  },
  'las vegas': {
    concerts: ['t-mobile arena', 'mgm grand garden', 'allegiant stadium', 'park theater'],
    sports: ['allegiant stadium', 't-mobile arena', 'las vegas ballpark'],
    festivals: ['electric daisy carnival', 'life is beautiful', 'when we were young'],
    theaters: ['colosseum caesars palace', 'dolby live', 'park mgm'],
    general: ['las vegas strip', 'bellagio fountains', 'fremont street', 'high roller']
  },
  'miami': {
    concerts: ['ftx arena', 'hard rock stadium', 'fillmore miami beach', 'bayfront park'],
    sports: ['hard rock stadium', 'ftx arena', 'marlins park', 'miami open'],
    festivals: ['ultra music festival', 'rolling loud', 'art basel', 'wynwood'],
    theaters: ['adrienne arsht center', 'fillmore miami beach'],
    general: ['south beach', 'ocean drive', 'wynwood walls', 'vizcaya museum']
  },
  'toronto': {
    concerts: ['scotiabank arena', 'budweiser stage', 'massey hall', 'rebel'],
    sports: ['scotiabank arena', 'rogers centre', 'bmo field'],
    festivals: ['toronto international film festival', 'caribana', 'veld music festival'],
    theaters: ['princess of wales theatre', 'royal alexandra theatre', 'four seasons centre'],
    general: ['cn tower', 'distillery district', 'casa loma', 'harbourfront']
  },

  // ==================== EUROPE ====================
  'london': {
    concerts: ['o2 arena', 'wembley stadium', 'royal albert hall', 'apollo'],
    sports: ['wembley stadium', 'emirates stadium', 'stamford bridge', 'wimbledon'],
    festivals: ['glastonbury', 'hyde park bst', 'wireless festival', 'notting hill carnival'],
    theaters: ['west end theatres', 'royal opera house', 'national theatre'],
    general: ['big ben', 'tower bridge', 'buckingham palace', 'london eye']
  },
  'paris': {
    concerts: ['accor arena', 'zenith paris', 'olympia', 'philharmonie de paris'],
    sports: ['stade de france', 'parc des princes', 'roland garros', 'accor arena'],
    festivals: ['rock en seine', 'paris jazz festival', 'fete de la musique'],
    theaters: ['palais garnier', 'comedie francaise', 'theatre du chatelet'],
    general: ['eiffel tower', 'louvre museum', 'arc de triomphe', 'notre dame']
  },
  'barcelona': {
    concerts: ['palau sant jordi', 'razzmatazz', 'apolo', 'sala bikini'],
    sports: ['camp nou', 'palau sant jordi', 'estadi olimpic', 'circuit de catalunya'],
    festivals: ['primavera sound', 'sonar', 'la merce festival'],
    theaters: ['gran teatre del liceu', 'palau de la musica catalana'],
    general: ['sagrada familia', 'park guell', 'la rambla', 'casa batllo']
  },
  'amsterdam': {
    concerts: ['ziggo dome', 'afas live', 'paradiso', 'melkweg'],
    sports: ['johan cruyff arena', 'ziggo dome', 'olympic stadium'],
    festivals: ['amsterdam dance event', 'king\'s day', 'awakenings'],
    theaters: ['royal concertgebouw', 'tuschinski theatre'],
    general: ['canal houses', 'rijksmuseum', 'anne frank house', 'dam square']
  },
  'berlin': {
    concerts: ['mercedes-benz arena', 'olympiastadion', 'berghain', 'tempodrom'],
    sports: ['olympiastadion', 'mercedes-benz arena', 'velodrom'],
    festivals: ['berlin festival', 'lollapalooza berlin', 'atonal'],
    theaters: ['berlin philharmonic', 'deutsche oper', 'volksbuhne'],
    general: ['brandenburg gate', 'berlin wall', 'reichstag', 'museum island']
  },

  // ==================== ASIA ====================
  'tokyo': {
    concerts: ['tokyo dome', 'nippon budokan', 'saitama super arena', 'zepp'],
    sports: ['tokyo dome', 'national stadium', 'saitama super arena', 'ariake arena'],
    festivals: ['summer sonic', 'fuji rock', 'ultra japan'],
    theaters: ['kabuki-za theatre', 'tokyo opera city', 'bunkamura'],
    general: ['tokyo tower', 'shibuya crossing', 'senso-ji temple', 'mount fuji']
  },
  'seoul': {
    concerts: ['kspo dome', 'jamsil olympic stadium', 'blue square', 'yes24 live hall'],
    sports: ['seoul world cup stadium', 'jamsil baseball stadium', 'kspo dome'],
    festivals: ['seoul jazz festival', 'ultra korea', 'world dj festival'],
    theaters: ['sejong center', 'national theater of korea'],
    general: ['gyeongbokgung palace', 'n seoul tower', 'bukchon hanok', 'gangnam']
  },
  'singapore': {
    concerts: ['singapore indoor stadium', 'esplanade theatres', 'star theatre'],
    sports: ['singapore indoor stadium', 'national stadium', 'singapore f1'],
    festivals: ['ultra singapore', 'zoukout', 'st jerome\'s laneway'],
    theaters: ['esplanade theatres', 'victoria theatre'],
    general: ['marina bay sands', 'gardens by the bay', 'merlion', 'sentosa']
  },

  // ==================== AUSTRALIA ====================
  'sydney': {
    concerts: ['sydney opera house', 'qudos bank arena', 'hordern pavilion', 'enmore theatre'],
    sports: ['sydney cricket ground', 'anz stadium', 'qudos bank arena'],
    festivals: ['vivid sydney', 'splendour in the grass', 'field day'],
    theaters: ['sydney opera house', 'capitol theatre', 'state theatre'],
    general: ['sydney opera house', 'harbour bridge', 'bondi beach', 'darling harbour']
  },
  'melbourne': {
    concerts: ['rod laver arena', 'margaret court arena', 'forum melbourne'],
    sports: ['melbourne cricket ground', 'etihad stadium', 'rod laver arena'],
    festivals: ['australian open', 'moomba festival', 'st kilda festival'],
    theaters: ['princess theatre', 'regent theatre', 'her majesty\'s theatre'],
    general: ['federation square', 'flinders street station', 'great ocean road']
  },

  // ==================== LATIN AMERICA ====================
  'rio de janeiro': {
    concerts: ['jeunesse arena', 'maracana stadium', 'citibank hall'],
    sports: ['maracana stadium', 'olympic park', 'sambadrome'],
    festivals: ['carnival', 'rock in rio', 'lollapalooza brazil'],
    theaters: ['theatro municipal', 'cidade das artes'],
    general: ['christ the redeemer', 'sugarloaf mountain', 'copacabana beach', 'ipanema']
  },
  'buenos aires': {
    concerts: ['luna park', 'movistar arena', 'teatro colon'],
    sports: ['la bombonera', 'el monumental', 'movistar arena'],
    festivals: ['lollapalooza argentina', 'personal fest', 'tango festival'],
    theaters: ['teatro colon', 'teatro nacional cervantes'],
    general: ['obelisco', 'la boca', 'recoleta cemetery', 'teatro colon']
  },

  // ==================== MIDDLE EAST ====================
  'dubai': {
    concerts: ['coca-cola arena', 'dubai opera', 'burj park'],
    sports: ['dubai autodrome', 'dubai sports city', 'meydan racecourse'],
    festivals: ['dubai jazz festival', 'redFestDXB', 'dubai shopping festival'],
    theaters: ['dubai opera', 'madinat theatre'],
    general: ['burj khalifa', 'palm jumeirah', 'dubai mall', 'burj al arab']
  },

  // ==================== AFRICA ====================
  'cape town': {
    concerts: ['cape town stadium', 'grand arena', 'kirstenbosch'],
    sports: ['cape town stadium', 'newlands cricket ground'],
    festivals: ['cape town jazz festival', 'rocking the daisies', 'afropunk'],
    theaters: ['artscape theatre', 'baxter theatre'],
    general: ['table mountain', 'robben island', 'victoria alfred waterfront', 'cape point']
  },
};

/**
 * FETCH LANDMARK MAPS DATA
 * Returns comprehensive venue and landmark data for a destination
 * Can be used to enhance maps, image searches, and venue displays
 */
export async function fetchLandmarkMaps(destination: string): Promise<LandmarkMapData | null> {
  const normalized = destination.toLowerCase().trim();
  const venues = EVENT_VENUES[normalized];

  if (!venues) {
    // Unknown destination - return null or basic data
    return {
      destination,
      venues: {
        concerts: [],
        sports: [],
        festivals: [],
        theaters: []
      },
      landmarks: [],
      topVenues: [],
      searchQuery: `${destination} landmarks venues`
    };
  }

  // Combine top venues from all categories
  const topVenues = [
    ...venues.concerts.slice(0, 2),
    ...venues.sports.slice(0, 1),
    ...venues.festivals.slice(0, 1),
    ...venues.general.slice(0, 1)
  ];

  // Build optimized search query
  const searchQuery = buildEventQuery(destination, 'explore');

  return {
    destination,
    venues: {
      concerts: venues.concerts,
      sports: venues.sports,
      festivals: venues.festivals,
      theaters: venues.theaters
    },
    landmarks: venues.general,
    topVenues,
    searchQuery
  };
}

/**
 * EVENT-SPECIFIC SEARCH QUERIES
 * Builds intelligent search queries based on event type and destination
 */
export function buildEventQuery(
  destination: string,
  eventType: EventType = 'explore'
): string {
  const normalized = destination.toLowerCase().trim();
  const venues = EVENT_VENUES[normalized];

  if (!venues) {
    // Unknown destination - use generic event query
    return `${destination} ${eventType} venue event`;
  }

  // Build query based on event type
  switch (eventType) {
    case 'concert':
      return `${venues.concerts.slice(0, 3).join(' ')} ${destination} concert venue`;
    
    case 'sports':
      return `${venues.sports.slice(0, 3).join(' ')} ${destination} stadium arena`;
    
    case 'festival':
      return `${venues.festivals.slice(0, 3).join(' ')} ${destination} festival grounds`;
    
    case 'theater':
      return `${venues.theaters.slice(0, 2).join(' ')} ${destination} theater venue`;
    
    case 'explore':
      // Mix of venues + landmarks for city exploration
      const mixed = [
        ...venues.general.slice(0, 2),
        ...venues.concerts.slice(0, 1)
      ];
      return `${mixed.join(' ')} ${destination}`;
    
    default:
      return `${venues.general.slice(0, 3).join(' ')} ${destination}`;
  }
}

/**
 * Get venue names for a destination and event type
 */
export function getEventVenues(
  destination: string,
  eventType: EventType = 'explore'
): string[] {
  const normalized = destination.toLowerCase().trim();
  const venues = EVENT_VENUES[normalized];

  if (!venues) return [];

  switch (eventType) {
    case 'concert':
      return venues.concerts;
    case 'sports':
      return venues.sports;
    case 'festival':
      return venues.festivals;
    case 'theater':
      return venues.theaters;
    case 'explore':
      return venues.general;
    default:
      return venues.general;
  }
}

/**
 * Detect event type from event name/description
 * Used when you have event data from Ticketmaster
 */
export function detectEventType(eventName: string): EventType {
  const lower = eventName.toLowerCase();

  // Sports keywords
  if (
    /\b(nba|nfl|mlb|nhl|premier league|champions league|world cup|soccer|football|basketball|baseball|hockey|tennis|golf|f1|formula 1|ufc|boxing|wrestling)\b/.test(lower)
  ) {
    return 'sports';
  }

  // Festival keywords
  if (
    /\b(festival|fest|coachella|lollapalooza|glastonbury|tomorrowland|ultra|edc|burning man)\b/.test(lower)
  ) {
    return 'festival';
  }

  // Theater keywords
  if (
    /\b(broadway|musical|play|theater|theatre|opera|ballet|symphony|orchestra)\b/.test(lower)
  ) {
    return 'theater';
  }

  // Comedy keywords
  if (/\b(comedy|comedian|stand.?up|laugh)\b/.test(lower)) {
    return 'comedy';
  }

  // Concert keywords (default for music events)
  if (
    /\b(concert|tour|live|show|performance|band|artist|singer|rapper|dj)\b/.test(lower)
  ) {
    return 'concert';
  }

  // Default to explore
  return 'explore';
}

/**
 * Build search query with event context
 * Use this when you have specific event information
 */
export function buildEventContextQuery(params: {
  destination: string;
  eventName?: string;
  eventType?: EventType;
  venueName?: string;
}): string {
  const { destination, eventName, eventType, venueName } = params;

  // If we have venue name, prioritize it
  if (venueName) {
    return `${venueName} ${destination} venue`;
  }

  // Detect event type from name if not provided
  const type = eventType || (eventName ? detectEventType(eventName) : 'explore');

  // Build query based on event type
  return buildEventQuery(destination, type);
}

/**
 * BACKWARD COMPATIBILITY
 * Export landmark maps for general travel queries
 */
export const DESTINATION_LANDMARKS = Object.entries(EVENT_VENUES).reduce(
  (acc, [city, venues]) => {
    acc[city] = venues.general;
    return acc;
  },
  {} as Record<string, string[]>
);

export function getLandmarks(destination: string): string[] {
  return getEventVenues(destination, 'explore');
}

export function buildSearchQuery(
  destination: string,
  includeLandmark: boolean = true
): string {
  if (!includeLandmark) {
    return `${destination} city skyline landmark`;
  }
  return buildEventQuery(destination, 'explore');
}

export function getDestinationKey(destination: string): string {
  return destination.toLowerCase().trim();
}