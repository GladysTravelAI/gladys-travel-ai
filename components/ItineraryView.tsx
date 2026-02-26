import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Calendar, Clock, Trophy, Music, PartyPopper, Sparkles,
  ExternalLink, Navigation, Star, Ticket, ShoppingBag, UtensilsCrossed,
  Hotel, Plane, Activity, Sun, Sunset, Moon, Utensils, Download,
} from "lucide-react";

import type { ItineraryData, TimeBlock, EventBlock, DayPlan } from "@/lib/mock-itinerary";

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const SKY        = '#0EA5E9';
const SKY_DARK   = '#0284C7';
const SKY_LIGHT  = '#F0F9FF';
const SKY_BORDER = '#BAE6FD';

// ── EVENT CONFIG ──────────────────────────────────────────────────────────────
const EVENT_CONFIG = {
  sports: {
    icon: Trophy,
    accent: SKY,
    accentLight: SKY_LIGHT,
    accentBorder: SKY_BORDER,
    label: 'Sports Event',
    heroGradient: 'linear-gradient(135deg, #0C4A6E, #0369A1, #0EA5E9)',
    pillGradient: 'linear-gradient(135deg, #38BDF8, #0284C7)',
  },
  music: {
    icon: Music,
    accent: '#8B5CF6',
    accentLight: '#F5F3FF',
    accentBorder: '#DDD6FE',
    label: 'Music Event',
    heroGradient: 'linear-gradient(135deg, #2E1065, #6D28D9, #8B5CF6)',
    pillGradient: 'linear-gradient(135deg, #A78BFA, #7C3AED)',
  },
  festivals: {
    icon: PartyPopper,
    accent: '#F97316',
    accentLight: '#FFF7ED',
    accentBorder: '#FED7AA',
    label: 'Festival',
    heroGradient: 'linear-gradient(135deg, #431407, #C2410C, #F97316)',
    pillGradient: 'linear-gradient(135deg, #FB923C, #EA580C)',
  },
  other: {
    icon: Sparkles,
    accent: SKY,
    accentLight: SKY_LIGHT,
    accentBorder: SKY_BORDER,
    label: 'Event',
    heroGradient: 'linear-gradient(135deg, #0C4A6E, #0369A1, #0EA5E9)',
    pillGradient: 'linear-gradient(135deg, #38BDF8, #0284C7)',
  },
};

const TIME_ICONS = { Morning: Sun, Afternoon: Sunset, Evening: Moon };

