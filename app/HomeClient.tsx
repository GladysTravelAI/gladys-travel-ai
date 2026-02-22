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
  Utensils,
  Zap,
  Bookmark,
  Settings,
  CloudRain,
  Trophy,
  Music,
  PartyPopper,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ==================== COMPONENTS ====================
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventsBanner from '@/components/EventsBanner';
import EventNotificationToast from '@/components/EventNotificationToast';
import HotelResults from "@/components/HotelResults";
import RestaurantResults from "@/components/RestaurantResults";
import ActivityResults from "@/components/ActivityResults";
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

// ==================== LIB IMPORTS ====================
import { ItineraryData } from "@/lib/mock-itinerary";
import { profileManager } from "@/lib/userProfile";
import { useAuth } from "@/lib/AuthContext";

// ==================== UI COMPONENTS ====================
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
  destination: {
    city: string | null;
    country: string | null;
  };
  event: {
    name: string | null;
    type: 'sports' | 'music' | 'festival' | 'conference' | 'other' | null;
    date: string | null;
    venue: string | null;
  };
  itinerary: Array<{
    day: number;
    title: string;
    activities: string[];
  }>;
  hotels: any[];
  flights: any[];
  affiliate_links: {
    hotel: string;
    flight: string;
    tickets: string;
  };
  upsells: {
    insurance: boolean;
    esim: boolean;
  };
  message: string;
  // From logic engine — real computed numbers
  budget?: {
    accommodation: number;
    transport: number;
    food: number;
    event_tickets: number;
    activities: number;
    total: number;
    currency: string;
    per_day_average: number;
    esim?: number;
    insurance?: number;
  };
  travel_dates?: {
    arrival_date: string;
    departure_date: string;
    total_nights: number;
    day_slots: Array<{
      date: string;
      day_type: 'arrival' | 'pre_event' | 'event_day' | 'post_event' | 'departure';
      label: string;
    }>;
  };
  // City selection fields — present when intent === 'city_selection_required'
  event_id?: string;
  event_name?: string;
  cities?: Array<{
    city_id: string;
    name: string;
    country: string;
    iata_code: string;
    sessions: Array<{
      session_id: string;
      date: string;
      time?: string;
      round?: string;
      description?: string;
    }>;
  }>;
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

// ==================== ITINERARY BUILDER ====================

// ==================== BUDGET HELPERS ====================

