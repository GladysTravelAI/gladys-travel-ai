"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Mic, 
  MicOff, 
  ArrowRight, 
  Calendar, 
  Shield, 
  Search, 
  Sparkles, 
  Ticket, 
  ChevronDown,
  MapPin,
  Plane,
  Hotel,
  Bookmark,
  Settings,
  CloudRain,
  Trophy,
  Music,
  PartyPopper,
  CheckCircle2,
  Loader2,
  ExternalLink,
  TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventNotificationToast from '@/components/EventNotificationToast';
import HotelResults from "@/components/HotelResults";
import FlightResults from "@/components/FlightResults";
import ItineraryView from "@/components/ItineraryView";
import MapsDirections from "@/components/MapsDirections";
import TripRefinementModal, { TripPreferences } from "@/components/TripRefinementModal";
import TripSummary from "@/components/TripSummary";
import WeatherWidget from "@/components/WeatherWidget";
import VoiceTripPlanner from "@/components/VoiceTripPlanner";
import SavedTrips from "@/components/SavedTrips";
import GladysChat from "@/components/GladysChat";
import CityPicker from "@/components/CityPicker";

import { ItineraryData } from "@/lib/mock-itinerary";
import { profileManager } from "@/lib/userProfile";
import { useAuth } from "@/lib/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// ==================== INTERFACES ====================

interface SavedItem {
  id: string;
  type: 'hotel' | 'flight' | 'restaurant' | 'activity';
  name: string;
  price: string;
  location?: string;
  date?: string;
  image?: string;
  affiliateUrl: string;
  partner: string;
  description?: string;
}

interface AgentResponse {
  intent: 'event_trip' | 'destination_trip' | 'information_only' | 'city_selection_required';
  destination?: { city: string | null; country: string | null; };
  event?: {
    name: string | null;
    type: 'sports' | 'music' | 'festival' | 'conference' | 'other' | null;
    date: string | null;
    venue: string | null;
    // ✅ NEW — real fields from Ticketmaster / PredictHQ
    image?: string | null;
    ticketUrl?: string | null;
    priceMin?: number | null;
    priceMax?: number | null;
    currency?: string | null;
    attraction?: string | null;
    time?: string | null;
  };
  itinerary: Array<{ day: number; title: string; activities: string[]; }>;
  hotels: any[];
  flights: any[];
  affiliate_links: { hotel: string; flight: string; tickets: string; };
  upsells: { insurance: boolean; esim: boolean; };
  message: string;
  budget?: {
    accommodation: number; transport: number; food: number;
    event_tickets: number; activities: number; total: number;
    currency: string; per_day_average: number;
    esim?: number; insurance?: number;
  };
  travel_dates?: {
    arrival_date: string; departure_date: string; total_nights: number;
    day_slots: Array<{
      date: string;
      day_type: 'arrival' | 'pre_event' | 'event_day' | 'post_event' | 'departure';
      label: string;
    }>;
  };
  event_id?: string;
  event_name?: string;
  cities?: Array<{
    city_id: string; name: string; country: string; iata_code: string;
    sessions: Array<{ session_id: string; date: string; time?: string; round?: string; description?: string; }>;
  }>;
}

// ✅ NEW — shape returned by /api/featured-events
interface LiveEvent {
  id: string;
  name: string;
  category: 'sports' | 'music' | 'festival' | 'other';
  date: string;
  time?: string;
  venue: string;
  city: string;
  country: string;
  image?: string;
  ticketUrl?: string;
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  attraction?: string;
}

// ==================== EVENT TYPE CONFIGURATION ====================

type EventType = 'sports' | 'music' | 'festivals' | null;

interface EventTypeConfig {
  id: EventType;
  label: string;
  icon: any;
  placeholder: string;
  examples: string[];
  color: string;
  bgColor: string;
  gradient: string;
}

