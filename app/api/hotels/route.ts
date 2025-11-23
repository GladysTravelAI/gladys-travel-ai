// app/api/hotels/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { destination, checkIn, checkOut, guests = 2, budget = 'mid-range', travelStyle } = body;

    // Validate destination
    if (!destination || typeof destination !== 'string') {
      console.error("Invalid destination:", destination);
      return NextResponse.json(
        { error: "Destination is required and must be a string" },
        { status: 400 }
      );
    }

    console.log("Searching hotels for:", destination, "Budget:", budget, "Style:", travelStyle);

    // Get budget range
    const budgetRange = getBudgetRange(budget);
    
    // Try RapidAPI Booking.com first
    if (process.env.RAPIDAPI_KEY) {
      try {
        const hotels = await searchBookingComHotels(
          destination, 
          checkIn || getDefaultCheckIn(),
          checkOut || getDefaultCheckOut(),
          guests,
          budgetRange,
          travelStyle
        );
        
        if (hotels && hotels.length > 0) {
          return NextResponse.json({ hotels });
        }
      } catch (error) {
        console.error("Booking.com API Error:", error);
      }
    }

    // Fallback to filtered mock data
    console.log("Using filtered mock data");
    return NextResponse.json({ 
      hotels: getFilteredHotels(destination, budgetRange, travelStyle) 
    });

  } catch (error) {
    console.error("Error fetching hotels:", error);
    return NextResponse.json(
      { error: "Failed to fetch hotels" },
      { status: 500 }
    );
  }
}

// Search hotels via RapidAPI Booking.com
async function searchBookingComHotels(
  destination: string, 
  checkIn: string,
  checkOut: string,
  guests: number,
  budgetRange: { min: number, max: number },
  travelStyle?: string
): Promise<any[]> {
  
  try {
    // Step 1: Search for destination to get dest_id
    const searchUrl = `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchDestination?query=${encodeURIComponent(destination)}`;
    
    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
        'X-RapidAPI-Host': 'booking-com15.p.rapidapi.com'
      }
    });

    if (!searchResponse.ok) {
      throw new Error('Destination search failed');
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.data || searchData.data.length === 0) {
      throw new Error('Destination not found');
    }

    const destId = searchData.data[0].dest_id;
    console.log("Found destination ID:", destId);

    // Step 2: Search hotels at destination
    const hotelsUrl = `https://booking-com15.p.rapidapi.com/api/v1/hotels/searchHotels?dest_id=${destId}&search_type=CITY&arrival_date=${checkIn}&departure_date=${checkOut}&adults=${guests}&room_qty=1&page_number=1&units=metric&temperature_unit=c&languagecode=en-us&currency_code=USD`;

    const hotelsResponse = await fetch(hotelsUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY!,
        'X-RapidAPI-Host': 'booking-com15.p.rapidapi.com'
      }
    });

    if (!hotelsResponse.ok) {
      throw new Error('Hotels search failed');
    }

    const hotelsData = await hotelsResponse.json();

    if (!hotelsData.data || !hotelsData.data.hotels) {
      throw new Error('No hotels found');
    }

    // Parse and filter hotels
    let hotels = hotelsData.data.hotels.map((hotel: any, index: number) => {
      const pricePerNight = hotel.property?.priceBreakdown?.grossPrice?.value || 
                           hotel.property?.price?.grossPrice?.value || 
                           150;

      return {
        id: index + 1,
        name: hotel.property?.name || 'Hotel',
        rating: hotel.property?.reviewScore || 4.0,
        price: Math.round(pricePerNight),
        currency: 'USD',
        image: hotel.property?.photoUrls?.[0] || getHotelImage(destination, hotel.property?.name),
        location: `${hotel.property?.city || destination}`,
        address: hotel.property?.address || '',
        amenities: hotel.property?.facilityGroups?.slice(0, 5).map((f: any) => f.name) || ['WiFi', 'Parking'],
        description: hotel.property?.reviewScoreWord || 'Comfortable accommodation',
        distance: hotel.property?.distanceToCityCenterKm 
          ? `${hotel.property.distanceToCityCenterKm} km from city center`
          : 'City location',
        checkIn,
        checkOut,
        hotelId: hotel.property?.id
      };
    });

    // Filter by budget range
    hotels = hotels.filter((h: any) => h.price >= budgetRange.min && h.price <= budgetRange.max);

    // Sort by travel style
    if (travelStyle) {
      const styleLower = travelStyle.toLowerCase();
      if (styleLower === 'luxury') {
        hotels = hotels.sort((a: any, b: any) => b.price - a.price);
      } else if (styleLower === 'budget' || styleLower === 'adventure') {
        hotels = hotels.sort((a: any, b: any) => a.price - b.price);
      } else if (styleLower === 'romantic') {
        hotels = hotels.filter((h: any) => h.rating >= 4.5);
      } else if (styleLower === 'family-friendly') {
        hotels = hotels.filter((h: any) => 
          h.amenities.some((a: string) => a.toLowerCase().includes('pool') || a.toLowerCase().includes('family'))
        );
      }
    }

    return hotels.slice(0, 12);

  } catch (error) {
    console.error("Booking.com API error:", error);
    throw error;
  }
}

