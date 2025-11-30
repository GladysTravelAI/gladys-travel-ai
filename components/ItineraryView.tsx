"use client";

import { useState } from "react";
import { 
  Download, Share2, MapPin, CalendarDays, Users, Flag, Building, Plane,
  BadgeDollarSign, ShieldCheck, Clock, Utensils, Ticket,
  ChevronDown, ChevronUp
} from "lucide-react";

// Types (keep your existing interfaces)
interface ActivityBlock {
  time: string;
  activities: string;
  location: string;
  transportTime: string;
  cost: string;
}

interface Meal {
  meal: string;
  recommendation: string;
  cuisine: string;
  location: string;
  priceRange: string;
}

interface EventBlock {
  hasEvent: boolean;
  startTime: string;
  venue: string;
  teams: string;
  arrivalTime: string;
  preEventActivities: string[];
  postEventPlan: string;
}

interface DayPlan {
  day: number;
  date: string;
  city: string;
  theme: string;
  morning: ActivityBlock;
  afternoon: ActivityBlock;
  evening: ActivityBlock;
  mealsAndDining?: Meal[];
  event?: EventBlock | null;
  transportation?: {
    method: string;
    totalTime: string;
    totalCost: string;
  };
  tips?: string[];
}

interface Accommodation {
  name: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  location: string;
  description: string;
  rating: number;
  priceRange: {
    normal: string;
    eventDay: string;
    total: string;
  };
  bookingUrl: string;
}

interface Flight {
  route: string;
  date: string;
  estimatedCost: string;
  airlines: string[];
  tips: string[];
}

interface ItineraryData {
  overview: string;
  tripSummary: {
    totalDays: number;
    cities: string[];
    eventsAttending: number;
    venues?: string[];
    highlights?: string[];
  };
  budget: {
    totalBudget: string;
    breakdown: {
      accommodation: string;
      transportation: string;
      tickets: string;
      food: string;
      activities: string;
      contingency: string;
    };
    dailyAverage: string;
    savingTips?: string[];
  };
  days: DayPlan[];
  accommodations?: Accommodation[];
  flights?: Flight[];
  localTips: {
    language?: string;
    currency?: string;
    customs?: string;
    safety?: string;
    eventTips?: string[];
  };
  metadata?: {
    generatedAt: string;
    eventFocused: boolean;
    team: string | null;
    eventCount: number;
    optimized: boolean;
    groupSize: number;
  };
}

