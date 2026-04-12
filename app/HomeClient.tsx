"use client";

import { useEffect, useState, useRef } from "react";
import { trackSearch, trackEventSearch, trackTripPlanGenerated } from '@/lib/analytics';
import { useRouter, useSearchParams } from "next/navigation";
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
import DateRangePicker    from "@/components/DateRangePicker";
import SearchBar          from "@/components/SearchBar";

import { ItineraryData }  from "@/lib/mock-itinerary";
import { profileManager } from "@/lib/userProfile";
import { useAuth }        from "@/lib/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AffiliateTab from "@/components/AffiliateTab";

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

type EventType = 'sports' | 'music' | 'festivals' | undefined;

// ─── DESIGN TOKENS (hero / dark sections) ─────────────────────────────────────

const T = {
  text:      '#ffffff',
  textMuted: 'rgba(255,255,255,0.45)',
  textDim:   'rgba(255,255,255,0.22)',
  surface:   'rgba(255,255,255,0.04)',
  border:    'rgba(255,255,255,0.08)',
  fontDisplay: "'Bricolage Grotesque', sans-serif",
  fontBody:    "'DM Sans', sans-serif",
};

// ─── THEME SYSTEM — hero reacts to selected category ──────────────────────────

const THEMES = {
  default: {
    heroBg:       '#0f1117',
    accent:       '#6ee7b7',
    accentDim:    'rgba(110,231,183,0.10)',
    accentBorder: 'rgba(110,231,183,0.22)',
    ctaBg:        '#ffffff',
    ctaColor:     '#0f1117',
    glow:         'rgba(110,231,183,0.12)',
    label:        'Live Event Intelligence',
  },
  sports: {
    heroBg:       '#05101e',
    accent:       '#38bdf8',
    accentDim:    'rgba(56,189,248,0.10)',
    accentBorder: 'rgba(56,189,248,0.28)',
    ctaBg:        '#38bdf8',
    ctaColor:     '#05101e',
    glow:         'rgba(56,189,248,0.16)',
    label:        'Sports Events',
  },
  music: {
    heroBg:       '#0d0818',
    accent:       '#c4b5fd',
    accentDim:    'rgba(167,139,250,0.10)',
    accentBorder: 'rgba(167,139,250,0.28)',
    ctaBg:        '#a78bfa',
    ctaColor:     '#0d0818',
    glow:         'rgba(167,139,250,0.16)',
    label:        'Music & Concerts',
  },
  festivals: {
    heroBg:       '#160a02',
    accent:       '#fb923c',
    accentDim:    'rgba(251,146,60,0.10)',
    accentBorder: 'rgba(251,146,60,0.28)',
    ctaBg:        '#fb923c',
    ctaColor:     '#160a02',
    glow:         'rgba(251,146,60,0.16)',
    label:        'Festivals & Culture',
  },
} as const;
type ThemeKey = keyof typeof THEMES;

// ─── EVENT CONFIG (category buttons) ─────────────────────────────────────────

