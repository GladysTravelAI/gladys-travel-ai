// app/api/weather/route.ts
import { NextRequest, NextResponse } from "next/server";

interface WeatherData {
  location: string;
  current: {
    temp: number;
    feels_like: number;
    condition: string;
    icon: string;
    humidity: number;
    wind_speed: number;
    uv_index: number;
  };
  forecast: Array<{
    date: string;
    temp_max: number;
    temp_min: number;
    condition: string;
    icon: string;
    rain_chance: number;
  }>;
  recommendations: string[];
}

// Get weather from OpenWeatherMap API
async function fetchOpenWeatherMap(location: string): Promise<WeatherData | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  
  if (!apiKey) {
    console.log("OpenWeatherMap API key not configured");
    return null;
  }

  try {
    // Get coordinates first
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`;
    const geoResponse = await fetch(geoUrl);
    const geoData = await geoResponse.json();

    if (!geoData || geoData.length === 0) {
      console.log("Location not found");
      return null;
    }

    const { lat, lon, name, country } = geoData[0];

    // Get current weather and forecast
    const weatherUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=metric&appid=${apiKey}`;
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();

    const current = weatherData.current;
    const forecast = weatherData.daily.slice(1, 8); // Next 7 days

    const weatherInfo: WeatherData = {
      location: `${name}, ${country}`,
      current: {
        temp: Math.round(current.temp),
        feels_like: Math.round(current.feels_like),
        condition: current.weather[0].main,
        icon: `https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`,
        humidity: current.humidity,
        wind_speed: Math.round(current.wind_speed * 3.6), // m/s to km/h
        uv_index: current.uvi
      },
      forecast: forecast.map((day: any) => ({
        date: new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        temp_max: Math.round(day.temp.max),
        temp_min: Math.round(day.temp.min),
        condition: day.weather[0].main,
        icon: `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`,
        rain_chance: Math.round((day.pop || 0) * 100)
      })),
      recommendations: generateRecommendations(current, forecast)
    };

    return weatherInfo;

  } catch (error) {
    console.error("OpenWeatherMap API error:", error);
    return null;
  }
}

// Generate AI-powered weather recommendations
async function generateAIWeatherAdvice(location: string, weatherData: WeatherData): Promise<string[]> {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return [];

    const prompt = `Based on this weather forecast for ${location}:
Current: ${weatherData.current.temp}°C, ${weatherData.current.condition}
Next 7 days: ${weatherData.forecast.map(d => `${d.date}: ${d.temp_max}°C/${d.temp_min}°C, ${d.condition}, ${d.rain_chance}% rain`).join('; ')}

Provide 5 practical travel recommendations as a JSON array of strings. Consider:
- Best days for outdoor activities
- When to plan indoor activities
- What to pack
- Best times for sightseeing
- Any weather warnings

Return ONLY a JSON array like: ["Tip 1", "Tip 2", "Tip 3", "Tip 4", "Tip 5"]`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      }),
      signal: AbortSignal.timeout(10000)
    });

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "[]";
    
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];
  } catch (error) {
    console.error("AI weather advice error:", error);
    return [];
  }
}

