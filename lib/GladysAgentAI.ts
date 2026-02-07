// lib/GladysAgentAI.ts
// 🧠 GLADYS AGENT AI - BRAIN / ORCHESTRATOR
// This file is the BRAIN. It returns structured JSON ONLY.
// It does NOT speak conversationally or render UI.

import { eventService } from "./eventService";

// ==================== TYPES ====================

export type IntentType = 'EVENT' | 'DESTINATION' | 'HYBRID' | 'GENERAL';
export type EventType = 'SPORTS' | 'MUSIC' | 'FESTIVAL' | 'CONFERENCE' | 'THEATER' | 'OTHER';

export interface AgentAnalysis {
  intent: IntentType;
  confidence: number;
  
  // Event-specific
  eventType?: EventType;
  entity?: string;          // "Lakers", "Taylor Swift", "Coachella"
  entityType?: 'team' | 'artist' | 'festival' | 'league' | 'venue';
  
  // Location
  city?: string;
  venue?: string;
  country?: string;
  
  // Extracted context
  context: {
    detectedTeam?: string;
    detectedArtist?: string;
    detectedFestival?: string;
    detectedLeague?: string;
    detectedVenue?: string;
    detectedDate?: string;
    detectedBudget?: 'budget' | 'moderate' | 'luxury';
    numberOfTravelers?: number;
  };
  
  // Actions to take
  suggestedActions: string[]; // ["search_events", "build_trip", "compare_prices"]
  
  // Routing
  shouldNavigateTo?: '/events' | '/events/[id]' | '/itinerary';
  searchParams?: Record<string, string>;
}

export interface EventSearchResult {
  id: string;
  name: string;
  type: EventType;
  startDate: string;
  venue: {
    name: string;
    city: string;
    country: string;
  };
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  source: string;
  image?: string;
}

export interface PriceComparison {
  provider: string;
  price: number;
  fees: number;
  total: number;
  commission: number;
  rating: number;
  features: string[];
  recommended: boolean;
  affiliateUrl: string;
}

export interface TripPlan {
  event: EventSearchResult;
  tickets: PriceComparison[];
  flights: any[];
  hotels: any[];
  totalCost: number;
  totalCommission: number;
  savings: number;
  optimized: boolean;
}

// ==================== ENTITY DATABASES ====================

const SPORTS_TEAMS = [
  // NBA
  'lakers', 'celtics', 'warriors', 'bulls', 'heat', 'knicks', 'nets', 'bucks',
  'clippers', 'mavericks', 'rockets', 'suns', 'nuggets', 'trail blazers',
  
  // NFL
  'patriots', 'cowboys', 'packers', '49ers', 'steelers', 'eagles', 'chiefs',
  'ravens', 'rams', 'seahawks', 'broncos', 'saints',
  
  // Soccer
  'barcelona', 'real madrid', 'manchester united', 'liverpool', 'chelsea',
  'arsenal', 'bayern munich', 'juventus', 'psg', 'inter miami'
];

const MUSIC_ARTISTS = [
  'taylor swift', 'beyonce', 'drake', 'bad bunny', 'ed sheeran',
  'the weeknd', 'billie eilish', 'ariana grande', 'kanye west',
  'travis scott', 'post malone', 'imagine dragons', 'coldplay',
  'bruno mars', 'adele', 'rihanna', 'justin bieber'
];

const FESTIVALS = [
  'coachella', 'lollapalooza', 'bonnaroo', 'glastonbury', 'tomorrowland',
  'burning man', 'ultra', 'edc', 'sxsw', 'comic-con', 'essence fest'
];

const LEAGUES = [
  'nba', 'nfl', 'mlb', 'nhl', 'mls', 'premier league', 'la liga',
  'champions league', 'super bowl', 'world cup', 'f1', 'ufc'
];

// ==================== GLADYS AGENT AI CLASS ====================

export class GladysAgentAI {
  
  // ==================== CORE ANALYSIS ====================
  
