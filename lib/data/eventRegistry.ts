// lib/data/eventRegistry.ts
// 📚 EVENT REGISTRY - Central query layer for all events

import { UniversalEvent, EventCity, EventCategory } from '@/lib/core/types/event';
import WORLD_CUP_2026 from './events/worldCup2026';

// ==================== REGISTRY ====================
// Add new events here as you create them

const ALL_EVENTS: UniversalEvent[] = [
  WORLD_CUP_2026,
  // COACHELLA_2026,
  // GLASTONBURY_2026,
  // OKTOBERFEST_2026,
];

// ==================== QUERY FUNCTIONS ====================

export function getAllEvents(): UniversalEvent[] {
  return ALL_EVENTS;
}

export function findEventById(id: string): UniversalEvent | null {
  return ALL_EVENTS.find(e => e.event_id === id) || null;
}

export function findEventBySlug(slug: string): UniversalEvent | null {
  return ALL_EVENTS.find(e => e.slug === slug) || null;
}

export function findEventsByCategory(category: EventCategory): UniversalEvent[] {
  return ALL_EVENTS.filter(e => e.category === category);
}

export function getUpcomingEvents(limit?: number): UniversalEvent[] {
  const today = new Date().toISOString().split('T')[0];
  const upcoming = ALL_EVENTS
    .filter(e => e.end_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  return limit ? upcoming.slice(0, limit) : upcoming;
}

export function searchEvents(query: string): UniversalEvent[] {
  const q = query.toLowerCase().trim();
  return ALL_EVENTS.filter(e =>
    e.name.toLowerCase().includes(q) ||
    e.slug.includes(q) ||
    e.tags?.some(t => t.toLowerCase().includes(q)) ||
    e.cities.some(c => c.name.toLowerCase().includes(q)) ||
    e.description?.toLowerCase().includes(q)
  );
}

export function findEventsByCity(cityName: string): UniversalEvent[] {
  const q = cityName.toLowerCase();
  return ALL_EVENTS.filter(e =>
    e.cities.some(c => c.name.toLowerCase().includes(q))
  );
}

export function isMultiCityEvent(eventId: string): boolean {
  const event = findEventById(eventId);
  return event?.multi_city === true;
}

export function getCitiesForEvent(eventId: string): EventCity[] {
  const event = findEventById(eventId);
  return event?.cities || [];
}