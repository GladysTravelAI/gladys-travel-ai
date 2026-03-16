import { NextRequest } from 'next/server'
import { toolSuccess, toolError } from '@/lib/vapiResponse'

// Packing categories
interface PackingCategory {
  category: string
  items: string[]
  essential: boolean
}

function getClothingForClimate(avgTemp: number, rainyDays: number, days: number): string[] {
  const clothes: string[] = []

  if (avgTemp <= 5) {
    clothes.push('Heavy winter coat', 'Thermal base layers (×3)', 'Wool sweaters (×2)',
      'Warm trousers (×3)', 'Thick socks', 'Gloves', 'Scarf', 'Beanie', 'Waterproof boots')
  } else if (avgTemp <= 12) {
    clothes.push('Medium jacket or coat', 'Long-sleeve shirts (×3)', 'Light sweater or fleece',
      'Jeans or trousers (×3)', 'Comfortable shoes', 'Light scarf')
  } else if (avgTemp <= 20) {
    clothes.push('Light jacket', 'T-shirts (×3)', 'Long-sleeve layer', 'Jeans or trousers (×2)',
      'Comfortable walking shoes', 'Light cardigan for evenings')
  } else if (avgTemp <= 28) {
    clothes.push('T-shirts or shirts (×4)', 'Light trousers or shorts (×3)',
      'Light jacket for evenings', 'Comfortable walking shoes', 'Sandals')
  } else {
    clothes.push('Light breathable T-shirts (×4)', 'Shorts (×3)', 'Linen or loose trousers',
      'Sunhat', 'Swimwear', 'Sandals', 'Very light jacket for A/C indoors')
  }

  if (rainyDays >= 2) {
    clothes.push('Rain jacket or waterproof', 'Compact travel umbrella')
  }

  // Extra days = more clothes
  if (days >= 7) {
    clothes.push(`Extra outfit for longer trip (${days} days)`)
  }

  return clothes
}

function getEventItems(eventType: string): string[] {
  const type = eventType.toLowerCase()

  if (type.includes('football') || type.includes('soccer') || type.includes('sport') || type.includes('match')) {
    return ['Team jersey or merchandise', 'Comfortable standing shoes', 'Ear protection (stadiums are loud)',
      'Small bag (stadium bag policy — check size limits)', 'Portable phone charger']
  }
  if (type.includes('concert') || type.includes('music') || type.includes('festival')) {
    return ['Comfortable shoes you can stand in for hours', 'Ear plugs', 'Light poncho (outdoor festivals)',
      'Reusable water bottle', 'Portable phone charger', 'Cash (some vendors are cash-only)']
  }
  if (type.includes('conference') || type.includes('business')) {
    return ['Business attire (×2)', 'Laptop + charger', 'Business cards', 'Notebook', 'Smart shoes']
  }
  return ['Comfortable event footwear', 'Small backpack', 'Portable phone charger']
}

function getEssentials(city: string, days: number): string[] {
  return [
    'Passport + copies stored separately',
    'Travel insurance documents (EKTA)',
    'Flight + hotel confirmation printouts',
    'Local currency (first 24h)',
    'Unlocked phone + eSIM for data (Yesim)',
    `Medication for ${days} days + extra`,
    'Phone charger + universal adapter',
    'Power bank',
    'Headphones',
    'Hand sanitiser + travel wipes',
  ]
}

function getToiletries(days: number): string[] {
  const base = [
    'Toothbrush + toothpaste',
    'Deodorant',
    'Shampoo + conditioner (travel size)',
    'Body wash',
    'Face moisturiser + SPF',
    'Lip balm',
  ]
  if (days >= 5) base.push('Razor', 'Hair styling products')
  return base
}