  /**
   * Analyze user query and return structured intent
   * This is the MAIN entry point
   */
  async analyzeQuery(query: string, context?: any): Promise<AgentAnalysis> {
    const normalized = query.toLowerCase().trim();
    
    // 1. Detect intent type
    const intent = this.detectIntent(normalized);
    
    // 2. Extract entities
    const entities = this.extractEntities(normalized);
    
    // 3. Detect event type
    const eventType = this.detectEventType(normalized, entities);
    
    // 4. Extract location
    const location = this.extractLocation(normalized);
    
    // 5. Extract context (budget, dates, etc.)
    const extractedContext = this.extractContext(normalized);
    
    // 6. Determine suggested actions
    const suggestedActions = this.determineSuggestedActions(intent, entities, extractedContext);
    
    // 7. Determine routing
    const routing = this.determineRouting(intent, entities);
    
    // Build final analysis
    return {
      intent,
      confidence: this.calculateConfidence(intent, entities),
      eventType,
      entity: entities.primary,
      entityType: entities.type,
      city: location.city,
      venue: location.venue,
      country: location.country,
      context: {
        ...extractedContext,
        detectedTeam: entities.team,
        detectedArtist: entities.artist,
        detectedFestival: entities.festival,
        detectedLeague: entities.league,
        detectedVenue: location.venue,
      },
      suggestedActions,
      shouldNavigateTo: routing.navigateTo,
      searchParams: routing.params
    };
  }
  
  // ==================== INTENT DETECTION ====================
  
  private detectIntent(query: string): IntentType {
    // EVENT intent triggers
    const eventTriggers = [
      ...SPORTS_TEAMS,
      ...MUSIC_ARTISTS,
      ...FESTIVALS,
      ...LEAGUES
    ];
    
    const hasEventEntity = eventTriggers.some(trigger => 
      query.includes(trigger.toLowerCase())
    );
    
    // Check for event keywords
    const eventKeywords = [
      'game', 'match', 'concert', 'show', 'festival', 'championship',
      'tour', 'event', 'tickets', 'watch', 'see play', 'see perform'
    ];
    
    const hasEventKeyword = eventKeywords.some(kw => query.includes(kw));
    
    // DESTINATION triggers
    const destinationKeywords = [
      'visit', 'trip to', 'vacation in', 'traveling to', 'explore',
      'tour of', 'sightseeing in', 'holiday in'
    ];
    
    const hasDestinationKeyword = destinationKeywords.some(kw => query.includes(kw));
    
    // City detection
    const cities = this.extractLocation(query);
    const hasCity = !!cities.city;
    
    // Decision logic
    if (hasEventEntity || hasEventKeyword) {
      if (hasCity && hasDestinationKeyword) {
        return 'HYBRID'; // "Lakers game in LA and explore the city"
      }
      return 'EVENT';
    }
    
    if (hasCity || hasDestinationKeyword) {
      return 'DESTINATION';
    }
    
    return 'GENERAL';
  }
  
  // ==================== ENTITY EXTRACTION ====================
  
  private extractEntities(query: string): {
    primary?: string;
    type?: 'team' | 'artist' | 'festival' | 'league' | 'venue';
    team?: string;
    artist?: string;
    festival?: string;
    league?: string;
  } {
    // Check sports teams
    for (const team of SPORTS_TEAMS) {
      if (query.includes(team.toLowerCase())) {
        return {
          primary: team,
          type: 'team',
          team: team
        };
      }
    }
    
    // Check artists
    for (const artist of MUSIC_ARTISTS) {
      if (query.includes(artist.toLowerCase())) {
        return {
          primary: artist,
          type: 'artist',
          artist: artist
        };
      }
    }
    
    // Check festivals
    for (const festival of FESTIVALS) {
      if (query.includes(festival.toLowerCase())) {
        return {
          primary: festival,
          type: 'festival',
          festival: festival
        };
      }
    }
    
    // Check leagues
    for (const league of LEAGUES) {
      if (query.includes(league.toLowerCase())) {
        return {
          primary: league,
          type: 'league',
          league: league
        };
      }
    }
    
    return {};
  }
  
