import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Calendar,
  Clock,
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
  Activity,
  Sun,
  Sunset,
  Moon,
  Utensils,
  ArrowRight,
  Zap,
} from "lucide-react";

import type {
  ItineraryData,
  EventAnchor,
  TimeBlock,
  EventBlock,
  DayPlan,
} from "@/lib/mock-itinerary";

// ==================== EVENT CONFIG ====================

const EVENT_CONFIG = {
  sports: {
    icon: Trophy,
    accent: "#2563eb",
    accentLight: "#eff6ff",
    accentBorder: "#bfdbfe",
    label: "Sports Event",
    gradient: "from-blue-600 to-cyan-500",
    darkGradient: "from-blue-950 via-blue-900 to-slate-900",
  },
  music: {
    icon: Music,
    accent: "#9333ea",
    accentLight: "#faf5ff",
    accentBorder: "#e9d5ff",
    label: "Music Event",
    gradient: "from-purple-600 to-pink-500",
    darkGradient: "from-purple-950 via-purple-900 to-slate-900",
  },
  festivals: {
    icon: PartyPopper,
    accent: "#ea580c",
    accentLight: "#fff7ed",
    accentBorder: "#fed7aa",
    label: "Festival",
    gradient: "from-orange-500 to-rose-500",
    darkGradient: "from-orange-950 via-red-900 to-slate-900",
  },
  other: {
    icon: Sparkles,
    accent: "#475569",
    accentLight: "#f8fafc",
    accentBorder: "#e2e8f0",
    label: "Event",
    gradient: "from-slate-600 to-slate-500",
    darkGradient: "from-slate-900 via-slate-800 to-slate-900",
  },
};

const TIME_ICONS = { Morning: Sun, Afternoon: Sunset, Evening: Moon };

// ==================== MAIN COMPONENT ====================

