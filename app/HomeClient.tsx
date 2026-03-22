"use client";

import { useEffect, useState, useRef } from "react";
import { trackSearch, trackEventSearch, trackTripPlanGenerated } from '@/lib/analytics';
import { useRouter } from "next/navigation";
import {
  Search, Sparkles, Trophy, Music, PartyPopper,
  Loader2, ExternalLink, TrendingUp, Calendar, MapPin,
  Plane, Hotel, Bookmark, Mic, ChevronDown,
  Ticket, Shield, CheckCircle, Globe, Users, Download,
} from "lucide-react";
import { toast } from "sonner";

import Navbar             from "@/components/Navbar";
import Footer             from "@/components/Footer";
import EventNotificationToast from '@/components/EventNotificationToast';
import HotelResults       from "@/components/HotelResults";
import FlightResults      from "@/components/FlightResults";
import ItineraryView      from "@/components/ItineraryView";
import MapsDirections     from "@/components/MapsDirections";
import TripSummary        from "@/components/TripSummary";
import SavedTrips         from "@/components/SavedTrips";
import CityPicker         from "@/components/CityPicker";
import GladysCompanion    from "@/components/GladysCompanion";
import FeaturedEvents     from "@/components/FeaturedEvents";
import DateRangePicker   from "@/components/DateRangePicker";
import SearchBar          from "@/components/SearchBar";

import { ItineraryData }  from "@/lib/mock-itinerary";
import { profileManager } from "@/lib/userProfile";
import { useAuth }        from "@/lib/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface SavedItem {
  id: string; type: 'hotel' | 'flight' | 'restaurant' | 'activity';
  name: string; price: string; location?: string; date?: string;
  image?: string; affiliateUrl: string; partner: string; description?: string;
}

interface AgentResponse {
  intent: 'event_trip' | 'destination_trip' | 'information_only' | 'city_selection_required';
  destination?: { city: string | null; country: string | null };
  event?: {
    name: string | null; type: 'sports' | 'music' | 'festival' | 'conference' | 'other' | null;
    date: string | null; venue: string | null; image?: string | null;
    ticketUrl?: string | null; priceMin?: number | null; priceMax?: number | null;
    currency?: string | null; attraction?: string | null; time?: string | null;
  };
  itinerary: Array<{ day: number; title: string; activities: string[] }>;
  hotels: any[]; flights: any[];
  affiliate_links: { hotel: string; flight: string; tickets: string };
  upsells: { insurance: boolean; esim: boolean };
  message: string;
  budget?: {
    accommodation: number; transport: number; food: number;
    event_tickets: number; activities: number; total: number;
    currency: string; per_day_average: number;
  };
  travel_dates?: {
    arrival_date: string; departure_date: string; total_nights: number;
    day_slots: Array<{ date: string; day_type: string; label: string }>;
  };
  event_id?: string; event_name?: string;
  cities?: Array<{
    city_id: string; name: string; country: string; iata_code: string;
    sessions: Array<{ session_id: string; date: string; time?: string; round?: string; description?: string }>;
  }>;
}

type EventType = 'sports' | 'music' | 'festivals' | null;

// ─── TOKENS ───────────────────────────────────────────────────────────────────

const SKY = '#0EA5E9';

const EVENT_CFG = {
  sports:    { accent: SKY,       bg: '#F0F9FF', border: '#BAE6FD', label: 'Sports',    Icon: Trophy,      placeholder: 'NBA Finals, World Cup, Wimbledon...'      },
  music:     { accent: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', label: 'Music',     Icon: Music,       placeholder: 'Taylor Swift, Coachella, Glastonbury...'  },
  festivals: { accent: '#F97316', bg: '#FFF7ED', border: '#FED7AA', label: 'Festivals', Icon: PartyPopper, placeholder: 'Rio Carnival, Oktoberfest, Burning Man...' },
};

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
        const t = setInterval(() => {
          cur += step;
          if (cur >= to) { setVal(to); clearInterval(t); }
          else setVal(Math.floor(cur));
        }, 16);
      }
    });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ─── EVENT HERO (result banner after search) ──────────────────────────────────

