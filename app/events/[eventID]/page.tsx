
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, Calendar, MapPin, Plane, Hotel, Coffee, Utensils, Shield, Camera } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventStickyHeader from "@/components/EventStickyHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import tab components (we'll create these)
import { 
  ItineraryTab,
  StayTab,
  FlightsTab,
  AroundEventTab,
  DiningTab,
  InsuranceTab,
  PhotosTab
} from "@/components/event-tabs";
export default function EventDetailPage() {
  const params = useParams();
  const eventId = params?.id as string;
  
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("itinerary");

  // Fetch event details
  useEffect(() => {
    async function fetchEvent() {
      if (!eventId) return;

      setLoading(true);
      setError(null);

      try {
        // Try to fetch from API first
        const response = await fetch(`/api/events/${eventId}`);
        
        if (response.ok) {
          const data = await response.json();
          setEvent(data);
        } else {
          // Fallback: try to get from local storage or featured events
          const { getFeaturedEvents } = await import('@/lib/event-data');
          const featuredEvents = getFeaturedEvents();
          const foundEvent = featuredEvents.find(e => e.id === eventId);
          
          if (foundEvent) {
            setEvent(foundEvent);
          } else {
            setError('Event not found');
          }
        }
      } catch (err: any) {
        console.error('Error fetching event:', err);
        setError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [eventId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
            <p className="text-gray-600">Loading event details...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{error || 'Event not found'}</h2>
            <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
            <a
              href="/events"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
            >
              Browse All Events
            </a>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      {/* Sticky Event Header - ALWAYS VISIBLE */}
      <EventStickyHeader event={event} compact={activeTab !== "itinerary"} />

      {/* 7-Tab Navigation */}
      <div className="border-b border-gray-200 bg-white sticky top-[80px] z-30">
        <div className="max-w-7xl mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start gap-1 bg-transparent border-b-0 h-auto p-0">
              
              {/* Tab 1: Itinerary (Default) */}
              <TabsTrigger 
                value="itinerary" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-4 pt-4 gap-2"
              >
                <Calendar size={18} />
                <span className="font-semibold">Itinerary</span>
              </TabsTrigger>

              {/* Tab 2: Stay */}
              <TabsTrigger 
                value="stay" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-4 pt-4 gap-2"
              >
                <Hotel size={18} />
                <span className="font-semibold">Stay</span>
              </TabsTrigger>

              {/* Tab 3: Flights */}
              <TabsTrigger 
                value="flights" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-4 pt-4 gap-2"
              >
                <Plane size={18} />
                <span className="font-semibold">Flights</span>
              </TabsTrigger>

              {/* Tab 4: Around My Event */}
              <TabsTrigger 
                value="around" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-4 pt-4 gap-2"
              >
                <Coffee size={18} />
                <span className="font-semibold">Around My Event</span>
              </TabsTrigger>

              {/* Tab 5: Dining */}
              <TabsTrigger 
                value="dining" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-4 pt-4 gap-2"
              >
                <Utensils size={18} />
                <span className="font-semibold">Dining</span>
              </TabsTrigger>

              {/* Tab 6: Insurance */}
              <TabsTrigger 
                value="insurance" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-4 pt-4 gap-2"
              >
                <Shield size={18} />
                <span className="font-semibold">Insurance</span>
              </TabsTrigger>

              {/* Tab 7: Photos */}
              <TabsTrigger 
                value="photos" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-4 pt-4 gap-2"
              >
                <Camera size={18} />
                <span className="font-semibold">Photos</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
              
              <TabsContent value="itinerary" className="mt-0">
                <ItineraryTab event={event} />
              </TabsContent>

              <TabsContent value="stay" className="mt-0">
                <StayTab event={event} />
              </TabsContent>

              <TabsContent value="flights" className="mt-0">
                <FlightsTab event={event} />
              </TabsContent>

              <TabsContent value="around" className="mt-0">
                <AroundEventTab event={event} />
              </TabsContent>

              <TabsContent value="dining" className="mt-0">
                <DiningTab event={event} />
              </TabsContent>

              <TabsContent value="insurance" className="mt-0">
                <InsuranceTab event={event} />
              </TabsContent>

              <TabsContent value="photos" className="mt-0">
                <PhotosTab event={event} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      <Footer />
    </main>
  );
}