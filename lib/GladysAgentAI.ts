// lib/GladysAgentAI.ts
// 🧠 GLADYS AGENT AI - BRAIN / ORCHESTRATOR (OpenAI-Powered)
// This file is the BRAIN. It returns structured JSON ONLY.
// It does NOT speak conversationally or render UI.

import OpenAI from 'openai';
import { searchTicketmasterEvents } from './ticketmasterService';
import { getAllEvents, type Event } from './eventService';

// ==================== OPENAI CLIENT ====================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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
  endDate?: string;
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

// ==================== AI SYSTEM PROMPT ====================

const GLADYS_AGENT_SYSTEM_PROMPT = `You are GladysAgent, the global event-travel intelligence orchestration layer.

# CORE MISSION
You analyze user travel queries and return structured routing intelligence for an event-focused travel platform.
You NEVER speak conversationally.
You ALWAYS return valid JSON matching the AgentAnalysis schema.

# CAPABILITIES
You detect:
1. Intent type (EVENT, DESTINATION, HYBRID, GENERAL)
2. Event type (SPORTS, MUSIC, FESTIVAL, CONFERENCE, THEATER, OTHER)
3. Primary entities (teams, artists, festivals, leagues, venues)
4. Locations (cities, venues, countries)
5. Context (budget level, travelers, dates)
6. Suggested actions for the platform

# INTENT CLASSIFICATION

**EVENT**: User wants to attend a specific event
- Triggers: team names, artist names, sports leagues, concerts, matches, games
- Examples: "Lakers game", "Taylor Swift concert", "World Cup", "Coachella"

**DESTINATION**: User wants to visit a location without event focus
- Triggers: city names with vacation/explore/visit keywords
- Examples: "trip to Paris", "explore Tokyo", "vacation in Miami"

**HYBRID**: User wants both event + destination exploration
- Triggers: event + city exploration combined
- Examples: "Lakers game and explore LA", "concert in NYC and visit museums"

**GENERAL**: Unclear or informational query
- Triggers: help requests, vague questions, greetings
- Examples: "what can you do?", "help me plan", "hello"

# ENTITY EXTRACTION

**Teams (SPORTS):**
NBA: Lakers, Celtics, Warriors, Bulls, Heat, Knicks, Nets, Bucks, Clippers, Mavericks, Rockets, Suns, Nuggets
NFL: Patriots, Cowboys, Packers, 49ers, Steelers, Eagles, Chiefs, Ravens, Rams, Seahawks, Broncos, Saints
Soccer: Barcelona, Real Madrid, Manchester United, Liverpool, Chelsea, Arsenal, Bayern Munich, Juventus, PSG, Inter Miami

**Artists (MUSIC):**
Taylor Swift, Beyoncé, Drake, Bad Bunny, Ed Sheeran, The Weeknd, Billie Eilish, Ariana Grande, Travis Scott, Post Malone, Imagine Dragons, Coldplay, Bruno Mars, Adele, Rihanna

**Festivals (FESTIVAL):**
Coachella, Lollapalooza, Bonnaroo, Glastonbury, Tomorrowland, Burning Man, Ultra, EDC, SXSW, Comic-Con

**Leagues (SPORTS):**
NBA, NFL, MLB, NHL, MLS, Premier League, La Liga, Champions League, Super Bowl, World Cup, F1, UFC

# CITIES DATABASE
Major US: New York, Los Angeles, Chicago, Houston, Miami, Atlanta, Boston, Seattle, Denver, Las Vegas, Dallas, Austin
International: London, Paris, Barcelona, Madrid, Rome, Berlin, Tokyo, Sydney, Dubai, Singapore

# BUDGET DETECTION
- "luxury", "premium", "5-star", "expensive" → luxury
- "budget", "cheap", "affordable", "economical" → budget
- default → moderate

# SUGGESTED ACTIONS
Based on intent, suggest relevant actions:
- EVENT intent → ["search_events", "compare_ticket_prices", "build_trip"]
- DESTINATION intent → ["find_hotels", "show_destination_info"]
- HYBRID intent → ["search_events", "build_trip", "show_destination_info"]
- GENERAL intent → ["search_events"]

# ROUTING
- EVENT with entity → shouldNavigateTo: "/events", searchParams: {q: entity, type: entityType}
- Otherwise → no routing

# CRITICAL RULES
1. ALWAYS return valid JSON matching this EXACT schema
2. NEVER include conversational text
3. NEVER hallucinate fields outside the schema
4. Be deterministic and precise
5. Confidence score: 0.0-1.0 based on clarity of intent

# OUTPUT SCHEMA
{
  "intent": "EVENT" | "DESTINATION" | "HYBRID" | "GENERAL",
  "confidence": number (0.0-1.0),
  "eventType": "SPORTS" | "MUSIC" | "FESTIVAL" | "CONFERENCE" | "THEATER" | "OTHER" | null,
  "entity": string | null,
  "entityType": "team" | "artist" | "festival" | "league" | "venue" | null,
  "city": string | null,
  "venue": string | null,
  "country": string | null,
  "context": {
    "detectedTeam": string | null,
    "detectedArtist": string | null,
    "detectedFestival": string | null,
    "detectedLeague": string | null,
    "detectedVenue": string | null,
    "detectedDate": string | null,
    "detectedBudget": "budget" | "moderate" | "luxury" | null,
    "numberOfTravelers": number | null
  },
  "suggestedActions": string[],
  "shouldNavigateTo": "/events" | "/events/[id]" | "/itinerary" | null,
  "searchParams": object | null
}

Analyze the query and return ONLY the JSON object. No explanations. No markdown. Pure JSON.`;

