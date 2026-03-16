import { NextRequest } from 'next/server'
import { buildEsimLink } from '@/lib/affiliateLinks'
import { toolSuccess, toolError } from '@/lib/vapiResponse'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { country } = body

    if (!country) {
      return toolError('Missing required parameter: country')
    }

    const link = buildEsimLink(country)

    return toolSuccess({
      message: `Pro tip — grab a Yesim eSIM for ${country} before you fly. You'll have instant local data without roaming charges. Check your screen!`,
      affiliateUrl: link,
      service: 'Yesim',
      displayText: `eSIM for ${country}`,
    })
  } catch (err) {
    console.error('[get_esim]', err)
    return toolError('Failed to find eSIM options')
  }
}