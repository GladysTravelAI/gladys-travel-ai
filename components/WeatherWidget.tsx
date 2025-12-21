import { useEffect, useState } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WeatherWidgetProps {
  destination: string;
  onWeatherLoad?: (weather: any) => void;
  showRecommendations?: boolean;
}

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

export default function WeatherWidget({ 
  destination, 
  onWeatherLoad,
  showRecommendations = true 
}: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!destination) return;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/weather', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location: destination })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch weather');
        }

        const data = await response.json();
        setWeather(data.weather);
        
        if (onWeatherLoad) {
          onWeatherLoad(data.weather);
        }
      } catch (err: any) {
        console.error('Weather fetch error:', err);
        setError(err.message || 'Failed to load weather');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [destination, onWeatherLoad]);

  // Get weather icon component
  const getWeatherIcon = (condition: string, size: number = 24) => {
    const lowerCondition = condition.toLowerCase();
    
    if (lowerCondition.includes('rain')) {
      return <CloudRain size={size} className="text-blue-500" />;
    } else if (lowerCondition.includes('cloud')) {
      return <Cloud size={size} className="text-gray-500" />;
    } else if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) {
      return <Sun size={size} className="text-yellow-500" />;
    } else {
      return <Cloud size={size} className="text-gray-400" />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Loading weather...</p>
          </div>
        </div>
      </Card>
    );
  }

  // Error state
  if (error || !weather) {
    return (
      <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
        <div className="flex items-center space-x-3 text-gray-500">
          <AlertTriangle size={24} />
          <div>
            <p className="font-semibold">Weather unavailable</p>
            <p className="text-sm">We couldn't fetch the weather forecast</p>
          </div>
        </div>
      </Card>
    );
  }

  // Get UV index color
  const getUVColor = (uv: number) => {
    if (uv <= 2) return 'bg-green-500';
    if (uv <= 5) return 'bg-yellow-500';
    if (uv <= 7) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      {/* Current Weather Card */}
      <Card className="overflow-hidden border-2 border-blue-200 shadow-lg">
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold mb-1">{weather.location}</h3>
              <p className="text-white/80 text-sm flex items-center gap-2">
                <Calendar size={14} />
                Current Weather
              </p>
            </div>
            {weather.current.icon && (
              <img 
                src={weather.current.icon} 
                alt={weather.current.condition}
                className="w-20 h-20 drop-shadow-lg"
              />
            )}
          </div>

          <div className="flex items-end justify-between">
            <div>
              <div className="text-6xl font-bold mb-1">{weather.current.temp}°</div>
              <p className="text-lg text-white/90">{weather.current.condition}</p>
              <p className="text-sm text-white/70">Feels like {weather.current.feels_like}°C</p>
            </div>
          </div>
        </div>

        {/* Weather Details */}
        <div className="grid grid-cols-3 gap-4 p-6 bg-white">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Droplets className="text-blue-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{weather.current.humidity}%</p>
            <p className="text-xs text-gray-500">Humidity</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Wind className="text-cyan-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{weather.current.wind_speed}</p>
            <p className="text-xs text-gray-500">km/h Wind</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Sun className="text-orange-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{weather.current.uv_index}</p>
            <p className="text-xs text-gray-500">UV Index</p>
            <div className={`mt-1 h-1 w-full rounded-full ${getUVColor(weather.current.uv_index)}`}></div>
          </div>
        </div>
      </Card>

      {/* 7-Day Forecast */}
      <Card className="p-6 border-2 border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="text-blue-600" size={20} />
          <h4 className="font-bold text-gray-900">7-Day Forecast</h4>
        </div>

        <div className="space-y-3">
          {weather.forecast.map((day, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1">
                <span className="text-sm font-semibold text-gray-700 w-20">
                  {day.date}
                </span>
                {day.icon ? (
                  <img 
                    src={day.icon} 
                    alt={day.condition}
                    className="w-10 h-10"
                  />
                ) : (
                  getWeatherIcon(day.condition, 24)
                )}
                <span className="text-sm text-gray-600 flex-1">{day.condition}</span>
              </div>

              <div className="flex items-center space-x-4">
                {day.rain_chance > 0 && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    <CloudRain size={12} className="mr-1" />
                    {day.rain_chance}%
                  </Badge>
                )}
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-gray-800">{day.temp_max}°</span>
                  <span className="text-sm text-gray-500">{day.temp_min}°</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* AI Recommendations */}
      {showRecommendations && weather.recommendations.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Eye className="text-white" size={16} />
            </div>
            <h4 className="font-bold text-amber-900">Weather-Based Tips</h4>
          </div>

          <div className="space-y-3">
            {weather.recommendations.map((recommendation, index) => (
              <div 
                key={index}
                className="flex items-start space-x-3 p-3 bg-white rounded-xl"
              >
                <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-amber-700">{index + 1}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{recommendation}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-left">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              {getWeatherIcon(weather.current.condition, 20)}
            </div>
            <div>
              <p className="text-xs text-gray-500">Best for</p>
              <p className="text-sm font-semibold text-gray-900">
                {weather.current.condition.includes('Rain') ? 'Indoor Activities' : 'Outdoor Activities'}
              </p>
            </div>
          </div>
        </button>

        <button className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all text-left">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Sun className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pack</p>
              <p className="text-sm font-semibold text-gray-900">
                {weather.current.temp > 25 ? 'Light Clothes' : weather.current.temp > 15 ? 'Layers' : 'Warm Clothes'}
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}