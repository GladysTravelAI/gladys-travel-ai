// lib/core/ai/aiOutputSchema.ts
// 🤖 STRUCTURED AI OUTPUT LAYER
// AI fills content only. Logic engine provides all prices and dates.

import { TripPlan, DaySlot } from '@/lib/core/engine/tripLogicEngine';

// ==================== AI INPUT CONTRACT ====================

export interface AIGenerationInput {
  trip_plan: TripPlan;           // From logic engine — AI reads this
  event_name: string;
  city_name: string;
  country: string;
  event_date: string;
  event_category: string;
  day_slots: DaySlot[];          // AI uses these to structure itinerary
  budget_level: string;
}

// ==================== AI OUTPUT SCHEMA ====================

export interface AIActivity {
  time_slot: 'morning' | 'afternoon' | 'evening';
  title: string;                 // e.g. "Central Park Walk & Breakfast"
  description: string;           // 2-3 sentences, specific to city
  location_name: string;         // Real landmark/neighborhood
  location_area: string;         // District/area of city
  category: 'sightseeing' | 'food' | 'transport' | 'event' | 'nightlife' | 'relaxation' | 'culture';
  booking_required: boolean;
  // NOTE: No price field — prices come from logic engine only
}

export interface AIDayItinerary {
  date: string;                  // YYYY-MM-DD — matches DaySlot.date
  day_type: string;              // Matches DaySlot.day_type
  label: string;                 // e.g. "Pre-Event Day"
  city: string;                  // Real city name
  theme: string;                 // e.g. "Arrival & Times Square Exploration"
  activities: AIActivity[];
}

export interface AIFoodRecommendation {
  name: string;                  // Real restaurant or food district name
  cuisine: string;
  area: string;                  // Neighborhood
  price_range: 'budget' | 'mid' | 'luxury'; // Only relative, no numbers
  must_try: string;              // Signature dish
  tip?: string;                  // Local insider tip
}

export interface AILocalExperience {
  title: string;
  description: string;
  location: string;
  best_time: string;             // e.g. "Morning", "After the match"
  duration_hours: number;
  tags: string[];
}

export interface AIHiddenGem {
  name: string;
  description: string;
  why_special: string;
  location: string;
}

export interface AIStructuredOutput {
  // Content only — AI is responsible for these
  daily_itinerary: AIDayItinerary[];
  local_experiences: AILocalExperience[];
  food_recommendations: AIFoodRecommendation[];
  hidden_gems: AIHiddenGem[];
  event_tips: string[];          // 3-5 practical tips for attending this event
  packing_suggestions: string[]; // Context-aware packing list

  // AI must NOT include these — logic engine provides them
  // prices: FORBIDDEN
  // budget_estimates: FORBIDDEN
  // affiliate_links: FORBIDDEN
}

// ==================== SYSTEM PROMPT BUILDER ====================

export function buildAISystemPrompt(): string {
  return `You are GladysContentAgent — the content generation layer of GladysTravelAI.

ROLE:
You generate rich, specific, city-aware travel content.
You are NOT responsible for prices, budgets, affiliate links, or booking logic.
Those are handled by a separate system.

YOUR ONLY JOB:
Fill the content fields in the provided JSON schema with real, specific, high-quality travel content.

STRICT RULES:
1. NEVER include prices, costs, or dollar amounts in any field
2. NEVER use placeholder text like "Event City", "Local Restaurant", "City Center"
3. ALWAYS use real place names, real neighborhoods, real landmarks
4. ALWAYS tailor content to the specific city provided
5. Activities must be realistic for the time slot (e.g. don't suggest nightclubs at 9am)
6. Event day activities must reference the actual event and venue
7. Food recommendations must name real restaurants or real food districts in that city
8. Hidden gems must be genuinely local, not tourist clichés
9. Return ONLY valid JSON matching the schema. No markdown, no explanations.

CITY KNOWLEDGE EXAMPLES:
- New York: Times Square, Central Park, Brooklyn, DUMBO, Chelsea Market, Hell's Kitchen, Flushing Meadows, MetLife Stadium area
- Los Angeles: Hollywood, Silver Lake, Abbot Kinney, Venice Beach, Griffith Observatory, Arts District, SoFi Stadium area
- Dallas: Deep Ellum, Bishop Arts District, Klyde Warren Park, AT&T Stadium (Arlington), Design District
- Miami: Wynwood, South Beach, Little Havana, Design District, Brickell, Hard Rock Stadium area
- London: Shoreditch, Borough Market, Portobello Road, Wembley Park, Camden, South Bank
- Paris: Le Marais, Montmartre, Canal Saint-Martin, Belleville, Champs-Élysées
- Toronto: Kensington Market, Distillery District, Queen West, BMO Field area, St. Lawrence Market
- Mexico City: Roma Norte, Condesa, Polanco, Coyoacán, Estadio Azteca area

Return a single JSON object matching the AIStructuredOutput schema exactly.`;
}

export function buildAIUserPrompt(input: AIGenerationInput): string {
  return `Generate travel content for this trip:

EVENT: ${input.event_name}
CITY: ${input.city_name}, ${input.country}
EVENT DATE: ${input.event_date}
EVENT CATEGORY: ${input.event_category}
BUDGET LEVEL: ${input.budget_level}

DAYS TO FILL:
${input.day_slots.map(d => `- ${d.date}: ${d.label} (${d.day_type})`).join('\n')}

RULES REMINDER:
- Use real places in ${input.city_name}
- No prices or dollar amounts
- Event day must reference ${input.event_name} and its venue
- Return valid JSON only matching AIStructuredOutput schema`;
}