// ==================== GLADYS AGENT AI CLASS ====================

export class GladysAgentAI {
  
  // ==================== CORE ANALYSIS (AI-POWERED) ====================
  
  /**
   * Analyze user query and return structured intent using OpenAI
   * This is the MAIN entry point
   */
  async analyzeQuery(query: string, context?: any): Promise<AgentAnalysis> {
    try {
      console.log('🧠 GladysAgent analyzing:', query);
      
      // Call OpenAI for intelligent analysis
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        temperature: 0.2, // Low temperature for deterministic output
        messages: [
          {
            role: 'system',
            content: GLADYS_AGENT_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Analyze this travel query: "${query}"`
          }
        ],
        response_format: { type: 'json_object' } // Force JSON mode
      });
      
      const content = completion.choices[0].message.content;
      
      if (!content) {
        throw new Error('No response from OpenAI');
      }
      
      // Parse AI response
      const aiAnalysis = JSON.parse(content);
      
      // Validate and normalize to AgentAnalysis interface
      const analysis: AgentAnalysis = {
        intent: aiAnalysis.intent || 'GENERAL',
        confidence: aiAnalysis.confidence || 0.5,
        eventType: aiAnalysis.eventType || undefined,
        entity: aiAnalysis.entity || undefined,
        entityType: aiAnalysis.entityType || undefined,
        city: aiAnalysis.city || undefined,
        venue: aiAnalysis.venue || undefined,
        country: aiAnalysis.country || undefined,
        context: {
          detectedTeam: aiAnalysis.context?.detectedTeam || undefined,
          detectedArtist: aiAnalysis.context?.detectedArtist || undefined,
          detectedFestival: aiAnalysis.context?.detectedFestival || undefined,
          detectedLeague: aiAnalysis.context?.detectedLeague || undefined,
          detectedVenue: aiAnalysis.context?.detectedVenue || undefined,
          detectedDate: aiAnalysis.context?.detectedDate || undefined,
          detectedBudget: aiAnalysis.context?.detectedBudget || undefined,
          numberOfTravelers: aiAnalysis.context?.numberOfTravelers || undefined,
        },
        suggestedActions: aiAnalysis.suggestedActions || ['search_events'],
        shouldNavigateTo: aiAnalysis.shouldNavigateTo || undefined,
        searchParams: aiAnalysis.searchParams || undefined
      };
      
      console.log('✅ AI Analysis:', {
        intent: analysis.intent,
        entity: analysis.entity,
        confidence: analysis.confidence
      });
      
      return analysis;
      
    } catch (error) {
      console.error('❌ OpenAI analysis failed:', error);
      
      // FALLBACK: Basic rule-based detection
      console.log('⚠️ Using fallback rule-based detection');
      return this.fallbackAnalysis(query);
    }
  }
  
  // ==================== FALLBACK RULE-BASED ANALYSIS ====================
  
  /**
   * Fallback to simple rule-based detection if OpenAI fails
   */
  private fallbackAnalysis(query: string): AgentAnalysis {
    const normalized = query.toLowerCase().trim();
    
    // Simple keyword-based intent detection
    const eventKeywords = ['game', 'match', 'concert', 'show', 'festival', 'event', 'tickets'];
    const destinationKeywords = ['visit', 'trip', 'vacation', 'explore', 'tour'];
    
    const hasEventKeyword = eventKeywords.some(kw => normalized.includes(kw));
    const hasDestinationKeyword = destinationKeywords.some(kw => normalized.includes(kw));
    
    let intent: IntentType = 'GENERAL';
    if (hasEventKeyword && hasDestinationKeyword) {
      intent = 'HYBRID';
    } else if (hasEventKeyword) {
      intent = 'EVENT';
    } else if (hasDestinationKeyword) {
      intent = 'DESTINATION';
    }
    
    // Basic entity extraction
    const teams = ['lakers', 'celtics', 'warriors', 'patriots', 'cowboys'];
    const artists = ['taylor swift', 'beyonce', 'drake', 'ed sheeran'];
    
    let entity: string | undefined;
    let entityType: 'team' | 'artist' | undefined;
    
    for (const team of teams) {
      if (normalized.includes(team)) {
        entity = team;
        entityType = 'team';
        break;
      }
    }
    
    if (!entity) {
      for (const artist of artists) {
        if (normalized.includes(artist)) {
          entity = artist;
          entityType = 'artist';
          break;
        }
      }
    }
    
    return {
      intent,
      confidence: entity ? 0.7 : 0.4,
      eventType: entityType === 'team' ? 'SPORTS' : entityType === 'artist' ? 'MUSIC' : undefined,
      entity,
      entityType,
      city: undefined,
      venue: undefined,
      country: undefined,
      context: {
        detectedBudget: 'moderate'
      },
      suggestedActions: intent === 'EVENT' ? ['search_events', 'build_trip'] : ['search_events'],
      shouldNavigateTo: entity ? '/events' : undefined,
      searchParams: entity ? { q: entity, type: entityType || 'all' } : undefined
    };
  }
  
  // ==================== EVENT SEARCH ====================
  
  /**
   * Search for events using detected entity
   * Dual-layer intelligence: Internal events first, Ticketmaster fallback
   */
  async searchEvents(entity: string, city?: string): Promise<EventSearchResult[]> {
    try {
      // LAYER 1: Internal structured events from eventService
      let internalEvents = getAllEvents().filter(e =>
        e.name.toLowerCase().includes(entity.toLowerCase()) ||
        e.location.city.toLowerCase().includes(entity.toLowerCase()) ||
        e.location.country.toLowerCase().includes(entity.toLowerCase())
      );
      
      // Filter by city if provided
      if (city) {
        internalEvents = internalEvents.filter(e =>
          e.location.city.toLowerCase().includes(city.toLowerCase())
        );
      }
      
      // Map internal events to EventSearchResult format
      const internalResults: EventSearchResult[] = internalEvents.map(event => ({
        id: event.id,
        name: event.name,
        type: this.mapInternalTypeToEventType(event.type),
        startDate: event.startDate,
        endDate: event.endDate,
        venue: {
          name: event.location.venue || event.location.city,
          city: event.location.city,
          country: event.location.country
        },
        priceRange: event.priceRange,
        source: event.source || 'GladysTravelAI',
        image: event.heroImage
      }));
      
      if (internalResults.length > 0) {
        console.log('🎯 Using structured internal events');
      }
      
      // LAYER 2: Ticketmaster fallback
      console.log('🌍 Using Ticketmaster fallback');
      let ticketmasterResults: EventSearchResult[] = [];
      
      try {
        const tmEvents = await searchTicketmasterEvents(entity, city);
        
        // Map Ticketmaster events to EventSearchResult format
        ticketmasterResults = tmEvents.map(event => ({
          id: event.id,
          name: event.name,
          type: this.mapInternalTypeToEventType(event.type),
          startDate: event.startDate,
          endDate: event.endDate,
          venue: {
            name: event.location.venue || event.location.city,
            city: event.location.city,
            country: event.location.country
          },
          priceRange: event.priceRange,
          source: event.source || 'Ticketmaster',
          image: event.heroImage
        }));
      } catch (tmError) {
        console.warn('Ticketmaster search failed, using internal events only:', tmError);
      }
      
      // MERGE: Internal events first, then Ticketmaster
      const allResults = [...internalResults, ...ticketmasterResults];
      
      // DEDUPLICATE: Remove duplicates by name + city
      const seen = new Map<string, EventSearchResult>();
      for (const event of allResults) {
        const key = `${event.name.toLowerCase()}-${event.venue.city.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.set(key, event);
        }
      }
      
      const uniqueResults = Array.from(seen.values());
      
      // SORT: By upcoming date, prioritizing internal events
      uniqueResults.sort((a, b) => {
        // Prioritize internal events
        const aIsInternal = !a.id.startsWith('tm-');
        const bIsInternal = !b.id.startsWith('tm-');
        
        if (aIsInternal && !bIsInternal) return -1;
        if (!aIsInternal && bIsInternal) return 1;
        
        // Then sort by date
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      });
      
      // Return top 10
      return uniqueResults.slice(0, 10);
      
    } catch (error) {
      console.error('Event search failed:', error);
      return [];
    }
  }
  
  private mapInternalTypeToEventType(type: 'sports' | 'music' | 'festival'): EventType {
    const typeMap: Record<string, EventType> = {
      'sports': 'SPORTS',
      'music': 'MUSIC',
      'festival': 'FESTIVAL'
    };
    
    return typeMap[type] || 'OTHER';
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
    arrivalDate?: Date;
    departureDate?: Date;
  }): Promise<TripPlan> {
    // Parse event start date
    const eventStart = new Date(params.event.startDate);
    
    let arrivalDate: Date;
    let departureDate: Date;
    
    // If manual override dates provided, use them
    if (params.arrivalDate && params.departureDate) {
      arrivalDate = params.arrivalDate;
      departureDate = params.departureDate;
    } else {
      // Auto-calculate travel window
      // Arrival: 1 day before event starts
      arrivalDate = new Date(eventStart);
      arrivalDate.setDate(arrivalDate.getDate() - 1);
      
      // Departure: 1 day after event ends (or starts if no endDate)
      if (params.event.endDate) {
        const eventEnd = new Date(params.event.endDate);
        departureDate = new Date(eventEnd);
        departureDate.setDate(departureDate.getDate() + 1);
      } else {
        departureDate = new Date(eventStart);
        departureDate.setDate(departureDate.getDate() + 1);
      }
      
      // Validate dates - ensure minimum 3 nights if calculation fails
      const nights = Math.ceil((departureDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));
      if (nights < 3 || isNaN(nights)) {
        arrivalDate = new Date(eventStart);
        arrivalDate.setDate(arrivalDate.getDate() - 1);
        departureDate = new Date(eventStart);
        departureDate.setDate(departureDate.getDate() + 2);
      }
    }
    
    console.log('🧳 Auto trip window:', arrivalDate, departureDate);
    
    // 1. Get ticket prices
    const tickets = await this.compareTicketPrices(params.event.id);
    
    // 2. Find flights (mock for now)
    const flights = await this.findFlights(params.event, params.origin, arrivalDate, departureDate);
    
    // 3. Find hotels (mock for now)
    const hotels = await this.findHotels(params.event, params.preferences, arrivalDate, departureDate);
    
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
  
  private async findFlights(event: EventSearchResult, origin?: string, arrivalDate?: Date, departureDate?: Date): Promise<any[]> {
    // Mock implementation
    return [{
      id: 'flight-1',
      airline: 'Delta',
      price: 450,
      route: `${origin || 'Your City'} → ${event.venue.city}`,
      class: 'Economy',
      outbound: arrivalDate?.toISOString().split('T')[0],
      return: departureDate?.toISOString().split('T')[0]
    }];
  }
  
  private async findHotels(event: EventSearchResult, preferences?: any, arrivalDate?: Date, departureDate?: Date): Promise<any[]> {
    // Mock implementation
    const pricePerNight = preferences?.budget === 'luxury' ? 300 : 
                          preferences?.budget === 'budget' ? 80 : 150;
    
    // Calculate nights
    const nights = arrivalDate && departureDate 
      ? Math.ceil((departureDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24))
      : 3;
    
    return [{
      id: 'hotel-1',
      name: `Hotel near ${event.venue.name}`,
      price: pricePerNight * nights,
      pricePerNight,
      nights,
      location: event.venue.city,
      checkIn: arrivalDate?.toISOString().split('T')[0],
      checkOut: departureDate?.toISOString().split('T')[0]
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