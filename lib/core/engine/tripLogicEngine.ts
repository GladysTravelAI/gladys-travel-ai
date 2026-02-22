// lib/core/engine/tripLogicEngine.ts
// ⚙️ EVENT LOGIC ENGINE - Pure computation, no AI, no side effects

import {
  UniversalEvent,
  EventCity,
  BudgetLevel,
  MatchOrSession,
} from '@/lib/core/types/event';

// ==================== INPUT ====================

export interface TripPlanInput {
  event: UniversalEvent;
  selected_city: EventCity;
  match_date?: string;       // YYYY-MM-DD — specific match/session date
  budget_level: BudgetLevel;
  trip_length?: number;      // Override default trip length
  origin_country_code?: string; // To determine upsells
}

// ==================== OUTPUT ====================

export interface DaySlot {
  date: string;              // YYYY-MM-DD
  day_type: 'arrival' | 'pre_event' | 'event_day' | 'post_event' | 'departure';
  label: string;             // e.g. "Pre-Event Day", "Match Day"
}

export interface BudgetBreakdown {
  accommodation: number;
  transport: number;         // Flights/transfers
  food: number;
  event_tickets: number;
  activities: number;
  esim?: number;
  insurance?: number;
  total: number;
  currency: string;
  per_day_average: number;
}

export interface TravelDates {
  arrival_date: string;
  departure_date: string;
  total_nights: number;
  day_slots: DaySlot[];
}

export interface UpsellFlags {
  insurance: boolean;        // International travel
  esim: boolean;             // Foreign country
  airport_transfer: boolean; // Always true for event travel
  luggage_storage: boolean;  // If departure is after event ends
  flight_compensation: boolean; // Always true for flights
}

export interface TripPlan {
  event_id: string;
  event_name: string;
  selected_city: EventCity;
  match_date?: string;
  budget_level: BudgetLevel;
  travel_dates: TravelDates;
  budget: BudgetBreakdown;
  upsells: UpsellFlags;
  search_params: {
    hotel_check_in: string;
    hotel_check_out: string;
    flight_origin_iata?: string;
    flight_dest_iata: string;
    passengers: number;
  };
}

// ==================== BUDGET TABLES ====================

const BUDGET_MULTIPLIERS: Record<BudgetLevel, number> = {
  budget: 0.6,
  mid: 1.0,
  luxury: 2.2,
};

const ACCOMMODATION_SPLIT = 0.35;
const TRANSPORT_SPLIT = 0.20;
const FOOD_SPLIT = 0.15;
const EVENT_SPLIT = 0.20;
const ACTIVITIES_SPLIT = 0.10;

// ==================== HELPERS ====================

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from);
  const b = new Date(to);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function buildDaySlots(
  arrivalDate: string,
  eventDate: string,
  departureDate: string
): DaySlot[] {
  const slots: DaySlot[] = [];
  let current = arrivalDate;

  while (current <= departureDate) {
    let day_type: DaySlot['day_type'];
    let label: string;

    if (current === arrivalDate && current < eventDate) {
      day_type = 'arrival';
      label = 'Arrival Day';
    } else if (current < eventDate) {
      day_type = 'pre_event';
      label = 'Pre-Event Day';
    } else if (current === eventDate) {
      day_type = 'event_day';
      label = 'Event Day';
    } else if (current === departureDate) {
      day_type = 'departure';
      label = 'Departure Day';
    } else {
      day_type = 'post_event';
      label = 'Post-Event Day';
    }

    slots.push({ date: current, day_type, label });
    current = addDays(current, 1);
  }

  return slots;
}

// ==================== CATEGORY RULES ====================

function applyEventCategoryRules(event: UniversalEvent, tripLength: number) {
  switch (event.category) {
    case 'sports':
      return {
        days_before: event.default_trip_pattern.days_before_event,
        days_after: event.default_trip_pattern.days_after_event,
        ticket_cost_multiplier: 1.5, // Sports events have expensive tickets
      };
    case 'music':
      return {
        days_before: Math.max(event.default_trip_pattern.days_before_event, 1),
        days_after: event.default_trip_pattern.days_after_event,
        ticket_cost_multiplier: 1.0,
      };
    case 'festival':
      return {
        days_before: 1,
        days_after: 1,
        ticket_cost_multiplier: 0.8, // Festivals often have cheaper per-day tickets
      };
    case 'conference':
      return {
        days_before: 1,
        days_after: 1,
        ticket_cost_multiplier: 2.0, // Conferences have expensive registration
      };
    default:
      return {
        days_before: event.default_trip_pattern.days_before_event,
        days_after: event.default_trip_pattern.days_after_event,
        ticket_cost_multiplier: 1.0,
      };
  }
}

