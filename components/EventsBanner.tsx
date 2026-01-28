"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Ticket, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { fetchLiveEvents } from '@/lib/eventService';
import { getFeaturedEvents, type Event } from '@/lib/event-data';

const EventsBanner = () => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeaturedEvent() {
      try {
        // Try to get ONE live event
        const liveEvents = await fetchLiveEvents(1);
        
        if (liveEvents && liveEvents.length > 0) {
          setEvent(liveEvents[0]);
        } else {
          // Fallback to curated featured event
          const curated = getFeaturedEvents();
          setEvent(curated[0]);
        }
      } catch (error) {
        console.error('Error loading event:', error);
        // Fallback to curated
        const curated = getFeaturedEvents();
        setEvent(curated[0]);
      } finally {
        setLoading(false);
      }
    }

    loadFeaturedEvent();
  }, []);

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
          onClick={() => window.location.href = `/events/${event.id}`}
        >
          <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-2xl">
            {/* Hero Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ 
                backgroundImage: `url(${event.heroImage})`,
              }}
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

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
                    <span className="font-medium">{event.venue.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ticket size={20} />
                    <span className="font-medium">
                      From {event.estimatedTicketPrice.currency} ${event.estimatedTicketPrice.min.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                <button className="group/btn flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100 transition-all shadow-xl">
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