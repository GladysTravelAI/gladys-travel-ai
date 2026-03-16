import { NextRequest } from 'next/server'
import { toolSuccess, toolError } from '@/lib/vapiResponse'
import { buildFlightLink } from '@/lib/affiliateLinks'

// AviationStack — real-time flight status
// https://aviationstack.com/documentation
// Free tier: 100 req/month. Paid from $49/mo for real-time.
// Fallback: AeroDataBox via RapidAPI

interface FlightStatus {
  flightNumber: string
  status: 'scheduled' | 'active' | 'landed' | 'cancelled' | 'incident' | 'diverted' | 'delayed' | 'unknown'
  departure: {
    airport: string
    iata: string
    scheduled: string
    estimated?: string
    actual?: string
    delay?: number // minutes
    terminal?: string
    gate?: string
  }
  arrival: {
    airport: string
    iata: string
    scheduled: string
    estimated?: string
    actual?: string
    delay?: number
    terminal?: string
    gate?: string
  }
  airline: string
  aircraft?: string
  live?: {
    altitude: number
    speed: number
    latitude: number
    longitude: number
    isGround: boolean
  }
}

async function fetchFlightStatus(flightNumber: string): Promise<FlightStatus | null> {
  const apiKey = process.env.AVIATIONSTACK_API_KEY
  if (!apiKey) {
    console.warn('[check_flight_status] No AVIATIONSTACK_API_KEY')
    return null
  }

  // Clean flight number: "BA 123" → "BA123"
  const clean = flightNumber.replace(/\s+/g, '').toUpperCase()

  try {
    const res = await fetch(
      `https://api.aviationstack.com/v1/flights?` +
      `access_key=${apiKey}` +
      `&flight_iata=${clean}` +
      `&limit=1`,
      { next: { revalidate: 300 } } // Cache 5 min — flight data changes fast
    )

    if (!res.ok) return null
    const data = await res.json()
    const flight = data.data?.[0]
    if (!flight) return null

    const depDelay = flight.departure?.delay ?? 0
    const arrDelay = flight.arrival?.delay ?? 0

    // Map AviationStack status to our simplified status
    let status: FlightStatus['status'] = 'unknown'
    const raw = (flight.flight_status ?? '').toLowerCase()
    if (raw === 'scheduled') status = depDelay >= 15 ? 'delayed' : 'scheduled'
    else if (raw === 'active') status = 'active'
    else if (raw === 'landed') status = 'landed'
    else if (raw === 'cancelled') status = 'cancelled'
    else if (raw === 'incident') status = 'incident'
    else if (raw === 'diverted') status = 'diverted'

    return {
      flightNumber: clean,
      status,
      departure: {
        airport: flight.departure?.airport ?? 'Unknown',
        iata: flight.departure?.iata ?? '',
        scheduled: flight.departure?.scheduled ?? '',
        estimated: flight.departure?.estimated,
        actual: flight.departure?.actual,
        delay: depDelay,
        terminal: flight.departure?.terminal,
        gate: flight.departure?.gate,
      },
      arrival: {
        airport: flight.arrival?.airport ?? 'Unknown',
        iata: flight.arrival?.iata ?? '',
        scheduled: flight.arrival?.scheduled ?? '',
        estimated: flight.arrival?.estimated,
        actual: flight.arrival?.actual,
        delay: arrDelay,
        terminal: flight.arrival?.terminal,
        gate: flight.arrival?.gate,
      },
      airline: flight.airline?.name ?? 'Unknown',
      live: flight.live ? {
        altitude: flight.live.altitude,
        speed: flight.live.speed_horizontal,
        latitude: flight.live.latitude,
        longitude: flight.live.longitude,
        isGround: flight.live.is_ground,
      } : undefined,
    }
  } catch (err) {
    console.error('[check_flight_status] AviationStack error:', err)
    return null
  }
}

