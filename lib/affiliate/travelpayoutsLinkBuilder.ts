// lib/affiliate/travelpayoutsLinkBuilder.ts
// 💰 AFFILIATE LINK BUILDER
// Constructs tracked affiliate URLs for all partners

const TRAVELPAYOUTS_MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || '500540';

// ==================== FLIGHTS ====================

export function buildTravelpayoutsFlightLink(params: {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers?: number;
}): string {
  const { origin, destination, departureDate, returnDate, passengers = 1 } = params;

  const queryParams = new URLSearchParams({
    origin,
    destination,
    depart_date: departureDate,
    passengers: passengers.toString(),
    marker: TRAVELPAYOUTS_MARKER
  });

  if (returnDate) queryParams.append('return_date', returnDate);

  return `https://www.aviasales.com/search?${queryParams.toString()}`;
}

// ==================== HOTELS ====================

export function buildTravelpayoutsHotelLink(params: {
  city: string;
  checkIn: string;
  checkOut: string;
  guests?: number;
}): string {
  const { city, checkIn, checkOut, guests = 2 } = params;

  // Agoda deep link via Travelpayouts marker
  const queryParams = new URLSearchParams({
    city,
    checkIn,
    checkOut,
    guests: guests.toString(),
    tag: TRAVELPAYOUTS_MARKER
  });

  return `https://www.agoda.com/search?${queryParams.toString()}`;
}

// ==================== eSIM ====================

export function buildAiraloLink(params: {
  country?: string;
  region?: string;
}): string {
  const { country, region } = params;

  // Airalo via Travelpayouts tracking
  const base = 'https://www.airalo.com';
  const path = country
    ? `/esim/${country.toLowerCase().replace(/\s+/g, '-')}`
    : region
    ? `/esim/${region.toLowerCase().replace(/\s+/g, '-')}`
    : '/esim';

  return `${base}${path}?_referrer=gladys&marker=${TRAVELPAYOUTS_MARKER}`;
}

export function buildYesimLink(): string {
  return `https://yesim.app/?ref=${TRAVELPAYOUTS_MARKER}`;
}

// ==================== INSURANCE ====================

export function buildEKTALink(params: {
  destination?: string;
  startDate?: string;
  endDate?: string;
}): string {
  const { destination, startDate, endDate } = params;

  const queryParams = new URLSearchParams({
    marker: TRAVELPAYOUTS_MARKER,
    ...(destination && { destination }),
    ...(startDate && { start_date: startDate }),
    ...(endDate && { end_date: endDate })
  });

  return `https://ekta.insure/?${queryParams.toString()}`;
}

// ==================== AIRPORT TRANSFERS ====================

export function buildGetTransferLink(params: {
  from?: string;
  to?: string;
  date?: string;
}): string {
  const { from, to, date } = params;

  const queryParams = new URLSearchParams({
    marker: TRAVELPAYOUTS_MARKER,
    ...(from && { from }),
    ...(to && { to }),
    ...(date && { date })
  });

  return `https://www.gettransfer.com/en/?${queryParams.toString()}`;
}

// ==================== FLIGHT COMPENSATION ====================

export function buildAirHelpLink(params: {
  flightNumber?: string;
  flightDate?: string;
}): string {
  const { flightNumber, flightDate } = params;

  const queryParams = new URLSearchParams({
    marker: TRAVELPAYOUTS_MARKER,
    ...(flightNumber && { flight: flightNumber }),
    ...(flightDate && { date: flightDate })
  });

  return `https://www.airhelp.com/en/check-my-flight/?${queryParams.toString()}`;
}

// ==================== LUGGAGE STORAGE ====================

export function buildRadicalStorageLink(params: {
  city?: string;
  date?: string;
}): string {
  const { city, date } = params;

  const queryParams = new URLSearchParams({
    marker: TRAVELPAYOUTS_MARKER,
    ...(city && { city }),
    ...(date && { date })
  });

  return `https://radicalstorage.com/?${queryParams.toString()}`;
}

// ==================== TICKETS ====================

export function buildTicketAffiliateLink(provider: string, eventId: string): string {
  const providers: Record<string, string> = {
    'StubHub': `https://www.stubhub.com/event/${eventId}?referrer=gladys`,
    'SeatGeek': `https://seatgeek.com/event/${eventId}?aid=gladys`,
    'Ticketmaster': `https://www.ticketmaster.com/event/${eventId}?tm_link=gladys`
  };

  return providers[provider] || `https://www.ticketmaster.com/search?q=${encodeURIComponent(eventId)}`;
}