  // ==================== EVENT TYPE DETECTION ====================
  
  private detectEventType(query: string, entities: any): EventType | undefined {
    if (entities.team || entities.league) return 'SPORTS';
    if (entities.artist) return 'MUSIC';
    if (entities.festival) return 'FESTIVAL';
    
    // Keyword-based detection
    if (/(sports?|game|match|championship)/i.test(query)) return 'SPORTS';
    if (/(concert|show|tour|perform)/i.test(query)) return 'MUSIC';
    if (/(festival|fest)/i.test(query)) return 'FESTIVAL';
    if (/(conference|summit|expo)/i.test(query)) return 'CONFERENCE';
    if (/(play|theater|broadway)/i.test(query)) return 'THEATER';
    
    return undefined;
  }
  
  // ==================== LOCATION EXTRACTION ====================
  
  private extractLocation(query: string): {
    city?: string;
    venue?: string;
    country?: string;
  } {
    // Common cities
    const cities = [
      'new york', 'los angeles', 'chicago', 'houston', 'phoenix',
      'philadelphia', 'san antonio', 'san diego', 'dallas', 'austin',
      'miami', 'atlanta', 'boston', 'seattle', 'denver', 'las vegas',
      'portland', 'nashville', 'detroit', 'charlotte',
      'london', 'paris', 'barcelona', 'madrid', 'rome', 'berlin',
      'tokyo', 'sydney', 'dubai', 'singapore', 'hong kong'
    ];
    
    for (const city of cities) {
      if (query.includes(city.toLowerCase())) {
        return { city };
      }
    }
    
    // Common venues
    const venues = [
      'madison square garden', 'staples center', 'crypto.com arena',
      'wembley', 'camp nou', 'bernabeu'
    ];
    
    for (const venue of venues) {
      if (query.includes(venue.toLowerCase())) {
        return { venue };
      }
    }
    
    return {};
  }
  
  // ==================== CONTEXT EXTRACTION ====================
  
  private extractContext(query: string): {
    detectedDate?: string;
    detectedBudget?: 'budget' | 'moderate' | 'luxury';
    numberOfTravelers?: number;
  } {
    const context: any = {};
    
    // Budget detection
    if (/(luxury|premium|expensive|5.?star)/i.test(query)) {
      context.detectedBudget = 'luxury';
    } else if (/(budget|cheap|affordable|economical)/i.test(query)) {
      context.detectedBudget = 'budget';
    } else {
      context.detectedBudget = 'moderate';
    }
    
    // Number of travelers
    const travelersMatch = query.match(/(\d+)\s+(people|person|traveler|guest)/i);
    if (travelersMatch) {
      context.numberOfTravelers = parseInt(travelersMatch[1]);
    }
    
    // Date extraction (basic)
    if (/(next week|this weekend|tomorrow)/i.test(query)) {
      context.detectedDate = 'soon';
    }
    
    return context;
  }
  
  // ==================== ACTION DETERMINATION ====================
  
  private determineSuggestedActions(
    intent: IntentType,
    entities: any,
    context: any
  ): string[] {
    const actions: string[] = [];
    
    if (intent === 'EVENT') {
      actions.push('search_events');
      
      if (entities.primary) {
        actions.push('show_event_list');
        actions.push('build_trip');
      }
      
      actions.push('compare_ticket_prices');
    }
    
    if (intent === 'DESTINATION') {
      actions.push('show_destination_info');
      actions.push('find_hotels');
      actions.push('find_restaurants');
    }
    
    if (intent === 'HYBRID') {
      actions.push('search_events');
      actions.push('show_destination_info');
      actions.push('build_trip');
    }
    
    return actions;
  }
  
