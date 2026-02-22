// lib/data/events/worldCup2026.ts
// 🏆 FIFA WORLD CUP 2026 - Universal Event Schema
// 16 host cities across USA, Canada, Mexico
// 48 teams, 104 matches

import { UniversalEvent } from '@/lib/core/types/event';

export const WORLD_CUP_2026: UniversalEvent = {
  event_id: 'fifa-world-cup-2026',
  name: 'FIFA World Cup 2026',
  slug: 'fifa-world-cup-2026',
  category: 'sports',
  multi_city: true,

  // ==================== HOST CITIES ====================
  cities: [
    // USA
    {
      city_id: 'nyc',
      name: 'New York / New Jersey',
      country: 'United States',
      country_code: 'US',
      iata_code: 'JFK',
      timezone: 'America/New_York',
      coordinates: { lat: 40.8135, lng: -74.0745 }
    },
    {
      city_id: 'lax',
      name: 'Los Angeles',
      country: 'United States',
      country_code: 'US',
      iata_code: 'LAX',
      timezone: 'America/Los_Angeles',
      coordinates: { lat: 33.9534, lng: -118.3390 }
    },
    {
      city_id: 'dfw',
      name: 'Dallas',
      country: 'United States',
      country_code: 'US',
      iata_code: 'DFW',
      timezone: 'America/Chicago',
      coordinates: { lat: 32.7479, lng: -97.0929 }
    },
    {
      city_id: 'mia',
      name: 'Miami',
      country: 'United States',
      country_code: 'US',
      iata_code: 'MIA',
      timezone: 'America/New_York',
      coordinates: { lat: 25.9580, lng: -80.2389 }
    },
    {
      city_id: 'atl',
      name: 'Atlanta',
      country: 'United States',
      country_code: 'US',
      iata_code: 'ATL',
      timezone: 'America/New_York',
      coordinates: { lat: 33.7554, lng: -84.4010 }
    },
    {
      city_id: 'sea',
      name: 'Seattle',
      country: 'United States',
      country_code: 'US',
      iata_code: 'SEA',
      timezone: 'America/Los_Angeles',
      coordinates: { lat: 47.5952, lng: -122.3316 }
    },
    {
      city_id: 'sfo',
      name: 'San Francisco',
      country: 'United States',
      country_code: 'US',
      iata_code: 'SFO',
      timezone: 'America/Los_Angeles',
      coordinates: { lat: 37.4032, lng: -121.9698 }
    },
    {
      city_id: 'bos',
      name: 'Boston',
      country: 'United States',
      country_code: 'US',
      iata_code: 'BOS',
      timezone: 'America/New_York',
      coordinates: { lat: 42.0909, lng: -71.2643 }
    },
    {
      city_id: 'hou',
      name: 'Houston',
      country: 'United States',
      country_code: 'US',
      iata_code: 'IAH',
      timezone: 'America/Chicago',
      coordinates: { lat: 29.6847, lng: -95.4107 }
    },
    {
      city_id: 'kci',
      name: 'Kansas City',
      country: 'United States',
      country_code: 'US',
      iata_code: 'MCI',
      timezone: 'America/Chicago',
      coordinates: { lat: 39.0489, lng: -94.4839 }
    },
    {
      city_id: 'phl',
      name: 'Philadelphia',
      country: 'United States',
      country_code: 'US',
      iata_code: 'PHL',
      timezone: 'America/New_York',
      coordinates: { lat: 39.9007, lng: -75.1675 }
    },
    // Canada
    {
      city_id: 'yyz',
      name: 'Toronto',
      country: 'Canada',
      country_code: 'CA',
      iata_code: 'YYZ',
      timezone: 'America/Toronto',
      coordinates: { lat: 43.6532, lng: -79.3832 }
    },
    {
      city_id: 'yvr',
      name: 'Vancouver',
      country: 'Canada',
      country_code: 'CA',
      iata_code: 'YVR',
      timezone: 'America/Vancouver',
      coordinates: { lat: 49.2827, lng: -123.1207 }
    },
    // Mexico
    {
      city_id: 'mex',
      name: 'Mexico City',
      country: 'Mexico',
      country_code: 'MX',
      iata_code: 'MEX',
      timezone: 'America/Mexico_City',
      coordinates: { lat: 19.4284, lng: -99.1277 }
    },
    {
      city_id: 'gdl',
      name: 'Guadalajara',
      country: 'Mexico',
      country_code: 'MX',
      iata_code: 'GDL',
      timezone: 'America/Mexico_City',
      coordinates: { lat: 20.5881, lng: -103.3439 }
    },
    {
      city_id: 'mty',
      name: 'Monterrey',
      country: 'Mexico',
      country_code: 'MX',
      iata_code: 'MTY',
      timezone: 'America/Monterrey',
      coordinates: { lat: 25.6866, lng: -100.3161 }
    },
  ],

  // ==================== VENUES ====================
  venues: [
    { venue_id: 'metlife',    name: 'MetLife Stadium',              city_id: 'nyc', capacity: 82500,  address: 'East Rutherford, NJ' },
    { venue_id: 'sofi',       name: 'SoFi Stadium',                 city_id: 'lax', capacity: 70240,  address: 'Inglewood, CA' },
    { venue_id: 'attstadium', name: 'AT&T Stadium',                 city_id: 'dfw', capacity: 80000,  address: 'Arlington, TX' },
    { venue_id: 'hardrock',   name: 'Hard Rock Stadium',            city_id: 'mia', capacity: 65326,  address: 'Miami Gardens, FL' },
    { venue_id: 'mercedesbenz', name: 'Mercedes-Benz Stadium',      city_id: 'atl', capacity: 71000,  address: 'Atlanta, GA' },
    { venue_id: 'lumen',      name: 'Lumen Field',                  city_id: 'sea', capacity: 69000,  address: 'Seattle, WA' },
    { venue_id: 'levis',      name: "Levi's Stadium",               city_id: 'sfo', capacity: 68500,  address: 'Santa Clara, CA' },
    { venue_id: 'gillette',   name: 'Gillette Stadium',             city_id: 'bos', capacity: 65878,  address: 'Foxborough, MA' },
    { venue_id: 'nrg',        name: 'NRG Stadium',                  city_id: 'hou', capacity: 72220,  address: 'Houston, TX' },
    { venue_id: 'arrowhead',  name: 'Arrowhead Stadium',            city_id: 'kci', capacity: 76416,  address: 'Kansas City, MO' },
    { venue_id: 'lincoln',    name: 'Lincoln Financial Field',      city_id: 'phl', capacity: 69796,  address: 'Philadelphia, PA' },
    { venue_id: 'bmo',        name: 'BMO Field',                    city_id: 'yyz', capacity: 30000,  address: 'Toronto, ON' },
    { venue_id: 'bcplace',    name: 'BC Place',                     city_id: 'yvr', capacity: 54500,  address: 'Vancouver, BC' },
    { venue_id: 'azteca',     name: 'Estadio Azteca',               city_id: 'mex', capacity: 87523,  address: 'Mexico City' },
    { venue_id: 'akron',      name: 'Estadio Akron',                city_id: 'gdl', capacity: 49850,  address: 'Guadalajara' },
    { venue_id: 'bbva',       name: 'Estadio BBVA',                 city_id: 'mty', capacity: 53500,  address: 'Monterrey' },
  ],

  // ==================== KEY SESSIONS ====================
  // Opening match + Final + selected key dates per city
  // Full match schedule TBC by FIFA — update as released
  sessions: [
    // Opening Match
    { session_id: 'wc26-opening',   venue_id: 'azteca',     city_id: 'mex', date: '2026-06-11', time: '19:00', description: 'Opening Match', round: 'Group Stage' },

    // Final
    { session_id: 'wc26-final',     venue_id: 'metlife',    city_id: 'nyc', date: '2026-07-19', time: '18:00', description: 'FIFA World Cup Final', round: 'Final' },

    // Semi Finals
    { session_id: 'wc26-sf1',       venue_id: 'attstadium', city_id: 'dfw', date: '2026-07-14', time: '18:00', description: 'Semi Final 1', round: 'Semi Final' },
    { session_id: 'wc26-sf2',       venue_id: 'sofi',       city_id: 'lax', date: '2026-07-15', time: '18:00', description: 'Semi Final 2', round: 'Semi Final' },

    // Quarter Finals
    { session_id: 'wc26-qf1',       venue_id: 'metlife',    city_id: 'nyc', date: '2026-07-04', description: 'Quarter Final 1', round: 'Quarter Final' },
    { session_id: 'wc26-qf2',       venue_id: 'sofi',       city_id: 'lax', date: '2026-07-05', description: 'Quarter Final 2', round: 'Quarter Final' },
    { session_id: 'wc26-qf3',       venue_id: 'attstadium', city_id: 'dfw', date: '2026-07-05', description: 'Quarter Final 3', round: 'Quarter Final' },
    { session_id: 'wc26-qf4',       venue_id: 'hardrock',   city_id: 'mia', date: '2026-07-06', description: 'Quarter Final 4', round: 'Quarter Final' },

    // Group Stage — NYC
    { session_id: 'wc26-gs-nyc-1',  venue_id: 'metlife',    city_id: 'nyc', date: '2026-06-14', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-nyc-2',  venue_id: 'metlife',    city_id: 'nyc', date: '2026-06-18', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-nyc-3',  venue_id: 'metlife',    city_id: 'nyc', date: '2026-06-22', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-r16-nyc',   venue_id: 'metlife',    city_id: 'nyc', date: '2026-06-30', description: 'Round of 32', round: 'Round of 32' },

    // Group Stage — LA
    { session_id: 'wc26-gs-lax-1',  venue_id: 'sofi',       city_id: 'lax', date: '2026-06-13', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-lax-2',  venue_id: 'sofi',       city_id: 'lax', date: '2026-06-17', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-lax-3',  venue_id: 'sofi',       city_id: 'lax', date: '2026-06-21', description: 'Group Stage Match', round: 'Group Stage' },

    // Group Stage — Dallas
    { session_id: 'wc26-gs-dfw-1',  venue_id: 'attstadium', city_id: 'dfw', date: '2026-06-12', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-dfw-2',  venue_id: 'attstadium', city_id: 'dfw', date: '2026-06-16', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-dfw-3',  venue_id: 'attstadium', city_id: 'dfw', date: '2026-06-20', description: 'Group Stage Match', round: 'Group Stage' },

    // Group Stage — Miami
    { session_id: 'wc26-gs-mia-1',  venue_id: 'hardrock',   city_id: 'mia', date: '2026-06-13', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-mia-2',  venue_id: 'hardrock',   city_id: 'mia', date: '2026-06-17', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-mia-3',  venue_id: 'hardrock',   city_id: 'mia', date: '2026-06-21', description: 'Group Stage Match', round: 'Group Stage' },

    // Group Stage — Atlanta
    { session_id: 'wc26-gs-atl-1',  venue_id: 'mercedesbenz', city_id: 'atl', date: '2026-06-14', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-atl-2',  venue_id: 'mercedesbenz', city_id: 'atl', date: '2026-06-18', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-atl-3',  venue_id: 'mercedesbenz', city_id: 'atl', date: '2026-06-22', description: 'Group Stage Match', round: 'Group Stage' },

    // Group Stage — Seattle
    { session_id: 'wc26-gs-sea-1',  venue_id: 'lumen',      city_id: 'sea', date: '2026-06-15', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-sea-2',  venue_id: 'lumen',      city_id: 'sea', date: '2026-06-19', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-sea-3',  venue_id: 'lumen',      city_id: 'sea', date: '2026-06-23', description: 'Group Stage Match', round: 'Group Stage' },

    // Group Stage — San Francisco
    { session_id: 'wc26-gs-sfo-1',  venue_id: 'levis',      city_id: 'sfo', date: '2026-06-12', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-sfo-2',  venue_id: 'levis',      city_id: 'sfo', date: '2026-06-16', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-sfo-3',  venue_id: 'levis',      city_id: 'sfo', date: '2026-06-20', description: 'Group Stage Match', round: 'Group Stage' },

    // Group Stage — Boston
    { session_id: 'wc26-gs-bos-1',  venue_id: 'gillette',   city_id: 'bos', date: '2026-06-14', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-bos-2',  venue_id: 'gillette',   city_id: 'bos', date: '2026-06-18', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-bos-3',  venue_id: 'gillette',   city_id: 'bos', date: '2026-06-22', description: 'Group Stage Match', round: 'Group Stage' },

    // Group Stage — Houston
    { session_id: 'wc26-gs-hou-1',  venue_id: 'nrg',        city_id: 'hou', date: '2026-06-13', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-hou-2',  venue_id: 'nrg',        city_id: 'hou', date: '2026-06-17', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-hou-3',  venue_id: 'nrg',        city_id: 'hou', date: '2026-06-21', description: 'Group Stage Match', round: 'Group Stage' },

    // Group Stage — Kansas City
    { session_id: 'wc26-gs-kci-1',  venue_id: 'arrowhead',  city_id: 'kci', date: '2026-06-15', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-kci-2',  venue_id: 'arrowhead',  city_id: 'kci', date: '2026-06-19', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-kci-3',  venue_id: 'arrowhead',  city_id: 'kci', date: '2026-06-23', description: 'Group Stage Match', round: 'Group Stage' },

    // Group Stage — Philadelphia
    { session_id: 'wc26-gs-phl-1',  venue_id: 'lincoln',    city_id: 'phl', date: '2026-06-12', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-phl-2',  venue_id: 'lincoln',    city_id: 'phl', date: '2026-06-16', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-phl-3',  venue_id: 'lincoln',    city_id: 'phl', date: '2026-06-20', description: 'Group Stage Match', round: 'Group Stage' },

    // Group Stage — Toronto
    { session_id: 'wc26-gs-yyz-1',  venue_id: 'bmo',        city_id: 'yyz', date: '2026-06-13', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-yyz-2',  venue_id: 'bmo',        city_id: 'yyz', date: '2026-06-17', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-yyz-3',  venue_id: 'bmo',        city_id: 'yyz', date: '2026-06-21', description: 'Group Stage Match', round: 'Group Stage' },

    // Group Stage — Vancouver
    { session_id: 'wc26-gs-yvr-1',  venue_id: 'bcplace',    city_id: 'yvr', date: '2026-06-14', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-yvr-2',  venue_id: 'bcplace',    city_id: 'yvr', date: '2026-06-18', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-yvr-3',  venue_id: 'bcplace',    city_id: 'yvr', date: '2026-06-22', description: 'Group Stage Match', round: 'Group Stage' },

    // Group Stage — Mexico City
    { session_id: 'wc26-gs-mex-1',  venue_id: 'azteca',     city_id: 'mex', date: '2026-06-11', description: 'Opening Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-mex-2',  venue_id: 'azteca',     city_id: 'mex', date: '2026-06-15', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-mex-3',  venue_id: 'azteca',     city_id: 'mex', date: '2026-06-19', description: 'Group Stage Match', round: 'Group Stage' },

    // Group Stage — Guadalajara
    { session_id: 'wc26-gs-gdl-1',  venue_id: 'akron',      city_id: 'gdl', date: '2026-06-12', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-gdl-2',  venue_id: 'akron',      city_id: 'gdl', date: '2026-06-16', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-gdl-3',  venue_id: 'akron',      city_id: 'gdl', date: '2026-06-20', description: 'Group Stage Match', round: 'Group Stage' },

    // Group Stage — Monterrey
    { session_id: 'wc26-gs-mty-1',  venue_id: 'bbva',       city_id: 'mty', date: '2026-06-13', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-mty-2',  venue_id: 'bbva',       city_id: 'mty', date: '2026-06-17', description: 'Group Stage Match', round: 'Group Stage' },
    { session_id: 'wc26-gs-mty-3',  venue_id: 'bbva',       city_id: 'mty', date: '2026-06-21', description: 'Group Stage Match', round: 'Group Stage' },
  ],

  // ==================== DATES ====================
  start_date: '2026-06-11',
  end_date: '2026-07-19',

  // ==================== TRAVEL INTELLIGENCE ====================
  default_trip_pattern: {
    days_before_event: 2,
    days_after_event: 2,
    recommended_trip_length: 5,
    pattern: 'week',
  },

  pricing: {
    demand_multiplier: 2.5,    // World Cup = extreme demand
    price_surge_factor: 1.8,   // Hotels surge hard during WC
    base_daily_budget: {
      budget: 120,
      mid: 250,
      luxury: 600,
      currency: 'USD',
    },
  },

  // ==================== METADATA ====================
  description: 'The 2026 FIFA World Cup is the first to feature 48 teams, hosted across 16 cities in the USA, Canada, and Mexico. From the opening match in Mexico City to the Final at MetLife Stadium in New York, this is the biggest sporting event on the planet.',
  hero_image: undefined,
  official_url: 'https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026',
  tags: ['football', 'soccer', 'world cup', 'FIFA', 'sports', 'USA', 'Canada', 'Mexico', '2026'],
  trademark: {
    is_trademarked: true,
    owner: 'FIFA (Fédération Internationale de Football Association)',
    disclaimer: 'GladysTravel is not affiliated with or endorsed by FIFA. FIFA World Cup™ is a trademark of FIFA.',
  },
  source: 'FIFA Official',
  is_recurring: true,
  recurrence_month: 6,
};

export default WORLD_CUP_2026;