function buildRecoveryOptions(flight: FlightStatus): Array<{
  description: string
  affiliateUrl: string
  urgency: 'immediate' | 'soon' | 'optional'
}> {
  const options = []

  const departureDate = flight.departure.scheduled
    ? new Date(flight.departure.scheduled).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]

  if (flight.status === 'cancelled' || flight.status === 'diverted') {
    // Immediate rebooking
    options.push({
      description: `Find next available flight from ${flight.departure.iata} to ${flight.arrival.iata}`,
      affiliateUrl: buildFlightLink(
        flight.departure.iata,
        flight.arrival.iata,
        departureDate
      ),
      urgency: 'immediate' as const,
    })
    // Tomorrow's flights as backup
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    options.push({
      description: `Alternative flights tomorrow`,
      affiliateUrl: buildFlightLink(flight.departure.iata, flight.arrival.iata, tomorrow),
      urgency: 'soon' as const,
    })
  } else if (flight.status === 'delayed' && (flight.departure.delay ?? 0) >= 180) {
    // EU261/UK261 compensation eligible (3h+ delay)
    options.push({
      description: `Claim compensation — delays over 3 hours may qualify for up to €600 via AirHelp`,
      affiliateUrl: `https://airhelp.com/en/check-your-flight/?flight=${encodeURIComponent(flight.flightNumber)}`,
      urgency: 'soon' as const,
    })
  } else if (flight.status === 'delayed') {
    options.push({
      description: `Register your delay with AirHelp — get compensated automatically`,
      affiliateUrl: `https://airhelp.com/en/check-your-flight/?flight=${encodeURIComponent(flight.flightNumber)}`,
      urgency: 'optional' as const,
    })
  }

  return options
}

function buildVoiceMessage(flight: FlightStatus): string {
  const depTime = flight.departure.estimated || flight.departure.scheduled
  const formattedTime = depTime
    ? new Date(depTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : 'unknown time'

  switch (flight.status) {
    case 'cancelled':
      return `Bad news — flight ${flight.flightNumber} has been cancelled. I've found alternative flights for you. Check your screen and I'll help you rebook right now.`

    case 'diverted':
      return `Flight ${flight.flightNumber} has been diverted. Your airline should be arranging alternatives — but I've also pulled up rebooking options for you just in case. Check your screen.`

    case 'delayed': {
      const delay = flight.departure.delay ?? 0
      if (delay >= 180) {
        return `Flight ${flight.flightNumber} is delayed by ${delay} minutes — that's over 3 hours, which means you may be entitled to up to €600 in compensation under EU261. New departure is around ${formattedTime}. I've added an AirHelp claim link to your screen.`
      }
      if (delay >= 45) {
        return `Flight ${flight.flightNumber} is running about ${delay} minutes late. New expected departure is around ${formattedTime}. You've got some extra time — want me to find a good spot in the terminal?`
      }
      return `Flight ${flight.flightNumber} has a minor delay of ${delay} minutes. New departure around ${formattedTime}. Nothing to worry about.`
    }

    case 'active':
      return `Flight ${flight.flightNumber} is in the air and on track. Expected arrival ${formattedTime}.`

    case 'landed':
      return `Flight ${flight.flightNumber} has landed. Welcome! Want me to find airport transfer options right now?`

    case 'scheduled':
      return `Flight ${flight.flightNumber} is on schedule, departing at ${formattedTime} from ${flight.departure.terminal ? 'Terminal ' + flight.departure.terminal : flight.departure.airport}${flight.departure.gate ? ', Gate ' + flight.departure.gate : ''}.`

    default:
      return `I found flight ${flight.flightNumber} — status is ${flight.status}. Departing from ${flight.departure.airport} to ${flight.arrival.airport}.`
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { flight_number } = body

    if (!flight_number) return toolError('Missing required parameter: flight_number')

    const flightData = await fetchFlightStatus(flight_number)

    if (!flightData) {
      // No API key or flight not found — return helpful message
      const clean = flight_number.replace(/\s+/g, '').toUpperCase()
      return toolSuccess({
        message: `I couldn't pull live data for flight ${clean} right now. Check the airline app or airport departures board for real-time updates. Want me to find alternative flights as a backup?`,
        flightNumber: clean,
        status: 'unknown',
        recoveryOptions: [],
        affiliateUrl: null,
      })
    }

    const recoveryOptions = buildRecoveryOptions(flightData)
    const message = buildVoiceMessage(flightData)

    // Primary affiliate link for disruption recovery
    const primaryRecovery = recoveryOptions[0] ?? null

    return toolSuccess({
      message,
      flightNumber: flightData.flightNumber,
      status: flightData.status,
      airline: flightData.airline,
      departure: flightData.departure,
      arrival: flightData.arrival,
      live: flightData.live,
      recoveryOptions,
      affiliateUrl: primaryRecovery?.affiliateUrl ?? null,
      displayText: primaryRecovery?.description ?? `Flight ${flightData.flightNumber}`,
      service: flightData.status === 'cancelled' || flightData.status === 'delayed' ? 'AirHelp' : 'Flight Status',
      requiresAction: ['cancelled', 'diverted'].includes(flightData.status),
    })
  } catch (err) {
    console.error('[check_flight_status]', err)
    return toolError('Failed to check flight status')
  }
}