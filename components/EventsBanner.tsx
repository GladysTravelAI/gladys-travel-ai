// components/EventsBanner.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Ticket, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { getAllEvents, type Event } from '@/lib/eventService';
import { getFeaturedEvents } from '@/lib/event-data';

const EventsBanner = () => {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeaturedEvent() {
      try {
        // Get all available events
        const allEvents = getAllEvents();
        
        if (allEvents.length === 0) {
          // Fallback to curated featured events
          const curated = getFeaturedEvents();
          setEvent(curated[0] || null);
          setLoading(false);
          return;
        }

        // Filter to only upcoming events
        const now = new Date();
        const upcomingEvents = allEvents.filter(event => {
          const eventDate = new Date(event.startDate);
          return eventDate > now;
        });

        if (upcomingEvents.length === 0) {
          // No upcoming events, use curated
          const curated = getFeaturedEvents();
          setEvent(curated[0] || null);
          setLoading(false);
          return;
        }

        // Sort by date and get the soonest upcoming event
        const sortedEvents = upcomingEvents.sort((a, b) => 
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );

        setEvent(sortedEvents[0]);
      } catch (error) {
        // Fallback to curated
        const curated = getFeaturedEvents();
        setEvent(curated[0] || null);
      } finally {
        setLoading(false);
      }
    }

    loadFeaturedEvent();
  }, []);

  // Calculate if event is happening soon (within 45 days)
  const urgencyInfo = event ? (() => {
    const eventDate = new Date(event.startDate);
    const now = new Date();
    const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil > 0 && daysUntil <= 45) {
      return {
        show: true,
        label: daysUntil <= 14 ? 'Coming Soon' : 'Trending Now'
      };
    }
    return { show: false, label: '' };
  })() : { show: false, label: '' };

  // Format price safely
  const formatPrice = (event: Event): string => {
    if (!event.priceRange || event.priceRange.min === undefined) {
      return 'View Pricing';
    }
    
    const currency = event.priceRange.currency || '$';
    const amount = event.priceRange.min.toLocaleString();
    
    // Avoid duplication like "$ USD $500"
    if (currency === 'USD' || currency === 'EUR' || currency === 'GBP') {
      return `From $${amount}`;
    }
    
    return `From ${currency} ${amount}`;
  };

  const handleEventClick = () => {
    if (event) {
      router.push(`/events/${event.id}`);
    }
  };

  if (loading) {
    return (
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="h-96 bg-gray-100 rounded-3xl animate-pulse" />
        </div>
      </section>
    );
  }

  if (!event) return null;

  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Simple heading */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold text-gray-900 mb-3">Featured Event</h2>
          <p className="text-xl text-gray-600">Don't miss this</p>
        </div>

        {/* ONE hero event card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="group cursor-pointer"
          onClick={handleEventClick}
          role="button"
          tabIndex={0}
          aria-label={`View details for ${event.name}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleEventClick();
            }
          }}
        >
          <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-2xl">
            {/* Hero Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ 
                backgroundImage: event.heroImage 
                  ? `url(${event.heroImage})` 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

            {/* Urgency Badge */}
            {urgencyInfo.show && (
              <div className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full font-semibold text-sm shadow-lg">
                <TrendingUp size={16} />
                {urgencyInfo.label}
              </div>
            )}

            {/* Content */}
            <div className="relative h-full flex items-end p-10">
              <div className="max-w-xl space-y-6">
                {/* Event Type Badge */}
                <span className="inline-block px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-semibold border border-white/30">
                  {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                </span>

                {/* Event Title */}
                <h3 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                  {event.name}
                </h3>

                {/* Event Meta */}
                <div className="flex flex-wrap items-center gap-6 text-white/90">
                  <div className="flex items-center gap-2">
                    <Calendar size={20} />
                    <span className="font-medium">
                      {new Date(event.startDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={20} />
                    <span className="font-medium">{event.location.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ticket size={20} />
                    <span className="font-medium">
                      {formatPrice(event)}
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                <button 
                  onClick={handleEventClick}
                  className="group/btn flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100 transition-all shadow-xl"
                  aria-label={`Plan trip to ${event.name}`}
                >
                  Plan My Trip
                  <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Secondary CTA - Text Link Only */}
        <div className="text-center mt-8">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-lg group"
          >
            View All Events
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default EventsBanner;