const EVENT_TYPES: EventTypeConfig[] = [
  {
    id: 'sports',
    label: 'Sports',
    icon: Trophy,
    placeholder: 'World Cup 2026, Super Bowl, NBA Finals...',
    examples: ['World Cup 2026', 'NBA Finals', 'Wimbledon'],
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'music',
    label: 'Music',
    icon: Music,
    placeholder: 'Taylor Swift, Coachella, Glastonbury...',
    examples: ['Coachella', 'Beyoncé Tour', 'Glastonbury'],
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'festivals',
    label: 'Festivals',
    icon: PartyPopper,
    placeholder: 'Carnival, Oktoberfest, Burning Man...',
    examples: ['Rio Carnival', 'Oktoberfest', 'La Tomatina'],
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    gradient: 'from-orange-500 to-red-500'
  }
];

// ==================== HELPERS ====================

const CATEGORY_CONFIG = {
  sports:   { color: 'bg-blue-600',   label: 'Sports',   icon: Trophy },
  music:    { color: 'bg-purple-600', label: 'Music',    icon: Music },
  festival: { color: 'bg-orange-600', label: 'Festival', icon: PartyPopper },
  other:    { color: 'bg-gray-600',   label: 'Event',    icon: Ticket },
};

function fmt(amount: number, currency = 'USD'): string {
  return `${currency} ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function formatEventDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  } catch { return dateStr; }
}

// ==================== LIVE EVENT CARD ====================

function LiveEventCard({ event, onSearch }: { event: LiveEvent; onSearch: (name: string) => void }) {
  const cat = CATEGORY_CONFIG[event.category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.other;
  const CatIcon = cat.icon;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 cursor-pointer"
      onClick={() => onSearch(event.name)}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {event.image
          ? <img src={event.image} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className={`w-full h-full ${cat.color} flex items-center justify-center`}><CatIcon size={48} className="text-white opacity-30" /></div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className={`absolute top-3 left-3 ${cat.color} text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1`}>
          <CatIcon size={12} />{cat.label}
        </div>
        {event.priceMin && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
            From {event.currency || 'USD'} {event.priceMin}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-base leading-tight mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {event.name}
        </h3>
        {event.attraction && (
          <p className="text-sm text-purple-600 font-medium mb-2 line-clamp-1">{event.attraction}</p>
        )}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar size={13} />
            <span>{formatEventDate(event.date)}{event.time && ` · ${event.time}`}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin size={13} />
            <span className="line-clamp-1">{event.venue}, {event.city}</span>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onSearch(event.name); }}
          className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles size={14} />
          Plan This Trip
        </button>
      </div>
    </motion.div>
  );
}

// ==================== EVENT HERO CARD (shown in results) ====================

function EventHeroCard({ event, budget, ticketsUrl }: {
  event: AgentResponse['event'];
  budget?: AgentResponse['budget'];
  ticketsUrl?: string;
}) {
  if (!event?.name) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-3xl overflow-hidden mb-8 shadow-2xl min-h-[260px]"
    >
      {event.image
        ? <div className="absolute inset-0"><img src={event.image} alt={event.name} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" /></div>
        : <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-700" />
      }
      <div className="relative z-10 p-8 md:p-12">
        <div className="max-w-2xl">
          {event.type && (
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full mb-4 border border-white/30">
              {event.type === 'sports' ? <Trophy size={14} /> : event.type === 'music' ? <Music size={14} /> : <PartyPopper size={14} />}
              {event.type.charAt(0).toUpperCase() + event.type.slice(1)} Event
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">{event.name}</h1>
          {event.attraction && event.attraction !== event.name && (
            <p className="text-xl text-blue-300 font-medium mb-4">{event.attraction}</p>
          )}
          <div className="flex flex-wrap gap-4 mb-6 text-white/80 text-sm">
            {event.date && <div className="flex items-center gap-2"><Calendar size={15} />{formatEventDate(event.date)}{event.time && ` · ${event.time}`}</div>}
            {event.venue && <div className="flex items-center gap-2"><MapPin size={15} />{event.venue}</div>}
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            {(event.ticketUrl || ticketsUrl) && (
              <a
                href={event.ticketUrl || ticketsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 bg-white text-gray-900 font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition-all shadow-lg text-sm"
              >
                <Ticket size={16} />
                Buy Tickets
                {event.priceMin && <span className="text-blue-600">· From {event.currency || 'USD'} {event.priceMin}</span>}
                <ExternalLink size={13} />
              </a>
            )}
            {budget && (
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-5 py-3 rounded-xl text-sm font-medium">
                Trip budget: <span className="font-bold">{fmt(budget.total, budget.currency)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ==================== ITINERARY BUILDER ====================

function buildEventItinerary(
  agentResponse: AgentResponse,
  startDate?: Date | null,
  endDate?: Date | null
): ItineraryData {
  const totalDays = agentResponse.itinerary?.length || 0;
  if (totalDays === 0) {
    return { overview: '', tripSummary: { totalDays: 0, cities: [] }, budget: { totalBudget: '', dailyAverage: '' }, days: [] };
  }

  let dates: string[] = [];
  const daySlots = agentResponse.travel_dates?.day_slots;

  if (daySlots && daySlots.length > 0) {
    dates = daySlots.map(s => s.date);
  } else if (startDate) {
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
  } else {
    const eventDay = Math.ceil(totalDays / 2);
    const base = agentResponse.event?.date ? new Date(agentResponse.event.date) : new Date();
    base.setDate(base.getDate() - (eventDay - 1));
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
  }

  const eventDayIndex = daySlots ? daySlots.findIndex(s => s.day_type === 'event_day') : Math.ceil(totalDays / 2) - 1;
  const eventDayNumber = eventDayIndex >= 0 ? eventDayIndex + 1 : Math.ceil(totalDays / 2);

  let mappedEventType: 'sports' | 'music' | 'festivals' = 'festivals';
  const evType = agentResponse.event?.type;
  if (evType === 'festival') mappedEventType = 'festivals';
  else if (evType === 'sports' || evType === 'music') mappedEventType = evType;

  const b = agentResponse.budget;
  const cur = b?.currency || 'USD';

  const budgetData: ItineraryData['budget'] = b ? {
    totalBudget:  fmt(b.total, cur),
    dailyAverage: fmt(b.per_day_average, cur),
    eventDayCost: fmt(b.event_tickets + b.per_day_average, cur),
    breakdown: {
      accommodation: fmt(b.accommodation, cur),
      transport:     fmt(b.transport, cur),
      food:          fmt(b.food, cur),
      event:         fmt(b.event_tickets, cur),
      activities:    fmt(b.activities, cur),
    }
  } : {
    totalBudget: 'USD 1,850', dailyAverage: 'USD 370', eventDayCost: 'USD 650',
    breakdown: { accommodation: 'USD 600', transport: 'USD 300', food: 'USD 250', event: 'USD 400', activities: 'USD 300' }
  };

  const dailyAmt   = b?.per_day_average || 370;
  const mornCost   = Math.round(dailyAmt * 0.15);
  const aftnCost   = Math.round(dailyAmt * 0.25);
  const eveCost    = Math.round(dailyAmt * 0.35);
  const ticketCost = b?.event_tickets || 400;

  const city    = agentResponse.destination?.city || '';
  const country = agentResponse.destination?.country || '';
  const evName  = agentResponse.event?.name || 'Featured Event';
  const evDate  = agentResponse.event?.date || dates[eventDayNumber - 1] || '';
  const evVenue = agentResponse.event?.venue || 'Event Venue';

  return {
    overview: `A perfectly structured ${mappedEventType}-centered trip designed around ${evName}, with pre and post exploration days.`,
    eventAnchor: { eventName: evName, eventType: mappedEventType, eventDate: evDate, eventDay: eventDayNumber, venue: evVenue, city, country },
    tripSummary: {
      totalDays, cities: [city],
      highlights: agentResponse.itinerary.map(d => d.title),
      eventPhases: { preEvent: eventDayNumber - 1, eventDay: 1, postEvent: totalDays - eventDayNumber }
    },
    budget: budgetData,
    days: agentResponse.itinerary.map((day, idx) => {
      const isEventDay = (idx + 1) === eventDayNumber;
      const slotLabel  = daySlots?.[idx]?.label || (isEventDay ? 'Event Day' : idx < eventDayNumber - 1 ? 'Pre-Event Day' : 'Post-Event Day');
      const activities = day.activities || [];
      return {
        day: day.day, date: dates[idx] || '', city, theme: day.title, label: slotLabel, isEventDay,
        morning:   { time: '9:00 AM - 12:00 PM', activities: activities[0] || 'Morning exploration', location: city, cost: fmt(mornCost, cur) },
        afternoon: { time: '1:00 PM - 5:00 PM',  activities: activities[1] || (isEventDay ? 'Pre-match build-up and fan zone' : 'Afternoon exploration'), location: isEventDay ? (evVenue || city) : city, cost: fmt(aftnCost, cur) },
        evening: {
          time: isEventDay ? '6:00 PM - 11:00 PM' : '6:00 PM - 9:00 PM',
          activities: activities[2] || (isEventDay ? `Attend ${evName}` : 'Evening activities'),
          location: isEventDay ? (evVenue || city) : city,
          cost: fmt(isEventDay ? ticketCost : eveCost, cur),
          isEventBlock: isEventDay,
          ...(isEventDay && { eventDetails: { doors: '5:30 PM', startTime: '7:00 PM', duration: '2-3 hours', ticketUrl: agentResponse.affiliate_links?.tickets || agentResponse.event?.ticketUrl || '' } })
        }
      };
    })
  };
}

// ==================== MAIN COMPONENT ====================

export default function HomeClient() {
  const router = useRouter();
  const { user, userProfile, updateUserProfile } = useAuth();

  const [eventType, setEventType]   = useState<EventType>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate]   = useState<Date | null>(null);
  const [endDate, setEndDate]       = useState<Date | null>(null);
  const [origin, setOrigin]         = useState("Johannesburg, South Africa");

  const [agentResponse, setAgentResponse] = useState<AgentResponse | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("itinerary");
  const [isListening, setIsListening] = useState(false);

  const [showRefinement, setShowRefinement]   = useState(false);
  const [showTripSummary, setShowTripSummary] = useState(false);
  const [showMaps, setShowMaps]               = useState(false);
  const [showWeather, setShowWeather]         = useState(false);
  const [showVoicePlanner, setShowVoicePlanner] = useState(false);
  const [showSavedTrips, setShowSavedTrips]   = useState(false);

  const [tripPreferences, setTripPreferences] = useState<TripPreferences | null>(null);
  const [savedItems, setSavedItems] = useState<{
    hotels: SavedItem[]; flights: SavedItem[]; restaurants: SavedItem[]; activities: SavedItem[];
  }>({ hotels: [], flights: [], restaurants: [], activities: [] });
  const [currentWeather, setCurrentWeather] = useState<any>(null);

  // ✅ Live events state
  const [liveEvents, setLiveEvents]           = useState<LiveEvent[]>([]);
  const [liveEventsLoading, setLiveEventsLoading] = useState(true);
  const [activeCategory, setActiveCategory]   = useState<'all' | 'sports' | 'music' | 'festival'>('all');

  // ✅ Fetch live events on mount
  useEffect(() => {
    fetch('/api/featured-events')
      .then(r => r.json())
      .then(data => { if (data.success) setLiveEvents(data.events); })
      .catch(console.error)
      .finally(() => setLiveEventsLoading(false));
  }, []);

  // ==================== COMPUTED ====================

  const currentEventConfig = EVENT_TYPES.find(e => e.id === eventType);
  const searchPlaceholder  = currentEventConfig?.placeholder || "Select an event type above to get started";
  const totalSavedItems    = Object.values(savedItems).reduce((sum, items) => sum + items.length, 0);
  const destination        = agentResponse?.destination?.city || "";
  const filteredLiveEvents = activeCategory === 'all' ? liveEvents : liveEvents.filter(e => e.category === activeCategory);
  const itineraryData: ItineraryData | null =
    agentResponse && agentResponse.intent !== 'city_selection_required'
      ? buildEventItinerary(agentResponse, startDate, endDate)
      : null;

  // ==================== HANDLERS ====================

  const handleEventTypeSelect = (type: EventType) => {
    setEventType(type);
    setSearchQuery("");
    setAgentResponse(null);
    if (user) profileManager.trackTripPlanned(user.uid, `Event Type: ${type}`).catch(console.error);
  };

  // ✅ Clicking a live event card populates search and fires immediately
  const handleLiveEventSearch = (eventName: string) => {
    setSearchQuery(eventName);
    if (!eventType) setEventType('sports');
    setTimeout(() => handleSearch(eventName), 50);
  };

  const handleSaveItem = async (item: any, type: 'hotel' | 'flight' | 'restaurant' | 'activity') => {
    const savedItem: SavedItem = {
      id: item.id?.toString() || Math.random().toString(),
      type,
      name:        item.name || item.airline || item.title || 'Unnamed Item',
      price:       item.price?.toString() || item.estimatedCost?.toString() || '$0',
      location:    item.location || item.address || item.destination || '',
      date:        item.date || item.departureDate || '',
      image:       item.image || item.photo || '',
      affiliateUrl: item.bookingUrl || item.affiliateUrl || '#',
      partner:     item.partner || 'TravelPayouts',
      description: item.description || ''
    };
    setSavedItems(prev => {
      const typeKey = `${type}s` as keyof typeof prev;
      const current = prev[typeKey] || [];
      const exists  = current.some(i => i.id === savedItem.id);
      if (exists) { toast.success('Removed from trip'); return { ...prev, [typeKey]: current.filter(i => i.id !== savedItem.id) }; }
      toast.success('Saved to trip!', { action: { label: 'View', onClick: () => setShowTripSummary(true) } });
      return { ...prev, [typeKey]: [...current, savedItem] };
    });
    if (user) {
      await profileManager.trackBooking(user.uid, {
        type, name: savedItem.name, price: parseFloat(savedItem.price.replace(/[^0-9.]/g, '')) || 0,
        rating: item.rating || 0, destination
      });
    }
  };

  const handleRemoveItem = (type: string, id: string) => {
    setSavedItems(prev => {
      const typeKey = (type + 's') as keyof typeof prev;
      return { ...prev, [typeKey]: (prev[typeKey] || []).filter((i: SavedItem) => i.id !== id) };
    });
    toast.success('Item removed');
  };

  const handleCitySelect = async (params: { selected_event_id: string; selected_city_id: string; selected_match_date: string; }) => {
    setLoading(true); setError(null);
    const loadingToast = toast.loading('Building your trip...');
    try {
      const res    = await fetch('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: searchQuery, ...params, budget_level: tripPreferences?.budget === 'Budget' ? 'budget' : tripPreferences?.budget === 'Luxury' || tripPreferences?.budget === 'Ultra-Luxury' ? 'luxury' : 'mid', origin_country_code: 'ZA' }) });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Agent processing failed');
      setAgentResponse(result.data);
      toast.success('Your trip is ready!', { id: loadingToast });
      setTimeout(() => document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' }), 300);
    } catch (err: any) {
      setError(err.message || 'Failed to build trip');
      toast.error('Failed to build trip', { id: loadingToast, description: err.message });
    } finally { setLoading(false); }
  };

  const handleSearch = async (query?: string, preferences?: TripPreferences) => {
    const location = query || searchQuery;
    if (!location.trim()) { toast.error('Please enter an event or destination'); return; }
    if (!eventType)        { toast.error('Please select an event type first');    return; }

    const prefs = preferences || tripPreferences;
    setLoading(true); setError(null);
    const loadingToast = toast.loading(`Searching live events for "${location}"...`);

    try {
      const res    = await fetch('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: location, context: { eventType, origin: prefs?.origin || origin, budget: prefs?.budget || 'moderate', days: prefs?.days || 5, groupSize: prefs?.groupSize || 1, groupType: prefs?.groupType || 'solo', startDate: startDate?.toISOString(), endDate: endDate?.toISOString() } }) });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Agent processing failed');

      const agentData: AgentResponse = result.data;
      setAgentResponse(agentData);

      if (user) {
        await profileManager.trackTripPlanned(user.uid, location);
        if (prefs) await updateUserProfile({ preferredTripTypes: prefs.tripType ? [prefs.tripType as any] : userProfile?.preferredTripTypes || [], budgetRange: prefs.budget as any, typicalGroupSize: prefs.groupSize || 1, typicalGroupType: prefs.groupType as any });
      }

      if (agentData.intent === 'city_selection_required') {
        toast.success(`${agentData.event_name} — pick your city`, { id: loadingToast, description: `${agentData.cities?.length || 0} host cities available` });
      } else {
        const evName = agentData.event?.name || location;
        toast.success(`Found: ${evName}`, { id: loadingToast, description: `${agentData.hotels?.length || 0} hotels · ${agentData.flights?.length || 0} flights` });
      }
      setTimeout(() => document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' }), 500);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Search failed. Please try again.');
      toast.error('Search failed', { id: loadingToast, description: err.message || 'Please try again' });
    } finally { setLoading(false); }
  };

  const toggleVoiceInput = () => { setIsListening(!isListening); if (!isListening) toast.success('Voice input activated'); };
  const handleRefinementSubmit = async (preferences: TripPreferences) => { setTripPreferences(preferences); setShowRefinement(false); await handleSearch(searchQuery, preferences); };

  // ==================== RENDER ====================

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 pt-32 pb-24">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-purple-50 rounded-full blur-3xl opacity-40" />
        </div>
        <div className="max-w-5xl mx-auto text-center w-full space-y-16 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-blue-600">Live Event Intelligence · Powered by AI</span>
            </div>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-gray-900 leading-[1.05]">
              You pick the event.<br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">We build the trip.</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              The global intelligence layer for event travel. One search finds your tickets, flights, hotels, and complete itinerary.
            </p>
          </motion.div>

          {/* Event type selector */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} className="max-w-2xl mx-auto space-y-4">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Select Event Type</p>
            <div className="grid grid-cols-3 gap-3">
              {EVENT_TYPES.map((type) => {
                const Icon = type.icon; const isSelected = eventType === type.id;
                return (
                  <button key={type.id} onClick={() => handleEventTypeSelect(type.id)} className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${isSelected ? `${type.bgColor} border-current shadow-xl scale-[1.02]` : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'}`}>
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${isSelected ? `bg-gradient-to-br ${type.gradient} text-white shadow-lg` : 'bg-gray-50 text-gray-400'}`}><Icon size={26} /></div>
                      <span className={`font-semibold text-base ${isSelected ? type.color : 'text-gray-700'}`}>{type.label}</span>
                    </div>
                    {isSelected && <motion.div layoutId="selected-event" className="absolute inset-0 rounded-2xl border-2 border-blue-600" transition={{ type: "spring", stiffness: 500, damping: 30 }} />}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Search */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} className="max-w-3xl mx-auto space-y-4">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={24} />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchQuery.trim() && eventType && handleSearch()}
                disabled={!eventType}
                className={`w-full h-20 pl-16 pr-24 text-lg font-medium rounded-3xl border-2 bg-white shadow-xl transition-all ${!eventType ? 'border-gray-200 opacity-60 cursor-not-allowed' : 'border-gray-300 hover:border-gray-400 focus:border-blue-600 focus:shadow-2xl'}`}
              />
              <button onClick={toggleVoiceInput} disabled={!eventType} className={`absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isListening ? 'bg-blue-600 text-white shadow-lg' : !eventType ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-600'}`}>
                {isListening ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
            </div>
            <AnimatePresence>
              {searchQuery && eventType && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3">
                  <input type="date" value={startDate?.toISOString().split('T')[0] || ''} onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)} className="flex-1 h-14 px-4 bg-white border-2 border-gray-200 rounded-2xl text-sm font-medium hover:border-gray-300 focus:border-blue-600 transition-all" />
                  <ArrowRight className="text-gray-300 flex-shrink-0" size={20} />
                  <input type="date" value={endDate?.toISOString().split('T')[0] || ''} onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)} className="flex-1 h-14 px-4 bg-white border-2 border-gray-200 rounded-2xl text-sm font-medium hover:border-gray-300 focus:border-blue-600 transition-all" />
                </motion.div>
              )}
            </AnimatePresence>
            <button onClick={() => handleSearch()} disabled={!searchQuery.trim() || !eventType || loading} className="w-full h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-3xl text-lg transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400">
              {loading ? <span className="flex items-center justify-center gap-3"><Loader2 size={20} className="animate-spin" />AI is searching live events...</span> : `Find ${eventType ? currentEventConfig?.label : 'Event'} Travel`}
            </button>
            <div className="flex gap-2 pt-2">
              <Button onClick={() => setShowVoicePlanner(true)} variant="ghost" size="sm" className="flex-1 text-gray-600"><Mic size={16} className="mr-2" />Voice Planner</Button>
              <Button onClick={() => setShowSavedTrips(true)} variant="ghost" size="sm" className="flex-1 text-gray-600"><Bookmark size={16} className="mr-2" />Saved Trips</Button>
              <Button onClick={() => router.push('/settings')} variant="ghost" size="sm" className="text-gray-600"><Settings size={16} /></Button>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="pt-12">
            <ChevronDown className="w-6 h-6 text-gray-300 animate-bounce mx-auto" />
          </motion.div>
        </div>
      </section>

      {/* TRUST SIGNALS */}
      <section className="py-16 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          {[
            { icon: Shield,       title: 'Secure Booking',          sub: 'Bank-level encryption' },
            { icon: Ticket,       title: 'Live Event Data',          sub: 'Ticketmaster & PredictHQ' },
            { icon: CheckCircle2, title: 'Powered by TravelPayouts', sub: 'Trusted travel partners' },
            { icon: Sparkles,     title: 'AI-Optimized',             sub: 'Smart event logistics' },
          ].map(({ icon: Icon, title, sub }, idx) => (
            <div key={idx} className="text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3"><Icon className="text-white" size={24} /></div>
              <h4 className="font-bold text-gray-900 mb-1 text-sm">{title}</h4>
              <p className="text-xs text-gray-600">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ✅ LIVE EVENTS DISCOVERY — replaces <EventsBanner /> */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-green-600 uppercase tracking-wider">Live from Ticketmaster</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900">Upcoming Events</h2>
              <p className="text-gray-600 mt-2">Real events happening now. Click any to plan your trip instantly.</p>
            </div>
            <div className="hidden md:flex gap-2">
              {(['all', 'sports', 'music', 'festival'] as const).map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${activeCategory === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {liveEventsLoading ? (
            <div className="grid md:grid-cols-3 gap-6">{[1,2,3,4,5,6].map(i => <div key={i} className="bg-gray-100 rounded-3xl h-80 animate-pulse" />)}</div>
          ) : filteredLiveEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLiveEvents.map((event, idx) => (
                <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                  <LiveEventCard event={event} onSearch={handleLiveEventSearch} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <TrendingUp size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No live events loaded</p>
              <p className="text-sm mt-1">Search above for any event worldwide</p>
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-32 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-xl text-gray-600">Three steps. One intelligent system.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: "1", title: "Pick your event",      desc: "Tell us what you're going to—sports, music, or festivals." },
              { step: "2", title: "AI builds your stack", desc: "We find tickets, flights, hotels, and create your complete itinerary." },
              { step: "3", title: "Book everything",      desc: "Secure booking through our trusted partners. One trip, fully orchestrated." }
            ].map((item, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1, duration: 0.6 }} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6 shadow-lg">{item.step}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 text-lg leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* RESULTS */}
      {(agentResponse || loading) && (
        <section id="results-section" className="px-6 py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {loading && (
              <div className="text-center py-32">
                <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{agentResponse?.intent === 'city_selection_required' ? 'Building your trip...' : `AI is orchestrating your ${eventType} trip...`}</h3>
                <p className="text-gray-600">Finding tickets, flights, hotels, and building your itinerary</p>
              </div>
            )}
            {!loading && agentResponse && (
              <>
                {agentResponse.intent === 'city_selection_required' && agentResponse.cities ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-8">
                    <CityPicker eventId={agentResponse.event_id!} eventName={agentResponse.event_name || agentResponse.event?.name || 'Event'} cities={agentResponse.cities} onSelect={handleCitySelect} />
                  </motion.div>
                ) : (
                  <>
                    {/* ✅ Real event hero — shows image, name, venue, ticket link, price */}
                    <EventHeroCard event={agentResponse.event} budget={agentResponse.budget} ticketsUrl={agentResponse.affiliate_links?.tickets} />

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                      <div className="flex items-start justify-between mb-4">
                        <p className="text-gray-500 text-lg">{destination}{startDate && endDate && ` · ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`}</p>
                        <div className="flex gap-3">
                          {currentWeather && <Button onClick={() => setShowWeather(true)} variant="outline" size="sm"><CloudRain size={16} className="mr-2" />{currentWeather.temp}°</Button>}
                          <Button onClick={() => setShowMaps(true)} variant="outline" size="sm"><MapPin size={16} className="mr-2" />Map</Button>
                          {totalSavedItems > 0 && <Button onClick={() => setShowTripSummary(true)} size="sm" className="bg-blue-600 hover:bg-blue-700"><Bookmark size={16} className="mr-2" />Trip ({totalSavedItems})</Button>}
                        </div>
                      </div>
                      {eventType && currentEventConfig && <Badge variant="secondary" className="text-sm"><currentEventConfig.icon size={14} className="mr-1" />{currentEventConfig.label} Event</Badge>}
                    </motion.div>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="w-full justify-start mb-8 bg-white p-2 rounded-2xl shadow-sm">
                        <TabsTrigger value="itinerary" className="flex items-center gap-2"><Sparkles size={16} />Itinerary</TabsTrigger>
                        <TabsTrigger value="hotels" className="flex items-center gap-2"><Hotel size={16} />Hotels{agentResponse.hotels?.length > 0 && <Badge variant="secondary">{agentResponse.hotels.length}</Badge>}</TabsTrigger>
                        <TabsTrigger value="flights" className="flex items-center gap-2"><Plane size={16} />Flights{agentResponse.flights?.length > 0 && <Badge variant="secondary">{agentResponse.flights.length}</Badge>}</TabsTrigger>
                      </TabsList>
                      <TabsContent value="itinerary">{itineraryData && <ItineraryView data={itineraryData} />}</TabsContent>
                      <TabsContent value="hotels"><HotelResults hotels={agentResponse.hotels || []} onSaveItem={(h) => handleSaveItem(h, 'hotel')} loading={false} /></TabsContent>
                      <TabsContent value="flights"><FlightResults flights={agentResponse.flights || []} onSaveItem={(f) => handleSaveItem(f, 'flight')} loading={false} /></TabsContent>
                    </Tabs>
                  </>
                )}
              </>
            )}
          </div>
        </section>
      )}

      <Footer />

      {/* MODALS */}
      {showRefinement && <TripRefinementModal isOpen={showRefinement} onClose={() => setShowRefinement(false)} onGenerate={handleRefinementSubmit} destination={destination} isLoading={loading} eventContext={agentResponse?.event?.name ? { name: agentResponse.event.name, date: agentResponse.event.date || '', type: agentResponse.event.type === 'festival' ? 'festivals' : agentResponse.event.type === 'conference' ? 'other' : agentResponse.event.type || 'other' } : undefined} />}
      {showTripSummary && <TripSummary isOpen={showTripSummary} onClose={() => setShowTripSummary(false)} savedItems={savedItems} onRemoveItem={handleRemoveItem} destination={destination} />}
      {showMaps && destination && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between"><h3 className="text-2xl font-bold">Map & Directions</h3><button onClick={() => setShowMaps(false)} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">✕</button></div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]"><MapsDirections destination={destination} defaultOrigin={origin} /></div>
          </div>
        </div>
      )}
      {showWeather && destination && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between"><h3 className="text-2xl font-bold">Weather Forecast</h3><button onClick={() => setShowWeather(false)} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">✕</button></div>
            <div className="p-6"><WeatherWidget destination={destination} showRecommendations={true} showHourlyForecast={false} onWeatherLoad={setCurrentWeather} /></div>
          </div>
        </div>
      )}
      {showVoicePlanner && <VoiceTripPlanner />}
      {showSavedTrips && <SavedTrips />}
      <GladysChat />
      <EventNotificationToast userLocation={origin} />
    </main>
  );
}