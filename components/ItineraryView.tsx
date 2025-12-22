import { useState } from "react";
import { Download, Share2, MapPin, Calendar, Users, DollarSign, Star, Coffee, Sun, Moon, Utensils, Camera, Play, Heart, Bookmark } from "lucide-react";

interface ItineraryData {
  overview: string;
  tripSummary: { totalDays: number; cities: string[]; highlights?: string[]; };
  budget: { totalBudget: string; dailyAverage: string; };
  days: Array<{
    day: number;
    date: string;
    city: string;
    theme: string;
    morning: { time: string; activities: string; location: string; cost: string; };
    afternoon: { time: string; activities: string; location: string; cost: string; };
    evening: { time: string; activities: string; location: string; cost: string; };
    mealsAndDining?: Array<{ meal: string; recommendation: string; priceRange: string; location: string; }>;
    tips?: string[];
  }>;
  accommodations?: any[];
  metadata?: any;
}

export default function StunningItineraryView({ data }: { data?: ItineraryData }) {
  const [selectedDay, setSelectedDay] = useState(1);
  const [savedDays, setSavedDays] = useState<Set<number>>(new Set());

  if (!data || !data.days || data.days.length === 0) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <MapPin className="text-purple-600" size={48} />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">Your Adventure Awaits</h3>
          <p className="text-gray-600 text-lg">Generate your trip to see your personalized itinerary</p>
        </div>
      </div>
    );
  }

  const currentDay = data.days[selectedDay - 1];
  const firstCity = data.tripSummary?.cities?.[0] || 'Your Destination';

  const toggleSaveDay = (day: number) => {
    const newSaved = new Set(savedDays);
    if (newSaved.has(day)) newSaved.delete(day);
    else newSaved.add(day);
    setSavedDays(newSaved);
  };

  return (
    <div className="space-y-6">
      
      {/* Epic Hero Section */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzMiAyIDIgNHYyYzAgMi0yIDQtMiA0cy0yLTItMi00di0yem0wLTMwYzAtMiAyLTQgMi00czIgMiAyIDR2MmMwIDItMiA0LTIgNHMtMi0yLTItNFY0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        
        <div className="relative p-8 md:p-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <MapPin className="text-white" size={32} />
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium uppercase tracking-wide">Your Journey To</p>
                <h1 className="text-5xl font-bold text-white">{firstCity}</h1>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-all">
                <Download className="text-white" size={20} />
              </button>
              <button className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/30 transition-all">
                <Share2 className="text-white" size={20} />
              </button>
            </div>
          </div>

          <p className="text-white/95 text-lg mb-8 max-w-3xl leading-relaxed">
            {data.overview}
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickStat icon={Calendar} label="Days" value={data.tripSummary.totalDays.toString()} />
            <QuickStat icon={Users} label="Travelers" value={data.metadata?.groupSize || "1"} />
            <QuickStat icon={DollarSign} label="Budget" value={data.budget.totalBudget.replace('USD', '')} />
            <QuickStat icon={Star} label="Highlights" value={data.tripSummary.highlights?.length.toString() || "5+"} />
          </div>
        </div>
      </div>

      {/* Day Navigator - Carousel Style */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {data.days.map((day) => (
            <button
              key={day.day}
              onClick={() => setSelectedDay(day.day)}
              className={`flex-shrink-0 group ${
                selectedDay === day.day ? 'w-64' : 'w-20'
              } transition-all duration-300`}
            >
              <div className={`relative overflow-hidden rounded-2xl ${
                selectedDay === day.day
                  ? 'bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl'
                  : 'bg-white border-2 border-gray-200 hover:border-blue-300'
              } p-4 h-24 transition-all`}>
                
                {selectedDay === day.day ? (
                  <div className="text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl font-bold">Day {day.day}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleSaveDay(day.day); }}
                        className="ml-auto"
                      >
                        <Heart 
                          size={20} 
                          className={savedDays.has(day.day) ? 'fill-white' : ''} 
                        />
                      </button>
                    </div>
                    <p className="text-sm text-white/90 truncate">{day.theme}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-1">{day.day}</div>
                    <div className="text-xs text-gray-500">Day</div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Day - Visual Story */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Timeline - Left Column */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Day Header */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">{currentDay.theme}</h2>
                <p className="text-gray-600">{currentDay.date} • {currentDay.city}</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Play size={16} />
                Start Day
              </button>
            </div>
          </div>

          {/* Morning */}
          <TimeBlock
            icon={Coffee}
            title="Morning"
            emoji="☀️"
            time={currentDay.morning.time}
            activities={currentDay.morning.activities}
            location={currentDay.morning.location}
            cost={currentDay.morning.cost}
            gradient="from-amber-400 to-orange-500"
            bgColor="from-amber-50 to-orange-50"
          />

          {/* Afternoon */}
          <TimeBlock
            icon={Sun}
            title="Afternoon"
            emoji="🌤️"
            time={currentDay.afternoon.time}
            activities={currentDay.afternoon.activities}
            location={currentDay.afternoon.location}
            cost={currentDay.afternoon.cost}
            gradient="from-orange-400 to-red-500"
            bgColor="from-orange-50 to-red-50"
          />

          {/* Evening */}
          <TimeBlock
            icon={Moon}
            title="Evening"
            emoji="🌙"
            time={currentDay.evening.time}
            activities={currentDay.evening.activities}
            location={currentDay.evening.location}
            cost={currentDay.evening.cost}
            gradient="from-indigo-500 to-purple-600"
            bgColor="from-indigo-50 to-purple-50"
          />
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-4">
          
          {/* Dining Recommendations */}
          {currentDay.mealsAndDining && currentDay.mealsAndDining.length > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Utensils className="text-green-600" size={20} />
                Where to Eat
              </h3>
              <div className="space-y-3">
                {currentDay.mealsAndDining.map((meal, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-green-100">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{meal.meal}</p>
                        <p className="text-xs text-gray-600">{meal.recommendation}</p>
                      </div>
                      <span className="text-xs font-bold text-green-600">{meal.priceRange}</span>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin size={10} />
                      {meal.location}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pro Tips */}
          {currentDay.tips && currentDay.tips.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-200 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Camera className="text-blue-600" size={20} />
                Pro Tips
              </h3>
              <div className="space-y-2">
                {currentDay.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-600 mt-0.5">💡</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Budget */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3">Today's Budget</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Morning</span>
                <span className="font-semibold">{currentDay.morning.cost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Afternoon</span>
                <span className="font-semibold">{currentDay.afternoon.cost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Evening</span>
                <span className="font-semibold">{currentDay.evening.cost}</span>
              </div>
              <div className="pt-2 border-t flex justify-between">
                <span className="font-bold">Total</span>
                <span className="font-bold text-purple-600">{data.budget.dailyAverage}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

function QuickStat({ icon: Icon, label, value }: any) {
  return (
    <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/20">
      <Icon className="text-white/90 mb-2" size={24} />
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-white/80 text-sm">{label}</p>
    </div>
  );
}

function TimeBlock({ icon: Icon, title, emoji, time, activities, location, cost, gradient, bgColor }: any) {
  return (
    <div className={`bg-gradient-to-br ${bgColor} rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all group`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <span className="text-2xl">{emoji}</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{time}</p>
          </div>
        </div>
        <span className="text-2xl font-bold text-gray-900">{cost}</span>
      </div>
      
      <p className="text-gray-800 leading-relaxed mb-4">{activities}</p>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin size={16} />
          <span>{location}</span>
        </div>
        <button className="px-4 py-2 bg-white rounded-xl font-semibold hover:shadow-md transition-all flex items-center gap-2 group-hover:scale-105">
          <MapPin size={14} />
          Navigate
        </button>
      </div>
    </div>
  );
}