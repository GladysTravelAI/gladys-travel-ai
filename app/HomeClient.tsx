"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, ArrowRight, Calendar, Shield, Search, Sparkles, Ticket, Clock, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

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
import TripRefinementModal, { TripPreferences } from "@/components/TripRefinementModal";
import TripPreview from "@/components/TripPreview";
import TripSummary from "@/components/TripSummary";
import FeedbackModal from "@/components/FeedbackModal";
import { ItineraryData } from "@/lib/mock-itinerary";
import { profileManager } from "@/lib/userProfile";
import { useAuth } from "@/lib/AuthContext";
import { fetchLiveEvents } from "@/lib/eventService";
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
  
  // State management
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

  // Handlers
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

      const liveEventsPromise = fetchLiveEvents(10).catch(() => []);

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
    };

    if (isListening) recognition.stop(); 
    else recognition.start();
  };

  useEffect(() => {
    const featured = getFeaturedEvents().slice(0, 3);
    setFeaturedEvents(featured);

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
      
      {/* HERO SECTION - Ultra Clean, Apple-style */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-32">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 via-white to-white -z-10" />
        
        <div className="max-w-4xl mx-auto text-center w-full space-y-12">
          
          {/* Headline - Bold & Clear */}
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

          {/* Search Box - PRIMARY CTA */}
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

            {/* Date inputs - Only show if search has been initiated */}
            {searchQuery && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3 mt-4"
              >
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
              </motion.div>
            )}

            <button 
              onClick={() => searchQuery.trim() && handleSearch()} 
              disabled={!searchQuery.trim() || loading}
              className="w-full h-16 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-3xl text-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search Events'}
            </button>
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

      {/* FEATURED EVENT - Just ONE, No Carousel */}
      <EventsBanner />

      {/* HOW IT WORKS - Simple 3-Step */}
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

      {/* TRUST SIGNALS - Authentic, Not Fake */}
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

      {/* Results Section */}
      {(itineraryData || hotels?.length > 0 || loading) && !showPreview && (
        <section id="results-section" className="px-4 py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <div className="overflow-x-auto scrollbar-hide">
                <TabsList className="inline-flex bg-white border border-gray-200 p-1.5 rounded-2xl shadow-sm min-w-max">
                  <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                  <TabsTrigger value="events">Events</TabsTrigger>
                  <TabsTrigger value="flights">Flights</TabsTrigger>
                  <TabsTrigger value="hotels">Hotels</TabsTrigger>
                  <TabsTrigger value="restaurants">Dining</TabsTrigger>
                  <TabsTrigger value="activities">Activities</TabsTrigger>
                </TabsList>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 p-8 min-h-[400px]">
                <TabsContent value="itinerary">
                  {itineraryData && <ItineraryView data={itineraryData} />}
                </TabsContent>
                <TabsContent value="events">
                  {liveEvents.length > 0 && (
                    <div className="space-y-4">
                      {liveEvents.map((event, i) => (
                        <div key={i} className="p-6 border-2 border-gray-100 rounded-2xl hover:border-blue-200 transition-all">
                          <h4 className="font-bold text-lg mb-2">{event.name}</h4>
                          <p className="text-gray-600 text-sm">{new Date(event.startDate).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="flights">
                  {flights?.length > 0 && <FlightResults flights={flights} onSaveItem={(flight) => handleSaveItem(flight, 'flight')} />}
                </TabsContent>
                <TabsContent value="hotels">
                  {hotels?.length > 0 && <HotelResults hotels={hotels} onSaveItem={(hotel) => handleSaveItem(hotel, 'hotel')} />}
                </TabsContent>
                <TabsContent value="restaurants">
                  {restaurants?.length > 0 && <RestaurantResults restaurants={restaurants} onSaveItem={(restaurant) => handleSaveItem(restaurant, 'restaurant')} />}
                </TabsContent>
                <TabsContent value="activities">
                  {activities?.length > 0 && <ActivityResults activities={activities} onSaveItem={(activity) => handleSaveItem(activity, 'activity')} />}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </section>
      )}

      <Footer />
      
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
        <TripPreview
          destination={firstDestination}
          flights={flights}
          hotels={hotels}
          startDate={startDate}
          endDate={endDate}
          onViewDetails={() => {
            setShowPreview(false);
            setActiveTab("itinerary");
          }}
        />
      )}

      {totalSavedItems > 0 && (
        <button 
          onClick={() => setShowTripSummary(true)} 
          className="fixed bottom-8 right-8 w-16 h-16 bg-blue-600 rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 transition-transform"
        >
          <Calendar className="text-white" size={24} />
          <span className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center">
            {totalSavedItems}
          </span>
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