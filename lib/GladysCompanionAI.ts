// lib/GladysCompanionAI.ts
// 💬 GLADYS COMPANION AI - UX VOICE / CONVERSATIONAL LAYER
// This file is the USER-FACING VOICE. It speaks naturally and guides the user.
// It does NOT make decisions, detect intent, or call Mixedbread.

import { AgentAnalysis, EventSearchResult, TripPlan, PriceComparison } from './GladysAgentAI';

export interface UserContext {
  name?: string;
  budget: 'budget' | 'moderate' | 'luxury';
  preferredCities: string[];
  favoriteTeams?: string[];
  favoriteSports?: string[];
  conversationCount: number;
  recentQueries: string[];
  upcomingTrips?: any[];
  travelStyle?: string;
}

export interface CompanionResponse {
  message: string;
  suggestions?: string[];
  quickActions?: QuickAction[];
  tone: 'excited' | 'helpful' | 'empathetic' | 'informative';
}

export interface QuickAction {
  label: string;
  action: string;
  data?: any;
}

export class GladysCompanionAI {
  
  // ==================== GREETING & ONBOARDING ====================
  
  generateGreeting(context: UserContext): CompanionResponse {
    const isReturning = context.conversationCount > 0;
    const hasName = !!context.name;
    
    if (isReturning && hasName) {
      return {
        message: `Welcome back, ${context.name}! 🎉\n\nReady to find some amazing events? I can help you:\n• Find events for your favorite teams\n• Compare ticket prices across platforms\n• Build complete event trips automatically\n\nWhat are you in the mood for today?`,
        quickActions: [
          { label: '🎟️ Find Events', action: 'search_events' },
          { label: '💰 Compare Prices', action: 'compare_prices' },
          { label: '🤖 Auto-Build Trip', action: 'autonomous_trip' }
        ],
        tone: 'excited'
      };
    }
    
    if (isReturning) {
      return {
        message: `Hey! Great to see you again! 👋\n\nI'm Gladys, your AI travel agent for live events. I help you:\n\n🎫 Find events (sports, concerts, festivals)\n✈️ Build complete trips around events\n💰 Compare prices to get the best deals\n\nWhat's your name? I'd love to personalize your experience!`,
        quickActions: [
          { label: 'Tell me more', action: 'show_features' }
        ],
        tone: 'helpful'
      };
    }
    
    // First time
    return {
      message: `Hey there! 👋 I'm **Gladys**, your autonomous AI travel agent!\n\nI specialize in **event-led travel** - that means I help you plan trips around the events you love:\n\n🏀 **Sports** - Follow your team anywhere\n🎵 **Concerts** - See your favorite artists live\n🎉 **Festivals** - Experience epic events\n\nI can:\n• Search events across all platforms\n• Compare ticket prices instantly\n• Build complete trips (event + flight + hotel)\n• Find the best deals automatically\n\n**What's your name?** Let's get started! 😊`,
      quickActions: [
        { label: '🎯 Find Lakers Games', action: 'search', data: { query: 'Lakers' } },
        { label: '🎵 Taylor Swift Tour', action: 'search', data: { query: 'Taylor Swift' } },
        { label: '🎉 Browse Festivals', action: 'search', data: { query: 'festivals' } }
      ],
      tone: 'excited'
    };
  }
  
  // ==================== INTENT EXPLANATION ====================
  
