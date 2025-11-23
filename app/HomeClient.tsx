"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Sparkles, Search, TrendingUp, Globe, Plane, Car, MapPin, Bookmark, Shield } from "lucide-react";
import { motion } from "framer-motion";

// Components
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GladysAICompanion from '@/components/GladysAICompanion';
import HotelResults from "@/components/HotelResults";
import ItineraryView from "@/components/ItineraryView";
import RestaurantResults from "@/components/RestaurantResults";
import ActivityResults from "@/components/ActivityResults";
import FlightResults from "@/components/FlightResults";
import TransportResults from "@/components/TransportResults";
import Logo from "@/components/Logo";
import MapsDirections from "@/components/MapsDirections";
import DateRangePicker from "@/components/DateRangePicker";
import TripRefinementModal, { TripPreferences } from "@/components/TripRefinementModal";
import LocationAutoComplete from "@/components/LocationAutoComplete";
import TripPreview from "@/components/TripPreview";
import TripSummary from "@/components/TripSummary";
import AffiliateDisclosure from "@/components/AffiliateDisclosure";
import InsuranceView from "@/components/InsuranceView"; // ← NEW: Insurance Component
import { ItineraryData } from "@/lib/mock-itinerary";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  
  // Enhanced features state
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showRefinement, setShowRefinement] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [tripPreferences, setTripPreferences] = useState<TripPreferences | null>(null);

  // Insurance state - NEW
  const [estimatedTripCost, setEstimatedTripCost] = useState(2000);

  // Affiliate/Saved Items State
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

  // Handler for saving items
  const handleSaveItem = (item: any, type: 'hotel' | 'flight' | 'restaurant' | 'activity') => {
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
  };

  // Handler for removing items
  const handleRemoveItem = (type: string, id: string) => {
    setSavedItems(prev => {
      const typeKey = (type + 's') as keyof typeof prev;
      const currentItems = prev[typeKey] || [];
      return { ...prev, [typeKey]: currentItems.filter((item: SavedItem) => item.id !== id) };
    });
  };

  // Calculate total saved items
  const totalSavedItems = (savedItems.hotels?.length || 0) + 
                          (savedItems.flights?.length || 0) + 
                          (savedItems.restaurants?.length || 0) + 
                          (savedItems.activities?.length || 0);

  // ✅ FIXED: Updated to use new TripPreferences with tripType, groupType, groupSize
  const handleSearch = async (query?: string, preferences?: TripPreferences) => {
    const location = query || searchQuery;
    if (!location.trim()) return;

    const prefs = preferences || tripPreferences;

    setLoading(true);
    setError(null);
    setShowPreview(false);
    
    try {
      const [
        itineraryRes, 
        restaurantsRes, 
        hotelsRes, 
        activitiesRes, 
        imagesRes,
        flightsRes,
        transportRes
      ] = await Promise.all([
        fetch("/api/itinerary", { 
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ 
            location, 
            // ✅ FIXED: Use new TripPreferences fields
            tripType: prefs?.tripType || tripType || 'balanced',
            budget: prefs?.budget || selectedBudget,
            days: prefs?.days || days,
            origin: prefs?.origin || origin,
            groupSize: prefs?.groupSize || 1,
            groupType: prefs?.groupType || 'solo',
            optimize: true,
            startDate: startDate?.toISOString(),
            endDate: endDate?.toISOString(),
          }) 
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
      ]);

      const [
        itinerary, 
        restaurantsData, 
        hotelsData, 
        activitiesData, 
        imagesData,
        flightsData,
        transportData
      ] = await Promise.all([
        itineraryRes.json(), 
        restaurantsRes.json(), 
        hotelsRes.json(), 
        activitiesRes.json(), 
        imagesRes.json(),
        flightsRes.json(),
        transportRes.json()
      ]);

      if (!itineraryRes.ok) throw new Error("Failed to fetch itinerary");

      setItineraryData(itinerary);
      setRestaurants(restaurantsData.restaurants || []);
      setHotels(hotelsData.hotels || []);
      setActivities(activitiesData.activities || []);
      setImages(imagesData.images?.filter((url: string) => url) || []);
      setFlights(flightsData.flights || []);
      setTransport(transportData.transport || null);
      setFirstDestination(location);
      setDays(prefs?.days || days);
      
      // Calculate estimated trip cost for insurance
      const flightCost = flightsData.flights?.[0]?.price || 800;
      const hotelCost = (hotelsData.hotels?.[0]?.price || 150) * (prefs?.days || days);
      setEstimatedTripCost(flightCost + hotelCost + 500); // flights + hotels + activities buffer
      
      if (flightsData.flights?.length > 0 && hotelsData.hotels?.length > 0) {
        setShowPreview(true);
      } else {
        setActiveTab("itinerary");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to fetch travel data. Please try again.");
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
    
    if (/next\s+(week|month|weekend)/i.test(lower)) {
      const match = lower.match(/next\s+(week|month|weekend)/i);
      const start = new Date();
      const end = new Date();
      
      if (match![1] === 'weekend') {
        const daysUntil = (6 - start.getDay() + 7) % 7 || 7;
        start.setDate(start.getDate() + daysUntil);
        end.setDate(start.getDate() + 2);
      } else if (match![1] === 'week') {
        start.setDate(start.getDate() + 7);
        end.setDate(start.getDate() + 7);
      } else if (match![1] === 'month') {
        start.setMonth(start.getMonth() + 1);
        end.setDate(start.getDate() + 7);
      }
      
      setStartDate(start);
      setEndDate(end);
    }
    
    if (/luxury|luxurious|5-star|premium/i.test(transcript)) {
      setSelectedBudget('luxury');
    }
    if (/budget|cheap|affordable|economical/i.test(transcript)) {
      setSelectedBudget('budget');
    }
    if (/adventure|hiking|outdoor/i.test(transcript)) {
      setTripType('adventure');
    }
    if (/romantic|honeymoon|couples/i.test(transcript)) {
      setTripType('romantic');
    }
    if (/family|kids|children/i.test(transcript)) {
      setTripType('family-friendly');
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
    const destinationPool = [
      "Paris, France", "Tokyo, Japan", "New York, USA", "Dubai, UAE", 
      "Barcelona, Spain", "Cape Town, South Africa"
    ];

    const randomDestinations = destinationPool.sort(() => 0.5 - Math.random()).slice(0, 6).map((destination) => {
      const [city, country] = destination.split(", ");
      return { city, country, image: "" };
    });
    
    setSuggestedDestinations(randomDestinations);

    randomDestinations.forEach(async (dest, index) => {
      try {
        const res = await fetch("/api/images", { 
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ destination: dest.city }) 
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
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative">
        <Navbar />
        
        {/* Affiliate disclosure removed - can be added to footer or separate page */}
        
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent">
                Your Journey Begins
                <br />
                With Gladys
              </h1>
              
              <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                AI-powered travel planning for the modern explorer. From dream destinations to seamless experiences.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8, delay: 0.2 }} 
              className="max-w-4xl mx-auto"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-3xl rounded-3xl" />
                
                <div className="relative bg-white/95 backdrop-blur-xl rounded-3xl border border-blue-100 shadow-2xl p-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <Search className="text-white" size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">Where to next?</h2>
                      <p className="text-sm text-gray-500">✨ AI-powered travel planning</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <LocationAutoComplete
                      value={origin}
                      onChange={setOrigin}
                      label="From"
                      placeholder="Your departure city"
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        To
                      </label>
                      <div className="flex gap-3">
                        <Input 
                          placeholder="Where do you want to go? (e.g., Paris, Tokyo, Dubai)" 
                          value={searchQuery} 
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && searchQuery.trim() && setShowRefinement(true)}
                          className="flex-1 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-2xl px-6 py-6 text-lg"
                        />
                        <Button 
                          onClick={toggleVoiceInput} 
                          variant="outline"
                          className={`w-14 h-14 rounded-2xl transition-all ${
                            isListening 
                              ? 'bg-red-500 text-white border-red-500 animate-pulse' 
                              : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                          }`}
                        >
                          {isListening ? <MicOff size={20} /> : <Mic className="text-gray-600" size={20} />}
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
                      className="w-full px-8 py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-2xl text-white font-semibold shadow-lg shadow-blue-500/30 disabled:opacity-50 text-lg"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Planning Your Adventure...</span>
                        </div>
                      ) : (
                        <>
                          <Sparkles className="inline mr-2" size={20} />
                          Plan My Trip
                        </>
                      )}
                    </Button>

                    {!isListening && !loading && (
                      <div className="text-center py-2">
                        <p className="text-xs text-gray-400">
                          💡 <span className="font-medium">Try saying:</span> "Plan a 5-day luxury trip to Dubai next month"
                        </p>
                      </div>
                    )}
                    
                    {isListening && (
                      <div className="text-center py-4 bg-red-50 rounded-xl border border-red-200 animate-pulse">
                        <p className="text-sm text-red-700 font-medium">
                          🎤 Listening... Speak naturally!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ✅ FIXED: Updated modal props - onGenerate instead of onConfirm */}
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
          <section className="relative px-6 pb-16">
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

        {/* Trending Destinations */}
        <section className="relative px-6 pb-16">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
                <TrendingUp className="text-blue-600" />
                <span>Trending Destinations</span>
              </h2>
              <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">Updated Today</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {suggestedDestinations.map((destination, idx) => (
                <motion.div
                  key={`${destination.city}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  onClick={() => { setSearchQuery(destination.city); setShowRefinement(true); }}
                  className="relative h-64 overflow-hidden rounded-2xl cursor-pointer group shadow-lg border border-gray-100"
                >
                  {destination.image && <img src={destination.image} alt={destination.city} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-white font-bold text-lg">{destination.city}</div>
                    <div className="text-white/80 text-sm">{destination.country}</div>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                      <Plane className="text-white" size={18} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Results Section - ✅ ADDED Insurance Tab */}
        {(itineraryData || hotels?.length > 0 || loading) && !showPreview && (
          <section id="results-section" className="relative px-6 pb-16">
            <div className="max-w-7xl mx-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid grid-cols-9 w-full bg-white border border-gray-200 p-2 rounded-2xl shadow-sm">
                  <TabsTrigger value="itinerary" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">Itinerary</TabsTrigger>
                  <TabsTrigger value="flights" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">Flights</TabsTrigger>
                  <TabsTrigger value="hotels" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">Hotels</TabsTrigger>
                  <TabsTrigger value="restaurants" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">Dining</TabsTrigger>
                  <TabsTrigger value="activities" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">Activities</TabsTrigger>
                  <TabsTrigger value="insurance" className="rounded-xl data-[state=active]:bg-green-600 data-[state=active]:text-white">
                    <Shield size={14} className="mr-1" />
                    Insurance
                  </TabsTrigger>
                  <TabsTrigger value="transport" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">Transport</TabsTrigger>
                  <TabsTrigger value="maps" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">Maps</TabsTrigger>
                  <TabsTrigger value="photos" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white">Photos</TabsTrigger>
                </TabsList>

                <div className="bg-white rounded-3xl border border-gray-200 p-8 min-h-[500px] shadow-lg">
                  <TabsContent value="itinerary" className="mt-0">
                    {loading && (
                      <div className="space-y-4">
                        <Skeleton className="h-32 w-full bg-gray-100" />
                        <Skeleton className="h-32 w-full bg-gray-100" />
                      </div>
                    )}
                    {error && <div className="text-center py-12 text-red-600 bg-red-50 p-6 rounded-2xl">{error}</div>}
                    {itineraryData && !loading && !error && <ItineraryView data={itineraryData} />}
                    {!itineraryData && !loading && !error && (
                      <div className="text-center py-20 text-gray-500">
                        <Globe className="mx-auto mb-4 text-blue-400" size={64} />
                        <p className="text-2xl mb-2 text-gray-700">Ready to explore?</p>
                        <p>Enter a destination above to start planning</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="flights" className="mt-0">
                    {flights?.length > 0 ? (
                      <FlightResults flights={flights} onSaveItem={(flight) => handleSaveItem(flight, 'flight')} />
                    ) : (
                      <div className="text-center py-20 text-gray-500">
                        <Plane className="mx-auto mb-4 text-blue-400" size={64} />
                        <p className="text-2xl mb-2 text-gray-700">Find Your Flight</p>
                        <p>Search for a destination to see available flights</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="hotels" className="mt-0">
                    {hotels?.length > 0 ? (
                      <HotelResults hotels={hotels} onSaveItem={(hotel) => handleSaveItem(hotel, 'hotel')} />
                    ) : (
                      <div className="text-center py-20 text-gray-500">Search for a destination to find hotels</div>
                    )}
                  </TabsContent>

                  <TabsContent value="restaurants" className="mt-0">
                    {restaurants?.length > 0 ? (
                      <RestaurantResults restaurants={restaurants} onSaveItem={(restaurant) => handleSaveItem(restaurant, 'restaurant')} />
                    ) : (
                      <div className="text-center py-20 text-gray-500">Search for a destination to discover restaurants</div>
                    )}
                  </TabsContent>

                  <TabsContent value="activities" className="mt-0">
                    {activities?.length > 0 ? (
                      <ActivityResults activities={activities} onSaveItem={(activity) => handleSaveItem(activity, 'activity')} />
                    ) : (
                      <div className="text-center py-20 text-gray-500">Search for a destination to find activities</div>
                    )}
                  </TabsContent>

                  {/* ✅ NEW: Insurance Tab */}
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
                      <div className="text-center py-20 text-gray-500">
                        <Car className="mx-auto mb-4 text-blue-400" size={64} />
                        <p className="text-2xl mb-2 text-gray-700">Getting Around</p>
                        <p>Search for a destination to see transport options</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="maps" className="mt-0">
                    {firstDestination ? (
                      <MapsDirections destination={firstDestination} />
                    ) : (
                      <div className="text-center py-20 text-gray-500">
                        <MapPin className="mx-auto mb-4 text-blue-400" size={64} />
                        <p className="text-2xl mb-2 text-gray-700">Plan Your Route</p>
                        <p>Search for a destination to see maps and directions</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="photos" className="mt-0">
                    {images?.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {images.map((url, index) => url && (
                          <motion.img key={index} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }} 
                            src={url} alt={`View ${index + 1}`} className="w-full h-64 object-cover rounded-2xl shadow-lg hover:scale-105 transition-transform cursor-pointer border border-gray-200" />
                        ))}
                      </div>
                    ) : <div className="text-center py-20 text-gray-500">Search for a destination to view photos</div>}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </section>
        )}

        <Footer />
        
        {/* Floating "My Trip" Button */}
        {totalSavedItems > 0 && (
          <button 
            onClick={() => setShowTripSummary(true)}
            className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 transition-all group"
          >
            <Bookmark className="text-white" size={24} />
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center animate-pulse">
              {totalSavedItems}
            </span>
            <span className="absolute -top-10 right-0 bg-gray-900 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              My Trip Plan
            </span>
          </button>
        )}

        {/* Trip Summary Component */}
        <TripSummary
          isOpen={showTripSummary}
          onClose={() => setShowTripSummary(false)}
          savedItems={savedItems}
          onRemoveItem={handleRemoveItem}
          destination={firstDestination}
        />
        
        {/* AI Companion */}
        <GladysAICompanion currentDestination={firstDestination || "Paris"} />
      </div>
    </main>
  );
}