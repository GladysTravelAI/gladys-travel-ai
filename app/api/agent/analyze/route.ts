// app/api/agent/analyze/route.ts
// 🎯 AGENT API ENDPOINT
// Orchestrates GladysAgentAI (brain) and GladysCompanionAI (voice)

import { NextRequest, NextResponse } from 'next/server';
import { gladysAgent, AgentAnalysis } from '@/lib/GladysAgentAI';
import { gladysCompanion, UserContext, CompanionResponse } from '@/lib/GladysCompanionAI';

export interface AnalyzeRequest {
  query: string;
  userContext?: UserContext;
  action?: 'analyze' | 'search_events' | 'compare_prices' | 'build_trip';
  eventId?: string;
}

export interface AnalyzeResponse {
  // Agent output (structured data)
  agentAnalysis: AgentAnalysis;
  
  // Companion output (friendly text)
  companionResponse: CompanionResponse;
  
  // Optional data based on action
  events?: any[];
  prices?: any[];
  tripPlan?: any;
  
  // Metadata
  processingTime: number;
  updatedContext?: Partial<UserContext>;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body: AnalyzeRequest = await req.json();
    const { query, userContext, action = 'analyze', eventId } = body;
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    // Default context
    const context: UserContext = userContext || {
      budget: 'moderate',
      preferredCities: [],
      conversationCount: 0,
      recentQueries: []
    };
    
    // STEP 1: AGENT ANALYZES QUERY (Brain)
    console.log(`🧠 Agent analyzing: "${query}"`);
    const agentAnalysis = await gladysAgent.analyzeQuery(query, context);
    console.log(`✅ Agent detected intent: ${agentAnalysis.intent} (${agentAnalysis.confidence})`);
    
    // STEP 2: EXECUTE ACTION BASED ON ANALYSIS
    let events: any[] | undefined;
    let prices: any[] | undefined;
    let tripPlan: any | undefined;
    let companionResponse: CompanionResponse;
    
    switch (action) {
      case 'search_events': {
        if (agentAnalysis.entity) {
          console.log(`🔍 Searching events for: ${agentAnalysis.entity}`);
          events = await gladysAgent.searchEvents(
            agentAnalysis.entity,
            agentAnalysis.city
          );
          console.log(`✅ Found ${events.length} events`);
          
          // Companion presents results
          companionResponse = gladysCompanion.presentEventResults(
            events,
            agentAnalysis.entity,
            agentAnalysis,
            context
          );
        } else {
          // No entity detected, companion asks for clarification
          companionResponse = gladysCompanion.explainIntent(agentAnalysis, context);
        }
        break;
      }
      
      case 'compare_prices': {
        if (eventId) {
          console.log(`💰 Comparing prices for event: ${eventId}`);
          prices = await gladysAgent.compareTicketPrices(eventId);
          
          // Companion presents price comparison
          companionResponse = gladysCompanion.presentPriceComparison(
            prices,
            'Selected Event'
          );
        } else {
          companionResponse = {
            message: 'Please select an event first to compare prices!',
            tone: 'helpful'
          };
        }
        break;
      }
      
      case 'build_trip': {
        // First, search for events if we have an entity
        if (agentAnalysis.entity) {
          console.log(`🤖 Building autonomous trip for: ${agentAnalysis.entity}`);
          events = await gladysAgent.searchEvents(
            agentAnalysis.entity,
            agentAnalysis.city
          );
          
          if (events.length > 0) {
            // Build trip for first event
            tripPlan = await gladysAgent.buildAutonomousTrip({
              event: events[0],
              budget: context.budget === 'luxury' ? 5000 : 
                       context.budget === 'budget' ? 1500 : 3000,
              origin: context.preferredCities[0],
              preferences: { budget: context.budget }
            });
            
            // Companion presents trip plan
            companionResponse = gladysCompanion.presentTripPlan(tripPlan, context);
          } else {
            companionResponse = gladysCompanion.handleError('no_results');
          }
        } else {
          companionResponse = gladysCompanion.explainIntent(agentAnalysis, context);
        }
        break;
      }
      
      default: {
        // Just analyze and explain intent
        console.log(`💬 Companion explaining intent`);
        
        // If intent is EVENT and we have high confidence, auto-search
        if (agentAnalysis.intent === 'EVENT' && 
            agentAnalysis.entity && 
            agentAnalysis.confidence > 0.7) {
          events = await gladysAgent.searchEvents(
            agentAnalysis.entity,
            agentAnalysis.city
          );
          companionResponse = gladysCompanion.presentEventResults(
            events,
            agentAnalysis.entity,
            agentAnalysis,
            context
          );
        } else {
          // Companion explains what was understood
          companionResponse = gladysCompanion.respondToUserInput(
            query,
            agentAnalysis,
            context
          );
        }
      }
    }
    
    // STEP 3: UPDATE USER CONTEXT
    const updatedContext = extractContextUpdates(query, agentAnalysis, context);
    
    // STEP 4: RETURN RESPONSE
    const processingTime = Date.now() - startTime;
    console.log(`✅ Processed in ${processingTime}ms`);
    
    const response: AnalyzeResponse = {
      agentAnalysis,
      companionResponse,
      events,
      prices,
      tripPlan,
      processingTime,
      updatedContext
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('❌ Agent API Error:', error);
    
    // Graceful error handling with companion
    const companionResponse = gladysCompanion.handleError('api_error');
    
    return NextResponse.json({
      agentAnalysis: {
        intent: 'GENERAL',
        confidence: 0,
        context: {},
        suggestedActions: []
      },
      companionResponse,
      error: error.message,
      processingTime: Date.now() - startTime
    }, { status: 200 }); // Return 200 to prevent client errors
  }
}

// ==================== CONTEXT EXTRACTION ====================

function extractContextUpdates(
  query: string,
  analysis: AgentAnalysis,
  currentContext: UserContext
): Partial<UserContext> {
  const updates: Partial<UserContext> = {};
  
  // Extract name
  const nameMatch = query.match(/(?:my name is|i'm|im|call me|this is)\s+([A-Z][a-z]+)/i);
  if (nameMatch && !currentContext.name) {
    updates.name = nameMatch[1];
  }
  
  // Extract favorite team/artist
  if (analysis.entity && analysis.entityType === 'team') {
    const favoriteTeams = currentContext.favoriteTeams || [];
    if (!favoriteTeams.includes(analysis.entity)) {
      updates.favoriteTeams = [...favoriteTeams, analysis.entity].slice(-5);
    }
  }
  
  // Update budget from analysis
  if (analysis.context.detectedBudget) {
    updates.budget = analysis.context.detectedBudget;
  }
  
  // Add to recent queries
  updates.recentQueries = [query, ...currentContext.recentQueries].slice(0, 10);
  
  // Increment conversation count
  updates.conversationCount = currentContext.conversationCount + 1;
  
  // Add city to preferred cities if detected
  if (analysis.city) {
    const preferredCities = currentContext.preferredCities || [];
    if (!preferredCities.includes(analysis.city)) {
      updates.preferredCities = [...preferredCities, analysis.city].slice(-5);
    }
  }
  
  return updates;
}

// ==================== HELPER: GREETING ====================

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contextStr = searchParams.get('context');
    
    const context: UserContext = contextStr 
      ? JSON.parse(contextStr)
      : {
          budget: 'moderate',
          preferredCities: [],
          conversationCount: 0,
          recentQueries: []
        };
    
    const greeting = gladysCompanion.generateGreeting(context);
    
    return NextResponse.json({
      companionResponse: greeting,
      agentAnalysis: null
    });
    
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}