export default function SmartItineraryView({ data }: { data?: ItineraryData }) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  
  if (!data || !data.tripSummary || !data.days || data.days.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Itinerary Data</h3>
          <p className="text-sm text-gray-600">
            Unable to load itinerary. Please try again.
          </p>
        </div>
      </div>
    );
  }

  const totalDays = data.days.length;
  const firstCity = data.tripSummary?.cities?.[0] || 'Your Destination';
  
  const handleDownloadPDF = () => {
    alert("PDF export coming soon!");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `My ${totalDays}-Day ${firstCity} Trip`,
        text: data.overview || 'Check out my travel itinerary!',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied!");
    }
  };

  const toggleDay = (dayNumber: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayNumber)) {
      newExpanded.delete(dayNumber);
    } else {
      newExpanded.add(dayNumber);
    }
    setExpandedDays(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Header - Mobile Optimized */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-2">
          Your {firstCity} Adventure
        </h1>
        <p className="text-white/90 text-sm sm:text-base">
          {totalDays} {totalDays === 1 ? 'Day' : 'Days'} of Experiences
        </p>
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleShare}
            className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all"
          >
            <Share2 size={16} />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex-1 px-4 py-2 bg-white text-blue-600 hover:bg-white/90 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all"
          >
            <Download size={16} />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* Overview Card */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Trip Overview</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          {data.overview || 'Your personalized travel itinerary'}
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          <InfoChip icon={CalendarDays} label="Duration" value={`${totalDays} ${totalDays === 1 ? 'Day' : 'Days'}`} />
          <InfoChip icon={MapPin} label="Cities" value={data.tripSummary?.cities?.[0] || 'N/A'} />
          <InfoChip icon={Users} label="Travelers" value={`${data.metadata?.groupSize || 1}`} />
          <InfoChip icon={Flag} label="Events" value={`${data.tripSummary?.eventsAttending || 0}`} />
        </div>
      </div>

      {/* Budget Card */}
      {data.budget && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Budget</h3>
          <div className="flex items-baseline justify-between mb-4">
            <span className="text-3xl font-bold text-green-700">
              {data.budget.totalBudget || 'N/A'}
            </span>
            <span className="text-sm text-gray-600">
              {data.budget.dailyAverage || 'N/A'}/day
            </span>
          </div>
          {data.budget.breakdown && (
            <div className="space-y-2">
              {Object.entries(data.budget.breakdown).slice(0, 4).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="font-semibold text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Day Timeline */}
      <div className="space-y-4">
        {data.days.map((day) => {
          const isExpanded = expandedDays.has(day.day);
          
          return (
            <div
              key={day.day}
              id={`day-${day.day}`}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
            >
              {/* Day Header */}
              <button
                onClick={() => toggleDay(day.day)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
                    {day.day}
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-semibold text-gray-900">
                      {day.theme}
                    </h3>
                    <p className="text-xs text-gray-500">{day.date}</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="text-gray-400" size={20} />
                ) : (
                  <ChevronDown className="text-gray-400" size={20} />
                )}
              </button>

              {/* Day Content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  
                  {/* Event Card */}
                  {day.event && day.event.hasEvent && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Ticket className="text-red-600" size={18} />
                        <h4 className="text-sm font-bold text-red-700">{day.event.teams}</h4>
                      </div>
                      <p className="text-xs text-red-600 mb-1">
                        {day.event.venue} @ {day.event.startTime}
                      </p>
                      <p className="text-xs text-gray-600">
                        Arrival: {day.event.arrivalTime}
                      </p>
                    </div>
                  )}

                  {/* Activities */}
                  <ActivityCard icon={Clock} title="Morning" data={day.morning} color="yellow" />
                  <ActivityCard icon={Clock} title="Afternoon" data={day.afternoon} color="orange" />
                  <ActivityCard icon={Clock} title="Evening" data={day.evening} color="indigo" />

                  {/* Meals */}
                  {day.mealsAndDining && day.mealsAndDining.length > 0 && (
                    <div className="grid grid-cols-1 gap-2">
                      {day.mealsAndDining.map((meal, idx) => (
                        <ActivityCard
                          key={`meal-${idx}`}
                          icon={Utensils}
                          title={meal.meal}
                          data={meal}
                          color="green"
                        />
                      ))}
                    </div>
                  )}

                  {/* Tips */}
                  {day.tips && day.tips.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <h5 className="text-xs font-bold text-blue-900 mb-2">💡 Tips</h5>
                      <ul className="space-y-1">
                        {day.tips.map((tip: string, idx: number) => (
                          <li key={idx} className="text-xs text-blue-800">• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Accommodations */}
      {data.accommodations && data.accommodations.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Accommodations</h3>
          <div className="space-y-3">
            {data.accommodations.map((acc, idx) => (
              <a
                key={`acc-${idx}`}
                href={acc.bookingUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-100"
              >
                <Building className="text-blue-600 mt-0.5 flex-shrink-0" size={18} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{acc.name}</p>
                  <p className="text-xs text-gray-600 truncate">{acc.location}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {acc.nights} {acc.nights === 1 ? 'night' : 'nights'}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Local Tips */}
      {data.localTips && (data.localTips.currency || data.localTips.safety) && (
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Local Tips</h3>
          <div className="space-y-3">
            {data.localTips.currency && (
              <InfoChip icon={BadgeDollarSign} label="Currency" value={data.localTips.currency} />
            )}
            {data.localTips.safety && (
              <InfoChip icon={ShieldCheck} label="Safety" value={data.localTips.safety} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function InfoChip({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon className="text-gray-500 mt-0.5 flex-shrink-0" size={16} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function ActivityCard({ 
  icon: Icon, 
  title, 
  data,
  color = "blue"
}: { 
  icon: React.ElementType;
  title: string;
  data: ActivityBlock | Meal;
  color?: string;
}) {
  const colorClasses = {
    yellow: "bg-yellow-50 border-yellow-200",
    orange: "bg-orange-50 border-orange-200",
    indigo: "bg-indigo-50 border-indigo-200",
    green: "bg-green-50 border-green-200",
    blue: "bg-blue-50 border-blue-200"
  };

  const iconColors = {
    yellow: "text-yellow-600",
    orange: "text-orange-600",
    indigo: "text-indigo-600",
    green: "text-green-600",
    blue: "text-blue-600"
  };

  return (
    <div className={`${colorClasses[color as keyof typeof colorClasses]} border rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`${iconColors[color as keyof typeof iconColors]} flex-shrink-0`} size={16} />
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      </div>
      {'activities' in data ? (
        <>
          <p className="text-xs text-gray-700 leading-relaxed mb-2">{data.activities}</p>
          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
            <span>📍 {data.location}</span>
            <span>💰 {data.cost}</span>
          </div>
        </>
      ) : (
        <p className="text-xs text-gray-700">
          <span className="font-semibold">{data.recommendation}</span>
          <span className="text-gray-500"> • {data.priceRange}</span>
        </p>
      )}
    </div>
  );
}