// ── HELPERS ───────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
}
function fmtShort(d: string) {
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch { return d; }
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ItineraryView({ data }: { data?: ItineraryData }) {
  const [selectedDay, setSelectedDay] = useState(1);

  if (!data?.days?.length) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: SKY_LIGHT }}>
            <MapPin style={{ color: SKY }} size={28} />
          </div>
          <p className="text-slate-500 font-semibold">Select an event to see your itinerary</p>
        </div>
      </div>
    );
  }

  const cfg = data.eventAnchor ? EVENT_CONFIG[data.eventAnchor.eventType] ?? EVENT_CONFIG.other : EVENT_CONFIG.other;
  const EventIcon = cfg.icon;
  const currentDay = data.days[selectedDay - 1];

  return (
    <div className="space-y-8" style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO HEADER
      ═══════════════════════════════════════════════════════════════════════ */}
      {data.eventAnchor && (
        <div className="space-y-6">
          {/* Event type pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white"
            style={{ background: cfg.pillGradient }}>
            <EventIcon size={14} />
            {cfg.label}
          </div>

          {/* Title */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Your trip to</p>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none mb-4">
              {data.eventAnchor.eventName}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><MapPin size={13} />{data.eventAnchor.venue}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="flex items-center gap-1.5"><Calendar size={13} />{fmtDate(data.eventAnchor.eventDate)}</span>
            </div>
          </div>

          <p className="text-base text-slate-500 max-w-2xl leading-relaxed">{data.overview}</p>

          {/* Phase stats strip */}
          {data.tripSummary.eventPhases && (
            <div className="flex items-stretch w-fit rounded-2xl border-2 border-slate-100 overflow-hidden bg-white shadow-sm">
              {[
                { value: data.tripSummary.eventPhases.preEvent, label: 'days before', highlight: false },
                { value: '1', label: 'Event Day', highlight: true },
                { value: data.tripSummary.eventPhases.postEvent, label: 'days after', highlight: false },
                { value: data.budget.totalBudget.replace('USD ', '').replace('$', ''), label: 'est. total', highlight: false },
              ].map((s, i) => (
                <div key={i} className="px-6 py-4 border-r border-slate-100 last:border-r-0"
                  style={{ background: s.highlight ? SKY_LIGHT : 'white' }}>
                  <div className="text-2xl font-black" style={{ color: s.highlight ? cfg.accent : '#0F172A' }}>{s.value}</div>
                  <div className="text-xs font-semibold mt-0.5" style={{ color: s.highlight ? cfg.accent : '#94A3B8' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Budget breakdown */}
          {data.budget.breakdown && <BudgetCard budget={data.budget} cfg={cfg} />}
        </div>
      )}

      {/* Fallback header (no event anchor) */}
      {!data.eventAnchor && (
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            {data.tripSummary?.cities?.[0] || 'Your Trip'}
          </h1>
          <p className="text-slate-500 leading-relaxed">{data.overview}</p>
          <div className="flex gap-6 pt-2 text-sm">
            <div><span className="text-2xl font-black text-slate-900">{data.tripSummary.totalDays}</span><p className="text-slate-400">days</p></div>
            <div><span className="text-2xl font-black text-slate-900">{data.budget.totalBudget.replace('USD ', '')}</span><p className="text-slate-400">budget</p></div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          DAY SELECTOR
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-2 w-max md:w-auto">
          {data.days.map((day: DayPlan) => {
            const isSelected = selectedDay === day.day;
            const isEvent = day.isEventDay;
            return (
              <button key={day.day} onClick={() => setSelectedDay(day.day)}
                className="relative flex flex-col items-center px-5 py-3 rounded-2xl transition-all duration-200 min-w-[100px]"
                style={{
                  background: isSelected
                    ? isEvent ? cfg.heroGradient : '#0F172A'
                    : '#F1F5F9',
                  color: isSelected ? 'white' : '#64748B',
                  transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                  boxShadow: isSelected ? '0 8px 25px rgba(0,0,0,0.15)' : 'none',
                }}>
                {isEvent && (
                  <span className="absolute -top-2 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
                    style={{ background: cfg.pillGradient }}>
                    EVENT
                  </span>
                )}
                <span className="text-xs font-semibold opacity-70 mt-1">{fmtShort(day.date)}</span>
                <span className="text-sm font-bold mt-0.5">{day.label || `Day ${day.day}`}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          DAY CONTENT
      ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        <motion.div key={selectedDay}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4">

          {/* Day header card */}
          <div className="rounded-3xl p-6" style={{
            background: currentDay.isEventDay ? cfg.heroGradient : '#F8FAFC',
            border: currentDay.isEventDay ? 'none' : '2px solid #F1F5F9',
          }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                {currentDay.isEventDay && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-black uppercase tracking-widest text-white/60">★ Main Event</span>
                  </div>
                )}
                <h2 className={`text-2xl font-black tracking-tight ${currentDay.isEventDay ? 'text-white' : 'text-slate-900'}`}>
                  {currentDay.theme}
                </h2>
                <div className={`flex flex-wrap gap-3 mt-2 text-sm ${currentDay.isEventDay ? 'text-white/50' : 'text-slate-400'}`}>
                  <span className="flex items-center gap-1.5"><Calendar size={13} />{currentDay.date}</span>
                  <span className="flex items-center gap-1.5"><MapPin size={13} />{currentDay.city}</span>
                </div>
              </div>
              {currentDay.isEventDay && (
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white/20">
                  <EventIcon size={22} className="text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-[27px] top-10 bottom-10 w-px bg-gradient-to-b from-slate-200 to-transparent hidden md:block" />
            <div className="space-y-3">
              {(['Morning', 'Afternoon', 'Evening'] as const).map(period => (
                <TimeBlockCard key={period} period={period} data={currentDay[period.toLowerCase() as 'morning' | 'afternoon' | 'evening']}
                  isEventDay={currentDay.isEventDay} cfg={cfg} />
              ))}
            </div>
          </div>

          {/* Dining */}
          {currentDay.mealsAndDining && currentDay.mealsAndDining.length > 0 && (
            <div className="rounded-3xl border-2 border-slate-100 overflow-hidden bg-white">
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                <UtensilsCrossed size={15} className="text-slate-400" />
                <span className="font-black text-slate-900 text-sm">Where to eat</span>
              </div>
              <div className="divide-y divide-slate-50">
                {currentDay.mealsAndDining.map((meal: any, i: number) => (
                  <div key={i} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400">{meal.meal}</span>
                      <p className="font-bold text-slate-900 mt-0.5 text-sm">{meal.recommendation}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><MapPin size={10} />{meal.location}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-slate-900 text-sm">{meal.priceRange}</p>
                      <button className="text-xs font-bold flex items-center gap-1 mt-1 transition-opacity hover:opacity-70"
                        style={{ color: cfg.accent }}>
                        Reserve <ExternalLink size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {currentDay.tips && currentDay.tips.length > 0 && (
            <div className="rounded-3xl p-5 space-y-3" style={{ background: cfg.accentLight, border: `2px solid ${cfg.accentBorder}` }}>
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: cfg.accent }}>
                {currentDay.isEventDay ? '★ Event Day Tips' : 'Tips for today'}
              </p>
              <ul className="space-y-2">
                {currentDay.tips.map((tip: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-700">
                    <span className="font-black flex-shrink-0 mt-0.5" style={{ color: cfg.accent }}>—</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Day cost */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-sm text-slate-400 font-semibold">
              {currentDay.isEventDay ? "Today's total (incl. event)" : "Today's total"}
            </span>
            <span className="text-2xl font-black text-slate-900">
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

// ── TIME BLOCK CARD ───────────────────────────────────────────────────────────
function TimeBlockCard({ period, data, isEventDay, cfg }: {
  period: 'Morning' | 'Afternoon' | 'Evening';
  data: TimeBlock | EventBlock;
  isEventDay: boolean;
  cfg: typeof EVENT_CONFIG[keyof typeof EVENT_CONFIG];
}) {
  const isEventBlock = 'isEventBlock' in data && data.isEventBlock;
  const eventDetails = 'eventDetails' in data ? data.eventDetails : null;
  const PeriodIcon = TIME_ICONS[period];

  // ── EVENT BLOCK ──────────────────────────────────────────────────────────
  if (isEventBlock) {
    return (
      <div className="rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden"
        style={{ background: cfg.heroGradient }}>
        {/* Glow overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{ background: `radial-gradient(ellipse at 70% 50%, ${cfg.accent}, transparent 70%)` }} />

        <div className="relative z-10 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Star size={13} className="fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-black uppercase tracking-widest text-white/50">The Main Event</span>
              </div>
              <h3 className="text-xl font-black text-white">{period}</h3>
              <div className="flex items-center gap-1.5 text-white/50 text-xs mt-1">
                <Clock size={11} />{data.time}
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
              {[
                { label: 'Doors', value: eventDetails.doors },
                { label: 'Kickoff', value: eventDetails.startTime },
                { label: 'Duration', value: eventDetails.duration },
              ].filter(x => x.value).map((item, i) => (
                <div key={i} className="rounded-xl p-3 bg-white/10">
                  <p className="text-white/40 text-xs font-semibold">{item.label}</p>
                  <p className="text-white font-black text-sm mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-white/50 text-xs">
              <MapPin size={11} />{data.location}
            </div>
            <div className="flex gap-2">
              {eventDetails?.ticketUrl && (
                <a href={eventDetails.ticketUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-xl text-white"
                  style={{ background: cfg.pillGradient }}>
                  <Ticket size={12} />Tickets
                </a>
              )}
              <button className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
                <Navigation size={12} />Navigate
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── REGULAR TIME BLOCK ────────────────────────────────────────────────────
  return (
    <div className="group flex gap-4 md:gap-5">
      {/* Period icon */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-[54px] h-[54px] rounded-2xl flex items-center justify-center transition-all"
          style={{
            background: isEventDay ? cfg.pillGradient : '#F1F5F9',
            color: isEventDay ? 'white' : '#94A3B8',
          }}>
          <PeriodIcon size={20} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white border-2 border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-black text-slate-900">{period}</h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5"><Clock size={11} />{data.time}</div>
          </div>
          <span className="text-lg font-black text-slate-900 flex-shrink-0">{data.cost}</span>
        </div>

        <p className="text-sm text-slate-500 leading-relaxed mb-4">{data.activities}</p>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
            <MapPin size={10} />{data.location}
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
              style={{ background: cfg.accentLight, color: cfg.accent }}>
              <ShoppingBag size={11} />Book
            </button>
            <button className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
              <Navigation size={11} />Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── BUDGET CARD ───────────────────────────────────────────────────────────────
function BudgetCard({ budget, cfg }: { budget: ItineraryData['budget']; cfg: typeof EVENT_CONFIG[keyof typeof EVENT_CONFIG] }) {
  if (!budget.breakdown) return null;

  const items = [
    { icon: Hotel,    label: 'Accommodation', value: budget.breakdown.accommodation, isEvent: false },
    { icon: Plane,    label: 'Transport',      value: budget.breakdown.transport,      isEvent: false },
    { icon: Utensils, label: 'Food',           value: budget.breakdown.food,           isEvent: false },
    { icon: Ticket,   label: 'Event',          value: budget.breakdown.event,          isEvent: true  },
    { icon: Activity, label: 'Activities',     value: budget.breakdown.activities,     isEvent: false },
  ];

  return (
    <div className="rounded-3xl border-2 border-slate-100 overflow-hidden bg-white shadow-sm">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <span className="font-black text-slate-900 text-sm">Budget Breakdown</span>
        <span className="text-xs text-slate-400 font-semibold">{budget.dailyAverage} avg/day</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-slate-100">
        {items.map(({ icon: Icon, label, value, isEvent }) => (
          <div key={label} className="px-5 py-4" style={{ background: isEvent ? cfg.accentLight : 'white' }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={13} style={{ color: isEvent ? cfg.accent : '#94A3B8' }} />
              <span className="text-xs text-slate-400 font-semibold">{label}</span>
            </div>
            <div className="text-lg font-black" style={{ color: isEvent ? cfg.accent : '#0F172A' }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}