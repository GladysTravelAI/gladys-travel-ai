"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Mic, MicOff, Calendar, MapPin, Trophy, Music, Sparkles, ArrowRight, Globe2, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Components
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GladysAICompanion from '@/components/GladysAICompanion';
import { useAuth } from "@/lib/AuthContext";
import { eventService } from "@/lib/eventService";
import { getFeaturedEvents } from "@/lib/event-data";

// shadcn/ui
import { Button } from "@/components/ui/button";

interface Event {
  id: string;
  name: string;
  type: 'sports' | 'music' | 'festival';
  startDate: string;
  venue: {
    city: string;
    country: string;
  };
  image?: string;
  priceRange?: {
    min: number;
    currency: string;
  };
  source: 'featured' | 'live';
}

export default function HomeClient() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Event[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [showAIChat, setShowAIChat] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Load featured events on mount
  useEffect(() => {
    const featured = getFeaturedEvents().map(e => ({
      id: e.id,
      name: e.name,
      type: e.type,
      startDate: e.startDate,
      venue: e.venue,
      image: e.thumbnail,
      priceRange: {
        min: e.estimatedTicketPrice.min,
        currency: e.estimatedTicketPrice.currency
      },
      source: 'featured' as const
    }));
    setFeaturedEvents(featured);
  }, []);

  // Voice input
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
      setIsListening(false);
    };

    if (isListening) recognition.stop(); 
    else recognition.start();
  };

  // Search handler - combines featured + live events
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Search live events via API
      const liveEvents = await eventService.universalSearch(searchQuery);
      
      // Filter featured events that match
      const matchedFeatured = featuredEvents.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.venue.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      // Map live events to our format
      const mappedLive: Event[] = liveEvents.slice(0, 10).map(e => ({
        id: e.id,
        name: e.name,
        type: e.type === 'sports' ? 'sports' : e.type === 'music' ? 'music' : 'festival',
        startDate: e.startDate,
        venue: {
          city: e.venue?.city || 'TBD',
          country: e.venue?.country || 'TBD'
        },
        image: e.image,
        priceRange: e.priceRange?.min ? {
          min: e.priceRange.min,
          currency: e.priceRange.currency
        } : undefined,
        source: 'live' as const
      }));
      
      // Combine: Featured first, then live
      setSearchResults([...matchedFeatured, ...mappedLive]);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowAIChat(true);
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      {/* HERO - Ultra Clean */}
      <section className="pt-32 pb-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          
          {/* Main Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight tracking-tight"
          >
            {userProfile?.name ? `Welcome back, ${userProfile.name.split(' ')[0]}!` : 'Follow Your Team'}
            <br/>
            {userProfile?.name ? 'Where to next?' : 'Across North America'}
          </motion.h1>
          
          {/* Subheadline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {userProfile ? (
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  <Star size={14} className="fill-current" />
                  {userProfile.status}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{userProfile.totalTripsPlanned} trips planned</span>
              </div>
            ) : (
              <>
                <p className="text-xl text-gray-600 mb-4 font-normal">
                  World Cup 2026 • June-July
                </p>
                
                <p className="text-lg text-gray-500 mb-12">
                  48 teams. 16 cities. AI plans everything.
                </p>
              </>
            )}
          </motion.div>
          
          {/* Single Search Input */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-xl mx-auto mb-4"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search team, artist, or event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-12 pr-12 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:border-blue-500 focus:outline-none transition-colors"
              />
              <button 
                onClick={toggleVoiceInput}
                className={`absolute right-2 top-2 p-2 rounded-xl transition-colors ${
                  isListening ? 'bg-red-500 text-white' : 'hover:bg-gray-100'
                }`}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} className="text-gray-400" />}
              </button>
            </div>
          </motion.div>
          
          {/* Single CTA */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={handleSearch}
            disabled={isSearching}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-2xl transition-colors shadow-lg disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Find Events →'}
          </motion.button>
          
          {/* Minimal Social Proof */}
          <p className="text-sm text-gray-400 mt-6">
            1,247 fans planning their trip
          </p>
          
        </div>
      </section>

      {/* SEARCH RESULTS */}
      {searchResults.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Found {searchResults.length} Events
            </h2>
            <p className="text-gray-600 mb-8">
              Click any event to start planning your trip
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              {searchResults.map((event, idx) => (
                <motion.div
                  key={`${event.id}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleEventClick(event)}
                  className="bg-white rounded-3xl overflow-hidden border border-gray-200 hover:border-gray-300 transition-all hover:shadow-xl cursor-pointer"
                >
                  {/* Image */}
                  <div className="aspect-[4/3] relative bg-gray-100">
                    {event.image ? (
                      <img 
                        src={event.image} 
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {event.type === 'sports' ? <Trophy size={48} className="text-gray-300" /> :
                         event.type === 'music' ? <Music size={48} className="text-gray-300" /> :
                         <Sparkles size={48} className="text-gray-300" />}
                      </div>
                    )}
                    
                    {/* Source badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        event.source === 'featured' 
                          ? 'bg-purple-100 text-purple-600' 
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {event.source === 'featured' ? '⭐ Featured' : '🔴 Live'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold capitalize">
                        {event.type}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {event.name}
                    </h3>
                    
                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      <p className="flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(event.startDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin size={14} />
                        {event.venue.city}, {event.venue.country}
                      </p>
                      {event.priceRange && (
                        <p className="font-semibold text-gray-900">
                          From {event.priceRange.currency} ${event.priceRange.min.toLocaleString()}
                        </p>
                      )}
                    </div>
                    
                    <button className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition-colors">
                      Plan My Trip →
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FEATURED EVENTS - Clean Light Cards (Only show if no search) */}
      {searchResults.length === 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Major Events
            </h2>
            <p className="text-gray-600 mb-8">
              Plan your trip around these experiences
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              {featuredEvents.slice(0, 6).map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => handleEventClick(event)}
                  className="bg-white rounded-3xl overflow-hidden border border-gray-200 hover:border-gray-300 transition-all hover:shadow-xl cursor-pointer"
                >
                  <div className="aspect-[4/3] relative bg-gray-100">
                    {event.image ? (
                      <img 
                        src={event.image} 
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Trophy size={48} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold capitalize">
                        {event.type}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {event.name}
                    </h3>
                    
                    <div className="space-y-1 text-sm text-gray-600 mb-4">
                      <p className="flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(event.startDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin size={14} />
                        {event.venue.city}
                      </p>
                      {event.priceRange && (
                        <p className="font-semibold text-gray-900">
                          From ${event.priceRange.min.toLocaleString()}
                        </p>
                      )}
                    </div>
                    
                    <button className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition-colors">
                      View Details →
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <button
                onClick={() => router.push('/events')}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-lg"
              >
                View All Events
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* TRENDING DESTINATIONS - Cleaner */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Trending Destinations
          </h2>
          <p className="text-gray-600 mb-8">
            Explore popular places
          </p>
          
          <div className="grid md:grid-cols-4 gap-6">
            {['Paris', 'Tokyo', 'New York', 'Dubai'].map((city, idx) => (
              <motion.div
                key={city}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => { 
                  setSearchQuery(city); 
                  handleSearch();
                }}
                className="relative h-64 rounded-2xl overflow-hidden border border-gray-200 hover:border-gray-300 transition-all hover:shadow-xl cursor-pointer group"
              >
                <div className="w-full h-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
                  <Globe2 className="text-gray-300" size={48} />
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-white font-bold text-2xl">
                    {city}
                  </h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      {/* Gladys AI Companion - Now with Premium Features */}
      <GladysAICompanion 
        currentDestination={selectedEvent?.venue.city || "World Cup 2026"}
        selectedEvent={selectedEvent}
      />
    </main>
  );
}