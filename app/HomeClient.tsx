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
  Clock, 
  ChevronDown,
  MapPin,
  Plane,
  Hotel,
  Utensils,
  Zap,
  MessageSquare,
  Bookmark,
  Settings,
  CloudRain,
  Trophy,
  Music,
  PartyPopper
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ==================== ALL COMPONENTS ====================
// Core Layout Components
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Event Components
import EventsBanner from '@/components/EventsBanner';
import EventNotificationToast from '@/components/EventNotificationToast';

// Results Components (ALL WORLD-CLASS - Yellow M files)
import HotelResults from "@/components/HotelResults";
import RestaurantResults from "@/components/RestaurantResults";
import ActivityResults from "@/components/ActivityResults";
import FlightResults from "@/components/FlightResults";
import ItineraryView from "@/components/ItineraryView";
import MapsDirections from "@/components/MapsDirections";

// Modal & Form Components (Yellow M files)
import TripRefinementModal, { TripPreferences } from "@/components/TripRefinementModal";
import TripPreview from "@/components/TripPreview";
import TripSummary from "@/components/TripSummary";
import FeedbackModal from "@/components/FeedbackModal";
import DateRangePicker from "@/components/DateRangePicker";

// NEW: Additional Yellow (M) Components
import WeatherWidget from "@/components/WeatherWidget";
import VoiceTripPlanner from "@/components/VoiceTripPlanner";
import SavedTrips from "@/components/SavedTrips";
import Contact from "@/components/Contact";
import TermsOfService from "@/components/TermsOfService";

// NEW: Green (U) Untracked Components
import GladysChat from "@/components/GladysChat";

// Lib imports
import { ItineraryData } from "@/lib/mock-itinerary";
import { profileManager } from "@/lib/userProfile";
import { useAuth } from "@/lib/AuthContext";
import { fetchLiveEvents } from "@/lib/eventService";
import { getFeaturedEvents } from "@/lib/event-data";

// NEW: Green (U) Lib imports
import { fetchEventImages } from "@/lib/eventImageSearch";
import * as eventLandmarkMaps from "@/lib/eventLandmarkMaps";

// shadcn/ui
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

// ==================== EVENT TYPE CONFIGURATION ====================
// Strategic: Define event types as constants for scalability
type EventType = 'sports' | 'music' | 'festivals' | null;

interface EventTypeConfig {
  id: EventType;
  label: string;
  icon: any;
  placeholder: string;
  examples: string[];
  color: string;
  bgColor: string;
}

const EVENT_TYPES: EventTypeConfig[] = [
  {
    id: 'sports',
    label: 'Sports',
    icon: Trophy,
    placeholder: 'World Cup 2026, Super Bowl, Wimbledon...',
    examples: ['World Cup 2026', 'NBA Finals', 'Premier League'],
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200'
  },
  {
    id: 'music',
    label: 'Music',
    icon: Music,
    placeholder: 'Taylor Swift, Coachella, Glastonbury...',
    examples: ['Coachella', 'Beyoncé Tour', 'Glastonbury'],
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100 border-purple-200'
  },
  {
    id: 'festivals',
    label: 'Festivals',
    icon: PartyPopper,
    placeholder: 'Carnival, Oktoberfest, Burning Man...',
    examples: ['Rio Carnival', 'Oktoberfest', 'La Tomatina'],
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100 border-orange-200'
  }
];

// ==================== MAIN COMPONENT ====================

