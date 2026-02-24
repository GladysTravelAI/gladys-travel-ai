// app/api/agent/route.ts
// 🤖 GLADYS AGENT - INFRASTRUCTURE GRADE
// Orchestrates: EventRegistry → Ticketmaster → LogicEngine → AI Content → AffiliateWrapper

import { NextRequest, NextResponse } from 'next/server';
import { openai, OPENAI_CONFIG } from '@/lib/openai/client';
import { buildAISystemPrompt, buildAIUserPrompt } from '@/lib/core/ai/aiOutputSchema';
import { generateTripPlan } from '@/lib/core/engine/tripLogicEngine';
import { buildFlightUrl, buildHotelUrl, buildESimUrl, buildInsuranceUrl, buildTransferUrl, buildAirHelpUrl } from '@/lib/core/monetization/affiliateWrapper';
import { searchEvents, findEventById, getCitiesForEvent } from '@/lib/data/eventRegistry';
import { executeHotelSearch } from '@/lib/tools/travelpayoutsHotelTool';
import { executeFlightSearch } from '@/lib/tools/travelpayoutsFlightTool';
import { findBestEventMatch, type NormalizedEvent } from '@/lib/services/ticketmaster';
import { findBestPHQMatch } from '@/lib/services/predicthq';

// ==================== TYPES ====================

type BudgetLevel = 'budget' | 'mid' | 'luxury';
type DayType = 'arrival' | 'pre_event' | 'event_day' | 'post_event' | 'departure';

// ==================== HELPERS ====================

function safeJSONParse(content: string) {
  try { return JSON.parse(content); } catch { return null; }
}

function mapTMCategory(category: NormalizedEvent['category']): string {
  if (category === 'sports')   return 'sports';
  if (category === 'music')    return 'music';
  if (category === 'festival') return 'festival';
  return 'other';
}

function estimateBudget(budgetLevel: BudgetLevel) {
  const m: Record<BudgetLevel, number> = { budget: 0.6, mid: 1, luxury: 2 };
  const x = m[budgetLevel];
  return {
    accommodation:   Math.round(400 * x),
    transport:       Math.round(350 * x),
    food:            Math.round(200 * x),
    event_tickets:   Math.round(300 * x),
    activities:      Math.round(200 * x),
    total:           Math.round(1450 * x),
    currency:        'USD',
    per_day_average: Math.round(290 * x),
  };
}

function parseBudgetLevel(raw: string): BudgetLevel {
  if (raw === 'budget' || raw === 'luxury') return raw;
  return 'mid';
}

// ==================== CITY SELECTION RESPONSE ====================

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

// ==================== MAIN ROUTE ====================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message, context,
      selected_event_id, selected_city_id, selected_match_date,
      budget_level = 'mid',
      origin_country_code, user_session,
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const budgetLevel: BudgetLevel = parseBudgetLevel(budget_level);
    console.log('🧠 Agent received:', message);

    // PHASE 0: City already selected
    if (selected_event_id && selected_city_id && selected_match_date) {
      return await buildRegistryTripResponse({
        eventId: selected_event_id,
        cityId: selected_city_id,
        matchDate: selected_match_date,
        budgetLevel,
        originCountryCode: origin_country_code,
        userSession: user_session,
      });
    }

    // PHASE 1: Internal registry (World Cup, F1, etc.)
    const registryResults = searchEvents(message);
    if (registryResults.length > 0) {
      const event = registryResults[0];
      if (event.multi_city) {
        console.log('🌍 Multi-city event:', event.name);
        return NextResponse.json({ success: true, data: buildCitySelectionResponse(event.event_id) });
      }
      const city = event.cities[0];
      return await buildRegistryTripResponse({
        eventId: event.event_id,
        cityId: city.city_id,
        matchDate: event.start_date,
        budgetLevel,
        originCountryCode: origin_country_code,
        userSession: user_session,
      });
    }

    // PHASE 2: Ticketmaster — real event data for everything else
    console.log('🎟️ Checking Ticketmaster for:', message);
    const tmEvent = await findBestEventMatch(message);
    if (tmEvent) {
      console.log(`✅ TM found: ${tmEvent.name} @ ${tmEvent.venue}, ${tmEvent.city}`);
      return await buildTicketmasterTripResponse({
        tmEvent,
        message,
        budgetLevel,
        originCountryCode: origin_country_code,
        userSession: user_session,
        context,
      });
    }

    // PHASE 3: PredictHQ — soccer globally, African/Asian festivals, free events
    console.log('🌍 Checking PredictHQ for:', message);
    const phqEvent = await findBestPHQMatch(message);
    if (phqEvent) {
      console.log(`✅ PHQ found: ${phqEvent.name} in ${phqEvent.city}`);
      const mappedEvent: NormalizedEvent = {
        id: phqEvent.id,
        name: phqEvent.name,
        category: phqEvent.category,
        date: phqEvent.date,
        venue: phqEvent.venue || phqEvent.city,
        city: phqEvent.city,
        country: phqEvent.country,
        countryCode: phqEvent.countryCode,
        ticketUrl: '',
        image: undefined,
        status: 'onsale',
        attraction: undefined,
      };
      return await buildTicketmasterTripResponse({
        tmEvent: mappedEvent,
        message,
        budgetLevel,
        originCountryCode: origin_country_code,
        userSession: user_session,
        context,
      });
    }

    // PHASE 4: Pure AI fallback
    console.log('🤖 No event found anywhere, using AI fallback');
    return await buildAIFallbackResponse({ message, context, budgetLevel });

  } catch (error: any) {
    console.error('❌ Agent error:', error);
    return NextResponse.json({
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
    }, { status: 500 });
  }
}

