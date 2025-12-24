"use client";

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Ticket, Filter, Search, Sparkles, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FEATURED_EVENTS, type Event } from '@/lib/event-data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const EventsHub = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSport, setSelectedSport] = useState<string>('all');

  const filteredEvents = useMemo(() => {
    return FEATURED_EVENTS.filter(event => {
      const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           event.venue.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || event.type === selectedType;
      const matchesSport = selectedSport === 'all' || event.sport === selectedSport;
      
      return matchesSearch && matchesType && matchesSport;
    });
  }, [searchQuery, selectedType, selectedSport]);

  const eventTypes = ['all', 'sports', 'music', 'festival', 'cultural'];
  const sportTypes = ['all', 'football', 'american-football', 'basketball', 'racing', 'rugby'];

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
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto font-normal">
              From world championships to music festivals. Your next unforgettable experience awaits.
            </p>

            {/* Search & Filters */}
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                <Input
                  type="text"
                  placeholder="Search events, cities, or sports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-16 pl-16 pr-6 text-lg rounded-2xl border-2 border-gray-200 focus:border-blue-500 bg-white shadow-lg"
                />
              </div>

              {/* Filter Tabs */}
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

                {/* Sport Filter (only show if sports is selected) */}
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
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Events Grid */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-blue-600" size={28} />
              <h2 className="text-3xl font-bold text-gray-900">
                {selectedType === 'all' ? 'All Events' : `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Events`}
              </h2>
            </div>
            <p className="text-gray-600 font-medium">
              {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} found
            </p>
          </div>

          {/* Events Grid */}
          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event, index) => (
                <EventCard key={event.id} event={event} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <Calendar className="text-gray-400" size={48} />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your filters or search query</p>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                  setSelectedSport('all');
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
};

// Event Card Component
const EventCard = ({ event, index }: { event: Event; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/events/${event.id}`} className="group block">
        <div className="relative h-full bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-blue-200">
          {/* Image */}
          <div className="relative h-64 overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundImage: `url(${event.thumbnail})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            
            {/* Featured Badge */}
            {event.featured && (
              <div className="absolute top-4 right-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-xs font-bold flex items-center gap-2 shadow-lg">
                <Sparkles size={14} />
                Featured
              </div>
            )}

            {/* Type Badge */}
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/20 backdrop-blur-md text-white rounded-full text-xs font-semibold border border-white/30">
              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
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
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={16} />
                <span className="text-sm font-medium">{event.venue.city}, {event.venue.country}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Ticket size={16} />
                <span className="text-sm font-medium">
                  From {event.estimatedTicketPrice.currency} ${event.estimatedTicketPrice.min.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-sm line-clamp-2">
              {event.description}
            </p>

            {/* CTA */}
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm group-hover:gap-3 transition-all">
                View Details
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default EventsHub;