export default function HomeClient() {
  const router = useRouter();
  const { user, userProfile, updateUserProfile } = useAuth();
  
  // ==================== STATE MANAGEMENT ====================
  
  // STRATEGIC: Event Type - Core to the product evolution
  const [eventType, setEventType] = useState<EventType>(null);
  
  // Search & Trip State
  const [searchQuery, setSearchQuery] = useState("");
  const [tripType, setTripType] = useState("");
  const [selectedBudget, setSelectedBudget] = useState("Mid-range");
  const [origin, setOrigin] = useState("Johannesburg, South Africa");
  const [days, setDays] = useState(5);
  const [loading, setLoading] = useState(false);
  const [firstDestination, setFirstDestination] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Data State
  const [images, setImages] = useState<string[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [transport, setTransport] = useState<any>(null);
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<any[]>([]);
  
  // UI State
  const [isListening, setIsListening] = useState(false);
  const [activeTab, setActiveTab] = useState("itinerary");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  // Modal States
  const [showRefinement, setShowRefinement] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showTripSummary, setShowTripSummary] = useState(false);
  const [showMaps, setShowMaps] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showVoicePlanner, setShowVoicePlanner] = useState(false);
  const [showSavedTrips, setShowSavedTrips] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showGladysChat, setShowGladysChat] = useState(false);
  const [useDateRangePicker, setUseDateRangePicker] = useState(false);
  
  // Trip State
  const [tripPreferences, setTripPreferences] = useState<TripPreferences | null>(null);
  const [estimatedTripCost, setEstimatedTripCost] = useState(2000);
  const [completedTrip, setCompletedTrip] = useState<any>(null);
  
  // Loading States for each section
  const [loadingStates, setLoadingStates] = useState({
    itinerary: false,
    hotels: false,
    restaurants: false,
    activities: false,
    flights: false,
    events: false,
  });

  // Saved Items State
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

  // ==================== COMPUTED VALUES ====================
  
  const totalSavedItems = (savedItems.hotels?.length || 0) + 
                          (savedItems.flights?.length || 0) + 
                          (savedItems.restaurants?.length || 0) + 
                          (savedItems.activities?.length || 0);

  // STRATEGIC: Get current event type config for dynamic UI
  const currentEventConfig = EVENT_TYPES.find(e => e.id === eventType);
  const searchPlaceholder = currentEventConfig?.placeholder || "Choose an event type above to get started";

  // ==================== EVENT TYPE HANDLERS ====================
  
  const handleEventTypeSelect = (type: EventType) => {
    setEventType(type);
    setSearchQuery(""); // Reset search when changing event type
    
    // Analytics: Track event type selection (future upgrade)
    if (user) {
      profileManager.trackTripPlanned(user.uid, `Event Type: ${type}`).catch(console.error);
    }
  };

  // ==================== HANDLERS ====================
  
  const handleSaveItem = async (item: any, type: 'hotel' | 'flight' | 'restaurant' | 'activity') => {
    const savedItem: SavedItem = {
      id: item.id?.toString() || Math.random().toString(),
      type: type,
      name: item.name || item.airline || item.title || 'Unnamed Item',
      price: item.price?.toString() || item.estimatedCost?.toString() || '$0',
      location: item.location || item.address || item.destination || '',
      date: item.date || item.departureDate || '',
      image: item.image || item.photo || '',
      affiliateUrl: item.bookingUrl || item.affiliateUrl || '#',
      partner: item.partner || 'Booking.com',
      description: item.description || ''
    };

    setSavedItems(prev => {
      const typeKey = `${type}s` as keyof typeof prev;
      const currentItems = prev[typeKey] || [];
      const exists = currentItems.some(i => i.id === savedItem.id);
      
      if (exists) {
        toast.success('Removed from trip', {
          description: savedItem.name,
        });
        return { ...prev, [typeKey]: currentItems.filter(i => i.id !== savedItem.id) };
      } else {
        toast.success('Saved to trip!', {
          description: savedItem.name,
          action: {
            label: 'View Trip',
            onClick: () => setShowTripSummary(true),
          },
        });
        return { ...prev, [typeKey]: [...currentItems, savedItem] };
      }
    });

    if (user) {
      await profileManager.trackBooking(user.uid, {
        type: type,
        name: savedItem.name,
        price: parseFloat(savedItem.price.replace(/[^0-9.]/g, '')) || 0,
        rating: item.rating || 0,
        destination: firstDestination
      });
    }
  };

  const handleRemoveItem = (type: string, id: string) => {
    setSavedItems(prev => {
      const typeKey = (type + 's') as keyof typeof prev;
      const currentItems = prev[typeKey] || [];
      return { ...prev, [typeKey]: currentItems.filter((item: SavedItem) => item.id !== id) };
    });
    toast.success('Item removed from trip');
  };

  // STRATEGIC: Enhanced search with event context
  const handleSearch = async (query?: string, preferences?: TripPreferences) => {
    const location = query || searchQuery;
    if (!location.trim()) {
      toast.error('Please enter an event or destination');
      return;
    }

    // STRATEGIC: Require event type selection for better UX and data quality
    if (!eventType) {
      toast.error('Please select an event type first');
      return;
    }

    const prefs = preferences || tripPreferences;
    setLoading(true);
    setError(null);
    setShowPreview(false);
    
    // Set all loading states
    setLoadingStates({
      itinerary: true,
      hotels: true,
      restaurants: true,
      activities: true,
      flights: true,
      events: true,
    });

    toast.loading(`Finding the best ${eventType} travel options...`, {
      id: 'search-toast',
    });
    
    try {
      // STRATEGIC: Include event type in all API calls for intelligent recommendations
      const itineraryPayload = { 
        location, 
        eventType, // NEW: Event context for AI decision engine
        tripType: prefs?.tripType || tripType || 'balanced',
        budget: prefs?.budget || selectedBudget,
        days: prefs?.days || days,
        origin: prefs?.origin || origin,
        groupSize: prefs?.groupSize || 1,
        groupType: prefs?.groupType || 'solo',
        optimize: true,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      };

      const liveEventsPromise = fetchLiveEvents(10).catch(() => []);
      
      // NEW: Get event images and landmark maps
      const eventImagesPromise = fetchEventImages(location).catch(() => []);
      const landmarkMapsPromise = eventLandmarkMaps.fetchLandmarkMaps(location).catch(() => null);

      const [
        itineraryRes, restaurantsRes, hotelsRes, activitiesRes, imagesRes,
        flightsRes, transportRes, liveEventsData,
        eventImages, landmarkMapsData
      ] = await Promise.all([
        fetch("/api/itinerary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(itineraryPayload) }),
        fetch("/api/restaurants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location, eventType, tripType: prefs?.tripType || tripType }) }),
        fetch("/api/hotels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destination: location, eventType, budget: prefs?.budget || selectedBudget }) }),
        fetch("/api/activities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location, eventType, tripType: prefs?.tripType || tripType }) }),
        fetch("/api/images", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destination: location }) }),
        fetch("/api/flights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ origin: prefs?.origin || origin, destination: location, passengers: prefs?.groupSize || 1, departDate: startDate?.toISOString(), returnDate: endDate?.toISOString() }) }),
        fetch("/api/transport", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destination: location, origin: prefs?.origin || origin }) }),
        liveEventsPromise,
        eventImagesPromise,
        landmarkMapsPromise
      ]);

      const [itineraryData, restaurantsData, hotelsData, activitiesData, imagesData, flightsData, transportData] = await Promise.all([
        itineraryRes.json(),
        restaurantsRes.json(),
        hotelsRes.json(),
        activitiesRes.json(),
        imagesRes.json(),
        flightsRes.json(),
        transportRes.json()
      ]);

      // Process results
      setItineraryData(itineraryData);
      setRestaurants(restaurantsData.restaurants || []);
      setHotels(hotelsData.hotels || []);
      setActivities(activitiesData.activities || []);
      setFlights(flightsData.flights || []);
      setTransport(transportData);
      setImages(imagesData.images || []);
      setFirstDestination(location);
      setLiveEvents(liveEventsData);
      
      // Combine event images with regular images
      if (eventImages && eventImages.length > 0) {
        setImages(prev => [...eventImages, ...prev]);
      }
      
      if (landmarkMapsData) {
        console.log('Landmark maps data available for', location, landmarkMapsData);
      }

      // Track successful search
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

      toast.success(`Found amazing ${eventType} options!`, {
        id: 'search-toast',
        description: `${hotels.length || 0} hotels, ${flights.length || 0} flights`
      });

      setLoadingStates({
        itinerary: false,
        hotels: false,
        restaurants: false,
        activities: false,
        flights: false,
        events: false,
      });

      // Scroll to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
      
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search. Please try again.');
      toast.error('Search failed', {
        id: 'search-toast',
        description: 'Please try again or contact support'
      });
      
      setLoadingStates({
        itinerary: false,
        hotels: false,
        restaurants: false,
        activities: false,
        flights: false,
        events: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    setIsListening(!isListening);
    if (!isListening) {
      toast.success('Voice input activated');
    }
  };

  const handleVoicePlannerComplete = (destination: string, dates: { start: Date; end: Date }) => {
    setSearchQuery(destination);
    setStartDate(dates.start);
    setEndDate(dates.end);
    setShowVoicePlanner(false);
    handleSearch(destination);
  };

  const handleRefinementSubmit = async (preferences: TripPreferences) => {
    setTripPreferences(preferences);
    setShowRefinement(false);
    await handleSearch(searchQuery, preferences);
  };

  // ==================== EFFECTS ====================
  
  useEffect(() => {
    const loadFeaturedEvents = async () => {
      const events = await getFeaturedEvents();
      setFeaturedEvents(events);
    };
    loadFeaturedEvents();
  }, []);

  // ==================== RENDER ====================
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />

      {/* HERO SECTION - EVENT-FOCUSED */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-6 pt-32 pb-20">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-20"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center w-full space-y-12 relative z-10">
          
          {/* STRATEGIC: Event-First Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-gray-900 leading-[0.95]">
              Your event.
              <br />
              <span className="text-blue-600">Your perfect trip.</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-normal">
              Sports. Music. Festivals. We find the event tickets, flights, and hotels—all in one place.
            </p>
          </motion.div>

          {/* STRATEGIC: Event Type Selector - Core Product Feature */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl mx-auto"
          >
            <p className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
              Choose your event type
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
                        ? `${type.bgColor} border-current shadow-lg scale-105` 
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center
                        ${isSelected ? type.color : 'text-gray-400'}
                        ${isSelected ? type.bgColor.replace('hover:', '') : 'bg-gray-50'}
                      `}>
                        <Icon size={24} />
                      </div>
                      <span className={`
                        font-semibold
                        ${isSelected ? type.color : 'text-gray-700'}
                      `}>
                        {type.label}
                      </span>
                    </div>
                    
                    {/* Selection Indicator */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center"
                      >
                        <Sparkles size={14} className="text-white" />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* STRATEGIC: Event Search - Adapts to selected event type */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={22} />
              <Input 
                placeholder={searchPlaceholder}
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchQuery.trim() && eventType && handleSearch()}
                disabled={!eventType}
                className={`
                  w-full h-20 pl-16 pr-24 text-lg font-medium rounded-3xl border-2 
                  bg-white shadow-lg transition-all
                  ${!eventType 
                    ? 'border-gray-200 opacity-50 cursor-not-allowed' 
                    : 'border-gray-200 hover:border-gray-300 focus:border-blue-600'
                  }
                `}
              />
              <button 
                onClick={toggleVoiceInput} 
                disabled={!eventType}
                className={`absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                  isListening 
                    ? 'bg-blue-600 text-white' 
                    : !eventType
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {isListening ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
            </div>

            {/* Date inputs - DateRangePicker or basic inputs */}
            <AnimatePresence>
              {searchQuery && eventType && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4"
                >
                  {useDateRangePicker ? (
                    <DateRangePicker
                      startDate={startDate}
                      endDate={endDate}
                      onDateChange={(start, end) => {
                        setStartDate(start);
                        setEndDate(end);
                      }}
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <input
                        type="date"
                        value={startDate?.toISOString().split('T')[0] || ''}
                        onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                        className="flex-1 h-14 px-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm font-medium focus:bg-white focus:border-blue-600 transition-all"
                      />
                      <ArrowRight className="text-gray-300" size={20} />
                      <input
                        type="date"
                        value={endDate?.toISOString().split('T')[0] || ''}
                        onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                        className="flex-1 h-14 px-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm font-medium focus:bg-white focus:border-blue-600 transition-all"
                      />
                    </div>
                  )}
                  
                  {/* Toggle DateRangePicker */}
                  <button
                    onClick={() => setUseDateRangePicker(!useDateRangePicker)}
                    className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                  >
                    {useDateRangePicker ? 'Use simple date picker' : 'Use advanced date picker'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              onClick={() => searchQuery.trim() && eventType && handleSearch()} 
              disabled={!searchQuery.trim() || !eventType || loading}
              className="w-full h-16 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-3xl text-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Searching...
                </span>
              ) : (
                `Find ${eventType ? currentEventConfig?.label : 'Event'} Travel`
              )}
            </button>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => setShowVoicePlanner(true)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Mic size={16} className="mr-2" />
                Voice Planner
              </Button>
              <Button
                onClick={() => setShowSavedTrips(true)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Bookmark size={16} className="mr-2" />
                Saved Trips
              </Button>
              <Button
                onClick={() => router.push('/settings')}
                variant="outline"
                size="sm"
              >
                <Settings size={16} />
              </Button>
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="pt-16"
          >
            <ChevronDown className="w-6 h-6 text-gray-300 animate-bounce mx-auto" />
          </motion.div>
        </div>
      </section>

      {/* FEATURED EVENTS */}
      <EventsBanner />

      {/* HOW IT WORKS - EVENT-FOCUSED */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-xl text-gray-600">Three steps to your perfect event trip</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: "1", title: "Pick your event", desc: "Sports, music, or festivals—tell us what you're going to" },
              { step: "2", title: "See smart options", desc: "AI finds the best flights, hotels, and tickets for your event" },
              { step: "3", title: "Book it all", desc: "Complete your trip with our trusted partners" }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-blue-600 rounded-3xl text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 text-lg leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST SIGNALS */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Shield className="text-white" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Secure Booking</h4>
                <p className="text-sm text-gray-600">Bank-level encryption for all transactions</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Ticket className="text-white" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Official Partners</h4>
                <p className="text-sm text-gray-600">Ticketmaster, Booking.com, and more</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="text-white" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">AI-Powered</h4>
                <p className="text-sm text-gray-600">Smart recommendations based on your event</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTS SECTION */}
      {(itineraryData || hotels?.length > 0 || loading) && !showPreview && (
        <section id="results-section" className="px-4 py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {/* Results Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-2">
                    Your {eventType && currentEventConfig?.label} Trip
                  </h2>
                  <p className="text-gray-600 text-lg">
                    {firstDestination && `${firstDestination} • `}
                    {startDate && endDate && `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`}
                  </p>
                </div>
                
                <div className="flex gap-3">
                  {currentWeather && (
                    <Button
                      onClick={() => setShowWeather(true)}
                      variant="outline"
                      size="sm"
                    >
                      <CloudRain size={16} className="mr-2" />
                      {currentWeather.temp}°
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => setShowMaps(true)}
                    variant="outline"
                    size="sm"
                  >
                    <MapPin size={16} className="mr-2" />
                    Map
                  </Button>
                  
                  {totalSavedItems > 0 && (
                    <Button
                      onClick={() => setShowTripSummary(true)}
                      variant="default"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Bookmark size={16} className="mr-2" />
                      View Trip ({totalSavedItems})
                    </Button>
                  )}
                </div>
              </div>

              {/* Event Type Badge */}
              {eventType && (
                <Badge variant="secondary" className="text-sm">
                  {currentEventConfig?.icon && <currentEventConfig.icon size={14} className="mr-1" />}
                  {currentEventConfig?.label} Event
                </Badge>
              )}
            </motion.div>

            {/* Results Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start mb-8 bg-white p-2 rounded-2xl shadow-sm">
                <TabsTrigger value="itinerary" className="flex items-center gap-2">
                  <Sparkles size={16} />
                  <span className="hidden sm:inline">Itinerary</span>
                </TabsTrigger>
                <TabsTrigger value="hotels" className="flex items-center gap-2">
                  <Hotel size={16} />
                  <span className="hidden sm:inline">Hotels</span>
                  {hotels.length > 0 && <Badge variant="secondary">{hotels.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="flights" className="flex items-center gap-2">
                  <Plane size={16} />
                  <span className="hidden sm:inline">Flights</span>
                  {flights.length > 0 && <Badge variant="secondary">{flights.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="restaurants" className="flex items-center gap-2">
                  <Utensils size={16} />
                  <span className="hidden sm:inline">Dining</span>
                </TabsTrigger>
                <TabsTrigger value="activities" className="flex items-center gap-2">
                  <Zap size={16} />
                  <span className="hidden sm:inline">Activities</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="itinerary" className="mt-0">
                {itineraryData ? (
                  <ItineraryView data={itineraryData} />
                ) : (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Creating your personalized itinerary...</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="hotels" className="mt-0">
                <HotelResults 
                  hotels={hotels} 
                  onSaveItem={(hotel) => handleSaveItem(hotel, 'hotel')}
                  loading={loadingStates.hotels}
                />
              </TabsContent>

              <TabsContent value="flights" className="mt-0">
                <FlightResults 
                  flights={flights} 
                  onSaveItem={(flight) => handleSaveItem(flight, 'flight')}
                  loading={loadingStates.flights}
                />
              </TabsContent>

              <TabsContent value="restaurants" className="mt-0">
                <RestaurantResults 
                  restaurants={restaurants}
                  destination={firstDestination}
                  onSaveItem={(restaurant) => handleSaveItem(restaurant, 'restaurant')}
                  loading={loadingStates.restaurants}
                />
              </TabsContent>

              <TabsContent value="activities" className="mt-0">
                <ActivityResults 
                  activities={activities}
                  onSaveItem={(activity) => handleSaveItem(activity, 'activity')}
                  loading={loadingStates.activities}
                />
              </TabsContent>
            </Tabs>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <Footer />

      {/* MODALS */}
      
      {/* Trip Refinement Modal */}
      {showRefinement && (
        <TripRefinementModal
          isOpen={showRefinement}
          onClose={() => setShowRefinement(false)}
          onSubmit={handleRefinementSubmit}
          initialPreferences={tripPreferences}
        />
      )}

      {/* Trip Preview Modal */}
      {showPreview && completedTrip && (
        <TripPreview
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          trip={completedTrip}
          onConfirm={() => {
            setShowPreview(false);
            setShowTripSummary(true);
          }}
        />
      )}

      {/* Trip Summary Modal */}
      {showTripSummary && (
        <TripSummary
          isOpen={showTripSummary}
          onClose={() => setShowTripSummary(false)}
          savedItems={savedItems}
          onRemoveItem={handleRemoveItem}
          estimatedCost={estimatedTripCost}
          destination={firstDestination}
        />
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <FeedbackModal
          isOpen={showFeedback}
          onClose={() => setShowFeedback(false)}
        />
      )}

      {/* Maps Directions */}
      {showMaps && firstDestination && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-2xl font-bold">Map & Directions</h3>
              <button
                onClick={() => setShowMaps(false)}
                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <MapsDirections 
                destination={firstDestination}
                defaultOrigin={origin}
              />
            </div>
          </div>
        </div>
      )}

      {/* Weather Widget Modal */}
      {showWeather && firstDestination && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-2xl font-bold">Weather Forecast</h3>
              <button
                onClick={() => setShowWeather(false)}
                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <WeatherWidget 
                destination={firstDestination}
                showRecommendations={true}
                showHourlyForecast={false}
                onWeatherLoad={(weather) => {
                  setCurrentWeather({
                    temp: weather.current.temp,
                    condition: weather.current.condition,
                    humidity: weather.current.humidity,
                    wind_speed: weather.current.wind_speed
                  });
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Voice Trip Planner */}
      {showVoicePlanner && (
        <VoiceTripPlanner />
      )}

      {/* Saved Trips Modal */}
      {showSavedTrips && (
        <SavedTrips />
      )}

      {/* Contact Modal */}
      {showContact && (
        <Contact />
      )}

      {/* Terms Modal */}
      {showTerms && (
        <TermsOfService />
      )}

      {/* Gladys Chat */}
      <AnimatePresence>
        {showGladysChat && (
          <GladysChat />
        )}
      </AnimatePresence>
      
      {/* Event Notification Toast */}
      <EventNotificationToast userLocation={origin} />
    </main>
  );
}