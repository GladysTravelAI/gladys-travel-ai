import { NextRequest } from 'next/server'
import { buildHotelLink } from '@/lib/affiliateLinks'
import { toolSuccess, toolError } from '@/lib/vapiResponse'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { city, checkin, checkout } = body

    if (!city || !checkin || !checkout) {
      return toolError('Missing required parameters: city, checkin, checkout')
    }

    const link = buildHotelLink(city, checkin, checkout)

    return toolSuccess({
      message: `Great news — I've found hotels in ${city} for your dates. Check your screen to browse options near the venue!`,
      affiliateUrl: link,
      service: 'Booking.com',
      displayText: `Hotels in ${city}`,
    })
  } catch (err) {
    console.error('[search_hotels]', err)
    return toolError('Failed to search hotels')
  }
}