function fmt(amount: number, currency = 'USD'): string {
  return `${currency} ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function buildEventItinerary(agentResponse: AgentResponse, startDate?: Date | null, endDate?: Date | null): ItineraryData {
  const totalDays = agentResponse.itinerary.length;

  // ---- Dates: prefer travel_dates from logic engine, then user input, then derive from event date ----
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
    const base = agentResponse.event.date ? new Date(agentResponse.event.date) : new Date();
    base.setDate(base.getDate() - (eventDay - 1));
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
  }

  // ---- Event day index ----
  const eventDayIndex = daySlots
    ? daySlots.findIndex(s => s.day_type === 'event_day')
    : Math.ceil(totalDays / 2) - 1;
  const eventDayNumber = eventDayIndex >= 0 ? eventDayIndex + 1 : Math.ceil(totalDays / 2);

  // ---- Event type mapping ----
  let mappedEventType: 'sports' | 'music' | 'festivals';
  if (agentResponse.event.type === 'festival') mappedEventType = 'festivals';
  else if (agentResponse.event.type === 'sports' || agentResponse.event.type === 'music') mappedEventType = agentResponse.event.type;
  else mappedEventType = 'festivals';

  // ---- Budget: use real numbers from logic engine, fall back gracefully ----
  const b = agentResponse.budget;
  const cur = b?.currency || 'USD';

  const budgetData: ItineraryData['budget'] = b ? {
    totalBudget: fmt(b.total, cur),
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
    totalBudget:   'USD 1,850',
    dailyAverage:  'USD 370',
    eventDayCost:  'USD 650',
    breakdown: {
      accommodation: 'USD 600',
      transport:     'USD 300',
      food:          'USD 250',
      event:         'USD 400',
      activities:    'USD 300',
    }
  };

  // ---- Per-slot cost splits (proportional from real budget) ----
  const dailyAmt   = b?.per_day_average || 370;
  const mornCost   = Math.round(dailyAmt * 0.15);
  const aftnCost   = Math.round(dailyAmt * 0.25);
  const eveCost    = Math.round(dailyAmt * 0.35);
  const ticketCost = b?.event_tickets || 400;

  return {
    overview: `A perfectly structured ${mappedEventType}-centered trip designed around ${agentResponse.event.name || 'your main event'}, with pre and post exploration days.`,
    eventAnchor: {
      eventName: agentResponse.event.name || 'Featured Event',
      eventType: mappedEventType,
      eventDate: agentResponse.event.date || dates[eventDayNumber - 1] || '',
      eventDay:  eventDayNumber,
      venue:     agentResponse.event.venue || 'Event Venue',
      city:      agentResponse.destination.city || '',
      country:   agentResponse.destination.country || '',
    },
    tripSummary: {
      totalDays,
      cities:    [agentResponse.destination.city || ''],
      highlights: agentResponse.itinerary.map(d => d.title),
      eventPhases: {
        preEvent:  eventDayNumber - 1,
        eventDay:  1,
        postEvent: totalDays - eventDayNumber,
      }
    },
    budget: budgetData,
    days: agentResponse.itinerary.map((day, idx) => {
      const isEventDay = (idx + 1) === eventDayNumber;
      const slotLabel  = daySlots?.[idx]?.label || (isEventDay ? 'Event Day' : idx < eventDayNumber - 1 ? 'Pre-Event Day' : 'Post-Event Day');
      const activities = day.activities;
      const city       = agentResponse.destination.city || '';

      return {
        day:        day.day,
        date:       dates[idx] || '',
        city,
        theme:      day.title,
        label:      slotLabel,
        isEventDay,
        morning: {
          time:       '9:00 AM - 12:00 PM',
          activities: activities[0] || 'Morning exploration',
          location:   city,
          cost:       fmt(mornCost, cur),
        },
        afternoon: {
          time:       '1:00 PM - 5:00 PM',
          activities: activities[1] || (isEventDay ? 'Pre-match build-up and fan zone' : 'Afternoon exploration'),
          location:   isEventDay ? (agentResponse.event.venue || city) : city,
          cost:       fmt(aftnCost, cur),
        },
        evening: {
          time:        isEventDay ? '6:00 PM - 11:00 PM' : '6:00 PM - 9:00 PM',
          activities:  activities[2] || (isEventDay ? `Attend ${agentResponse.event.name || 'the event'}` : 'Evening activities'),
          location:    isEventDay ? (agentResponse.event.venue || city) : city,
          cost:        fmt(isEventDay ? ticketCost : eveCost, cur),
          isEventBlock: isEventDay,
          ...(isEventDay && {
            eventDetails: {
              doors:     '5:30 PM',
              startTime: '7:00 PM',
              duration:  '2-3 hours',
              ticketUrl: agentResponse.affiliate_links?.tickets || '',
            }
          })
        }
      };
    })
  };
}

// ==================== MAIN COMPONENT ====================

export default function HomeClient() {
  const router = useRouter();
  const { user, userProfile, updateUserProfile } = useAuth();
  
  // ==================== CORE STATE ====================
  
  const [eventType, setEventType] = useState<EventType>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [origin, setOrigin] = useState("Johannesburg, South Africa");
  
  const [agentResponse, setAgentResponse] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState("itinerary");
  const [isListening, setIsListening] = useState(false);
  
  const [showRefinement, setShowRefinement] = useState(false);
  const [showTripSummary, setShowTripSummary] = useState(false);
  const [showMaps, setShowMaps] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showVoicePlanner, setShowVoicePlanner] = useState(false);
  const [showSavedTrips, setShowSavedTrips] = useState(false);
  
  const [tripPreferences, setTripPreferences] = useState<TripPreferences | null>(null);
  
  const [savedItems, setSavedItems] = useState<{
    hotels: SavedItem[];
    flights: SavedItem[];
    restaurants: SavedItem[];
    activities: SavedItem[];
  }>({
    hotels: [],
    flights: [],
    restaurants: [],
    activities: []
  });

  const [currentWeather, setCurrentWeather] = useState<any>(null);

  // ==================== COMPUTED VALUES ====================
  
  const currentEventConfig = EVENT_TYPES.find(e => e.id === eventType);
  const searchPlaceholder = currentEventConfig?.placeholder || "Select an event type above to get started";
  const totalSavedItems = Object.values(savedItems).reduce((sum, items) => sum + items.length, 0);
  const destination = agentResponse?.destination?.city || "";
  const itineraryData: ItineraryData | null = agentResponse && agentResponse.intent !== 'city_selection_required'
    ? buildEventItinerary(agentResponse, startDate, endDate)
    : null;

  // ==================== HANDLERS ====================
  
  const handleEventTypeSelect = (type: EventType) => {
    setEventType(type);
    setSearchQuery("");
    setAgentResponse(null);
    if (user) {
      profileManager.trackTripPlanned(user.uid, `Event Type: ${type}`).catch(console.error);
    }
  };

  const handleSaveItem = async (item: any, type: 'hotel' | 'flight' | 'restaurant' | 'activity') => {
    const savedItem: SavedItem = {
      id: item.id?.toString() || Math.random().toString(),
      type,
      name: item.name || item.airline || item.title || 'Unnamed Item',
      price: item.price?.toString() || item.estimatedCost?.toString() || '$0',
      location: item.location || item.address || item.destination || '',
      date: item.date || item.departureDate || '',
      image: item.image || item.photo || '',
      affiliateUrl: item.bookingUrl || item.affiliateUrl || '#',
      partner: item.partner || 'TravelPayouts',
      description: item.description || ''
    };

    setSavedItems(prev => {
      const typeKey = `${type}s` as keyof typeof prev;
      const currentItems = prev[typeKey] || [];
      const exists = currentItems.some(i => i.id === savedItem.id);
      if (exists) {
        toast.success('Removed from trip');
        return { ...prev, [typeKey]: currentItems.filter(i => i.id !== savedItem.id) };
      } else {
        toast.success('Saved to trip!', {
          action: { label: 'View', onClick: () => setShowTripSummary(true) },
        });
        return { ...prev, [typeKey]: [...currentItems, savedItem] };
      }
    });

    if (user) {
      await profileManager.trackBooking(user.uid, {
        type,
        name: savedItem.name,
        price: parseFloat(savedItem.price.replace(/[^0-9.]/g, '')) || 0,
        rating: item.rating || 0,
        destination
      });
    }
  };

  const handleRemoveItem = (type: string, id: string) => {
    setSavedItems(prev => {
      const typeKey = (type + 's') as keyof typeof prev;
      const currentItems = prev[typeKey] || [];
      return { ...prev, [typeKey]: currentItems.filter((item: SavedItem) => item.id !== id) };
    });
    toast.success('Item removed');
  };

  // ==================== CITY SELECTION HANDLER ====================
  // Fires when user picks a city + match date from CityPicker

  const handleCitySelect = async (params: {
    selected_event_id: string;
    selected_city_id: string;
    selected_match_date: string;
  }) => {
    setLoading(true);
    setError(null);
    const loadingToast = toast.loading('Building your trip...');

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: searchQuery,
          ...params,
          budget_level: tripPreferences?.budget === 'Budget' ? 'budget'
            : tripPreferences?.budget === 'Luxury' || tripPreferences?.budget === 'Ultra-Luxury' ? 'luxury'
            : 'mid',
          origin_country_code: 'ZA',
        })
      });

      if (!response.ok) throw new Error('Agent request failed');
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Agent processing failed');

      setAgentResponse(result.data);
      toast.success('Your trip is ready!', { id: loadingToast });

      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);

    } catch (err: any) {
      setError(err.message || 'Failed to build trip');
      toast.error('Failed to build trip', { id: loadingToast, description: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ==================== MAIN SEARCH ====================
  
  const handleSearch = async (query?: string, preferences?: TripPreferences) => {
    const location = query || searchQuery;
    
    if (!location.trim()) {
      toast.error('Please enter an event or destination');
      return;
    }

    if (!eventType) {
      toast.error('Please select an event type first');
      return;
    }

    const prefs = preferences || tripPreferences;
    setLoading(true);
    setError(null);
    
    const loadingToast = toast.loading(`Finding the best ${eventType} travel options...`);
    
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: location,
          context: {
            eventType,
            origin: prefs?.origin || origin,
            budget: prefs?.budget || 'moderate',
            days: prefs?.days || 5,
            groupSize: prefs?.groupSize || 1,
            groupType: prefs?.groupType || 'solo',
            startDate: startDate?.toISOString(),
            endDate: endDate?.toISOString(),
          }
        })
      });

      if (!response.ok) throw new Error('Agent request failed');

      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Agent processing failed');

      const agentData: AgentResponse = result.data;
      setAgentResponse(agentData);

      if (user) {
        await profileManager.trackTripPlanned(user.uid, location);
        if (prefs) {
          await updateUserProfile({
            preferredTripTypes: prefs.tripType ? [prefs.tripType as any] : userProfile?.preferredTripTypes || [],
            budgetRange: prefs.budget as any,
            typicalGroupSize: prefs.groupSize || 1,
            typicalGroupType: prefs.groupType as any
          });
        }
      }

      // Different toast for city selection vs full trip
      if (agentData.intent === 'city_selection_required') {
        toast.success(`${agentData.event_name} — pick your city`, {
          id: loadingToast,
          description: `${agentData.cities?.length || 0} host cities available`
        });
      } else {
        toast.success(`Found amazing ${eventType} options!`, {
          id: loadingToast,
          description: `${agentData.hotels?.length || 0} hotels, ${agentData.flights?.length || 0} flights`
        });
      }

      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
      
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Search failed. Please try again.');
      toast.error('Search failed', {
        id: loadingToast,
        description: err.message || 'Please try again'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    setIsListening(!isListening);
    if (!isListening) toast.success('Voice input activated');
  };

  const handleRefinementSubmit = async (preferences: TripPreferences) => {
    setTripPreferences(preferences);
    setShowRefinement(false);
    await handleSearch(searchQuery, preferences);
  };

  // ==================== RENDER ====================
  
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 pt-32 pb-24">
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl opacity-40"></div>
          <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-purple-50 rounded-full blur-3xl opacity-40"></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center w-full space-y-16 relative z-10">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100">
              <Sparkles className="text-blue-600" size={16} />
              <span className="text-sm font-semibold text-blue-600">Powered by AI Event Intelligence</span>
            </div>
            
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-gray-900 leading-[1.05]">
              You pick the event.
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                We build the trip.
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              The global intelligence layer for event travel. One search finds your tickets, flights, hotels, and complete itinerary.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl mx-auto space-y-4"
          >
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Select Event Type
            </p>
            
            <div className="grid grid-cols-3 gap-3">
              {EVENT_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = eventType === type.id;
                
                return (
                  <button
                    key={type.id}
                    onClick={() => handleEventTypeSelect(type.id)}
                    className={`
                      relative p-6 rounded-2xl border-2 transition-all duration-300
                      ${isSelected 
                        ? `${type.bgColor} border-current shadow-xl scale-[1.02]` 
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className={`
                        w-14 h-14 rounded-xl flex items-center justify-center transition-all
                        ${isSelected 
                          ? `bg-gradient-to-br ${type.gradient} text-white shadow-lg` 
                          : 'bg-gray-50 text-gray-400'
                        }
                      `}>
                        <Icon size={26} />
                      </div>
                      <span className={`font-semibold text-base ${isSelected ? type.color : 'text-gray-700'}`}>
                        {type.label}
                      </span>
                    </div>
                    
                    {isSelected && (
                      <motion.div
                        layoutId="selected-event"
                        className="absolute inset-0 rounded-2xl border-2 border-blue-600"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl mx-auto space-y-4"
          >
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={24} />
              <Input 
                placeholder={searchPlaceholder}
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchQuery.trim() && eventType && handleSearch()}
                disabled={!eventType}
                className={`
                  w-full h-20 pl-16 pr-24 text-lg font-medium rounded-3xl border-2 
                  bg-white shadow-xl transition-all
                  ${!eventType 
                    ? 'border-gray-200 opacity-60 cursor-not-allowed' 
                    : 'border-gray-300 hover:border-gray-400 focus:border-blue-600 focus:shadow-2xl'
                  }
                `}
              />
              <button 
                onClick={toggleVoiceInput} 
                disabled={!eventType}
                className={`
                  absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl 
                  flex items-center justify-center transition-all
                  ${isListening 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : !eventType
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'hover:bg-gray-100 text-gray-600'
                  }
                `}
              >
                {isListening ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
            </div>

            <AnimatePresence>
              {searchQuery && eventType && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex-1">
                    <input
                      type="date"
                      value={startDate?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                      className="w-full h-14 px-4 bg-white border-2 border-gray-200 rounded-2xl text-sm font-medium hover:border-gray-300 focus:border-blue-600 transition-all"
                    />
                  </div>
                  <ArrowRight className="text-gray-300 flex-shrink-0" size={20} />
                  <div className="flex-1">
                    <input
                      type="date"
                      value={endDate?.toISOString().split('T')[0] || ''}
                      onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                      className="w-full h-14 px-4 bg-white border-2 border-gray-200 rounded-2xl text-sm font-medium hover:border-gray-300 focus:border-blue-600 transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              onClick={() => handleSearch()} 
              disabled={!searchQuery.trim() || !eventType || loading}
              className="w-full h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-3xl text-lg transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <Loader2 size={20} className="animate-spin" />
                  AI is building your trip...
                </span>
              ) : (
                `Find ${eventType ? currentEventConfig?.label : 'Event'} Travel`
              )}
            </button>

            <div className="flex gap-2 pt-2">
              <Button onClick={() => setShowVoicePlanner(true)} variant="ghost" size="sm" className="flex-1 text-gray-600">
                <Mic size={16} className="mr-2" />
                Voice Planner
              </Button>
              <Button onClick={() => setShowSavedTrips(true)} variant="ghost" size="sm" className="flex-1 text-gray-600">
                <Bookmark size={16} className="mr-2" />
                Saved Trips
              </Button>
              <Button onClick={() => router.push('/settings')} variant="ghost" size="sm" className="text-gray-600">
                <Settings size={16} />
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="pt-12"
          >
            <ChevronDown className="w-6 h-6 text-gray-300 animate-bounce mx-auto" />
          </motion.div>
        </div>
      </section>

      {/* ==================== TRUST SIGNALS ==================== */}
      <section className="py-16 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Shield, title: 'Secure Booking', sub: 'Bank-level encryption' },
              { icon: Ticket, title: 'Official Sources', sub: 'Ticketmaster, StubHub verified' },
              { icon: CheckCircle2, title: 'Powered by TravelPayouts', sub: 'Trusted travel partners' },
              { icon: Sparkles, title: 'AI-Optimized', sub: 'Smart event logistics' },
            ].map(({ icon: Icon, title, sub }, idx) => (
              <div key={idx} className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="text-white" size={24} />
                </div>
                <h4 className="font-bold text-gray-900 mb-1 text-sm">{title}</h4>
                <p className="text-xs text-gray-600">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FEATURED EVENTS ==================== */}
      <EventsBanner />

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-xl text-gray-600">Three steps. One intelligent system.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: "1", title: "Pick your event", desc: "Tell us what you're going to—sports, music, or festivals." },
              { step: "2", title: "AI builds your stack", desc: "We find tickets, flights, hotels, and create your complete itinerary." },
              { step: "3", title: "Book everything", desc: "Secure booking through our trusted partners. One trip, fully orchestrated." }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6 shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 text-lg leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== RESULTS SECTION ==================== */}
      {(agentResponse || loading) && (
        <section id="results-section" className="px-6 py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            
            {/* Loading State */}
            {loading && (
              <div className="text-center py-32">
                <Loader2 size={48} className="animate-spin text-blue-600 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {agentResponse?.intent === 'city_selection_required'
                    ? 'Building your trip...'
                    : `AI is orchestrating your ${eventType} trip...`
                  }
                </h3>
                <p className="text-gray-600">Finding tickets, flights, hotels, and building your itinerary</p>
              </div>
            )}

            {/* Results */}
            {!loading && agentResponse && (
              <>
                {/* ---- CITY SELECTION (multi-city events like World Cup) ---- */}
                {agentResponse.intent === 'city_selection_required' && agentResponse.cities ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="py-8"
                  >
                    <CityPicker
                      eventId={agentResponse.event_id!}
                      eventName={agentResponse.event_name || agentResponse.event.name || 'Event'}
                      cities={agentResponse.cities}
                      onSelect={handleCitySelect}
                    />
                  </motion.div>

                ) : (
                  // ---- FULL TRIP RESULTS ----
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-8"
                    >
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h2 className="text-4xl font-bold text-gray-900 mb-2">
                            {agentResponse.event.name || `Your ${currentEventConfig?.label} Trip`}
                          </h2>
                          <p className="text-gray-600 text-lg">
                            {destination}
                            {startDate && endDate && ` • ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`}
                          </p>
                        </div>
                        
                        <div className="flex gap-3">
                          {currentWeather && (
                            <Button onClick={() => setShowWeather(true)} variant="outline" size="sm">
                              <CloudRain size={16} className="mr-2" />
                              {currentWeather.temp}°
                            </Button>
                          )}
                          <Button onClick={() => setShowMaps(true)} variant="outline" size="sm">
                            <MapPin size={16} className="mr-2" />
                            Map
                          </Button>
                          {totalSavedItems > 0 && (
                            <Button onClick={() => setShowTripSummary(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">
                              <Bookmark size={16} className="mr-2" />
                              Trip ({totalSavedItems})
                            </Button>
                          )}
                        </div>
                      </div>

                      {eventType && (
                        <Badge variant="secondary" className="text-sm">
                          {currentEventConfig?.icon && <currentEventConfig.icon size={14} className="mr-1" />}
                          {currentEventConfig?.label} Event
                        </Badge>
                      )}
                    </motion.div>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="w-full justify-start mb-8 bg-white p-2 rounded-2xl shadow-sm">
                        <TabsTrigger value="itinerary" className="flex items-center gap-2">
                          <Sparkles size={16} />
                          Itinerary
                        </TabsTrigger>
                        <TabsTrigger value="hotels" className="flex items-center gap-2">
                          <Hotel size={16} />
                          Hotels
                          {agentResponse.hotels?.length > 0 && <Badge variant="secondary">{agentResponse.hotels.length}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="flights" className="flex items-center gap-2">
                          <Plane size={16} />
                          Flights
                          {agentResponse.flights?.length > 0 && <Badge variant="secondary">{agentResponse.flights.length}</Badge>}
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="itinerary">
                        {itineraryData && <ItineraryView data={itineraryData} />}
                      </TabsContent>
                      <TabsContent value="hotels">
                        <HotelResults hotels={agentResponse.hotels || []} onSaveItem={(hotel) => handleSaveItem(hotel, 'hotel')} loading={false} />
                      </TabsContent>
                      <TabsContent value="flights">
                        <FlightResults flights={agentResponse.flights || []} onSaveItem={(flight) => handleSaveItem(flight, 'flight')} loading={false} />
                      </TabsContent>
                    </Tabs>
                  </>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* ==================== FOOTER ==================== */}
      <Footer />

      {/* ==================== MODALS ==================== */}
      
      {showRefinement && (
        <TripRefinementModal
          isOpen={showRefinement}
          onClose={() => setShowRefinement(false)}
          onGenerate={handleRefinementSubmit}
          destination={destination}
          isLoading={loading}
          eventContext={
            agentResponse?.event?.name
              ? {
                  name: agentResponse.event.name,
                  date: agentResponse.event.date || '',
                  type: agentResponse.event.type === 'festival' ? 'festivals'
                    : agentResponse.event.type === 'conference' ? 'other'
                    : agentResponse.event.type || 'other',
                }
              : undefined
          }
        />
      )}

      {showTripSummary && (
        <TripSummary
          isOpen={showTripSummary}
          onClose={() => setShowTripSummary(false)}
          savedItems={savedItems}
          onRemoveItem={handleRemoveItem}
          destination={destination}
        />
      )}

      {showMaps && destination && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-2xl font-bold">Map & Directions</h3>
              <button onClick={() => setShowMaps(false)} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">✕</button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <MapsDirections destination={destination} defaultOrigin={origin} />
            </div>
          </div>
        </div>
      )}

      {showWeather && destination && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-2xl font-bold">Weather Forecast</h3>
              <button onClick={() => setShowWeather(false)} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">✕</button>
            </div>
            <div className="p-6">
              <WeatherWidget destination={destination} showRecommendations={true} showHourlyForecast={false} onWeatherLoad={setCurrentWeather} />
            </div>
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