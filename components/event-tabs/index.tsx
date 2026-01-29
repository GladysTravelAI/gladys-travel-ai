// components/event-tabs/index.tsx
// 🎯 All 7 Event Tab Components

"use client";

import { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, DollarSign, Hotel, Plane, Coffee, Utensils, Shield, Camera, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================
// TAB 1: ITINERARY (Event-Anchored Timeline)
// ============================================

export function ItineraryTab({ event }: { event: any }) {
  const [itinerary, setItinerary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    days: 3,
    budget: 'Mid-range',
    tripType: 'balanced'
  });

  const generateItinerary = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/itinerary-event-first', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: event.name,
          eventDate: event.startDate,
          eventVenue: event.venue.name,
          eventCity: event.venue.city,
          eventType: event.type,
          days: preferences.days,
          budget: preferences.budget,
          tripType: preferences.tripType
        })
      });

      if (response.ok) {
        const data = await response.json();
        setItinerary(data);
      }
    } catch (error) {
      console.error('Failed to generate itinerary:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Event Anchor Card - ALWAYS VISIBLE */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">🎯 Your Trip Centers Around:</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Calendar className="text-white" size={32} />
          </div>
          <div>
            <h4 className="text-xl font-bold text-gray-900">{event.name}</h4>
            <p className="text-gray-600">
              {new Date(event.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {event.venue.name}
            </p>
          </div>
        </div>
      </div>

      {/* Trip Preferences */}
      {!itinerary && (
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
          <h3 className="text-xl font-bold mb-4">Plan Your Trip</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Trip Duration</label>
              <select
                value={preferences.days}
                onChange={(e) => setPreferences({ ...preferences, days: parseInt(e.target.value) })}
                className="w-full p-3 border-2 border-gray-200 rounded-xl"
              >
                <option value={3}>3 days</option>
                <option value={5}>5 days</option>
                <option value={7}>7 days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Budget</label>
              <select
                value={preferences.budget}
                onChange={(e) => setPreferences({ ...preferences, budget: e.target.value })}
                className="w-full p-3 border-2 border-gray-200 rounded-xl"
              >
                <option value="Budget">Budget ($50-100/day)</option>
                <option value="Mid-range">Mid-range ($100-250/day)</option>
                <option value="Luxury">Luxury ($250+/day)</option>
              </select>
            </div>

            <Button
              onClick={generateItinerary}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Generating Event-Anchored Itinerary...
                </>
              ) : (
                'Generate My Event Trip'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Generated Itinerary */}
      {itinerary && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
            <h3 className="text-2xl font-bold mb-4">{itinerary.overview}</h3>
            
            {itinerary.days.map((day: any, index: number) => (
              <div key={index} className="mb-6 last:mb-0">
                <div className={`p-6 rounded-xl ${day.day === itinerary.eventAnchor?.eventDay ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {day.day}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold">{day.theme}</h4>
                      <p className="text-sm text-gray-600">{day.date} • {day.city}</p>
                    </div>
                  </div>

                  {/* Event Day Highlight */}
                  {day.day === itinerary.eventAnchor?.eventDay && (
                    <div className="mb-4 p-4 bg-blue-100 rounded-xl">
                      <p className="font-bold text-blue-900">🎟️ EVENT DAY: {itinerary.eventAnchor.eventName}</p>
                      <p className="text-sm text-blue-700">All activities scheduled around your event!</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-gray-700">Morning: {day.morning.time}</p>
                      <p className="text-gray-600">{day.morning.activities}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Afternoon: {day.afternoon.time}</p>
                      <p className="text-gray-600">{day.afternoon.activities}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Evening: {day.evening.time}</p>
                      <p className="text-gray-600">{day.evening.activities}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// TAB 2: STAY (Hotels Near Venue)
// ============================================

export function StayTab({ event }: { event: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
        <h3 className="text-2xl font-bold mb-2">Hotels Near {event.venue.name}</h3>
        <p className="text-gray-600">Stay close to the action! All hotels optimized for event access.</p>
      </div>

      <div className="text-center py-12">
        <Hotel className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-600 mb-4">Hotel recommendations coming soon!</p>
        <Button className="bg-blue-600">Search Hotels</Button>
      </div>
    </div>
  );
}

// ============================================
// TAB 3: FLIGHTS (Event-Aligned)
// ============================================

export function FlightsTab({ event }: { event: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
        <h3 className="text-2xl font-bold mb-2">Flights to {event.venue.city}</h3>
        <p className="text-gray-600">Arrive before {new Date(event.startDate).toLocaleDateString()} • Depart after the event</p>
      </div>

      <div className="text-center py-12">
        <Plane className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-600 mb-4">Flight recommendations coming soon!</p>
        <Button className="bg-blue-600">Search Flights</Button>
      </div>
    </div>
  );
}

// ============================================
// TAB 4: AROUND MY EVENT (Before/After Activities)
// ============================================

export function AroundEventTab({ event }: { event: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-purple-50 rounded-2xl p-6 border-2 border-purple-200">
        <h3 className="text-2xl font-bold mb-2">Explore Around Your Event</h3>
        <p className="text-gray-600">Activities before and after {event.name}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border-2 border-gray-200">
          <h4 className="text-xl font-bold mb-3">🕒 Before the Event</h4>
          <p className="text-gray-600 mb-4">Low-energy activities near {event.venue.name}</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Nearby neighborhoods</li>
            <li>• Pre-event dining</li>
            <li>• Venue area exploration</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-2xl border-2 border-gray-200">
          <h4 className="text-xl font-bold mb-3">🌆 After the Event</h4>
          <p className="text-gray-600 mb-4">Celebrate and explore {event.venue.city}</p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Iconic experiences</li>
            <li>• Post-event celebrations</li>
            <li>• City exploration</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================
// TAB 5: DINING (Venue-Proximate Restaurants)
// ============================================

export function DiningTab({ event }: { event: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-orange-50 rounded-2xl p-6 border-2 border-orange-200">
        <h3 className="text-2xl font-bold mb-2">Dining Near {event.venue.name}</h3>
        <p className="text-gray-600">Pre-event meals and post-event celebrations</p>
      </div>

      <div className="text-center py-12">
        <Utensils className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-600 mb-4">Restaurant recommendations coming soon!</p>
        <Button className="bg-orange-600">Find Restaurants</Button>
      </div>
    </div>
  );
}

// ============================================
// TAB 6: INSURANCE (Event + Trip Insurance)
// ============================================

export function InsuranceTab({ event }: { event: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 rounded-2xl p-6 border-2 border-green-200">
        <h3 className="text-2xl font-bold mb-2">Protect Your Event Trip</h3>
        <p className="text-gray-600">Event cancellation + travel insurance</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border-2 border-gray-200">
          <Shield className="w-12 h-12 mb-4 text-blue-600" />
          <h4 className="text-xl font-bold mb-3">Event Insurance</h4>
          <ul className="space-y-2 text-sm text-gray-700 mb-4">
            <li>• Event cancellation coverage</li>
            <li>• Ticket protection</li>
            <li>• Event delay reimbursement</li>
          </ul>
          <Button variant="outline" className="w-full">Get Quote</Button>
        </div>

        <div className="bg-white p-6 rounded-2xl border-2 border-gray-200">
          <Shield className="w-12 h-12 mb-4 text-green-600" />
          <h4 className="text-xl font-bold mb-3">Trip Insurance</h4>
          <ul className="space-y-2 text-sm text-gray-700 mb-4">
            <li>• Medical coverage</li>
            <li>• Baggage protection</li>
            <li>• Travel disruption</li>
          </ul>
          <Button variant="outline" className="w-full">Get Quote</Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// TAB 7: PHOTOS (Experience-Based, Max 5)
// ============================================

export function PhotosTab({ event }: { event: any }) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch experience-based photos (no brand names)
    // Search for: "stadium concert atmosphere", "venue interior", etc.
    setTimeout(() => {
      setPhotos([
        event.heroImage || event.thumbnail,
        // Add more experience-based images
      ]);
      setLoading(false);
    }, 1000);
  }, [event]);

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 rounded-2xl p-6 border-2 border-purple-200">
        <h3 className="text-2xl font-bold mb-2">Experience the Atmosphere</h3>
        <p className="text-gray-600">What attending {event.name} looks like</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading photos...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo, index) => (
            <div key={index} className="aspect-video rounded-2xl overflow-hidden">
              <img
                src={photo}
                alt={`${event.venue.name} atmosphere ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-500 text-center">
        📸 Maximum 5 photos • Experience-based imagery • No brand logos
      </p>
    </div>
  );
}

// Export all tabs
export default {
  ItineraryTab,
  StayTab,
  FlightsTab,
  AroundEventTab,
  DiningTab,
  InsuranceTab,
  PhotosTab
};