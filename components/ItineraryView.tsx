import { useState } from "react";
import { MapPin, Calendar, Clock, DollarSign, ChevronRight } from "lucide-react";

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
}

export default function ItineraryView({ data }: { data?: ItineraryData }) {
  const [selectedDay, setSelectedDay] = useState(1);

  if (!data || !data.days || data.days.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan your trip</h3>
          <p className="text-gray-600">Search for a destination to see your itinerary</p>
        </div>
      </div>
    );
  }

  const currentDay = data.days[selectedDay - 1];
  const firstCity = data.tripSummary?.cities?.[0] || 'Your Destination';

  return (
    <div className="space-y-8">
      
      {/* Clean Header */}
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Your trip to</p>
          <h1 className="text-4xl font-bold text-gray-900">{firstCity}</h1>
        </div>
        
        <p className="text-lg text-gray-600 max-w-2xl">
          {data.overview}
        </p>

        {/* Simple Stats */}
        <div className="flex gap-8 pt-4">
          <div>
            <div className="text-3xl font-bold text-gray-900">{data.tripSummary.totalDays}</div>
            <div className="text-sm text-gray-500">days</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{data.budget.totalBudget.replace('USD', '$')}</div>
            <div className="text-sm text-gray-500">estimated budget</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{data.tripSummary.cities.length}</div>
            <div className="text-sm text-gray-500">{data.tripSummary.cities.length === 1 ? 'city' : 'cities'}</div>
          </div>
        </div>
      </div>

      {/* Day Selector - Simple Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6 overflow-x-auto scrollbar-hide">
          {data.days.map((day) => (
            <button
              key={day.day}
              onClick={() => setSelectedDay(day.day)}
              className={`pb-4 px-2 border-b-2 transition-all whitespace-nowrap ${
                selectedDay === day.day
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Day {day.day}
            </button>
          ))}
        </div>
      </div>

      {/* Current Day Content */}
      <div className="space-y-6">
        
        {/* Day Header */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">{currentDay.theme}</h2>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar size={16} />
              <span>{currentDay.date}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin size={16} />
              <span>{currentDay.city}</span>
            </div>
          </div>
        </div>

        {/* Timeline - Clean Cards */}
        <div className="space-y-4">
          
          {/* Morning */}
          <TimeBlock
            period="Morning"
            time={currentDay.morning.time}
            activities={currentDay.morning.activities}
            location={currentDay.morning.location}
            cost={currentDay.morning.cost}
          />

          {/* Afternoon */}
          <TimeBlock
            period="Afternoon"
            time={currentDay.afternoon.time}
            activities={currentDay.afternoon.activities}
            location={currentDay.afternoon.location}
            cost={currentDay.afternoon.cost}
          />

          {/* Evening */}
          <TimeBlock
            period="Evening"
            time={currentDay.evening.time}
            activities={currentDay.evening.activities}
            location={currentDay.evening.location}
            cost={currentDay.evening.cost}
          />
        </div>

        {/* Dining Recommendations */}
        {currentDay.mealsAndDining && currentDay.mealsAndDining.length > 0 && (
          <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-gray-900">Where to eat</h3>
            <div className="space-y-3">
              {currentDay.mealsAndDining.map((meal, i) => (
                <div key={i} className="bg-white rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-gray-900">{meal.meal}</div>
                      <div className="text-sm text-gray-600">{meal.recommendation}</div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{meal.priceRange}</div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin size={12} />
                    <span>{meal.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {currentDay.tips && currentDay.tips.length > 0 && (
          <div className="bg-blue-50 rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-gray-900">Tips for today</h3>
            <ul className="space-y-2">
              {currentDay.tips.map((tip, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Daily Budget Summary */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Today's total</span>
            <span className="text-2xl font-bold text-gray-900">{data.budget.dailyAverage}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimeBlock({ period, time, activities, location, cost }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{period}</h3>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Clock size={14} />
            <span>{time}</span>
          </div>
        </div>
        <div className="text-xl font-bold text-gray-900">{cost}</div>
      </div>
      
      <p className="text-gray-700 mb-4 leading-relaxed">{activities}</p>
      
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin size={14} />
          <span>{location}</span>
        </div>
        <button className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
          Navigate
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}