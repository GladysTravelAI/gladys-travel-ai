// app/api/agent/route.ts
// 🤖 GLADYS AGENT - INFRASTRUCTURE GRADE
// Orchestrates: EventRegistry → LogicEngine → AI Content → AffiliateWrapper

import { NextRequest, NextResponse } from 'next/server';
import { openai, OPENAI_CONFIG } from '@/lib/openai/client';
import { buildAISystemPrompt, buildAIUserPrompt } from '@/lib/core/ai/aiOutputSchema';
import { generateTripPlan } from '@/lib/core/engine/tripLogicEngine';
import { buildFlightUrl, buildHotelUrl, buildESimUrl, buildInsuranceUrl, buildTransferUrl, buildAirHelpUrl } from '@/lib/core/monetization/affiliateWrapper';
import { searchEvents, findEventById, isMultiCityEvent, getCitiesForEvent } from '@/lib/data/eventRegistry';
import { executeEventSearch, eventIntelToolDefinition } from '@/lib/tools/eventIntelTool';
import { executeHotelSearch, hotelSearchToolDefinition } from '@/lib/tools/travelpayoutsHotelTool';
import { executeFlightSearch, flightSearchToolDefinition } from '@/lib/tools/travelpayoutsFlightTool';
const TOOLS = [eventIntelToolDefinition, hotelSearchToolDefinition, flightSearchToolDefinition];

