"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Calendar, MapPin, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { getAllEvents, type Event } from "@/lib/eventService";
import { getFeaturedEvents } from "@/lib/event-data";

interface EventNotificationToastProps {
  userLocation?: string;
  onDismiss?: () => void;
}

const EventNotificationToast = ({
  userLocation,
  onDismiss,
}: EventNotificationToastProps) => {
  const [showNotification, setShowNotification] = useState(false);
  const [suggestedEvent, setSuggestedEvent] = useState<Event | null>(null);

  useEffect(() => {
    async function loadSuggestedEvent() {
      try {
        const allEvents = getAllEvents();

        if (!allEvents || allEvents.length === 0) {
          const curated = getFeaturedEvents();
          if (curated.length > 0) {
            setSuggestedEvent(curated[0]);
            scheduleNotification(curated[0]);
          }
          return;
        }

        let relevantEvent: Event | null = null;

        const now = new Date();
        const upcomingEvents = allEvents.filter((event) => {
          const eventDate = new Date(event.startDate);
          return eventDate > now;
        });

        // Try location-based match
        if (userLocation && upcomingEvents.length > 0) {
          relevantEvent =
            upcomingEvents.find(
              (event) =>
                event.location.city
                  .toLowerCase()
                  .includes(userLocation.toLowerCase()) ||
                event.location.country
                  .toLowerCase()
                  .includes(userLocation.toLowerCase())
            ) || null;
        }

        // Fallback to soonest event (7+ days away)
        if (!relevantEvent && upcomingEvents.length > 0) {
          const sevenDaysFromNow = new Date();
          sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

          const futureEvents = upcomingEvents
            .filter((event) => {
              const eventDate = new Date(event.startDate);
              return eventDate >= sevenDaysFromNow;
            })
            .slice()
            .sort(
              (a, b) =>
                new Date(a.startDate).getTime() -
                new Date(b.startDate).getTime()
            );

          relevantEvent =
            futureEvents[0] ||
            upcomingEvents
              .slice()
              .sort(
                (a, b) =>
                  new Date(a.startDate).getTime() -
                  new Date(b.startDate).getTime()
              )[0];
        }

        if (!relevantEvent) {
          const curated = getFeaturedEvents();
          relevantEvent = curated[0] || null;
        }

        if (relevantEvent) {
          setSuggestedEvent(relevantEvent);
          scheduleNotification(relevantEvent);
        }
      } catch (error) {
        const curated = getFeaturedEvents();
        if (curated.length > 0) {
          setSuggestedEvent(curated[0]);
          scheduleNotification(curated[0]);
        }
      }
    }

    function scheduleNotification(event: Event) {
      const dismissalKey = `event_notification_dismissed_${event.id}`;
      const dismissed = localStorage.getItem(dismissalKey);
      const lastDismissed = dismissed ? parseInt(dismissed) : 0;
      const hoursSinceDismissed =
        (Date.now() - lastDismissed) / (1000 * 60 * 60);

      if (hoursSinceDismissed < 24) return;

      setTimeout(() => setShowNotification(true), 5000);
    }

    loadSuggestedEvent();
  }, [userLocation]);

  const handleDismiss = () => {
    setShowNotification(false);
    if (suggestedEvent) {
      const dismissalKey = `event_notification_dismissed_${suggestedEvent.id}`;
      localStorage.setItem(dismissalKey, Date.now().toString());
    }
    onDismiss?.();
  };

  const isHappeningSoon = suggestedEvent
    ? (() => {
        const eventDate = new Date(suggestedEvent.startDate);
        const now = new Date();
        const daysUntil = Math.ceil(
          (eventDate.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return daysUntil > 0 && daysUntil <= 30;
      })()
    : false;

  const ctaDetails = suggestedEvent
    ? (() => {
        const externalUrl = suggestedEvent.officialUrl;

        return {
          isExternal: !!externalUrl,
          url: externalUrl || `/events/${suggestedEvent.id}`,
          text: externalUrl ? "View Tickets" : "Plan Event Trip",
        };
      })()
    : null;

  if (!suggestedEvent || !ctaDetails) return null;

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-24 right-6 z-40 max-w-md"
        >
          <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 p-1 rounded-2xl shadow-2xl">
            <div className="bg-white rounded-2xl p-6 relative">
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Dismiss notification"
              >
                <X size={18} className="text-gray-600" />
              </button>

              <div className="space-y-4 pr-6">
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
                        ease: "easeInOut",
                      }}
                    >
                      <Sparkles
                        className="text-purple-400"
                        size={24}
                      />
                    </motion.div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      Upcoming Event Alert!
                    </h3>
                    {isHappeningSoon && (
                      <div className="flex items-center gap-1 mt-1">
                        <Zap
                          size={14}
                          className="text-orange-500"
                        />
                        <span className="text-xs font-semibold text-orange-600">
                          Happening Soon
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    {suggestedEvent.name}
                  </h4>

                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Calendar size={16} />
                      <span>
                        {new Date(
                          suggestedEvent.startDate
                        ).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <MapPin size={16} />
                      <span>
                        {suggestedEvent.location.city},{" "}
                        {suggestedEvent.location.country}
                      </span>
                    </div>
                  </div>

                  {suggestedEvent.description && (
                    <p className="text-gray-700 text-sm line-clamp-2">
                      {suggestedEvent.description}
                    </p>
                  )}
                </div>

                {suggestedEvent.priceRange?.min !== undefined &&
                  suggestedEvent.priceRange?.currency && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                      <span className="text-sm text-gray-600">
                        From
                      </span>
                      <span className="text-lg font-bold text-green-700">
                        {suggestedEvent.priceRange.currency}{" "}
                        {suggestedEvent.priceRange.min.toLocaleString()}
                      </span>
                    </div>
                  )}

                {/* CTA */}
                {ctaDetails.isExternal ? (
                  <a
                    href={ctaDetails.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      setShowNotification(false)
                    }
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all group"
                  >
                    {ctaDetails.text}
                    <ArrowRight
                      size={18}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </a>
                ) : (
                  <Link
                    href={ctaDetails.url}
                    onClick={() =>
                      setShowNotification(false)
                    }
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all group"
                  >
                    {ctaDetails.text}
                    <ArrowRight
                      size={18}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </Link>
                )}
              </div>

              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-3xl opacity-20 pointer-events-none" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EventNotificationToast;
