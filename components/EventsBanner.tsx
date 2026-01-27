"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Ticket, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { fetchLiveEvents } from '@/lib/eventService';
import { getFeaturedEvents, type Event } from '@/lib/event-data';

const EventsBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Fetch live events on component mount
    async function loadEvents() {
      try {
        console.log('🎫 Loading live events...');
        const liveEvents = await fetchLiveEvents(6); // Get 6 live upcoming events
        
        if (liveEvents && liveEvents.length > 0) {
          console.log(`✅ Loaded ${liveEvents.length} live events`);
          setEvents(liveEvents);
        } else {
          console.log('⚠️ No live events, using curated events');
          const curated = getFeaturedEvents();
          setEvents(curated);
        }
      } catch (error) {
        console.error('❌ Error loading events:', error);
        // Fallback to curated events
        const curated = getFeaturedEvents();
        setEvents(curated);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  const resetAutoplay = () => {
    if (timeoutRef.current) clearInterval(timeoutRef.current);
    if (events.length > 1) {
      timeoutRef.current = setInterval(() => {
        setDirection('next');
        setCurrentIndex((prev) => (prev + 1) % events.length);
      }, 6000);
    }
  };

  useEffect(() => {
    resetAutoplay();
    return () => {
      if (timeoutRef.current) clearInterval(timeoutRef.current);
    };
  }, [events]);

  const handlePrev = () => {
    setDirection('prev');
    setCurrentIndex((prev) => (prev === 0 ? events.length - 1 : prev - 1));
    resetAutoplay();
  };

  const handleNext = () => {
    setDirection('next');
    setCurrentIndex((prev) => (prev + 1) % events.length);
    resetAutoplay();
  };

  if (loading) {
    return (
      <section className="relative w-full py-4 md:py-8 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 md:mb-12">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Sparkles className="text-purple-600 animate-pulse" size={32} />
              <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-gray-900">
                Loading Live Events...
              </h2>
            </div>
            <p className="text-center text-xl md:text-2xl text-gray-600 font-normal">
              Fetching the latest upcoming events for you
            </p>
          </div>
          <div className="relative h-[500px] md:h-[600px] rounded-3xl overflow-hidden bg-gray-100 animate-pulse" />
        </div>
      </section>
    );
  }

  if (events.length === 0) return null;

  const currentEvent = events[currentIndex];

  const slideVariants = {
    enter: (direction: 'next' | 'prev') => ({
      x: direction === 'next' ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'next' | 'prev') => ({
      x: direction === 'next' ? -1000 : 1000,
      opacity: 0,
    }),
  };

  return (
    <section className="relative w-full py-4 md:py-8 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Apple-style heading */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Sparkles className="text-purple-600" size={32} />
            <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-gray-900">
              Plan Around Major Events
            </h2>
          </div>
          <p className="text-center text-xl md:text-2xl text-gray-600 font-normal">
            Sports. Concerts. Festivals. We handle everything.
          </p>
        </div>

        {/* Events Carousel */}
        <div
          onMouseEnter={() => timeoutRef.current && clearInterval(timeoutRef.current)}
          onMouseLeave={resetAutoplay}
          className="relative h-[500px] md:h-[600px] rounded-3xl overflow-hidden shadow-2xl"
        >
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentIndex}
              className="absolute inset-0"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
            >
              {/* Background Image with Gradient Overlay */}
              <div className="absolute inset-0">
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ 
                    backgroundImage: `url(${currentEvent.heroImage})`,
                    filter: 'brightness(0.7) saturate(1.2)'
                  }}
                />
                {/* Apple-style gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
              </div>

              {/* Content */}
              <div className="relative h-full flex items-end p-8 md:p-12">
                <div className="max-w-2xl space-y-6">
                  {/* Event Type Badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-semibold border border-white/30">
                      <Sparkles size={16} />
                      {currentEvent.type.charAt(0).toUpperCase() + currentEvent.type.slice(1)} Event
                    </span>
                  </motion.div>

                  {/* Event Title */}
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl md:text-6xl font-bold text-white leading-tight"
                  >
                    {currentEvent.name}
                  </motion.h3>

                  {/* Event Meta */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-wrap items-center gap-4 md:gap-6 text-white/90"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar size={20} />
                      <span className="text-sm md:text-base font-medium">
                        {new Date(currentEvent.startDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={20} />
                      <span className="text-sm md:text-base font-medium">
                        {currentEvent.venue.city}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ticket size={20} />
                      <span className="text-sm md:text-base font-medium">
                        From {currentEvent.estimatedTicketPrice.currency} ${currentEvent.estimatedTicketPrice.min.toLocaleString()}
                      </span>
                    </div>
                  </motion.div>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-white/90 text-base md:text-lg leading-relaxed max-w-xl"
                  >
                    {currentEvent.description.substring(0, 180)}...
                  </motion.p>

                  {/* CTA Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-wrap gap-4 pt-4"
                  >
                    {currentEvent.id.startsWith('tm-') ? (
                      // For Ticketmaster events, link directly to ticket URL
                      <a
                        href={currentEvent.tickets[0]?.affiliateUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100 transition-all shadow-xl"
                      >
                        Get Tickets
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </a>
                    ) : (
                      <Link
                        href={`/events/${currentEvent.id}`}
                        className="group flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100 transition-all shadow-xl"
                      >
                        Plan My Trip
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                    )}
                    <Link
                      href="/events"
                      className="px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-full font-semibold hover:bg-white/20 transition-all border-2 border-white/30"
                    >
                      View All Events
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons - Apple Style */}
          <button
            onClick={handlePrev}
            className="absolute top-1/2 left-4 md:left-6 -translate-y-1/2 w-11 h-11 bg-white/90 backdrop-blur-md text-gray-900 rounded-full hover:bg-white transition-all shadow-xl flex items-center justify-center z-10 group"
            aria-label="Previous event"
          >
            <ChevronLeft size={24} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={handleNext}
            className="absolute top-1/2 right-4 md:right-6 -translate-y-1/2 w-11 h-11 bg-white/90 backdrop-blur-md text-gray-900 rounded-full hover:bg-white transition-all shadow-xl flex items-center justify-center z-10 group"
            aria-label="Next event"
          >
            <ChevronRight size={24} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Progress Dots - Apple Style */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {events.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  resetAutoplay();
                }}
                className={`transition-all ${
                  idx === currentIndex
                    ? 'bg-white w-8 h-2 rounded-full'
                    : 'bg-white/50 hover:bg-white/75 w-2 h-2 rounded-full'
                }`}
                aria-label={`Go to event ${idx + 1}`}
              />
            ))}
          </div>

          {/* Event Counter */}
          <div className="absolute bottom-6 right-6 bg-black/30 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium z-10">
            {currentIndex + 1} of {events.length}
          </div>
        </div>

        {/* "See All Events" Link */}
        <div className="mt-8 text-center">
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