function safeJSONParse(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// ==================== MULTI-CITY HANDLER ====================
// Returns city selection data instead of a full trip
// Frontend shows city picker UI before generating trip

function buildCitySelectionResponse(eventId: string) {
  const event = findEventById(eventId);
  if (!event) return null;

  const cities = getCitiesForEvent(eventId);

  return {
    intent: 'city_selection_required',
    event_id: event.event_id,
    event_name: event.name,
    event_description: event.description,
    start_date: event.start_date,
    end_date: event.end_date,
    cities: cities.map(city => ({
      city_id: city.city_id,
      name: city.name,
      country: city.country,
      iata_code: city.iata_code,
      sessions: (event.sessions || [])
        .filter(s => s.city_id === city.city_id)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(s => ({
          session_id: s.session_id,
          date: s.date,
          time: s.time,
          round: s.round,
          description: s.description,
        }))
    })),
    message: `${event.name} spans ${cities.length} cities. Which city and match date would you like to attend?`
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      context,
      // City selection params — sent after user picks a city
      selected_event_id,
      selected_city_id,
      selected_match_date,
      budget_level = 'mid',
      origin_country_code,
      user_session,
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log('🧠 Agent received:', message);

    // =========================
    // PHASE 0: Check if city was already selected
    // (user came back after city picker)
    // =========================
    if (selected_event_id && selected_city_id && selected_match_date) {
      return await buildFullTripResponse({
        eventId: selected_event_id,
        cityId: selected_city_id,
        matchDate: selected_match_date,
        budgetLevel: budget_level,
        originCountryCode: origin_country_code,
        userSession: user_session,
      });
    }

    // =========================
    // PHASE 1: Check internal event registry first
    // =========================
    const registryResults = searchEvents(message);

    if (registryResults.length > 0) {
      const event = registryResults[0];

      // Multi-city event → return city picker
      if (event.multi_city) {
        console.log('🌍 Multi-city event detected:', event.name);
        const citySelection = buildCitySelectionResponse(event.event_id);
        return NextResponse.json({ success: true, data: citySelection });
      }

      // Single-city event → build trip directly
      const city = event.cities[0];
      return await buildFullTripResponse({
        eventId: event.event_id,
        cityId: city.city_id,
        matchDate: event.start_date,
        budgetLevel: budget_level,
        originCountryCode: origin_country_code,
        userSession: user_session,
      });
    }

    // =========================
    // PHASE 2: No registry match → fall back to OpenAI tool orchestration
    // (handles Ticketmaster events, artist searches, etc.)
    // =========================
    console.log('📡 No registry match, using OpenAI tool orchestration');

    const userPayload = `User message: ${message}\nContext: ${JSON.stringify(context || {})}\nReturn STRICT JSON only.`;

    const initialCompletion = await openai.chat.completions.create({
      ...OPENAI_CONFIG,
      messages: [
        { role: 'system', content: buildAISystemPrompt() },
        { role: 'user', content: userPayload }
      ],
      tools: TOOLS,
      tool_choice: 'auto'
    });

    const initialMessage = initialCompletion.choices[0].message;

    if (initialMessage.tool_calls?.length) {
      const toolResults = await Promise.all(
        initialMessage.tool_calls.map(async (toolCall) => {
          if (toolCall.type !== 'function') {
            return { tool_call_id: toolCall.id, role: 'tool' as const, name: 'unknown', content: JSON.stringify({ error: 'Unsupported tool type' }) };
          }

          const functionName = toolCall.function.name;
          const functionArgs = safeJSONParse(toolCall.function.arguments || '{}') || {};
          let result: any = {};

          try {
            switch (functionName) {
              case 'search_events':  result = await executeEventSearch(functionArgs); break;
              case 'search_hotels':  result = await executeHotelSearch(functionArgs); break;
              case 'search_flights': result = await executeFlightSearch(functionArgs); break;
              default: result = { error: 'Unknown tool' };
            }
          } catch (toolError: any) {
            console.error(`❌ Tool error (${functionName}):`, toolError);
            result = { error: toolError.message || 'Tool execution failed' };
          }

          return { tool_call_id: toolCall.id, role: 'tool' as const, name: functionName, content: JSON.stringify(result) };
        })
      );

      const finalCompletion = await openai.chat.completions.create({
        ...OPENAI_CONFIG,
        messages: [
          { role: 'system', content: buildAISystemPrompt() },
          { role: 'user', content: userPayload },
          initialMessage,
          ...toolResults
        ],
        response_format: { type: 'json_object' }
      });

      const finalContent = finalCompletion.choices[0].message.content;
      const parsedResponse = safeJSONParse(finalContent || '');

      if (!parsedResponse) throw new Error('Invalid JSON from OpenAI');

      return NextResponse.json({ success: true, data: parsedResponse, usage: finalCompletion.usage });
    }

    // No tools needed
    const directContent = initialMessage.content;
    const parsedResponse = safeJSONParse(directContent || '');
    if (!parsedResponse) throw new Error('Invalid JSON from OpenAI');

    return NextResponse.json({ success: true, data: parsedResponse, usage: initialCompletion.usage });

  } catch (error: any) {
    console.error('❌ Agent error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Agent processing failed',
        data: {
          intent: 'information_only',
          destination: { city: null, country: null },
          event: { name: null, type: null, date: null, venue: null },
          itinerary: [], hotels: [], flights: [],
          affiliate_links: { hotel: '', flight: '', tickets: '' },
          upsells: { insurance: false, esim: false },
          message: 'Agent execution fallback triggered.'
        }
      },
      { status: 500 }
    );
  }
}

// ==================== FULL TRIP BUILDER ====================

