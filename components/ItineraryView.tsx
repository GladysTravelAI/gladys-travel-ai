import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  MapPin, Calendar, Clock, Trophy, Music, PartyPopper, Sparkles,
  ExternalLink, Navigation, Star, Ticket, UtensilsCrossed,
  Hotel, Plane, Activity, Sun, Sunset, Moon, Utensils,
  Car, ArrowRight, Zap, CheckCircle, Globe, DollarSign,
  ChevronDown, ChevronRight, Shield, Wifi, AlertTriangle,
  Wind, Eye, Coffee, Compass, Heart, Flame,
} from "lucide-react";

import type { ItineraryData, TimeBlock, EventBlock, DayPlan, SmartAffiliate } from "@/lib/mock-itinerary";
import VenueDirections   from "@/components/VenueDirections";
import SeatMapViewer     from "@/components/SeatMapViewer";
import LiveMatchTracker  from "@/components/LiveMatchTracker";
import ImHereMode        from "@/components/ImHereMode";
import ParkingHub        from "@/components/ParkingHub";
import PreEventChecklist from "@/components/PreEventChecklist";

// ── FONT INJECTION ────────────────────────────────────────────────────────────
const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
`;

// ── DESIGN SYSTEM ─────────────────────────────────────────────────────────────
const DS = {
  font: {
    display: "'Cormorant Garamond', Georgia, serif",
    body:    "'DM Sans', -apple-system, sans-serif",
    mono:    "'DM Mono', 'SF Mono', monospace",
  },
  color: {
    ink:     '#0A0A0F',
    inkSoft: '#1A1A28',
    slate:   '#64748B',
    muted:   '#94A3B8',
    border:  '#E8EAF0',
    surface: '#FAFAFA',
    white:   '#FFFFFF',
  },
};

// ── EVENT CONFIG ──────────────────────────────────────────────────────────────
const EVENT_CFG = {
  sports: {
    icon: Trophy,
    gradient: 'linear-gradient(135deg, #020B18 0%, #0C3558 50%, #1565C0 100%)',
    accent: '#2196F3', accentRgb: '33,150,243',
    pill: 'linear-gradient(135deg, #42A5F5, #1565C0)',
    glow: 'rgba(33,150,243,0.3)',
    label: 'Sports',
  },
  music: {
    icon: Music,
    gradient: 'linear-gradient(135deg, #0D0118 0%, #3A0E6B 50%, #7B1FA2 100%)',
    accent: '#AB47BC', accentRgb: '171,71,188',
    pill: 'linear-gradient(135deg, #CE93D8, #8E24AA)',
    glow: 'rgba(171,71,188,0.3)',
    label: 'Music',
  },
  festivals: {
    icon: PartyPopper,
    gradient: 'linear-gradient(135deg, #1A0800 0%, #7C2D12 50%, #EA580C 100%)',
    accent: '#F97316', accentRgb: '249,115,22',
    pill: 'linear-gradient(135deg, #FB923C, #C2410C)',
    glow: 'rgba(249,115,22,0.3)',
    label: 'Festival',
  },
  festival: {
    icon: PartyPopper,
    gradient: 'linear-gradient(135deg, #1A0800 0%, #7C2D12 50%, #EA580C 100%)',
    accent: '#F97316', accentRgb: '249,115,22',
    pill: 'linear-gradient(135deg, #FB923C, #C2410C)',
    glow: 'rgba(249,115,22,0.3)',
    label: 'Festival',
  },
  other: {
    icon: Sparkles,
    gradient: 'linear-gradient(135deg, #020B18 0%, #0C3558 50%, #1565C0 100%)',
    accent: '#2196F3', accentRgb: '33,150,243',
    pill: 'linear-gradient(135deg, #42A5F5, #1565C0)',
    glow: 'rgba(33,150,243,0.3)',
    label: 'Event',
  },
};

const WMO: Record<number, { label: string; icon: string }> = {
  0:  { label: 'Clear',         icon: '☀️' },
  1:  { label: 'Mainly clear',  icon: '🌤' },
  2:  { label: 'Partly cloudy', icon: '⛅' },
  3:  { label: 'Overcast',      icon: '☁️' },
  45: { label: 'Foggy',         icon: '🌫' },
  51: { label: 'Drizzle',       icon: '🌦' },
  61: { label: 'Rain',          icon: '🌧' },
  80: { label: 'Showers',       icon: '🌧' },
  95: { label: 'Thunderstorm',  icon: '⛈' },
  71: { label: 'Snow',          icon: '🌨' },
};

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface WeatherDay {
  date: string; high: number; low: number; code: number; rain: number;
}
interface NearbyPlace {
  id: string; name: string; category: string;
  address: string; distance: string; rating?: string; link: string; icon?: string;
}
interface ExploreCityCategory {
  label: string; emoji: string; places: NearbyPlace[];
}

// ── UTILS ─────────────────────────────────────────────────────────────────────
const fmtDate  = (d: string) => { try { return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); } catch { return d; } };
const fmtShort = (d: string) => { try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); } catch { return d; } };
const mapsUrl  = (loc: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
const uberUrl  = (dest: string) => `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${encodeURIComponent(dest)}`;

// ── HOOKS ─────────────────────────────────────────────────────────────────────
function useWeather(city: string): WeatherDay[] {
  const [w, setW] = useState<WeatherDay[]>([]);
  useEffect(() => {
    if (!city) return;
    let dead = false;
    (async () => {
      try {
        const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`).then(r => r.json());
        if (!geo.results?.length || dead) return;
        const { latitude: lat, longitude: lon } = geo.results[0];
        const wx = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`).then(r => r.json());
        if (dead) return;
        setW(wx.daily.time.map((date: string, i: number) => ({
          date, high: Math.round(wx.daily.temperature_2m_max[i]),
          low: Math.round(wx.daily.temperature_2m_min[i]),
          code: wx.daily.weathercode[i], rain: wx.daily.precipitation_sum[i],
        })));
      } catch {}
    })();
    return () => { dead = true; };
  }, [city]);
  return w;
}

function useCountdown(targetDate: string, targetTime?: string): { h: number; m: number; s: number; past: boolean } {
  const [remaining, setRemaining] = useState({ h: 0, m: 0, s: 0, past: false });
  useEffect(() => {
    const getTarget = () => {
      try {
        const base = new Date(targetDate);
        if (targetTime) {
          const [h, min] = targetTime.replace(/[APM]/gi, '').trim().split(':').map(Number);
          base.setHours(h || 20, min || 0, 0, 0);
        } else {
          base.setHours(20, 0, 0, 0);
        }
        return base;
      } catch { return new Date(); }
    };
    const tick = () => {
      const diff = getTarget().getTime() - Date.now();
      if (diff <= 0) { setRemaining({ h: 0, m: 0, s: 0, past: true }); return; }
      const totalSecs = Math.floor(diff / 1000);
      setRemaining({ h: Math.floor(totalSecs / 3600), m: Math.floor((totalSecs % 3600) / 60), s: totalSecs % 60, past: false });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate, targetTime]);
  return remaining;
}

// ── COMPONENT: CHAPTER NAVIGATOR ─────────────────────────────────────────────
function ChapterNav({
  days, selectedDay, onSelect, cfg, weather,
}: {
  days: DayPlan[]; selectedDay: number;
  onSelect: (n: number) => void;
  cfg: typeof EVENT_CFG[keyof typeof EVENT_CFG];
  weather: WeatherDay[];
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ fontFamily: DS.font.body }}>
      {days.map((day, i) => {
        const active  = selectedDay === day.day;
        const isEvent = day.isEventDay;
        const wx      = weather.find(w => w.date === day.date);
        const wInfo   = wx ? WMO[wx.code] ?? { icon: '🌡' } : null;

        return (
          <motion.button
            key={day.day}
            onClick={() => onSelect(day.day)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="relative flex-shrink-0 flex flex-col items-center gap-1 px-5 py-3 rounded-2xl transition-all duration-300"
            style={{
              background: active
                ? isEvent ? cfg.gradient : DS.color.ink
                : '#F1F5F9',
              color: active ? '#fff' : DS.color.slate,
              minWidth: 90,
              boxShadow: active ? `0 8px 24px ${isEvent ? cfg.glow : 'rgba(0,0,0,0.2)'}` : 'none',
              fontFamily: DS.font.body,
            }}
          >
            {isEvent && (
              <span
                className="absolute -top-2.5 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
                style={{ background: cfg.pill }}
              >
                Event
              </span>
            )}
            <span className="text-[11px] font-medium opacity-70">{fmtShort(day.date)}</span>
            <span className="text-xs font-bold leading-tight text-center">
              {isEvent ? '★ Day' : `Day ${day.day}`}
            </span>
            {wInfo && <span className="text-sm leading-none">{wInfo.icon}</span>}
          </motion.button>
        );
      })}
    </div>
  );
}

// ── COMPONENT: EVENT DAY HERO ─────────────────────────────────────────────────
function EventDayHero({
  data, cfg, weather,
}: {
  data: ItineraryData;
  cfg: typeof EVENT_CFG[keyof typeof EVENT_CFG];
  weather: WeatherDay[];
}) {
  const anchor    = data.eventAnchor!;
  const EventIcon = cfg.icon;
  const eventBlock = data.days
    .flatMap((d: any) => [d.morning, d.afternoon, d.evening])
    .find((b: any) => b?.isEventBlock);
  const countdown  = useCountdown(anchor.eventDate, eventBlock?.time);
  const wx         = weather.find(w => w.date === anchor.eventDate);
  const wInfo      = wx ? WMO[wx.code] ?? { icon: '🌡' } : null;
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-3xl"
      style={{ background: cfg.gradient, minHeight: 420 }}
    >
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundSize: '128px' }}
      />

      {/* Glow orb */}
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-20"
        style={{ background: cfg.accent }} />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full blur-3xl opacity-10"
        style={{ background: cfg.accent }} />

      <div className="relative z-10 p-7 sm:p-10 flex flex-col gap-6">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: revealed ? 1 : 0, x: revealed ? 0 : -20 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 w-fit"
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <EventIcon size={15} className="text-white" />
          </div>
          <span className="text-xs font-bold text-white/60 uppercase tracking-widest" style={{ fontFamily: DS.font.body }}>
            {cfg.label} · Event Day
          </span>
        </motion.div>

        {/* Event name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h2
            className="text-4xl sm:text-6xl font-bold text-white leading-tight mb-2"
            style={{ fontFamily: DS.font.display, letterSpacing: '-0.02em' }}
          >
            {anchor.eventName}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-white/50 text-sm" style={{ fontFamily: DS.font.body }}>
            <span className="flex items-center gap-1.5"><MapPin size={13} />{anchor.venue}</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span className="flex items-center gap-1.5"><Calendar size={13} />{fmtDate(anchor.eventDate)}</span>
            {wInfo && wx && (
              <>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span className="flex items-center gap-1.5">{wInfo.icon} {wx.high}°/{wx.low}°</span>
              </>
            )}
          </div>
        </motion.div>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {!countdown.past ? (
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-3" style={{ fontFamily: DS.font.body }}>
                Kickoff in
              </p>
              <div className="flex items-end gap-3">
                {[
                  { val: countdown.h, label: 'HRS' },
                  { val: countdown.m, label: 'MIN' },
                  { val: countdown.s, label: 'SEC' },
                ].map(({ val, label }) => (
                  <div key={label} className="flex flex-col items-center">
                    <div
                      className="text-4xl sm:text-5xl font-bold text-white tabular-nums leading-none"
                      style={{ fontFamily: DS.font.display }}
                    >
                      {String(val).padStart(2, '0')}
                    </div>
                    <span className="text-[10px] font-bold text-white/40 mt-1 tracking-widest" style={{ fontFamily: DS.font.mono }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Flame size={20} style={{ color: cfg.accent }} />
              <span className="text-xl font-bold text-white" style={{ fontFamily: DS.font.display }}>
                It's time. Let's go.
              </span>
            </div>
          )}
        </motion.div>

        {/* Action row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 16 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex flex-wrap gap-3"
        >
          {eventBlock && 'eventDetails' in eventBlock && eventBlock.eventDetails?.ticketUrl && (
            <a
              href={eventBlock.eventDetails.ticketUrl}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white"
              style={{ background: cfg.pill, fontFamily: DS.font.body }}
            >
              <Ticket size={15} />
              Your Tickets
            </a>
          )}
          <a
            href={mapsUrl(anchor.venue + ' ' + anchor.city)}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white/90"
            style={{ background: 'rgba(255,255,255,0.12)', fontFamily: DS.font.body }}
          >
            <Navigation size={15} />
            Navigate
          </a>
          <a
            href={uberUrl(anchor.venue + ', ' + anchor.city)}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white/90"
            style={{ background: 'rgba(255,255,255,0.12)', fontFamily: DS.font.body }}
          >
            <Car size={15} />
            Uber There
          </a>
        </motion.div>
      </div>
    </div>
  );
}

// ── COMPONENT: INTEL BRIEF ────────────────────────────────────────────────────
function IntelBrief({ tips, cfg, eventType }: {
  tips: string[];
  cfg: typeof EVENT_CFG[keyof typeof EVENT_CFG];
  eventType: string;
}) {
  if (!tips?.length) return null;
  const briefings: Record<string, { icon: any; label: string }> = {
    sports:   { icon: Eye, label: 'Game Day Intel' },
    music:    { icon: Zap, label: 'Show Night Intel' },
    festival: { icon: Compass, label: 'Festival Intel' },
    other:    { icon: Eye, label: 'Event Day Intel' },
  };
  const brief = briefings[eventType] ?? briefings.other;
  const Icon  = brief.icon;

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{ border: `1.5px solid rgba(${cfg.accentRgb},0.2)`, background: `rgba(${cfg.accentRgb},0.04)` }}
    >
      <div className="px-5 py-4 flex items-center gap-3 border-b"
        style={{ borderColor: `rgba(${cfg.accentRgb},0.12)` }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `rgba(${cfg.accentRgb},0.12)` }}>
          <Icon size={16} style={{ color: cfg.accent }} />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: cfg.accent, fontFamily: DS.font.body }}>
            Your concierge
          </p>
          <p className="text-sm font-bold text-slate-900" style={{ fontFamily: DS.font.body }}>{brief.label}</p>
        </div>
      </div>
      <div className="px-5 py-4 space-y-3">
        {tips.slice(0, 5).map((tip, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex gap-3"
          >
            <span
              className="text-xs font-bold tabular-nums mt-0.5 flex-shrink-0"
              style={{ color: cfg.accent, fontFamily: DS.font.mono }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <p className="text-sm text-slate-700 leading-relaxed" style={{ fontFamily: DS.font.body }}>{tip}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── COMPONENT: TIMELINE BLOCK ─────────────────────────────────────────────────
const PERIOD_ICONS = { Morning: Sun, Afternoon: Sunset, Evening: Moon };
const PERIOD_TIMES = { Morning: '8–12', Afternoon: '12–18', Evening: '18–23' };

function TimelineBlock({
  period, block, isEventDay, isEventBlock, cfg, isLast,
}: {
  period: 'Morning' | 'Afternoon' | 'Evening';
  block: TimeBlock | EventBlock;
  isEventDay: boolean;
  isEventBlock: boolean;
  cfg: typeof EVENT_CFG[keyof typeof EVENT_CFG];
  isLast: boolean;
}) {
  const PIcon = PERIOD_ICONS[period];
  const evtDetails = isEventBlock && 'eventDetails' in block ? block.eventDetails : null;

  if (isEventBlock) {
    return (
      <div className="relative flex gap-4 sm:gap-6">
        {/* Timeline spine */}
        <div className="flex flex-col items-center flex-shrink-0 w-10">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center z-10 shadow-lg"
            style={{ background: cfg.pill }}
          >
            <Star size={18} className="text-white fill-white" />
          </div>
          {!isLast && <div className="flex-1 w-px mt-2 min-h-[32px]" style={{ background: `rgba(${cfg.accentRgb},0.3)` }} />}
        </div>

        {/* Event block content */}
        <div className="flex-1 pb-6">
          <div
            className="rounded-3xl overflow-hidden"
            style={{ background: cfg.gradient, boxShadow: `0 16px 48px ${cfg.glow}` }}
          >
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1" style={{ fontFamily: DS.font.body }}>
                    {period} · {block.time}
                  </p>
                  <h4 className="text-xl font-bold text-white" style={{ fontFamily: DS.font.display }}>
                    The Main Event
                  </h4>
                </div>
                <span className="text-lg font-bold text-white/80" style={{ fontFamily: DS.font.body }}>{block.cost}</span>
              </div>

              <p className="text-white/75 text-sm leading-relaxed" style={{ fontFamily: DS.font.body }}>
                {block.activities}
              </p>

              {evtDetails && (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Doors', value: evtDetails.doors },
                    { label: 'Kick-off', value: evtDetails.startTime },
                    { label: 'Duration', value: evtDetails.duration },
                  ].filter(x => x.value).map((item, i) => (
                    <div key={i} className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
                      <p className="text-[10px] text-white/40 font-semibold mb-1" style={{ fontFamily: DS.font.body }}>{item.label}</p>
                      <p className="text-sm font-bold text-white" style={{ fontFamily: DS.font.body }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="flex items-center gap-1.5 text-xs text-white/40" style={{ fontFamily: DS.font.body }}>
                  <MapPin size={11} />{block.location}
                </span>
                <div className="flex gap-2">
                  {evtDetails?.ticketUrl && (
                    <a href={evtDetails.ticketUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl text-white"
                      style={{ background: cfg.pill, fontFamily: DS.font.body }}>
                      <Ticket size={12} />Tickets
                    </a>
                  )}
                  <a href={mapsUrl(block.location)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-white/90"
                    style={{ background: 'rgba(255,255,255,0.12)', fontFamily: DS.font.body }}>
                    <Navigation size={12} />Map
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex gap-4 sm:gap-6">
      {/* Timeline spine */}
      <div className="flex flex-col items-center flex-shrink-0 w-10">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center z-10"
          style={{
            background: isEventDay ? `rgba(${cfg.accentRgb},0.1)` : '#F1F5F9',
            color: isEventDay ? cfg.accent : DS.color.slate,
          }}
        >
          <PIcon size={18} />
        </div>
        {!isLast && (
          <div className="flex-1 w-px mt-2 min-h-[32px]"
            style={{ background: isEventDay ? `rgba(${cfg.accentRgb},0.15)` : '#E8EAF0' }} />
        )}
      </div>

      {/* Content card */}
      <div className="flex-1 pb-6">
        <div
          className="rounded-3xl border transition-all duration-200 hover:shadow-md overflow-hidden"
          style={{ borderColor: DS.color.border, background: DS.color.white }}
        >
          <div className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5" style={{ fontFamily: DS.font.mono }}>
                  {period} · {block.time || PERIOD_TIMES[period]}
                </p>
                <h4 className="text-base font-semibold text-slate-900" style={{ fontFamily: DS.font.body }}>
                  {block.activities?.split('.')[0]}
                </h4>
              </div>
              <span className="text-base font-bold text-slate-900 flex-shrink-0" style={{ fontFamily: DS.font.body }}>{block.cost}</span>
            </div>

            {/* Full description */}
            <p className="text-sm text-slate-500 leading-relaxed mb-4" style={{ fontFamily: DS.font.body }}>
              {block.activities?.split('.').slice(1).join('.').trim() || block.activities}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full"
                style={{ fontFamily: DS.font.body }}>
                <MapPin size={10} className="flex-shrink-0" />
                <span className="truncate max-w-[160px]">{block.location}</span>
              </span>
              <div className="flex gap-1.5">
                <a href={mapsUrl(block.location)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                  style={{ background: `rgba(${cfg.accentRgb},0.08)`, color: cfg.accent, fontFamily: DS.font.body }}>
                  <Navigation size={11} />Map
                </a>
                <a href={uberUrl(block.location)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                  style={{ fontFamily: DS.font.body }}>
                  <Car size={11} />Uber
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── COMPONENT: EDITORIAL MEAL CARD ────────────────────────────────────────────
function MealCard({ meal, cfg }: { meal: any; cfg: typeof EVENT_CFG[keyof typeof EVENT_CFG] }) {
  return (
    <a
      href={meal.affiliateUrl || `https://www.google.com/search?q=${encodeURIComponent(meal.recommendation + ' ' + meal.location + ' reservations')}`}
      target="_blank" rel="noopener noreferrer"
      className="group flex items-stretch gap-4 p-4 rounded-2xl border hover:border-slate-200 hover:shadow-sm transition-all"
      style={{ borderColor: DS.color.border }}
    >
      {/* Category strip */}
      <div className="w-1 rounded-full flex-shrink-0" style={{ background: cfg.pill }} />

      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1" style={{ fontFamily: DS.font.mono }}>
          {meal.meal}
        </p>
        <p className="font-bold text-slate-900 text-sm truncate" style={{ fontFamily: DS.font.body }}>
          {meal.recommendation}
        </p>
        <p className="text-xs text-slate-400 flex items-center gap-1 mt-1" style={{ fontFamily: DS.font.body }}>
          <MapPin size={10} />{meal.location}
        </p>
      </div>

      <div className="flex flex-col items-end justify-between flex-shrink-0">
        <span className="font-bold text-slate-900 text-sm" style={{ fontFamily: DS.font.body }}>{meal.priceRange}</span>
        <span className="text-xs font-bold flex items-center gap-1 transition-colors group-hover:underline"
          style={{ color: cfg.accent, fontFamily: DS.font.body }}>
          Reserve <ExternalLink size={10} />
        </span>
      </div>
    </a>
  );
}