// Generate smart recommendations based on weather
function generateRecommendations(current: any, forecast: any[]): string[] {
  const recommendations: string[] = [];

  // Temperature recommendations
  if (current.temp > 30) {
    recommendations.push("🌡️ Hot weather! Plan indoor activities during midday and outdoor activities early morning or evening.");
  } else if (current.temp < 10) {
    recommendations.push("🧥 Cold weather! Pack warm layers and plan museum visits during the coldest hours.");
  }

  // Rain recommendations
  const rainyDays = forecast.filter(d => d.rain_chance > 50).length;
  if (rainyDays >= 3) {
    recommendations.push("☔ Rain expected! Have indoor backup plans and pack an umbrella.");
  } else if (rainyDays > 0) {
    recommendations.push(`🌧️ ${rainyDays} rainy day${rainyDays > 1 ? 's' : ''} ahead. Check daily forecasts before outdoor activities.`);
  }

  // UV recommendations
  if (current.uv_index > 6) {
    recommendations.push("☀️ High UV index! Wear sunscreen, sunglasses, and a hat for outdoor activities.");
  }

  // Best days for outdoor activities
  const bestDays = forecast.filter(d => d.rain_chance < 30 && d.temp_max > 15 && d.temp_max < 30);
  if (bestDays.length > 0) {
    recommendations.push(`🌤️ Best days for outdoor activities: ${bestDays.map(d => d.date).slice(0, 3).join(', ')}`);
  }

  // Condition-specific advice
  if (current.condition.toLowerCase().includes('clear') || current.condition.toLowerCase().includes('sun')) {
    recommendations.push("☀️ Perfect weather for sightseeing! Get outside and explore!");
  }

  return recommendations;
}

// Fallback weather data
function getFallbackWeather(location: string): WeatherData {
  return {
    location: location,
    current: {
      temp: 22,
      feels_like: 20,
      condition: "Partly Cloudy",
      icon: "https://openweathermap.org/img/wn/02d@2x.png",
      humidity: 65,
      wind_speed: 15,
      uv_index: 5
    },
    forecast: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      temp_max: 24 + Math.floor(Math.random() * 6) - 3,
      temp_min: 16 + Math.floor(Math.random() * 4) - 2,
      condition: ["Clear", "Partly Cloudy", "Cloudy"][Math.floor(Math.random() * 3)],
      icon: "https://openweathermap.org/img/wn/02d@2x.png",
      rain_chance: Math.floor(Math.random() * 40)
    })),
    recommendations: [
      "🌤️ Generally pleasant weather for sightseeing",
      "🧳 Pack light layers for variable conditions",
      "☀️ Don't forget sunscreen for sunny days",
      "📸 Great photo opportunities with mixed weather",
      "🌍 Perfect conditions for exploring!"
    ]
  };
}

export async function POST(req: NextRequest) {
  try {
    const { location } = await req.json();

    if (!location || typeof location !== 'string') {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 }
      );
    }

    console.log(`🌤️ Weather request for: ${location}`);

    // Try OpenWeatherMap API
    let weatherData = await fetchOpenWeatherMap(location);

    // Enhance with AI recommendations if we have weather data
    if (weatherData) {
      const aiRecommendations = await generateAIWeatherAdvice(location, weatherData);
      if (aiRecommendations.length > 0) {
        weatherData.recommendations = aiRecommendations;
      }

      return NextResponse.json({
        weather: weatherData,
        source: "openweathermap",
        note: "Real-time weather data"
      });
    }

    // Fallback to sample data
    console.log("Using fallback weather data");
    weatherData = getFallbackWeather(location);

    return NextResponse.json({
      weather: weatherData,
      source: "fallback",
      note: "Sample weather data. Add OPENWEATHER_API_KEY for real forecasts."
    });

  } catch (error: any) {
    console.error("Weather API error:", error);

    const fallbackWeather = getFallbackWeather("destination");

    return NextResponse.json({
      weather: fallbackWeather,
      source: "error_fallback",
      error: "Failed to fetch weather",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}

export async function GET() {
  const hasOpenWeather = !!process.env.OPENWEATHER_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  return NextResponse.json({
    status: "operational",
    service: "Weather API with AI Recommendations",
    features: {
      current_weather: true,
      day_forecast: true,
      ai_recommendations: hasOpenAI,
      real_time_data: hasOpenWeather
    },
    setup: {
      openweathermap: hasOpenWeather ? "✅ configured" : "❌ Add OPENWEATHER_API_KEY (get free at https://openweathermap.org/api)",
      ai_recommendations: hasOpenAI ? "✅ available" : "❌ OpenAI required"
    }
  });
}