// ==================== TICKETMASTER TRIP BUILDER ====================

async function buildTicketmasterTripResponse({
  tmEvent, message, budgetLevel, originCountryCode, userSession, context,
}: {
  tmEvent: NormalizedEvent;
  message: string;
  budgetLevel: BudgetLevel;
  originCountryCode?: string;
  userSession?: string;
  context?: any;
}) {
  const totalDays = context?.days || 5;
  const budget = estimateBudget(budgetLevel);
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  const eventDate = new Date(tmEvent.date);
  const arrivalDate = new Date(eventDate);
  arrivalDate.setDate(arrivalDate.getDate() - 2);
  const departureDate = new Date(eventDate);
  departureDate.setDate(departureDate.getDate() + (totalDays - 3));

  // Stable event_id for affiliate tracking
  const tmEventId = `tm-${tmEvent.id}`;

  // Build day slots with strict DayType
  const daySlots = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(arrivalDate);
    d.setDate(d.getDate() + i);
    const dateStr = fmt(d);
    const isEvent = dateStr === tmEvent.date;

    const dayType: DayType =
      i === 0               ? 'arrival'
      : isEvent              ? 'event_day'
      : d < eventDate        ? 'pre_event'
      : i === totalDays - 1  ? 'departure'
      : 'post_event';

    return {
      date: dateStr,
      day_type: dayType,
      label:
        dayType === 'event_day'    ? 'Event Day'
        : dayType === 'arrival'    ? 'Arrival Day'
        : dayType === 'departure'  ? 'Departure Day'
        : dayType === 'pre_event'  ? 'Pre-Event Day'
        : 'Post-Event Day',
    };
  });

  const originIATA = originCountryCode === 'ZA' ? 'JNB' : (context?.origin || 'NYC');

  const [hotels, flights] = await Promise.all([
    executeHotelSearch({
      city: tmEvent.city,
      check_in: fmt(arrivalDate),
      check_out: fmt(departureDate),
      guests: context?.groupSize || 1,
    }).catch(() => []),
    executeFlightSearch({
      origin: originIATA,
      destination: tmEvent.countryCode,
      departure_date: fmt(arrivalDate),
      return_date: fmt(departureDate),
    }).catch(() => []),
  ]);

  const aiCompletion = await openai.chat.completions.create({
    ...OPENAI_CONFIG,
    messages: [
      { role: 'system', content: buildAISystemPrompt() },
      {
        role: 'user',
        content: buildAIUserPrompt({
          event_name: tmEvent.name,
          city_name: tmEvent.city,
          country: tmEvent.country,
          event_date: tmEvent.date,
          event_category: tmEvent.category,
          
          
          
          budget_level: budgetLevel,
          day_slots: daySlots,
        })
      }
    ],
    response_format: { type: 'json_object' }
  });

  const aiContent = safeJSONParse(aiCompletion.choices[0].message.content || '');

  return NextResponse.json({
    success: true,
    data: {
      intent: 'event_trip',
      source: 'ticketmaster',
      destination: { city: tmEvent.city, country: tmEvent.country },
      event: {
        name: tmEvent.name,
        type: mapTMCategory(tmEvent.category),
        date: tmEvent.date,
        time: tmEvent.time,
        venue: tmEvent.venue,
        image: tmEvent.image,
        ticketUrl: tmEvent.ticketUrl,
        priceMin: tmEvent.priceMin,
        priceMax: tmEvent.priceMax,
        currency: tmEvent.currency,
        attraction: tmEvent.attraction,
      },
      travel_dates: {
        arrival_date: fmt(arrivalDate),
        departure_date: fmt(departureDate),
        total_nights: totalDays - 1,
        day_slots: daySlots,
      },
      budget,
      hotels,
      flights,
      itinerary: aiContent?.daily_itinerary || [],
      affiliate_links: {
        hotel: buildHotelUrl({
          city: tmEvent.city,
          check_in: fmt(arrivalDate),
          check_out: fmt(departureDate),
          event_id: tmEventId,        // ✅ required field satisfied
          budget_level: budgetLevel,
          user_session: userSession,
        }).url,
        flight: buildFlightUrl({
          origin_iata: originIATA,
          dest_iata: tmEvent.countryCode,
          depart_date: fmt(arrivalDate),
          return_date: fmt(departureDate),
          city: tmEvent.city,
          event_id: tmEventId,        // ✅ required field satisfied
          budget_level: budgetLevel,
          user_session: userSession,
        }).url,
        tickets: tmEvent.ticketUrl,
      },
      upsells: { insurance: true, esim: true },
      message: `Your trip to ${tmEvent.name} in ${tmEvent.city} is ready.`,
    }
  });
}