function getHealthItems(avgTemp: number): string[] {
  const items = ['Pain relief (ibuprofen/paracetamol)', 'Antihistamines', 'Blister plasters']
  if (avgTemp >= 24) items.push('High-SPF sunscreen', 'After-sun lotion', 'Insect repellent')
  if (avgTemp <= 10) items.push('Lip balm (wind + cold)', 'Hand cream')
  return items
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { destination, days, event_type, departure_city } = body

    if (!destination) return toolError('Missing required parameter: destination')

    const tripDays = parseInt(days) || 5

    // Fetch real weather for destination to inform packing
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`
    )

    let avgTemp = 18 // fallback
    let rainyDays = 1
    let weatherSummary = ''

    if (geoRes.ok) {
      const geoData = await geoRes.json()
      const loc = geoData.results?.[0]

      if (loc) {
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?` +
          `latitude=${loc.latitude}&longitude=${loc.longitude}` +
          `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode` +
          `&timezone=${encodeURIComponent(loc.timezone)}` +
          `&forecast_days=${Math.min(tripDays, 7)}`
        )

        if (weatherRes.ok) {
          const wd = await weatherRes.json()
          const daily = wd.daily
          const forecastDays = Math.min(tripDays, daily.time.length)

          const temps = daily.temperature_2m_max.slice(0, forecastDays)
            .map((max: number, i: number) => (max + daily.temperature_2m_min[i]) / 2)
          avgTemp = Math.round(temps.reduce((s: number, t: number) => s + t, 0) / temps.length)
          rainyDays = daily.precipitation_probability_max.slice(0, forecastDays).filter((p: number) => p >= 50).length

          const maxTemp = Math.round(Math.max(...daily.temperature_2m_max.slice(0, forecastDays)))
          const minTemp = Math.round(Math.min(...daily.temperature_2m_min.slice(0, forecastDays)))
          weatherSummary = `Weather in ${destination}: ${minTemp}°C–${maxTemp}°C, ${rainyDays} rainy day${rainyDays !== 1 ? 's' : ''} expected`
        }
      }
    }

    // Build packing list
    const packingList: PackingCategory[] = [
      {
        category: 'Essentials',
        items: getEssentials(destination, tripDays),
        essential: true,
      },
      {
        category: 'Clothing',
        items: getClothingForClimate(avgTemp, rainyDays, tripDays),
        essential: true,
      },
      {
        category: 'Toiletries',
        items: getToiletries(tripDays),
        essential: false,
      },
      {
        category: 'Health & Safety',
        items: getHealthItems(avgTemp),
        essential: false,
      },
    ]

    if (event_type) {
      packingList.push({
        category: 'For Your Event',
        items: getEventItems(event_type),
        essential: true,
      })
    }

    const totalItems = packingList.reduce((s, c) => s + c.items.length, 0)

    const tempDesc = avgTemp <= 5 ? 'freezing' : avgTemp <= 12 ? 'cold' : avgTemp <= 20 ? 'cool' : avgTemp <= 27 ? 'warm' : 'hot'

    const message = weatherSummary
      ? `Here's your packing list for ${tripDays} days in ${destination}. ${weatherSummary} — so I've tailored it for ${tempDesc} weather${rainyDays >= 2 ? ' with rain gear' : ''}. ${totalItems} items across ${packingList.length} categories. Check your screen for the full list!`
      : `Here's your packing list for ${tripDays} days in ${destination} — ${totalItems} items across ${packingList.length} categories. Check your screen for the full breakdown!`

    return toolSuccess({
      message,
      destination,
      days: tripDays,
      weatherContext: { avgTemp, rainyDays, weatherSummary },
      packingList,
      totalItems,
      proTips: [
        'Roll clothes instead of folding — saves 30% space',
        'Pack your heaviest items closest to your back',
        'Keep a day\'s outfit in your carry-on in case bags are delayed',
        `Get a Yesim eSIM for ${destination} — avoid roaming charges from day one`,
        'Take photos of all your documents before you leave',
      ],
    })
  } catch (err) {
    console.error('[get_packing_list]', err)
    return toolError('Failed to generate packing list')
  }
}