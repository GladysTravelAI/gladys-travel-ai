"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Sparkles, Trophy, Music, PartyPopper,
  Loader2, ExternalLink, TrendingUp, Calendar, MapPin,
  Plane, Hotel, Bookmark, Mic, Settings, CloudRain,
  ArrowRight, ChevronDown, Ticket, Shield, CheckCircle,
  Globe, Users, Zap, Star, Download
} from "lucide-react";
import { toast } from "sonner";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventNotificationToast from '@/components/EventNotificationToast';
import HotelResults from "@/components/HotelResults";
import FlightResults from "@/components/FlightResults";
import ItineraryView from "@/components/ItineraryView";
import MapsDirections from "@/components/MapsDirections";
import TripSummary from "@/components/TripSummary";
import WeatherWidget from "@/components/WeatherWidget";
import VoiceTripPlanner from "@/components/VoiceTripPlanner";
import SavedTrips from "@/components/SavedTrips";
import GladysChat from "@/components/GladysChat";
import CityPicker from "@/components/CityPicker";

import { ItineraryData } from "@/lib/mock-itinerary";
import { profileManager } from "@/lib/userProfile";
import { useAuth } from "@/lib/AuthContext";
import { TripPreferences } from "@/components/TripRefinementModal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface SavedItem {
  id: string;
  type: 'hotel' | 'flight' | 'restaurant' | 'activity';
  name: string; price: string; location?: string; date?: string;
  image?: string; affiliateUrl: string; partner: string; description?: string;
}

interface AgentResponse {
  intent: 'event_trip' | 'destination_trip' | 'information_only' | 'city_selection_required';
  destination?: { city: string | null; country: string | null; };
  event?: {
    name: string | null; type: 'sports' | 'music' | 'festival' | 'conference' | 'other' | null;
    date: string | null; venue: string | null; image?: string | null;
    ticketUrl?: string | null; priceMin?: number | null; priceMax?: number | null;
    currency?: string | null; attraction?: string | null; time?: string | null;
  };
  itinerary: Array<{ day: number; title: string; activities: string[]; }>;
  hotels: any[]; flights: any[];
  affiliate_links: { hotel: string; flight: string; tickets: string; };
  upsells: { insurance: boolean; esim: boolean; };
  message: string;
  budget?: {
    accommodation: number; transport: number; food: number;
    event_tickets: number; activities: number; total: number;
    currency: string; per_day_average: number;
  };
  travel_dates?: {
    arrival_date: string; departure_date: string; total_nights: number;
    day_slots: Array<{ date: string; day_type: string; label: string; }>;
  };
  event_id?: string; event_name?: string;
  cities?: Array<{
    city_id: string; name: string; country: string; iata_code: string;
    sessions: Array<{ session_id: string; date: string; time?: string; round?: string; description?: string; }>;
  }>;
}

interface LiveEvent {
  id: string; name: string;
  category: 'sports' | 'music' | 'festival' | 'other';
  date: string; time?: string; venue: string; city: string; country: string;
  image?: string; ticketUrl?: string; priceMin?: number;
  currency?: string; attraction?: string; rank?: number;
}

type EventType = 'sports' | 'music' | 'festivals' | null;

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────

const SKY = '#0EA5E9';
const SKY_DARK = '#0284C7';
const SKY_LIGHT = '#E0F2FE';
const SKY_MID = '#BAE6FD';

