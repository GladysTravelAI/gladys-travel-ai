import { NextRequest } from 'next/server'
import { buildFlightLink } from '@/lib/affiliateLinks'
import { toolSuccess, toolError } from '@/lib/vapiResponse'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { origin, destination, date } = body

    if (!origin || !destination || !date) {
      return toolError('Missing required parameters: origin, destination, date')
    }

    const link = buildFlightLink(origin, destination, date)

    return toolSuccess({
      message: `I found flights from ${origin} to ${destination} on ${date}. Check your screen for the best deals!`,
      affiliateUrl: link,
      service: 'Aviasales',
      displayText: `Flights: ${origin} → ${destination}`,
    })
  } catch (err) {
    console.error('[search_flights]', err)
    return toolError('Failed to search flights')
  }
}