import { NextRequest } from 'next/server'
import { toolSuccess, toolError } from '@/lib/vapiResponse'

// Open-Meteo: 100% free, no API key, no rate limits
// Docs: https://open-meteo.com/en/docs

const WMO_CODES: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icy fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Heavy drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
  85: 'Snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail',
}

function describeWeather(code: number, tempMax: number, tempMin: number, rainChance: number): string {
  const condition = WMO_CODES[code] ?? 'Variable'
  const avg = Math.round((tempMax + tempMin) / 2)

  let feel = ''
  if (avg <= 5)  feel = 'very cold'
  else if (avg <= 12) feel = 'cold'
  else if (avg <= 18) feel = 'cool'
  else if (avg <= 24) feel = 'warm'
  else if (avg <= 30) feel = 'hot'
  else feel = 'very hot'

  let rain = ''
  if (rainChance >= 70) rain = ', high chance of rain — pack an umbrella'
  else if (rainChance >= 40) rain = ', some chance of rain'

  return `${condition}, ${avg}°C (${feel})${rain}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { city, country, date } = body

    if (!city) return toolError('Missing required parameter: city')

    // Step 1: Geocode city → lat/lon using Open-Meteo's free geocoding
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
      { next: { revalidate: 86400 } }
    )

    if (!geoRes.ok) return toolError(`Could not find location: ${city}`)
    const geoData = await geoRes.json()
    const location = geoData.results?.[0]

    if (!location) return toolError(`Could not find city: ${city}`)

    const { latitude, longitude, timezone, country_code } = location

    // Step 2: Fetch 7-day forecast
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${latitude}&longitude=${longitude}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode,windspeed_10m_max` +
      `&timezone=${encodeURIComponent(timezone)}` +
      `&forecast_days=7`,
      { next: { revalidate: 1800 } } // Cache 30 min
    )

    if (!weatherRes.ok) return toolError('Weather service unavailable')
    const weatherData = await weatherRes.json()

    const daily = weatherData.daily
    const days = daily.time.map((d: string, i: number) => ({
      date: d,
      maxTemp: Math.round(daily.temperature_2m_max[i]),
      minTemp: Math.round(daily.temperature_2m_min[i]),
      rainChance: daily.precipitation_probability_max[i],
      windSpeed: Math.round(daily.windspeed_10m_max[i]),
      code: daily.weathercode[i],
      description: describeWeather(
        daily.weathercode[i],
        daily.temperature_2m_max[i],
        daily.temperature_2m_min[i],
        daily.precipitation_probability_max[i]
      ),
    }))

    // Build a voice-friendly summary
    const today = days[0]
    const tomorrow = days[1]
    const weekSummary = days.slice(0, 7)
    const avgTemp = Math.round(weekSummary.reduce((s: number, d: any) => s + (d.maxTemp + d.minTemp) / 2, 0) / 7)
    const rainyDays = weekSummary.filter((d: any) => d.rainChance >= 50).length
    const hotDays = weekSummary.filter((d: any) => d.maxTemp >= 28).length
    const coldDays = weekSummary.filter((d: any) => d.maxTemp <= 10).length

    let tripAdvice = ''
    if (coldDays >= 4) tripAdvice = 'It\'s going to be cold — pack layers, a warm jacket, and waterproofs.'
    else if (hotDays >= 4) tripAdvice = 'It\'s going to be hot — light clothes, sunscreen, and stay hydrated.'
    else if (rainyDays >= 3) tripAdvice = 'Expect some rain — bring a light jacket and compact umbrella.'
    else tripAdvice = 'Decent weather overall — comfortable conditions for exploring.'

    const message = date
      ? `Weather in ${city} around ${date}: ${today.description}. ${tripAdvice}`
      : `Right now in ${city}: ${today.description}. Tomorrow: ${tomorrow.description}. ${tripAdvice}`

    return toolSuccess({
      message,
      city,
      country: country || country_code,
      timezone,
      today: today,
      tomorrow: tomorrow,
      forecast: days,
      summary: {
        avgTemp,
        rainyDays,
        hotDays,
        coldDays,
        advice: tripAdvice,
      },
    })
  } catch (err) {
    console.error('[get_weather]', err)
    return toolError('Failed to fetch weather data')
  }
}