  explainIntent(analysis: AgentAnalysis, context: UserContext): CompanionResponse {
    const { intent, entity, eventType, city, confidence } = analysis;
    
    // EVENT INTENT
    if (intent === 'EVENT') {
      if (entity && confidence > 0.7) {
        const emoji = this.getEventTypeEmoji(eventType);
        
        return {
          message: `${emoji} Perfect! I found **${entity}** events!\n\nLet me search for upcoming ${entity} ${eventType?.toLowerCase() || 'events'}${city ? ` in ${city}` : ''}...\n\nGive me just a sec! ⚡`,
          suggestions: [
            `Show me the next ${entity} event`,
            'Compare ticket prices',
            `Build my trip to the next ${entity} game`
          ],
          tone: 'excited'
        };
      }
      
      if (eventType) {
        const emoji = this.getEventTypeEmoji(eventType);
        return {
          message: `${emoji} You're looking for ${eventType.toLowerCase()} events! Great choice!\n\nLet me search for the best ${eventType.toLowerCase()} events${city ? ` in ${city}` : ''}...`,
          tone: 'helpful'
        };
      }
      
      return {
        message: `🎫 I can help you find events! Can you tell me:\n• What team or artist?\n• What sport or genre?\n• Any specific city?`,
        quickActions: [
          { label: '🏀 Sports Events', action: 'filter', data: { type: 'SPORTS' } },
          { label: '🎵 Concerts', action: 'filter', data: { type: 'MUSIC' } },
          { label: '🎉 Festivals', action: 'filter', data: { type: 'FESTIVAL' } }
        ],
        tone: 'helpful'
      };
    }
    
    // DESTINATION INTENT
    if (intent === 'DESTINATION') {
      return {
        message: `📍 Planning a trip to ${city || 'explore'}! Love it!\n\nWhile I specialize in **event-led travel**, I can still help you find things to do. Want to check if there are any cool events happening during your visit?`,
        quickActions: [
          { label: `🎫 Events in ${city}`, action: 'search_events', data: { city } },
          { label: '🏨 Find Hotels', action: 'show_hotels' },
          { label: '✈️ Find Flights', action: 'show_flights' }
        ],
        tone: 'helpful'
      };
    }
    
    // HYBRID INTENT
    if (intent === 'HYBRID') {
      return {
        message: `🎯 Perfect combo! You want to catch ${entity || 'an event'} AND explore ${city}!\n\nLet me build you an event-centered trip - we'll plan around the event, then add time to explore the city before and after. Sound good?`,
        quickActions: [
          { label: '🤖 Auto-Build My Trip', action: 'autonomous_trip' },
          { label: '🎫 Show Events First', action: 'search_events' }
        ],
        tone: 'excited'
      };
    }
    
    // GENERAL INTENT
    return {
      message: `I'm here to help! Here's what I can do:\n\n🎫 **Find Events** - Sports, concerts, festivals\n💰 **Compare Prices** - Best deals across platforms\n🤖 **Auto-Build Trips** - Complete event trips\n\nWhat would you like to do?`,
      quickActions: [
        { label: 'Find Events', action: 'search_events' },
        { label: 'Browse Popular', action: 'show_popular' }
      ],
      tone: 'helpful'
    };
  }
  
  // ==================== EVENT RESULTS PRESENTATION ====================
  
  presentEventResults(
    events: EventSearchResult[],
    query: string,
    analysis: AgentAnalysis,
    context: UserContext
  ): CompanionResponse {
    if (events.length === 0) {
      return {
        message: `Hmm, I couldn't find any ${query} events right now. 😕\n\nWant to try:\n• A different team or artist?\n• A specific city?\n• Browse all upcoming events?`,
        quickActions: [
          { label: '🔍 Try Different Search', action: 'new_search' },
          { label: '🎫 Browse All Events', action: 'show_all' }
        ],
        tone: 'empathetic'
      };
    }
    
    const topEvent = events[0];
    const emoji = this.getEventTypeEmoji(analysis.eventType);
    
    const greetingVariations = [
      `${emoji} Found ${events.length} ${query} events! Here are your top picks:`,
      `${emoji} Great news! ${events.length} ${query} events coming up!`,
      `${emoji} Perfect! I found ${events.length} ${query} events for you:`,
    ];
    
    const greeting = greetingVariations[Math.floor(Math.random() * greetingVariations.length)];
    
    const eventsList = events.slice(0, 3).map((event, i) => 
      `${i + 1}. **${event.name}**\n   📍 ${event.venue.city} • 📅 ${new Date(event.startDate).toLocaleDateString()}\n   💰 From $${event.priceRange?.min || 'TBA'}`
    ).join('\n\n');
    
    return {
      message: `${greeting}\n\n${eventsList}\n\nWant me to build your complete trip for any of these? I'll find flights, hotels, and compare ticket prices! ✈️🏨`,
      suggestions: [
        `Build my trip to ${topEvent.name}`,
        'Compare ticket prices',
        'Show me all events'
      ],
      quickActions: [
        { label: `🤖 Auto-Build Trip`, action: 'build_trip', data: { eventId: topEvent.id } },
        { label: '💰 Compare Prices', action: 'compare_prices', data: { eventId: topEvent.id } },
        { label: '📅 See Full Calendar', action: 'show_calendar' }
      ],
      tone: 'excited'
    };
  }
  
  // ==================== PRICE COMPARISON PRESENTATION ====================
  
