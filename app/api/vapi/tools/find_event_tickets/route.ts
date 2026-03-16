import { NextRequest } from 'next/server'
import { buildTicketsLink } from '@/lib/affiliateLinks'
import { toolSuccess, toolError } from '@/lib/vapiResponse'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event_name, city, date } = body

    if (!event_name || !city || !date) {
      return toolError('Missing required parameters: event_name, city, date')
    }

    const link = buildTicketsLink(event_name, city, date)

    return toolSuccess({
      message: `I found tickets for ${event_name} in ${city}! Check your screen to grab yours on StubHub before they sell out.`,
      affiliateUrl: link,
      service: 'StubHub',
      displayText: `Tickets: ${event_name}`,
    })
  } catch (err) {
    console.error('[find_event_tickets]', err)
    return toolError('Failed to find event tickets')
  }
}