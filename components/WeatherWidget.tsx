'use client';

import { useEffect, useState } from 'react';
import { 
  Cloud, CloudRain, Sun, Wind, Droplets, Eye, AlertTriangle, 
  TrendingUp, Calendar, CloudSnow, CloudDrizzle, CloudFog,
  Zap, Thermometer, Gauge, RefreshCw, MapPin, Check
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ==================== TYPES ====================

interface WeatherWidgetProps {
  destination: string;
  onWeatherLoad?: (weather: WeatherData) => void;
  showRecommendations?: boolean;
  showHourlyForecast?: boolean;
  compact?: boolean;
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
    pressure?: number;
    visibility?: number;
  };
  forecast: Array<{
    date: string;
    temp_max: number;
    temp_min: number;
    condition: string;
    icon: string;
    rain_chance: number;
  }>;
  hourly?: Array<{
    time: string;
    temp: number;
    condition: string;
    icon: string;
    rain_chance: number;
  }>;
  alerts?: Array<{
    severity: 'warning' | 'watch' | 'advisory';
    title: string;
    description: string;
  }>;
  recommendations: string[];
}

// ==================== WEATHER WIDGET ====================

export default function WeatherWidget({ 
  destination, 
  onWeatherLoad,
  showRecommendations = true,
  showHourlyForecast = false,
  compact = false,
}: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  // Fetch weather data
  const fetchWeather = async () => {
    if (!destination) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: destination }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();
      setWeather(data.weather);
      
      if (onWeatherLoad) {
        onWeatherLoad(data.weather);
      }
    } catch (err: any) {
      console.error('❌ Weather fetch error:', err);
      setError(err.message || 'Failed to load weather');
      
      toast.error('Weather unavailable', {
        description: 'Could not load weather forecast for ' + destination,
      });
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [destination]);

  // Retry handler
  const handleRetry = () => {
    setRetrying(true);
    fetchWeather();
  };

  // Get weather icon component
  const getWeatherIcon = (condition: string, size: number = 24) => {
    const lowerCondition = condition.toLowerCase();
    
    if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) {
      return <CloudRain size={size} className="text-blue-500" />;
    } else if (lowerCondition.includes('drizzle')) {
      return <CloudDrizzle size={size} className="text-blue-400" />;
    } else if (lowerCondition.includes('snow')) {
      return <CloudSnow size={size} className="text-blue-300" />;
    } else if (lowerCondition.includes('fog') || lowerCondition.includes('mist')) {
      return <CloudFog size={size} className="text-gray-400" />;
    } else if (lowerCondition.includes('storm') || lowerCondition.includes('thunder')) {
      return <Zap size={size} className="text-yellow-500" />;
    } else if (lowerCondition.includes('cloud')) {
      return <Cloud size={size} className="text-gray-500" />;
    } else if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) {
      return <Sun size={size} className="text-yellow-500" />;
    } else {
      return <Cloud size={size} className="text-gray-400" />;
    }
  };

  // Get UV index info
  const getUVInfo = (uv: number) => {
    if (uv <= 2) return { color: 'bg-green-500', label: 'Low', textColor: 'text-green-700' };
    if (uv <= 5) return { color: 'bg-yellow-500', label: 'Moderate', textColor: 'text-yellow-700' };
    if (uv <= 7) return { color: 'bg-orange-500', label: 'High', textColor: 'text-orange-700' };
    if (uv <= 10) return { color: 'bg-red-500', label: 'Very High', textColor: 'text-red-700' };
    return { color: 'bg-purple-600', label: 'Extreme', textColor: 'text-purple-700' };
  };

  // Get packing suggestions
  const getPackingSuggestions = (temp: number, condition: string) => {
    const suggestions = [];
    
    if (temp > 25) {
      suggestions.push('Light & breathable clothes');
      suggestions.push('Sunscreen');
      suggestions.push('Hat & sunglasses');
    } else if (temp > 15) {
      suggestions.push('Layers');
      suggestions.push('Light jacket');
    } else if (temp > 5) {
      suggestions.push('Warm jacket');
      suggestions.push('Long pants');
    } else {
      suggestions.push('Heavy winter coat');
      suggestions.push('Gloves & scarf');
    }
    
    if (condition.toLowerCase().includes('rain')) {
      suggestions.push('Umbrella');
      suggestions.push('Waterproof jacket');
    }
    
    return suggestions;
  };

  // ==================== LOADING STATE ====================

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Skeleton for current weather */}
        <Card className="overflow-hidden border-2 border-gray-200">
          <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 p-6 text-white">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-white/20 rounded w-1/3"></div>
              <div className="h-12 bg-white/20 rounded w-1/4"></div>
              <div className="h-4 bg-white/20 rounded w-1/2"></div>
            </div>
          </div>
          <div className="p-6 bg-white">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Skeleton for forecast */}
        <Card className="p-6 border-2 border-gray-200">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    );
  }

  // ==================== ERROR STATE ====================

  if (error || !weather) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="p-8 bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200">
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto"
            >
              <AlertTriangle className="text-red-600" size={32} />
            </motion.div>
            
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">
                Weather Unavailable
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                We couldn't fetch the weather forecast for <strong>{destination}</strong>
              </p>
            </div>

            <button
              onClick={handleRetry}
              disabled={retrying}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              <RefreshCw size={16} className={retrying ? 'animate-spin' : ''} />
              {retrying ? 'Retrying...' : 'Try Again'}
            </button>
          </div>
        </Card>
      </motion.div>
    );
  }

  const uvInfo = getUVInfo(weather.current.uv_index);
  const packingSuggestions = getPackingSuggestions(weather.current.temp, weather.current.condition);

  // ==================== COMPACT MODE ====================

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-cyan-600 border-2 border-blue-300 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {weather.current.icon ? (
                <img 
                  src={weather.current.icon} 
                  alt={weather.current.condition}
                  className="w-12 h-12"
                />
              ) : (
                getWeatherIcon(weather.current.condition, 32)
              )}
              <div>
                <p className="text-2xl font-bold">{weather.current.temp}°C</p>
                <p className="text-sm text-white/80">{weather.current.condition}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xs text-white/60 flex items-center gap-1 justify-end mb-1">
                <MapPin size={10} />
                {weather.location}
              </p>
              <div className="flex gap-3 text-xs text-white/80">
                <span className="flex items-center gap-1">
                  <Droplets size={12} />
                  {weather.current.humidity}%
                </span>
                <span className="flex items-center gap-1">
                  <Wind size={12} />
                  {weather.current.wind_speed}km/h
                </span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // ==================== FULL MODE ====================

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Weather Alerts */}
      <AnimatePresence>
        {weather.alerts && weather.alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-4 bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <h4 className="font-bold text-red-900 mb-2">Weather Alerts</h4>
                  <div className="space-y-2">
                    {weather.alerts.map((alert, idx) => (
                      <div key={idx} className="text-sm">
                        <p className="font-semibold text-red-800">{alert.title}</p>
                        <p className="text-red-700">{alert.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Weather Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="overflow-hidden border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-shadow">
          {/* Header with gradient */}
          <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 p-6 text-white relative overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}></div>
            </div>

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold mb-1 flex items-center gap-2">
                    <MapPin size={20} />
                    {weather.location}
                  </h3>
                  <p className="text-white/80 text-sm flex items-center gap-2">
                    <Calendar size={14} />
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', duration: 0.6 }}
                >
                  {weather.current.icon ? (
                    <img 
                      src={weather.current.icon} 
                      alt={weather.current.condition}
                      className="w-24 h-24 drop-shadow-2xl"
                    />
                  ) : (
                    getWeatherIcon(weather.current.condition, 64)
                  )}
                </motion.div>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <motion.div 
                    className="text-7xl font-bold mb-1"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {weather.current.temp}°
                  </motion.div>
                  <p className="text-xl text-white/90 mb-1">{weather.current.condition}</p>
                  <p className="text-sm text-white/70 flex items-center gap-1">
                    <Thermometer size={14} />
                    Feels like {weather.current.feels_like}°C
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Weather Details Grid */}
          <div className="grid grid-cols-3 gap-4 p-6 bg-white">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-center mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Droplets className="text-blue-600" size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800">{weather.current.humidity}%</p>
              <p className="text-xs text-gray-500">Humidity</p>
            </motion.div>
            
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="flex items-center justify-center mb-2">
                <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                  <Wind className="text-cyan-600" size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800">{weather.current.wind_speed}</p>
              <p className="text-xs text-gray-500">km/h Wind</p>
            </motion.div>
            
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-center mb-2">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Sun className="text-orange-600" size={20} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800">{weather.current.uv_index}</p>
              <p className="text-xs text-gray-500 mb-1">UV Index</p>
              <Badge variant="outline" className={`text-xs ${uvInfo.textColor} bg-opacity-10`}>
                {uvInfo.label}
              </Badge>
            </motion.div>
          </div>

          {/* Additional metrics if available */}
          {(weather.current.pressure || weather.current.visibility) && (
            <div className="grid grid-cols-2 gap-4 px-6 pb-6 bg-white border-t">
              {weather.current.pressure && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Gauge className="text-purple-600" size={20} />
                  <div>
                    <p className="text-xs text-gray-500">Pressure</p>
                    <p className="text-sm font-bold">{weather.current.pressure} mb</p>
                  </div>
                </div>
              )}
              {weather.current.visibility && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Eye className="text-indigo-600" size={20} />
                  <div>
                    <p className="text-xs text-gray-500">Visibility</p>
                    <p className="text-sm font-bold">{weather.current.visibility} km</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Hourly Forecast (if enabled) */}
      {showHourlyForecast && weather.hourly && weather.hourly.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 border-2 border-gray-200">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={20} />
              Hourly Forecast
            </h4>

            <div className="overflow-x-auto pb-2">
              <div className="flex gap-3 min-w-max">
                {weather.hourly.slice(0, 12).map((hour, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl min-w-[80px] hover:from-blue-50 hover:to-cyan-50 transition-colors"
                  >
                    <p className="text-xs font-semibold text-gray-600">{hour.time}</p>
                    {hour.icon ? (
                      <img src={hour.icon} alt={hour.condition} className="w-10 h-10" />
                    ) : (
                      getWeatherIcon(hour.condition, 24)
                    )}
                    <p className="text-lg font-bold">{hour.temp}°</p>
                    {hour.rain_chance > 0 && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                        {hour.rain_chance}%
                      </Badge>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* 7-Day Forecast */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="p-6 border-2 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={20} />
              7-Day Forecast
            </h4>
          </div>

          <div className="space-y-3">
            {weather.forecast.map((day, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-blue-50 hover:to-cyan-50 transition-all group"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <span className="text-sm font-semibold text-gray-700 w-20">
                    {day.date}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {day.icon ? (
                      <img 
                        src={day.icon} 
                        alt={day.condition}
                        className="w-10 h-10"
                      />
                    ) : (
                      getWeatherIcon(day.condition, 24)
                    )}
                    <span className="text-sm text-gray-600 min-w-[120px]">
                      {day.condition}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {day.rain_chance > 0 && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      <CloudRain size={12} className="mr-1" />
                      {day.rain_chance}%
                    </Badge>
                  )}
                  
                  <div className="flex items-baseline gap-2 min-w-[80px] justify-end">
                    <span className="text-xl font-bold text-gray-800">
                      {day.temp_max}°
                    </span>
                    <span className="text-sm text-gray-500">
                      {day.temp_min}°
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Packing Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <Check className="text-white" size={16} />
            </div>
            <h4 className="font-bold text-purple-900">What to Pack</h4>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {packingSuggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 + index * 0.05 }}
                className="flex items-center gap-2 p-3 bg-white rounded-xl"
              >
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <p className="text-sm text-gray-700">{suggestion}</p>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* AI Recommendations */}
      {showRecommendations && weather.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Eye className="text-white" size={16} />
              </div>
              <h4 className="font-bold text-amber-900">Weather-Based Tips</h4>
            </div>

            <div className="space-y-3">
              {weather.recommendations.map((recommendation, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="flex items-start space-x-3 p-4 bg-white rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-white">{index + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{recommendation}</p>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Quick Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-2 gap-3"
      >
        <button className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-50 transition-all text-left group">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              {getWeatherIcon(weather.current.condition, 24)}
            </div>
            <div>
              <p className="text-xs text-gray-500">Best for</p>
              <p className="text-sm font-semibold text-gray-900">
                {weather.current.condition.toLowerCase().includes('rain') 
                  ? 'Indoor Activities' 
                  : 'Outdoor Activities'}
              </p>
            </div>
          </div>
        </button>

        <button 
          onClick={handleRetry}
          className="p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 transition-all text-left group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <RefreshCw className="text-white" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Weather</p>
              <p className="text-sm font-semibold text-gray-900">Refresh</p>
            </div>
          </div>
        </button>
      </motion.div>
    </motion.div>
  );
}