  presentPriceComparison(
    prices: PriceComparison[],
    eventName: string
  ): CompanionResponse {
    const bestDeal = prices.find(p => p.recommended) || prices[0];
    const savings = prices[prices.length - 1].total - bestDeal.total;
    
    const priceList = prices.slice(0, 3).map((p, i) => {
      const badge = p.recommended ? '⭐ **BEST DEAL**' : '';
      return `${i + 1}. **${p.provider}** ${badge}\n   💵 $${p.price} + $${p.fees} fees = **$${p.total}**\n   ⭐ ${p.rating}/5 • 💰 You earn $${p.commission.toFixed(2)}`;
    }).join('\n\n');
    
    return {
      message: `💰 **Price Comparison for ${eventName}**\n\nI found prices from ${prices.length} platforms:\n\n${priceList}\n\n✨ Best deal: **${bestDeal.provider}** at $${bestDeal.total} (save $${savings.toFixed(2)}!)`,
      suggestions: [
        'Book the best deal',
        'Build complete trip',
        'Watch this price'
      ],
      quickActions: [
        { label: '🎫 Book Now', action: 'book_ticket', data: { provider: bestDeal.provider } },
        { label: '🤖 Build Full Trip', action: 'build_trip' },
        { label: '📊 Watch Price', action: 'add_to_watchlist' }
      ],
      tone: 'informative'
    };
  }
  
  // ==================== TRIP PLAN PRESENTATION ====================
  
  presentTripPlan(plan: TripPlan, context: UserContext): CompanionResponse {
    const { event, tickets, flights, hotels, totalCost, totalCommission, savings } = plan;
    
    const bestTicket = tickets[0];
    const flight = flights[0];
    const hotel = hotels[0];
    
    return {
      message: `✨ **Your ${event.name} Trip is Ready!**\n\n` +
               `I've built your complete event trip:\n\n` +
               `🎫 **Ticket**: ${bestTicket.provider} - $${bestTicket.total}\n` +
               `✈️ **Flight**: ${flight?.airline || 'Best option'} - $${flight?.price || 0}\n` +
               `🏨 **Hotel**: ${hotel?.nights || 3} nights - $${hotel?.price || 0}\n\n` +
               `💰 **Total**: $${totalCost.toFixed(2)}\n` +
               `💎 **Your Earnings**: $${totalCommission.toFixed(2)}\n` +
               `🎯 **Savings**: $${savings}\n\n` +
               `Everything is optimized for the best value! Ready to book?`,
      quickActions: [
        { label: '💳 Checkout', action: 'checkout', data: { plan } },
        { label: '✏️ Customize Trip', action: 'customize' },
        { label: '💾 Save for Later', action: 'save_cart' }
      ],
      tone: 'excited'
    };
  }
  
  // ==================== FOLLOW-UP GUIDANCE ====================
  
  guideNextSteps(
    currentState: 'event_selected' | 'prices_compared' | 'trip_built' | 'general',
    context: UserContext
  ): CompanionResponse {
    switch (currentState) {
      case 'event_selected':
        return {
          message: `Great choice! What would you like to do next?\n\n🤖 Auto-build your complete trip (fastest!)\n💰 Compare ticket prices first\n📅 See event details`,
          quickActions: [
            { label: '🤖 Auto-Build Trip', action: 'build_trip' },
            { label: '💰 Compare Prices', action: 'compare_prices' },
            { label: '📅 Event Details', action: 'show_details' }
          ],
          tone: 'helpful'
        };
      
      case 'prices_compared':
        return {
          message: `You've seen the prices! Next up:\n\n🎫 Book the best deal\n🤖 Build complete trip (adds flights + hotels)\n📊 Watch this price for changes`,
          quickActions: [
            { label: '🎫 Book Ticket', action: 'book_ticket' },
            { label: '🤖 Build Full Trip', action: 'build_trip' },
            { label: '📊 Watch Price', action: 'watch_price' }
          ],
          tone: 'informative'
        };
      
      case 'trip_built':
        return {
          message: `Your trip is all set! You can:\n\n💳 Checkout and book everything\n✏️ Make changes (dates, hotels, etc.)\n💾 Save and decide later`,
          quickActions: [
            { label: '💳 Checkout Now', action: 'checkout' },
            { label: '✏️ Customize', action: 'customize' },
            { label: '💾 Save Cart', action: 'save_cart' }
          ],
          tone: 'helpful'
        };
      
      default:
        return {
          message: `What would you like to do?\n\n🎫 Find events\n💰 Compare prices\n🤖 Auto-build a trip`,
          quickActions: [
            { label: '🎫 Find Events', action: 'search_events' },
            { label: '🤖 Auto-Build Trip', action: 'autonomous_trip' }
          ],
          tone: 'helpful'
        };
    }
  }
  
  // ==================== CONTEXT-AWARE RESPONSES ====================
  
