"use client";

import { useState } from "react";
import { Plane, Clock, Calendar, MapPin, ExternalLink, TrendingUp, Bookmark, BookmarkCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: string;
  stops: number;
  departureAirport: string;
  arrivalAirport: string;
  cabinClass?: string;
  bookingUrl?: string;
  partner?: string;
}

interface FlightResultsProps {
  flights: Flight[];
  onSaveItem?: (flight: Flight) => void; // NEW: Optional callback for saving
}

// Affiliate tracking
const trackFlightClick = async (flight: Flight) => {
  try {
    await fetch('/api/analytics/affiliate-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'flight',
        itemId: flight.id,
        itemName: `${flight.airline} ${flight.flightNumber}`,
        partner: flight.partner || 'Skyscanner',
        estimatedValue: parseFloat(flight.price.replace(/[^0-9.]/g, '')),
        estimatedCommission: parseFloat(flight.price.replace(/[^0-9.]/g, '')) * 0.02,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Failed to track flight click:', error);
  }
};

export default function FlightResults({ flights, onSaveItem }: FlightResultsProps) {
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [savedFlights, setSavedFlights] = useState<Set<string>>(new Set());

  if (!flights || flights.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Plane className="mx-auto mb-4 text-gray-400" size={64} />
        <p className="text-xl font-semibold mb-2">No flights found</p>
        <p className="text-sm">Try adjusting your search criteria</p>
      </div>
    );
  }

  const handleBookFlight = (flight: Flight) => {
    setSelectedFlight(flight.id);
    trackFlightClick(flight);
    
    if (flight.bookingUrl) {
      window.open(flight.bookingUrl, '_blank');
    } else {
      const searchUrl = `https://www.skyscanner.com/transport/flights/${flight.departureAirport}/${flight.arrivalAirport}`;
      window.open(searchUrl, '_blank');
    }
  };

  const handleSaveFlight = (flight: Flight) => {
    const newSaved = new Set(savedFlights);
    if (newSaved.has(flight.id)) {
      newSaved.delete(flight.id);
    } else {
      newSaved.add(flight.id);
      if (onSaveItem) {
        onSaveItem(flight);
      }
    }
    setSavedFlights(newSaved);
  };

  const cheapestFlight = flights.reduce((min, flight) => {
    const price = parseFloat(flight.price.replace(/[^0-9.]/g, ''));
    const minPrice = parseFloat(min.price.replace(/[^0-9.]/g, ''));
    return price < minPrice ? flight : min;
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Plane className="text-blue-500" />
            Available Flights
          </h2>
          <p className="text-gray-600">{flights.length} flights found</p>
        </div>
        <Badge variant="outline" className="border-blue-300 text-blue-700">
          Powered by Skyscanner
        </Badge>
      </div>

      {/* Best Deal Banner */}
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-green-600" size={20} />
          <span className="text-sm text-green-800">
            <strong>Best Deal:</strong> {cheapestFlight.airline} - {cheapestFlight.price}
          </span>
        </div>
        <Badge className="bg-green-500">
          Cheapest Option
        </Badge>
      </div>

      {/* Flights Grid */}
      <div className="grid grid-cols-1 gap-4">
        {flights.map((flight) => {
          const isCheapest = flight.id === cheapestFlight.id;
          const isSelected = selectedFlight === flight.id;
          const isSaved = savedFlights.has(flight.id);

          return (
            <Card
              key={flight.id}
              className={`overflow-hidden hover:shadow-xl transition-all duration-300 border-2 ${
                isCheapest ? 'border-green-500 bg-green-50' : isSelected ? 'border-blue-500 shadow-lg' : 'hover:border-blue-300'
              }`}
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  
                  {/* Flight Info */}
                  <div className="flex-1 space-y-3">
                    {/* Airline & Flight Number */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Plane className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{flight.airline}</h3>
                        <p className="text-sm text-gray-600">{flight.flightNumber}</p>
                      </div>
                      {isCheapest && (
                        <Badge className="bg-green-500 ml-2">Best Price</Badge>
                      )}
                    </div>

                    {/* Route & Times */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-500" />
                        <span className="font-semibold text-gray-900">{flight.departureAirport}</span>
                        <span className="text-xl text-gray-400">→</span>
                        <span className="font-semibold text-gray-900">{flight.arrivalAirport}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>Departs: {flight.departureTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>Arrives: {flight.arrivalTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>Duration: {flight.duration}</span>
                      </div>
                    </div>

                    {/* Stops & Class */}
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="text-xs">
                        {flight.stops === 0 ? 'Direct Flight' : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}
                      </Badge>
                      {flight.cabinClass && (
                        <Badge variant="outline" className="text-xs">
                          {flight.cabinClass}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Price & Actions */}
                  <div className="flex flex-col items-end gap-3 min-w-[200px]">
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-700">{flight.price}</p>
                      <p className="text-xs text-gray-500">per person</p>
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                      <Button
                        onClick={() => handleBookFlight(flight)}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                      >
                        <ExternalLink size={16} className="mr-2" />
                        Book Now
                      </Button>

                      {onSaveItem && (
                        <Button
                          onClick={() => handleSaveFlight(flight)}
                          variant="outline"
                          className={`w-full ${isSaved ? 'bg-purple-50 border-purple-300' : ''}`}
                        >
                          {isSaved ? (
                            <>
                              <BookmarkCheck size={16} className="mr-2 text-purple-600" />
                              Saved to Trip
                            </>
                          ) : (
                            <>
                              <Bookmark size={16} className="mr-2" />
                              Save to Trip
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                      💡 We earn a small commission
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Selected Flight Info */}
      {selectedFlight && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-800">
            ✈️ Complete your booking on the airline's website to secure your flight!
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <h4 className="font-semibold text-gray-900 mb-2">✈️ Flight Booking Tips:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Book 2-3 months in advance for best prices</li>
          <li>• Tuesday and Wednesday flights are often cheaper</li>
          <li>• Consider nearby airports for better deals</li>
          <li>• Check baggage policies before booking</li>
        </ul>
      </div>
    </div>
  );
}