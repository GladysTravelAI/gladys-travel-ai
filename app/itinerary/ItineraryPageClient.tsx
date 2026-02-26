"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Download, Share2, ArrowLeft, MapPin, Calendar, Clock,
  Trophy, Music, PartyPopper, Sparkles, Hotel, Plane,
  Utensils, Ticket, Activity, CheckCircle, Navigation,
  ExternalLink, Sun, Sunset, Moon, UtensilsCrossed, Star,
  ShoppingBag, Printer, Globe
} from "lucide-react";
import Link from "next/link";
import type { ItineraryData, DayPlan, TimeBlock, EventBlock } from "@/lib/mock-itinerary";

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const SKY       = '#0EA5E9';
const SKY_DARK  = '#0284C7';
const SKY_LIGHT = '#F0F9FF';
const SKY_MID   = '#BAE6FD';

const EVENT_CFG = {
  sports:   { icon: Trophy,      accent: SKY,       accentLight: SKY_LIGHT, accentBorder: SKY_MID,    label: 'Sports Event', hero: 'linear-gradient(135deg,#0C4A6E,#0369A1,#0EA5E9)', pill: 'linear-gradient(135deg,#38BDF8,#0284C7)' },
  music:    { icon: Music,       accent: '#8B5CF6',  accentLight: '#F5F3FF', accentBorder: '#DDD6FE',  label: 'Music Event',  hero: 'linear-gradient(135deg,#2E1065,#6D28D9,#8B5CF6)', pill: 'linear-gradient(135deg,#A78BFA,#7C3AED)' },
  festivals:{ icon: PartyPopper, accent: '#F97316',  accentLight: '#FFF7ED', accentBorder: '#FED7AA',  label: 'Festival',     hero: 'linear-gradient(135deg,#431407,#C2410C,#F97316)', pill: 'linear-gradient(135deg,#FB923C,#EA580C)' },
  other:    { icon: Sparkles,    accent: SKY,        accentLight: SKY_LIGHT, accentBorder: SKY_MID,    label: 'Event',        hero: 'linear-gradient(135deg,#0C4A6E,#0369A1,#0EA5E9)', pill: 'linear-gradient(135deg,#38BDF8,#0284C7)' },
};

const TIME_ICONS = { Morning: Sun, Afternoon: Sunset, Evening: Moon };