// ==================== MAIN ENGINE ====================

export function generateTripPlan(input: TripPlanInput): TripPlan {
  const { event, selected_city, match_date, budget_level, trip_length, origin_country_code } = input;

  // 1. Validate multi-city requirement
  if (event.multi_city && !selected_city) {
    throw new Error(`Event "${event.name}" is multi-city. A specific city must be selected before generating a trip plan.`);
  }

  // 2. Determine event date
  const eventDate = match_date || event.start_date;

  // 3. Apply category rules
  const rules = applyEventCategoryRules(event, trip_length || event.default_trip_pattern.recommended_trip_length);

  // 4. Calculate travel dates
  const arrivalDate = addDays(eventDate, -rules.days_before);
  const departureDate = addDays(eventDate, rules.days_after);
  const totalNights = daysBetween(arrivalDate, departureDate);
  const daySlots = buildDaySlots(arrivalDate, eventDate, departureDate);

  // 5. Calculate budget
  const base = event.pricing.base_daily_budget;
  const baseDailyRate = base[budget_level];
  const surgedDailyRate = baseDailyRate * event.pricing.demand_multiplier * event.pricing.price_surge_factor;
  const budgetMultiplier = BUDGET_MULTIPLIERS[budget_level];
  const totalBudget = surgedDailyRate * totalNights * budgetMultiplier;

  const breakdown: BudgetBreakdown = {
    accommodation: Math.round(totalBudget * ACCOMMODATION_SPLIT),
    transport: Math.round(totalBudget * TRANSPORT_SPLIT),
    food: Math.round(totalBudget * FOOD_SPLIT),
    event_tickets: Math.round(totalBudget * EVENT_SPLIT * rules.ticket_cost_multiplier),
    activities: Math.round(totalBudget * ACTIVITIES_SPLIT),
    total: 0,
    currency: base.currency,
    per_day_average: Math.round(surgedDailyRate * budgetMultiplier),
  };

  // 6. Determine upsells
  const isInternational = origin_country_code
    ? origin_country_code.toLowerCase() !== selected_city.country_code.toLowerCase()
    : true; // Default to international if unknown

  const upsells: UpsellFlags = {
    insurance: isInternational,
    esim: isInternational,
    airport_transfer: true,
    luggage_storage: rules.days_after > 0,
    flight_compensation: true,
  };

  // Add optional upsell costs to budget
  if (upsells.insurance) breakdown.insurance = Math.round(totalBudget * 0.03);
  if (upsells.esim) breakdown.esim = 15;

  breakdown.total = Object.values(breakdown)
    .filter((v): v is number => typeof v === 'number' && v > 0)
    .reduce((sum, v) => sum + v, 0);

  // 7. Build search params for affiliate tools
  const searchParams = {
    hotel_check_in: arrivalDate,
    hotel_check_out: departureDate,
    flight_dest_iata: selected_city.iata_code,
    passengers: 1,
  };

  return {
    event_id: event.event_id,
    event_name: event.name,
    selected_city,
    match_date: eventDate,
    budget_level,
    travel_dates: {
      arrival_date: arrivalDate,
      departure_date: departureDate,
      total_nights: totalNights,
      day_slots: daySlots,
    },
    budget: breakdown,
    upsells,
    search_params: searchParams,
  };
}

// ==================== MULTI-CITY HELPERS ====================

/**
 * Get all cities for a multi-city event
 * Used to show city selection UI before generating trip plan
 */
export function getEventCities(event: UniversalEvent): EventCity[] {
  return event.cities;
}

/**
 * Get all sessions/matches for a specific city
 */
export function getSessionsForCity(
  event: UniversalEvent,
  cityId: string
): MatchOrSession[] {
  return (event.sessions || []).filter(s => s.city_id === cityId);
}

/**
 * Get upcoming sessions sorted by date
 */
export function getUpcomingSessions(
  event: UniversalEvent,
  cityId?: string
): MatchOrSession[] {
  const today = new Date().toISOString().split('T')[0];
  let sessions = event.sessions || [];

  if (cityId) {
    sessions = sessions.filter(s => s.city_id === cityId);
  }

  return sessions
    .filter(s => s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}