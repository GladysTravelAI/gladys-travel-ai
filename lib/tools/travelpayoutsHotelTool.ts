// lib/tools/travelpayoutsHotelTool.ts
// 🏨 HOTEL SEARCH TOOL
// Mock implementation - replace with real Travelpayouts API

import { buildTravelpayoutsHotelLink } from '@/lib/affiliate/travelpayoutsLinkBuilder';

export const hotelSearchToolDefinition = {
  type: 'function' as const,
  function: {
    name: 'search_hotels',
    description: 'Search for hotels near event venue or in a specific city',
    parameters: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'City name'
        },
        check_in: {
          type: 'string',
          description: 'Check-in date (YYYY-MM-DD)'
        },
        check_out: {
          type: 'string',
          description: 'Check-out date (YYYY-MM-DD)'
        },
        guests: {
          type: 'number',
          description: 'Number of guests',
          default: 2
        }
      },
      required: ['city', 'check_in', 'check_out']
    }
  }
};

export async function executeHotelSearch(args: {
  city: string;
  check_in: string;
  check_out: string;
  guests?: number;
}) {
  try {
    const { city, check_in, check_out, guests = 2 } = args;
    
    // TODO: Replace with actual Travelpayouts API call
    // const response = await fetch(`https://api.travelpayouts.com/v2/hotels/search?...`);
    
    // Mock data for now
    const mockHotels = [
      {
        id: 'hotel-1',
        name: `Premium Hotel ${city}`,
        rating: 4.5,
        price_per_night: 180,
        total_price: calculateNights(check_in, check_out) * 180,
        distance_to_venue: '0.5 miles',
        amenities: ['WiFi', 'Gym', 'Pool', 'Parking'],
        affiliate_url: buildTravelpayoutsHotelLink({
          city,
          checkIn: check_in,
          checkOut: check_out,
          guests
        })
      },
      {
        id: 'hotel-2',
        name: `Budget Inn ${city}`,
        rating: 3.8,
        price_per_night: 89,
        total_price: calculateNights(check_in, check_out) * 89,
        distance_to_venue: '1.2 miles',
        amenities: ['WiFi', 'Breakfast'],
        affiliate_url: buildTravelpayoutsHotelLink({
          city,
          checkIn: check_in,
          checkOut: check_out,
          guests
        })
      },
      {
        id: 'hotel-3',
        name: `Luxury Suites ${city}`,
        rating: 4.8,
        price_per_night: 320,
        total_price: calculateNights(check_in, check_out) * 320,
        distance_to_venue: '0.3 miles',
        amenities: ['WiFi', 'Gym', 'Pool', 'Spa', 'Restaurant', 'Valet'],
        affiliate_url: buildTravelpayoutsHotelLink({
          city,
          checkIn: check_in,
          checkOut: check_out,
          guests
        })
      }
    ];
    
    return mockHotels;
    
  } catch (error) {
    console.error('Hotel search failed:', error);
    return [];
  }
}

function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}