// ── COMPONENT: AFFILIATE PANEL ────────────────────────────────────────────────
const AFF_ICONS: Record<string, string> = { esim: '📶', insurance: '🛡️', transfer: '🚕', flights: '✈️' };
const AFF_LABELS: Record<string, string> = { esim: 'Stay Connected', insurance: 'Travel Protection', transfer: 'Airport Transfer', flights: 'Flight Protection' };

function AffiliatePanel({ affiliates, triggerDay, cfg }: {
  affiliates: SmartAffiliate[]; triggerDay?: number | 'overview';
  cfg: typeof EVENT_CFG[keyof typeof EVENT_CFG];
}) {
  const filtered = affiliates.filter(a =>
    triggerDay === 'overview' ? a.triggerDay === undefined : a.triggerDay === triggerDay
  );
  if (!filtered.length) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1" style={{ fontFamily: DS.font.body }}>
        What you'll need
      </p>
      {filtered.map(a => (
        <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
          className="group flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-sm hover:border-slate-200"
          style={{ borderColor: DS.color.border }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg"
            style={{ background: '#F8FAFC' }}>
            {AFF_ICONS[a.category] ?? '🔗'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5" style={{ fontFamily: DS.font.mono }}>
              {AFF_LABELS[a.category] ?? a.partner}
            </p>
            <p className="text-sm font-bold text-slate-900 leading-snug" style={{ fontFamily: DS.font.body }}>{a.headline}</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed" style={{ fontFamily: DS.font.body }}>{a.desc}</p>
          </div>
          <span
            className="text-xs font-bold px-4 py-2 rounded-xl text-white flex-shrink-0 group-hover:opacity-90 transition-opacity"
            style={{ background: cfg.pill, fontFamily: DS.font.body }}
          >
            {a.btnLabel}
          </span>
        </a>
      ))}
    </div>
  );
}

// ── COMPONENT: EXPLORE STRIP ──────────────────────────────────────────────────
function ExploreStrip({ city, defaultOpen, cfg }: { city: string; defaultOpen: boolean; cfg: typeof EVENT_CFG[keyof typeof EVENT_CFG] }) {
  const [open, setOpen]         = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState(0);
  const [categories, setCategories] = useState<ExploreCityCategory[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!city) return;
    let dead = false;
    setLoading(true);
    fetch(`/api/explore-city?city=${encodeURIComponent(city)}`)
      .then(r => r.json())
      .then(d => { if (!dead && d.success && d.categories?.length) setCategories(d.categories); else if (!dead) setError('No places found.'); })
      .catch(() => { if (!dead) setError('Could not load places.'); })
      .finally(() => { if (!dead) setLoading(false); });
    return () => { dead = true; };
  }, [city]);

  return (
    <div className="rounded-3xl border overflow-hidden" style={{ borderColor: DS.color.border }}>
      <button
        onClick={() => setOpen(s => !s)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
        style={{ fontFamily: DS.font.body }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `rgba(${cfg.accentRgb},0.08)` }}>
            <Globe size={16} style={{ color: cfg.accent }} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-900">Explore {city}</p>
            <p className="text-xs text-slate-400 mt-0.5">Local restaurants, bars, attractions & more</p>
          </div>
        </div>
        <ChevronDown
          size={16} className="text-slate-400 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
            className="overflow-hidden border-t" style={{ borderColor: DS.color.border }}
          >
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="w-7 h-7 border-2 border-slate-200 rounded-full animate-spin"
                  style={{ borderTopColor: cfg.accent }} />
              </div>
            )}
            {!loading && error && (
              <p className="text-sm text-slate-400 text-center py-8" style={{ fontFamily: DS.font.body }}>{error}</p>
            )}
            {!loading && categories.length > 0 && (
              <div>
                <div className="flex gap-1.5 px-4 py-3 overflow-x-auto">
                  {categories.map((cat, i) => (
                    <button key={cat.label} onClick={() => setActiveTab(i)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0"
                      style={{
                        background: activeTab === i ? cfg.accent : '#F1F5F9',
                        color: activeTab === i ? 'white' : DS.color.slate,
                        fontFamily: DS.font.body,
                      }}>
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(categories[activeTab]?.places ?? []).map((p, i) => (
                    <a key={p.id || i} href={p.link} target="_blank" rel="noopener noreferrer"
                      className="group flex items-start gap-3 p-3.5 rounded-2xl border-2 border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-100 overflow-hidden">
                        {p.icon ? <img src={p.icon} alt="" className="w-5 h-5 opacity-80" /> : <span className="text-base">{categories[activeTab].emoji}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate" style={{ fontFamily: DS.font.body }}>{p.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: DS.font.body }}>{p.category}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {p.distance && <span className="text-[11px] text-slate-400 flex items-center gap-1"><MapPin size={9} />{p.distance}</span>}
                          {p.rating   && <span className="text-[11px] font-bold text-amber-500">★ {p.rating}</span>}
                        </div>
                      </div>
                      <ExternalLink size={11} className="text-slate-300 group-hover:text-slate-500 flex-shrink-0 mt-1 transition-colors" />
                    </a>
                  ))}
                </div>
                <div className="px-5 py-3 border-t text-center" style={{ borderColor: DS.color.border }}>
                  <span className="text-xs text-slate-300" style={{ fontFamily: DS.font.body }}>Powered by Foursquare</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── COMPONENT: TRIP OVERVIEW HEADER ──────────────────────────────────────────
function TripOverview({ data, cfg, startDate, endDate }: {
  data: ItineraryData;
  cfg: typeof EVENT_CFG[keyof typeof EVENT_CFG];
  startDate?: Date | null;
  endDate?: Date | null;
}) {
  const [budgetOpen, setBudgetOpen] = useState(false);
  const anchor = data.eventAnchor;
  if (!anchor) return null;

  return (
    <div className="space-y-6">
      {/* Type tag */}
      <div className="flex items-center gap-2" style={{ fontFamily: DS.font.body }}>
        <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `rgba(${cfg.accentRgb},0.1)` }}>
          <cfg.icon size={14} style={{ color: cfg.accent }} />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: cfg.accent }}>
          {cfg.label} Trip
        </span>
      </div>

      {/* Title */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2" style={{ fontFamily: DS.font.body }}>Your journey to</p>
        <h1
          className="text-4xl sm:text-6xl font-bold text-slate-900 leading-none tracking-tight mb-3"
          style={{ fontFamily: DS.font.display }}
        >
          {anchor.eventName}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400" style={{ fontFamily: DS.font.body }}>
          <span className="flex items-center gap-1.5"><MapPin size={13} />{anchor.venue}</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="flex items-center gap-1.5"><Calendar size={13} />{fmtDate(anchor.eventDate)}</span>
          {startDate && endDate && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-600">
                <Calendar size={11} style={{ color: cfg.accent }} />
                {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' → '}
                {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                <span className="px-1.5 py-0.5 rounded-full text-white text-[10px] font-bold"
                  style={{ background: cfg.accent }}>
                  {Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000)}d
                </span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Overview text */}
      {data.overview && (
        <p className="text-base text-slate-500 leading-relaxed max-w-2xl" style={{ fontFamily: DS.font.body }}>
          {data.overview}
        </p>
      )}

      {/* Stats row */}
      {data.tripSummary.eventPhases && (
        <div className="flex items-stretch w-fit rounded-2xl border overflow-hidden" style={{ borderColor: DS.color.border }}>
          {[
            { val: data.tripSummary.eventPhases.preEvent,  label: 'before',    accent: false },
            { val: '1',                                     label: 'Event Day', accent: true  },
            { val: data.tripSummary.eventPhases.postEvent, label: 'after',     accent: false },
            { val: data.tripSummary.totalDays,             label: 'total days', accent: false },
          ].map((s, i) => (
            <div key={i}
              className="px-5 py-4 border-r last:border-r-0"
              style={{ borderColor: DS.color.border, background: s.accent ? `rgba(${cfg.accentRgb},0.06)` : 'white' }}
            >
              <div className="text-2xl font-bold" style={{ color: s.accent ? cfg.accent : DS.color.ink, fontFamily: DS.font.display }}>
                {s.val}
              </div>
              <div className="text-xs font-medium mt-0.5" style={{ color: s.accent ? cfg.accent : DS.color.muted, fontFamily: DS.font.body }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Budget — behind disclosure */}
      {data.budget?.breakdown && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: DS.color.border }}>
          <button
            onClick={() => setBudgetOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
            style={{ fontFamily: DS.font.body }}
          >
            <div className="flex items-center gap-2">
              <DollarSign size={15} className="text-slate-400" />
              <span className="text-sm font-bold text-slate-700">Budget overview</span>
              <span className="text-sm text-slate-400">· {data.budget.totalBudget} total</span>
            </div>
            <ChevronDown size={15} className="text-slate-400 transition-transform duration-200"
              style={{ transform: budgetOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
          </button>
          <AnimatePresence>
            {budgetOpen && (
              <motion.div
                initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                transition={{ duration: 0.2 }} className="overflow-hidden"
              >
                <div className="grid grid-cols-2 sm:grid-cols-5 border-t" style={{ borderColor: DS.color.border }}>
                  {[
                    { icon: Hotel,    label: 'Stay',       val: data.budget.breakdown.accommodation, accent: false },
                    { icon: Plane,    label: 'Transport',  val: data.budget.breakdown.transport,      accent: false },
                    { icon: Utensils, label: 'Food',       val: data.budget.breakdown.food,           accent: false },
                    { icon: Ticket,   label: 'Event',      val: data.budget.breakdown.event,          accent: true  },
                    { icon: Activity, label: 'Activities', val: data.budget.breakdown.activities,     accent: false },
                  ].map(({ icon: Icon, label, val, accent }) => (
                    <div key={label} className="px-4 py-4 border-r last:border-r-0 border-b sm:border-b-0"
                      style={{ borderColor: DS.color.border, background: accent ? `rgba(${cfg.accentRgb},0.04)` : 'white' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon size={12} style={{ color: accent ? cfg.accent : DS.color.muted }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: DS.color.muted, fontFamily: DS.font.body }}>{label}</span>
                      </div>
                      <p className="text-base font-bold" style={{ color: accent ? cfg.accent : DS.color.ink, fontFamily: DS.font.body }}>{val}</p>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 bg-slate-50 border-t flex justify-between text-xs text-slate-400"
                  style={{ borderColor: DS.color.border, fontFamily: DS.font.body }}>
                  <span>{data.budget.dailyAverage} per day average</span>
                  {data.budget.eventDayCost && <span>Event day: {data.budget.eventDayCost}</span>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function ItineraryView({
  data, startDate, endDate,
}: {
  data?: ItineraryData; startDate?: Date | null; endDate?: Date | null;
}) {
  const [selectedDay, setSelectedDay] = useState(1);
  const city    = data?.eventAnchor?.city ?? data?.tripSummary?.cities?.[0] ?? '';
  const weather = useWeather(city);

  if (!data?.days?.length) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto bg-slate-100">
            <MapPin className="text-slate-400" size={28} />
          </div>
          <p className="text-slate-500 font-semibold" style={{ fontFamily: DS.font.body }}>
            Select an event to see your itinerary
          </p>
        </div>
      </div>
    );
  }

  const rawType  = (data.eventAnchor?.eventType ?? 'other') as string;
  const cfgKey   = rawType as keyof typeof EVENT_CFG;
  const cfg      = EVENT_CFG[cfgKey] ?? EVENT_CFG.other;
  const day      = data.days[selectedDay - 1];
  const isEvent  = day?.isEventDay ?? false;

  // Find event block within current day
  const eventBlockInDay = isEvent
    ? ([day.morning, day.afternoon, day.evening] as any[]).find(b => b?.isEventBlock)
    : null;

  return (
    <>
      {/* Font injection */}
      <style dangerouslySetInnerHTML={{ __html: FONT_STYLE }} />

      <div className="space-y-8" style={{ fontFamily: DS.font.body }}>

        {/* ── TRIP OVERVIEW ──────────────────────────────────────────────── */}
        <TripOverview data={data} cfg={cfg} startDate={startDate} endDate={endDate} />

        {/* Affiliates — overview level */}
        {(data.smartAffiliates ?? []).length > 0 && (
          <AffiliatePanel affiliates={data.smartAffiliates ?? []} triggerDay="overview" cfg={cfg} />
        )}

        {/* ── DAY NAVIGATOR ───────────────────────────────────────────────── */}
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1" style={{ fontFamily: DS.font.body }}>
            Your itinerary
          </p>
          <ChapterNav
            days={data.days}
            selectedDay={selectedDay}
            onSelect={setSelectedDay}
            cfg={cfg}
            weather={weather}
          />
        </div>

        {/* ── DAY CONTENT ─────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            {/* Day label */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400" style={{ fontFamily: DS.font.mono }}>
                  Day {day.day} · {fmtDate(day.date)}
                </p>
                <h2
                  className="text-2xl font-bold text-slate-900 mt-1"
                  style={{ fontFamily: DS.font.display }}
                >
                  {day.theme}
                </h2>
              </div>
              {isEvent && (
                <div
                  className="px-4 py-2 rounded-2xl text-xs font-bold text-white"
                  style={{ background: cfg.pill, fontFamily: DS.font.body }}
                >
                  ★ Event Day
                </div>
              )}
            </div>

            {/* Event day — cinematic hero */}
            {isEvent && data.eventAnchor && (
              <EventDayHero data={data} cfg={cfg} weather={weather} />
            )}

            {/* Event day tools */}
            {isEvent && data.eventAnchor && (() => {
              const ticketUrl = eventBlockInDay?.eventDetails?.ticketUrl;
              const eventTime = eventBlockInDay?.time;
              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <SeatMapViewer eventName={data.eventAnchor.eventName} venue={data.eventAnchor.venue} ticketUrl={ticketUrl} accentColor={cfg.accent} />
                    <VenueDirections venue={data.eventAnchor.venue} city={data.eventAnchor.city} eventName={data.eventAnchor.eventName} eventDate={data.eventAnchor.eventDate} eventTime={eventTime} accentColor={cfg.accent} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <LiveMatchTracker
                      eventType={(() => { const r = (data.eventAnchor.eventType ?? 'sports') as string; if (r === 'festivals') return 'festival'; if (['sports','music','festival','other'].includes(r)) return r as any; return 'other'; })()}
                      eventName={data.eventAnchor.eventName} eventDate={data.eventAnchor.eventDate}
                      fixtureId={data.eventAnchor.fixtureId} attraction={data.eventAnchor.attraction} accentColor={cfg.accent}
                    />
                    <ImHereMode venue={data.eventAnchor.venue} city={data.eventAnchor.city} eventName={data.eventAnchor.eventName} eventDate={data.eventAnchor.eventDate} eventTime={eventTime} accentColor={cfg.accent} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ParkingHub venue={data.eventAnchor.venue} city={data.eventAnchor.city} eventDate={data.eventAnchor.eventDate} accentColor={cfg.accent} />
                    <PreEventChecklist eventName={data.eventAnchor.eventName} eventDate={data.eventAnchor.eventDate} eventTime={eventTime} venue={data.eventAnchor.venue} city={data.eventAnchor.city} ticketUrl={ticketUrl} accentColor={cfg.accent} />
                  </div>
                </div>
              );
            })()}

            {/* Event day intel brief */}
            {isEvent && day.tips && day.tips.length > 0 && (
              <IntelBrief tips={day.tips} cfg={cfg} eventType={rawType === 'festivals' ? 'festival' : rawType} />
            )}

            {/* ── TIMELINE ──────────────────────────────────────────────── */}
            <div>
              {(['morning', 'afternoon', 'evening'] as const).map((period, idx, arr) => {
                const block      = day[period] as TimeBlock | EventBlock;
                const isEvtBlock = 'isEventBlock' in block && !!block.isEventBlock;
                const label      = (period.charAt(0).toUpperCase() + period.slice(1)) as 'Morning' | 'Afternoon' | 'Evening';
                return (
                  <TimelineBlock
                    key={period}
                    period={label}
                    block={block}
                    isEventDay={isEvent}
                    isEventBlock={isEvtBlock}
                    cfg={cfg}
                    isLast={idx === arr.length - 1}
                  />
                );
              })}
            </div>

            {/* ── MEALS ──────────────────────────────────────────────────── */}
            {(day.mealsAndDining ?? []).length > 0 && (
              <div className="rounded-3xl border overflow-hidden" style={{ borderColor: DS.color.border }}>
                <div className="px-5 py-4 flex items-center gap-2 border-b bg-slate-50" style={{ borderColor: DS.color.border }}>
                  <UtensilsCrossed size={14} className="text-slate-400" />
                  <span className="font-bold text-slate-900 text-sm" style={{ fontFamily: DS.font.body }}>
                    Where to eat today
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  {(day.mealsAndDining ?? []).map((meal: any, i: number) => (
                    <MealCard key={i} meal={meal} cfg={cfg} />
                  ))}
                </div>
              </div>
            )}

            {/* ── EXPLORE CITY ──────────────────────────────────────────── */}
            {day.city && (
              <ExploreStrip city={day.city} defaultOpen={!isEvent} cfg={cfg} />
            )}

            {/* ── NON-EVENT-DAY TIPS ────────────────────────────────────── */}
            {!isEvent && (day.tips ?? []).length > 0 && (
              <div
                className="rounded-3xl p-5 space-y-3"
                style={{ background: `rgba(${cfg.accentRgb},0.04)`, border: `1.5px solid rgba(${cfg.accentRgb},0.12)` }}
              >
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: cfg.accent, fontFamily: DS.font.body }}>
                  Insider tips
                </p>
                {(day.tips ?? []).map((tip: string, i: number) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-xs font-bold tabular-nums mt-0.5 flex-shrink-0"
                      style={{ color: cfg.accent, fontFamily: DS.font.mono }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="text-sm text-slate-600 leading-relaxed" style={{ fontFamily: DS.font.body }}>{tip}</p>
                  </div>
                ))}
              </div>
            )}

            {/* ── DAY-SPECIFIC AFFILIATES ───────────────────────────────── */}
            {(data.smartAffiliates ?? []).length > 0 && (
              <AffiliatePanel affiliates={data.smartAffiliates!} triggerDay={day.day} cfg={cfg} />
            )}

            {/* ── DAY COST ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between py-4 border-t" style={{ borderColor: DS.color.border }}>
              <span className="text-sm text-slate-400" style={{ fontFamily: DS.font.body }}>
                {isEvent ? "Today's total · incl. event" : "Today's estimated spend"}
              </span>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: DS.font.display }}>
                  {isEvent && data.budget.eventDayCost ? data.budget.eventDayCost : data.budget.dailyAverage}
                </p>
                <p className="text-xs text-slate-400" style={{ fontFamily: DS.font.body }}>per person</p>
              </div>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}