// Get budget range based on selection
function getBudgetRange(budget: string): { min: number, max: number } {
  const ranges: { [key: string]: { min: number, max: number } } = {
    'budget': { min: 50, max: 100 },
    'mid-range': { min: 100, max: 250 },
    'luxury': { min: 250, max: 2000 }
  };
  return ranges[budget.toLowerCase()] || ranges['mid-range'];
}

function getDefaultCheckIn(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().split('T')[0];
}

function getDefaultCheckOut(): string {
  const date = new Date();
  date.setDate(date.getDate() + 33);
  return date.toISOString().split('T')[0];
}

function getHotelImage(destination: string, hotelName: string): string {
  const query = encodeURIComponent(`hotel ${destination}`);
  const randomId = Math.floor(Math.random() * 1000);
  return `https://source.unsplash.com/800x600/?hotel,${destination}&sig=${randomId}`;
}

// Filter hotels by budget and style (FALLBACK)
function getFilteredHotels(destination: string, budgetRange: { min: number, max: number }, travelStyle?: string): any[] {
  const allHotels = getDestinationSpecificHotels(destination);
  
  let filtered = allHotels.filter(h => h.price >= budgetRange.min && h.price <= budgetRange.max);
  
  if (travelStyle) {
    const styleLower = travelStyle.toLowerCase();
    if (styleLower === 'luxury') {
      filtered = filtered.sort((a, b) => b.price - a.price);
    } else if (styleLower === 'budget' || styleLower === 'adventure') {
      filtered = filtered.sort((a, b) => a.price - b.price);
    } else if (styleLower === 'romantic') {
      filtered = filtered.filter(h => 
        h.amenities.includes('Spa') || 
        h.amenities.includes('Restaurant')
      );
    }
  }
  
  return filtered.slice(0, 12);
}