  respondToUserInput(
    userMessage: string,
    analysis: AgentAnalysis,
    context: UserContext
  ): CompanionResponse {
    const lower = userMessage.toLowerCase();
    
    // Name extraction
    if (/(my name is|i'm|im|call me)\s+([A-Z][a-z]+)/i.test(userMessage)) {
      const nameMatch = userMessage.match(/(?:my name is|i'm|im|call me)\s+([A-Z][a-z]+)/i);
      const name = nameMatch?.[1];
      
      return {
        message: `Nice to meet you, ${name}! 🎉\n\nNow I can give you personalized recommendations. Ready to find some amazing events?`,
        suggestions: [
          'Find events near me',
          'Compare ticket prices',
          'Build a trip'
        ],
        tone: 'excited'
      };
    }
    
    // Budget questions
    if (/budget|afford|cheap|expensive/i.test(lower)) {
      return {
        message: `Let's talk budget! 💰\n\nI can work with any budget:\n• **Budget**: Focus on best value\n• **Moderate**: Balance price & quality\n• **Luxury**: Premium everything\n\nWhat's your budget preference?`,
        quickActions: [
          { label: '💵 Budget', action: 'set_budget', data: { budget: 'budget' } },
          { label: '💰 Moderate', action: 'set_budget', data: { budget: 'moderate' } },
          { label: '💎 Luxury', action: 'set_budget', data: { budget: 'luxury' } }
        ],
        tone: 'helpful'
      };
    }
    
    // Generic help
    if (/help|what can you do|capabilities/i.test(lower)) {
      return {
        message: `I'm your AI travel agent for live events! Here's what I can do:\n\n` +
                 `🎫 **Find Events** - Search sports, concerts, festivals\n` +
                 `💰 **Compare Prices** - Check all ticket platforms\n` +
                 `🤖 **Auto-Build Trips** - Complete packages (event + flight + hotel)\n` +
                 `📊 **Price Monitoring** - Watch prices and get alerts\n\n` +
                 `Just tell me what you want to see!`,
        quickActions: [
          { label: '🎫 Find Events', action: 'search_events' },
          { label: '🤖 Auto-Build Trip', action: 'autonomous_trip' }
        ],
        tone: 'helpful'
      };
    }
    
    // Default: Use intent explanation
    return this.explainIntent(analysis, context);
  }
  
  // ==================== ERROR HANDLING ====================
  
  handleError(errorType: 'search_failed' | 'api_error' | 'no_results' | 'general'): CompanionResponse {
    switch (errorType) {
      case 'search_failed':
        return {
          message: `Oops! I had trouble searching for events. 😅\n\nLet's try again - can you rephrase your search?`,
          quickActions: [
            { label: '🔄 Try Again', action: 'retry_search' },
            { label: '🎫 Browse All Events', action: 'show_all' }
          ],
          tone: 'empathetic'
        };
      
      case 'no_results':
        return {
          message: `I couldn't find any events matching that search. 😕\n\nWant to try:\n• Different keywords?\n• Browse popular events?\n• Check upcoming festivals?`,
          quickActions: [
            { label: '🔍 New Search', action: 'new_search' },
            { label: '🔥 Popular Events', action: 'show_popular' }
          ],
          tone: 'empathetic'
        };
      
      case 'api_error':
        return {
          message: `I'm having a bit of technical trouble right now. 🛠️\n\nEverything should be back up in a moment! Want to try browsing our featured events instead?`,
          quickActions: [
            { label: '🔄 Try Again', action: 'retry' },
            { label: '⭐ Featured Events', action: 'show_featured' }
          ],
          tone: 'empathetic'
        };
      
      default:
        return {
          message: `Hmm, something unexpected happened. 😅 Let's start fresh - what would you like to do?`,
          quickActions: [
            { label: '🎫 Find Events', action: 'search_events' },
            { label: '🏠 Start Over', action: 'reset' }
          ],
          tone: 'helpful'
        };
    }
  }
  
  // ==================== HELPER METHODS ====================
  
  private getEventTypeEmoji(eventType?: string): string {
    switch (eventType) {
      case 'SPORTS': return '🏀';
      case 'MUSIC': return '🎵';
      case 'FESTIVAL': return '🎉';
      case 'CONFERENCE': return '💼';
      case 'THEATER': return '🎭';
      default: return '🎫';
    }
  }
  
  // ==================== PERSONALIZATION ====================
  
  personalizeMessage(baseMessage: string, context: UserContext): string {
    let personalized = baseMessage;
    
    // Add name if available
    if (context.name && !baseMessage.includes(context.name)) {
      personalized = personalized.replace(/You/g, context.name);
    }
    
    // Adjust tone based on conversation count
    if (context.conversationCount > 5) {
      // More casual for returning users
      personalized = personalized.replace(/Perfect!/g, 'Nice!');
      personalized = personalized.replace(/Great!/g, 'Cool!');
    }
    
    return personalized;
  }
}

// Export singleton instance
export const gladysCompanion = new GladysCompanionAI();