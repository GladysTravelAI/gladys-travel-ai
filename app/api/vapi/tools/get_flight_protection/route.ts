import { NextRequest } from 'next/server'
import { buildFlightProtectionLink } from '@/lib/affiliateLinks'
import { toolSuccess, toolError } from '@/lib/vapiResponse'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { flight_number } = body

    if (!flight_number) {
      return toolError('Missing required parameter: flight_number')
    }

    const link = buildFlightProtectionLink(flight_number)

    return toolSuccess({
      message: `If flight ${flight_number} gets delayed or cancelled, AirHelp can get you compensated automatically — up to €600. Check your screen to register in 2 minutes!`,
      affiliateUrl: link,
      service: 'AirHelp',
      displayText: `Flight Protection: ${flight_number}`,
    })
  } catch (err) {
    console.error('[get_flight_protection]', err)
    return toolError('Failed to get flight protection info')
  }
}