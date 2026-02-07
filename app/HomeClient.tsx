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
  CloudRain
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

// ==================== MAIN COMPONENT ====================

export default function HomeClient() {
  const router = useRouter();
  const { user, userProfile, updateUserProfile } = useAuth();
  
  // ==================== STATE MANAGEMENT ====================
  
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

  const handleSearch = async (query?: string, preferences?: TripPreferences) => {
    const location = query || searchQuery;
    if (!location.trim()) {
      toast.error('Please enter a destination');
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

    toast.loading('Searching for your perfect trip...', {
      id: 'search-toast',
    });
    
    try {
      const itineraryPayload = { 
        location, 
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
        fetch("/api/restaurants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location, tripType: prefs?.tripType || tripType }) }),
        fetch("/api/hotels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destination: location, budget: prefs?.budget || selectedBudget }) }),
        fetch("/api/activities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location, tripType: prefs?.tripType || tripType }) }),
        fetch("/api/images", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destination: location }) }),
        fetch("/api/flights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ origin: prefs?.origin || origin, destination: location, passengers: prefs?.groupSize || 1, departDate: startDate?.toISOString(), returnDate: endDate?.toISOString() }) }),
        fetch("/api/transport", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destination: location, origin: prefs?.origin || origin }) }),
        liveEventsPromise,
        eventImagesPromise,
        landmarkMapsPromise
      ]);

      const [itinerary, restaurantsData, hotelsData, activitiesData, imagesData, flightsData, transportData] = await Promise.all([
        itineraryRes.json(), restaurantsRes.json(), hotelsRes.json(), activitiesRes.json(), imagesRes.json(), flightsRes.json(), transportRes.json()
      ]);

      if (!itineraryRes.ok) throw new Error(itinerary.error || "Failed to fetch itinerary");

      setItineraryData(itinerary);
      setRestaurants(restaurantsData.restaurants || []);
      setHotels(hotelsData.hotels || []);
      setActivities(activitiesData.activities || []);
      
      // Combine regular images with event images
      const allImages = [
        ...(imagesData.images?.filter((url: string) => url) || []),
        ...(eventImages || [])
      ];
      setImages(allImages);
      
      // Store landmark maps data if available
      if (landmarkMapsData) {
        console.log('Landmark maps data available for', location, landmarkMapsData);
        // You can use this data to enhance map markers, venue displays, etc.
      }
      
      setFlights(flightsData.flights || []);
      setTransport(transportData.transport || null);
      setFirstDestination(location);
      setDays(prefs?.days || days);
      
      if (liveEventsData && liveEventsData.length > 0) {
        setLiveEvents(liveEventsData.slice(0, 10));
      } else {
        setLiveEvents([]);
      }
      
      // Weather is now handled by WeatherWidget component
      // which uses onWeatherLoad callback to update currentWeather
      
      const flightCost = flightsData.flights?.[0]?.price || 800;
      const hotelCost = (hotelsData.hotels?.[0]?.price || 150) * (prefs?.days || days);
      setEstimatedTripCost(flightCost + hotelCost + 500);
      
      if (user) {
        await profileManager.trackSearch(user.uid, location);
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
      
      toast.dismiss('search-toast');
      toast.success('Trip planned successfully!', {
        description: `Found ${hotels.length} hotels, ${restaurants.length} restaurants, and more`,
      });

      if (flightsData.flights?.length > 0 && hotelsData.hotels?.length > 0) {
        setShowPreview(true);
      } else {
        setActiveTab("itinerary");
        setTimeout(() => {
          document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch travel data.";
      setError(errorMessage);
      toast.dismiss('search-toast');
      toast.error('Search failed', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
      setLoadingStates({
        itinerary: false,
        hotels: false,
        restaurants: false,
        activities: false,
        flights: false,
        events: false,
      });
    }
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported', {
        description: 'Please use a supported browser like Chrome',
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onstart = () => {
      setIsListening(true);
      toast.info('Listening...', { id: 'voice-toast' });
    };
    recognition.onend = () => {
      setIsListening(false);
      toast.dismiss('voice-toast');
    };
    recognition.onerror = () => {
      setIsListening(false);
      toast.dismiss('voice-toast');
      toast.error('Voice input failed');
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      toast.success('Voice captured!', {
        description: transcript,
      });
    };

    if (isListening) recognition.stop(); 
    else recognition.start();
  };

  // NEW: Voice Planner Handler
  const handleVoicePlannerComplete = (destination: string, dates: { start: Date; end: Date }) => {
    setSearchQuery(destination);
    setStartDate(dates.start);
    setEndDate(dates.end);
    setShowVoicePlanner(false);
    handleSearch(destination);
  };

  const handleFeedbackSubmit = async (feedback: any) => {
    try {
      await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(feedback) });
      if (user) {
        await profileManager.saveFeedback(user.uid, feedback);
      }
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Failed to save feedback:', error);
      toast.error('Failed to save feedback');
    }
  };

  // ==================== EFFECTS ====================
  
  useEffect(() => {
    const featured = getFeaturedEvents().slice(0, 3);
    setFeaturedEvents(featured);

    if (userProfile) {
      if (userProfile.budgetRange) setSelectedBudget(userProfile.budgetRange);
      if (userProfile.location) setOrigin(userProfile.location);
    }
  }, [userProfile]);

  // ==================== RENDER ====================
  
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 via-white to-white -z-10" />
        
        <div className="max-w-4xl mx-auto text-center w-full space-y-12">
          
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-gray-900 leading-[0.95]">
              Find the event.
              <br />
              <span className="text-blue-600">We'll plan everything else.</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-normal">
              AI plans your trip to concerts, festivals, and sports—flights, hotels, tickets—in one place.
            </p>
          </motion.div>

          {/* Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={22} />
              <Input 
                placeholder="Search for an event: Coachella, Lakers, Wimbledon..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchQuery.trim() && handleSearch()}
                className="w-full h-20 pl-16 pr-24 text-lg font-medium rounded-3xl border-2 border-gray-200 hover:border-gray-300 focus:border-blue-600 bg-white shadow-lg transition-all"
              />
              <button 
                onClick={toggleVoiceInput} 
                className={`absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                  isListening 
                    ? 'bg-blue-600 text-white' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {isListening ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
            </div>

            {/* Date inputs - DateRangePicker or basic inputs */}
            <AnimatePresence>
              {searchQuery && (
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
              onClick={() => searchQuery.trim() && handleSearch()} 
              disabled={!searchQuery.trim() || loading}
              className="w-full h-16 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-3xl text-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Searching...
                </span>
              ) : (
                'Search Events'
              )}
            </button>

            {/* NEW: Quick Actions */}
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

      {/* FEATURED EVENT */}
      <EventsBanner />

      {/* HOW IT WORKS */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-xl text-gray-600">Three steps to your perfect event trip</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: "1", title: "Find your event", desc: "Search concerts, sports, or festivals worldwide" },
              { step: "2", title: "See the options", desc: "Compare flights, hotels, and ticket prices instantly" },
              { step: "3", title: "Book everything", desc: "One checkout for your entire trip" }
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
                <h4 className="font-bold text-gray-900 mb-1">Secure Payment</h4>
                <p className="text-sm text-gray-600">Your data is encrypted and protected</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Ticket className="text-white" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">Official Partners</h4>
                <p className="text-sm text-gray-600">Verified Ticketmaster integration</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Clock className="text-white" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">24/7 Support</h4>
                <p className="text-sm text-gray-600">AI assistance whenever you need it</p>
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
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Trip to {firstDestination}</h2>
                <div className="flex gap-2">
                  {totalSavedItems > 0 && (
                    <Badge className="bg-blue-600 text-white">
                      {totalSavedItems} items saved
                    </Badge>
                  )}
                  {currentWeather && showWeather && (
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                      <CloudRain size={14} className="mr-1" />
                      {currentWeather.temp}°C
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {firstDestination && (
                  <>
                    <Button
                      onClick={() => setShowMaps(!showMaps)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <MapPin size={16} />
                      {showMaps ? 'Hide' : 'Show'} Map
                    </Button>
                    {currentWeather && (
                      <Button
                        onClick={() => setShowWeather(!showWeather)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <CloudRain size={16} />
                        Weather
                      </Button>
                    )}
                  </>
                )}
                <Button
                  onClick={() => router.push('/settings')}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Settings size={16} />
                  Settings
                </Button>
              </div>
            </motion.div>

            {/* Weather Widget */}
            <AnimatePresence>
              {showWeather && currentWeather && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8 overflow-hidden"
                >
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* Maps Section */}
            <AnimatePresence>
              {showMaps && firstDestination && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8 overflow-hidden"
                >
                  <div className="bg-white rounded-3xl border-2 border-gray-200 p-6">
                    <MapsDirections 
                      destination={firstDestination}
                      defaultOrigin={origin}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <div className="overflow-x-auto scrollbar-hide">
                <TabsList className="inline-flex bg-white border-2 border-gray-200 p-1.5 rounded-2xl shadow-sm min-w-max">
                  <TabsTrigger value="itinerary" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Calendar size={16} className="mr-2" />
                    Itinerary
                  </TabsTrigger>
                  <TabsTrigger value="events" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Ticket size={16} className="mr-2" />
                    Events
                  </TabsTrigger>
                  <TabsTrigger value="flights" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Plane size={16} className="mr-2" />
                    Flights
                  </TabsTrigger>
                  <TabsTrigger value="hotels" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Hotel size={16} className="mr-2" />
                    Hotels
                  </TabsTrigger>
                  <TabsTrigger value="restaurants" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Utensils size={16} className="mr-2" />
                    Dining
                  </TabsTrigger>
                  <TabsTrigger value="activities" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Zap size={16} className="mr-2" />
                    Activities
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="bg-white rounded-3xl border-2 border-gray-200 p-8 min-h-[400px]">
                <TabsContent value="itinerary" className="mt-0">
                  {loadingStates.itinerary ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="text-center">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading itinerary...</p>
                      </div>
                    </div>
                  ) : itineraryData ? (
                    <ItineraryView data={itineraryData} />
                  ) : (
                    <div className="text-center py-20">
                      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No itinerary available</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="events" className="mt-0">
                  {loadingStates.events ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="text-center">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading events...</p>
                      </div>
                    </div>
                  ) : liveEvents.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {liveEvents.map((event, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="p-6 border-2 border-gray-100 rounded-2xl hover:border-blue-200 transition-all cursor-pointer"
                        >
                          <h4 className="font-bold text-lg mb-2">{event.name}</h4>
                          <p className="text-gray-600 text-sm mb-3">
                            {new Date(event.startDate).toLocaleDateString()}
                          </p>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            View Details
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No events found</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="flights" className="mt-0">
                  {flights?.length > 0 ? (
                    <FlightResults 
                      flights={flights} 
                      onSaveItem={(flight) => handleSaveItem(flight, 'flight')}
                      loading={loadingStates.flights}
                    />
                  ) : (
                    <div className="text-center py-20">
                      <Plane className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No flights available</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="hotels" className="mt-0">
                  {hotels?.length > 0 ? (
                    <HotelResults 
                      hotels={hotels} 
                      onSaveItem={(hotel) => handleSaveItem(hotel, 'hotel')}
                      loading={loadingStates.hotels}
                    />
                  ) : (
                    <div className="text-center py-20">
                      <Hotel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No hotels available</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="restaurants" className="mt-0">
                  {restaurants?.length > 0 ? (
                    <RestaurantResults 
                      restaurants={restaurants}
                      destination={firstDestination}
                      onSaveItem={(restaurant) => handleSaveItem(restaurant, 'restaurant')}
                      loading={loadingStates.restaurants}
                    />
                  ) : (
                    <div className="text-center py-20">
                      <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No restaurants available</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="activities" className="mt-0">
                  {activities?.length > 0 ? (
                    <ActivityResults 
                      activities={activities} 
                      onSaveItem={(activity) => handleSaveItem(activity, 'activity')}
                      loading={loadingStates.activities}
                    />
                  ) : (
                    <div className="text-center py-20">
                      <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No activities available</p>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </section>
      )}

      <Footer />
      
      {/* ==================== ALL MODALS ==================== */}
      
      {/* Trip Refinement Modal */}
      <TripRefinementModal
        isOpen={showRefinement}
        onClose={() => setShowRefinement(false)}
        onGenerate={(prefs) => {
          setTripPreferences(prefs);
          setShowRefinement(false);
          handleSearch(searchQuery, prefs);
        }}
        destination={searchQuery}
        isLoading={loading}
      />

      {/* Trip Preview */}
      {showPreview && flights?.length > 0 && hotels?.length > 0 && !loading && (
        <TripPreview
          destination={firstDestination}
          flights={flights}
          hotels={hotels}
          startDate={startDate}
          endDate={endDate}
          onViewDetails={() => {
            setShowPreview(false);
            setActiveTab("itinerary");
            setTimeout(() => {
              document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
        />
      )}

      {/* Trip Summary Modal */}
      <TripSummary 
        isOpen={showTripSummary} 
        onClose={() => setShowTripSummary(false)} 
        savedItems={savedItems} 
        onRemoveItem={handleRemoveItem} 
        destination={firstDestination} 
      />
      
      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={showFeedback} 
        onClose={() => setShowFeedback(false)} 
        tripData={completedTrip || { 
          destination: firstDestination, 
          startDate: startDate?.toISOString() || new Date().toISOString(), 
          endDate: endDate?.toISOString() || new Date().toISOString(), 
          tripId: 'trip_' + Date.now() 
        }} 
        onSubmit={handleFeedbackSubmit} 
      />

      {/* NEW: Voice Trip Planner Modal */}
      {showVoicePlanner && (
        <VoiceTripPlanner />
      )}

      {/* NEW: Saved Trips Modal */}
      {showSavedTrips && (
        <SavedTrips />
      )}

      {/* NEW: Contact Modal */}
      {showContact && (
        <Contact />
      )}

      {/* NEW: Terms Modal */}
      {showTerms && (
        <TermsOfService />
      )}
      
      {/* ==================== FLOATING BUTTONS ==================== */}
      
      {/* Floating Trip Summary Button */}
      <AnimatePresence>
        {totalSavedItems > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowTripSummary(true)}
            className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 rounded-full shadow-2xl flex items-center justify-center z-50"
          >
            <Calendar className="text-white" size={24} />
            <span className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center">
              {totalSavedItems}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* NEW: Floating Chat Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowGladysChat(!showGladysChat)}
        className="fixed bottom-8 left-8 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-2xl flex items-center justify-center z-50"
      >
        <MessageSquare className="text-white" size={24} />
      </motion.button>

      {/* NEW: Gladys Chat */}
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