async function buildFullTripResponse({
  eventId,
  cityId,
  matchDate,
  budgetLevel,
  originCountryCode,
  userSession,
}: {
  eventId: string;
  cityId: string;
  matchDate: string;
  budgetLevel: 'budget' | 'mid' | 'luxury';
  originCountryCode?: string;
  userSession?: string;
}) {
  const event = findEventById(eventId);
  if (!event) throw new Error(`Event not found: ${eventId}`);

  const city = event.cities.find(c => c.city_id === cityId);
  if (!city) throw new Error(`City not found: ${cityId}`);

  console.log(`🏗️ Building trip: ${event.name} → ${city.name} on ${matchDate}`);

  // STEP 1: Logic engine computes dates, budget, upsells
  const tripPlan = generateTripPlan({
    event,
    selected_city: city,
    match_date: matchDate,
    budget_level: budgetLevel,
    origin_country_code: originCountryCode,
  });

  // STEP 2: Fetch real hotels + flights in parallel
  const [hotels, flights] = await Promise.all([
    executeHotelSearch({
      city: city.name,
      check_in: tripPlan.travel_dates.arrival_date,
      check_out: tripPlan.travel_dates.departure_date,
      guests: 2,
    }).catch(() => []),
    executeFlightSearch({
      origin: originCountryCode === 'ZA' ? 'JNB' : 'origin',
      destination: city.iata_code,
      departure_date: tripPlan.travel_dates.arrival_date,
      return_date: tripPlan.travel_dates.departure_date,
    }).catch(() => []),
  ]);

  // STEP 3: AI generates content only (no prices)
  const aiInput = {
    trip_plan: tripPlan,
    event_name: event.name,
    city_name: city.name,
    country: city.country,
    event_date: matchDate,
    event_category: event.category,
    day_slots: tripPlan.travel_dates.day_slots,
    budget_level: budgetLevel,
  };

  const aiCompletion = await openai.chat.completions.create({
    ...OPENAI_CONFIG,
    messages: [
      { role: 'system', content: buildAISystemPrompt() },
      { role: 'user', content: buildAIUserPrompt(aiInput) }
    ],
    response_format: { type: 'json_object' }
  });

  const aiContent = safeJSONParse(aiCompletion.choices[0].message.content || '');

  // STEP 4: Build affiliate URLs with tracking
  const affiliateLinks = {
    hotel: buildHotelUrl({
      city: city.name,
      check_in: tripPlan.travel_dates.arrival_date,
      check_out: tripPlan.travel_dates.departure_date,
      event_id: eventId,
      budget_level: budgetLevel,
      user_session: userSession,
    }).url,
    flight: buildFlightUrl({
      origin_iata: 'JNB',
      dest_iata: city.iata_code,
      depart_date: tripPlan.travel_dates.arrival_date,
      return_date: tripPlan.travel_dates.departure_date,
      event_id: eventId,
      city: city.name,
      budget_level: budgetLevel,
      user_session: userSession,
    }).url,
    esim: tripPlan.upsells.esim ? buildESimUrl({
      destination_country: city.country,
      event_id: eventId,
      city: city.name,
      user_session: userSession,
    }).url : null,
    insurance: tripPlan.upsells.insurance ? buildInsuranceUrl({
      destination: city.country,
      start_date: tripPlan.travel_dates.arrival_date,
      end_date: tripPlan.travel_dates.departure_date,
      event_id: eventId,
      city: city.name,
      user_session: userSession,
    }).url : null,
    transfer: buildTransferUrl({
      from: `${city.iata_code} Airport`,
      to: city.name,
      date: tripPlan.travel_dates.arrival_date,
      event_id: eventId,
      city: city.name,
      user_session: userSession,
    }).url,
    airhelp: buildAirHelpUrl({
      event_id: eventId,
      city: city.name,
      user_session: userSession,
    }).url,
  };

  // STEP 5: Assemble final response
  return NextResponse.json({
    success: true,
    data: {
      intent: 'event_trip',
      event_id: eventId,
      event_name: event.name,
      destination: {
        city: city.name,
        country: city.country,
        iata_code: city.iata_code,
      },
      event: {
        name: event.name,
        type: event.category,
        date: matchDate,
        venue: event.venues.find(v => v.city_id === cityId)?.name || city.name,
      },
      // From logic engine — source of truth for all numbers
      travel_dates: tripPlan.travel_dates,
      budget: tripPlan.budget,
      upsells: tripPlan.upsells,
      // From real APIs
      hotels,
      flights,
      // From AI — content only
      itinerary: aiContent?.daily_itinerary || [],
      local_experiences: aiContent?.local_experiences || [],
      food_recommendations: aiContent?.food_recommendations || [],
      hidden_gems: aiContent?.hidden_gems || [],
      event_tips: aiContent?.event_tips || [],
      // Tracked affiliate links
      affiliate_links: affiliateLinks,
      message: `Your ${budgetLevel} trip to ${event.name} in ${city.name} is ready.`
    }
  });
}