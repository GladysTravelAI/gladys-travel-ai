"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Calendar, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { FEATURED_EVENTS } from '@/lib/event-data';

interface EventNotificationToastProps {
  userLocation?: string;
  onDismiss?: () => void;
}

const EventNotificationToast = ({ userLocation, onDismiss }: EventNotificationToastProps) => {
  const [showNotification, setShowNotification] = useState(false);
  const [suggestedEvent, setSuggestedEvent] = useState<any>(null);

  useEffect(() => {
    // Check if user has dismissed notifications recently
    const dismissed = localStorage.getItem('event_notification_dismissed');
    const lastDismissed = dismissed ? parseInt(dismissed) : 0;
    const hoursSinceDismissed = (Date.now() - lastDismissed) / (1000 * 60 * 60);

    // Don't show if dismissed within last 24 hours
    if (hoursSinceDismissed < 24) return;

    // 🎯 Always prioritize 2026 tournament
    let relevantEvent = FEATURED_EVENTS.find(e => e.id === 'intl-football-2026');
    // If 2026 tournament already passed, fall back to other logic
    if (relevantEvent && new Date(relevantEvent.startDate) < new Date()) 

    // If no 2026, try location match
    if (!relevantEvent && userLocation) {
      relevantEvent = FEATURED_EVENTS.find(event =>
        event.venue.city.toLowerCase().includes(userLocation.toLowerCase()) ||
        event.venue.country.toLowerCase().includes(userLocation.toLowerCase())
      );
    }

    // If still no match, show next upcoming event
    if (!relevantEvent) {
      const upcomingEvents = FEATURED_EVENTS
        .filter(event => new Date(event.startDate) > new Date())
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      
      relevantEvent = upcomingEvents[0];
    }

    if (relevantEvent) {
      setSuggestedEvent(relevantEvent);
      // Show notification after 3 seconds
      setTimeout(() => setShowNotification(true), 3000);
    }
  }, [userLocation]);

  const handleDismiss = () => {
    setShowNotification(false);
    localStorage.setItem('event_notification_dismissed', Date.now().toString());
    onDismiss?.();
  };

  if (!suggestedEvent) return null;

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-24 right-6 z-40 max-w-md"
        >
          <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 p-1 rounded-2xl shadow-2xl">
            <div className="bg-white rounded-2xl p-6 relative">
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Dismiss notification"
              >
                <X size={18} className="text-gray-600" />
              </button>

              {/* Content */}
              <div className="space-y-4 pr-6">
                {/* Header */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Sparkles className="text-purple-600" size={24} />
                    <motion.div
                      className="absolute inset-0"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <Sparkles className="text-purple-400" size={24} />
                    </motion.div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Upcoming Event Alert!
                  </h3>
                </div>

                {/* Event Info */}
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    {suggestedEvent.name}
                  </h4>
                  
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Calendar size={16} />
                      <span>
                        {new Date(suggestedEvent.startDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <MapPin size={16} />
                      <span>{suggestedEvent.venue.city}, {suggestedEvent.venue.country}</span>
                    </div>
                  </div>

                  <p className="text-gray-700 text-sm line-clamp-2">
                    {suggestedEvent.description}
                  </p>
                </div>

                {/* Price Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                  <span className="text-sm text-gray-600">From</span>
                  <span className="text-lg font-bold text-green-700">
                    ${suggestedEvent.estimatedTicketPrice.min.toLocaleString()}
                  </span>
                </div>

                {/* CTA */}
                <Link
                  href={`/events/${suggestedEvent.id}`}
                  onClick={() => setShowNotification(false)}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all group"
                >
                  Plan My Trip
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Decorative gradient orb */}
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-3xl opacity-20 pointer-events-none" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EventNotificationToast;