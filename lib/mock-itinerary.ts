// lib/mock-itinerary.ts
// 🎯 EVENT-CENTRIC ITINERARY ARCHITECTURE
// Production-grade TypeScript contracts for event-anchored travel

export interface EventAnchor {
  eventName: string;
  eventType: 'sports' | 'music' | 'festivals' | 'other';
  eventDate: string;
  eventDay: number;
  venue: string;
  city: string;
  country?: string;
}

export interface TimeBlock {
  time: string;
  activities: string;
  location: string;
  cost: string;
  affiliateLinks?: Array<{
    type: string;
    partner?: string;
    url?: string;
  }>;
}

export interface EventBlock extends TimeBlock {
  isEventBlock?: boolean;
  eventDetails?: {
    doors?: string;
    startTime?: string;
    duration?: string;
    ticketUrl?: string;
  };
}

export interface DayPlan {
  day: number;
  date: string;
  city: string;
  theme: string;
  label: string;
  isEventDay: boolean;
  morning: TimeBlock;
  afternoon: TimeBlock | EventBlock;
  evening: TimeBlock | EventBlock;
  mealsAndDining?: Array<{
    meal: string;
    recommendation: string;
    priceRange: string;
    location: string;
    affiliateUrl?: string;
  }>;
  tips?: string[];
}

export interface ItineraryData {
  overview: string;
  eventAnchor?: EventAnchor;
  tripSummary: {
    totalDays: number;
    cities: string[];
    highlights?: string[];
    eventPhases?: {
      preEvent: number;
      eventDay: number;
      postEvent: number;
    };
  };
  budget: {
    totalBudget: string;
    dailyAverage: string;
    eventDayCost?: string;
    breakdown?: {
      accommodation: string;
      transport: string;
      food: string;
      event: string;
      activities: string;
    };
  };
  days: DayPlan[];
}