const EVENT_CFG = {
  sports:    { accent: '#38bdf8', glow: 'rgba(56,189,248,0.12)',  label: 'Sports',    Icon: Trophy,      placeholder: 'NBA Finals, World Cup, Wimbledon...'      },
  music:     { accent: '#a78bfa', glow: 'rgba(167,139,250,0.12)', label: 'Music',     Icon: Music,       placeholder: 'Taylor Swift, Coachella, Glastonbury...'  },
  festivals: { accent: '#fb923c', glow: 'rgba(251,146,60,0.12)',  label: 'Festivals', Icon: PartyPopper, placeholder: 'Rio Carnival, Oktoberfest, Burning Man...' },
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
  if (cat === 'sports') return '#38bdf8';
  if (cat === 'music' || cat === 'festival') return '#a78bfa';
  return '#fb923c';
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

// ─── EVENT HERO — light card, lives in warm content area ──────────────────────

function EventHero({ event, budget, ticketsUrl }: {
  event: AgentResponse['event'];
  budget?: AgentResponse['budget'];
  ticketsUrl?: string;
}) {
  if (!event?.name) return null;
  const color   = catColor(event.type || 'other');
  const CatIcon = event.type === 'sports' ? Trophy : event.type === 'music' ? Music : PartyPopper;

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: 20,
      overflow: 'hidden',
      marginBottom: 24,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      {/* Accent bar */}
      <div style={{ height: 3, background: color }} />

      {event.image && (
        <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
          <img src={event.image} alt={event.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
        </div>
      )}

      <div style={{ padding: '20px 24px 24px' }}>
        {/* Type badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 99, marginBottom: 12,
          background: `${color}18`, border: `1px solid ${color}30`,
        }}>
          <CatIcon size={11} style={{ color }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color }}>
            {(event.type || 'event').charAt(0).toUpperCase() + (event.type || 'event').slice(1)} Event
          </span>
        </div>

        <h1 style={{
          fontFamily: T.fontDisplay, fontSize: 'clamp(22px, 4vw, 36px)',
          fontWeight: 900, color: '#111', lineHeight: 1.05,
          letterSpacing: '-0.025em', marginBottom: 4,
        }}>
          {event.name}
        </h1>

        {event.attraction && event.attraction !== event.name && (
          <p style={{ fontSize: 15, fontWeight: 600, color, marginBottom: 14 }}>{event.attraction}</p>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 16, marginBottom: 20 }}>
          {event.date && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#666' }}>
              <Calendar size={13} />{fmtDate(event.date)}{event.time && ` · ${event.time}`}
            </span>
          )}
          {event.venue && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#666' }}>
              <MapPin size={13} />{event.venue}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 10 }}>
          {(event.ticketUrl || ticketsUrl) && (
            <a href={event.ticketUrl || ticketsUrl!} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 12,
                background: color, color: '#ffffff',
                fontFamily: T.fontDisplay, fontWeight: 800, fontSize: 13,
                textDecoration: 'none',
              }}>
              <Ticket size={14} />
              Buy Tickets{event.priceMin ? ` · From ${event.currency || 'USD'} ${event.priceMin}` : ''}
              <ExternalLink size={12} />
            </a>
          )}
          {budget && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 12,
              background: '#f5f5f3', border: '1px solid rgba(0,0,0,0.08)',
              fontSize: 13, color: '#666',
            }}>
              Full trip:&nbsp;<span style={{ fontFamily: T.fontDisplay, fontWeight: 800, color: '#111' }}>{fmt(budget.total, budget.currency)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function HomeClient() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [eventType,  setEventType]  = useState<EventType>(undefined);
  const [query,      setQuery]      = useState('');
  const [startDate,  setStartDate]  = useState<Date | null>(null);
  const [endDate,    setEndDate]    = useState<Date | null>(null);
  const [showDates,  setShowDates]  = useState(false);
  const origin = 'Johannesburg, South Africa';

  // Calculate trip duration from date picker — capped at 10 days for quality.
  const calcDays = (): number => {
    if (!startDate || !endDate) return 5;
    const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000);
    return Math.min(Math.max(diff, 1), 10);
  };

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

  // Derive theme + cfg from selected category
  const themeKey: ThemeKey = eventType ?? 'default';
  const theme = THEMES[themeKey];
  const cfg   = eventType ? EVENT_CFG[eventType] : null;

  const totalSaved  = Object.values(savedItems).reduce((s, a) => s + a.length, 0);
  const destination = response?.destination?.city || '';

  // ── Read ?q param from URL (set by /events "Plan Trip" and notification toast)
  useEffect(() => {
    const q = searchParams.get('q');
    if (q?.trim()) {
      setQuery(q);
      const t = setTimeout(() => {
        handleSearch(q);
        setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 1200);
      }, 150);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
          days: calcDays(), budget: 'mid', groupSize: 1,
          startDate: startDate?.toISOString().split('T')[0] || agentData.travel_dates?.arrival_date,
          endDate:   endDate?.toISOString().split('T')[0]   || agentData.travel_dates?.departure_date,
          originCountry: 'ZA',
          destinationCountry: agentData.destination?.country || '',
          hasFlights: (agentData.flights?.length ?? 0) > 0,
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
    trackSearch(loc);
    trackEventSearch(loc, eventType);
    setLoading(true); setItineraryData(null);
    const t = toast.loading(`Searching "${loc}"...`);
    try {
      const res = await fetch('/api/agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: loc,
          context: { eventType, origin, days: calcDays(), startDate: startDate?.toISOString(), endDate: endDate?.toISOString() },
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      setResponse(result.data);
      if (user) await profileManager.trackTripPlanned(user.uid, loc);
      if (result.data.event?.name) {
        trackTripPlanGenerated({
          eventName: result.data.event.name,
          eventType: result.data.event.type ?? eventType ?? 'sports',
          city:      result.data.destination?.city ?? loc,
          days:      calcDays(),
          source:    'search',
        });
      }
      const tripDays = calcDays();
      toast.success(
        result.data.intent === 'city_selection_required'
          ? `${result.data.event_name} — pick your city`
          : `Found: ${result.data.event?.name || loc}`,
        { id: t, description: `${tripDays}-day itinerary · ${result.data.hotels?.length || 0} hotels · ${result.data.flights?.length || 0} flights` }
      );
      setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 500);
      if (result.data.intent !== 'city_selection_required' && result.data.event?.name) {
        await generateItinerary(result.data);
        setTab('itinerary');
      } else if (result.data.intent === 'information_only') {
        setTab('activities');
      }
    } catch (e: any) {
      toast.error('Search failed', { id: t, description: (e as Error).message });
    } finally { setLoading(false); }
  };

  // Let agent auto-detect category — don't force eventType
  const handleEventSearch = (name: string) => {
    setQuery(name);
    setTimeout(() => handleSearch(name), 50);
  };

  const openGladysVoice = (context?: string) => {
    if (context) setGladysContext(context);
    window.dispatchEvent(new CustomEvent('gladys:open', { detail: context }));
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', fontFamily: T.fontBody }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800;12..96,900&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }

        /* Ghost button — dark variant (hero) */
        .ghost-btn {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 7px; height: 42px; padding: 0 16px;
          border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.45);
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s; white-space: nowrap;
        }
        .ghost-btn:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.14);
          color: rgba(255,255,255,0.7);
        }
        .ghost-btn:active { transform: scale(0.97); }

        /* Ghost button — light variant (warm content area) */
        .ghost-btn-light {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 7px; height: 42px; padding: 0 16px;
          border-radius: 12px; border: 1px solid rgba(0,0,0,0.10);
          background: transparent; color: #555;
          font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.15s; white-space: nowrap;
        }
        .ghost-btn-light:hover {
          background: rgba(0,0,0,0.04);
          border-color: rgba(0,0,0,0.16);
          color: #333;
        }
        .ghost-btn-light:active { transform: scale(0.97); }

        /* Tab trigger — light mode (results on warm bg) */
        .tab-trigger-light {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 10px;
          font-size: 13px; font-weight: 600; white-space: nowrap;
          color: #888; cursor: pointer;
          border: none; background: transparent;
          transition: all 0.15s; font-family: 'DM Sans', sans-serif;
        }
        .tab-trigger-light[data-state="active"] {
          background: white;
          color: #111;
          box-shadow: 0 1px 4px rgba(0,0,0,0.10);
        }
        .tab-trigger-light:hover:not([data-state="active"]) {
          color: #444;
          background: rgba(0,0,0,0.04);
        }

        .gladys-btn { transition: opacity 0.15s, transform 0.15s; }
        .gladys-btn:hover { opacity: 0.85; }
        .gladys-btn:active { transform: scale(0.97); }

        @keyframes gradientShift {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes heroGlow {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1; }
        }
      `}</style>

      <Navbar />

      {/* ════════════ CINEMATIC HERO ═════════════════════════════════════════
          Background colour transitions smoothly when user picks a category.
          Everything else (logic, SearchBar, DateRangePicker) is unchanged.
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: theme.heroBg,
        transition: 'background-color 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
        paddingTop: 'clamp(80px, 12vw, 120px)',
        paddingBottom: 'clamp(48px, 8vw, 80px)',
        paddingLeft: 20, paddingRight: 20,
      }}>
        {/* Ambient glow — reacts to category */}
        <div style={{
          position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)',
          width: 800, height: 500, borderRadius: '50%',
          background: theme.glow,
          filter: 'blur(100px)',
          transition: 'background 0.55s ease',
          pointerEvents: 'none',
          animation: 'heroGlow 5s ease-in-out infinite',
        }} />
        {/* Subtle grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.028, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto' }}>

          {/* Live pill — accent reacts to category */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '7px 16px', borderRadius: 99,
              border: `1px solid ${theme.accentBorder}`,
              background: theme.accentDim,
              transition: 'all 0.4s ease',
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: theme.accent, flexShrink: 0,
                transition: 'background 0.4s',
                animation: 'pulseGlow 2s ease-in-out infinite',
              }} />
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
                textTransform: 'uppercase' as const,
                color: theme.accent,
                transition: 'color 0.4s',
                fontFamily: T.fontBody,
              }}>
                {theme.label}
              </span>
            </div>
          </div>

          {/* Headline */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h1 style={{
              fontFamily: T.fontDisplay,
              fontSize: 'clamp(36px, 8vw, 64px)',
              fontWeight: 900, lineHeight: 0.92,
              letterSpacing: '-0.035em',
              color: T.text, marginBottom: 16,
            }}>
              You pick the event.
              <br />
              <span style={{
                color: theme.accent,
                transition: 'color 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
              }}>
                We build the trip.
              </span>
            </h1>
            <p style={{
              fontFamily: T.fontBody,
              fontSize: 'clamp(14px, 2vw, 17px)',
              color: T.textMuted, lineHeight: 1.65,
              maxWidth: 400, margin: '0 auto', fontWeight: 400,
            }}>
              One search finds your tickets, flights, hotels, and complete itinerary. Or just ask Gladys.
            </p>
          </div>

          {/* Category selector — unchanged logic */}
          <div style={{ marginBottom: 20 }}>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
              textTransform: 'uppercase' as const, color: T.textDim,
              textAlign: 'center', marginBottom: 12, fontFamily: T.fontBody,
            }}>
              What are you going to?
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {(Object.entries(EVENT_CFG) as [EventType, typeof EVENT_CFG['sports']][]).map(([key, c]) => {
                const Icon = c.Icon;
                const selected = eventType === key;
                return (
                  <button
                    key={key}
                    onClick={() => { setEventType(key); setQuery(''); setResponse(null); setItineraryData(null); }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: 10, padding: '16px 12px', borderRadius: 16,
                      border: `1.5px solid ${selected ? c.accent + '60' : T.border}`,
                      background: selected ? `${c.accent}10` : T.surface,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    className="gladys-btn"
                  >
                    <div style={{
                      width: 42, height: 42, borderRadius: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: selected ? c.accent : 'rgba(255,255,255,0.06)',
                      transition: 'all 0.2s',
                    }}>
                      <Icon size={17} style={{ color: selected ? '#050505' : T.textMuted }} />
                    </div>
                    <span style={{ fontFamily: T.fontDisplay, fontSize: 13, fontWeight: 700, color: selected ? c.accent : T.textMuted }}>
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search bar — unchanged */}
          <div style={{ marginBottom: 10 }}>
            <SearchBar
              value={query}
              onChange={v => setQuery(v)}
              onSearch={q => { setQuery(q); handleSearch(q); }}
              onShowDates={() => setShowDates(true)}
              placeholder={cfg?.placeholder || 'Search any event worldwide...'}
              borderColor={cfg ? `${cfg.accent}40` : T.border}
              background="rgba(255,255,255,0.05)"
              accentColor={cfg?.accent || theme.accent}
              loading={loading}
              eventType={eventType}
            />
          </div>

          {showDates && (
            <div style={{ marginBottom: 10 }}>
              <DateRangePicker
                startDate={startDate} endDate={endDate}
                onDateChange={(s, e) => { setStartDate(s); setEndDate(e); }}
                destination={query} showCalendar={false} minNights={1} maxNights={30}
              />
            </div>
          )}

          {/* Primary CTA — bg/color react to theme */}
          <button
            onClick={() => handleSearch()}
            disabled={!query.trim() || loading}
            style={{
              width: '100%', height: 54, borderRadius: 16, border: 'none',
              background: theme.ctaBg,
              color: theme.ctaColor,
              fontFamily: T.fontDisplay, fontWeight: 800, fontSize: 15,
              letterSpacing: '-0.01em',
              cursor: query.trim() && !loading ? 'pointer' : 'not-allowed',
              opacity: !query.trim() || loading ? 0.35 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginBottom: 10,
              transition: 'background-color 0.35s ease, color 0.35s ease, box-shadow 0.35s ease',
              boxShadow: cfg && query.trim() ? `0 0 32px ${theme.glow}` : 'none',
            }}
            className="gladys-btn"
          >
            {loading
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />Searching...</>
              : <><Sparkles size={16} />Find {cfg?.label || 'Event'} Travel</>
            }
          </button>

          {/* Secondary actions — ghost-btn (dark variant, on hero) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <button onClick={() => openGladysVoice()} className="ghost-btn">
              <Mic size={13} />Ask Gladys
            </button>
            <button onClick={() => router.push('/trips')} className="ghost-btn">
              <Users size={13} />Group Trip
            </button>
            <button onClick={() => setShowSaved(true)} className="ghost-btn">
              <Bookmark size={13} />{totalSaved > 0 ? `Saved (${totalSaved})` : 'Saved'}
            </button>
          </div>

          {/* Scroll cue */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 40, opacity: 0.25 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: T.text }}>Scroll</span>
            <div style={{ width: 1, height: 28, background: `linear-gradient(to bottom, ${T.text}, transparent)` }} />
          </div>
        </div>
      </section>

      {/* ════════════ WARM CONTENT AREA ══════════════════════════════════════
          Everything below the hero sits on #FAFAF8 — warm off-white.
          This creates the cinematic contrast: dark hero → light editorial content.
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ background: '#FAFAF8' }}>

        {/* ════════════ GROUP TRAVEL BANNER ══════════════════════════════════ */}
        <section style={{ padding: 'clamp(48px, 8vw, 72px) clamp(20px, 5vw, 48px)' }}>
          <div style={{
            maxWidth: 960, margin: '0 auto',
            border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 24, padding: 'clamp(28px, 5vw, 48px)',
            background: '#ffffff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            display: 'flex', flexWrap: 'wrap' as const,
            alignItems: 'center', justifyContent: 'space-between',
            gap: 32,
          }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: theme.accent,
                  transition: 'background 0.4s',
                  animation: 'pulseGlow 2s ease-in-out infinite',
                }} />
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.16em',
                  textTransform: 'uppercase' as const,
                  color: theme.accent,
                  transition: 'color 0.4s',
                  fontFamily: T.fontBody,
                }}>
                  New · Group Travel
                </span>
              </div>
              <h2 style={{
                fontFamily: T.fontDisplay, fontSize: 'clamp(22px, 4vw, 32px)',
                fontWeight: 900, color: '#111',
                letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 10,
              }}>
                Plan with your crew
              </h2>
              <p style={{ fontFamily: T.fontBody, fontSize: 14, color: '#777', maxWidth: 380, lineHeight: 1.65 }}>
                Shared trip page, group chat, split costs automatically. Everyone joins with one invite code.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
              <button
                onClick={() => router.push('/trips')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 22px', borderRadius: 14,
                  background: '#111', color: '#fff',
                  fontFamily: T.fontDisplay, fontWeight: 800, fontSize: 13,
                  border: 'none', cursor: 'pointer',
                }}
                className="gladys-btn"
              >
                <Users size={15} />Start a group trip
              </button>
              <button
                onClick={() => openGladysVoice('Plan a group trip for me and my friends')}
                className="ghost-btn-light"
              >
                <Mic size={14} />Ask Gladys instead
              </button>
            </div>
          </div>
        </section>

        {/* ════════════ FEATURED EVENTS ══════════════════════════════════════ */}
        <FeaturedEvents onSearch={handleEventSearch} />

        {/* ════════════ CTA BAND ═════════════════════════════════════════════ */}
        <section style={{ padding: 'clamp(64px, 10vw, 96px) 20px', textAlign: 'center', background: '#111' }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{
              fontFamily: T.fontDisplay,
              fontSize: 'clamp(26px, 5vw, 44px)',
              fontWeight: 900, letterSpacing: '-0.03em',
              color: '#fff', marginBottom: 14, lineHeight: 1.05,
            }}>
              Your next event trip<br />starts here.
            </h2>
            <p style={{ fontFamily: T.fontBody, fontSize: 16, color: 'rgba(255,255,255,0.45)', marginBottom: 36, lineHeight: 1.65 }}>
              Tickets, flights, hotel and itinerary — all in one search. Or just talk to Gladys.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' as const }}>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '14px 28px', borderRadius: 16,
                  background: theme.ctaBg, color: theme.ctaColor,
                  fontFamily: T.fontDisplay, fontWeight: 800, fontSize: 14,
                  border: 'none', cursor: 'pointer',
                  transition: 'background-color 0.35s ease, color 0.35s ease',
                }}
                className="gladys-btn"
              >
                <Sparkles size={16} />Plan my event trip →
              </button>
              <button onClick={() => openGladysVoice()} className="ghost-btn" style={{ padding: '14px 28px', height: 'auto', fontSize: 14 }}>
                <Mic size={16} />Talk to Gladys
              </button>
            </div>
          </div>
        </section>

        {/* ════════════ RESULTS ══════════════════════════════════════════════ */}
        {(response || loading) && (
          <section id="results" style={{
            padding: 'clamp(48px, 8vw, 72px) clamp(16px, 4vw, 40px)',
            background: '#FAFAF8',
            borderTop: '1px solid rgba(0,0,0,0.06)',
          }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>

              {loading && (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <Loader2 size={36} style={{ color: theme.accent, margin: '0 auto 20px', animation: 'spin 1s linear infinite', display: 'block', transition: 'color 0.35s' }} />
                  <h3 style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 900, color: '#111', marginBottom: 8 }}>
                    Building your trip...
                  </h3>
                  <p style={{ fontFamily: T.fontBody, fontSize: 14, color: '#888' }}>
                    Finding tickets, flights and hotels simultaneously
                  </p>
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

                        {/* Results meta row */}
                        <div style={{
                          display: 'flex', flexWrap: 'wrap' as const,
                          alignItems: 'center', justifyContent: 'space-between',
                          gap: 12, marginBottom: 16,
                        }}>
                          <p style={{ fontFamily: T.fontBody, fontSize: 13, color: '#888' }}>
                            {destination}
                            {startDate && endDate && ` · ${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}`}
                          </p>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => setShowMaps(true)} className="ghost-btn-light" style={{ height: 38 }}>
                              <MapPin size={13} />Map
                            </button>
                            {totalSaved > 0 && (
                              <button
                                onClick={() => setShowSummary(true)}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 7,
                                  padding: '8px 16px', borderRadius: 12,
                                  background: theme.accent, color: theme.ctaColor,
                                  fontFamily: T.fontDisplay, fontWeight: 800, fontSize: 13,
                                  border: 'none', cursor: 'pointer',
                                  transition: 'background-color 0.35s ease, color 0.35s ease',
                                }}
                                className="gladys-btn"
                              >
                                <Bookmark size={13} />Trip ({totalSaved})
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Tabs */}
                        <Tabs value={tab} onValueChange={setTab}>
                          <div style={{
                            overflowX: 'auto', marginBottom: 20, padding: '4px',
                            background: 'rgba(0,0,0,0.04)',
                            border: '1px solid rgba(0,0,0,0.07)',
                            borderRadius: 14,
                            display: 'inline-flex', width: '100%',
                          }}>
                            <TabsList style={{ display: 'inline-flex', width: '100%', background: 'transparent', gap: 2, padding: 0 }}>
                              {[
                                { value: 'itinerary',  icon: <Sparkles size={13} />, label: 'Itinerary'  },
                                { value: 'hotels',     icon: <Hotel    size={13} />, label: 'Hotels'     },
                                { value: 'flights',    icon: <Plane    size={13} />, label: 'Flights'    },
                                { value: 'activities', icon: <Globe    size={13} />, label: 'Activities' },
                                { value: 'more',       icon: <ExternalLink size={13} />, label: 'More'   },
                              ].map(t => (
                                <TabsTrigger key={t.value} value={t.value} className="tab-trigger-light">
                                  {t.icon}{t.label}
                                </TabsTrigger>
                              ))}
                            </TabsList>
                          </div>

                          {/* ITINERARY */}
                          <TabsContent value="itinerary">
                            {itineraryLoading ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 16 }}>
                                <Loader2 size={32} style={{ color: theme.accent, animation: 'spin 1s linear infinite', transition: 'color 0.35s' }} />
                                <p style={{ fontFamily: T.fontBody, fontWeight: 600, color: '#555' }}>
                                  Building your day-by-day itinerary...
                                </p>
                                <p style={{ fontFamily: T.fontBody, fontSize: 13, color: '#999' }}>This takes ~10 seconds</p>
                              </div>
                            ) : itineraryData ? (
                              <>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                                  <button
                                    onClick={() => router.push('/itinerary')}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 7,
                                      padding: '10px 20px', borderRadius: 12,
                                      background: theme.accent, color: theme.ctaColor,
                                      fontFamily: T.fontDisplay, fontWeight: 800, fontSize: 13,
                                      border: 'none', cursor: 'pointer',
                                      transition: 'background-color 0.35s ease, color 0.35s ease',
                                    }}
                                    className="gladys-btn"
                                  >
                                    <Download size={14} />View & Download Itinerary
                                  </button>
                                </div>
                                <ItineraryView data={itineraryData} startDate={startDate} endDate={endDate} />
                              </>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0', gap: 12 }}>
                                <Sparkles size={32} style={{ color: '#ccc' }} />
                                <div style={{ textAlign: 'center' }}>
                                  <p style={{ fontFamily: T.fontBody, fontWeight: 600, color: '#666', marginBottom: 6 }}>No itinerary yet</p>
                                  <p style={{ fontFamily: T.fontBody, fontSize: 13, color: '#aaa', maxWidth: 280, lineHeight: 1.6 }}>
                                    Search for a specific event — like &ldquo;Coachella&rdquo;, &ldquo;NBA Finals&rdquo; or &ldquo;Taylor Swift&rdquo; — to generate a full trip plan.
                                  </p>
                                </div>
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="hotels">
                            <AffiliateTab type="hotels" city={response?.destination?.city || ''} country={response?.destination?.country || ''} arrivalDate={startDate?.toISOString().split('T')[0]} departureDate={endDate?.toISOString().split('T')[0]} eventName={response?.event?.name || ''} />
                          </TabsContent>
                          <TabsContent value="flights">
                            <AffiliateTab type="flights" city={response?.destination?.city || ''} country={response?.destination?.country || ''} arrivalDate={startDate?.toISOString().split('T')[0]} departureDate={endDate?.toISOString().split('T')[0]} eventName={response?.event?.name || ''} />
                          </TabsContent>
                          <TabsContent value="activities">
                            <AffiliateTab type="activities" city={response?.destination?.city || ''} country={response?.destination?.country || ''} arrivalDate={startDate?.toISOString().split('T')[0]} departureDate={endDate?.toISOString().split('T')[0]} eventName={response?.event?.name || ''} />
                          </TabsContent>
                          <TabsContent value="more">
                            <AffiliateTab type="more" city={response?.destination?.city || ''} country={response?.destination?.country || ''} arrivalDate={startDate?.toISOString().split('T')[0]} departureDate={endDate?.toISOString().split('T')[0]} eventName={response?.event?.name || ''} />
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
      </div>
      {/* ── End warm content area ── */}

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
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16, background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{
            background: '#ffffff', borderRadius: 20,
            width: '100%', maxWidth: 900, maxHeight: '90vh',
            overflow: 'hidden',
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
          }}>
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <h3 style={{ fontFamily: T.fontDisplay, fontWeight: 900, fontSize: 18, color: '#111' }}>
                Map & Directions
              </h3>
              <button
                onClick={() => setShowMaps(false)}
                style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: '#f5f5f3', border: '1px solid rgba(0,0,0,0.08)',
                  color: '#666', cursor: 'pointer', fontSize: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>
            </div>
            <div style={{ padding: 24, overflowY: 'auto', maxHeight: 'calc(90vh - 72px)' }}>
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
          setShowDates(true);
          setTimeout(() => handleSearch(name), 80);
          setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 900);
        }}
      />
      <EventNotificationToast userLocation={origin} />
    </div>
  );
}