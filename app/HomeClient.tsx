"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, ArrowRight, Globe2, Calendar, Shield, Plane, MapPin, Car, Utensils, Cloud, Star, Trophy, Sparkles, Ticket, TrendingUp, ShoppingBag, Search, Music, Flame, Clock, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Components (keep all your existing imports)
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GladysAIAgent from '@/components/GladysAIAgent';
import EventsBanner from '@/components/EventsBanner';
import EventNotificationToast from '@/components/EventNotificationToast';
import HotelResults from "@/components/HotelResults";
import ItineraryView from "@/components/ItineraryView";
import RestaurantResults from "@/components/RestaurantResults";
import ActivityResults from "@/components/ActivityResults";
import FlightResults from "@/components/FlightResults";
import TransportResults from "@/components/TransportResults";
import MapsDirections from "@/components/MapsDirections";
import DateRangePicker from "@/components/DateRangePicker";
import TripRefinementModal, { TripPreferences } from "@/components/TripRefinementModal";
import LocationAutoComplete from "@/components/LocationAutoComplete";
import TripPreview from "@/components/TripPreview";
import TripSummary from "@/components/TripSummary";
import InsuranceView from "@/components/InsuranceView";
import WeatherWidget from "@/components/WeatherWidget";
import FeedbackModal from "@/components/FeedbackModal";
import { ItineraryData } from "@/lib/mock-itinerary";
import { profileManager } from "@/lib/userProfile";
import { useAuth } from "@/lib/AuthContext";
import { eventService } from "@/lib/eventService";
import { getFeaturedEvents } from "@/lib/event-data";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface SuggestedDestination {
  city: string;
  country: string;
  image: string;
}

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

const eventCategories = [
  { name: "Sports", icon: Trophy, gradient: "from-blue-500 to-blue-700" },
  { name: "Concerts", icon: Music, gradient: "from-blue-600 to-blue-800" },
  { name: "Festivals", icon: Sparkles, gradient: "from-blue-400 to-blue-600" },
  { name: "Championships", icon: Flame, gradient: "from-amber-400 to-amber-600" }, // Gold accent
];

