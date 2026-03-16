import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Calendar, Clock, Trophy, Music, PartyPopper, Sparkles,
  ExternalLink, Navigation, Star, Ticket, UtensilsCrossed,
  Hotel, Plane, Activity, Sun, Sunset, Moon, Utensils,
  CloudRain, Cloud, Wind, Thermometer, Coffee, Landmark,
  ShoppingBag, Car, ArrowRight, Users, Zap, CheckCircle,
  AlertCircle, Globe, DollarSign,
} from "lucide-react";

import type { ItineraryData, TimeBlock, EventBlock, DayPlan } from "@/lib/mock-itinerary";
import TripUpsells from "@/components/TripUpsells";

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const SKY        = '#0EA5E9';
const SKY_DARK   = '#0284C7';
const SKY_LIGHT  = '#F0F9FF';
const SKY_BORDER = '#BAE6FD';

// ── EVENT CONFIG ──────────────────────────────────────────────────────────────
const EVENT_CONFIG = {
  sports: {
    icon: Trophy, accent: SKY, accentLight: SKY_LIGHT, accentBorder: SKY_BORDER,
    label: 'Sports Event',
    heroGradient: 'linear-gradient(135deg, #0C4A6E, #0369A1, #0EA5E9)',
    pillGradient: 'linear-gradient(135deg, #38BDF8, #0284C7)',
  },
  music: {
    icon: Music, accent: '#8B5CF6', accentLight: '#F5F3FF', accentBorder: '#DDD6FE',
    label: 'Music Event',
    heroGradient: 'linear-gradient(135deg, #2E1065, #6D28D9, #8B5CF6)',
    pillGradient: 'linear-gradient(135deg, #A78BFA, #7C3AED)',
  },
  festivals: {
    icon: PartyPopper, accent: '#F97316', accentLight: '#FFF7ED', accentBorder: '#FED7AA',
    label: 'Festival',
    heroGradient: 'linear-gradient(135deg, #431407, #C2410C, #F97316)',
    pillGradient: 'linear-gradient(135deg, #FB923C, #EA580C)',
  },
  other: {
    icon: Sparkles, accent: SKY, accentLight: SKY_LIGHT, accentBorder: SKY_BORDER,
    label: 'Event',
    heroGradient: 'linear-gradient(135deg, #0C4A6E, #0369A1, #0EA5E9)',
    pillGradient: 'linear-gradient(135deg, #38BDF8, #0284C7)',
  },
};

const TIME_ICONS = { Morning: Sun, Afternoon: Sunset, Evening: Moon };

const WMO_DESC: Record<number, { label: string; icon: string }> = {
  0:  { label: 'Clear sky',      icon: '☀️' },
  1:  { label: 'Mainly clear',   icon: '🌤' },
  2:  { label: 'Partly cloudy',  icon: '⛅' },
  3:  { label: 'Overcast',       icon: '☁️' },
  45: { label: 'Foggy',          icon: '🌫' },
  51: { label: 'Light drizzle',  icon: '🌦' },
  61: { label: 'Light rain',     icon: '🌧' },
  80: { label: 'Rain showers',   icon: '🌧' },
  95: { label: 'Thunderstorm',   icon: '⛈' },
  71: { label: 'Light snow',     icon: '🌨' },
};

// ── TYPES ──────────────────────────────────────────────────────────────────────
interface WeatherDay {
  date: string; high: number; low: number; code: number; rain: number;
}

interface NearbyPlace {
  name: string; category: string; address: string; distance: string; rating?: string; link: string;
}

// ── HELPERS ────────────────────────────────────────────────────────────────────
function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
}
function fmtShort(d: string) {
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch { return d; }
}
function mapsUrl(location: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}
function uberUrl(destination: string) {
  return `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${encodeURIComponent(destination)}`;
}