  // ==================== ROUTING DETERMINATION ====================
  
  private determineRouting(intent: IntentType, entities: any): {
    navigateTo?: '/events' | '/events/[id]' | '/itinerary';
    params?: Record<string, string>;
  } {
    if (intent === 'EVENT' && entities.primary) {
      return {
        navigateTo: '/events',
        params: {
          q: entities.primary,
          type: entities.type || 'all'
        }
      };
    }
    
    return {};
  }
  
  // ==================== CONFIDENCE CALCULATION ====================
  
  private calculateConfidence(intent: IntentType, entities: any): number {
    let confidence = 0.5; // Base confidence
    
    if (entities.primary) {
      confidence += 0.3; // Strong entity match
    }
    
    if (intent === 'EVENT' && entities.type) {
      confidence += 0.2; // Event type detected
    }
    
    return Math.min(confidence, 1.0);
  }
  
  // ==================== EVENT SEARCH ====================
  
  /**
   * Search for events using detected entity
   */
  async searchEvents(entity: string, city?: string): Promise<EventSearchResult[]> {
    try {
      // Use existing eventService
      const results = await eventService.universalSearch(entity);
      
      // Filter by city if provided
      let filtered = city 
        ? results.filter(r => r.venue?.city?.toLowerCase().includes(city.toLowerCase()))
        : results;
      
      // Convert to our format
      return filtered.slice(0, 10).map((event: any) => {
        // Safely extract event type
        const eventType = this.mapToEventType(event.type || event.category || event.genre || '');
        
        // Safely extract image
        const eventImage = event.image || event.images?.[0]?.url || event.thumbnail || undefined;
        
        return {
          id: event.id || '',
          name: event.name || '',
          type: eventType,
          startDate: event.startDate || event.dates?.start?.localDate || new Date().toISOString(),
          venue: {
            name: event.venue?.name || event._embedded?.venues?.[0]?.name || '',
            city: event.venue?.city || event._embedded?.venues?.[0]?.city?.name || '',
            country: event.venue?.country || event._embedded?.venues?.[0]?.country?.name || ''
          },
          priceRange: event.priceRange ? {
            min: event.priceRange.min,
            max: event.priceRange.max,
            currency: event.priceRange.currency
          } : event.priceRanges?.[0] ? {
            min: event.priceRanges[0].min,
            max: event.priceRanges[0].max,
            currency: event.priceRanges[0].currency
          } : undefined,
          source: event.source || 'ticketmaster',
          image: eventImage
        };
      });
    } catch (error) {
      console.error('Event search failed:', error);
      return [];
    }
  }
  
  private mapToEventType(type: string): EventType {
    if (!type) return 'OTHER';
    
    const lower = type.toLowerCase();
    if (lower.includes('sport')) return 'SPORTS';
    if (lower.includes('music') || lower.includes('concert')) return 'MUSIC';
    if (lower.includes('festival')) return 'FESTIVAL';
    if (lower.includes('conference')) return 'CONFERENCE';
    if (lower.includes('theater') || lower.includes('theatre')) return 'THEATER';
    
    // Check common Ticketmaster classifications
    if (lower.includes('basketball') || lower.includes('football') || 
        lower.includes('soccer') || lower.includes('baseball')) return 'SPORTS';
    
    return 'OTHER';
  }
  
  // ==================== PRICE COMPARISON ====================
  