export default function HomeClient() {
  const router = useRouter();
  const { user, userProfile, updateUserProfile } = useAuth();
  
  // State management (keep all your existing state)
  const [searchQuery, setSearchQuery] = useState("");
  const [tripType, setTripType] = useState("");
  const [selectedBudget, setSelectedBudget] = useState("Mid-range");
  const [origin, setOrigin] = useState("Johannesburg, South Africa");
  const [days, setDays] = useState(5);
  const [loading, setLoading] = useState(false);
  const [firstDestination, setFirstDestination] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [transport, setTransport] = useState<any>(null);
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
  const [suggestedDestinations, setSuggestedDestinations] = useState<SuggestedDestination[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [activeTab, setActiveTab] = useState("itinerary");
  
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showRefinement, setShowRefinement] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [tripPreferences, setTripPreferences] = useState<TripPreferences | null>(null);
  const [estimatedTripCost, setEstimatedTripCost] = useState(2000);

  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<any[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completedTrip, setCompletedTrip] = useState<any>(null);

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
  const [showTripSummary, setShowTripSummary] = useState(false);

  // Keep ALL your existing handlers unchanged
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
        return { ...prev, [typeKey]: currentItems.filter(i => i.id !== savedItem.id) };
      } else {
        return { ...prev, [typeKey]: [...currentItems, savedItem] };
      }
    });

    if (user) {
      await profileManager.trackBooking(user.uid, {
        type: type,
        name: savedItem.name,
        price: parseFloat(savedItem.price.replace(/[^0-9.]/g, '')) || 0,
        rating: item.rating || 0,
        timestamp: new Date().toISOString(),
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
  };

  const totalSavedItems = (savedItems.hotels?.length || 0) + 
                          (savedItems.flights?.length || 0) + 
                          (savedItems.restaurants?.length || 0) + 
                          (savedItems.activities?.length || 0);

  const handleSearch = async (query?: string, preferences?: TripPreferences) => {
    const location = query || searchQuery;
    if (!location.trim()) return;

    const prefs = preferences || tripPreferences;
    setLoading(true);
    setError(null);
    setShowPreview(false);
    
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

      const liveEventsPromise = eventService.universalSearch(location).catch(() => []);

      const [
        itineraryRes, restaurantsRes, hotelsRes, activitiesRes, imagesRes,
        flightsRes, transportRes, weatherRes, liveEventsData
      ] = await Promise.all([
        fetch("/api/itinerary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(itineraryPayload) }),
        fetch("/api/restaurants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location, tripType: prefs?.tripType || tripType }) }),
        fetch("/api/hotels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destination: location, budget: prefs?.budget || selectedBudget }) }),
        fetch("/api/activities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location, tripType: prefs?.tripType || tripType }) }),
        fetch("/api/images", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destination: location }) }),
        fetch("/api/flights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ origin: prefs?.origin || origin, destination: location, passengers: prefs?.groupSize || 1, departDate: startDate?.toISOString(), returnDate: endDate?.toISOString() }) }),
        fetch("/api/transport", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destination: location, origin: prefs?.origin || origin }) }),
        fetch("/api/weather", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location }) }).catch(() => null),
        liveEventsPromise
      ]);

      const [itinerary, restaurantsData, hotelsData, activitiesData, imagesData, flightsData, transportData, weatherData] = await Promise.all([
        itineraryRes.json(), restaurantsRes.json(), hotelsRes.json(), activitiesRes.json(), imagesRes.json(), flightsRes.json(), transportRes.json(), weatherRes ? weatherRes.json() : null
      ]);

      if (!itineraryRes.ok) throw new Error(itinerary.error || "Failed to fetch itinerary");

      setItineraryData(itinerary);
      setRestaurants(restaurantsData.restaurants || []);
      setHotels(hotelsData.hotels || []);
      setActivities(activitiesData.activities || []);
      setImages(imagesData.images?.filter((url: string) => url) || []);
      setFlights(flightsData.flights || []);
      setTransport(transportData.transport || null);
      setFirstDestination(location);
      setDays(prefs?.days || days);
      
      if (liveEventsData && liveEventsData.length > 0) {
        setLiveEvents(liveEventsData.slice(0, 10));
      } else {
        setLiveEvents([]);
      }
      
      if (weatherData?.weather) {
        setCurrentWeather(weatherData.weather);
      }
      
      const flightCost = flightsData.flights?.[0]?.price || 800;
      const hotelCost = (hotelsData.hotels?.[0]?.price || 150) * (prefs?.days || days);
      setEstimatedTripCost(flightCost + hotelCost + 500);
      
      if (user) {
        await profileManager.trackSearch(user.uid, location);
        await profileManager.trackTripPlanned(user.uid, location);
        
        if (prefs) {
          await updateUserProfile({
            preferredTripTypes: prefs.tripType ? [prefs.tripType] : userProfile?.preferredTripTypes || [],
            budgetRange: prefs.budget as any,
            typicalGroupSize: prefs.groupSize || 1,
            typicalGroupType: prefs.groupType as any
          });
        }
      }
      
      if (flightsData.flights?.length > 0 && hotelsData.hotels?.length > 0) {
        setShowPreview(true);
      } else {
        setActiveTab("itinerary");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to fetch travel data.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const parseVoiceCommand = (transcript: string) => {
    const lower = transcript.toLowerCase();
    const destPatterns = [/(?:to|visit|trip to)\s+([a-z\s,]+?)(?:\s+for|\s+next|\s+in|\s+during|\s*$)/i];
    
    for (const pattern of destPatterns) {
      const match = transcript.match(pattern);
      if (match) {
        const dest = match[1].trim();
        setSearchQuery(dest.charAt(0).toUpperCase() + dest.slice(1));
        break;
      }
    }
    
    if (/(\d+)\s*-?\s*days?/i.test(lower)) {
      const daysMatch = parseInt(lower.match(/(\d+)\s*-?\s*days?/i)![1]);
      setDays(daysMatch);
      const start = new Date();
      start.setDate(start.getDate() + 1);
      const end = new Date(start);
      end.setDate(end.getDate() + daysMatch);
      setStartDate(start);
      setEndDate(end);
    }
    
    setTimeout(() => { if (searchQuery) setShowRefinement(true); }, 500);
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      parseVoiceCommand(transcript);
    };

    if (isListening) recognition.stop(); 
    else recognition.start();
  };

  useEffect(() => {
    const featured = getFeaturedEvents().slice(0, 6);
    setFeaturedEvents(featured);

    const topWorldDestinations = [
      "Paris, France", "London, United Kingdom", "Rome, Italy", "Barcelona, Spain",
      "Amsterdam, Netherlands", "Prague, Czech Republic", "Vienna, Austria", "Istanbul, Turkey",
      "Athens, Greece", "Budapest, Hungary", "Dublin, Ireland", "Edinburgh, Scotland",
      "Lisbon, Portugal", "Copenhagen, Denmark", "Berlin, Germany", "Tokyo, Japan",
      "Bangkok, Thailand", "Singapore, Singapore", "Dubai, UAE", "Hong Kong, China",
      "Seoul, South Korea", "Bali, Indonesia", "Shanghai, China", "Kuala Lumpur, Malaysia",
      "Osaka, Japan", "New York, USA", "Los Angeles, USA", "Miami, USA",
      "Las Vegas, USA", "San Francisco, USA", "Chicago, USA", "Cancun, Mexico",
      "Mexico City, Mexico", "Rio de Janeiro, Brazil", "Buenos Aires, Argentina",
      "Vancouver, Canada", "Toronto, Canada", "Cape Town, South Africa", "Marrakech, Morocco",
      "Cairo, Egypt", "Nairobi, Kenya", "Johannesburg, South Africa", "Tel Aviv, Israel",
      "Sydney, Australia", "Melbourne, Australia", "Auckland, New Zealand",
      "Queenstown, New Zealand", "Bora Bora, French Polynesia", "Fiji Islands, Fiji"
    ];

    const randomDestinations = topWorldDestinations
      .sort(() => 0.5 - Math.random())
      .slice(0, 6)
      .map((destination) => {
        const [city, country] = destination.split(", ");
        return { city, country, image: "" };
      });
    
    setSuggestedDestinations(randomDestinations);

    randomDestinations.forEach(async (dest, index) => {
      try {
        const res = await fetch("/api/images", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destination: `${dest.city} ${dest.country}` }) });
        const data = await res.json();
        
        if (res.ok && data.images?.[0]) {
          setSuggestedDestinations((prev) => {
            const newArray = [...prev];
            newArray[index] = { ...newArray[index], image: data.images[0] };
            return newArray;
          });
        }
      } catch (error) {
        console.error(`Failed to load image for ${dest.city}`);
      }
    });

    if (userProfile) {
      if (userProfile.budgetRange) setSelectedBudget(userProfile.budgetRange);
      if (userProfile.location) setOrigin(userProfile.location);
    }
  }, [userProfile]);

  const handleFeedbackSubmit = async (feedback: any) => {
    try {
      await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(feedback) });
      if (user) {
        await profileManager.saveFeedback(user.uid, feedback);
      }
    } catch (error) {
      console.error('Failed to save feedback:', error);
    }
  };

  const handleAgentBookingComplete = async (cart: any[]) => {
    if (user) {
      for (const item of cart) {
        await profileManager.trackBooking(user.uid, {
          type: item.type,
          name: item.name,
          price: item.price,
          rating: 5,
          timestamp: new Date().toISOString(),
          destination: firstDestination || 'Unknown'
        });
      }
    }
    
    const newSavedItems = { ...savedItems };
    cart.forEach(item => {
      const typeKey = `${item.type}s` as keyof typeof savedItems;
      if (newSavedItems[typeKey]) {
        newSavedItems[typeKey] = [...newSavedItems[typeKey], item];
      }
    });
    setSavedItems(newSavedItems);
    setShowTripSummary(true);
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      <EventsBanner />
      
      {/* HERO SECTION - Apple-style Clean & Spacious */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-40">
        <div className="max-w-5xl mx-auto text-center w-full">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/80 backdrop-blur-sm border border-blue-100 mb-10"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900 tracking-tight">AI-Powered Event Travel</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-6xl sm:text-7xl lg:text-8xl font-semibold mb-8 tracking-tighter leading-[0.95]"
          >
            Travel to{" "}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent">
              unforgettable events
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-xl sm:text-2xl text-gray-600 mb-16 max-w-2xl mx-auto leading-relaxed tracking-tight"
          >
            Book trips around concerts, sports, festivals.
            <br className="hidden sm:block" />
            All tickets, flights, hotels in one place.
          </motion.p>

          {/* Search Box - REFINED */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50">
              <div className="relative mb-6">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
                <Input 
                  placeholder="Search events, cities, teams, or artists..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchQuery.trim() && handleSearch()}
                  className="w-full h-16 pl-16 pr-20 border-none bg-gray-50/50 focus:bg-white rounded-2xl text-lg font-medium placeholder:text-gray-400 transition-all focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
                />
                <button 
                  onClick={toggleVoiceInput} 
                  className={`absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                    isListening 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <input
                  type="date"
                  value={startDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                  className="flex-1 h-14 px-4 border-none bg-gray-50/50 rounded-xl text-sm font-medium focus:bg-white transition-all focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
                />
                <ArrowRight className="text-gray-300" size={20} />
                <input
                  type="date"
                  value={endDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                  className="flex-1 h-14 px-4 border-none bg-gray-50/50 rounded-xl text-sm font-medium focus:bg-white transition-all focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
                />
              </div>

              <button 
                onClick={() => searchQuery.trim() && handleSearch()} 
                disabled={!searchQuery.trim() || loading}
                className="w-full h-16 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-2xl text-lg transition-all shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-300/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Plan Your Event Trip <ArrowRight size={20} />
                  </span>
                )}
              </button>
            </div>

            {/* Stats - Refined */}
            <div className="grid grid-cols-3 gap-8 mt-16">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-center"
              >
                <div className="text-4xl font-semibold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-1">10,000+</div>
                <div className="text-sm text-gray-600 font-medium">Events Tracked</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-center"
              >
                <div className="text-4xl font-semibold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent mb-1">150+</div>
                <div className="text-sm text-gray-600 font-medium">Countries</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="text-center"
              >
                <div className="text-4xl font-semibold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-1">24/7</div>
                <div className="text-sm text-gray-600 font-medium">AI Support</div>
              </motion.div>
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
          >
            <ChevronDown className="w-6 h-6 text-gray-300 animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* FEATURED EVENTS - More Spacious */}
      <section className="py-40 px-6 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-semibold text-gray-900 mb-4 tracking-tight">Featured Events</h2>
            <p className="text-xl text-gray-600">Don't miss these incredible experiences</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {featuredEvents.slice(0, 3).map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: idx * 0.1, duration: 0.6, ease: "easeOut" }}
                onClick={() => router.push(`/events/${event.id}`)}
                className="group cursor-pointer"
              >
                <div className="relative h-[420px] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
                  <img 
                    src={event.thumbnail} 
                    alt={event.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  
                  {/* Gold Featured Badge */}
                  <div className="absolute top-6 right-6 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-full text-xs font-bold shadow-lg">
                    Featured
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <h3 className="text-white font-bold text-2xl mb-3">{event.name}</h3>
                    <div className="flex items-center gap-3 text-white/90 text-sm mb-6">
                      <span className="font-medium">{new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span>•</span>
                      <span className="font-medium">{event.venue.city}</span>
                    </div>
                    <button className="w-full py-3.5 bg-white/95 backdrop-blur-sm text-blue-600 font-semibold rounded-2xl hover:bg-white transition-all shadow-lg">
                      Plan My Trip →
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <button 
              onClick={() => router.push('/events')} 
              className="px-10 py-4 border-2 border-gray-200 hover:border-blue-600 hover:text-blue-600 rounded-2xl font-semibold transition-all text-gray-900"
            >
              View All Events <ArrowRight size={18} className="ml-2 inline" />
            </button>
          </div>
        </div>
      </section>

      {/* BROWSE BY CATEGORY - Refined */}
      <section className="py-40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-semibold text-gray-900 mb-4 tracking-tight">Browse by Category</h2>
            <p className="text-xl text-gray-600">Find events that match your interests</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {eventCategories.map((category, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.4 }}
                onClick={() => { setSearchQuery(category.name); handleSearch(); }}
                className="group cursor-pointer"
              >
                <div className={`bg-gradient-to-br ${category.gradient} p-12 rounded-3xl text-center hover:shadow-2xl hover:scale-105 transition-all duration-300`}>
                  <category.icon className="w-14 h-14 text-white mx-auto mb-4" />
                  <h3 className="text-white font-bold text-xl">{category.name}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - Apple-style Simple */}
      <section className="py-40 px-6 bg-gradient-to-b from-white via-blue-50/30 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-semibold text-gray-900 mb-4 tracking-tight">How It Works</h2>
            <p className="text-xl text-gray-600">Three simple steps to your perfect event trip</p>
          </div>

          <div className="grid md:grid-cols-3 gap-16">
            {[
              { icon: Search, title: "Find Events", desc: "Search for concerts, sports, or festivals worldwide", num: "1" },
              { icon: Ticket, title: "Compare Tickets", desc: "Get the best prices across all platforms", num: "2" },
              { icon: Calendar, title: "Book Everything", desc: "Flights, hotels, and activities - all in one place", num: "3" }
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15, duration: 0.6 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200/50">
                  <step.icon className="text-white" size={32} />
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full text-white font-bold flex items-center justify-center mx-auto mb-6 text-lg shadow-lg shadow-amber-200">
                  {step.num}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* POPULAR DESTINATIONS - Clean Grid */}
      <section className="py-40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-semibold text-gray-900 mb-4 tracking-tight">Popular Destinations</h2>
            <p className="text-xl text-gray-600">Where the world is heading</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {suggestedDestinations.map((dest, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
                onClick={() => { setSearchQuery(dest.city); handleSearch(); }}
                className="group cursor-pointer"
              >
                <div className="relative h-80 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
                  {dest.image ? (
                    <img 
                      src={dest.image} 
                      alt={dest.city} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <Globe2 className="text-blue-400" size={56} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-white font-bold text-2xl mb-1">{dest.city}</h3>
                    <p className="text-white/80 text-sm font-medium">{dest.country}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST SIGNALS - Refined */}
      <section className="py-24 px-6 bg-blue-50/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Shield, title: "Secure Payment", desc: "Your data is protected", color: "blue" },
              { icon: Ticket, title: "Official Partners", desc: "Ticketmaster verified", color: "amber" },
              { icon: Clock, title: "24/7 Support", desc: "We're here to help", color: "blue" }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-5">
                <div className={`w-14 h-14 ${item.color === 'amber' ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-blue-600'} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${item.color === 'amber' ? 'shadow-amber-200' : 'shadow-blue-200'}`}>
                  <item.icon className="text-white" size={26} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg mb-0.5">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modals & Results (keep your existing code) */}
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

      {showPreview && flights?.length > 0 && hotels?.length > 0 && !loading && (
        <section className="px-4 pb-12">
          <div className="max-w-4xl mx-auto">
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
          </div>
        </section>
      )}

      {/* Results Section (keep your existing tabs code) */}
      {(itineraryData || hotels?.length > 0 || loading) && !showPreview && (
        <section id="results-section" className="px-4 py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <div className="overflow-x-auto scrollbar-hide">
                <TabsList className="inline-flex bg-white border border-gray-200 p-1.5 rounded-2xl shadow-sm min-w-max">
                  <TabsTrigger value="itinerary" className="rounded-xl px-5 py-2.5 text-sm font-medium">Itinerary</TabsTrigger>
                  <TabsTrigger value="events" className="rounded-xl px-5 py-2.5 text-sm font-medium">🎉 Events</TabsTrigger>
                  <TabsTrigger value="flights" className="rounded-xl px-5 py-2.5 text-sm font-medium">Flights</TabsTrigger>
                  <TabsTrigger value="hotels" className="rounded-xl px-5 py-2.5 text-sm font-medium">Hotels</TabsTrigger>
                  <TabsTrigger value="restaurants" className="rounded-xl px-5 py-2.5 text-sm font-medium">Dining</TabsTrigger>
                  <TabsTrigger value="activities" className="rounded-xl px-5 py-2.5 text-sm font-medium">Activities</TabsTrigger>
                </TabsList>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 p-8 min-h-[400px] shadow-sm">
                <TabsContent value="itinerary" className="mt-0">
                  {loading && <div className="space-y-4"><Skeleton className="h-28 w-full rounded-2xl" /><Skeleton className="h-28 w-full rounded-2xl" /></div>}
                  {error && <div className="text-center py-16 text-red-600 bg-red-50 p-6 rounded-2xl">{error}</div>}
                  {itineraryData && !loading && !error && <ItineraryView data={itineraryData} />}
                  {!itineraryData && !loading && !error && (
                    <div className="text-center py-20">
                      <Globe2 className="mx-auto mb-6 text-gray-300" size={72} />
                      <h3 className="text-2xl font-semibold text-gray-900 mb-3">Ready to explore?</h3>
                      <p className="text-gray-600 text-lg">Enter a destination to start planning.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="events" className="mt-0">
                  {liveEvents.length > 0 ? (
                    <div className="space-y-6">
                      {liveEvents.map((event, i) => (
                        <div key={i} className="bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-2xl p-6 hover:shadow-lg transition-all">
                          <div className="flex items-start gap-5">
                            {event.image && (
                              <img src={event.image} alt={event.name} className="w-28 h-28 rounded-xl object-cover border-2 border-white shadow-md flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xl font-bold text-gray-900 mb-3">{event.name}</h4>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                                <div className="flex items-center gap-1.5">
                                  <Calendar size={16} />
                                  <span>{new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <MapPin size={16} />
                                  <span>{event.venue?.name || event.venue?.city}</span>
                                </div>
                              </div>
                              {event.url && (
                                <a 
                                  href={event.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200/50"
                                >
                                  Buy Tickets <ArrowRight size={16} />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <Trophy className="mx-auto mb-6 text-gray-300" size={64} />
                      <p className="font-semibold text-xl text-gray-900 mb-2">No Events Found</p>
                      <p className="text-gray-600 mb-6">Search a destination to find live events</p>
                      <button 
                        onClick={() => router.push('/events')} 
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold transition-all"
                      >
                        Browse All Events
                      </button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="flights" className="mt-0">
                  {flights?.length > 0 ? <FlightResults flights={flights} onSaveItem={(flight) => handleSaveItem(flight, 'flight')} /> : (
                    <div className="text-center py-20">
                      <Plane className="mx-auto mb-6 text-gray-300" size={64} />
                      <p className="text-gray-600 text-lg">Search to see available flights</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="hotels" className="mt-0">
                  {hotels?.length > 0 ? <HotelResults hotels={hotels} onSaveItem={(hotel) => handleSaveItem(hotel, 'hotel')} /> : (
                    <div className="text-center py-20 text-gray-600 text-lg">Search to find hotels</div>
                  )}
                </TabsContent>

                <TabsContent value="restaurants" className="mt-0">
                  {restaurants?.length > 0 ? <RestaurantResults restaurants={restaurants} onSaveItem={(restaurant) => handleSaveItem(restaurant, 'restaurant')} /> : (
                    <div className="text-center py-20">
                      <Utensils className="mx-auto mb-6 text-gray-300" size={64} />
                      <p className="text-gray-600 text-lg">Search to discover restaurants</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="activities" className="mt-0">
                  {activities?.length > 0 ? <ActivityResults activities={activities} onSaveItem={(activity) => handleSaveItem(activity, 'activity')} /> : (
                    <div className="text-center py-20 text-gray-600 text-lg">Search to find activities</div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </section>
      )}

      <Footer />
      
      {/* Floating Action Buttons - Refined */}
      {totalSavedItems > 0 && (
        <button 
          onClick={() => setShowTripSummary(true)} 
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full shadow-2xl shadow-blue-300/50 flex items-center justify-center z-50 hover:scale-110 transition-transform active:scale-95"
        >
          <Calendar className="text-white" size={24} />
          <span className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-lg">
            {totalSavedItems}
          </span>
        </button>
      )}

      {itineraryData && (
        <button 
          onClick={() => setShowFeedback(true)} 
          className="fixed bottom-28 right-8 w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-2xl shadow-green-300/50 flex items-center justify-center z-40 hover:scale-110 transition-transform active:scale-95" 
          title="Rate your trip"
        >
          <Star className="text-white fill-white" size={24} />
        </button>
      )}

      <TripSummary 
        isOpen={showTripSummary} 
        onClose={() => setShowTripSummary(false)} 
        savedItems={savedItems} 
        onRemoveItem={handleRemoveItem} 
        destination={firstDestination} 
      />
      
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
      
      <GladysAIAgent 
        currentDestination={firstDestination || "Paris"}
        onBookingComplete={handleAgentBookingComplete}
      />
      
      <EventNotificationToast userLocation={origin} />
    </main>
  );
}