"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, ArrowRight, Globe2, Calendar, Shield, Plane, MapPin, Car, Utensils, Cloud, Star, Trophy, Sparkles, Ticket, TrendingUp, ShoppingBag, Search } from "lucide-react";
import { motion } from "framer-motion";

// Components
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GladysAICompanion from '@/components/GladysAICompanion';
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

const ticketPartners = [
  { name: "Ticketmaster", logo: "🎫", category: "Official Tickets" },
  { name: "StubHub", logo: "🎟️", category: "Resale Marketplace" },
  { name: "SeatGeek", logo: "💺", category: "Best Seats" },
  { name: "Vivid Seats", logo: "✨", category: "Premium Options" },
];

export default function HomeClient() {
  const router = useRouter();
  const { user, userProfile, updateUserProfile } = useAuth();
  
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

  // Weather & Smart Features
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

  // ✅ Track saved items in user profile
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

    // ✅ Track booking in user profile
    if (user) {
      await profileManager.trackBooking(user.uid, {
        type: type,
        name: savedItem.name,
        price: parseFloat(savedItem.price.replace(/[^0-9.]/g, '')) || 0,
        rating: item.rating || 0,
        timestamp: new Date().toISOString(),
        destination: firstDestination
      });
      console.log('✅ Booking tracked in profile');
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

      // 🔥 Search live events from API
      const liveEventsPromise = eventService.universalSearch(location).catch(() => []);

      const [
        itineraryRes, 
        restaurantsRes, 
        hotelsRes, 
        activitiesRes, 
        imagesRes,
        flightsRes,
        transportRes,
        weatherRes,
        liveEventsData
      ] = await Promise.all([
        fetch("/api/itinerary", { 
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify(itineraryPayload) 
        }),
        fetch("/api/restaurants", { 
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ location, tripType: prefs?.tripType || tripType }) 
        }),
        fetch("/api/hotels", { 
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ 
            destination: location,
            budget: prefs?.budget || selectedBudget 
          }) 
        }),
        fetch("/api/activities", { 
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ location, tripType: prefs?.tripType || tripType }) 
        }),
        fetch("/api/images", { 
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ destination: location }) 
        }),
        fetch("/api/flights", { 
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ 
            origin: prefs?.origin || origin, 
            destination: location,
            passengers: prefs?.groupSize || 1,
            departDate: startDate?.toISOString(),
            returnDate: endDate?.toISOString()
          }) 
        }),
        fetch("/api/transport", { 
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ 
            destination: location,
            origin: prefs?.origin || origin
          }) 
        }),
        fetch("/api/weather", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location })
        }).catch(() => null),
        liveEventsPromise
      ]);

      const [
        itinerary, 
        restaurantsData, 
        hotelsData, 
        activitiesData, 
        imagesData,
        flightsData,
        transportData,
        weatherData
      ] = await Promise.all([
        itineraryRes.json(), 
        restaurantsRes.json(), 
        hotelsRes.json(), 
        activitiesRes.json(), 
        imagesRes.json(),
        flightsRes.json(),
        transportRes.json(),
        weatherRes ? weatherRes.json() : null
      ]);

      if (!itineraryRes.ok) {
        throw new Error(itinerary.error || "Failed to fetch itinerary");
      }

      setItineraryData(itinerary);
      setRestaurants(restaurantsData.restaurants || []);
      setHotels(hotelsData.hotels || []);
      setActivities(activitiesData.activities || []);
      setImages(imagesData.images?.filter((url: string) => url) || []);
      setFlights(flightsData.flights || []);
      setTransport(transportData.transport || null);
      setFirstDestination(location);
      setDays(prefs?.days || days);
      
      // 🔥 Set live events from Ticketmaster/SeatGeek
      if (liveEventsData && liveEventsData.length > 0) {
        setLiveEvents(liveEventsData.slice(0, 10));
        console.log(`🎉 Found ${liveEventsData.length} live events in ${location}`);
      } else {
        setLiveEvents([]);
      }
      
      if (weatherData?.weather) {
        setCurrentWeather(weatherData.weather);
        
        const isRainy = weatherData.weather.current.condition.toLowerCase().includes('rain');
        const isCold = weatherData.weather.current.temp < 15;
        
        if (isRainy) {
          console.log('☔ Rainy weather detected - prioritizing indoor activities');
        } else if (isCold) {
          console.log('🧥 Cold weather - recommending warm activities');
        } else {
          console.log('☀️ Perfect weather for outdoor exploration!');
        }
      }
      
      const flightCost = flightsData.flights?.[0]?.price || 800;
      const hotelCost = (hotelsData.hotels?.[0]?.price || 150) * (prefs?.days || days);
      setEstimatedTripCost(flightCost + hotelCost + 500);
      
      // ✅ Track search in user profile
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
        
        console.log('✅ Search and trip planning tracked');
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
    
    const destPatterns = [
      /(?:to|visit|trip to)\s+([a-z\s,]+?)(?:\s+for|\s+next|\s+in|\s+during|\s*$)/i,
    ];
    
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
    
    setTimeout(() => {
      if (searchQuery) {
        setShowRefinement(true);
      }
    }, 500);
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
    // Load featured events from our curated list
    const featured = getFeaturedEvents().slice(0, 5);
    setFeaturedEvents(featured);

    // Top 50 world destinations - randomly selected each time
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
      .slice(0, 8)
      .map((destination) => {
        const [city, country] = destination.split(", ");
        return { city, country, image: "" };
      });
    
    setSuggestedDestinations(randomDestinations);

    randomDestinations.forEach(async (dest, index) => {
      try {
        const res = await fetch("/api/images", { 
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ destination: `${dest.city} ${dest.country}` }) 
        });
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

    // ✅ Load user profile preferences on mount
    if (userProfile) {
      console.log('✅ User profile loaded:', userProfile);
      
      if (userProfile.budgetRange) {
        setSelectedBudget(userProfile.budgetRange);
      }
      
      if (userProfile.wishlist.length > 0) {
        console.log('📍 User wishlist:', userProfile.wishlist);
      }
      
      if (userProfile.location) {
        setOrigin(userProfile.location);
      }
    }
  }, [userProfile]);

  // ✅ Handle feedback submission
  const handleFeedbackSubmit = async (feedback: any) => {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback)
      });
      
      if (user) {
        await profileManager.saveFeedback(user.uid, feedback);
        console.log('✅ Feedback saved to profile');
      }
      
      console.log('✅ Feedback submitted:', feedback);
    } catch (error) {
      console.error('❌ Failed to save feedback:', error);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      {/* Featured Events Banner - Dynamic! */}
      <EventsBanner />
      
      {/* Hero Section - White, Blue & Gold Theme */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Gold & Blue gradient orbs */}
        <div className="absolute top-40 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-amber-200 to-yellow-300 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-60 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-blue-200 to-blue-400 rounded-full opacity-20 blur-3xl"></div>

        <div className="relative max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            {/* Gold badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border-2 border-blue-200 rounded-full mb-8">
              <Star className="text-amber-500 fill-amber-500" size={16} />
              <span className="text-sm font-semibold text-blue-900">AI-Powered Event Travel Planning</span>
            </div>

            {/* ✅ Personalized greeting */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              {userProfile?.name ? `Welcome back, ${userProfile.name.split(' ')[0]}!` : 'Travel to'}
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-900 bg-clip-text text-transparent">
                {userProfile?.name ? 'Where to next?' : 'unforgettable events'}
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
              {userProfile ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-white rounded-full text-sm font-semibold">
                    <Star size={14} className="fill-current" />
                    {userProfile.status}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span>{userProfile.totalTripsPlanned} trips planned</span>
                </span>
              ) : (
                <>
                  Book trips around concerts, sports, and festivals worldwide.
                  <span className="block mt-2">All tickets, flights, and hotels in one place.</span>
                </>
              )}
            </p>
          </motion.div>

          {/* Search Card - Clean White with Blue Accents */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.2 }} 
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-blue-100">
              <div className="space-y-6">
                <LocationAutoComplete
                  value={origin}
                  onChange={setOrigin}
                  label="From"
                  placeholder="Your location"
                />

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Search Events or Destinations
                  </label>
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
                    <Input 
                      placeholder="Search events, cities, teams, or artists..." 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchQuery.trim() && setShowRefinement(true)}
                      className="w-full h-16 pl-16 pr-20 border-2 border-gray-200 focus:border-blue-500 rounded-2xl text-lg"
                    />
                    <Button 
                      onClick={toggleVoiceInput} 
                      variant="outline"
                      size="icon"
                      className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl border-2 ${
                        isListening ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </Button>
                  </div>
                </div>

                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onDateChange={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                  }}
                  destination={searchQuery}
                />

                <Button 
                  onClick={() => searchQuery.trim() && setShowRefinement(true)} 
                  disabled={!searchQuery.trim() || loading}
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 rounded-xl text-white font-semibold text-lg shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Planning your adventure...
                    </span>
                  ) : (
                    <>
                      Plan Your Event Trip
                      <ArrowRight className="inline ml-2" size={20} />
                    </>
                  )}
                </Button>

                {isListening && (
                  <div className="text-center py-2 text-sm text-blue-600 animate-pulse font-medium">
                    🎤 Listening...
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats with Gold Accents */}
            <div className="grid grid-cols-3 gap-6 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-1">10,000+</div>
                <div className="text-sm text-gray-600">Events Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent mb-1">150+</div>
                <div className="text-sm text-gray-600">Countries</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-1">24/7</div>
                <div className="text-sm text-gray-600">AI Support</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trending Destinations */}
      <section className="relative py-20 px-6 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">
              {userProfile?.wishlist.length ? 'Your Wishlist & Trending Destinations' : 'Trending Destinations'}
            </h2>
            <p className="text-lg text-gray-600">Popular cities for event travelers</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {suggestedDestinations.map((destination, idx) => (
              <motion.div
                key={`${destination.city}-${idx}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => { 
                  setSearchQuery(destination.city); 
                  setShowRefinement(true); 
                }}
                className="group cursor-pointer"
              >
                <div className="relative h-72 overflow-hidden rounded-2xl border-2 border-blue-100 shadow-lg hover:shadow-2xl hover:border-blue-300 transition-all">
                  {destination.image ? (
                    <img 
                      src={destination.image} 
                      alt={destination.city} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <Globe2 className="text-blue-400" size={48} />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-blue-900/30 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white font-bold text-xl mb-1">
                      {destination.city}
                    </h3>
                    <p className="text-white/90 text-sm">
                      {destination.country}
                    </p>
                  </div>

                  <div className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <ArrowRight className="text-white" size={20} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modals */}
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

      {/* Results Section with Tickets Hub Tab */}
      {(itineraryData || hotels?.length > 0 || loading) && !showPreview && (
        <section id="results-section" className="px-4 py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <div className="overflow-x-auto scrollbar-hide">
                <TabsList className="inline-flex bg-white border-2 border-blue-100 p-1 rounded-xl shadow-sm min-w-max">
                  <TabsTrigger value="itinerary" className="rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Itinerary
                  </TabsTrigger>
                  <TabsTrigger value="events" className="rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    🎉 Events
                  </TabsTrigger>
                  <TabsTrigger value="tickets-hub" className="rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white">
                    🎫 Tickets Hub
                  </TabsTrigger>
                  <TabsTrigger value="weather" className="rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    🌤️ Weather
                  </TabsTrigger>
                  <TabsTrigger value="flights" className="rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Flights
                  </TabsTrigger>
                  <TabsTrigger value="hotels" className="rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Hotels
                  </TabsTrigger>
                  <TabsTrigger value="restaurants" className="rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Dining
                  </TabsTrigger>
                  <TabsTrigger value="activities" className="rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Activities
                  </TabsTrigger>
                  <TabsTrigger value="insurance" className="rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Insurance
                  </TabsTrigger>
                  <TabsTrigger value="transport" className="rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Transport
                  </TabsTrigger>
                  <TabsTrigger value="maps" className="rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Maps
                  </TabsTrigger>
                  <TabsTrigger value="photos" className="rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Photos
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="bg-white rounded-2xl border-2 border-blue-100 p-4 sm:p-6 min-h-[400px]">
                
                <TabsContent value="itinerary" className="mt-0">
                  {loading && (
                    <div className="space-y-3">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  )}
                  {error && (
                    <div className="text-center py-12 text-red-600 bg-red-50 p-6 rounded-xl text-sm">
                      {error}
                    </div>
                  )}
                  {itineraryData && !loading && !error && (
                    <ItineraryView data={itineraryData} />
                  )}
                  {!itineraryData && !loading && !error && (
                    <div className="text-center py-16">
                      <Globe2 className="mx-auto mb-4 text-gray-300" size={64} />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Ready to explore?
                      </h3>
                      <p className="text-gray-600">
                        Enter a destination to start planning.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="events" className="mt-0">
                  {liveEvents.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Trophy className="text-amber-500" size={28} />
                            Live Events in {firstDestination}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Powered by Ticketmaster • Real-time data
                          </p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          LIVE
                        </div>
                      </div>
                      
                      {liveEvents.map((event, i) => (
                        <div key={i} className="bg-gradient-to-r from-blue-50 to-white border-2 border-blue-200 rounded-2xl p-6 hover:border-blue-400 hover:shadow-xl transition-all">
                          <div className="flex items-start gap-4">
                            {event.image && (
                              <img
                                src={event.image}
                                alt={event.name}
                                className="w-24 h-24 rounded-xl object-cover border-2 border-white shadow-md"
                              />
                            )}
                            
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-gray-900 mb-2">
                                {event.name}
                              </h4>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center gap-1">
                                  <Calendar size={16} />
                                  {new Date(event.startDate).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin size={16} />
                                  {event.venue?.name || event.venue?.city}
                                </div>
                                {event.source && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
                                    via {event.source}
                                  </span>
                                )}
                              </div>

                              {event.priceRange && event.priceRange.min > 0 && (
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-sm text-gray-600">From</span>
                                  <span className="text-lg font-bold text-green-600">
                                    {event.priceRange.currency} ${event.priceRange.min.toLocaleString()}
                                  </span>
                                </div>
                              )}

                              {event.description && (
                                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                  {event.description}
                                </p>
                              )}

                              <div className="flex gap-3">
                                {event.url && (
                                  <a
                                    href={event.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-900 transition-all flex items-center gap-2 text-sm"
                                  >
                                    Buy Tickets
                                    <ArrowRight size={16} />
                                  </a>
                                )}
                                <button
                                  onClick={() => {
                                    const eventDate = new Date(event.startDate);
                                    const start = new Date(eventDate);
                                    start.setDate(start.getDate() - 2);
                                    const end = new Date(eventDate);
                                    end.setDate(end.getDate() + 1);
                                    
                                    setStartDate(start);
                                    setEndDate(end);
                                    setDays(4);
                                    handleSearch(firstDestination);
                                  }}
                                  className="px-6 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-blue-500 hover:text-blue-600 transition-all text-sm"
                                >
                                  Plan Trip
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-gray-500">
                      <Trophy className="mx-auto mb-4 text-gray-300" size={48} />
                      <p className="font-semibold text-lg text-gray-900 mb-2">No Events Found</p>
                      <p className="text-sm mb-4">Search a destination to find live events</p>
                      <Button
                        onClick={() => router.push('/events')}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                      >
                        Browse All Events
                      </Button>
                    </div>
                  )}
                </TabsContent>

                {/* NEW: Tickets Hub Tab */}
                <TabsContent value="tickets-hub" className="mt-0">
                  <div className="space-y-8">
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border-2 border-amber-200 rounded-full mb-6">
                        <Ticket className="text-amber-600" size={16} />
                        <span className="text-sm font-semibold text-amber-900">Trusted Partners</span>
                      </div>
                      <h3 className="text-3xl font-bold text-gray-900 mb-3">Compare Ticket Prices</h3>
                      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Find the best deals across all major ticket platforms
                      </p>
                    </div>

                    {/* Partner Cards */}
                    <div className="grid md:grid-cols-4 gap-4">
                      {ticketPartners.map((partner, idx) => (
                        <div
                          key={idx}
                          className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-2xl p-6 text-center hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer group"
                        >
                          <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                            {partner.logo}
                          </div>
                          <h4 className="text-lg font-bold text-gray-900 mb-1">{partner.name}</h4>
                          <p className="text-sm text-gray-600 mb-4">{partner.category}</p>
                          <button className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all">
                            Browse Tickets
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Features */}
                    <div className="grid md:grid-cols-3 gap-4 mt-8">
                      <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border-2 border-blue-100">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                          <TrendingUp className="text-white" size={24} />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Price Comparison</h4>
                        <p className="text-gray-600 text-sm">We scan all platforms to find you the best ticket prices in real-time.</p>
                      </div>

                      <div className="bg-gradient-to-br from-amber-50 to-white p-6 rounded-2xl border-2 border-amber-200">
                        <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center mb-4">
                          <Star className="text-white fill-white" size={24} />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Premium Access</h4>
                        <p className="text-gray-600 text-sm">Get early access to exclusive tickets and VIP experiences.</p>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border-2 border-blue-100">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
                          <ShoppingBag className="text-white" size={24} />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">Bundle Deals</h4>
                        <p className="text-gray-600 text-sm">Save more with ticket + hotel + flight package deals.</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="weather" className="mt-0">
                  {currentWeather ? (
                    <WeatherWidget 
                      destination={firstDestination}
                      showRecommendations={true}
                    />
                  ) : (
                    <div className="text-center py-16 text-gray-500">
                      <Cloud className="mx-auto mb-4 text-gray-300" size={48} />
                      <p className="font-semibold text-lg text-gray-900 mb-2">Weather Forecast</p>
                      <p className="text-sm">Search a destination to see weather conditions</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="flights" className="mt-0">
                  {flights?.length > 0 ? (
                    <FlightResults 
                      flights={flights} 
                      onSaveItem={(flight) => handleSaveItem(flight, 'flight')} 
                    />
                  ) : (
                    <div className="text-center py-16 text-gray-500">
                      <Plane className="mx-auto mb-4 text-gray-300" size={48} />
                      <p>Search to see available flights</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="hotels" className="mt-0">
                  {hotels?.length > 0 ? (
                    <HotelResults hotels={hotels} onSaveItem={(hotel) => handleSaveItem(hotel, 'hotel')} />
                  ) : (
                    <div className="text-center py-16 text-gray-500">Search to find hotels</div>
                  )}
                </TabsContent>

                <TabsContent value="restaurants" className="mt-0">
                  {restaurants?.length > 0 ? (
                    <RestaurantResults restaurants={restaurants} onSaveItem={(restaurant) => handleSaveItem(restaurant, 'restaurant')} />
                  ) : (
                    <div className="text-center py-16 text-gray-500">
                      <Utensils className="mx-auto mb-4 text-gray-300" size={48} />
                      <p>Search to discover restaurants</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="activities" className="mt-0">
                  {activities?.length > 0 ? (
                    <ActivityResults activities={activities} onSaveItem={(activity) => handleSaveItem(activity, 'activity')} />
                  ) : (
                    <div className="text-center py-16 text-gray-500">Search to find activities</div>
                  )}
                </TabsContent>

                <TabsContent value="insurance" className="mt-0">
                  <InsuranceView
                    destination={firstDestination}
                    startDate={startDate?.toISOString().split('T')[0]}
                    endDate={endDate?.toISOString().split('T')[0]}
                    travelers={tripPreferences?.groupSize || 1}
                    tripCost={estimatedTripCost}
                  />
                </TabsContent>

                <TabsContent value="transport" className="mt-0">
                  {transport ? (
                    <TransportResults transport={transport} />
                  ) : (
                    <div className="text-center py-16 text-gray-500">
                      <Car className="mx-auto mb-4 text-gray-300" size={48} />
                      <p>Search to see transport options</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="maps" className="mt-0">
                  {firstDestination ? (
                    <MapsDirections destination={firstDestination} />
                  ) : (
                    <div className="text-center py-16 text-gray-500">
                      <MapPin className="mx-auto mb-4 text-gray-300" size={48} />
                      <p>Search to view maps</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="photos" className="mt-0">
                  {images?.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {images.map((url, index) => url && (
                        <img 
                          key={index} 
                          src={url} 
                          alt={`View ${index + 1}`} 
                          className="w-full h-48 object-cover rounded-xl" 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-gray-500">Search to view photos</div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </section>
      )}

      {/* Featured Events Section */}
      {featuredEvents.length > 0 && (
        <section className="py-20 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="text-amber-500 fill-amber-500" />
                  Featured Events
                </h2>
                <p className="text-gray-600 mt-2 text-lg">Plan your trip around these major events</p>
              </div>
              <Button
                onClick={() => router.push('/events')}
                variant="outline"
                className="rounded-xl border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                View All Events
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {featuredEvents.slice(0, 3).map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => router.push(`/events/${event.id}`)}
                  className="group cursor-pointer"
                >
                  <div className="relative h-72 rounded-2xl overflow-hidden mb-4 border-2 border-blue-100 hover:border-blue-300 transition-all shadow-lg hover:shadow-2xl">
                    <img
                      src={event.thumbnail}
                      alt={event.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/40 to-transparent" />
                    
                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                      <Star size={12} className="fill-current" />
                      Featured
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-white font-bold text-xl mb-2 line-clamp-2">
                        {event.name}
                      </h3>
                      <div className="flex items-center gap-4 text-white/90 text-sm mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          {event.venue.city}
                        </div>
                      </div>
                      <button className="w-full py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all">
                        View Event Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
      
      {/* Floating Buttons */}
      {totalSavedItems > 0 && (
        <button 
          onClick={() => setShowTripSummary(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 transition-transform"
        >
          <Calendar className="text-white" size={22} />
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-lg">
            {totalSavedItems}
          </span>
        </button>
      )}

      {itineraryData && (
        <button
          onClick={() => setShowFeedback(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-2xl flex items-center justify-center z-40 hover:scale-110 transition-transform"
          title="Rate your trip"
        >
          <Star className="text-white fill-white" size={22} />
        </button>
      )}

      {/* Modals */}
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

      <GladysAICompanion currentDestination={firstDestination || "Paris"} />
      <EventNotificationToast userLocation={origin} />
    </main>
  );
}