  /**
   * Compare ticket prices across providers
   */
  async compareTicketPrices(eventId: string): Promise<PriceComparison[]> {
    // Simulate price comparison across platforms
    // In production, this would call actual affiliate APIs
    const providers = [
      {
        provider: 'Ticketmaster',
        basePrice: 250,
        fees: 35,
        commission: 5,
        rating: 4.5,
        features: ['Official', 'Verified', 'Mobile tickets', 'Fan protection']
      },
      {
        provider: 'StubHub',
        basePrice: 235,
        fees: 30,
        commission: 8,
        rating: 4.7,
        features: ['FanProtect™', 'Price match', 'Mobile app', 'Last minute deals']
      },
      {
        provider: 'SeatGeek',
        basePrice: 245,
        fees: 28,
        commission: 6,
        rating: 4.6,
        features: ['Deal Score', 'Interactive maps', 'Best value', 'Mobile entry']
      },
      {
        provider: 'Vivid Seats',
        basePrice: 240,
        fees: 32,
        commission: 7,
        rating: 4.4,
        features: ['100% Buyer Guarantee', 'Rewards program', 'VIP packages', 'Group deals']
      }
    ];
    
    const comparisons = providers.map(p => {
      const total = p.basePrice + p.fees;
      const commissionAmount = total * (p.commission / 100);
      
      return {
        provider: p.provider,
        price: p.basePrice,
        fees: p.fees,
        total,
        commission: commissionAmount,
        rating: p.rating,
        features: p.features,
        recommended: false,
        affiliateUrl: `https://www.${p.provider.toLowerCase().replace(' ', '')}.com?aid=gladys`
      };
    });
    
    // Sort by total price
    comparisons.sort((a, b) => a.total - b.total);
    
    // Mark best deal
    if (comparisons.length > 0) {
      comparisons[0].recommended = true;
    }
    
    return comparisons;
  }
  
  // ==================== AUTONOMOUS TRIP BUILDING ====================
  
  /**
   * Build complete trip autonomously
   */
  async buildAutonomousTrip(params: {
    event: EventSearchResult;
    budget: number;
    origin?: string;
    preferences?: any;
  }): Promise<TripPlan> {
    // 1. Get ticket prices
    const tickets = await this.compareTicketPrices(params.event.id);
    
    // 2. Find flights (mock for now)
    const flights = await this.findFlights(params.event, params.origin);
    
    // 3. Find hotels (mock for now)
    const hotels = await this.findHotels(params.event, params.preferences);
    
    // 4. Calculate totals
    const ticketCost = tickets[0]?.total || 0;
    const flightCost = flights[0]?.price || 0;
    const hotelCost = hotels[0]?.price || 0;
    
    const totalCost = ticketCost + flightCost + hotelCost;
    const totalCommission = (tickets[0]?.commission || 0) + 
                            (flightCost * 0.03) + 
                            (hotelCost * 0.04);
    
    return {
      event: params.event,
      tickets,
      flights,
      hotels,
      totalCost,
      totalCommission,
      savings: Math.floor(Math.random() * 200) + 50,
      optimized: true
    };
  }
  
  private async findFlights(event: EventSearchResult, origin?: string): Promise<any[]> {
    // Mock implementation
    return [{
      id: 'flight-1',
      airline: 'Delta',
      price: 450,
      route: `${origin || 'Your City'} → ${event.venue.city}`,
      class: 'Economy'
    }];
  }
  
  private async findHotels(event: EventSearchResult, preferences?: any): Promise<any[]> {
    // Mock implementation
    const pricePerNight = preferences?.budget === 'luxury' ? 300 : 
                          preferences?.budget === 'budget' ? 80 : 150;
    
    return [{
      id: 'hotel-1',
      name: `Hotel near ${event.venue.name}`,
      price: pricePerNight * 3,
      pricePerNight,
      nights: 3,
      location: event.venue.city
    }];
  }
  
  // ==================== MIXEDBREAD INTEGRATION ====================
  
  /**
   * Use Mixedbread for semantic search (when available)
   * This enhances entity detection and intent classification
   */
  async enhanceWithMixedbread(query: string): Promise<{
    semanticIntent: string;
    relatedEntities: string[];
    confidence: number;
  }> {
    // TODO: Integrate Mixedbread API
    // For now, return basic structure
    return {
      semanticIntent: 'event_search',
      relatedEntities: [],
      confidence: 0.8
    };
  }
}

// Export singleton instance
export const gladysAgent = new GladysAgentAI();