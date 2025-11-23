import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { origin, destination, departDate, returnDate, passengers = 1 } = await req.json();

    // Initialize Amadeus only when needed and if keys are available
    let amadeus = null;
    if (process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET) {
      try {
        // @ts-ignore
        const Amadeus = require('amadeus');
        amadeus = new Amadeus({
          clientId: process.env.AMADEUS_API_KEY,
          clientSecret: process.env.AMADEUS_API_SECRET
        });
      } catch (error) {
        console.error("Amadeus initialization error:", error);
      }
    }

    // If Amadeus not configured, return mock data
    if (!amadeus) {
      console.log("Amadeus API keys not configured, using mock data");
      return NextResponse.json({ flights: getMockFlights(origin, destination) });
    }

    try {
      const response = await amadeus.shopping.flightOffersSearch.get({
        originLocationCode: getAirportCode(origin),
        destinationLocationCode: getAirportCode(destination),
        departureDate: departDate || getDefaultDepartDate(),
        returnDate: returnDate || getDefaultReturnDate(),
        adults: passengers,
        currencyCode: 'USD',
        max: 15
      });

      const flights = response.data.map((offer: any, index: number) => {
        const outbound = offer.itineraries[0];
        const segment = outbound.segments[0];
        const lastSegment = outbound.segments[outbound.segments.length - 1];
        
        return {
          id: index + 1,
          airline: getAirlineName(segment.carrierCode),
          flightNumber: `${segment.carrierCode}${segment.number}`,
          origin: segment.departure.iataCode,
          destination: lastSegment.arrival.iataCode,
          departTime: formatTime(segment.departure.at),
          arriveTime: formatTime(lastSegment.arrival.at),
          duration: formatDuration(outbound.duration),
          price: Math.round(parseFloat(offer.price.total)),
          stops: outbound.segments.length === 1 ? 'Direct' : `${outbound.segments.length - 1} Stop(s)`,
          class: offer.travelerPricings[0].fareDetailsBySegment[0].cabin || 'Economy'
        };
      });

      return NextResponse.json({ flights });
    } catch (amadeusError: any) {
      console.error("Amadeus API Error:", amadeusError.description || amadeusError);
      return NextResponse.json({ flights: getMockFlights(origin, destination) });
    }
  } catch (error) {
    console.error("Error fetching flights:", error);
    return NextResponse.json({ error: "Failed to fetch flights" }, { status: 500 });
  }
}

function getAirportCode(city: string): string {
  const codes: { [key: string]: string } = {
    'johannesburg': 'JNB', 'cape town': 'CPT', 'durban': 'DUR',
    'paris': 'CDG', 'london': 'LHR', 'new york': 'JFK', 'tokyo': 'NRT',
    'dubai': 'DXB', 'barcelona': 'BCN', 'amsterdam': 'AMS', 'rome': 'FCO',
    'madrid': 'MAD', 'berlin': 'BER', 'los angeles': 'LAX', 'sydney': 'SYD',
    'singapore': 'SIN', 'hong kong': 'HKG', 'mumbai': 'BOM',
  };
  return codes[city.toLowerCase().trim()] || 'JNB';
}

function getAirlineName(code: string): string {
  const airlines: { [key: string]: string } = {
    'EK': 'Emirates', 'QR': 'Qatar Airways', 'TK': 'Turkish Airlines',
    'BA': 'British Airways', 'AF': 'Air France', 'LH': 'Lufthansa',
    'SA': 'South African Airways', 'AA': 'American Airlines',
    'UA': 'United Airlines', 'DL': 'Delta',
  };
  return airlines[code] || code;
}

function formatTime(dateTime: string): string {
  const date = new Date(dateTime);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDuration(duration: string): string {
  return duration.replace('PT', '').replace('H', 'h ').replace('M', 'm').toLowerCase();
}

function getDefaultDepartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
}

function getDefaultReturnDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().split('T')[0];
}

function getMockFlights(origin: string, destination: string) {
  return [
    { id: 1, airline: "Emirates", flightNumber: "EK764", origin: origin || "JNB",
      destination: destination || "CDG", departTime: "08:00 AM", arriveTime: "06:30 PM",
      duration: "10h 30m", price: 850, stops: "Direct", class: "Economy" },
    { id: 2, airline: "Qatar Airways", flightNumber: "QR1362", origin: origin || "JNB",
      destination: destination || "CDG", departTime: "11:00 AM", arriveTime: "09:45 PM",
      duration: "10h 45m", price: 780, stops: "1 Stop (Doha)", class: "Economy" },
    { id: 3, airline: "Turkish Airlines", flightNumber: "TK42", origin: origin || "JNB",
      destination: destination || "CDG", departTime: "02:30 PM", arriveTime: "12:15 AM +1",
      duration: "9h 45m", price: 920, stops: "1 Stop (Istanbul)", class: "Economy" }
  ];
}