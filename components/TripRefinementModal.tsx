import { useState, useEffect } from "react";
import { X, MapPin, Loader2, Cloud, Calendar, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TripRefinementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (preferences: TripPreferences) => void;
  destination: string;
  isLoading?: boolean;
}

export interface TripPreferences {
  budget: string;
  tripType: string;
  groupType: 'solo' | 'couple' | 'family' | 'group';
  groupSize: number;
  days: number;
  origin?: string;
  considerWeather?: boolean;
  checkEvents?: boolean;
}

export default function EnhancedTripRefinementModal({
  isOpen,
  onClose,
  onGenerate,
  destination,
  isLoading = false
}: TripRefinementModalProps) {
  const [budget, setBudget] = useState<string>('Mid-range');
  const [tripType, setTripType] = useState('balanced');
  const [groupType, setGroupType] = useState<'solo' | 'couple' | 'family' | 'group'>('solo');
  const [days, setDays] = useState(5);
  const [origin, setOrigin] = useState('Johannesburg, South Africa');
  const [considerWeather, setConsiderWeather] = useState(true);
  const [checkEvents, setCheckEvents] = useState(true);
  
  // NEW: Weather preview
  const [weatherPreview, setWeatherPreview] = useState<any>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);

  // Fetch weather and events when modal opens
  useEffect(() => {
    if (isOpen && destination) {
      fetchWeatherAndEvents();
    }
  }, [isOpen, destination]);

  const fetchWeatherAndEvents = async () => {
    setLoadingExtras(true);
    
    try {
      // Fetch weather
      const weatherRes = await fetch('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: destination })
      });
      const weatherData = await weatherRes.json();
      setWeatherPreview(weatherData.weather);

      // Fetch events
      const eventsRes = await fetch('/api/sports-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sport: 'Football', 
          city: destination,
          year: 2026
        })
      });
      const eventsData = await eventsRes.json();
      setUpcomingEvents(eventsData.events?.slice(0, 3) || []);
    } catch (error) {
      console.error('Failed to fetch weather/events:', error);
    } finally {
      setLoadingExtras(false);
    }
  };

  if (!isOpen) return null;

  const budgetOptions = [
    { value: 'Budget', label: 'Budget', description: '$50-100/day', icon: '💰' },
    { value: 'Mid-range', label: 'Mid-Range', description: '$100-250/day', icon: '💳' },
    { value: 'Luxury', label: 'Luxury', description: '$250+/day', icon: '💎' },
  ];

  const styleOptions = [
    { value: 'adventure', label: 'Adventure', icon: '🏔️' },
    { value: 'romantic', label: 'Romantic', icon: '💕' },
    { value: 'family-friendly', label: 'Family', icon: '👨‍👩‍👧‍👦' },
    { value: 'cultural', label: 'Cultural', icon: '🏛️' },
    { value: 'relaxation', label: 'Relaxation', icon: '🧘' },
    { value: 'foodie', label: 'Foodie', icon: '🍽️' },
    { value: 'beach', label: 'Beach', icon: '🏖️' },
    { value: 'nightlife', label: 'Nightlife', icon: '🎉' },
  ];

  const groupOptions = [
    { value: 'solo', label: 'Solo', icon: '🚶', size: 1 },
    { value: 'couple', label: 'Couple', icon: '💑', size: 2 },
    { value: 'family', label: 'Family', icon: '👨‍👩‍👧', size: 4 },
    { value: 'group', label: 'Group', icon: '👥', size: 6 },
  ];

  const dayOptions = [3, 5, 7, 10, 14];

  const handleGenerate = () => {
    const selectedGroup = groupOptions.find(g => g.value === groupType);
    const prefs: TripPreferences = {
      budget,
      tripType,
      groupType,
      groupSize: selectedGroup?.size || 1,
      days,
      origin: origin || undefined,
      considerWeather,
      checkEvents
    };
    onGenerate(prefs);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!isLoading ? onClose : undefined} />

      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <MapPin className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">Plan Your Perfect Trip</h2>
                <p className="text-white/90">To {destination}</p>
              </div>
            </div>
            <button onClick={onClose} disabled={isLoading} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X className="text-white" size={24} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
            
            {/* Left: Trip Preferences */}
            <div className="lg:col-span-2 p-6 space-y-8">
              
              {/* Budget Level */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Level</h3>
                <div className="grid grid-cols-3 gap-3">
                  {budgetOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setBudget(option.value)}
                      className={`p-4 rounded-2xl border-2 transition-all text-center ${
                        budget === option.value
                          ? 'border-green-500 bg-green-50 scale-105 shadow-lg'
                          : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-3xl mb-2">{option.icon}</div>
                      <div className="text-sm font-semibold text-gray-900">{option.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Travel Style */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Travel Style</h3>
                <div className="grid grid-cols-4 gap-3">
                  {styleOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTripType(option.value)}
                      className={`p-4 rounded-2xl border-2 transition-all text-center ${
                        tripType === option.value
                          ? 'border-purple-500 bg-purple-50 scale-105 shadow-lg'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <div className="text-sm font-semibold text-gray-900">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Who's Traveling */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Who's Traveling?</h3>
                <div className="grid grid-cols-4 gap-3">
                  {groupOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setGroupType(option.value as any)}
                      className={`p-4 rounded-2xl border-2 transition-all text-center ${
                        groupType === option.value
                          ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-2xl mb-2">{option.icon}</div>
                      <div className="text-xs font-semibold text-gray-900">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Trip Duration */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Duration</h3>
                <div className="grid grid-cols-5 gap-3">
                  {dayOptions.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDays(d)}
                      className={`px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                        days === d ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {d} days
                    </button>
                  ))}
                </div>
              </div>

              {/* Smart Features */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🤖 Smart Features</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={considerWeather}
                      onChange={(e) => setConsiderWeather(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Cloud size={18} className="text-blue-600" />
                        <span className="font-semibold text-gray-900">Weather-Smart Planning</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Adjust activities based on forecast</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-4 bg-purple-50 rounded-xl cursor-pointer hover:bg-purple-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={checkEvents}
                      onChange={(e) => setCheckEvents(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Calendar size={18} className="text-purple-600" />
                        <span className="font-semibold text-gray-900">Include Local Events</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Check for festivals, sports, concerts</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right: Weather & Events Preview */}
            <div className="p-6 bg-gray-50 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Destination Insights</h3>

              {loadingExtras ? (
                <div className="text-center py-8">
                  <Loader2 className="animate-spin mx-auto text-blue-600 mb-2" size={32} />
                  <p className="text-sm text-gray-600">Loading insights...</p>
                </div>
              ) : (
                <>
                  {/* Weather Preview */}
                  {weatherPreview && (
                    <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-4 text-white">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm opacity-80">Current Weather</p>
                          <p className="text-3xl font-bold">{weatherPreview.current.temp}°C</p>
                        </div>
                        {weatherPreview.current.icon && (
                          <img src={weatherPreview.current.icon} alt="weather" className="w-16 h-16" />
                        )}
                      </div>
                      <p className="text-sm opacity-90">{weatherPreview.current.condition}</p>
                      <div className="mt-3 pt-3 border-t border-white/20">
                        <p className="text-xs opacity-80">Next 7 days:</p>
                        <div className="flex gap-2 mt-2">
                          {weatherPreview.forecast.slice(0, 5).map((day: any, i: number) => (
                            <div key={i} className="text-center flex-1">
                              <p className="text-xs opacity-70">{day.date.split(' ')[0]}</p>
                              <p className="text-sm font-bold">{day.temp_max}°</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upcoming Events */}
                  {upcomingEvents.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Star size={16} className="text-amber-500" />
                        Upcoming Events
                      </p>
                      {upcomingEvents.map((event, i) => (
                        <div key={i} className="bg-white rounded-xl p-3 border border-gray-200">
                          <p className="text-xs font-semibold text-gray-900">{event.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{event.location.venue}</p>
                          <p className="text-xs text-blue-600 font-medium mt-1">{event.date}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Season Info */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 mb-2">🌍 Best Time to Visit</p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Based on weather patterns, this is a great time for outdoor activities in {destination}.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <div className="flex gap-3">
            <Button onClick={onClose} disabled={isLoading} variant="outline" className="flex-1 py-6 rounded-2xl text-base font-semibold">
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="flex-1 py-6 rounded-2xl text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  Generating...
                </span>
              ) : (
                'Generate Smart Itinerary ✨'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}