// ==================== AI FALLBACK ====================

async function buildAIFallbackResponse({
  message, context, budgetLevel,
}: {
  message: string;
  context?: any;
  budgetLevel: BudgetLevel;
}) {
  const completion = await openai.chat.completions.create({
    ...OPENAI_CONFIG,
    messages: [
      { role: 'system', content: buildAISystemPrompt() },
      {
        role: 'user',
        content: `User message: ${message}\nContext: ${JSON.stringify(context || {})}\nReturn STRICT JSON only.`
      }
    ],
    response_format: { type: 'json_object' }
  });
  const content = safeJSONParse(completion.choices[0].message.content || '');
  if (!content) throw new Error('Invalid JSON from AI fallback');
  return NextResponse.json({ success: true, data: content, usage: completion.usage });
}

// ==================== REGISTRY TRIP BUILDER ====================

async function buildRegistryTripResponse({
  eventId, cityId, matchDate, budgetLevel, originCountryCode, userSession,
}: {
  eventId: string;
  cityId: string;
  matchDate: string;
  budgetLevel: BudgetLevel;
  originCountryCode?: string;
  userSession?: string;
}) {
  const event = findEventById(eventId);
  if (!event) throw new Error(`Event not found: ${eventId}`);
  const city = event.cities.find(c => c.city_id === cityId);
  if (!city) throw new Error(`City not found: ${cityId}`);

  console.log(`🏗️ Building trip: ${event.name} → ${city.name} on ${matchDate}`);

  const tripPlan = generateTripPlan({
    event,
    selected_city: city,
    match_date: matchDate,
    budget_level: budgetLevel,
    origin_country_code: originCountryCode,
  });

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

  const aiCompletion = await openai.chat.completions.create({
    ...OPENAI_CONFIG,
    messages: [
      { role: 'system', content: buildAISystemPrompt() },
      {
        role: 'user',
        content: buildAIUserPrompt({
          trip_plan: tripPlan,
          event_name: event.name,
          city_name: city.name,
          country: city.country,
          event_date: matchDate,
          event_category: event.category,
          day_slots: tripPlan.travel_dates.day_slots,
          budget_level: budgetLevel,
        })
      }
    ],
    response_format: { type: 'json_object' }
  });

  const aiContent = safeJSONParse(aiCompletion.choices[0].message.content || '');

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
      travel_dates: tripPlan.travel_dates,
      budget: tripPlan.budget,
      upsells: tripPlan.upsells,
      hotels,
      flights,
      itinerary: aiContent?.daily_itinerary || [],
      local_experiences: aiContent?.local_experiences || [],
      food_recommendations: aiContent?.food_recommendations || [],
      hidden_gems: aiContent?.hidden_gems || [],
      event_tips: aiContent?.event_tips || [],
      affiliate_links: {
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
        esim: tripPlan.upsells.esim
          ? buildESimUrl({
              destination_country: city.country,
              event_id: eventId,
              city: city.name,
              user_session: userSession,
            }).url
          : null,
        insurance: tripPlan.upsells.insurance
          ? buildInsuranceUrl({
              destination: city.country,
              start_date: tripPlan.travel_dates.arrival_date,
              end_date: tripPlan.travel_dates.departure_date,
              event_id: eventId,
              city: city.name,
              user_session: userSession,
            }).url
          : null,
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
      },
      message: `Your ${budgetLevel} trip to ${event.name} in ${city.name} is ready.`
    }
  });
}