function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
}
function fmtShort(d: string) {
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch { return d; }
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function ItineraryPageClient() {
  const router = useRouter();
  const [data, setData] = useState<ItineraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('gladys-itinerary-current');
      if (stored) setData(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to load itinerary:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePrint = () => window.print();

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: data?.eventAnchor?.eventName ? `My trip to ${data.eventAnchor.eventName}` : 'My Gladys Travel Itinerary',
          text: `Check out my travel itinerary${data?.eventAnchor?.eventName ? ` for ${data.eventAnchor.eventName}` : ''}, planned by Gladys AI!`,
          url,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: SKY, borderTopColor: 'transparent' }} />
          <p className="text-slate-500 font-semibold">Loading your itinerary…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-sm mx-auto px-6">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6" style={{ background: SKY_LIGHT }}>
            <MapPin size={36} style={{ color: SKY }} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">No Itinerary Found</h2>
          <p className="text-slate-400 mb-8">Go back and search for an event to generate your itinerary.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#38BDF8,#0284C7)' }}>
            <ArrowLeft size={18} />Back to Gladys
          </Link>
        </div>
      </div>
    );
  }

  const cfg = data.eventAnchor ? EVENT_CFG[data.eventAnchor.eventType as keyof typeof EVENT_CFG] ?? EVENT_CFG.other : EVENT_CFG.other;
  const EventIcon = cfg.icon;

  return (
    <>
      {/* ── PRINT STYLES ──────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
        * { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-page { max-width: 100% !important; padding: 0 !important; }
        }
      `}</style>

      <div className="min-h-screen bg-white">

        {/* ── STICKY ACTION BAR (screen only) ───────────────────────────── */}
        <div className="no-print sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-semibold text-sm">
              <ArrowLeft size={18} />
              <span>Back to Gladys</span>
            </Link>

            <div className="flex items-center gap-2">
              {/* Event pill */}
              {data.eventAnchor && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white"
                  style={{ background: cfg.pill }}>
                  <EventIcon size={12} />
                  {data.eventAnchor.eventName}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={handleShare}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:border-sky-300 hover:text-sky-600 transition-all">
                {copying ? <><CheckCircle size={15} className="text-emerald-500" />Copied!</> : <><Share2 size={15} />Share</>}
              </button>
              <button onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#38BDF8,#0284C7)' }}>
                <Download size={15} />Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
        <div ref={printRef} className="print-page max-w-4xl mx-auto px-4 py-10">

          {/* ── PRINT HEADER (only shows in print) ───────────────────────── */}
          <div className="hidden print:flex items-center justify-between mb-8 pb-6 border-b-2 border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#38BDF8,#0284C7)' }}>
                <Globe size={20} className="text-white" />
              </div>
              <div>
                <p className="font-black text-slate-900">Gladys Travel AI</p>
                <p className="text-xs text-slate-400">gladystravel.com</p>
              </div>
            </div>
            <p className="text-xs text-slate-400">Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>

          {/* ── HERO ─────────────────────────────────────────────────────── */}
          {data.eventAnchor && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
              {/* Event type pill */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white mb-5"
                style={{ background: cfg.pill }}>
                <EventIcon size={14} />{cfg.label}
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none mb-4">
                {data.eventAnchor.eventName}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-6">
                <span className="flex items-center gap-1.5"><MapPin size={13} />{data.eventAnchor.venue}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1.5"><Calendar size={13} />{fmtDate(data.eventAnchor.eventDate)}</span>
              </div>
              <p className="text-base text-slate-500 max-w-2xl leading-relaxed">{data.overview}</p>
            </motion.div>
          )}

          {/* ── SUMMARY STRIP ─────────────────────────────────────────────── */}
          {data.tripSummary.eventPhases && (
            <div className="flex items-stretch rounded-2xl border-2 border-slate-100 overflow-hidden bg-white shadow-sm mb-8">
              {[
                { v: data.tripSummary.eventPhases.preEvent,  l: 'days before',  hi: false },
                { v: 1,                                       l: 'Event Day',    hi: true  },
                { v: data.tripSummary.eventPhases.postEvent, l: 'days after',   hi: false },
                { v: data.budget.totalBudget.replace('USD ','').replace('$',''), l: 'est. total', hi: false },
                { v: data.tripSummary.totalDays,             l: 'total days',   hi: false },
              ].map((s, i) => (
                <div key={i} className="flex-1 px-4 py-4 border-r border-slate-100 last:border-r-0 text-center"
                  style={{ background: s.hi ? SKY_LIGHT : 'white' }}>
                  <div className="text-2xl font-black" style={{ color: s.hi ? cfg.accent : '#0F172A' }}>{s.v}</div>
                  <div className="text-xs font-semibold mt-0.5" style={{ color: s.hi ? cfg.accent : '#94A3B8' }}>{s.l}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── BUDGET BREAKDOWN ──────────────────────────────────────────── */}
          {data.budget.breakdown && (
            <div className="rounded-3xl border-2 border-slate-100 overflow-hidden mb-10">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="font-black text-slate-900 text-sm">Budget Breakdown</span>
                <span className="text-xs text-slate-400 font-semibold">{data.budget.dailyAverage} avg/day</span>
              </div>
              <div className="grid grid-cols-5 divide-x divide-slate-100">
                {[
                  { icon: Hotel,    label: 'Stay',       v: data.budget.breakdown.accommodation, e: false },
                  { icon: Plane,    label: 'Transport',  v: data.budget.breakdown.transport,      e: false },
                  { icon: Utensils, label: 'Food',       v: data.budget.breakdown.food,           e: false },
                  { icon: Ticket,   label: 'Event',      v: data.budget.breakdown.event,          e: true  },
                  { icon: Activity, label: 'Activities', v: data.budget.breakdown.activities,     e: false },
                ].map(({ icon: Icon, label, v, e }) => (
                  <div key={label} className="px-4 py-4" style={{ background: e ? cfg.accentLight : 'white' }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Icon size={12} style={{ color: e ? cfg.accent : '#94A3B8' }} />
                      <span className="text-xs text-slate-400 font-semibold">{label}</span>
                    </div>
                    <div className="text-base font-black" style={{ color: e ? cfg.accent : '#0F172A' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── DAYS ──────────────────────────────────────────────────────── */}
          <div className="space-y-10">
            {data.days.map((day: DayPlan, idx: number) => (
              <DaySection key={day.day} day={day} cfg={cfg} isLast={idx === data.days.length - 1} />
            ))}
          </div>

          {/* ── FOOTER ────────────────────────────────────────────────────── */}
          <div className="mt-16 pt-8 border-t-2 border-slate-100">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#38BDF8,#0284C7)' }}>
                  <Globe size={16} className="text-white" />
                </div>
                <div>
                  <p className="font-black text-slate-900 text-sm">Gladys Travel AI</p>
                  <p className="text-xs text-slate-400">Intelligent AI travel planning · gladystravel.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-300">
                <span>hello@gladystravel.com</span>
                <span>·</span>
                <span>Generated {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
            {data.eventAnchor && (
              <p className="text-xs text-slate-300 mt-4 leading-relaxed max-w-2xl">
                GladysTravelAI is an independent travel planning service and is not affiliated with, endorsed by, or sponsored by the event organizers. All event names and trademarks are the property of their respective owners. Prices are estimates only.
              </p>
            )}
          </div>
        </div>

        {/* ── BOTTOM DOWNLOAD BAR (screen only) ───────────────────────────── */}
        <div className="no-print fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-4 flex items-center justify-center gap-3 sm:hidden">
          <button onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-bold text-sm">
            <Share2 size={16} />Share
          </button>
          <button onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg,#38BDF8,#0284C7)' }}>
            <Download size={16} />Download PDF
          </button>
        </div>
      </div>
    </>
  );
}

// ── DAY SECTION ───────────────────────────────────────────────────────────────
function DaySection({ day, cfg, isLast }: { day: DayPlan; cfg: typeof EVENT_CFG[keyof typeof EVENT_CFG]; isLast: boolean }) {
  const EventIcon = cfg.icon;
  const accentColor = cfg.accent;

  return (
    <div className={`${!isLast ? 'pb-10 border-b-2 border-slate-50' : ''} print-break-avoid`}>
      {/* Day header */}
      <div className="rounded-3xl p-6 mb-6"
        style={{ background: day.isEventDay ? cfg.hero : '#F8FAFC', border: day.isEventDay ? 'none' : '2px solid #F1F5F9' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            {day.isEventDay && (
              <p className="text-xs font-black uppercase tracking-widest text-white/60 mb-2">★ Main Event</p>
            )}
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full text-white"
                style={{ background: day.isEventDay ? 'rgba(255,255,255,0.2)' : cfg.pill }}>
                {day.label}
              </span>
            </div>
            <h2 className={`text-2xl font-black tracking-tight mt-2 ${day.isEventDay ? 'text-white' : 'text-slate-900'}`}>
              {day.theme}
            </h2>
            <div className={`flex flex-wrap gap-4 mt-2 text-sm ${day.isEventDay ? 'text-white/50' : 'text-slate-400'}`}>
              <span className="flex items-center gap-1.5"><Calendar size={13} />{fmtDate(day.date)}</span>
              <span className="flex items-center gap-1.5"><MapPin size={13} />{day.city}</span>
            </div>
          </div>
          {day.isEventDay && (
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/20 flex-shrink-0">
              <EventIcon size={22} className="text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Time blocks */}
      <div className="space-y-4 mb-6">
        {(['Morning', 'Afternoon', 'Evening'] as const).map(period => {
          const block = day[period.toLowerCase() as 'morning' | 'afternoon' | 'evening'];
          if (!block) return null;
          return (
            <TimeBlockRow key={period} period={period} block={block} isEventDay={day.isEventDay} cfg={cfg} />
          );
        })}
      </div>

      {/* Dining */}
      {day.mealsAndDining && day.mealsAndDining.length > 0 && (
        <div className="rounded-2xl border-2 border-slate-100 overflow-hidden mb-5">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <UtensilsCrossed size={14} className="text-slate-400" />
            <span className="font-black text-slate-900 text-sm">Where to eat</span>
          </div>
          <div className="divide-y divide-slate-50">
            {day.mealsAndDining.map((meal: any, i: number) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">{meal.meal}</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{meal.recommendation}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin size={10} />{meal.location}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900 text-sm">{meal.priceRange}</p>
                  <button className="text-xs font-bold flex items-center gap-1 mt-1" style={{ color: accentColor }}>
                    Reserve <ExternalLink size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      {day.tips && day.tips.length > 0 && (
        <div className="rounded-2xl p-5"
          style={{ background: cfg.accentLight, border: `2px solid ${cfg.accentBorder}` }}>
          <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: accentColor }}>
            {day.isEventDay ? '★ Event Day Tips' : 'Tips for today'}
          </p>
          <ul className="space-y-2">
            {day.tips.map((tip: string, i: number) => (
              <li key={i} className="flex gap-3 text-sm text-slate-700">
                <span className="font-black flex-shrink-0" style={{ color: accentColor }}>—</span>{tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── TIME BLOCK ROW ────────────────────────────────────────────────────────────
function TimeBlockRow({ period, block, isEventDay, cfg }: {
  period: 'Morning' | 'Afternoon' | 'Evening';
  block: TimeBlock | EventBlock;
  isEventDay: boolean;
  cfg: typeof EVENT_CFG[keyof typeof EVENT_CFG];
}) {
  const isEventBlock = 'isEventBlock' in block && block.isEventBlock;
  const eventDetails = 'eventDetails' in block ? block.eventDetails : null;
  const PeriodIcon = TIME_ICONS[period];

  if (isEventBlock) {
    return (
      <div className="rounded-3xl p-6 text-white relative overflow-hidden shadow-xl"
        style={{ background: cfg.hero }}>
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{ background: `radial-gradient(ellipse at 70% 50%, ${cfg.accent}, transparent 70%)` }} />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Star size={13} className="fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-black uppercase tracking-widest text-white/50">The Main Event</span>
              </div>
              <h3 className="text-xl font-black">{period}</h3>
              <div className="flex items-center gap-1.5 text-white/50 text-xs mt-1">
                <Clock size={11} />{block.time}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black">{block.cost}</div>
              <div className="text-xs text-white/40">incl. ticket</div>
            </div>
          </div>

          <p className="text-white/80 text-sm leading-relaxed mb-5">{block.activities}</p>

          {eventDetails && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { l: 'Doors',    v: eventDetails.doors },
                { l: 'Kickoff',  v: eventDetails.startTime },
                { l: 'Duration', v: eventDetails.duration },
              ].filter(x => x.v).map((item, i) => (
                <div key={i} className="rounded-xl p-3 bg-white/10">
                  <p className="text-white/40 text-xs font-semibold">{item.l}</p>
                  <p className="text-white font-black text-sm mt-0.5">{item.v}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <div className="flex items-center gap-1.5 text-white/50 text-xs">
              <MapPin size={11} />{block.location}
            </div>
            <div className="flex gap-2 no-print">
              {eventDetails?.ticketUrl && (
                <a href={eventDetails.ticketUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-xl text-white"
                  style={{ background: cfg.pill }}>
                  <Ticket size={12} />Get Tickets
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

  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0">
        <div className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center"
          style={{ background: isEventDay ? cfg.pill : '#F1F5F9', color: isEventDay ? 'white' : '#94A3B8' }}>
          <PeriodIcon size={20} />
        </div>
      </div>
      <div className="flex-1 bg-white border-2 border-slate-100 rounded-3xl p-5 hover:border-slate-200 transition-colors">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-black text-slate-900">{period}</h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
              <Clock size={11} />{block.time}
            </div>
          </div>
          <span className="text-lg font-black text-slate-900 flex-shrink-0">{block.cost}</span>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed mb-4">{block.activities}</p>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">
            <MapPin size={10} />{block.location}
          </div>
          <div className="flex gap-2 no-print">
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