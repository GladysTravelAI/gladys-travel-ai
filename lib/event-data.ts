// This file acts as a mock database for the 2026 tournament.
// You can expand this data as needed.

// --- 1. DATA TYPES ---

interface MatchTicket {
  min: number;
  max: number;
}

interface MatchDayPricing {
  hotelMultiplier: number;
  advanceBookingRequired: string; // e.g., "6 months"
}

interface VenueParking {
  available: boolean;
  price: string;
}

interface NearestAirport {
  name: string;
  code: string;
}

// Blueprint for a Venue/Stadium
export interface Stadium {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity: number;
  address: string;
  nearestAirport: NearestAirport;
  publicTransport: string[]; // e.g., ["Metro Line A", "Bus 405"]
  parking: VenueParking;
  matchDayPricing: MatchDayPricing; // Renamed from matchDayPricing
  // Add coordinates for real distance calculation later
  // latitude: number;
  // longitude: number;
}

// Blueprint for an Event/Match
export interface Match {
  id: string; // e.g., "m01"
  matchNumber: number;
  stage: string; // "Group Stage", "Round of 16", "Final"
  date: string; // ISO 8601 Format: "2026-06-15T19:00:00-05:00"
  stadium: string; // The "name" of the stadium
  team1: string; // Team name or TBD
  team2: string; // Team name or TBD
  ticketPriceRange: MatchTicket;
}

// --- 2. MOCK STADIUM DATA ---

export const STADIUMS: Stadium[] = [
  {
    id: "s01",
    name: "MetLife Stadium",
    city: "New York/New Jersey",
    country: "USA",
    capacity: 82500,
    address: "1 MetLife Stadium Dr, East Rutherford, NJ 07073",
    nearestAirport: { name: "Newark Liberty International", code: "EWR" },
    publicTransport: ["Coach USA 351 Meadowlands Express", "NJ Transit Rail"],
    parking: { available: true, price: "$40-$60 on event days" },
    matchDayPricing: {
      hotelMultiplier: 3.5,
      advanceBookingRequired: "8 months",
    },
  },
  {
    id: "s02",
    name: "SoFi Stadium",
    city: "Los Angeles",
    country: "USA",
    capacity: 70240,
    address: "1001 S Stadium Dr, Inglewood, CA 90301",
    nearestAirport: { name: "Los Angeles International", code: "LAX" },
    publicTransport: ["Metro C Line (Hawthorne/Lennox)", "GTrans"],
    parking: { available: true, price: "$50-$80 on event days" },
    matchDayPricing: {
      hotelMultiplier: 3.0,
      advanceBookingRequired: "6 months",
    },
  },
  {
    id: "s03",
    name: "Estadio Azteca",
    city: "Mexico City",
    country: "Mexico",
    capacity: 87523,
    address: "Calz. de Tlalpan 3465, Santa Úrsula Coapa, 04650 CDMX",
    nearestAirport: { name: "Mexico City International", code: "MEX" },
    publicTransport: ["Xochimilco Light Rail (Estadio Azteca station)"],
    parking: { available: true, price: "MXN $200-$300" },
    matchDayPricing: {
      hotelMultiplier: 2.5,
      advanceBookingRequired: "5 months",
    },
  },
  {
    id: "s04",
    name: "BMO Field",
    city: "Toronto",
    country: "Canada",
    capacity: 45000, // Expanded capacity
    address: "170 Princes' Blvd, Toronto, ON M6K 3C3",
    nearestAirport: { name: "Toronto Pearson International", code: "YYZ" },
    publicTransport: ["GO Train (Exhibition Station)", "TTC Streetcar"],
    parking: { available: false, price: "Very limited; public transport advised" },
    matchDayPricing: {
      hotelMultiplier: 3.0,
      advanceBookingRequired: "7 months",
    },
  }
];

// --- 3. MOCK MATCH DATA ---

export const MATCHES: Match[] = [
  {
    id: "m01",
    matchNumber: 1,
    stage: "Group Stage",
    date: "2026-06-11T14:00:00-06:00", // June 11, 2026
    stadium: "Estadio Azteca",
    team1: "Mexico",
    team2: "TBD 2",
    ticketPriceRange: { min: 250, max: 1200 },
  },
  {
    id: "m02",
    matchNumber: 2,
    stage: "Group Stage",
    date: "2026-06-12T13:00:00-04:00", // June 12, 2026
    stadium: "BMO Field",
    team1: "Canada",
    team2: "TBD 3",
    ticketPriceRange: { min: 220, max: 1100 },
  },
  {
    id: "m03",
    matchNumber: 3,
    stage: "Group Stage",
    date: "2026-06-12T17:00:00-07:00", // June 12, 2026
    stadium: "SoFi Stadium",
    team1: "USA",
    team2: "TBD 4",
    ticketPriceRange: { min: 300, max: 1500 },
  },
  {
    id: "m23",
    stage: "Group Stage",
    matchNumber: 23,
    date: "2026-06-18T19:00:00-05:00",
    stadium: "Estadio Azteca",
    team1: "Mexico",
    team2: "TBD 5",
    ticketPriceRange: { min: 250, max: 1200 },
  },
  {
    id: "m56",
    stage: "Round of 32",
    matchNumber: 56,
    date: "2026-06-28T19:00:00-07:00",
    stadium: "SoFi Stadium",
    team1: "Winner Group 1",
    team2: "Runner-up Group 2",
    ticketPriceRange: { min: 450, max: 2500 },
  },
  {
    id: "m104",
    stage: "Final",
    matchNumber: 104,
    date: "2026-07-19T15:00:00-04:00", // July 19, 2026
    stadium: "MetLife Stadium",
    team1: "Winner SF1",
    team2: "Winner SF2",
    ticketPriceRange: { min: 1200, max: 5000 },
  }
];

// --- 4. HELPER FUNCTIONS ---

/**
 * Finds a stadium object by its city name (case-insensitive)
 */
export const getStadiumByCity = (city: string): Stadium | undefined => {
  return STADIUMS.find(s => s.city.toLowerCase() === city.toLowerCase());
};

/**
 * MOCK FUNCTION: Calculates the "distance" between two stadiums.
 * In a real app, this would use the Google Maps Matrix API or a Haversine formula
 * with real lat/lon coordinates to get travel time and distance.
 * For now, it just returns a placeholder.
 */
export const getDistanceBetweenStadiums = (stadium1: Stadium, stadium2: Stadium): number => {
  console.log(`MOCK: Calculating distance between ${stadium1.city} and ${stadium2.city}`);
  
  // Simple mock logic
  if (stadium1.country !== stadium2.country) {
    return 2000; // e.g., USA to Mexico
  }
  if (stadium1.city === "Los Angeles" && stadium2.city === "New York/New Jersey") {
    return 2790; // LA to NY
  }
  if (stadium1.city === "Los Angeles" && stadium2.city === "Toronto") {
    return 2180; // LA to Toronto
  }
  
  // Default for same-country, different-city
  return 400; 
};