// lib/eventOrchestrator.ts
// 🎯 Event Travel Orchestrator - Centralized Event Intelligence
//
// STRATEGIC ARCHITECTURE:
// - Centralizes event-level orchestration logic
// - Combines event data with travel intelligence
// - Prepares for Ticketmaster/affiliate integration
// - No UI logic - pure business layer
//
// FUTURE ENHANCEMENTS:
// - Ticketmaster API integration
// - Flight search orchestration
// - Hotel availability checking
// - Itinerary generation
// - Price tracking and alerts

import { 
  Event, 
  getAllEvents, 
  getEventById,
  getEventStatus, 
  generateEventTravelWindow,
  type EventStatus
} from './eventService';

// ==================== TYPE DEFINITIONS ====================

export interface EventTravelPlan {
  event: Event;
  status: EventStatus;
  travelWindow: {
    arrivalDate: Date;
    departureDate: Date;
  };
}

export interface EventTravelSummary {
  eventId: string;
  eventName: string;
  status: EventStatus;
  tripDuration: number; // Total days including travel buffer
  eventDuration: number; // Days of actual event
  recommendedArrival: string; // ISO date
  recommendedDeparture: string; // ISO date
}

// ==================== ORCHESTRATION FUNCTIONS ====================

/**
 * Get complete travel plan for an event
 * STRATEGIC: Single function to get all event + travel intelligence
 * 
 * @param eventId - Event identifier
 * @returns Complete travel plan or null if event not found
 */
export async function getEventTravelPlan(eventId: string): Promise<EventTravelPlan | null> {
  const event = getAllEvents().find(e => e.id === eventId);
  
  if (!event) {
    console.warn(`⚠️ Event not found: ${eventId}`);
    return null;
  }

  return {
    event,
    status: getEventStatus(event),
    travelWindow: generateEventTravelWindow(event),
  };
}

/**
 * Get travel summary for an event
 * STRATEGIC: Lightweight summary for lists and previews
 * 
 * @param eventId - Event identifier
 * @returns Travel summary or null if event not found
 */
export async function getEventTravelSummary(eventId: string): Promise<EventTravelSummary | null> {
  const travelPlan = await getEventTravelPlan(eventId);
  
  if (!travelPlan) {
    return null;
  }

  const { event, status, travelWindow } = travelPlan;
  
  // Calculate durations
  const eventStart = new Date(event.startDate);
  const eventEnd = new Date(event.endDate);
  const eventDuration = Math.ceil((eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  const tripDuration = Math.ceil(
    (travelWindow.departureDate.getTime() - travelWindow.arrivalDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  return {
    eventId: event.id,
    eventName: event.name,
    status,
    tripDuration,
    eventDuration,
    recommendedArrival: travelWindow.arrivalDate.toISOString().split('T')[0],
    recommendedDeparture: travelWindow.departureDate.toISOString().split('T')[0],
  };
}

/**
 * Get all upcoming events with travel plans
 * STRATEGIC: Used for homepage, search results, recommendations
 * 
 * @param limit - Maximum number of events to return
 * @returns Array of event travel plans
 */
export async function getUpcomingEventTravelPlans(limit?: number): Promise<EventTravelPlan[]> {
  const allEvents = getAllEvents();
  
  // Filter to upcoming events only
  const upcomingEvents = allEvents.filter(event => getEventStatus(event) === 'upcoming');
  
  // Sort by start date
  upcomingEvents.sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  
  // Apply limit if specified
  const events = limit ? upcomingEvents.slice(0, limit) : upcomingEvents;
  
  // Enrich with travel intelligence
  return events.map(event => ({
    event,
    status: getEventStatus(event),
    travelWindow: generateEventTravelWindow(event),
  }));
}

/**
 * Get live events with travel plans
 * STRATEGIC: Used for "happening now" features
 * 
 * @returns Array of currently live event travel plans
 */
export async function getLiveEventTravelPlans(): Promise<EventTravelPlan[]> {
  const allEvents = getAllEvents();
  
  // Filter to live events only
  const liveEvents = allEvents.filter(event => getEventStatus(event) === 'live');
  
  // Enrich with travel intelligence
  return liveEvents.map(event => ({
    event,
    status: getEventStatus(event),
    travelWindow: generateEventTravelWindow(event),
  }));
}

/**
 * Check if optimal travel window is still available
 * STRATEGIC: Helps users understand booking urgency
 * 
 * @param eventId - Event identifier
 * @returns Boolean indicating if recommended arrival date is in the future
 */
export async function isOptimalTravelWindowAvailable(eventId: string): Promise<boolean> {
  const travelPlan = await getEventTravelPlan(eventId);
  
  if (!travelPlan) {
    return false;
  }
  
  const now = new Date();
  return travelPlan.travelWindow.arrivalDate > now;
}

/**
 * Get days until recommended arrival
 * STRATEGIC: Creates urgency messaging for bookings
 * 
 * @param eventId - Event identifier
 * @returns Number of days until recommended arrival, or null if past
 */
export async function getDaysUntilRecommendedArrival(eventId: string): Promise<number | null> {
  const travelPlan = await getEventTravelPlan(eventId);
  
  if (!travelPlan) {
    return null;
  }
  
  const now = new Date();
  const arrivalDate = travelPlan.travelWindow.arrivalDate;
  
  if (arrivalDate < now) {
    return null; // Already past recommended arrival
  }
  
  const daysUntil = Math.ceil((arrivalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntil;
}

// ==================== FUTURE: AFFILIATE INTEGRATION HOOKS ====================
// STRATEGIC: Placeholder functions for future Ticketmaster/affiliate integration

/**
 * Get ticket availability for event (FUTURE)
 * @future Will integrate with Ticketmaster API
 */
export async function getEventTicketAvailability(eventId: string): Promise<any> {
  // TODO: Integrate with Ticketmaster API
  console.log(`🎫 Future: Fetch ticket availability for ${eventId}`);
  return null;
}

/**
 * Get flight options for event travel window (FUTURE)
 * @future Will integrate with flight search APIs
 */
export async function getEventFlightOptions(eventId: string, origin: string): Promise<any> {
  // TODO: Integrate with flight search API
  console.log(`✈️ Future: Fetch flights for ${eventId} from ${origin}`);
  return null;
}

/**
 * Get hotel options near event venue (FUTURE)
 * @future Will integrate with Booking.com or similar
 */
export async function getEventHotelOptions(eventId: string): Promise<any> {
  // TODO: Integrate with hotel booking API
  console.log(`🏨 Future: Fetch hotels for ${eventId}`);
  return null;
}