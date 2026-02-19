"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, MapPin, ArrowRight } from "lucide-react";
import { searchIntent } from "@/lib/search-intent-classifier";
import { getAllEvents, searchEventsByQuery } from "@/lib/eventService";
import ItineraryView from "@/components/ItineraryView";
import HotelResults from "@/components/HotelResults";
import RestaurantResults from "@/components/RestaurantResults";
import ActivityResults from "@/components/ActivityResults";
import { ItineraryData } from "@/lib/mock-itinerary";
import { imageSearch } from "@/lib/imageSearch";

interface SearchResult {
  id: string;
  name: string;
  startDate: string;
  venue: {
    name: string;
    city: string;
    country: string;
  };
  priceRange: {
    min: number;
    max: number;
    currency: string;
  } | null;
  url: string;
  image: string;
  description: string;
  source: string;
}

export default function SearchHandler() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'event' | 'destination' | null>(null);
  
  // Event search results
  const [eventResults, setEventResults] = useState<SearchResult[]>([]);
  
  // Destination search results
  const [itinerary, setItinerary] = useState<ItineraryData | null>(null);
  const [hotels, setHotels] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);

  // Debounced search intent detection
  useEffect(() => {
    if (!query.trim()) {
      setEventResults([]);
      setSearchType(null);
      return;
    }

    const timer = setTimeout(() => {
      // Classify search intent
      const intent = searchIntent.classify(query);
      console.log(`🔍 Search Intent:`, intent);
      
      if (intent.intent === 'event-led' || intent.intent === 'experience-led') {
        console.log(`✅ EVENT SEARCH: ${intent.entityType}`);
        setSearchType('event');
      } else {
        console.log(`📍 DESTINATION SEARCH: ${intent.entityType}`);
        setSearchType('destination');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle EVENT search
  async function handleEventSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearchType('event');

    try {
      console.log(`🎯 Searching events for: "${query}"`);
      
      // Get all events from curated data layer
      const allEvents = getAllEvents();
      
      // Search using query
      const matchedEvents = searchEventsByQuery(allEvents, query);
      
      // Map Event[] to SearchResult[]
      const results: SearchResult[] = matchedEvents.map(event => ({
        id: event.id,
        name: event.name,
        startDate: event.startDate,
        venue: {
          name: event.location.venue || '',
          city: event.location.city,
          country: event.location.country,
        },
        priceRange: event.priceRange ? {
          min: event.priceRange.min,
          max: event.priceRange.max,
          currency: event.priceRange.currency,
        } : null,
        url: event.officialUrl || '',
        image: event.heroImage || '',
        description: event.description || '',
        source: 'GladysTravelAI',
      }));
      
      console.log(`✅ Found ${results.length} events`);
      setEventResults(results);
      
      // Clear destination results
      setItinerary(null);
      setHotels([]);
      setRestaurants([]);
      setActivities([]);
      setPhotos([]);
    } catch (err) {
      console.error("❌ Error searching events:", err);
      setEventResults([]);
    } finally {
      setLoading(false);
    }
  }

  // Handle DESTINATION search (legacy)
  async function handleDestinationSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearchType('destination');

    try {
      console.log(`📍 Searching destination: "${query}"`);
      
      // Run all API requests in parallel
      const [itineraryRes, hotelsRes, restaurantsRes, activitiesRes, photosData] =
        await Promise.all([
          fetch("/api/itinerary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ location: query, days: 5 }),
          }),
          fetch("/api/hotels", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ location: query }),
          }),
          fetch("/api/restaurants", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ location: query }),
          }),
          fetch("/api/activities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ location: query }),
          }),
          imageSearch(query),
        ]);

      const [itineraryData, hotelsData, restaurantsData, activitiesData] =
        await Promise.all([
          itineraryRes.json(),
          hotelsRes.json(),
          restaurantsRes.json(),
          activitiesRes.json(),
        ]);

      setItinerary(itineraryData);
      setHotels(hotelsData.hotels || []);
      setRestaurants(restaurantsData.restaurants || []);
      setActivities(activitiesData.activities || []);
      setPhotos(photosData || []);
      
      // Clear event results
      setEventResults([]);
      
      console.log(`✅ Loaded destination data for "${query}"`);
    } catch (err) {
      console.error("❌ Error fetching destination data:", err);
    } finally {
      setLoading(false);
    }
  }

  // Smart search that auto-detects intent
  async function handleSmartSearch() {
    if (!query.trim()) return;

    // Classify intent
    const intent = searchIntent.classify(query);
    
    if (intent.intent === 'event-led' || intent.intent === 'experience-led') {
      // User is searching for events
      await handleEventSearch();
    } else {
      // User is searching for destination
      await handleDestinationSearch();
    }
  }

  // Navigate to event detail page
  function navigateToEvent(eventId: string) {
    router.push(`/events/${eventId}`);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Search Bar with Intent Indicator */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search events or destinations: Lakers, Taylor Swift, Paris..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSmartSearch()}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none"
            />
            
            {/* Search Type Indicator */}
            {searchType && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  searchType === 'event' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {searchType === 'event' ? '🎟️ Event Search' : '📍 Destination'}
                </span>
              </div>
            )}
          </div>
          
          <button
            onClick={handleSmartSearch}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 font-semibold flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Searching...
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>

        {/* Manual Override Buttons */}
        {query.trim() && (
          <div className="flex gap-2 items-center justify-center">
            <span className="text-sm text-gray-500">Search as:</span>
            <button
              onClick={handleEventSearch}
              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-semibold"
            >
              🎟️ Event
            </button>
            <button
              onClick={handleDestinationSearch}
              className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-semibold"
            >
              📍 Destination
            </button>
          </div>
        )}
      </div>

      {/* EVENT RESULTS */}
      {searchType === 'event' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              🎟️ Events matching "{query}"
            </h2>
            <span className="text-gray-600">
              {eventResults.length} {eventResults.length === 1 ? 'event' : 'events'} found
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
          ) : eventResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventResults.map((event) => (
                <EventCard 
                  key={event.id} 
                  event={event}
                  onClick={() => navigateToEvent(event.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No events found for "{query}"</p>
              <button
                onClick={handleDestinationSearch}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Try searching as a destination instead →
              </button>
            </div>
          )}
        </div>
      )}

      {/* DESTINATION RESULTS */}
      {searchType === 'destination' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">
            📍 Travel to {query}
          </h2>

          {loading && <p className="text-gray-600">Loading travel data...</p>}

          {itinerary && <ItineraryView data={itinerary} />}
          {hotels.length > 0 && <HotelResults hotels={hotels} />}
          {restaurants.length > 0 && <RestaurantResults restaurants={restaurants} />}
          {activities.length > 0 && <ActivityResults activities={activities} />}

          {/* Photos */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo, i) => (
                <img
                  key={i}
                  src={photo.url}
                  alt={photo.alt || "Destination"}
                  className="rounded-xl shadow-md object-cover w-full h-48"
                />
              ))}
            </div>
          )}

          {/* Google Maps */}
          {query && (
            <iframe
              className="w-full h-64 rounded-2xl mt-4"
              src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Event Card Component
function EventCard({ event, onClick }: { event: SearchResult; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer border-2 border-gray-100 hover:border-blue-200"
    >
      {/* Event Image */}
      <div className="relative h-48">
        <img
          src={event.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'}
          alt={event.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Live Badge */}
        <div className="absolute top-3 right-3 px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold flex items-center gap-1">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          LIVE
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <h3 className="text-xl font-bold text-gray-900 line-clamp-2">
          {event.name}
        </h3>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Calendar size={16} />
            <span>
              {new Date(event.startDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <MapPin size={16} />
            <span>{event.venue.city}, {event.venue.country}</span>
          </div>
          
          {event.priceRange && (
            <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold">
              From {event.priceRange.currency} ${event.priceRange.min.toLocaleString()}
            </div>
          )}
        </div>

        {/* Source */}
        <div className="pt-2">
          <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
            via {event.source}
          </span>
        </div>

        {/* CTA */}
        <div className="pt-2">
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm group">
            Plan My Trip
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}