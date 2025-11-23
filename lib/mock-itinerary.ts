// This matches the structure from your /api/itinerary route
export interface ItineraryData {
  overview: string;
  tripSummary: {
    totalDays: number;
    cities: string[];
    eventsAttending: number;
    venues: string[];
    highlights: string[];
  };
  budget: {
    totalBudget: string;
    breakdown: {
      accommodation: string;
      transportation: string;
      tickets: string;
      food: string;
      activities: string;
      contingency: string;
    };
    dailyAverage: string;
    savingTips: string[];
  };
  days: DayPlan[];
  accommodations: Accommodation[];
  flights: Flight[];
  localTips: {
    language?: string;
    currency?: string;
    customs?: string;
    safety?: string;
    eventTips?: string[];
  };
  metadata?: {
    generatedAt: string;
    eventFocused: boolean;
    team: string | null;
    eventCount: number;
    optimized: boolean;
    groupSize: number;
    groupType?: string | null;  // 'solo' | 'couple' | 'family' | 'group'
    budget?: string;            // 'budget' | 'mid-range' | 'luxury'
    tripType?: string;          // 'adventure' | 'romantic' | 'cultural' etc.
  };
}

export interface DayPlan {
  day: number;
  date: string;
  city: string;
  theme: string;
  morning: ActivityBlock;
  afternoon: ActivityBlock;
  evening: ActivityBlock;
  event: EventBlock | null;
  mealsAndDining: Meal[];
  transportation: {
    method: string;
    totalTime: string;
    totalCost: string;
  };
  tips: string[];
}

interface ActivityBlock {
  time: string;
  activities: string;
  location: string;
  transportTime: string;
  cost: string;
}

interface EventBlock {
  hasEvent: boolean;
  startTime: string;
  venue: string;
  teams: string;
  arrivalTime: string;
  preEventActivities: string[];
  postEventPlan: string;
}

interface Meal {
  meal: string;
  recommendation: string;
  cuisine: string;
  location: string;
  priceRange: string;
}

export interface Accommodation {
  name: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  location: string;
  description: string;
  rating: number;
  priceRange: {
    normal: string;
    eventDay: string;
    total: string;
  };
  bookingUrl: string;
}

export interface Flight {
  route: string;
  date: string;
  estimatedCost: string;
  airlines: string[];
  tips: string[];
}