function EventHero({ event, budget, ticketsUrl }: {
  event: AgentResponse['event'];
  budget?: AgentResponse['budget'];
  ticketsUrl?: string;
}) {
  if (!event?.name) return null;
  const color   = catColor(event.type || 'other');
  const bg      = catBg(event.type || 'other');
  const CatIcon = event.type === 'sports' ? Trophy : event.type === 'music' ? Music : PartyPopper;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm mb-6">
      <div className="h-1.5" style={{ background: color }} />
      {event.image && (
        <div className="relative h-40 sm:h-56 md:h-64 overflow-hidden">
          <img src={event.image} alt={event.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}
      <div className="p-4 sm:p-6 md:p-8">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mb-3"
          style={{ color, background: bg }}>
          <CatIcon size={12} />
          {(event.type || 'event').charAt(0).toUpperCase() + (event.type || 'event').slice(1)} Event
        </div>
        <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-slate-900 mb-1 leading-tight">
          {event.name}
        </h1>
        {event.attraction && event.attraction !== event.name && (
          <p className="text-base font-semibold mb-3" style={{ color }}>{event.attraction}</p>
        )}
        <div className="flex flex-wrap gap-3 md:gap-4 mb-5 text-slate-500 text-sm">
          {event.date && (
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />{fmtDate(event.date)}{event.time && ` · ${event.time}`}
            </span>
          )}
          {event.venue && (
            <span className="flex items-center gap-1.5"><MapPin size={14} />{event.venue}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {(event.ticketUrl || ticketsUrl) && (
            <a href={event.ticketUrl || ticketsUrl!} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-bold px-4 sm:px-5 py-2.5 rounded-xl text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: color }}>
              <Ticket size={15} />
              Buy Tickets{event.priceMin && ` · From ${event.currency || 'USD'} ${event.priceMin}`}
              <ExternalLink size={13} />
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

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function HomeClient() {
  const router   = useRouter();
  const { user } = useAuth();

  const [eventType,  setEventType]  = useState<EventType>(null);
  const [query,      setQuery]      = useState('');
  const [startDate,  setStartDate]  = useState<Date | null>(null);
  const [endDate,    setEndDate]    = useState<Date | null>(null);
  const [showDates,  setShowDates]  = useState(false);
  const origin = 'Johannesburg, South Africa';

  const [response,         setResponse]        = useState<AgentResponse | null>(null);
  const [loading,          setLoading]          = useState(false);
  const [tab,              setTab]              = useState('itinerary');
  const [itineraryData,    setItineraryData]    = useState<ItineraryData | null>(null);
  const [itineraryLoading, setItineraryLoading] = useState(false);

  const [showSummary, setShowSummary] = useState(false);
  const [showMaps,    setShowMaps]    = useState(false);
  const [showSaved,   setShowSaved]   = useState(false);
  const [savedItems,  setSavedItems]  = useState<{
    hotels: SavedItem[]; flights: SavedItem[];
    restaurants: SavedItem[]; activities: SavedItem[];
  }>({ hotels: [], flights: [], restaurants: [], activities: [] });

  const [gladysContext, setGladysContext] = useState<string | undefined>();

  const cfg         = eventType ? EVENT_CFG[eventType] : null;
  const totalSaved  = Object.values(savedItems).reduce((s, a) => s + a.length, 0);
  const destination = response?.destination?.city || '';

  useEffect(() => {
    if (itineraryData) {
      try { localStorage.setItem('gladys-itinerary-current', JSON.stringify(itineraryData)); } catch {}
    }
  }, [itineraryData]);

  useEffect(() => {
    if (response?.event?.name) {
      setGladysContext(
        `User is planning a trip to ${response.event.name}` +
        (response.destination?.city ? ` in ${response.destination.city}` : '') +
        (response.event.date ? ` on ${response.event.date}` : '')
      );
    }
  }, [response]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setGladysContext(detail);
    };
    window.addEventListener('gladys:open', handler);
    return () => window.removeEventListener('gladys:open', handler);
  }, []);

  const handleSave = async (item: any, type: 'hotel' | 'flight' | 'restaurant' | 'activity') => {
    const si: SavedItem = {
      id: item.id?.toString() || Math.random().toString(), type,
      name: item.name || 'Unnamed', price: item.price?.toString() || '$0',
      location: item.location || '', date: item.date || '', image: item.image || '',
      affiliateUrl: item.bookingUrl || '#', partner: item.partner || 'TravelPayouts',
      description: item.description || '',
    };
    setSavedItems(prev => {
      const k = `${type}s` as keyof typeof prev;
      const cur = prev[k] || [];
      if (cur.some(i => i.id === si.id)) {
        toast.success('Removed');
        return { ...prev, [k]: cur.filter(i => i.id !== si.id) };
      }
      toast.success('Saved!', { action: { label: 'View', onClick: () => setShowSummary(true) } });
      return { ...prev, [k]: [...cur, si] };
    });
  };

  const handleRemove = (type: string, id: string) => {
    setSavedItems(prev => {
      const k = (type + 's') as keyof typeof prev;
      return { ...prev, [k]: (prev[k] || []).filter((i: SavedItem) => i.id !== id) };
    });
  };

  const generateItinerary = async (agentData: AgentResponse) => {
    if (!agentData.event?.name) return;
    setItineraryLoading(true);
    try {
      const ev  = agentData.event;
      const res = await fetch('/api/itinerary', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName:    ev.name,
          eventDate:    ev.date,
          eventVenue:   ev.venue || agentData.destination?.city || '',
          eventCity:    agentData.destination?.city || '',
          eventCountry: agentData.destination?.country || '',
          eventType:    ev.type === 'festival' ? 'festivals' : ev.type === 'music' ? 'music' : 'sports',
          ticketUrl:    ev.ticketUrl || agentData.affiliate_links?.tickets || null,
          days: 5, budget: 'mid', groupSize: 1,
          startDate: agentData.travel_dates?.arrival_date,
          endDate:   agentData.travel_dates?.departure_date,
        }),
      });
      const data = await res.json();
      if (!data.days?.length) return;
      if (agentData.budget) {
        const b = agentData.budget; const cur = b.currency || 'USD';
        const f = (n: number) => `${cur} ${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        data.budget = {
          totalBudget:  f(b.total),
          dailyAverage: f(b.per_day_average),
          eventDayCost: f(b.event_tickets + b.per_day_average),
          breakdown: {
            accommodation: f(b.accommodation), transport: f(b.transport),
            food: f(b.food), event: f(b.event_tickets), activities: f(b.activities),
          },
        };
      }
      setItineraryData(data as ItineraryData);
    } catch (err) { console.warn('Itinerary failed:', err); }
    finally { setItineraryLoading(false); }
  };

  const handleCitySelect = async (params: any) => {
    setLoading(true); setItineraryData(null);
    const t = toast.loading('Building trip...');
    try {
      const res    = await fetch('/api/agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, ...params, budget_level: 'mid', origin_country_code: 'ZA' }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setResponse(result.data);
      toast.success('Trip ready!', { id: t });
      setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 300);
      if (result.data.event?.name) await generateItinerary(result.data);
    } catch { toast.error('Failed', { id: t }); }
    finally { setLoading(false); }
  };

  const handleSearch = async (q?: string) => {
    const loc = q || query;
    if (!loc.trim()) { toast.error('Enter an event or destination'); return; }
    if (!eventType)  { toast.error('Select Sports, Music or Festivals first'); return; }
    // Track search
    trackSearch(loc);
    trackEventSearch(loc, eventType);
    setLoading(true); setItineraryData(null);
    const t = toast.loading(`Searching "${loc}"...`);
    try {
      const res = await fetch('/api/agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: loc,
          context: { eventType, origin, days: 5, startDate: startDate?.toISOString(), endDate: endDate?.toISOString() },
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setResponse(result.data);
      if (user) await profileManager.trackTripPlanned(user.uid, loc);
      // GA4 — trip plan generated
      if (result.data.event?.name) {
        trackTripPlanGenerated({
          eventName: result.data.event.name,
          eventType: result.data.event.type ?? eventType ?? 'sports',
          city:      result.data.destination?.city ?? loc,
          days:      5,
          source:    'search',
        });
      }
      toast.success(
        result.data.intent === 'city_selection_required'
          ? `${result.data.event_name} — pick your city`
          : `Found: ${result.data.event?.name || loc}`,
        { id: t, description: `${result.data.hotels?.length || 0} hotels · ${result.data.flights?.length || 0} flights` }
      );
      setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 500);
      if (result.data.intent !== 'city_selection_required' && result.data.event?.name) {
        await generateItinerary(result.data);
      }
    } catch (e: any) {
      toast.error('Search failed', { id: t, description: (e as Error).message });
    } finally { setLoading(false); }
  };

  // Passed to FeaturedEvents — called when user clicks a card
  const handleEventSearch = (name: string) => {
    setQuery(name);
    if (!eventType) setEventType('sports');
    setTimeout(() => handleSearch(name), 50);
  };

  const openGladysVoice = (context?: string) => {
    if (context) setGladysContext(context);
    window.dispatchEvent(new CustomEvent('gladys:open', { detail: context }));
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white"
      style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>

      <Navbar />

      {/* ════════════ HERO ═══════════════════════════════════════════════════ */}
      <section
        className="min-h-[100svh] flex flex-col justify-center px-4 sm:px-5 pt-20 md:pt-24 pb-10 relative overflow-hidden"
        style={{ background: 'white' }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-[0.12]"
            style={{ background: 'radial-gradient(circle, #38BDF8, #0284C7)' }} />
          <div className="absolute -bottom-24 -right-24 w-[420px] h-[420px] rounded-full opacity-[0.09]"
            style={{ background: 'radial-gradient(circle, #0EA5E9, #38BDF8)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, #BAE6FD, #0EA5E9)' }} />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto w-full space-y-7 md:space-y-10">

          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border border-slate-200 text-slate-500 bg-white shadow-sm">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: SKY }} />
              Live Event Intelligence · 13 AI Tools Active
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] text-slate-900 mb-4 md:mb-5">
              You pick the event.<br />
              <span style={{ color: SKY }}>We build the trip.</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-500 max-w-lg mx-auto leading-relaxed">
              One search finds your tickets, flights, hotels, and complete itinerary. Or just ask Gladys.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 text-center mb-3 md:mb-4">
              What are you going to?
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {(Object.entries(EVENT_CFG) as [EventType, typeof EVENT_CFG['sports']][]).map(([key, c]) => {
                const Icon = c.Icon; const selected = eventType === key;
                return (
                  <button key={key}
                    onClick={() => { setEventType(key); setQuery(''); setResponse(null); setItineraryData(null); }}
                    className="flex flex-col items-center gap-2 sm:gap-2.5 p-3 sm:p-4 rounded-2xl border-2 transition-all duration-200 active:scale-[0.97]"
                    style={{ borderColor: selected ? c.accent : '#E2E8F0', background: selected ? c.bg : 'white' }}
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all"
                      style={{ background: selected ? c.accent : '#F1F5F9' }}>
                      <Icon size={20} style={{ color: selected ? 'white' : '#94A3B8' }} />
                    </div>
                    <span className="font-bold text-xs sm:text-sm" style={{ color: selected ? c.accent : '#64748B' }}>
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <SearchBar
              value={query}
              onChange={v => setQuery(v)}
              onSearch={q => { setQuery(q); handleSearch(q); }}
              onShowDates={() => setShowDates(true)}
              placeholder={cfg?.placeholder || 'Search any event worldwide...'}
              borderColor={cfg?.border}
              background={cfg?.bg}
              accentColor={cfg?.accent}
              loading={loading}
              eventType={eventType}
            />

            {showDates && (
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
                destination={query}
                showCalendar={false}
                minNights={1}
                maxNights={30}
              />
            )}

            <button
              onClick={() => handleSearch()}
              disabled={!query.trim() || !eventType || loading}
              className="w-full h-14 sm:h-16 font-black rounded-2xl text-base sm:text-lg transition-all flex items-center justify-center gap-2 text-white disabled:opacity-40 active:opacity-80"
              style={{ background: cfg?.accent || SKY }}
            >
              {loading
                ? <><Loader2 size={18} className="animate-spin" />Searching...</>
                : <><Sparkles size={18} />Find {cfg?.label || 'Event'} Travel</>
              }
            </button>

            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => openGladysVoice()}
                className="h-11 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 text-slate-500 border-2 border-slate-200 hover:border-slate-300 bg-white transition-all active:scale-[0.97]">
                <Mic size={14} />Ask Gladys
              </button>
              <button onClick={() => router.push('/trips')}
                className="h-11 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 text-slate-500 border-2 border-slate-200 hover:border-slate-300 bg-white transition-all active:scale-[0.97]">
                <Users size={14} />Group Trip
              </button>
              <button onClick={() => setShowSaved(true)}
                className="h-11 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 text-slate-500 border-2 border-slate-200 hover:border-slate-300 bg-white transition-all active:scale-[0.97]">
                <Bookmark size={14} />{totalSaved > 0 ? `Saved (${totalSaved})` : 'Saved'}
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





      {/* ════════════ GROUP TRAVEL BANNER ════════════════════════════════════ */}
      <section className="py-10 md:py-12 px-4 sm:px-5 bg-slate-900">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-sky-400 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              New · Group Travel
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Plan with your crew</h2>
            <p className="text-slate-400 max-w-md text-sm sm:text-base">
              Shared trip page, group chat, split costs automatically. Everyone joins with one invite code.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-shrink-0">
            <button onClick={() => router.push('/trips')}
              className="flex-1 md:flex-none px-6 md:px-7 py-3.5 bg-white text-slate-900 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 active:scale-[0.97]">
              <Users size={16} />Start a group trip
            </button>
            <button onClick={() => openGladysVoice('Plan a group trip for me and my friends')}
              className="flex-1 md:flex-none px-6 md:px-7 py-3.5 border border-slate-700 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 active:scale-[0.97]">
              <Mic size={16} />Ask Gladys instead
            </button>
          </div>
        </div>
      </section>

      {/* ════════════ FEATURED EVENTS — new editorial layout ════════════════ */}
      <FeaturedEvents onSearch={handleEventSearch} />

      {/* ════════════ CTA BAND ═══════════════════════════════════════════════ */}
      <section className="py-16 md:py-20 px-4 sm:px-5" style={{ background: SKY }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 md:mb-4">
            Your next event trip starts here.
          </h2>
          <p className="text-sky-100 text-base md:text-lg mb-6 md:mb-8">
            Tickets, flights, hotel and itinerary — all in one search. Or just talk to Gladys.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center justify-center gap-2 bg-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-sm sm:text-base transition-opacity hover:opacity-90 active:scale-[0.97]"
              style={{ color: SKY }}>
              <Sparkles size={18} />Plan my event trip →
            </button>
            <button onClick={() => openGladysVoice()}
              className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl text-sm sm:text-base hover:bg-white/10 transition-colors active:scale-[0.97]">
              <Mic size={18} />Talk to Gladys
            </button>
          </div>
        </div>
      </section>

      {/* ════════════ RESULTS ════════════════════════════════════════════════ */}
      {(response || loading) && (
        <section id="results" className="px-4 sm:px-5 py-12 md:py-16 bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto">
            {loading && (
              <div className="text-center py-20 md:py-24">
                <Loader2 size={40} className="animate-spin mx-auto mb-5" style={{ color: SKY }} />
                <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2">Building your trip...</h3>
                <p className="text-slate-500">Finding tickets, flights and hotels simultaneously</p>
              </div>
            )}

            {!loading && response && (
              <>
                {response.intent === 'city_selection_required' && response.cities
                  ? <CityPicker
                      eventId={response.event_id!}
                      eventName={response.event_name || response.event?.name || 'Event'}
                      cities={response.cities}
                      onSelect={handleCitySelect}
                    />
                  : (
                    <>
                      <EventHero
                        event={response.event}
                        budget={response.budget}
                        ticketsUrl={response.affiliate_links?.tickets}
                      />

                      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                        <p className="text-slate-500 text-sm">
                          {destination}
                          {startDate && endDate && ` · ${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}`}
                        </p>
                        <div className="flex gap-2">
                          <button onClick={() => setShowMaps(true)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border-2 border-slate-200 text-slate-600 hover:border-sky-300 transition-all">
                            <MapPin size={14} />Map
                          </button>
                          {totalSaved > 0 && (
                            <button onClick={() => setShowSummary(true)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white"
                              style={{ background: SKY }}>
                              <Bookmark size={14} />Trip ({totalSaved})
                            </button>
                          )}
                        </div>
                      </div>

                      <Tabs value={tab} onValueChange={setTab}>
                        <TabsList className="w-full mb-6 p-1 rounded-2xl bg-slate-200">
                          <TabsTrigger value="itinerary"
                            className="flex items-center gap-1.5 sm:gap-2 rounded-xl text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <Sparkles size={13} />Itinerary
                          </TabsTrigger>
                          <TabsTrigger value="hotels"
                            className="flex items-center gap-1.5 sm:gap-2 rounded-xl text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <Hotel size={13} />Hotels <span className="opacity-40 text-[10px]">Soon</span>
                          </TabsTrigger>
                          <TabsTrigger value="flights"
                            className="flex items-center gap-1.5 sm:gap-2 rounded-xl text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <Plane size={13} />Flights <span className="opacity-40 text-[10px]">Soon</span>
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="itinerary">
                          {itineraryLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 md:py-24 gap-4">
                              <Loader2 size={36} className="animate-spin" style={{ color: SKY }} />
                              <p className="text-slate-500 font-semibold">Building your day-by-day itinerary...</p>
                              <p className="text-slate-400 text-sm">This takes ~10 seconds</p>
                            </div>
                          ) : itineraryData ? (
                            <>
                              <div className="flex justify-end mb-4">
                                <button onClick={() => router.push('/itinerary')}
                                  className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
                                  style={{ background: 'linear-gradient(135deg,#38BDF8,#0284C7)' }}>
                                  <Download size={15} />View & Download Itinerary
                                </button>
                              </div>
                              <ItineraryView data={itineraryData} startDate={startDate} endDate={endDate} />
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-20 md:py-24 gap-3 text-slate-400">
                              <Sparkles size={36} className="opacity-30" />
                              <p className="font-semibold text-slate-500">Search for an event to see your itinerary</p>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="hotels">
                          <HotelResults hotels={[]} onSaveItem={h => handleSave(h, 'hotel')} loading={false} comingSoon={true} />
                        </TabsContent>

                        <TabsContent value="flights">
                          <FlightResults flights={[]} onSaveItem={f => handleSave(f, 'flight')} loading={false} comingSoon={true} />
                        </TabsContent>
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

      {/* ── Modals ── */}
      {showSummary && (
        <TripSummary
          isOpen={showSummary}
          onClose={() => setShowSummary(false)}
          savedItems={savedItems}
          onRemoveItem={handleRemove}
          destination={destination}
        />
      )}
      {showMaps && destination && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-lg sm:text-xl">Map & Directions</h3>
              <button onClick={() => setShowMaps(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">✕
              </button>
            </div>
            <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(90vh-80px)]">
              <MapsDirections destination={destination} defaultOrigin={origin} />
            </div>
          </div>
        </div>
      )}
      {showSaved && <SavedTrips />}

      <GladysCompanion
        eventContext={gladysContext}
        onTripPlan={name => {
          setQuery(name);
          if (!eventType) setEventType('sports');
          setShowDates(true);
          setTimeout(() => handleSearch(name), 80);
          // Scroll to results
          setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 900);
        }}
      />
      <EventNotificationToast userLocation={origin} />
    </div>
  );
}