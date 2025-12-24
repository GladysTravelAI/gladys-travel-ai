"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, ArrowRight, Globe2, Calendar, Shield, Plane, MapPin, Car, Utensils, Cloud, Star, Trophy } from "lucide-react";
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
  const [sportsEvents, setSportsEvents] = useState<any[]>([]);
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

      const [
        itineraryRes, 
        restaurantsRes, 
        hotelsRes, 
        activitiesRes, 
        imagesRes,
        flightsRes,
        transportRes,
        weatherRes,
        eventsRes
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
        fetch("/api/sports-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            sport: 'Football', 
            city: location,
            year: 2026
          })
        }).catch(() => null)
      ]);

      const [
        itinerary, 
        restaurantsData, 
        hotelsData, 
        activitiesData, 
        imagesData,
        flightsData,
        transportData,
        weatherData,
        eventsData
      ] = await Promise.all([
        itineraryRes.json(), 
        restaurantsRes.json(), 
        hotelsRes.json(), 
        activitiesRes.json(), 
        imagesRes.json(),
        flightsRes.json(),
        transportRes.json(),
        weatherRes ? weatherRes.json() : null,
        eventsRes ? eventsRes.json() : null
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

      if (eventsData?.events) {
        setSportsEvents(eventsData.events.slice(0, 5));
        console.log(`🏆 Found ${eventsData.events.length} events in ${location}`);
      }
      
      const flightCost = flightsData.flights?.[0]?.price || 800;
      const hotelCost = (hotelsData.hotels?.[0]?.price || 150) * (prefs?.days || days);
      setEstimatedTripCost(flightCost + hotelCost + 500);
      
      // ✅ Track search in user profile
      if (user) {
        await profileManager.trackSearch(user.uid, location);
        
        // ✅ Track trip planning
        await profileManager.trackTripPlanned(user.uid, location);
        
        // ✅ Update preferences based on search
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
      
      // Pre-fill preferences from profile
      if (userProfile.budgetRange) {
        setSelectedBudget(userProfile.budgetRange);
      }
      
      // Show wishlist destinations
      if (userProfile.wishlist.length > 0) {
        console.log('📍 User wishlist:', userProfile.wishlist);
      }
      
      // Set origin from profile location
      if (userProfile.location) {
        setOrigin(userProfile.location);
      }
    }
  }, [userProfile]);

  // ✅ Handle feedback submission
  const handleFeedbackSubmit = async (feedback: any) => {
    try {
      // Save to backend
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback)
      });
      
      // ✅ Save to user profile
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
      
      {/* Featured Events Banner - New! */}
      <EventsBanner />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
          >
            {/* ✅ Personalized greeting */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-gray-900 mb-4 leading-tight">
              {userProfile?.name ? `Welcome back, ${userProfile.name.split(' ')[0]}!` : 'Your journey begins'}
              <br />
              {userProfile?.name ? 'Where to next?' : 'with Gladys.'}
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              {userProfile ? `${userProfile.status} • ${userProfile.totalTripsPlanned} trips planned` : 'AI‑powered travel planning for the modern explorer.'}
            </p>
          </motion.div>

          {/* Search Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.2 }} 
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-lg">
              <div className="space-y-5">
                <LocationAutoComplete
                  value={origin}
                  onChange={setOrigin}
                  label="From"
                  placeholder="Your location"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Where to?
                  </label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Paris, Tokyo, Thohoyandou..." 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchQuery.trim() && setShowRefinement(true)}
                      className="flex-1 border-gray-300 focus:border-blue-500 rounded-xl px-4 py-3"
                    />
                    <Button 
                      onClick={toggleVoiceInput} 
                      variant="outline"
                      size="icon"
                      className={`rounded-xl border-gray-300 ${
                        isListening ? 'bg-red-500 text-white border-red-500' : ''
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
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <span>Planning...</span>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="inline ml-2" size={18} />
                    </>
                  )}
                </Button>

                {isListening && (
                  <div className="text-center py-2 text-sm text-gray-500">
                    Listening...
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trending Destinations */}
      <section className="relative py-12 px-0">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 px-4">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900 mb-2">
              {userProfile?.wishlist.length ? 'Your wishlist & trending destinations' : 'Trending destinations.'}
            </h2>
            <p className="text-lg text-gray-600">
              Explore popular and sacred places.
            </p>
          </div>

          <div className="overflow-x-auto pb-6 scrollbar-hide">
            <div className="flex gap-4 px-4" style={{ width: 'max-content' }}>
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
                  className="flex-shrink-0 w-72 cursor-pointer group"
                >
                  <div className="relative h-96 overflow-hidden rounded-2xl bg-gray-100 border border-gray-200">
                    {destination.image ? (
                      <img 
                        src={destination.image} 
                        alt={destination.city} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Globe2 className="text-gray-400" size={48} />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-white font-semibold text-2xl mb-1">
                        {destination.city}
                      </h3>
                      <p className="text-white/90 text-base">
                        {destination.country}
                      </p>
                    </div>

                    <div className="absolute top-4 right-4 w-9 h-9 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="text-gray-900" size={18} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
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

      {/* Results Section */}
      {(itineraryData || hotels?.length > 0 || loading) && !showPreview && (
        <section id="results-section" className="px-4 py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <div className="overflow-x-auto scrollbar-hide">
                <TabsList className="inline-flex bg-white border border-gray-200 p-1 rounded-xl shadow-sm min-w-max">
                  <TabsTrigger value="itinerary" className="rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap">
                    Itinerary
                  </TabsTrigger>
                  <TabsTrigger value="weather" className="rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap">
                    🌤️ Weather
                  </TabsTrigger>
                  <TabsTrigger value="events" className="rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap">
                    🏆 Events
                  </TabsTrigger>
                  <TabsTrigger value="flights" className="rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap">
                    Flights
                  </TabsTrigger>
                  <TabsTrigger value="hotels" className="rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap">
                    Hotels
                  </TabsTrigger>
                  <TabsTrigger value="restaurants" className="rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap">
                    Dining
                  </TabsTrigger>
                  <TabsTrigger value="activities" className="rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap">
                    Activities
                  </TabsTrigger>
                  <TabsTrigger value="insurance" className="rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap">
                    Insurance
                  </TabsTrigger>
                  <TabsTrigger value="transport" className="rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap">
                    Transport
                  </TabsTrigger>
                  <TabsTrigger value="maps" className="rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap">
                    Maps
                  </TabsTrigger>
                  <TabsTrigger value="photos" className="rounded-lg px-4 py-2 text-xs font-medium whitespace-nowrap">
                    Photos
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 min-h-[400px]">
                
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

                <TabsContent value="events" className="mt-0">
                  {sportsEvents.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          <Trophy className="text-amber-500" size={28} />
                          Upcoming Events in {firstDestination}
                        </h3>
                      </div>
                      
                      {sportsEvents.map((event, i) => (
                        <div key={i} className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition-all">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-gray-900 mb-2">
                                {event.name}
                              </h4>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Calendar size={16} />
                                  {event.date}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin size={16} />
                                  {event.location.venue}, {event.location.city}
                                </div>
                              </div>
                            </div>
                            {event.ticketInfo && (
                              <div className="text-right">
                                <p className="text-sm text-gray-500">Est. Price</p>
                                <p className="text-lg font-bold text-green-600">
                                  {event.ticketInfo.estimatedPrice}
                                </p>
                              </div>
                            )}
                          </div>

                          {event.travelPackage && (
                            <div className="bg-white rounded-xl p-4 mb-4 border border-blue-200">
                              <p className="text-sm font-semibold text-blue-900 mb-2">
                                🎫 Travel Package Available
                              </p>
                              <div className="flex gap-4 text-xs text-blue-700">
                                {event.travelPackage.flights && <span>✈️ Flights</span>}
                                {event.travelPackage.hotels && <span>🏨 Hotels</span>}
                                {event.travelPackage.tickets && <span>🎟️ Tickets</span>}
                                <span className="font-bold ml-auto text-base text-green-600">
                                  {event.travelPackage.estimatedCost}
                                </span>
                              </div>
                            </div>
                          )}

                          <button 
                            onClick={() => {
                              const eventDate = new Date(event.date);
                              const start = new Date(eventDate);
                              start.setDate(start.getDate() - 2);
                              const end = new Date(eventDate);
                              end.setDate(end.getDate() + 2);
                              
                              setStartDate(start);
                              setEndDate(end);
                              setDays(5);
                              setSearchQuery(event.location.city);
                              setShowRefinement(true);
                            }}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                          >
                            <Calendar size={18} />
                            Plan Trip Around This Event
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-gray-500">
                      <Trophy className="mx-auto mb-4 text-gray-300" size={48} />
                      <p className="font-semibold text-lg text-gray-900 mb-2">No Major Events Found</p>
                      <p className="text-sm">Try searching cities for major sporting events</p>
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

      <Footer />
      
      {/* Floating Trip Button */}
      {totalSavedItems > 0 && (
        <button 
          onClick={() => setShowTripSummary(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 transition-transform"
        >
          <Calendar className="text-white" size={22} />
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center">
            {totalSavedItems}
          </span>
        </button>
      )}

      {/* Floating Feedback Button */}
      {itineraryData && (
        <button
          onClick={() => setShowFeedback(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-green-600 rounded-full shadow-2xl flex items-center justify-center z-40 hover:scale-110 transition-transform"
          title="Rate your trip"
        >
          <Star className="text-white" size={22} />
        </button>
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

      {/* Gladys AI Companion */}
      <GladysAICompanion currentDestination={firstDestination || "Paris"} />

      {/* Event Notification Toast */}
      <EventNotificationToast userLocation={origin} />
    </main>
  );
}