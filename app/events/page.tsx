"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Ticket, Filter, Search, Sparkles, TrendingUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getFeaturedEvents, type Event } from '@/lib/event-data';
import { searchEventsWithCache } from '@/lib/eventService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Type for API search results (from Ticketmaster)
interface SearchResultEvent {
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

const EventsHub = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [apiEvents, setApiEvents] = useState<SearchResultEvent[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'featured' | 'search'>('featured');

  // Featured events from our curated list
  const featuredEvents = getFeaturedEvents();

  // Search API with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setApiEvents([]);
      setActiveTab('featured');
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setActiveTab('search');
      
      try {
        const results = await searchEventsWithCache(searchQuery);
        setApiEvents(results);
      } catch (error) {
        console.error('Search error:', error);
        setApiEvents([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter featured events
  const filteredFeaturedEvents = useMemo(() => {
    return featuredEvents.filter(event => {
      const matchesType = selectedType === 'all' || event.type === selectedType;
      const matchesSport = selectedSport === 'all' || event.sport === selectedSport;
      return matchesType && matchesSport;
    });
  }, [selectedType, selectedSport, featuredEvents]);

  // Display events based on active tab
  const displayEvents = activeTab === 'featured' ? filteredFeaturedEvents : apiEvents;

  const eventTypes = ['all', 'sports', 'music', 'festival', 'cultural'];
  const sportTypes = ['all', 'football', 'american-football', 'basketball', 'baseball', 'tennis', 'racing', 'rugby', 'hockey', 'golf'];

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section - Apple Style */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 rounded-full blur-3xl opacity-30 animate-pulse-slow" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 rounded-full blur-3xl opacity-30 animate-pulse-slower" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Sparkles className="text-purple-600" size={48} />
              <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-gray-900">
                Discover Events
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-4 max-w-3xl mx-auto font-normal">
              From world championships to music festivals. Your next unforgettable experience awaits.
            </p>

            {/* Live Search Badge */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="px-4 py-2 bg-green-50 border-2 border-green-200 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-green-700">Live Event Search Powered by Ticketmaster</span>
              </div>
            </div>

            {/* Search & Filters */}
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                <Input
                  type="text"
                  placeholder="Search any event worldwide: NBA, Champions League, Taylor Swift..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-16 pl-16 pr-6 text-lg rounded-2xl border-2 border-gray-200 focus:border-blue-500 bg-white shadow-lg"
                />
                {isSearching && (
                  <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-600 animate-spin" size={24} />
                )}
              </div>

              {/* Tab Selector */}
              {searchQuery && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('featured')}
                    className={`px-6 py-3 rounded-2xl font-semibold transition-all ${
                      activeTab === 'featured'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Featured ({filteredFeaturedEvents.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('search')}
                    className={`px-6 py-3 rounded-2xl font-semibold transition-all ${
                      activeTab === 'search'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Search Results ({apiEvents.length})
                  </button>
                </div>
              )}

              {/* Filter Tabs - Only show for featured */}
              {activeTab === 'featured' && (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl">
                    <Filter size={18} className="text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">Filter by:</span>
                  </div>
                  
                  {/* Type Filter */}
                  <div className="flex flex-wrap gap-2">
                    {eventTypes.map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${
                          selectedType === type
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105'
                            : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Sport Filter */}
                  {selectedType === 'sports' && (
                    <div className="flex flex-wrap gap-2">
                      {sportTypes.map(sport => (
                        <button
                          key={sport}
                          onClick={() => setSelectedSport(sport)}
                          className={`px-4 py-2 rounded-full font-medium text-xs transition-all ${
                            selectedSport === sport
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {sport === 'all' ? 'All Sports' : sport.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-blue-600" size={28} />
              <h2 className="text-3xl font-bold text-gray-900">
                {activeTab === 'featured' 
                  ? (selectedType === 'all' ? 'Featured Events' : `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Events`)
                  : 'Search Results'
                }
              </h2>
            </div>
            <p className="text-gray-600 font-medium">
              {displayEvents.length} {displayEvents.length === 1 ? 'event' : 'events'} found
            </p>
          </div>

          {/* Loading State */}
          {isSearching && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="text-blue-600 animate-spin mb-4" size={48} />
              <p className="text-gray-600 text-lg">Searching live events worldwide...</p>
            </div>
          )}

          {/* Events Grid */}
          {!isSearching && displayEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayEvents.map((event, index) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  index={index}
                  isApiEvent={activeTab === 'search'}
                />
              ))}
            </div>
          ) : !isSearching && (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <Calendar className="text-gray-400" size={48} />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                {activeTab === 'search' ? 'No events found' : 'No events match your filters'}
              </h3>
              <p className="text-gray-600 mb-6">
                {activeTab === 'search' 
                  ? 'Try searching for popular events like "NBA", "Champions League", or "Coachella"'
                  : 'Try adjusting your filters or search for specific events'
                }
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                  setSelectedSport('all');
                  setActiveTab('featured');
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
              >
                {activeTab === 'search' ? 'View Featured Events' : 'Clear Filters'}
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }

        @keyframes pulse-slower {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.1); }
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-pulse-slower {
          animation: pulse-slower 6s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
};

// Event Card Component
const EventCard = ({ event, index, isApiEvent }: { event: Event | SearchResultEvent; index: number; isApiEvent?: boolean }) => {
  // Handle different image field names
  const getImageUrl = (event: Event | SearchResultEvent): string => {
    if ('image' in event && event.image) return event.image;
    if ('thumbnail' in event && event.thumbnail) return event.thumbnail;
    if ('heroImage' in event && event.heroImage) return event.heroImage;
    return '';
  };

  const imageUrl = getImageUrl(event);
  const imageStyle = imageUrl.startsWith('linear-gradient') 
    ? { background: imageUrl }
    : { backgroundImage: `url(${imageUrl})` };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      {isApiEvent && 'url' in event && event.url ? (
        <a href={event.url} target="_blank" rel="noopener noreferrer" className="group block">
          <EventCardContent event={event} imageStyle={imageStyle} isApiEvent={isApiEvent} />
        </a>
      ) : (
        <Link href={`/events/${event.id}`} className="group block">
          <EventCardContent event={event} imageStyle={imageStyle} isApiEvent={isApiEvent} />
        </Link>
      )}
    </motion.div>
  );
};

const EventCardContent = ({ event, imageStyle, isApiEvent }: { event: Event | SearchResultEvent; imageStyle: any; isApiEvent?: boolean }) => {
  // Type-safe property access
  const eventType = 'type' in event ? event.type : 'Event';
  const isFeatured = 'featured' in event ? event.featured : false;
  const eventSource = 'source' in event ? event.source : undefined;
  const eventDescription = 'description' in event ? event.description : undefined;

  // Helper to get price info
  const getPriceInfo = (event: Event | SearchResultEvent) => {
    if ('estimatedTicketPrice' in event && event.estimatedTicketPrice) {
      return {
        currency: event.estimatedTicketPrice.currency || 'USD',
        min: event.estimatedTicketPrice.min || 0
      };
    }
    if ('priceRange' in event && event.priceRange) {
      return {
        currency: event.priceRange.currency || 'USD',
        min: event.priceRange.min || 0
      };
    }
    return null;
  };

  const priceInfo = getPriceInfo(event);

  return (
    <div className="relative h-full bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-blue-200">
      {/* Image */}
      <div className="relative h-64 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
          style={imageStyle}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        
        {/* Live Badge for API events */}
        {isApiEvent && (
          <div className="absolute top-4 right-4 px-3 py-1.5 bg-green-500 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE
          </div>
        )}

        {/* Featured Badge */}
        {isFeatured && !isApiEvent && (
          <div className="absolute top-4 right-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-xs font-bold flex items-center gap-2 shadow-lg">
            <Sparkles size={14} />
            Featured
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/20 backdrop-blur-md text-white rounded-full text-xs font-semibold border border-white/30">
          {eventType ? eventType.charAt(0).toUpperCase() + eventType.slice(1) : 'Event'}
        </div>

        {/* Event Name */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-bold text-white mb-2 line-clamp-2 group-hover:text-blue-200 transition-colors">
            {event.name}
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Meta Info */}
        <div className="space-y-2">
          {event.startDate && (
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={16} />
              <span className="text-sm font-medium">
                {new Date(event.startDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin size={16} />
            <span className="text-sm font-medium">
              {event.venue?.city || 'TBD'}, {event.venue?.country || 'TBD'}
            </span>
          </div>
          {priceInfo && (
            <div className="flex items-center gap-2 text-gray-600">
              <Ticket size={16} />
              <span className="text-sm font-medium">
                From {priceInfo.currency} ${priceInfo.min.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {eventDescription && (
          <p className="text-gray-600 text-sm line-clamp-2">
            {eventDescription}
          </p>
        )}

        {/* Source Badge */}
        {isApiEvent && eventSource && (
          <div className="pt-2">
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
              via {eventSource}
            </span>
          </div>
        )}

        {/* CTA */}
        <div className="pt-2">
          <div className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm group-hover:gap-3 transition-all">
            {isApiEvent ? 'Buy Tickets' : 'View Details'}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventsHub;