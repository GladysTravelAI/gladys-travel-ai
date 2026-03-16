import { NextRequest } from 'next/server'
import { buildTransferLink } from '@/lib/affiliateLinks'
import { toolSuccess, toolError } from '@/lib/vapiResponse'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { pickup, dropoff, date } = body

    if (!pickup || !dropoff || !date) {
      return toolError('Missing required parameters: pickup, dropoff, date')
    }

    const link = buildTransferLink(pickup, dropoff, date)

    return toolSuccess({
      message: `I've sorted your transfer from ${pickup} to ${dropoff}. Check your screen to confirm the booking!`,
      affiliateUrl: link,
      service: 'Kiwitaxi',
      displayText: `Transfer: ${pickup} → ${dropoff}`,
    })
  } catch (err) {
    console.error('[book_transfer]', err)
    return toolError('Failed to find transfer options')
  }
}