// ── WEATHER HOOK ───────────────────────────────────────────────────────────────
function useWeather(city: string): WeatherDay[] {
  const [weather, setWeather] = useState<WeatherDay[]>([]);
  useEffect(() => {
    if (!city) return;
    let dead = false;
    async function load() {
      try {
        const geo  = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`).then(r => r.json());
        if (!geo.results?.length || dead) return;
        const { latitude: lat, longitude: lon } = geo.results[0];
        const wx = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`).then(r => r.json());
        if (dead) return;
        setWeather(wx.daily.time.map((date: string, i: number) => ({
          date,
          high:  Math.round(wx.daily.temperature_2m_max[i]),
          low:   Math.round(wx.daily.temperature_2m_min[i]),
          code:  wx.daily.weathercode[i],
          rain:  wx.daily.precipitation_sum[i],
        })));
      } catch {}
    }
    load();
    return () => { dead = true; };
  }, [city]);
  return weather;
}

// ── NEARBY PLACES HOOK ────────────────────────────────────────────────────────
function useNearbyPlaces(city: string, enabled: boolean): { places: NearbyPlace[]; loading: boolean } {
  const [places,  setPlaces]  = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!city || !enabled) return;
    let dead = false;
    async function load() {
      setLoading(true);
      try {
        const res  = await fetch('/api/gladys-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `What are the best things to do and restaurants in ${city}?` }),
        });
        const data = await res.json();
        if (dead) return;
        if (data.toolName === 'find_nearby_attractions' && data.toolResult?.places) {
          setPlaces(data.toolResult.places.slice(0, 4));
        }
      } catch {} finally { if (!dead) setLoading(false); }
    }
    load();
    return () => { dead = true; };
  }, [city, enabled]);
  return { places, loading };
}

// ── WEATHER BADGE ──────────────────────────────────────────────────────────────
function WeatherBadge({ weather, date }: { weather: WeatherDay[]; date: string }) {
  const day = weather.find(w => w.date === date);
  if (!day) return null;
  const info = WMO_DESC[day.code] ?? { label: 'Mixed', icon: '🌡' };
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
      <span className="text-base leading-none">{info.icon}</span>
      <span className="text-xs font-bold text-slate-700">{day.high}°/{day.low}°</span>
      {day.rain > 2 && <span className="text-xs text-blue-500 font-semibold">☔ {day.rain}mm</span>}
    </div>
  );
}