export default function ItineraryView({ data }: { data?: ItineraryData }) {
  const [selectedDay, setSelectedDay] = useState(1);

  if (!data?.days?.length) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto">
            <MapPin className="text-gray-400" size={28} />
          </div>
          <p className="text-gray-500 font-medium">Select an event to see your itinerary</p>
        </div>
      </div>
    );
  }

  const cfg = data.eventAnchor
    ? EVENT_CONFIG[data.eventAnchor.eventType] ?? EVENT_CONFIG.other
    : EVENT_CONFIG.other;

  const EventIcon = cfg.icon;
  const currentDay = data.days[selectedDay - 1];

  return (
    <div className="space-y-8">

      {/* ==================== HERO HEADER ==================== */}
      {data.eventAnchor && (
        <div className="space-y-6">

          {/* Event badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold"
            style={{ background: cfg.accentLight, borderColor: cfg.accentBorder, color: cfg.accent }}
          >
            <EventIcon size={15} />
            {cfg.label}
          </div>

          {/* Title block */}
          <div>
            <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mb-2">Your trip to</p>
            <h1 className="text-4xl md:text-6xl font-black text-gray-950 tracking-tight leading-none mb-4">
              {data.eventAnchor.eventName}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-gray-400" />
                {data.eventAnchor.venue}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-gray-400" />
                {new Date(data.eventAnchor.eventDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          <p className="text-base text-gray-500 max-w-2xl leading-relaxed">{data.overview}</p>

          {/* Phase stats */}
          {data.tripSummary.eventPhases && (
            <div className="flex items-center gap-0 border border-gray-200 rounded-2xl overflow-hidden w-fit">
              <div className="px-6 py-4 border-r border-gray-200">
                <div className="text-2xl font-black text-gray-900">{data.tripSummary.eventPhases.preEvent}</div>
                <div className="text-xs text-gray-400 font-medium mt-0.5">days before</div>
              </div>
              <div className="px-6 py-4 border-r border-gray-200" style={{ background: cfg.accentLight }}>
                <div className="text-2xl font-black" style={{ color: cfg.accent }}>1</div>
                <div className="text-xs font-bold uppercase tracking-wider mt-0.5" style={{ color: cfg.accent }}>Event Day</div>
              </div>
              <div className="px-6 py-4 border-r border-gray-200">
                <div className="text-2xl font-black text-gray-900">{data.tripSummary.eventPhases.postEvent}</div>
                <div className="text-xs text-gray-400 font-medium mt-0.5">days after</div>
              </div>
              <div className="px-6 py-4">
                <div className="text-2xl font-black text-gray-900">
                  {data.budget.totalBudget.replace("USD ", "").replace("$", "")}
                </div>
                <div className="text-xs text-gray-400 font-medium mt-0.5">est. total</div>
              </div>
            </div>
          )}

          {/* Budget breakdown */}
          {data.budget.breakdown && <BudgetCard budget={data.budget} cfg={cfg} />}
        </div>
      )}

      {/* No event anchor fallback header */}
      {!data.eventAnchor && (
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-gray-950 tracking-tight">
            {data.tripSummary?.cities?.[0] || "Your Trip"}
          </h1>
          <p className="text-gray-500 leading-relaxed">{data.overview}</p>
          <div className="flex gap-6 pt-2 text-sm">
            <div><span className="text-2xl font-black text-gray-900">{data.tripSummary.totalDays}</span><p className="text-gray-400">days</p></div>
            <div><span className="text-2xl font-black text-gray-900">{data.budget.totalBudget.replace("USD ", "")}</span><p className="text-gray-400">budget</p></div>
          </div>
        </div>
      )}

      {/* ==================== DAY SELECTOR ==================== */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-2 w-max md:w-auto">
          {data.days.map((day: DayPlan) => {
            const isSelected = selectedDay === day.day;
            const isEvent = day.isEventDay;
            return (
              <button
                key={day.day}
                onClick={() => setSelectedDay(day.day)}
                className={`
                  relative flex flex-col items-center px-5 py-3 rounded-2xl transition-all duration-200 min-w-[100px]
                  ${isSelected
                    ? isEvent
                      ? `bg-gradient-to-br ${cfg.darkGradient} text-white shadow-xl scale-[1.03]`
                      : "bg-gray-950 text-white shadow-lg scale-[1.03]"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }
                `}
              >
                {isEvent && (
                  <span className={`absolute -top-2 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r ${cfg.gradient} text-white shadow`}>
                    EVENT
                  </span>
                )}
                <span className="text-xs font-semibold opacity-70 mt-1">
                  {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span className="text-sm font-bold mt-0.5">{day.label || `Day ${day.day}`}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================== DAY CONTENT ==================== */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDay}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          {/* Day title */}
          <div
            className={`rounded-3xl p-6 ${
              currentDay.isEventDay
                ? `bg-gradient-to-br ${cfg.darkGradient} text-white`
                : "bg-gray-50 border border-gray-100"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                {currentDay.isEventDay && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-black uppercase tracking-widest bg-gradient-to-r ${cfg.gradient} bg-clip-text text-transparent`}>
                      ★ Main Event
                    </span>
                  </div>
                )}
                <h2 className={`text-2xl font-black tracking-tight ${currentDay.isEventDay ? "text-white" : "text-gray-950"}`}>
                  {currentDay.theme}
                </h2>
                <div className={`flex flex-wrap items-center gap-3 mt-2 text-sm ${currentDay.isEventDay ? "text-white/60" : "text-gray-400"}`}>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    {currentDay.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} />
                    {currentDay.city}
                  </span>
                </div>
              </div>
              {currentDay.isEventDay && (
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}
                >
                  <EventIcon size={22} className="text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-[27px] top-10 bottom-10 w-px bg-gradient-to-b from-gray-200 via-gray-200 to-transparent hidden md:block" />

            <div className="space-y-3">
              {[
                { period: "Morning" as const, data: currentDay.morning },
                { period: "Afternoon" as const, data: currentDay.afternoon },
                { period: "Evening" as const, data: currentDay.evening },
              ].map(({ period, data: blockData }) => (
                <TimeBlockCard
                  key={period}
                  period={period}
                  data={blockData}
                  isEventDay={currentDay.isEventDay}
                  cfg={cfg}
                />
              ))}
            </div>
          </div>

          {/* Dining */}
          {currentDay.mealsAndDining && currentDay.mealsAndDining.length > 0 && (
            <div className="rounded-3xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <UtensilsCrossed size={16} className="text-gray-400" />
                <span className="font-bold text-gray-900 text-sm">Where to eat</span>
              </div>
              <div className="divide-y divide-gray-50">
                {currentDay.mealsAndDining.map((meal, i) => (
                  <div key={i} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{meal.meal}</span>
                      <p className="font-semibold text-gray-900 mt-0.5">{meal.recommendation}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <MapPin size={11} />{meal.location}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-900 text-sm">{meal.priceRange}</p>
                      <button className="text-xs font-semibold flex items-center gap-1 mt-1" style={{ color: cfg.accent }}>
                        Reserve <ExternalLink size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {currentDay.tips && currentDay.tips.length > 0 && (
            <div
              className="rounded-3xl p-6 space-y-3"
              style={{ background: cfg.accentLight, border: `1px solid ${cfg.accentBorder}` }}
            >
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: cfg.accent }}>
                {currentDay.isEventDay ? "★ Event Day Tips" : "Tips for today"}
              </p>
              <ul className="space-y-2">
                {currentDay.tips.map((tip, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-700">
                    <span className="font-black mt-0.5 flex-shrink-0" style={{ color: cfg.accent }}>—</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Day cost footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-sm text-gray-400 font-medium">
              {currentDay.isEventDay ? "Today's total (incl. event)" : "Today's total"}
            </span>
            <span className="text-2xl font-black text-gray-950">
              {currentDay.isEventDay && data.budget.eventDayCost
                ? data.budget.eventDayCost
                : data.budget.dailyAverage}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ==================== TIME BLOCK CARD ====================

function TimeBlockCard({
  period,
  data,
  isEventDay,
  cfg,
}: {
  period: "Morning" | "Afternoon" | "Evening";
  data: TimeBlock | EventBlock;
  isEventDay: boolean;
  cfg: (typeof EVENT_CONFIG)[keyof typeof EVENT_CONFIG];
}) {
  const isEventBlock = "isEventBlock" in data && data.isEventBlock;
  const eventDetails = "eventDetails" in data ? data.eventDetails : null;
  const PeriodIcon = TIME_ICONS[period];

  if (isEventBlock) {
    // ---- EVENT BLOCK — special premium treatment ----
    return (
      <div className={`rounded-3xl p-6 bg-gradient-to-br ${cfg.darkGradient} text-white shadow-2xl relative overflow-hidden`}>
        {/* Decorative glow */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 70% 50%, ${cfg.accent}, transparent 70%)`,
          }}
        />

        <div className="relative z-10 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Star size={14} className="fill-current text-yellow-400" />
                <span className="text-xs font-black uppercase tracking-widest text-white/50">The Main Event</span>
              </div>
              <h3 className="text-xl font-black text-white">{period}</h3>
              <div className="flex items-center gap-1.5 text-white/50 text-xs mt-1">
                <Clock size={12} />
                {data.time}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-white">{data.cost}</div>
              <div className="text-xs text-white/40 mt-0.5">incl. ticket</div>
            </div>
          </div>

          <p className="text-white/80 text-sm leading-relaxed">{data.activities}</p>

          {eventDetails && (
            <div className="grid grid-cols-3 gap-3">
              {eventDetails.doors && (
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-white/40 text-xs font-medium">Doors</p>
                  <p className="text-white font-bold text-sm mt-0.5">{eventDetails.doors}</p>
                </div>
              )}
              {eventDetails.startTime && (
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-white/40 text-xs font-medium">Kickoff</p>
                  <p className="text-white font-bold text-sm mt-0.5">{eventDetails.startTime}</p>
                </div>
              )}
              {eventDetails.duration && (
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-white/40 text-xs font-medium">Duration</p>
                  <p className="text-white font-bold text-sm mt-0.5">{eventDetails.duration}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-white/50 text-xs">
              <MapPin size={12} />
              {data.location}
            </div>
            <div className="flex gap-2">
              {eventDetails?.ticketUrl && (
                <button className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r ${cfg.gradient} text-white shadow-lg`}>
                  <Ticket size={13} />
                  Tickets
                </button>
              )}
              <button className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
                <Navigation size={13} />
                Navigate
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- REGULAR TIME BLOCK ----
  return (
    <div className="group flex gap-4 md:gap-5">
      {/* Period indicator */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className={`w-[54px] h-[54px] rounded-2xl flex items-center justify-center transition-all ${
            isEventDay
              ? `bg-gradient-to-br ${cfg.gradient} text-white shadow-md`
              : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
          }`}
        >
          <PeriodIcon size={20} />
        </div>
      </div>

      {/* Content card */}
      <div className="flex-1 bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-200">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-bold text-gray-950">{period}</h3>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
              <Clock size={11} />
              {data.time}
            </div>
          </div>
          <span className="text-lg font-black text-gray-900 flex-shrink-0">{data.cost}</span>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-4">{data.activities}</p>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
            <MapPin size={11} />
            {data.location}
          </div>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all hover:shadow-sm"
              style={{ background: cfg.accentLight, color: cfg.accent }}
            >
              <ShoppingBag size={12} />
              Book
            </button>
            <button className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
              <Navigation size={12} />
              Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== BUDGET CARD ====================

function BudgetCard({
  budget,
  cfg,
}: {
  budget: ItineraryData["budget"];
  cfg: (typeof EVENT_CONFIG)[keyof typeof EVENT_CONFIG];
}) {
  if (!budget.breakdown) return null;

  const items = [
    { icon: Hotel,   label: "Accommodation", value: budget.breakdown.accommodation },
    { icon: Plane,   label: "Transport",      value: budget.breakdown.transport },
    { icon: Utensils,label: "Food",           value: budget.breakdown.food },
    { icon: Ticket,  label: "Event",          value: budget.breakdown.event,  isEvent: true },
    { icon: Activity,label: "Activities",     value: budget.breakdown.activities },
  ];

  return (
    <div className="rounded-3xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <span className="font-bold text-gray-900 text-sm">Budget Breakdown</span>
        <span className="text-xs text-gray-400 font-medium">{budget.dailyAverage} avg/day</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-gray-100">
        {items.map(({ icon: Icon, label, value, isEvent }) => (
          <div
            key={label}
            className="px-5 py-4"
            style={isEvent ? { background: cfg.accentLight } : {}}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon
                size={14}
                style={{ color: isEvent ? cfg.accent : undefined }}
                className={!isEvent ? "text-gray-400" : ""}
              />
              <span className="text-xs text-gray-400 font-medium">{label}</span>
            </div>
            <div
              className="text-lg font-black"
              style={{ color: isEvent ? cfg.accent : undefined }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}