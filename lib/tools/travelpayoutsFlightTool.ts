// lib/tools/travelpayoutsFlightTool.ts
// ✈️ FLIGHT SEARCH TOOL - Aviasales via Travelpayouts API

import { buildTravelpayoutsFlightLink } from '@/lib/affiliate/travelpayoutsLinkBuilder';

const TRAVELPAYOUTS_TOKEN = process.env.TRAVELPAYOUTS_TOKEN;
const TRAVELPAYOUTS_MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || '500540';

export const flightSearchToolDefinition = {
  type: 'function' as const,
  function: {
    name: 'search_flights',
    description: 'Search for flights to event destination',
    parameters: {
      type: 'object',
      properties: {
        origin: {
          type: 'string',
          description: 'Origin city or IATA airport code (e.g. JNB, NYC, LON)'
        },
        destination: {
          type: 'string',
          description: 'Destination city or IATA airport code (e.g. JFK, LAX, LHR)'
        },
        departure_date: {
          type: 'string',
          description: 'Departure date (YYYY-MM-DD)'
        },
        return_date: {
          type: 'string',
          description: 'Return date (YYYY-MM-DD)'
        },
        passengers: {
          type: 'number',
          description: 'Number of passengers',
          default: 1
        }
      },
      required: ['origin', 'destination', 'departure_date']
    }
  }
};

// Convert city name to IATA code (common mappings)
function toIATA(input: string): string {
  const cityToIATA: Record<string, string> = {
    // South Africa
    'johannesburg': 'JNB', 'joburg': 'JNB', 'jnb': 'JNB',
    'cape town': 'CPT', 'capetown': 'CPT', 'cpt': 'CPT',
    'durban': 'DUR',
    // USA
    'new york': 'JFK', 'nyc': 'JFK', 'jfk': 'JFK',
    'los angeles': 'LAX', 'la': 'LAX', 'lax': 'LAX',
    'dallas': 'DFW', 'dfw': 'DFW',
    'miami': 'MIA', 'mia': 'MIA',
    'chicago': 'ORD', 'ord': 'ORD',
    'san francisco': 'SFO', 'sf': 'SFO', 'sfo': 'SFO',
    'seattle': 'SEA', 'sea': 'SEA',
    'boston': 'BOS', 'bos': 'BOS',
    'houston': 'IAH', 'iah': 'IAH',
    'atlanta': 'ATL', 'atl': 'ATL',
    'kansas city': 'MCI', 'mci': 'MCI',
    'philadelphia': 'PHL', 'phl': 'PHL',
    'santa clara': 'SJC', 'sjc': 'SJC', 'san jose': 'SJC',
    // UK
    'london': 'LHR', 'lhr': 'LHR',
    // Europe
    'paris': 'CDG', 'cdg': 'CDG',
    'madrid': 'MAD', 'mad': 'MAD',
    'barcelona': 'BCN', 'bcn': 'BCN',
    'munich': 'MUC', 'muc': 'MUC',
    'berlin': 'BER', 'ber': 'BER',
    'amsterdam': 'AMS', 'ams': 'AMS',
    // Canada
    'toronto': 'YYZ', 'yyz': 'YYZ',
    'vancouver': 'YVR', 'yvr': 'YVR',
    // Mexico
    'mexico city': 'MEX', 'mexico': 'MEX', 'mex': 'MEX',
    'guadalajara': 'GDL', 'gdl': 'GDL',
    'monterrey': 'MTY', 'mty': 'MTY',
    // Brazil
    'rio de janeiro': 'GIG', 'rio': 'GIG', 'gig': 'GIG',
    'sao paulo': 'GRU', 'gru': 'GRU',
    // Australia
    'sydney': 'SYD', 'syd': 'SYD',
    // Asia
    'dubai': 'DXB', 'dxb': 'DXB',
    'tokyo': 'NRT', 'nrt': 'NRT',
    'singapore': 'SIN', 'sin': 'SIN',
  };

  const key = input.toLowerCase().trim();
  return cityToIATA[key] || input.toUpperCase().slice(0, 3);
}

// Format date to YYYY-MM for Aviasales API
function toMonthFormat(dateStr: string): string {
  return dateStr.slice(0, 7); // "2026-06-11" → "2026-06"
}

export async function executeFlightSearch(args: {
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  passengers?: number;
}) {
  const { origin, destination, departure_date, return_date, passengers = 1 } = args;

  const originCode = toIATA(origin);
  const destinationCode = toIATA(destination);

  const affiliateUrl = buildTravelpayoutsFlightLink({
    origin: originCode,
    destination: destinationCode,
    departureDate: departure_date,
    returnDate: return_date,
    passengers
  });

  // Try real Aviasales API
  if (TRAVELPAYOUTS_TOKEN) {
    try {
      const params = new URLSearchParams({
        origin: originCode,
        destination: destinationCode,
        departure_at: toMonthFormat(departure_date),
        sorting: 'price',
        direct: 'false',
        limit: '3',
        token: TRAVELPAYOUTS_TOKEN,
        marker: TRAVELPAYOUTS_MARKER
      });

      if (return_date) {
        params.append('return_at', toMonthFormat(return_date));
      }

      const response = await fetch(
        `https://api.travelpayouts.com/aviasales/v3/prices_for_dates?${params.toString()}`,
        {
          headers: {
            'X-Access-Token': TRAVELPAYOUTS_TOKEN,
            'Accept': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.data?.length > 0) {
          const flights = data.data.slice(0, 3).map((f: any, index: number) => ({
            id: `flight-${index + 1}`,
            airline: f.airline || 'Various Airlines',
            route: `${originCode} → ${destinationCode}`,
            departure_time: f.departure_at ? new Date(f.departure_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'TBC',
            arrival_time: f.return_at ? new Date(f.return_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'TBC',
            duration: f.duration ? `${Math.floor(f.duration / 60)}h ${f.duration % 60}m` : 'TBC',
            stops: f.transfers ?? 0,
            price: f.price,
            total_price: f.price * passengers,
            class: 'Economy',
            affiliate_url: affiliateUrl,
            found_at: f.found_at
          }));

          console.log(`✅ Aviasales: found ${flights.length} real flights`);
          return flights;
        }
      }
    } catch (error) {
      console.warn('⚠️ Aviasales API failed, using fallback:', error);
    }
  }

  // Fallback: return affiliate link with estimated pricing
  console.log('ℹ️ Using flight affiliate fallback');
  return [
    {
      id: 'flight-1',
      airline: 'Search on Aviasales',
      route: `${originCode} → ${destinationCode}`,
      departure_time: 'Various',
      arrival_time: 'Various',
      duration: 'Various',
      stops: 0,
      price: null,
      total_price: null,
      class: 'Economy',
      affiliate_url: affiliateUrl,
      note: 'Click to see live prices'
    }
  ];
}