// lib/core/types/event.ts
// 🏗️ UNIVERSAL EVENT SCHEMA - GladysTravel Infrastructure

export type EventCategory = 'sports' | 'music' | 'festival' | 'conference';
export type BudgetLevel = 'budget' | 'mid' | 'luxury';
export type TripPattern = 'single_day' | 'weekend' | 'week' | 'extended';

export interface EventCity {
  city_id: string;
  name: string;
  country: string;
  country_code: string; // ISO 3166-1 alpha-2
  iata_code: string;    // Nearest major airport
  timezone: string;     // IANA timezone string
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface EventVenue {
  venue_id: string;
  name: string;
  city_id: string;      // References EventCity.city_id
  capacity?: number;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface MatchOrSession {
  session_id: string;
  venue_id: string;
  city_id: string;
  date: string;         // ISO 8601 YYYY-MM-DD
  time?: string;        // Local time HH:MM
  description?: string; // e.g. "Group A: Brazil vs Argentina"
  round?: string;       // e.g. "Group Stage", "Quarter Final", "Final"
}

export interface TripPatternDefaults {
  days_before_event: number;
  days_after_event: number;
  recommended_trip_length: number; // total days
  pattern: TripPattern;
}

export interface PricingConfig {
  demand_multiplier: number;   // 1.0 = normal, 2.0 = double demand
  price_surge_factor: number;  // Applied to accommodation estimates
  base_daily_budget: {
    budget: number;
    mid: number;
    luxury: number;
    currency: string;
  };
}

export interface TrademarkInfo {
  is_trademarked: boolean;
  owner?: string;
  disclaimer?: string;
}

export interface UniversalEvent {
  event_id: string;
  name: string;
  slug: string;             // URL-safe identifier e.g. "fifa-world-cup-2026"
  category: EventCategory;
  
  // Geography
  multi_city: boolean;
  cities: EventCity[];       // Single item for single-city events
  venues: EventVenue[];
  sessions?: MatchOrSession[]; // For multi-day/multi-city tournaments

  // Dates
  start_date: string;        // ISO 8601
  end_date: string;
  registration_opens?: string;

  // Travel Intelligence
  default_trip_pattern: TripPatternDefaults;
  pricing: PricingConfig;

  // Metadata
  description?: string;
  hero_image?: string;
  official_url?: string;
  tags?: string[];
  trademark?: TrademarkInfo;
  source?: string;
  is_recurring?: boolean;    // Annual events like Coachella, Oktoberfest
  recurrence_month?: number; // Month it typically occurs (1-12)
}