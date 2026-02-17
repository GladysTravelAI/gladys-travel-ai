import { useState } from "react";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  ChevronRight,
  Trophy,
  Music,
  PartyPopper,
  Sparkles,
  ExternalLink,
  Navigation,
  Star,
  Ticket,
  ShoppingBag,
  UtensilsCrossed,
  Hotel,
  Plane,
  Activity
} from "lucide-react";

// ==================== STRATEGIC: Single Source of Truth ====================
import type {
  ItineraryData,
  EventAnchor,
  TimeBlock,
  EventBlock,
  DayPlan
} from "@/lib/mock-itinerary";

// ==================== EVENT TYPE ICONS ====================

const EVENT_TYPE_CONFIG = {
  sports: {
    icon: Trophy,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    label: 'Sports Event'
  },
  music: {
    icon: Music,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    label: 'Music Event'
  },
  festivals: {
    icon: PartyPopper,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    label: 'Festival'
  },
  other: {
    icon: Sparkles,
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    label: 'Event'
  }
};

// ==================== MAIN COMPONENT ====================

export default function ItineraryView({ data }: { data?: ItineraryData }) {
  const [selectedDay, setSelectedDay] = useState(1);

  if (!data || !data.days || data.days.length === 0) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <div className="text-center">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan your event trip</h3>
          <p className="text-gray-600">Select an event to see your personalized itinerary</p>
        </div>
      </div>
    );
  }

  const currentDay = data.days[selectedDay - 1];
  const hasEventAnchor = !!data.eventAnchor;
  const eventConfig = data.eventAnchor ? EVENT_TYPE_CONFIG[data.eventAnchor.eventType] : null;
  const EventIcon = eventConfig?.icon;

  return (
    <div className="space-y-6 md:space-y-8 px-4 md:px-0">
      
      {/* ==================== EVENT-FIRST HEADER ==================== */}
      
      {hasEventAnchor && data.eventAnchor ? (
        <div className="space-y-4 md:space-y-6">
          {/* Event Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${eventConfig?.bg} ${eventConfig?.border} border-2`}>
            {EventIcon && <EventIcon size={18} className={eventConfig?.color} />}
            <span className={`font-semibold text-sm ${eventConfig?.color}`}>
              {eventConfig?.label}
            </span>
          </div>

          {/* Event Title */}
          <div>
            <p className="text-sm text-gray-500 mb-2">Your trip to</p>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-2">
              {data.eventAnchor.eventName}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm md:text-base text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin size={16} />
                <span>{data.eventAnchor.venue}</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>{new Date(data.eventAnchor.eventDate).toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}</span>
              </div>
            </div>
          </div>

          {/* Overview */}
          <p className="text-base md:text-lg text-gray-600 max-w-2xl leading-relaxed">
            {data.overview}
          </p>

          {/* Event-Focused Stats */}
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-4 md:gap-8 pt-4">
            {data.tripSummary.eventPhases && (
              <>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-gray-900">
                    {data.tripSummary.eventPhases.preEvent}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">days before event</div>
                </div>
                <div className={`${eventConfig?.color}`}>
                  <div className="text-2xl md:text-3xl font-bold">
                    {data.tripSummary.eventPhases.eventDay}
                  </div>
                  <div className="text-xs md:text-sm">EVENT DAY</div>
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-bold text-gray-900">
                    {data.tripSummary.eventPhases.postEvent}
                  </div>
                  <div className="text-xs md:text-sm text-gray-500">days after event</div>
                </div>
              </>
            )}
            <div className="sm:ml-auto col-span-2 sm:col-span-1">
              <div className="text-2xl md:text-3xl font-bold text-gray-900">
                {data.budget.totalBudget.replace('USD', '').trim()}
              </div>
              <div className="text-xs md:text-sm text-gray-500">estimated total</div>
            </div>
          </div>

          {/* Budget Breakdown */}
          {data.budget.breakdown && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 md:p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign size={20} />
                Budget Breakdown
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                <div className="bg-white rounded-xl p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Hotel size={16} className="text-gray-400" />
                    <span className="text-xs text-gray-500">Accommodation</span>
                  </div>
                  <div className="text-lg md:text-xl font-bold text-gray-900">
                    {data.budget.breakdown.accommodation}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Plane size={16} className="text-gray-400" />
                    <span className="text-xs text-gray-500">Transport</span>
                  </div>
                  <div className="text-lg md:text-xl font-bold text-gray-900">
                    {data.budget.breakdown.transport}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <UtensilsCrossed size={16} className="text-gray-400" />
                    <span className="text-xs text-gray-500">Food</span>
                  </div>
                  <div className="text-lg md:text-xl font-bold text-gray-900">
                    {data.budget.breakdown.food}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Ticket size={16} className={eventConfig?.color} />
                    <span className="text-xs text-gray-500">Event</span>
                  </div>
                  <div className={`text-lg md:text-xl font-bold ${eventConfig?.color}`}>
                    {data.budget.breakdown.event}
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity size={16} className="text-gray-400" />
                    <span className="text-xs text-gray-500">Activities</span>
                  </div>
                  <div className="text-lg md:text-xl font-bold text-gray-900">
                    {data.budget.breakdown.activities}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // FALLBACK: Generic Header (when no event)
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Your trip to</p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {data.tripSummary?.cities?.[0] || 'Your Destination'}
            </h1>
          </div>
          
          <p className="text-base md:text-lg text-gray-600 max-w-2xl">
            {data.overview}
          </p>

          <div className="flex flex-wrap gap-4 md:gap-8 pt-4">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">{data.tripSummary.totalDays}</div>
              <div className="text-xs md:text-sm text-gray-500">days</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">
                {data.budget.totalBudget.replace('USD', '$')}
              </div>
              <div className="text-xs md:text-sm text-gray-500">estimated budget</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">{data.tripSummary.cities.length}</div>
              <div className="text-xs md:text-sm text-gray-500">
                {data.tripSummary.cities.length === 1 ? 'city' : 'cities'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DAY SELECTOR ==================== */}
      
      <div className="border-b border-gray-200 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-2 md:gap-4 overflow-x-auto scrollbar-hide pb-2">
          {data.days.map((day: DayPlan) => {
            const isSelected = selectedDay === day.day;
            const isEventDay = day.isEventDay;
            
            return (
              <button
                key={day.day}
                onClick={() => setSelectedDay(day.day)}
                className={`
                  relative pb-4 px-3 md:px-4 border-b-2 transition-all whitespace-nowrap min-w-[100px] md:min-w-[120px]
                  ${isSelected
                    ? isEventDay
                      ? `${eventConfig?.color} border-current font-bold`
                      : 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                  }
                `}
              >
                {isEventDay && (
                  <div className={`absolute -top-2 left-1/2 -translate-x-1/2 ${eventConfig?.bg} ${eventConfig?.color} px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
                    <Sparkles size={12} />
                    EVENT
                  </div>
                )}
                
                <div className="text-xs md:text-sm font-semibold">
                  {day.label || `Day ${day.day}`}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================== CURRENT DAY CONTENT ==================== */}
      
      <div className="space-y-4 md:space-y-6">
        
        {/* Day Header */}
        <div className={`space-y-2 p-4 md:p-6 rounded-2xl ${currentDay.isEventDay ? `${eventConfig?.bg} ${eventConfig?.border} border-2` : 'bg-white'}`}>
          <h2 className={`text-2xl md:text-3xl font-bold ${currentDay.isEventDay ? eventConfig?.color : 'text-gray-900'}`}>
            {currentDay.isEventDay && (
              <span className="inline-flex items-center gap-2 mb-2">
                <Star className="fill-current" size={24} />
                MAIN EVENT
              </span>
            )}
            <div>{currentDay.theme}</div>
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar size={16} />
              <span>{currentDay.date}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin size={16} />
              <span>{currentDay.city}</span>
            </div>
            {currentDay.isEventDay && (
              <div className={`flex items-center gap-1 ${eventConfig?.color} font-semibold`}>
                <Sparkles size={16} />
                <span>Event Day</span>
              </div>
            )}
          </div>
        </div>

        {/* Timeline - Morning / Afternoon / Evening */}
        <div className="space-y-3 md:space-y-4">
          
          <TimeBlockComponent
            period="Morning"
            data={currentDay.morning}
            isEventDay={currentDay.isEventDay}
            eventConfig={eventConfig}
          />

          <TimeBlockComponent
            period="Afternoon"
            data={currentDay.afternoon}
            isEventDay={currentDay.isEventDay}
            eventConfig={eventConfig}
          />

          <TimeBlockComponent
            period="Evening"
            data={currentDay.evening}
            isEventDay={currentDay.isEventDay}
            eventConfig={eventConfig}
          />
        </div>

        {/* Dining Recommendations */}
        {currentDay.mealsAndDining && currentDay.mealsAndDining.length > 0 && (
          <div className="bg-gray-50 rounded-2xl p-4 md:p-6 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <UtensilsCrossed size={20} />
              Where to eat
            </h3>
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={12} />
                      <span>{meal.location}</span>
                    </div>
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                      Reserve Table <ExternalLink size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {currentDay.tips && currentDay.tips.length > 0 && (
          <div className={`${currentDay.isEventDay ? eventConfig?.bg : 'bg-blue-50'} rounded-2xl p-4 md:p-6 space-y-3`}>
            <h3 className="font-bold text-gray-900">
              {currentDay.isEventDay ? '🎯 Event Day Tips' : 'Tips for today'}
            </h3>
            <ul className="space-y-2">
              {currentDay.tips.map((tip, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className={currentDay.isEventDay ? eventConfig?.color : 'text-blue-600'}>•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Daily Budget Summary */}
        <div className="border-t pt-4 md:pt-6">
          <div className="flex justify-between items-center">
            <span className="text-sm md:text-base text-gray-600">
              {currentDay.isEventDay ? "Today's total (including event)" : "Today's total"}
            </span>
            <span className="text-xl md:text-2xl font-bold text-gray-900">
              {currentDay.isEventDay && data.budget.eventDayCost
                ? data.budget.eventDayCost
                : data.budget.dailyAverage}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== TIME BLOCK COMPONENT ====================

function TimeBlockComponent({ 
  period, 
  data, 
  isEventDay,
  eventConfig 
}: { 
  period: string; 
  data: TimeBlock | EventBlock;
  isEventDay: boolean;
  eventConfig: any;
}) {
  const isEventBlock = 'isEventBlock' in data && data.isEventBlock;
  const eventDetails = 'eventDetails' in data ? data.eventDetails : null;

  return (
    <div className={`
      border-2 rounded-2xl p-4 md:p-6 transition-all
      ${isEventBlock 
        ? `${eventConfig?.bg} ${eventConfig?.border} shadow-lg` 
        : 'bg-white border-gray-200 hover:border-gray-300'
      }
    `}>
      {isEventBlock && (
        <div className={`flex items-center gap-2 mb-4 ${eventConfig?.color}`}>
          <Star className="fill-current animate-pulse" size={20} />
          <span className="font-bold text-base md:text-lg">THE MAIN EVENT</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
        <div className="flex-1">
          <h3 className={`text-base md:text-lg font-bold mb-1 ${isEventBlock ? eventConfig?.color : 'text-gray-900'}`}>
            {period}
          </h3>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Clock size={14} />
            <span>{data.time}</span>
          </div>
          
          {isEventBlock && eventDetails && (
            <div className="mt-3 space-y-1 text-xs md:text-sm text-gray-600 bg-white/50 rounded-lg p-3">
              {eventDetails.doors && <div className="flex items-center gap-2"><span className="font-semibold">Doors:</span> {eventDetails.doors}</div>}
              {eventDetails.startTime && <div className="flex items-center gap-2"><span className="font-semibold">Start:</span> {eventDetails.startTime}</div>}
              {eventDetails.duration && <div className="flex items-center gap-2"><span className="font-semibold">Duration:</span> {eventDetails.duration}</div>}
            </div>
          )}
        </div>
        <div className={`text-lg md:text-xl font-bold ${isEventBlock ? eventConfig?.color : 'text-gray-900'}`}>
          {data.cost}
        </div>
      </div>
      
      <p className="text-sm md:text-base text-gray-700 mb-4 leading-relaxed">
        {data.activities}
      </p>
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin size={14} />
          <span className="truncate">{data.location}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {isEventBlock && eventDetails?.ticketUrl && (
            <button className={`flex items-center gap-1 text-xs md:text-sm font-semibold ${eventConfig?.color} hover:underline px-3 py-2 rounded-lg ${eventConfig?.bg}`}>
              <Ticket size={16} />
              View Ticket Options
            </button>
          )}
          {!isEventBlock && (
            <button className="flex items-center gap-1 text-xs md:text-sm font-semibold text-blue-600 hover:text-blue-700 px-3 py-2 rounded-lg bg-blue-50">
              <ShoppingBag size={16} />
              Book Experience
            </button>
          )}
          <button className="flex items-center gap-1 text-xs md:text-sm font-semibold text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg bg-gray-100">
            <Navigation size={16} />
            Navigate
          </button>
        </div>
      </div>
    </div>
  );
}
