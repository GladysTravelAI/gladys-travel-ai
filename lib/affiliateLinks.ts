// Affiliate link builders for all Gladys Travel partners
// All IDs loaded from environment variables

const TRAVELPAYOUTS_MARKER = process.env.TRAVELPAYOUTS_MARKER || ''
const AVIASALES_MARKER = process.env.AVIASALES_MARKER || TRAVELPAYOUTS_MARKER
const BOOKING_AFFILIATE_ID = process.env.BOOKING_AFFILIATE_ID || ''
const STUBHUB_AFFILIATE_ID = process.env.STUBHUB_AFFILIATE_ID || ''

export function buildFlightLink(origin: string, destination: string, date: string) {
  const formattedDate = date.replace(/-/g, '') // YYYYMMDD
  return `https://www.aviasales.com/search/${origin}${formattedDate}${destination}1?marker=${AVIASALES_MARKER}&utm_source=gladys`
}

export function buildHotelLink(city: string, checkin: string, checkout: string) {
  const citySlug = encodeURIComponent(city.toLowerCase())
  if (BOOKING_AFFILIATE_ID) {
    return `https://www.booking.com/searchresults.html?ss=${citySlug}&checkin=${checkin}&checkout=${checkout}&aid=${BOOKING_AFFILIATE_ID}&utm_source=gladys`
  }
  return `https://www.booking.com/searchresults.html?ss=${citySlug}&checkin=${checkin}&checkout=${checkout}`
}

export function buildTransferLink(pickup: string, dropoff: string, date: string) {
  const from = encodeURIComponent(pickup)
  const to = encodeURIComponent(dropoff)
  return `https://kiwitaxi.com/?marker=${TRAVELPAYOUTS_MARKER}&from=${from}&to=${to}&date=${date}&utm_source=gladys`
}

export function buildEsimLink(country: string) {
  const countrySlug = encodeURIComponent(country.toLowerCase())
  return `https://yesim.app/?marker=${TRAVELPAYOUTS_MARKER}&country=${countrySlug}&utm_source=gladys`
}

export function buildInsuranceLink(destination: string, days: number) {
  return `https://ekta.io/?marker=${TRAVELPAYOUTS_MARKER}&destination=${encodeURIComponent(destination)}&days=${days}&utm_source=gladys`
}

export function buildLuggageLink(city: string) {
  return `https://radicalstorage.com/search?location=${encodeURIComponent(city)}&marker=${TRAVELPAYOUTS_MARKER}&utm_source=gladys`
}

export function buildFlightProtectionLink(flightNumber: string) {
  return `https://airhelp.com/en/check-your-flight/?flight=${encodeURIComponent(flightNumber)}&marker=${TRAVELPAYOUTS_MARKER}&utm_source=gladys`
}

export function buildTicketsLink(eventName: string, city: string, date: string) {
  const query = encodeURIComponent(`${eventName} ${city}`)
  if (STUBHUB_AFFILIATE_ID) {
    return `https://www.stubhub.com/find/s/?q=${query}&utm_source=gladys&utm_medium=affiliate&utm_campaign=${STUBHUB_AFFILIATE_ID}`
  }
  return `https://www.stubhub.com/find/s/?q=${query}`
}