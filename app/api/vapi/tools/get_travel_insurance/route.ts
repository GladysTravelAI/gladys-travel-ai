import { NextRequest } from 'next/server'
import { buildInsuranceLink } from '@/lib/affiliateLinks'
import { toolSuccess, toolError } from '@/lib/vapiResponse'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { destination, trip_duration } = body

    if (!destination || !trip_duration) {
      return toolError('Missing required parameters: destination, trip_duration')
    }

    const link = buildInsuranceLink(destination, trip_duration)

    return toolSuccess({
      message: `One thing most people forget — travel insurance. For ${trip_duration} days in ${destination} it's usually just a few dollars and covers everything. Check your screen for EKTA's quote!`,
      affiliateUrl: link,
      service: 'EKTA',
      displayText: `Travel Insurance: ${destination} (${trip_duration} days)`,
    })
  } catch (err) {
    console.error('[get_travel_insurance]', err)
    return toolError('Failed to get insurance quote')
  }
}