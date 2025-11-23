"use client";

import { useState } from "react";
import { 
  Download, Share2, MapPin, CalendarDays, Users, Flag, Building, Plane,
  BadgeDollarSign, ShieldCheck, ClipboardList, Clock, Utensils, Ticket,
  ChevronDown, ChevronUp, Sparkles
} from "lucide-react";

// Types
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
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));
  
  // Handle missing or invalid data
  if (!data || !data.tripSummary || !data.days || data.days.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Itinerary Data</h2>
          <p className="text-gray-600">
            Unable to load itinerary information. Please check your data source.
          </p>
        </div>
      </div>
    );
  }

  const totalDays = data.days.length;
  const firstCity = data.tripSummary?.cities?.[0] || 'Your Destination';
  
  const handleDownloadPDF = () => {
    alert("PDF export coming soon! For now, use your browser's print function (Ctrl+P)");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `My ${totalDays}-Day ${firstCity} Itinerary`,
        text: data.overview || 'Check out my travel itinerary!',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
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

  const scrollToDay = (dayNumber: number) => {
    setSelectedDay(dayNumber);
    const element = document.getElementById(`day-${dayNumber}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Expand all days helper
  const expandAllDays = () => {
    setExpandedDays(new Set(data.days.map(d => d.day)));
  };

  const collapseAllDays = () => {
    setExpandedDays(new Set());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Section */}
      <div className="relative h-80 w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920')] bg-cover bg-center mix-blend-overlay opacity-40" />
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto p-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="text-yellow-300" size={28} />
            <span className="text-sm font-semibold text-yellow-300 bg-yellow-300/20 px-3 py-1 rounded-full backdrop-blur-sm">
              Powered by GPT-5.1
            </span>
          </div>
          <h1 className="text-5xl font-bold text-white drop-shadow-lg">
            Your {firstCity} Adventure
          </h1>
          <p className="text-xl text-white/90 mt-2 drop-shadow-md">
            {totalDays} {totalDays === 1 ? 'Day' : 'Days'} of Unforgettable Experiences
          </p>
        </div>
        <div className="absolute top-6 right-6 flex gap-3">
          <button
            onClick={handleShare}
            className="px-6 py-3 bg-white/90 backdrop-blur-sm hover:bg-white rounded-xl shadow-lg flex items-center gap-2 font-medium transition-all"
          >
            <Share2 size={18} />
            Share
          </button>
          <button
            onClick={handleDownloadPDF}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg flex items-center gap-2 font-medium transition-all"
          >
            <Download size={18} />
            PDF
          </button>
        </div>
      </div>

      {/* Day Navigation Tabs */}
      <div className="sticky top-0 z-40 bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 py-4">
            <div className="flex-1 flex overflow-x-auto gap-2 scrollbar-hide">
              {data.days.map((day) => (
                <button
                  key={day.day}
                  onClick={() => scrollToDay(day.day)}
                  className={`flex-shrink-0 px-6 py-3 rounded-xl font-semibold transition-all ${
                    selectedDay === day.day
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Day {day.day}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={expandAllDays}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-all"
              >
                Expand All
              </button>
              <button
                onClick={collapseAllDays}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-all"
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 md:p-8 -mt-16 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar */}
          <div className="w-full lg:w-1/3">
            <div className="lg:sticky lg:top-24 space-y-6">
              
              {/* Trip Overview Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip Overview</h2>
                <p className="text-gray-600 leading-relaxed">{data.overview || 'Your personalized travel itinerary'}</p>
                
                <div className="h-px bg-gray-200 my-6" />
                
                <h3 className="text-lg font-bold text-gray-900 mb-4">At a Glance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoChip 
                    icon={CalendarDays} 
                    label="Duration" 
                    value={`${totalDays} ${totalDays === 1 ? 'Day' : 'Days'}`} 
                  />
                  <InfoChip 
                    icon={MapPin} 
                    label="Cities" 
                    value={data.tripSummary?.cities?.join(", ") || 'N/A'} 
                  />
                  <InfoChip 
                    icon={Flag} 
                    label="Events" 
                    value={`${data.tripSummary?.eventsAttending || 0}`} 
                  />
                  <InfoChip 
                    icon={Users} 
                    label="Travelers" 
                    value={`${data.metadata?.groupSize || 1} ${data.metadata?.groupSize === 1 ? 'Adult' : 'Adults'}`} 
                  />
                </div>

                {/* Highlights Section */}
                {data.tripSummary?.highlights && data.tripSummary.highlights.length > 0 && (
                  <>
                    <div className="h-px bg-gray-200 my-6" />
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Trip Highlights</h3>
                    <ul className="space-y-2">
                      {data.tripSummary.highlights.slice(0, 5).map((highlight: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-blue-600 mt-1">✓</span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              {/* Budget Card */}
              {data.budget && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl p-6 border border-green-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Budget Summary</h3>
                  <div className="flex items-baseline justify-between mb-6">
                    <span className="text-4xl font-bold text-green-700">{data.budget.totalBudget || 'N/A'}</span>
                    <span className="text-gray-600">/{data.budget.dailyAverage || 'N/A'}</span>
                  </div>
                  {data.budget.breakdown && (
                    <div className="space-y-3">
                      {Object.entries(data.budget.breakdown).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-sm text-gray-700 font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-sm font-bold text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {data.budget.savingTips && data.budget.savingTips.length > 0 && (
                    <>
                      <div className="h-px bg-green-200 my-4" />
                      <h4 className="text-sm font-bold text-gray-900 mb-2">💡 Saving Tips</h4>
                      <ul className="space-y-1">
                        {data.budget.savingTips.map((tip: string, idx: number) => (
                          <li key={idx} className="text-xs text-gray-700">{tip}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}

              {/* Bookings Card */}
              {(data.accommodations?.length || data.flights?.length) && (
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Your Bookings</h3>
                  <div className="space-y-3">
                    {data.accommodations?.map((acc, idx) => (
                      <a
                        key={`acc-${idx}`}
                        href={acc.bookingUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-100"
                      >
                        <Building className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
                        <div>
                          <p className="font-semibold text-gray-900">{acc.name}</p>
                          <p className="text-sm text-gray-600">{acc.location}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {acc.checkIn} to {acc.checkOut} ({acc.nights} {acc.nights === 1 ? 'night' : 'nights'})
                          </p>
                        </div>
                      </a>
                    ))}
                    {data.flights?.map((flight, idx) => (
                      <div
                        key={`fly-${idx}`}
                        className="flex items-start gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors border border-purple-100"
                      >
                        <Plane className="text-purple-600 mt-0.5 flex-shrink-0" size={20} />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{flight.route}</p>
                          <p className="text-sm text-gray-600">{flight.date}</p>
                          <p className="text-sm text-gray-600">{flight.estimatedCost}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {flight.airlines.join(", ")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Local Tips Card */}
              {data.localTips && (data.localTips.currency || data.localTips.safety || data.localTips.eventTips?.[0]) && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-xl p-6 border border-amber-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Local Tips</h3>
                  <div className="space-y-4">
                    {data.localTips.currency && (
                      <InfoChip icon={BadgeDollarSign} label="Currency" value={data.localTips.currency} />
                    )}
                    {data.localTips.safety && (
                      <InfoChip icon={ShieldCheck} label="Safety" value={data.localTips.safety} />
                    )}
                    {data.localTips.eventTips && data.localTips.eventTips.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <ClipboardList className="text-amber-600" size={18} />
                          <p className="text-xs text-gray-500 font-medium">Event Tips</p>
                        </div>
                        <ul className="space-y-1">
                          {data.localTips.eventTips.map((tip: string, idx: number) => (
                            <li key={idx} className="text-sm text-gray-700 ml-6">• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="w-full lg:w-2/3">
            <div className="space-y-6">
              {data.days.map((day) => {
                const isExpanded = expandedDays.has(day.day);
                
                return (
                  <div
                    key={day.day}
                    id={`day-${day.day}`}
                    className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transition-all"
                  >
                    {/* Day Header - Always Visible */}
                    <button
                      onClick={() => toggleDay(day.day)}
                      className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center font-bold text-xl shadow-lg">
                          {day.day}
                        </div>
                        <div className="text-left">
                          <h2 className="text-2xl font-bold text-gray-900">
                            Day {day.day}: {day.theme}
                          </h2>
                          <p className="text-gray-600">{day.date} • {day.city}</p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="text-gray-400" size={24} />
                      ) : (
                        <ChevronDown className="text-gray-400" size={24} />
                      )}
                    </button>

                    {/* Day Content - Collapsible */}
                    {isExpanded && (
                      <div className="px-6 pb-6 space-y-4 animate-fade-in">
                        
                        {/* Event Card */}
                        {day.event && day.event.hasEvent && (
                          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                              <Ticket className="text-red-600" size={22} />
                              <h3 className="text-xl font-bold text-red-700">{day.event.teams}</h3>
                            </div>
                            <p className="text-red-600 font-medium mb-2">
                              {day.event.venue} @ {day.event.startTime}
                            </p>
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Arrival:</strong> {day.event.arrivalTime}
                            </p>
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Pre-Event:</strong> {day.event.preEventActivities.join(", ")}
                            </p>
                            <p className="text-sm text-gray-600 italic">
                              {day.event.postEventPlan}
                            </p>
                          </div>
                        )}

                        {/* Morning */}
                        <ActivityCard
                          icon={Clock}
                          title="Morning"
                          data={day.morning}
                          color="yellow"
                        />

                        {/* Afternoon */}
                        <ActivityCard
                          icon={Clock}
                          title="Afternoon"
                          data={day.afternoon}
                          color="orange"
                        />

                        {/* Evening */}
                        <ActivityCard
                          icon={Clock}
                          title="Evening"
                          data={day.evening}
                          color="indigo"
                        />

                        {/* Meals */}
                        {day.mealsAndDining && day.mealsAndDining.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

                        {/* Day Tips */}
                        {day.tips && day.tips.length > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <h4 className="text-sm font-bold text-blue-900 mb-2">💡 Today's Tips</h4>
                            <ul className="space-y-1">
                              {day.tips.map((tip: string, idx: number) => (
                                <li key={idx} className="text-sm text-blue-800">• {tip}</li>
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
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

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

// Helper Components
function InfoChip({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: React.ElementType;
  label: string;
  value?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon className="text-gray-500 mt-1 flex-shrink-0" size={18} />
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
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
    yellow: "from-yellow-50 to-amber-50 border-yellow-200",
    orange: "from-orange-50 to-red-50 border-orange-200",
    indigo: "from-indigo-50 to-purple-50 border-indigo-200",
    green: "from-green-50 to-emerald-50 border-green-200",
    blue: "from-blue-50 to-cyan-50 border-blue-200"
  };

  const iconColors = {
    yellow: "text-yellow-600",
    orange: "text-orange-600",
    indigo: "text-indigo-600",
    green: "text-green-600",
    blue: "text-blue-600"
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} border rounded-xl p-5`}>
      <div className="flex items-center gap-3 mb-3">
        <Icon className={`${iconColors[color as keyof typeof iconColors]} flex-shrink-0`} size={20} />
        <h4 className="text-lg font-bold text-gray-900">{title}</h4>
      </div>
      {'activities' in data ? (
        <>
          <p className="text-gray-700 leading-relaxed mb-2">{data.activities}</p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            <span>📍 {data.location}</span>
            <span>🚗 {data.transportTime}</span>
            <span>💰 {data.cost}</span>
          </div>
        </>
      ) : (
        <p className="text-gray-700">
          <span className="font-semibold">{data.recommendation}</span>
          <span className="text-gray-500"> • {data.cuisine} • {data.priceRange}</span>
        </p>
      )}
    </div>
  );
}