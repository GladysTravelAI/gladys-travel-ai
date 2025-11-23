// app/api/transport/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { destination, origin, transportType } = body;

    // Validate destination
    if (!destination || typeof destination !== 'string') {
      console.error("Invalid destination:", destination);
      return NextResponse.json(
        { error: "Destination is required and must be a string" },
        { status: 400 }
      );
    }

    console.log("Searching transport for:", destination);

    // Get destination-specific transport options
    const transportOptions = getTransportOptions(destination, origin);

    return NextResponse.json({ transport: transportOptions });
  } catch (error) {
    console.error("Error fetching transport:", error);
    return NextResponse.json(
      { error: "Failed to fetch transport options" },
      { status: 500 }
    );
  }
}

function getTransportOptions(destination: string, origin?: string) {
  if (!destination || typeof destination !== 'string') {
    console.error("Invalid destination for getTransportOptions:", destination);
    destination = 'paris';
  }

  const destLower = destination.toLowerCase().trim();
  
  const transportData: { [key: string]: any } = {
    'paris': {
      airport: 'Charles de Gaulle Airport (CDG)',
      distance: '25 km from city center',
      options: [
        {
          type: 'Airport Shuttle',
          name: 'Roissybus',
          description: 'Direct bus service to Opéra',
          duration: '60 min',
          price: 13,
          currency: 'EUR',
          availability: '6:00 AM - 12:30 AM',
          icon: '🚌'
        },
        {
          type: 'Train',
          name: 'RER B Train',
          description: 'Fast train to city center',
          duration: '35 min',
          price: 11,
          currency: 'EUR',
          availability: '4:50 AM - 12:00 AM',
          icon: '🚆'
        },
        {
          type: 'Private Transfer',
          name: 'Private Car Service',
          description: 'Door-to-door luxury service',
          duration: '45 min',
          price: 65,
          currency: 'EUR',
          availability: '24/7',
          icon: '🚗'
        },
        {
          type: 'Taxi',
          name: 'Paris Taxi',
          description: 'Metered taxi service',
          duration: '45-60 min',
          price: 55,
          currency: 'EUR',
          availability: '24/7',
          icon: '🚕'
        }
      ]
    },
    'dubai': {
      airport: 'Dubai International Airport (DXB)',
      distance: '15 km from city center',
      options: [
        {
          type: 'Metro',
          name: 'Dubai Metro Red Line',
          description: 'Direct metro from airport',
          duration: '20 min',
          price: 2,
          currency: 'AED',
          availability: '5:00 AM - 12:00 AM',
          icon: '🚇'
        },
        {
          type: 'Private Transfer',
          name: 'Airport Limousine',
          description: 'Luxury transfer service',
          duration: '25 min',
          price: 180,
          currency: 'AED',
          availability: '24/7',
          icon: '🚗'
        },
        {
          type: 'Taxi',
          name: 'Dubai Taxi',
          description: 'Metered taxi service',
          duration: '25-35 min',
          price: 70,
          currency: 'AED',
          availability: '24/7',
          icon: '🚕'
        }
      ]
    },
    'tokyo': {
      airport: 'Narita International Airport (NRT)',
      distance: '60 km from city center',
      options: [
        {
          type: 'Train',
          name: 'Narita Express (N\'EX)',
          description: 'Fast train to Tokyo Station',
          duration: '60 min',
          price: 3070,
          currency: 'JPY',
          availability: '6:30 AM - 10:00 PM',
          icon: '🚄'
        },
        {
          type: 'Train',
          name: 'Keisei Skyliner',
          description: 'Express train to Ueno',
          duration: '41 min',
          price: 2570,
          currency: 'JPY',
          availability: '7:00 AM - 11:00 PM',
          icon: '🚆'
        }
      ]
    },
    'new york': {
      airport: 'John F. Kennedy Airport (JFK)',
      distance: '26 km from Manhattan',
      options: [
        {
          type: 'Train',
          name: 'AirTrain + Subway',
          description: 'AirTrain to Jamaica, then subway',
          duration: '60-75 min',
          price: 11,
          currency: 'USD',
          availability: '24/7',
          icon: '🚆'
        },
        {
          type: 'Taxi',
          name: 'Yellow Cab',
          description: 'Flat rate to Manhattan',
          duration: '45-75 min',
          price: 70,
          currency: 'USD',
          availability: '24/7',
          icon: '🚕'
        }
      ]
    },
    'cape town': {
      airport: 'Cape Town International Airport (CPT)',
      distance: '20 km from city center',
      options: [
        {
          type: 'Airport Shuttle',
          name: 'MyCiTi Bus',
          description: 'Direct bus to city center',
          duration: '30 min',
          price: 80,
          currency: 'ZAR',
          availability: '5:00 AM - 10:00 PM',
          icon: '🚌'
        },
        {
          type: 'Taxi',
          name: 'Metered Taxi',
          description: 'Licensed taxi service',
          duration: '25-35 min',
          price: 350,
          currency: 'ZAR',
          availability: '24/7',
          icon: '🚕'
        }
      ]
    },
    'miami': {
      airport: 'Miami International Airport (MIA)',
      distance: '13 km from downtown',
      options: [
        {
          type: 'Train',
          name: 'Metrorail',
          description: 'Direct to downtown Miami',
          duration: '25 min',
          price: 2.25,
          currency: 'USD',
          availability: '5:00 AM - 12:00 AM',
          icon: '🚆'
        },
        {
          type: 'Taxi',
          name: 'Taxi Service',
          description: 'Metered taxi',
          duration: '20-30 min',
          price: 35,
          currency: 'USD',
          availability: '24/7',
          icon: '🚕'
        },
        {
          type: 'Ride-sharing',
          name: 'Uber/Lyft',
          description: 'App-based rideshare',
          duration: '20-30 min',
          price: 25,
          currency: 'USD',
          availability: '24/7',
          icon: '📱'
        }
      ]
    }
  };

  // Return destination-specific transport or default to Paris
  return transportData[destLower] || transportData['paris'];
}