// ── NEARBY PLACES STRIP ────────────────────────────────────────────────────────
function NearbyStrip({ city }: { city: string }) {
  const [show, setShow] = useState(false);
  const { places, loading } = useNearbyPlaces(city, show);

  const catIcon = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('food') || c.includes('restaurant') || c.includes('dining')) return '🍽';
    if (c.includes('bar') || c.includes('night')) return '🍸';
    if (c.includes('park') || c.includes('outdoor')) return '🌿';
    if (c.includes('museum') || c.includes('art')) return '🏛';
    if (c.includes('shop')) return '🛍';
    return '📍';
  };

  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden">
      <button
        onClick={() => setShow(true)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: SKY_LIGHT }}>
            <Globe size={15} style={{ color: SKY }} />
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-slate-900">Explore {city}</p>
            <p className="text-xs text-slate-400">Restaurants, bars, landmarks nearby</p>
          </div>
        </div>
        {!show && (
          <span className="text-xs font-bold px-3 py-1 rounded-full text-white" style={{ background: SKY }}>
            Show
          </span>
        )}
      </button>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {loading ? (
                <div className="flex items-center gap-2 py-3 text-slate-400 text-sm">
                  <div className="w-4 h-4 border-2 border-slate-200 border-t-sky-400 rounded-full animate-spin" />
                  Finding places near {city}...
                </div>
              ) : places.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {places.map((p, i) => (
                    <a
                      key={i}
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100 group"
                    >
                      <span className="text-xl leading-none mt-0.5">{catIcon(p.category)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate group-hover:underline">{p.name}</p>
                        <p className="text-xs text-slate-400 truncate">{p.category}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400">{p.distance}</span>
                          {p.rating && <span className="text-xs font-bold text-amber-500">★ {p.rating}</span>}
                        </div>
                      </div>
                      <ExternalLink size={12} className="text-slate-300 group-hover:text-slate-500 flex-shrink-0 mt-1" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 py-2">Search for an event first to load nearby places.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── TRANSPORT ROW ──────────────────────────────────────────────────────────────
function TransportRow({ from, to }: { from: string; to: string }) {
  if (!from || !to || from === to) return null;
  return (
    <div className="flex items-center gap-2 py-2 px-4 mx-4">
      <div className="flex-1 h-px bg-slate-100" />
      <div className="flex items-center gap-2 text-xs text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
        <Car size={11} />
        <span className="font-medium">{from}</span>
        <ArrowRight size={10} />
        <span className="font-medium">{to}</span>
        <a
          href={uberUrl(to)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          Uber →
        </a>
      </div>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

// ── PACKING REMINDER ───────────────────────────────────────────────────────────
function PackingReminder({ eventType, isEventDay }: { eventType: string; isEventDay: boolean }) {
  if (!isEventDay) return null;
  const items: Record<string, string[]> = {
    sports:    ['🎫 Tickets (screenshot + print)', '📱 Fully charged phone', '💧 Water bottle', '🧢 Hat/cap', '👟 Comfortable shoes'],
    music:     ['🎫 Tickets', '🔌 Portable charger', '🎧 Earplugs', '👟 Comfy shoes for standing', '🌧 Rain poncho'],
    festivals: ['🎫 Wristband/tickets', '🔌 Power bank', '💧 Reusable bottle', '🌧 Poncho', '🎒 Small backpack'],
    other:     ['🎫 Tickets', '📱 Phone charged', '💳 Card + cash', '👟 Comfortable shoes'],
  };
  const list = items[eventType] ?? items.other;
  return (
    <div className="rounded-2xl p-4 bg-amber-50 border-2 border-amber-100">
      <p className="text-xs font-black uppercase tracking-widest text-amber-600 mb-3">📋 Event Day Checklist</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {list.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-amber-900">
            <CheckCircle size={13} className="text-amber-400 flex-shrink-0" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function ItineraryView({
  data,
  startDate,
  endDate,
}: {
  data?:       ItineraryData;
  startDate?:  Date | null;
  endDate?:    Date | null;
}) {
  const [selectedDay, setSelectedDay] = useState(1);
  const city    = data?.eventAnchor?.city ?? data?.tripSummary?.cities?.[0] ?? '';
  const weather = useWeather(city);

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

  const cfg        = data.eventAnchor ? EVENT_CONFIG[data.eventAnchor.eventType] ?? EVENT_CONFIG.other : EVENT_CONFIG.other;
  const EventIcon  = cfg.icon;
  const currentDay = data.days[selectedDay - 1];

  return (
    <div className="space-y-6" style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* ═══════════════════════ HERO HEADER ═══════════════════════════════ */}
      {data.eventAnchor && (
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white"
            style={{ background: cfg.pillGradient }}>
            <EventIcon size={14} />{cfg.label}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Your trip to</p>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-none mb-3">
              {data.eventAnchor.eventName}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><MapPin size={13} />{data.eventAnchor.venue}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="flex items-center gap-1.5"><Calendar size={13} />{fmtDate(data.eventAnchor.eventDate)}</span>
              {(startDate || endDate) && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className="flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-600">
                    <Calendar size={11} style={{ color: '#0EA5E9' }} />
                    {startDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {endDate && ` → ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    {startDate && endDate && (
                      <span className="px-1.5 py-0.5 rounded-full text-white text-[10px] font-black" style={{ background: '#0EA5E9' }}>
                        {Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000)}d
                      </span>
                    )}
                  </span>
                </>
              )}
            </div>
          </div>

          {data.overview && (
            <p className="text-base text-slate-500 max-w-2xl leading-relaxed">{data.overview}</p>
          )}

          {/* Phase stats */}
          {data.tripSummary.eventPhases && (
            <div className="flex items-stretch w-fit rounded-2xl border-2 border-slate-100 overflow-hidden bg-white shadow-sm">
              {[
                { value: data.tripSummary.eventPhases.preEvent,  label: 'days before', highlight: false },
                { value: '1',                                     label: 'Event Day',   highlight: true  },
                { value: data.tripSummary.eventPhases.postEvent, label: 'days after',  highlight: false },
                { value: data.budget.totalBudget.replace('USD ', '').replace('$', ''), label: 'est. total', highlight: false },
              ].map((s, i) => (
                <div key={i} className="px-5 py-4 border-r border-slate-100 last:border-r-0"
                  style={{ background: s.highlight ? SKY_LIGHT : 'white' }}>
                  <div className="text-2xl font-black" style={{ color: s.highlight ? cfg.accent : '#0F172A' }}>{s.value}</div>
                  <div className="text-xs font-semibold mt-0.5" style={{ color: s.highlight ? cfg.accent : '#94A3B8' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {data.budget.breakdown && <BudgetCard budget={data.budget} cfg={cfg} />}
        </div>
      )}

      {!data.eventAnchor && (
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            {data.tripSummary?.cities?.[0] || 'Your Trip'}
          </h1>
          <p className="text-slate-500 leading-relaxed">{data.overview}</p>
          <div className="flex flex-wrap gap-4 pt-2 text-sm items-center">
            <div><span className="text-2xl font-black text-slate-900">{data.tripSummary.totalDays}</span><p className="text-slate-400">days</p></div>
            <div><span className="text-2xl font-black text-slate-900">{data.budget.totalBudget.replace('USD ', '')}</span><p className="text-slate-400">budget</p></div>
            {(startDate || endDate) && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-slate-100 text-xs font-bold text-slate-600">
                <Calendar size={12} style={{ color: SKY }} />
                {startDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {endDate && ` → ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                {startDate && endDate && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-white text-[10px] font-black"
                    style={{ background: SKY }}>
                    {Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000)}d
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════ DAY TABS ══════════════════════════════════ */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-2 w-max md:w-auto">
          {data.days.map((day: DayPlan) => {
            const isSelected = selectedDay === day.day;
            const isEvent    = day.isEventDay;
            const wx         = weather.find(w => w.date === day.date);
            const wxInfo     = wx ? WMO_DESC[wx.code] ?? { icon: '🌡' } : null;
            return (
              <button key={day.day} onClick={() => setSelectedDay(day.day)}
                className="relative flex flex-col items-center px-4 py-3 rounded-2xl transition-all duration-200 min-w-[100px]"
                style={{
                  background: isSelected ? (isEvent ? cfg.heroGradient : '#0F172A') : '#F1F5F9',
                  color: isSelected ? 'white' : '#64748B',
                  transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                  boxShadow: isSelected ? '0 8px 25px rgba(0,0,0,0.15)' : 'none',
                }}>
                {isEvent && (
                  <span className="absolute -top-2 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
                    style={{ background: cfg.pillGradient }}>EVENT</span>
                )}
                <span className="text-xs font-semibold opacity-70 mt-1">{fmtShort(day.date)}</span>
                <span className="text-sm font-bold mt-0.5">{day.label || `Day ${day.day}`}</span>
                {wxInfo && (
                  <span className="text-base mt-1 leading-none">{wxInfo.icon}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════ DAY CONTENT ═══════════════════════════════ */}
      <AnimatePresence mode="wait">
        <motion.div key={selectedDay}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4">

          {/* Day header */}
          <div className="rounded-3xl p-5 sm:p-6"
            style={{
              background: currentDay.isEventDay ? cfg.heroGradient : '#F8FAFC',
              border: currentDay.isEventDay ? 'none' : '2px solid #F1F5F9',
            }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {currentDay.isEventDay && (
                  <span className="text-xs font-black uppercase tracking-widest text-white/60 mb-1 block">★ Main Event</span>
                )}
                <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${currentDay.isEventDay ? 'text-white' : 'text-slate-900'}`}>
                  {currentDay.theme}
                </h2>
                <div className={`flex flex-wrap gap-3 mt-2 text-sm ${currentDay.isEventDay ? 'text-white/50' : 'text-slate-400'}`}>
                  <span className="flex items-center gap-1.5"><Calendar size={13} />{currentDay.date}</span>
                  <span className="flex items-center gap-1.5"><MapPin size={13} />{currentDay.city}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                {/* Weather for this day */}
                <WeatherBadge weather={weather} date={currentDay.date} />
                {currentDay.isEventDay && (
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/20">
                    <EventIcon size={22} className="text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Event day checklist */}
          {currentDay.isEventDay && data.eventAnchor && (
            <PackingReminder eventType={data.eventAnchor.eventType} isEventDay={true} />
          )}

          {/* Timeline */}
          <div className="space-y-1">
            {(['morning', 'afternoon', 'evening'] as const).map((period, idx, arr) => {
              const block     = currentDay[period];
              const nextBlock = arr[idx + 1] ? currentDay[arr[idx + 1]] : null;
              const label     = period.charAt(0).toUpperCase() + period.slice(1) as 'Morning' | 'Afternoon' | 'Evening';
              return (
                <div key={period}>
                  <TimeBlockCard period={label} data={block} isEventDay={currentDay.isEventDay} cfg={cfg} />
                  {nextBlock && block.location && nextBlock.location && block.location !== nextBlock.location && (
                    <TransportRow from={block.location} to={nextBlock.location} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Meals */}
          {currentDay.mealsAndDining && currentDay.mealsAndDining.length > 0 && (
            <div className="rounded-3xl border-2 border-slate-100 overflow-hidden bg-white">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                <UtensilsCrossed size={14} className="text-slate-400" />
                <span className="font-black text-slate-900 text-sm">Where to eat today</span>
              </div>
              <div className="divide-y divide-slate-50">
                {currentDay.mealsAndDining.map((meal: any, i: number) => (
                  <div key={i} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{meal.meal}</span>
                      <p className="font-bold text-slate-900 text-sm truncate">{meal.recommendation}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin size={10} />{meal.location}</p>
                        <a
                          href={mapsUrl(meal.recommendation + ' ' + meal.location)}
                          target="_blank" rel="noopener noreferrer"
                          className="text-xs font-bold flex items-center gap-0.5 hover:underline"
                          style={{ color: cfg.accent }}
                        >
                          <Navigation size={10} />Map
                        </a>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-black text-slate-900 text-sm">{meal.priceRange}</p>
                      <a
                        href={meal.affiliateUrl || `https://www.google.com/search?q=${encodeURIComponent(meal.recommendation + ' ' + meal.location + ' reservations')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs font-bold flex items-center gap-1 mt-1 justify-end hover:underline"
                        style={{ color: cfg.accent }}
                      >
                        Reserve <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nearby places — show on non-event days */}
          {!currentDay.isEventDay && currentDay.city && (
            <NearbyStrip city={currentDay.city} />
          )}

          {/* Tips */}
          {currentDay.tips && currentDay.tips.length > 0 && (
            <div className="rounded-3xl p-5 space-y-3"
              style={{ background: cfg.accentLight, border: `2px solid ${cfg.accentBorder}` }}>
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: cfg.accent }}>
                {currentDay.isEventDay ? '★ Event Day Tips' : '💡 Tips for today'}
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
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-sm text-slate-400 font-semibold">
              {currentDay.isEventDay ? "Today's total (incl. event)" : "Today's estimated spend"}
            </span>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900">
                {currentDay.isEventDay && data.budget.eventDayCost ? data.budget.eventDayCost : data.budget.dailyAverage}
              </span>
              <p className="text-xs text-slate-400">per person</p>
            </div>
          </div>

        </motion.div>
      </AnimatePresence>

      {/* ═══════════════════════ UPSELLS ═══════════════════════════════════ */}
      {data.eventAnchor && (
        <TripUpsells
          city={data.eventAnchor.city || data.eventAnchor.venue || 'the destination'}
          country={data.eventAnchor.country || data.eventAnchor.city || 'the destination'}
          arrivalDate={data.days[0]?.date || data.eventAnchor.eventDate}
          departureDate={data.days[data.days.length - 1]?.date || data.eventAnchor.eventDate}
          eventName={data.eventAnchor.eventName}
          accentColor={cfg.accent}
        />
      )}
    </div>
  );
}

// ── TIME BLOCK CARD ────────────────────────────────────────────────────────────
function TimeBlockCard({ period, data, isEventDay, cfg }: {
  period: 'Morning' | 'Afternoon' | 'Evening';
  data: TimeBlock | EventBlock;
  isEventDay: boolean;
  cfg: typeof EVENT_CONFIG[keyof typeof EVENT_CONFIG];
}) {
  const isEventBlock = 'isEventBlock' in data && data.isEventBlock;
  const eventDetails = 'eventDetails' in data ? data.eventDetails : null;
  const PeriodIcon   = TIME_ICONS[period];

  // ── EVENT BLOCK ─────────────────────────────────────────────────────────
  if (isEventBlock) {
    return (
      <div className="rounded-3xl p-5 sm:p-6 text-white shadow-2xl relative overflow-hidden"
        style={{ background: cfg.heroGradient }}>
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{ background: `radial-gradient(ellipse at 70% 50%, ${cfg.accent}, transparent 70%)` }} />
        <div className="relative z-10 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
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
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Doors open', value: eventDetails.doors },
                { label: 'Kick-off',   value: eventDetails.startTime },
                { label: 'Duration',   value: eventDetails.duration },
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
              <a
                href={mapsUrl(data.location)}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <Navigation size={12} />Navigate
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── REGULAR TIME BLOCK ───────────────────────────────────────────────────
  return (
    <div className="group flex gap-3 sm:gap-4">
      {/* Period icon */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-12 h-12 sm:w-[54px] sm:h-[54px] rounded-2xl flex items-center justify-center transition-all"
          style={{
            background: isEventDay ? cfg.pillGradient : '#F1F5F9',
            color:      isEventDay ? 'white' : '#94A3B8',
          }}>
          <PeriodIcon size={20} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white border-2 border-slate-100 rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h3 className="font-black text-slate-900">{period}</h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
              <Clock size={11} />{data.time}
            </div>
          </div>
          <span className="text-lg font-black text-slate-900 flex-shrink-0">{data.cost}</span>
        </div>

        {/* Activity description */}
        <p className="text-sm text-slate-600 leading-relaxed mb-4">{data.activities}</p>

        {/* Affiliate links if present */}
        {data.affiliateLinks && data.affiliateLinks.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {data.affiliateLinks.filter(l => l.url).map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl text-white transition-opacity hover:opacity-90"
                style={{ background: cfg.pillGradient }}
              >
                <ExternalLink size={11} />
                {link.type === 'hotel' ? 'Book Hotel' : link.type === 'tour' ? 'Book Tour' : link.partner ?? 'Book'}
              </a>
            ))}
          </div>
        )}

        {/* Footer: location + actions */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full min-w-0">
            <MapPin size={10} className="flex-shrink-0" />
            <span className="truncate">{data.location}</span>
          </div>
          <div className="flex gap-2">
            <a
              href={mapsUrl(data.location)}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
              style={{ background: cfg.accentLight, color: cfg.accent }}
            >
              <Navigation size={11} />Map
            </a>
            <a
              href={uberUrl(data.location)}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <Car size={11} />Uber
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── BUDGET CARD ────────────────────────────────────────────────────────────────
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
      <div className="px-5 sm:px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <span className="font-black text-slate-900 text-sm">Budget Breakdown</span>
        <span className="text-xs text-slate-400 font-semibold">{budget.dailyAverage} avg/day</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-slate-100">
        {items.map(({ icon: Icon, label, value, isEvent }) => (
          <div key={label} className="px-4 sm:px-5 py-4" style={{ background: isEvent ? cfg.accentLight : 'white' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <Icon size={13} style={{ color: isEvent ? cfg.accent : '#94A3B8' }} />
              <span className="text-xs text-slate-400 font-semibold">{label}</span>
            </div>
            <div className="text-base sm:text-lg font-black" style={{ color: isEvent ? cfg.accent : '#0F172A' }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}