function getDestinationSpecificHotels(destination: string): any[] {
  if (!destination || typeof destination !== 'string') {
    destination = 'paris';
  }

  const hotelData: { [key: string]: any[] } = {
    'paris': [
      {
        id: 1,
        name: 'Ritz Paris',
        rating: 5.0,
        price: 850,
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
        location: 'Place Vendôme, Paris',
        address: '15 Place Vendôme, 75001 Paris',
        amenities: ['WiFi', 'Spa', 'Restaurant', 'Bar', 'Concierge'],
        description: 'Legendary luxury hotel in the heart of Paris',
        distance: '0.5 km from city center'
      },
      {
        id: 2,
        name: 'Le Bristol Paris',
        rating: 4.9,
        price: 720,
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        location: 'Champs-Élysées, Paris',
        address: '112 Rue du Faubourg Saint-Honoré',
        amenities: ['Pool', 'WiFi', 'Restaurant', 'Spa'],
        description: 'Palace hotel near Champs-Élysées',
        distance: '1 km from city center'
      },
      {
        id: 3,
        name: 'Hotel Plaza Athénée',
        rating: 4.8,
        price: 280,
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
        location: 'Golden Triangle, Paris',
        address: '25 Avenue Montaigne',
        amenities: ['WiFi', 'Restaurant', 'Bar', 'Spa'],
        description: 'Iconic hotel on Avenue Montaigne',
        distance: '1.2 km from city center'
      },
      {
        id: 4,
        name: 'Hotel du Louvre',
        rating: 4.6,
        price: 180,
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
        location: 'Louvre, Paris',
        address: 'Place André Malraux',
        amenities: ['WiFi', 'Restaurant', 'Gym'],
        description: 'Historic hotel opposite the Louvre',
        distance: '0.3 km from Louvre Museum'
      },
      {
        id: 5,
        name: 'Budget Hotel Paris',
        rating: 4.0,
        price: 75,
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
        location: 'Montmartre, Paris',
        address: 'Rue de Montmartre',
        amenities: ['WiFi', 'Breakfast'],
        description: 'Affordable accommodation near Sacré-Cœur',
        distance: '2 km from city center'
      }
    ],
    'dubai': [
      {
        id: 1,
        name: 'Burj Al Arab Jumeirah',
        rating: 5.0,
        price: 1200,
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
        location: 'Jumeirah Beach, Dubai',
        address: 'Jumeirah St, Dubai',
        amenities: ['Private Beach', 'Spa', 'Helipad', 'Butler Service'],
        description: "World's most luxurious hotel",
        distance: '15 km from city center'
      },
      {
        id: 2,
        name: 'Atlantis The Palm',
        rating: 4.7,
        price: 580,
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
        location: 'Palm Jumeirah, Dubai',
        address: 'Crescent Road, The Palm',
        amenities: ['Waterpark', 'Aquarium', 'Beach'],
        description: 'Iconic resort on Palm Jumeirah',
        distance: '20 km from downtown'
      },
      {
        id: 3,
        name: 'Ibis Dubai Mall',
        rating: 4.2,
        price: 85,
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
        location: 'Downtown Dubai',
        address: 'Near Dubai Mall',
        amenities: ['WiFi', 'Restaurant', 'Pool'],
        description: 'Budget-friendly near attractions',
        distance: '1 km from Dubai Mall'
      }
    ],
    'miami': [
      {
        id: 1,
        name: 'Fontainebleau Miami Beach',
        rating: 4.8,
        price: 450,
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
        location: 'Miami Beach, FL',
        address: '4441 Collins Ave',
        amenities: ['Beach', 'Pool', 'Spa', 'Multiple Restaurants'],
        description: 'Iconic luxury beachfront resort',
        distance: 'Beachfront'
      },
      {
        id: 2,
        name: 'The Betsy Hotel',
        rating: 4.7,
        price: 320,
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        location: 'South Beach, Miami',
        address: '1440 Ocean Drive',
        amenities: ['Beach', 'Rooftop', 'Restaurant'],
        description: 'Boutique hotel on Ocean Drive',
        distance: 'South Beach'
      },
      {
        id: 3,
        name: 'Yve Hotel Miami',
        rating: 4.3,
        price: 95,
        currency: 'USD',
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
        location: 'Downtown Miami',
        address: 'Biscayne Blvd',
        amenities: ['Pool', 'WiFi', 'Gym'],
        description: 'Modern budget hotel downtown',
        distance: '2 km from beach'
      }
    ]
  };

  const normalizedDest = destination.toLowerCase().trim();
  return hotelData[normalizedDest] || hotelData['paris'];
}