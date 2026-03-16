import { NextRequest } from 'next/server'
import { buildLuggageLink } from '@/lib/affiliateLinks'
import { toolSuccess, toolError } from '@/lib/vapiResponse'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { city } = body

    if (!city) {
      return toolError('Missing required parameter: city')
    }

    const link = buildLuggageLink(city)

    return toolSuccess({
      message: `I found luggage storage spots in ${city} near the venue — drop your bags and explore hands-free. Check your screen!`,
      affiliateUrl: link,
      service: 'Radical Storage',
      displayText: `Luggage Storage in ${city}`,
    })
  } catch (err) {
    console.error('[find_luggage_storage]', err)
    return toolError('Failed to find luggage storage')
  }
}