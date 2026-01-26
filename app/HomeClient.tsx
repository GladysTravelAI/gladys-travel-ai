"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, ArrowRight, Search, Sparkles, ChevronDown, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Components
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
import TripRefinementModal, { TripPreferences } from "@/components/TripRefinementModal";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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

export default function HomeClient() {
  const router = useRouter();
  const { user, userProfile, updateUserProfile } = useAuth();
  
  // Search & Trip State
  const [searchQuery, setSearchQuery] = useState("");
  const [tripType, setTripType] = useState("");
  const [selectedBudget, setSelectedBudget] = useState("Mid-range");
  const [origin, setOrigin] = useState("Johannesburg, South Africa");
  const [days, setDays] = useState(5);
  const [loading, setLoading] = useState(false);
  const [firstDestination, setFirstDestination] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [activeTab, setActiveTab] = useState("itinerary");
  
  // Results State
  const [images, setImages] = useState<string[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [transport, setTransport] = useState<any>(null);
  const [itineraryData, setItineraryData] = useState<ItineraryData | null>(null);
  
  // Date & Preferences State
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showRefinement, setShowRefinement] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [tripPreferences, setTripPreferences] = useState<TripPreferences | null>(null);
  const [estimatedTripCost, setEstimatedTripCost] = useState(2000);

  // Events & Weather State
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<any[]>([]);
  
  // Feedback & Summary State
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

  // Search handler (keeping your existing logic)
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
      }
      
      if (flightsData.flights?.length > 0 && hotelsData.hotels?.length > 0) {
        setShowPreview(true);
      } else {
        setActiveTab("itinerary");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch travel data.");
    } finally {
      setLoading(false);
    }
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
      setSearchQuery(transcript);
      setTimeout(() => setShowRefinement(true), 500);
    };

    if (isListening) recognition.stop(); 
    else recognition.start();
  };

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

  const totalSavedItems = (savedItems.hotels?.length || 0) + 
                          (savedItems.flights?.length || 0) + 
                          (savedItems.restaurants?.length || 0) + 
                          (savedItems.activities?.length || 0);

  useEffect(() => {
    const featured = getFeaturedEvents().slice(0, 6);
    setFeaturedEvents(featured);

    if (userProfile) {
      if (userProfile.budgetRange) setSelectedBudget(userProfile.budgetRange);
      if (userProfile.location) setOrigin(userProfile.location);
    }
  }, [userProfile]);

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      {/* ============================================
          HERO SECTION - CLEAN & FOCUSED
          Apple-style: One clear message
          ============================================ */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Small intro badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 mb-8"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Your AI Travel Agent</span>
          </motion.div>

          {/* Main headline - MUCH clearer */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-semibold mb-6 tracking-tight leading-tight"
          >
            Going to a concert?{" "}
            <span className="text-apple-blue">We'll handle everything.</span>
          </motion.h1>

          {/* Simple explanation */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Just tell us which event. Our AI books tickets, flights, and hotels in one go.
          </motion.p>

          {/* TWO clear CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button 
              onClick={() => {
                const searchSection = document.getElementById('search-section');
                searchSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-apple text-lg px-10 py-6"
            >
              Get Started
            </Button>
            <Button 
              onClick={() => {
                const howSection = document.getElementById('how-it-works');
                howSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-apple-secondary text-lg px-10 py-6"
            >
              See How It Works
            </Button>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
          >
            <ChevronDown className="w-6 h-6 text-gray-400 animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* ============================================
          SEARCH SECTION - SEPARATE FROM HERO
          Clean, focused, no distractions
          ============================================ */}
      <section id="search-section" className="py-24 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-semibold mb-4">Where are you headed?</h2>
            <p className="text-xl text-gray-600">Tell us the event or destination</p>
          </div>

          <div className="card-apple p-8">
            <div className="relative mb-6">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
              <Input 
                placeholder="Search events, artists, teams, or cities..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchQuery.trim() && handleSearch()}
                className="w-full h-16 pl-14 pr-16 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500"
              />
              <Button 
                onClick={toggleVoiceInput} 
                variant="ghost"
                size="icon"
                className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl ${
                  isListening ? 'bg-blue-600 text-white' : ''
                }`}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </Button>
            </div>

            <div className="flex gap-4 mb-6">
              <input
                type="date"
                value={startDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                className="flex-1 h-14 px-4 border-2 border-gray-200 rounded-xl focus:border-blue-500"
              />
              <div className="flex items-center text-gray-400">→</div>
              <input
                type="date"
                value={endDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                className="flex-1 h-14 px-4 border-2 border-gray-200 rounded-xl focus:border-blue-500"
              />
            </div>

            <Button 
              onClick={() => searchQuery.trim() && handleSearch()} 
              disabled={!searchQuery.trim() || loading}
              className="btn-apple w-full h-14 text-lg"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Searching...
                </span>
              ) : (
                <>Search <ArrowRight size={20} className="ml-2" /></>
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================
          HOW IT WORKS - SIMPLE & CLEAR
          Apple-style storytelling
          ============================================ */}
      <section id="how-it-works" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-semibold mb-6">
              Here's how <span className="text-apple-blue">Gladys works</span>
            </h2>
            <p className="text-xl text-gray-600">Three simple steps. Done in minutes.</p>
          </div>

          <div className="space-y-24">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-apple-blue text-white font-semibold text-lg mb-6">
                  1
                </div>
                <h3 className="text-3xl font-semibold mb-4">Tell us which event</h3>
                <p className="text-xl text-gray-600 leading-relaxed">
                  "I want to see Taylor Swift in Los Angeles" or "Take me to the Super Bowl"
                </p>
              </div>
              <div className="flex-1">
                <div className="card-apple p-8 shadow-apple-lg">
                  <div className="h-48 bg-gradient-opulent-subtle rounded-xl flex items-center justify-center">
                    <Search className="w-16 h-16 text-apple-blue" />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-16">
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-apple-blue text-white font-semibold text-lg mb-6">
                  2
                </div>
                <h3 className="text-3xl font-semibold mb-4">We find the best deals</h3>
                <p className="text-xl text-gray-600 leading-relaxed">
                  AI compares prices across 50+ platforms. Tickets, flights, hotels—all optimized for you.
                </p>
              </div>
              <div className="flex-1">
                <div className="card-apple p-8 shadow-apple-lg">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
                      <span className="font-medium">Tickets</span>
                      <span className="text-apple-blue font-semibold">$245</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
                      <span className="font-medium">Flights</span>
                      <span className="text-apple-blue font-semibold">$180</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
                      <span className="font-medium">Hotel (2 nights)</span>
                      <span className="text-apple-blue font-semibold">$320</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-apple-blue text-white font-semibold text-lg mb-6">
                  3
                </div>
                <h3 className="text-3xl font-semibold mb-4">Book everything at once</h3>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Review your complete package. One click to book. Trip confirmed in 60 seconds.
                </p>
              </div>
              <div className="flex-1">
                <div className="card-apple p-8 shadow-apple-lg">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Total Trip Cost</p>
                    <p className="text-4xl font-semibold text-apple-blue mb-6">$745</p>
                    <button className="btn-apple w-full">Book Complete Trip</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SOCIAL PROOF - TRUST SIGNALS
          ============================================ */}
      <section className="py-32 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-semibold mb-6">Join 10,000+ travelers</h2>
          <p className="text-xl text-gray-600 mb-16">People are already using Gladys for their event trips</p>

          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <div className="text-5xl font-semibold text-apple-blue mb-2">$2.4M</div>
              <p className="text-gray-600">Saved for travelers</p>
            </div>
            <div>
              <div className="text-5xl font-semibold text-apple-blue mb-2">15,000+</div>
              <p className="text-gray-600">Trips booked</p>
            </div>
            <div>
              <div className="text-5xl font-semibold text-apple-blue mb-2">4.9★</div>
              <p className="text-gray-600">Average rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          FEATURED EVENTS - INSPIRATION
          ============================================ */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-semibold mb-6">Popular events right now</h2>
            <p className="text-xl text-gray-600">Thousands of events. One simple booking.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {featuredEvents.slice(0, 3).map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => router.push(`/events/${event.id}`)}
                className="card-apple overflow-hidden group cursor-pointer"
              >
                <div className="relative h-64 img-zoom">
                  <img 
                    src={event.thumbnail} 
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute top-4 right-4">
                    <span className="badge-featured">Featured</span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-2xl font-semibold text-white mb-2">{event.name}</h3>
                    <p className="text-white/90 text-sm">From ${event.estimatedTicketPrice.min}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              onClick={() => router.push('/events')} 
              className="btn-apple-secondary"
            >
              Browse All Events
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================
          FINAL CTA - SIMPLE & CLEAR
          ============================================ */}
      <section className="py-32 px-6 bg-apple-blue text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-semibold mb-6">Ready to start planning?</h2>
          <p className="text-xl mb-12 opacity-90">
            Tell us where you want to go. We'll handle the rest.
          </p>
          <button 
            onClick={() => {
              const searchSection = document.getElementById('search-section');
              searchSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white text-apple-blue hover:bg-gray-100 font-semibold text-lg px-12 py-5 rounded-2xl transition-all shadow-lg"
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* ============================================
          RESULTS SECTION - ONLY SHOWS AFTER SEARCH
          ============================================ */}
      <AnimatePresence>
        {(itineraryData || hotels?.length > 0 || loading) && !showPreview && (
          <motion.section 
            id="results-section" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-12 bg-gray-50"
          >
            <div className="max-w-7xl mx-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="inline-flex bg-white border-2 border-gray-200 p-1 rounded-xl shadow-sm">
                  <TabsTrigger value="itinerary" className="rounded-lg px-4 py-2">Itinerary</TabsTrigger>
                  <TabsTrigger value="events" className="rounded-lg px-4 py-2">Events</TabsTrigger>
                  <TabsTrigger value="flights" className="rounded-lg px-4 py-2">Flights</TabsTrigger>
                  <TabsTrigger value="hotels" className="rounded-lg px-4 py-2">Hotels</TabsTrigger>
                  <TabsTrigger value="restaurants" className="rounded-lg px-4 py-2">Dining</TabsTrigger>
                  <TabsTrigger value="activities" className="rounded-lg px-4 py-2">Activities</TabsTrigger>
                </TabsList>

                <div className="card-apple p-6">
                  <TabsContent value="itinerary">{itineraryData && <ItineraryView data={itineraryData} />}</TabsContent>
                  <TabsContent value="events">
                    {liveEvents.length > 0 ? (
                      <div className="space-y-4">
                        {liveEvents.map((event, i) => (
                          <div key={i} className="card-apple p-6">
                            <h4 className="text-xl font-bold mb-2">{event.name}</h4>
                            <p className="text-gray-600">{event.venue?.city}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-12">No events found</p>
                    )}
                  </TabsContent>
                  <TabsContent value="flights">{flights?.length > 0 ? <FlightResults flights={flights} onSaveItem={(f) => handleSaveItem(f, 'flight')} /> : <p className="text-center text-gray-500 py-12">No flights found</p>}</TabsContent>
                  <TabsContent value="hotels">{hotels?.length > 0 ? <HotelResults hotels={hotels} onSaveItem={(h) => handleSaveItem(h, 'hotel')} /> : <p className="text-center text-gray-500 py-12">No hotels found</p>}</TabsContent>
                  <TabsContent value="restaurants">{restaurants?.length > 0 ? <RestaurantResults restaurants={restaurants} onSaveItem={(r) => handleSaveItem(r, 'restaurant')} /> : <p className="text-center text-gray-500 py-12">No restaurants found</p>}</TabsContent>
                  <TabsContent value="activities">{activities?.length > 0 ? <ActivityResults activities={activities} onSaveItem={(a) => handleSaveItem(a, 'activity')} /> : <p className="text-center text-gray-500 py-12">No activities found</p>}</TabsContent>
                </div>
              </Tabs>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <Footer />

      {/* Modals & Floating Components */}
      <TripRefinementModal isOpen={showRefinement} onClose={() => setShowRefinement(false)} onGenerate={(prefs) => { setTripPreferences(prefs); setShowRefinement(false); handleSearch(searchQuery, prefs); }} destination={searchQuery} isLoading={loading} />
      <TripSummary isOpen={showTripSummary} onClose={() => setShowTripSummary(false)} savedItems={savedItems} onRemoveItem={handleRemoveItem} destination={firstDestination} />
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} tripData={completedTrip || { destination: firstDestination, startDate: startDate?.toISOString() || new Date().toISOString(), endDate: endDate?.toISOString() || new Date().toISOString(), tripId: 'trip_' + Date.now() }} onSubmit={handleFeedbackSubmit} />
      <GladysAIAgent currentDestination={firstDestination || "Paris"} onBookingComplete={handleAgentBookingComplete} />
      <EventNotificationToast userLocation={origin} />
      
      {showPreview && flights?.length > 0 && hotels?.length > 0 && !loading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="card-apple max-w-4xl w-full p-8">
            <TripPreview destination={firstDestination} flights={flights} hotels={hotels} startDate={startDate} endDate={endDate} onViewDetails={() => { setShowPreview(false); setActiveTab("itinerary"); }} />
          </div>
        </div>
      )}
    </main>
  );
}