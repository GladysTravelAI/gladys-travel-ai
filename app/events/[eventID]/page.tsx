"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Calendar, MapPin, Ticket, Users, Clock, Star, 
  ArrowLeft, ExternalLink, Sparkles, Hotel, Plane,
  Navigation, TrendingUp, Shield, CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getEventById, type Event } from '@/lib/event-data';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const EventDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [selectedTicket, setSelectedTicket] = useState(0);

  useEffect(() => {
    const eventId = params?.eventId as string;
    if (eventId) {
      const foundEvent = getEventById(eventId);
      setEvent(foundEvent || null);
    }
  }, [params]);

  if (!event) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Event not found</h2>
            <Button onClick={() => router.push('/events')} className="bg-blue-600 text-white">
              Back to Events
            </Button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${event.heroImage})`,
            filter: 'brightness(0.7)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        {/* Back Button */}
        <button
          onClick={() => router.push('/events')}
          className="absolute top-24 left-6 z-10 flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-all border border-white/30"
        >
          <ArrowLeft size={20} />
          <span className="font-semibold">Back to Events</span>
        </button>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {/* Event Type Badge */}
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-md rounded-full text-white font-semibold border border-white/30">
                  <Sparkles size={18} />
                  {event.type.charAt(0).toUpperCase() + event.type.slice(1)} Event
                </span>
                {event.featured && (
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-bold">
                    <Star size={18} />
                    Featured
                  </span>
                )}
              </div>

              {/* Event Title */}
              <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight max-w-4xl">
                {event.name}
              </h1>

              {/* Event Meta */}
              <div className="flex flex-wrap items-center gap-6 text-white/90 text-lg">
                <div className="flex items-center gap-2">
                  <Calendar size={24} />
                  <span className="font-medium">
                    {new Date(event.startDate).toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={24} />
                  <span className="font-medium">{event.venue.city}, {event.venue.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={24} />
                  <span className="font-medium">Capacity: {event.venue.capacity.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left Column - Event Details */}
            <div className="lg:col-span-2 space-y-12">
              
              {/* Description */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">About This Event</h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  {event.description}
                </p>
              </div>

              {/* Highlights */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Event Highlights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border-2 border-blue-100">
                      <CheckCircle className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                      <span className="text-gray-800 font-medium">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabs for Tickets, Packages, Info */}
              <div>
                <Tabs defaultValue="tickets" className="w-full">
                  <TabsList className="bg-gray-100 p-1 rounded-2xl w-full md:w-auto">
                    <TabsTrigger value="tickets" className="rounded-xl px-6 py-3 font-semibold">
                      Tickets
                    </TabsTrigger>
                    <TabsTrigger value="packages" className="rounded-xl px-6 py-3 font-semibold">
                      Travel Packages
                    </TabsTrigger>
                    <TabsTrigger value="info" className="rounded-xl px-6 py-3 font-semibold">
                      Local Info
                    </TabsTrigger>
                  </TabsList>

                  {/* Tickets Tab */}
                  <TabsContent value="tickets" className="mt-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Available Tickets</h3>
                    <div className="space-y-4">
                      {event.tickets.map((ticket, index) => (
                        <div
                          key={index}
                          className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                            selectedTicket === index
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                          onClick={() => setSelectedTicket(index)}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xl font-bold text-gray-900">{ticket.category}</h4>
                            <div className="text-right">
                              <p className="text-3xl font-bold text-blue-600">
                                {ticket.currency} ${ticket.price.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-500">per ticket</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            {ticket.perks.map((perk, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <CheckCircle size={16} className="text-green-600" />
                                <span className="text-gray-700">{perk}</span>
                              </div>
                            ))}
                          </div>

                          {ticket.available && (
                            <a
                              href={ticket.affiliateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Book on {ticket.partner}
                              <ExternalLink size={18} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Packages Tab */}
                  <TabsContent value="packages" id="packages" className="mt-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Travel Packages</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {event.packages.map((pkg, index) => (
                        <div key={index} className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-3xl border-2 border-blue-200 hover:shadow-2xl transition-all">
                          <h4 className="text-2xl font-bold text-gray-900 mb-3">{pkg.name}</h4>
                          <p className="text-gray-700 mb-4">{pkg.description}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-6">
                            {pkg.includes.flights && (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white rounded-full text-sm font-semibold">
                                <Plane size={14} /> Flights
                              </span>
                            )}
                            {pkg.includes.hotel && (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white rounded-full text-sm font-semibold">
                                <Hotel size={14} /> Hotel
                              </span>
                            )}
                            {pkg.includes.tickets && (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white rounded-full text-sm font-semibold">
                                <Ticket size={14} /> Tickets
                              </span>
                            )}
                            {pkg.includes.transfers && (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-white rounded-full text-sm font-semibold">
                                <Navigation size={14} /> Transfers
                              </span>
                            )}
                          </div>

                          <div className="mb-6">
                            <p className="text-sm text-gray-600 mb-2">Extras included:</p>
                            {pkg.includes.extras.map((extra, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                <CheckCircle size={14} className="text-green-600" />
                                {extra}
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between mb-6">
                            <div>
                              <p className="text-4xl font-bold text-blue-600">
                                ${pkg.price.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-500">{pkg.duration} days</p>
                            </div>
                          </div>

                          <a
                            href={pkg.affiliateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all"
                          >
                            Book Package on {pkg.partner}
                            <ExternalLink size={18} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Local Info Tab */}
                  <TabsContent value="info" className="mt-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Getting There & Around</h3>
                    
                    <div className="space-y-6">
                      <div className="p-6 bg-gray-50 rounded-2xl">
                        <h4 className="text-xl font-bold text-gray-900 mb-4">Venue Information</h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <MapPin className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                            <div>
                              <p className="font-semibold text-gray-900">{event.venue.name}</p>
                              <p className="text-gray-600">{event.venue.address}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Users className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                            <p className="text-gray-700">
                              <span className="font-semibold">Capacity:</span> {event.venue.capacity.toLocaleString()} attendees
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-gray-50 rounded-2xl">
                        <h4 className="text-xl font-bold text-gray-900 mb-4">Transportation</h4>
                        <div className="flex flex-wrap gap-2">
                          {event.localInfo.transportation.map((transport, i) => (
                            <span key={i} className="px-4 py-2 bg-white rounded-full text-gray-700 font-medium border border-gray-200">
                              {transport}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border-2 border-green-200">
                        <div className="flex items-center gap-3 mb-4">
                          <Hotel className="text-green-600" size={24} />
                          <h4 className="text-xl font-bold text-gray-900">Accommodation</h4>
                        </div>
                        <p className="text-gray-700">
                          <span className="font-semibold">{event.localInfo.nearbyHotels}</span> hotels within walking distance
                        </p>
                        <p className="text-gray-700">
                          Average price: <span className="font-semibold">${event.localInfo.averageHotelPrice}</span> per night
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Legal Disclaimer */}
              <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl">
                <div className="flex items-start gap-3">
                  <Shield className="text-amber-600 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Important Information</h4>
                    <p className="text-sm text-gray-700">{event.disclaimer}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Booking Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Quick Book Card */}
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-8 rounded-3xl text-white shadow-2xl">
                  <h3 className="text-2xl font-bold mb-4">Quick Book</h3>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-blue-100 text-sm mb-1">Tickets from</p>
                      <p className="text-4xl font-bold">
                        ${event.estimatedTicketPrice.min.toLocaleString()}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-blue-100 text-sm mb-1">Packages from</p>
                      <p className="text-3xl font-bold">
                        ${event.packages[0]?.price.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <a
                      href={event.tickets[0]?.affiliateUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-gray-100 transition-all"
                    >
                      <Ticket size={20} />
                      Book Tickets Now
                    </a>
                    
                    <button
                      onClick={() => document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' })}
                      className="w-full px-6 py-4 bg-white/10 backdrop-blur-md text-white rounded-xl font-bold hover:bg-white/20 transition-all border-2 border-white/30"
                    >
                      View Travel Packages
                    </button>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="bg-white p-6 rounded-2xl border-2 border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-4">Why Book With Us</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                      <p className="text-sm text-gray-700">Best price guarantee</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                      <p className="text-sm text-gray-700">24/7 customer support</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                      <p className="text-sm text-gray-700">Secure payment</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                      <p className="text-sm text-gray-700">Instant confirmation</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default EventDetailPage;