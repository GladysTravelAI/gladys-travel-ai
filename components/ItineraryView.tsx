"use client";

import { useState } from "react";
import {
  Download, Share2, MapPin, CalendarDays, Users, Flag, Building, Plane,
  BadgeDollarSign, ShieldCheck, Clock, Utensils, Ticket, Coffee, Sun, Moon,
  ChevronDown, ChevronUp, Star, TrendingUp, Camera, Map
} from "lucide-react";

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

interface DayPlan {
  day: number;
  date: string;
  city: string;
  theme: string;
  morning: ActivityBlock;
  afternoon: ActivityBlock;
  evening: ActivityBlock;
  mealsAndDining?: Meal[];
  transportation?: {
    method: string;
    totalTime: string;
    totalCost: string;
  };
  tips?: string[];
}

interface ItineraryData {
  overview: string;
  tripSummary: {
    totalDays: number;
    cities: string[];
    highlights?: string[];
  };
  budget: {
    totalBudget: string;
    dailyAverage: string;
  };
  days: DayPlan[];
  accommodations?: any[];
  metadata?: any;
}

export default function ItineraryView({ data }: { data?: ItineraryData }) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1]));

  if (!data || !data.days || data.days.length === 0) {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <MapPin className="text-gray-400" size={40} />
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Itinerary Yet</h3>
          <p className="text-gray-600">Generate your trip to see your personalized itinerary</p>
        </div>
      </div>
    );
  }

  const totalDays = data.days.length;
  const firstCity = data.tripSummary?.cities?.[0] || 'Your Destination';

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
      {/* Luxurious Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 md:p-12">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <MapPin className="text-white" size={28} />
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium">Your Journey To</p>
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                {firstCity}
              </h1>
            </div>
          </div>
          
          <p className="text-white/90 text-lg mb-6 max-w-2xl leading-relaxed">
            {data.overview}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard icon={CalendarDays} label="Duration" value={`${totalDays} Days`} />
            <StatCard icon={Users} label="Travelers" value={data.metadata?.groupSize || "1"} />
            <StatCard icon={BadgeDollarSign} label="Budget" value={data.budget?.totalBudget || "N/A"} />
            <StatCard icon={Star} label="Highlights" value={data.tripSummary?.highlights?.length || "5+"} />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button className="px-6 py-3 bg-white text-purple-600 rounded-2xl font-semibold hover:bg-white/90 transition-all shadow-lg flex items-center gap-2">
              <Download size={20} />
              Export PDF
            </button>
            <button className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-2xl font-semibold hover:bg-white/30 transition-all flex items-center gap-2">
              <Share2 size={20} />
              Share Trip
            </button>
          </div>
        </div>
      </div>

      {/* Highlights Section */}
      {data.tripSummary?.highlights && data.tripSummary.highlights.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border border-amber-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="text-amber-600" size={28} />
            Trip Highlights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.tripSummary.highlights.map((highlight: string, idx: number) => (
              <div key={idx} className="flex items-start gap-3 bg-white rounded-2xl p-4 border border-amber-100">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Star className="text-amber-600" size={16} />
                </div>
                <p className="text-gray-700 font-medium">{highlight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day-by-Day Timeline */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarDays className="text-purple-600" size={28} />
          Day-by-Day Itinerary
        </h2>

        {data.days.map((day) => {
          const isExpanded = expandedDays.has(day.day);

          return (
            <div
              key={day.day}
              className="bg-white rounded-3xl border-2 border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Day Header - Always Visible */}
              <button
                onClick={() => toggleDay(day.day)}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold">{day.day}</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {day.theme}
                    </h3>
                    <p className="text-gray-500 text-sm">{day.date} • {day.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 hidden md:inline">
                    {isExpanded ? 'Hide Details' : 'View Details'}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="text-gray-400" size={24} />
                  ) : (
                    <ChevronDown className="text-gray-400" size={24} />
                  )}
                </div>
              </button>

              {/* Day Content - Expandable */}
              {isExpanded && (
                <div className="px-6 pb-6 space-y-4 border-t border-gray-100">
                  
                  {/* Morning */}
                  <TimeBlock
                    icon={Coffee}
                    title="Morning"
                    time={day.morning.time}
                    activities={day.morning.activities}
                    location={day.morning.location}
                    cost={day.morning.cost}
                    color="from-yellow-400 to-orange-400"
                    bgColor="bg-gradient-to-br from-yellow-50 to-orange-50"
                    borderColor="border-yellow-200"
                  />

                  {/* Afternoon */}
                  <TimeBlock
                    icon={Sun}
                    title="Afternoon"
                    time={day.afternoon.time}
                    activities={day.afternoon.activities}
                    location={day.afternoon.location}
                    cost={day.afternoon.cost}
                    color="from-orange-400 to-red-400"
                    bgColor="bg-gradient-to-br from-orange-50 to-red-50"
                    borderColor="border-orange-200"
                  />

                  {/* Evening */}
                  <TimeBlock
                    icon={Moon}
                    title="Evening"
                    time={day.evening.time}
                    activities={day.evening.activities}
                    location={day.evening.location}
                    cost={day.evening.cost}
                    color="from-indigo-400 to-purple-400"
                    bgColor="bg-gradient-to-br from-indigo-50 to-purple-50"
                    borderColor="border-indigo-200"
                  />

                  {/* Dining */}
                  {day.mealsAndDining && day.mealsAndDining.length > 0 && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200">
                      <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Utensils className="text-green-600" size={20} />
                        Where to Eat
                      </h4>
                      <div className="space-y-3">
                        {day.mealsAndDining.map((meal, idx) => (
                          <div key={idx} className="bg-white rounded-xl p-4 border border-green-100">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-bold text-gray-900">{meal.meal}</p>
                                <p className="text-sm text-gray-600">{meal.cuisine}</p>
                              </div>
                              <span className="text-sm font-semibold text-green-600">{meal.priceRange}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 mb-1">{meal.recommendation}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin size={12} />
                              {meal.location}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tips */}
                  {day.tips && day.tips.length > 0 && (
                    <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200">
                      <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Camera className="text-blue-600" size={20} />
                        Insider Tips
                      </h4>
                      <ul className="space-y-2">
                        {day.tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{tip}</span>
                          </li>
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
        <div className="bg-white rounded-3xl p-6 border-2 border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building className="text-purple-600" size={28} />
            Where to Stay
          </h2>
          <div className="space-y-3">
            {data.accommodations.map((acc, idx) => (
              <div key={idx} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{acc.name}</h3>
                    <p className="text-sm text-gray-600">{acc.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">{acc.priceRange?.total}</p>
                    <p className="text-xs text-gray-500">{acc.nights} nights</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-3">{acc.description}</p>
                <a
                  href={acc.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                >
                  View & Book
                  <Plane size={16} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="text-white/80" size={18} />
        <p className="text-white/80 text-xs font-medium">{label}</p>
      </div>
      <p className="text-white text-xl font-bold">{value}</p>
    </div>
  );
}

function TimeBlock({
  icon: Icon,
  title,
  time,
  activities,
  location,
  cost,
  color,
  bgColor,
  borderColor
}: {
  icon: any;
  title: string;
  time: string;
  activities: string;
  location: string;
  cost: string;
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <div className={`${bgColor} rounded-2xl p-5 border ${borderColor}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
            <Icon className="text-white" size={20} />
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-900">{title}</h4>
            <p className="text-xs text-gray-600">{time}</p>
          </div>
        </div>
        <span className="text-lg font-bold text-gray-900">{cost}</span>
      </div>
      <p className="text-gray-800 leading-relaxed mb-3">{activities}</p>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <MapPin size={14} />
        <span>{location}</span>
      </div>
    </div>
  );
}