const EVENT_CFG = {
  sports:   { accent: SKY,       bg: '#F0F9FF', border: '#BAE6FD', label: 'Sports',   Icon: Trophy,      placeholder: 'NBA Finals, World Cup, Wimbledon...' },
  music:    { accent: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', label: 'Music',    Icon: Music,       placeholder: 'Taylor Swift, Coachella, Glastonbury...' },
  festivals:{ accent: '#F97316', bg: '#FFF7ED', border: '#FED7AA', label: 'Festivals',Icon: PartyPopper, placeholder: 'Rio Carnival, Oktoberfest, Burning Man...' },
};

const SAMPLE_TRIPS = [
  { event: 'Coachella 2025', category: 'music' as const, where: 'Indio, CA', nights: '4 nights', total: 'USD 2,840', saved: '23% cheaper', breakdown: { Tickets: 899, Flights: 620, Hotel: 980, Activities: 341 } },
  { event: 'UEFA Champions League Final', category: 'sports' as const, where: 'Munich, Germany', nights: '3 nights', total: 'USD 3,210', saved: '18% cheaper', breakdown: { Tickets: 1200, Flights: 890, Hotel: 780, Activities: 340 } },
  { event: 'Rio Carnival', category: 'festivals' as const, where: 'Rio de Janeiro', nights: '5 nights', total: 'USD 2,190', saved: '31% cheaper', breakdown: { Tickets: 320, Flights: 780, Hotel: 750, Activities: 340 } },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function fmt(n: number, cur = 'USD') {
  return `${cur} ${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}
function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
}
function catColor(cat: string) {
  if (cat === 'sports') return SKY;
  if (cat === 'music' || cat === 'festival') return '#8B5CF6';
  return '#F97316';
}
function catBg(cat: string) {
  if (cat === 'sports') return '#F0F9FF';
  if (cat === 'music' || cat === 'festival') return '#F5F3FF';
  return '#FFF7ED';
}

// ─── ANIMATED COUNTER ─────────────────────────────────────────────────────────

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const ran = useRef(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !ran.current) {
        ran.current = true;
        let cur = 0; const step = to / 60;
        const t = setInterval(() => { cur += step; if (cur >= to) { setVal(to); clearInterval(t); } else setVal(Math.floor(cur)); }, 16);
      }
    });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ─── LIVE EVENT CARD ──────────────────────────────────────────────────────────

function EventCard({ ev, onSearch }: { ev: LiveEvent; onSearch: (n: string) => void }) {
  const color = catColor(ev.category);
  const bg = catBg(ev.category);
  const CatIcon = ev.category === 'sports' ? Trophy : ev.category === 'music' ? Music : PartyPopper;

  return (
    <div
      onClick={() => onSearch(ev.name)}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-slate-200 hover:shadow-xl transition-all duration-300"
      style={{ transform: 'translateY(0)', transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease' }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <div className="relative h-44 overflow-hidden bg-slate-100">
        {ev.image
          ? <img src={ev.image} alt={ev.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center" style={{ background: bg }}>
              <CatIcon size={40} style={{ color, opacity: 0.4 }} />
            </div>
        }
        <div className="absolute top-3 left-3 flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-white shadow-sm" style={{ color }}>
          <CatIcon size={11} />{ev.category === 'festival' ? 'Festival' : ev.category.charAt(0).toUpperCase() + ev.category.slice(1)}
        </div>
        {ev.rank && ev.rank > 70 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-white shadow-sm text-slate-600">
            <TrendingUp size={10} />Hot
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1 line-clamp-2">{ev.name}</h3>
        {ev.attraction && <p className="text-xs mb-2 font-medium line-clamp-1" style={{ color }}>{ev.attraction}</p>}
        <div className="space-y-1 mb-4">
          <p className="flex items-center gap-1.5 text-xs text-slate-400"><Calendar size={11} />{fmtDate(ev.date)}</p>
          <p className="flex items-center gap-1.5 text-xs text-slate-400"><MapPin size={11} />{ev.venue ? `${ev.venue}, ` : ''}{ev.city}</p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onSearch(ev.name); }}
          className="w-full py-2.5 text-xs font-bold rounded-xl transition-all text-white flex items-center justify-center gap-1.5"
          style={{ background: color }}
        >
          <Sparkles size={12} />Plan This Trip
        </button>
      </div>
    </div>
  );
}

// ─── SAMPLE TRIP CARD ─────────────────────────────────────────────────────────

function SampleCard({ trip }: { trip: typeof SAMPLE_TRIPS[0] }) {
  const [open, setOpen] = useState(false);
  const color = catColor(trip.category);
  const bg = catBg(trip.category);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-1.5" style={{ background: color }} />
      <div className="p-5 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ color, background: bg }}>{trip.category}</span>
            <h3 className="text-lg font-black text-slate-900 mt-2 leading-tight">{trip.event}</h3>
            <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-1"><MapPin size={12} />{trip.where} · {trip.nights}</p>
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <p className="text-2xl font-black text-slate-900">{trip.total}</p>
            <p className="text-xs text-slate-400">per person</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1" style={{ color, background: bg }}>
            <TrendingUp size={11} />{trip.saved}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            {open ? 'Hide' : 'See'} breakdown <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </span>
        </div>
        {open && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-4 gap-3 text-center">
            {Object.entries(trip.breakdown).map(([k, v]) => (
              <div key={k}><p className="font-bold text-slate-900">${v}</p><p className="text-xs text-slate-400">{k}</p></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── EVENT HERO (results) ─────────────────────────────────────────────────────

function EventHero({ event, budget, ticketsUrl }: { event: AgentResponse['event']; budget?: AgentResponse['budget']; ticketsUrl?: string }) {
  if (!event?.name) return null;
  const color = catColor(event.type || 'other');
  const bg = catBg(event.type || 'other');
  const CatIcon = event.type === 'sports' ? Trophy : event.type === 'music' ? Music : PartyPopper;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm mb-6">
      <div className="h-1.5" style={{ background: color }} />
      {event.image && (
        <div className="relative h-48 sm:h-64 overflow-hidden">
          <img src={event.image} alt={event.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}
      <div className="p-5 sm:p-8">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mb-3" style={{ color, background: bg }}>
          <CatIcon size={12} />{(event.type || 'event').charAt(0).toUpperCase() + (event.type || 'event').slice(1)} Event
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 mb-1 leading-tight">{event.name}</h1>
        {event.attraction && event.attraction !== event.name && (
          <p className="text-base font-semibold mb-3" style={{ color }}>{event.attraction}</p>
        )}
        <div className="flex flex-wrap gap-4 mb-5 text-slate-500 text-sm">
          {event.date && <span className="flex items-center gap-1.5"><Calendar size={14} />{fmtDate(event.date)}{event.time && ` · ${event.time}`}</span>}
          {event.venue && <span className="flex items-center gap-1.5"><MapPin size={14} />{event.venue}</span>}
        </div>
        <div className="flex flex-wrap gap-3">
          {(event.ticketUrl || ticketsUrl) && (
            <a href={event.ticketUrl || ticketsUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: color }}>
              <Ticket size={15} />Buy Tickets{event.priceMin && ` · From ${event.currency || 'USD'} ${event.priceMin}`}<ExternalLink size={13} />
            </a>
          )}
          {budget && (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border border-slate-200 text-slate-600">
              Full trip: <span className="font-black text-slate-900">{fmt(budget.total, budget.currency)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function HomeClient() {
  const router = useRouter();
  const { user } = useAuth();

  // Search state
  const [eventType, setEventType] = useState<EventType>(null);
  const [query, setQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const origin = 'Johannesburg, South Africa';

  // Results state
  const [response, setResponse] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('itinerary');

  // ── Itinerary is now proper async state (not computed from agent response) ──
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
  const [itineraryLoading, setItineraryLoading] = useState(false);

  // UI modals
  const [showSummary, setShowSummary] = useState(false);
  const [showMaps, setShowMaps] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [savedItems, setSavedItems] = useState<{ hotels: SavedItem[]; flights: SavedItem[]; restaurants: SavedItem[]; activities: SavedItem[]; }>({ hotels: [], flights: [], restaurants: [], activities: [] });

  // Live events
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'sports' | 'music' | 'festival'>('all');

  // Date inputs visible
  const [showDates, setShowDates] = useState(false);

  useEffect(() => {
    fetch('/api/featured-events').then(r => r.json())
      .then(d => { if (d.success) setEvents(d.events); })
      .catch(console.error)
      .finally(() => setEventsLoading(false));
  }, []);

  const cfg = eventType ? EVENT_CFG[eventType] : null;
  const totalSaved = Object.values(savedItems).reduce((s, a) => s + a.length, 0);
  const destination = response?.destination?.city || '';
  const filtered = activeFilter === 'all' ? events : events.filter(e => e.category === activeFilter || (activeFilter === 'festival' && e.category === 'festival'));

  // Persist itinerary to localStorage whenever it updates (for /itinerary download page)
  useEffect(() => {
    if (itineraryData) {
      try { localStorage.setItem('gladys-itinerary-current', JSON.stringify(itineraryData)); } catch {}
    }
  }, [itineraryData]);

  const handleSave = async (item: any, type: 'hotel' | 'flight' | 'restaurant' | 'activity') => {
    const si: SavedItem = { id: item.id?.toString() || Math.random().toString(), type, name: item.name || 'Unnamed', price: item.price?.toString() || '$0', location: item.location || '', date: item.date || '', image: item.image || '', affiliateUrl: item.bookingUrl || '#', partner: item.partner || 'TravelPayouts', description: item.description || '' };
    setSavedItems(prev => {
      const k = `${type}s` as keyof typeof prev;
      const cur = prev[k] || [];
      if (cur.some(i => i.id === si.id)) { toast.success('Removed'); return { ...prev, [k]: cur.filter(i => i.id !== si.id) }; }
      toast.success('Saved!', { action: { label: 'View', onClick: () => setShowSummary(true) } });
      return { ...prev, [k]: [...cur, si] };
    });
  };

  const handleRemove = (type: string, id: string) => {
    setSavedItems(prev => { const k = (type + 's') as keyof typeof prev; return { ...prev, [k]: (prev[k] || []).filter((i: SavedItem) => i.id !== id) }; });
  };

  // ── Helper: call /api/itinerary and set state ──────────────────────────────
  const generateItinerary = async (agentData: AgentResponse) => {
    if (!agentData.event?.name) return;
    setItineraryLoading(true);
    try {
      const ev = agentData.event;
      const res = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName:    ev.name,
          eventDate:    ev.date,
          eventVenue:   ev.venue || agentData.destination?.city || '',
          eventCity:    agentData.destination?.city || '',
          eventCountry: agentData.destination?.country || '',
          eventType:    ev.type === 'festival' ? 'festivals' : ev.type === 'music' ? 'music' : 'sports',
          ticketUrl:    ev.ticketUrl || agentData.affiliate_links?.tickets || null,
          days:         5,
          budget:       'mid',
          groupSize:    1,
          startDate:    agentData.travel_dates?.arrival_date,
          endDate:      agentData.travel_dates?.departure_date,
        })
      });
      const data = await res.json();
      if (!data.days?.length) return;

      // Merge real budget numbers from agent into itinerary display
      if (agentData.budget) {
        const b = agentData.budget;
        const cur = b.currency || 'USD';
        const f = (n: number) => `${cur} ${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        data.budget = {
          totalBudget:  f(b.total),
          dailyAverage: f(b.per_day_average),
          eventDayCost: f(b.event_tickets + b.per_day_average),
          breakdown: {
            accommodation: f(b.accommodation),
            transport:     f(b.transport),
            food:          f(b.food),
            event:         f(b.event_tickets),
            activities:    f(b.activities),
          }
        };
      }

      setItineraryData(data as ItineraryData);
    } catch (err) {
      console.warn('Itinerary generation failed:', err);
    } finally {
      setItineraryLoading(false);
    }
  };

  const handleCitySelect = async (params: any) => {
    setLoading(true);
    setItineraryData(null);
    const t = toast.loading('Building trip...');
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, ...params, budget_level: 'mid', origin_country_code: 'ZA' })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setResponse(result.data);
      toast.success('Trip ready!', { id: t });
      setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 300);
      // Generate rich itinerary
      if (result.data.event?.name) await generateItinerary(result.data);
    } catch (e: any) {
      toast.error('Failed', { id: t });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (q?: string) => {
    const loc = q || query;
    if (!loc.trim()) { toast.error('Enter an event or destination'); return; }
    if (!eventType) { toast.error('Select Sports, Music or Festivals first'); return; }
    setLoading(true);
    setItineraryData(null);
    const t = toast.loading(`Searching "${loc}"...`);
    try {
      // Step 1: Agent — finds event, hotels, flights
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: loc,
          context: { eventType, origin, days: 5, startDate: startDate?.toISOString(), endDate: endDate?.toISOString() }
        })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setResponse(result.data);
      if (user) await profileManager.trackTripPlanned(user.uid, loc);
      toast.success(
        result.data.intent === 'city_selection_required'
          ? `${result.data.event_name} — pick your city`
          : `Found: ${result.data.event?.name || loc}`,
        { id: t, description: `${result.data.hotels?.length || 0} hotels · ${result.data.flights?.length || 0} flights` }
      );
      setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 500);

      // Step 2: Itinerary — only for real events (not city selection prompts)
      if (result.data.intent !== 'city_selection_required' && result.data.event?.name) {
        await generateItinerary(result.data);
      }

    } catch (e: any) {
      toast.error('Search failed', { id: t, description: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleEventSearch = (name: string) => {
    setQuery(name);
    if (!eventType) setEventType('sports');
    setTimeout(() => handleSearch(name), 50);
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>

      <Navbar />

      {/* ═══════════════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="min-h-[100svh] flex flex-col justify-center px-5 pt-24 pb-16 bg-white">
        <div className="max-w-2xl mx-auto w-full space-y-10">

          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border border-slate-200 text-slate-500 bg-white shadow-sm">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: SKY }} />
              Live Event Intelligence · Powered by AI
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.0] text-slate-900 mb-5">
              You pick the event.<br />
              <span style={{ color: SKY }}>We build the trip.</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-500 max-w-lg mx-auto leading-relaxed">
              One search finds your tickets, flights, hotels, and complete itinerary.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 text-center mb-4">What are you going to?</p>
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(EVENT_CFG) as [EventType, typeof EVENT_CFG['sports']][]).map(([key, c]) => {
                const Icon = c.Icon;
                const selected = eventType === key;
                return (
                  <button key={key}
                    onClick={() => { setEventType(key); setQuery(''); setResponse(null); setItineraryData(null); }}
                    className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200"
                    style={{ borderColor: selected ? c.accent : '#E2E8F0', background: selected ? c.bg : 'white' }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all" style={{ background: selected ? c.accent : '#F1F5F9' }}>
                      <Icon size={22} style={{ color: selected ? 'white' : '#94A3B8' }} />
                    </div>
                    <span className="font-bold text-sm" style={{ color: selected ? c.accent : '#64748B' }}>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={e => { setQuery(e.target.value); if (e.target.value && !showDates) setShowDates(true); }}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder={cfg?.placeholder || 'Search any event worldwide...'}
                className="w-full h-14 pl-12 pr-5 text-base rounded-2xl border-2 outline-none transition-all"
                style={{ borderColor: cfg ? cfg.border : '#E2E8F0', background: cfg ? cfg.bg : 'white' }}
              />
            </div>

            {showDates && (
              <div className="flex gap-2 items-center">
                <input type="date" value={startDate?.toISOString().split('T')[0] || ''} onChange={e => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                  className="flex-1 h-12 px-4 rounded-xl border-2 border-slate-200 text-sm text-slate-600 outline-none focus:border-sky-300" />
                <ArrowRight size={16} className="text-slate-300 flex-shrink-0" />
                <input type="date" value={endDate?.toISOString().split('T')[0] || ''} onChange={e => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                  className="flex-1 h-12 px-4 rounded-xl border-2 border-slate-200 text-sm text-slate-600 outline-none focus:border-sky-300" />
              </div>
            )}

            <button
              onClick={() => handleSearch()}
              disabled={!query.trim() || !eventType || loading}
              className="w-full h-14 font-bold rounded-2xl text-base transition-all flex items-center justify-center gap-2 text-white disabled:opacity-40"
              style={{ background: cfg?.accent || SKY }}
            >
              {loading ? <><Loader2 size={18} className="animate-spin" />Searching...</> : <><Sparkles size={18} />Find {cfg?.label || 'Event'} Travel</>}
            </button>

            <div className="flex gap-2">
              <button onClick={() => setShowVoice(true)} className="flex-1 h-11 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 text-slate-500 border-2 border-slate-200 hover:border-slate-300 bg-white transition-all">
                <Mic size={14} />Voice Search
              </button>
              <button onClick={() => setShowSaved(true)} className="flex-1 h-11 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 text-slate-500 border-2 border-slate-200 hover:border-slate-300 bg-white transition-all">
                <Bookmark size={14} />Saved Trips {totalSaved > 0 && `(${totalSaved})`}
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="flex flex-col items-center gap-1 text-slate-300">
              <p className="text-xs font-medium">Scroll to explore</p>
              <ChevronDown size={20} className="animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          TRUST STATS
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-10 border-y border-slate-100 bg-slate-50">
        <div className="max-w-5xl mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { n: 12847, s: '+', l: 'Trips planned' },
              { n: 150, s: '+', l: 'Countries' },
              { n: 23, s: '%', l: 'Average savings' },
              { n: 4, s: ' APIs', l: 'Live data sources' },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-3xl sm:text-4xl font-black text-slate-900 mb-1" style={{ color: i === 0 ? SKY : 'inherit' }}>
                  <Counter to={stat.n} suffix={stat.s} />
                </p>
                <p className="text-sm text-slate-500">{stat.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          TRUST BADGES
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-10 border-b border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Shield, label: 'Secure Booking', sub: 'Bank-level encryption', color: SKY },
              { icon: Ticket, label: 'Live Event Data', sub: 'Ticketmaster & PredictHQ', color: '#8B5CF6' },
              { icon: CheckCircle, label: 'Trusted Partners', sub: 'TravelPayouts network', color: '#10B981' },
              { icon: Sparkles, label: 'AI-Optimised', sub: 'Smart event logistics', color: '#F97316' },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: b.color + '15' }}>
                  <b.icon size={18} style={{ color: b.color }} />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm leading-tight">{b.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          SAMPLE TRIPS
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-5 bg-slate-50">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Real trip examples</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">What Gladys builds for you</h2>
            <p className="text-slate-500 mt-2">Click any to see the full cost breakdown</p>
          </div>
          <div className="space-y-4">
            {SAMPLE_TRIPS.map((trip, i) => <SampleCard key={i} trip={trip} />)}
          </div>
          <div className="mt-6 p-5 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
            <p className="text-slate-600 text-sm font-medium">Ready to plan yours?</p>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-sm font-bold px-5 py-2 rounded-xl text-white transition-opacity hover:opacity-90" style={{ background: SKY }}>
              Start free →
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          LIVE EVENTS
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-5 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10B981' }} />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Live · Updated now</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Upcoming Events</h2>
              <p className="text-slate-500 mt-1">Real events worldwide. Click any to plan instantly.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'sports', 'music', 'festival'] as const).map(f => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                  style={{ background: activeFilter === f ? (f === 'all' ? SKY : catColor(f)) : '#F1F5F9', color: activeFilter === f ? 'white' : '#64748B' }}>
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {eventsLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-72 rounded-2xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(ev => <EventCard key={ev.id} ev={ev} onSearch={handleEventSearch} />)}
            </div>
          ) : (
            <div className="py-24 text-center text-slate-400">
              <Globe size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-semibold text-slate-500">Events loading...</p>
              <p className="text-sm mt-1">Or search for any event above</p>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-5 bg-slate-50 border-t border-slate-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">How it works</h2>
            <p className="text-slate-500 mt-2 text-lg">Three steps. One intelligent system.</p>
          </div>
          <div className="space-y-6">
            {[
              { n: '1', title: 'Name your event', desc: 'Concert, sport, festival — anywhere on earth. We search Ticketmaster, PredictHQ and 150+ sources simultaneously.', color: SKY },
              { n: '2', title: 'AI orchestrates everything', desc: 'Tickets, flights from your city, hotels near the venue, a day-by-day itinerary — all built in seconds.', color: '#8B5CF6' },
              { n: '3', title: 'Book with one click', desc: 'Every link goes directly to trusted partners. No middleman. No markup. Best price, every time.', color: '#F97316' },
            ].map((step, i) => (
              <div key={i} className="flex gap-5 items-start bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-black text-lg" style={{ background: step.color }}>
                  {step.n}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-1">{step.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FEATURES GRID
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-5 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Built for event travelers</h2>
            <p className="text-slate-500 mt-2">Not for generic vacations. For events.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: Globe, title: 'Cheapest city finder', desc: 'Same artist, 5 cities — we show you the most affordable option including travel.', color: SKY, soon: false },
              { icon: Users, title: 'Group coordination', desc: 'Everyone from different cities? One destination, multiple origins handled.', color: '#8B5CF6', soon: true },
              { icon: Zap, title: 'Price intelligence', desc: 'PredictHQ demand scores warn you when hotel prices will spike.', color: '#F97316', soon: false },
              { icon: Shield, title: 'Trip insurance', desc: 'Event cancelled? Coverage integrated from the moment you book.', color: '#10B981', soon: false },
              { icon: Star, title: 'Fan zone guides', desc: 'Pre-event meetups, watch parties, local fan bars — curated per event.', color: '#F59E0B', soon: true },
              { icon: MapPin, title: 'Venue proximity', desc: 'Hotels sorted by walking time to the venue, not just price.', color: '#EF4444', soon: false },
            ].map((f, i) => (
              <div key={i} className="relative p-5 rounded-2xl border-2 border-slate-100 hover:border-slate-200 hover:shadow-md transition-all bg-white">
                {f.soon && <span className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">Soon</span>}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: f.color + '15' }}>
                  <f.icon size={18} style={{ color: f.color }} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1.5">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          CTA BAND
      ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-5" style={{ background: SKY }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Your next event trip starts here.</h2>
          <p className="text-sky-100 text-lg mb-8">Tickets, flights, hotel and itinerary — all in one search.</p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-2 bg-white font-bold px-8 py-4 rounded-2xl text-base transition-opacity hover:opacity-90"
            style={{ color: SKY }}>
            <Sparkles size={18} />Plan my event trip →
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          RESULTS
      ═══════════════════════════════════════════════════════════════════════ */}
      {(response || loading) && (
        <section id="results" className="px-5 py-16 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto">
            {loading && (
              <div className="text-center py-24">
                <Loader2 size={40} className="animate-spin mx-auto mb-5" style={{ color: SKY }} />
                <h3 className="text-2xl font-black text-slate-900 mb-2">Building your trip...</h3>
                <p className="text-slate-500">Finding tickets, flights and hotels simultaneously</p>
              </div>
            )}
            {!loading && response && (
              <>
                {response.intent === 'city_selection_required' && response.cities
                  ? <CityPicker eventId={response.event_id!} eventName={response.event_name || response.event?.name || 'Event'} cities={response.cities} onSelect={handleCitySelect} />
                  : (
                    <>
                      <EventHero event={response.event} budget={response.budget} ticketsUrl={response.affiliate_links?.tickets} />
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                        <p className="text-slate-500 text-sm">{destination}{startDate && endDate && ` · ${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}`}</p>
                        <div className="flex gap-2">
                          <button onClick={() => setShowMaps(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border-2 border-slate-200 text-slate-600 hover:border-sky-300 transition-all"><MapPin size={14} />Map</button>
                          {totalSaved > 0 && <button onClick={() => setShowSummary(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: SKY }}><Bookmark size={14} />Trip ({totalSaved})</button>}
                        </div>
                      </div>
                      <Tabs value={tab} onValueChange={setTab}>
                        <TabsList className="w-full mb-6 p-1 rounded-2xl bg-slate-200">
                          <TabsTrigger value="itinerary" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"><Sparkles size={14} />Itinerary</TabsTrigger>
                          <TabsTrigger value="hotels" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"><Hotel size={14} />Hotels {response.hotels?.length > 0 && <span className="text-xs opacity-60">({response.hotels.length})</span>}</TabsTrigger>
                          <TabsTrigger value="flights" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"><Plane size={14} />Flights {response.flights?.length > 0 && <span className="text-xs opacity-60">({response.flights.length})</span>}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="itinerary">
                          {itineraryLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                              <Loader2 size={36} className="animate-spin" style={{ color: SKY }} />
                              <p className="text-slate-500 font-semibold">Building your day-by-day itinerary...</p>
                              <p className="text-slate-400 text-sm">This takes ~10 seconds</p>
                            </div>
                          ) : itineraryData ? (
                            <>
                              <div className="flex justify-end mb-4">
                                <button
                                  onClick={() => router.push('/itinerary')}
                                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
                                  style={{ background: 'linear-gradient(135deg,#38BDF8,#0284C7)' }}
                                >
                                  <Download size={15} />
                                  View & Download Itinerary
                                </button>
                              </div>
                              <ItineraryView data={itineraryData} />
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                              <Sparkles size={36} className="opacity-30" />
                              <p className="font-semibold text-slate-500">Search for an event to see your itinerary</p>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="hotels"><HotelResults hotels={response.hotels || []} onSaveItem={h => handleSave(h, 'hotel')} loading={false} /></TabsContent>
                        <TabsContent value="flights"><FlightResults flights={response.flights || []} onSaveItem={f => handleSave(f, 'flight')} loading={false} /></TabsContent>
                      </Tabs>
                    </>
                  )
                }
              </>
            )}
          </div>
        </section>
      )}

      <Footer />

      {/* ── MODALS ── */}
      {showSummary && <TripSummary isOpen={showSummary} onClose={() => setShowSummary(false)} savedItems={savedItems} onRemoveItem={handleRemove} destination={destination} />}
      {showMaps && destination && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-xl">Map & Directions</h3>
              <button onClick={() => setShowMaps(false)} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">✕</button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[calc(90vh-80px)]"><MapsDirections destination={destination} defaultOrigin={origin} /></div>
          </div>
        </div>
      )}
      {showVoice && <VoiceTripPlanner />}
      {showSaved && <SavedTrips />}
      <GladysChat />
      <EventNotificationToast userLocation={origin} />
    </div>
  );
}