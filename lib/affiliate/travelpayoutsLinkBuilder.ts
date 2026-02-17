// lib/affiliate/travelpayoutsLinkBuilder.ts
// 💰 AFFILIATE LINK BUILDER
// Constructs Travelpayouts affiliate URLs

const TRAVELPAYOUTS_MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || 'YOUR_MARKER_ID';
const TRAVELPAYOUTS_TOKEN = process.env.TRAVELPAYOUTS_TOKEN || 'YOUR_TOKEN';

export function buildTravelpayoutsHotelLink(params: {
  city: string;
  checkIn: string;
  checkOut: string;
  guests?: number;
}): string {
  const { city, checkIn, checkOut, guests = 2 } = params;
  
  // Booking.com via Travelpayouts
  const baseUrl = 'https://www.booking.com/searchresults.html';
  const queryParams = new URLSearchParams({
    ss: city,
    checkin: checkIn,
    checkout: checkOut,
    group_adults: guests.toString(),
    aid: TRAVELPAYOUTS_MARKER
  });
  
  return `${baseUrl}?${queryParams.toString()}`;
}

export function buildTravelpayoutsFlightLink(params: {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers?: number;
}): string {
  const { origin, destination, departureDate, returnDate, passengers = 1 } = params;
  
  // Aviasales/JetRadar via Travelpayouts
  const baseUrl = 'https://www.aviasales.com/search';
  const queryParams = new URLSearchParams({
    origin,
    destination,
    depart_date: departureDate,
    ...(returnDate && { return_date: returnDate }),
    passengers: passengers.toString(),
    marker: TRAVELPAYOUTS_MARKER
  });
  
  return `${baseUrl}?${queryParams.toString()}`;
}

export function buildTicketAffiliateLink(provider: string, eventId: string): string {
  // Example affiliate structures
  const providers: Record<string, string> = {
    'StubHub': `https://www.stubhub.com/event/${eventId}?referrer=gladys`,
    'SeatGeek': `https://seatgeek.com/event/${eventId}?aid=gladys`,
    'Ticketmaster': `https://www.ticketmaster.com/event/${eventId}?tm_link=gladys`
  };
  
  return providers[provider] || `https://example.com/tickets/${eventId}`;
}