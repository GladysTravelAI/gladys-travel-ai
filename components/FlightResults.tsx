'use client';

import { useState, useMemo } from 'react';
import {
  Plane,
  Clock,
  Calendar,
  MapPin,
  ExternalLink,
  TrendingUp,
  Bookmark,
  BookmarkCheck,
  Filter,
  SortAsc,
  X,
  Share2,
  Award,
  Zap,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ==================== TYPES ====================

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
  featured?: boolean;
}

interface FlightResultsProps {
  flights: Flight[];
  onSaveItem?: (flight: Flight) => void;
  loading?: boolean;
}

type SortOption = 'recommended' | 'price-low' | 'price-high' | 'duration' | 'departure';

// ==================== MAIN COMPONENT ====================

export default function FlightResults({
  flights,
  onSaveItem,
  loading = false,
}: FlightResultsProps) {
  const [selectedFlight, setSelectedFlight] = useState<string | null>(null);
  const [savedFlights, setSavedFlights] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [showFilters, setShowFilters] = useState(false);
  const [maxStops, setMaxStops] = useState(3);
  const [selectedCabinClass, setSelectedCabinClass] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState(5000);

  // ==================== FILTERING & SORTING ====================

  const filteredAndSortedFlights = useMemo(() => {
    let result = [...flights];

    // Filter by stops
    result = result.filter(flight => flight.stops <= maxStops);

    // Filter by cabin class
    if (selectedCabinClass) {
      result = result.filter(flight => flight.cabinClass === selectedCabinClass);
    }

    // Filter by price
    result = result.filter(flight => {
      const price = parseFloat(flight.price.replace(/[^0-9.]/g, ''));
      return price <= maxPrice;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (
            parseFloat(a.price.replace(/[^0-9.]/g, '')) -
            parseFloat(b.price.replace(/[^0-9.]/g, ''))
          );
        case 'price-high':
          return (
            parseFloat(b.price.replace(/[^0-9.]/g, '')) -
            parseFloat(a.price.replace(/[^0-9.]/g, ''))
          );
        case 'duration':
          return parseDuration(a.duration) - parseDuration(b.duration);
        case 'departure':
          return a.departureTime.localeCompare(b.departureTime);
        default:
          return 0;
      }
    });

    return result;
  }, [flights, maxStops, selectedCabinClass, maxPrice, sortBy]);

  // Get cheapest flight
  const cheapestFlight = useMemo(() => {
    return filteredAndSortedFlights.reduce((min, flight) => {
      const price = parseFloat(flight.price.replace(/[^0-9.]/g, ''));
      const minPrice = parseFloat(min.price.replace(/[^0-9.]/g, ''));
      return price < minPrice ? flight : min;
    }, filteredAndSortedFlights[0]);
  }, [filteredAndSortedFlights]);

  // Get fastest flight
  const fastestFlight = useMemo(() => {
    return filteredAndSortedFlights.reduce((min, flight) => {
      return parseDuration(flight.duration) < parseDuration(min.duration) ? flight : min;
    }, filteredAndSortedFlights[0]);
  }, [filteredAndSortedFlights]);

  // ==================== HANDLERS ====================

  const handleBookFlight = async (flight: Flight) => {
    setSelectedFlight(flight.id);
    await trackFlightClick(flight);

    toast.success('Opening booking page', {
      description: `${flight.airline} ${flight.flightNumber}`,
    });

    setTimeout(() => {
      if (flight.bookingUrl) {
        window.open(flight.bookingUrl, '_blank');
      } else {
        const searchUrl = `https://www.skyscanner.com/transport/flights/${flight.departureAirport}/${flight.arrivalAirport}`;
        window.open(searchUrl, '_blank');
      }
    }, 500);
  };

  const handleSaveFlight = (flight: Flight) => {
    const newSaved = new Set(savedFlights);
    const wasSaved = newSaved.has(flight.id);

    if (wasSaved) {
      newSaved.delete(flight.id);
      toast.success('Removed from trip', {
        description: `${flight.airline} ${flight.flightNumber}`,
      });
    } else {
      newSaved.add(flight.id);
      if (onSaveItem) {
        onSaveItem(flight);
      }
      toast.success('Saved to trip!', {
        description: `${flight.airline} ${flight.flightNumber}`,
        action: {
          label: 'View Trip',
          onClick: () => {
            window.location.href = '/trips';
          },
        },
      });
    }

    setSavedFlights(newSaved);
  };

  const handleShare = async (flight: Flight) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${flight.airline} ${flight.flightNumber}`,
          text: `${flight.departureAirport} → ${flight.arrivalAirport} • ${flight.price}`,
          url: window.location.href,
        });
        toast.success('Shared successfully!');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const clearFilters = () => {
    setMaxStops(3);
    setSelectedCabinClass(null);
    setMaxPrice(5000);
    toast.success('Filters cleared');
  };

  // ==================== RENDER ====================

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="h-10 w-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!flights || flights.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-20"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="w-24 h-24 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Plane className="text-blue-600" size={48} />
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Flights Found</h3>
        <p className="text-gray-600 mb-6">Try adjusting your search criteria or filters</p>
        <Button onClick={clearFilters} className="bg-gradient-to-r from-blue-600 to-cyan-600">
          Clear Filters
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <Plane className="text-white" size={24} />
            </div>
            Available Flights
          </h2>
          <p className="text-gray-600">
            {filteredAndSortedFlights.length} flights found
            {maxStops < 3 || selectedCabinClass ? ` (filtered from ${flights.length})` : ''}
          </p>
        </div>
        <Badge variant="outline" className="border-blue-300 text-blue-700 px-4 py-2">
          <Sparkles size={14} className="mr-1" />
          Powered by Skyscanner
        </Badge>
      </motion.div>

      {/* Best Deal Banners */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Cheapest */}
        <AnimatePresence>
          {cheapestFlight && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl flex items-center justify-between overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="text-green-600" size={24} />
                <span className="text-sm text-green-900">
                  <strong>Best Price:</strong> {cheapestFlight.airline} • {cheapestFlight.price}
                </span>
              </div>
              <Badge className="bg-green-600 text-white">Cheapest</Badge>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fastest */}
        <AnimatePresence>
          {fastestFlight && fastestFlight.id !== cheapestFlight?.id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl flex items-center justify-between overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <Zap className="text-blue-600" size={24} />
                <span className="text-sm text-blue-900">
                  <strong>Fastest:</strong> {fastestFlight.airline} • {fastestFlight.duration}
                </span>
              </div>
              <Badge className="bg-blue-600 text-white">Quickest</Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filters & Controls */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"
      >
        <div className="flex gap-2 flex-wrap">
          {/* Filter Button */}
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className={showFilters ? 'bg-blue-50 border-blue-300' : ''}
          >
            <Filter size={16} className="mr-2" />
            Filters
            {(maxStops < 3 || selectedCabinClass) && (
              <Badge className="ml-2 bg-blue-600">
                {(maxStops < 3 ? 1 : 0) + (selectedCabinClass ? 1 : 0)}
              </Badge>
            )}
          </Button>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recommended">Recommended</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="duration">Shortest Duration</option>
            <option value="departure">Earliest Departure</option>
          </select>

          {/* Clear Filters */}
          {(maxStops < 3 || selectedCabinClass) && (
            <Button onClick={clearFilters} variant="outline" size="sm">
              <X size={16} className="mr-1" />
              Clear
            </Button>
          )}
        </div>
      </motion.div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Stops */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Maximum Stops</h4>
                  <div className="space-y-2">
                    {[0, 1, 2, 3].map(stops => (
                      <button
                        key={stops}
                        onClick={() => setMaxStops(stops)}
                        className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-all ${
                          maxStops === stops
                            ? 'bg-blue-100 text-blue-700 font-semibold'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {stops === 0 ? 'Direct only' : stops === 3 ? 'Any' : `Up to ${stops} stop${stops > 1 ? 's' : ''}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cabin Class */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Cabin Class</h4>
                  <div className="space-y-2">
                    {['Economy', 'Premium Economy', 'Business', 'First'].map(cabin => (
                      <button
                        key={cabin}
                        onClick={() =>
                          setSelectedCabinClass(selectedCabinClass === cabin ? null : cabin)
                        }
                        className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-all ${
                          selectedCabinClass === cabin
                            ? 'bg-blue-100 text-blue-700 font-semibold'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {cabin}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Max Price</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">$0</span>
                      <input
                        type="range"
                        min="0"
                        max="5000"
                        step="100"
                        value={maxPrice}
                        onChange={e => setMaxPrice(parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm font-semibold">${maxPrice}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Showing flights up to ${maxPrice}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flights Grid */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredAndSortedFlights.map((flight, index) => (
            <FlightCard
              key={flight.id}
              flight={flight}
              index={index}
              isCheapest={flight.id === cheapestFlight?.id}
              isFastest={flight.id === fastestFlight?.id}
              isSelected={selectedFlight === flight.id}
              isSaved={savedFlights.has(flight.id)}
              onBook={handleBookFlight}
              onSave={handleSaveFlight}
              onShare={handleShare}
              onSaveItem={onSaveItem}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Selected Flight Info */}
      <AnimatePresence>
        {selectedFlight && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl"
          >
            <p className="text-sm text-blue-800">
              ✈️ Complete your booking on the airline's website to secure your flight!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6"
      >
        <h4 className="font-semibold text-gray-900 mb-3">✈️ Flight Booking Tips</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Book 2-3 months in advance for best prices</li>
          <li>• Tuesday and Wednesday flights are often cheaper</li>
          <li>• Consider nearby airports for better deals</li>
          <li>• Check baggage policies before booking</li>
        </ul>
      </motion.div>
    </div>
  );
}

// ==================== FLIGHT CARD COMPONENT ====================

interface FlightCardProps {
  flight: Flight;
  index: number;
  isCheapest: boolean;
  isFastest: boolean;
  isSelected: boolean;
  isSaved: boolean;
  onBook: (flight: Flight) => void;
  onSave: (flight: Flight) => void;
  onShare: (flight: Flight) => void;
  onSaveItem?: (flight: Flight) => void;
}

function FlightCard({
  flight,
  index,
  isCheapest,
  isFastest,
  isSelected,
  isSaved,
  onBook,
  onSave,
  onShare,
  onSaveItem,
}: FlightCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={`overflow-hidden hover:shadow-xl transition-all duration-300 border-2 ${
          isCheapest
            ? 'border-green-500 bg-green-50'
            : isFastest
            ? 'border-blue-500 bg-blue-50'
            : isSelected
            ? 'border-blue-500 shadow-lg'
            : 'hover:border-blue-300'
        }`}
      >
        <div className="p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Flight Info */}
            <div className="flex-1 space-y-4 w-full">
              {/* Airline & Flight Number */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Plane className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{flight.airline}</h3>
                  <p className="text-sm text-gray-600">{flight.flightNumber}</p>
                </div>
                {isCheapest && <Badge className="bg-green-600 text-white">Best Price</Badge>}
                {isFastest && !isCheapest && <Badge className="bg-blue-600 text-white">Fastest</Badge>}
              </div>

              {/* Route & Times */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{flight.departureTime}</p>
                    <p className="text-sm text-gray-600">{flight.departureAirport}</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-xs text-gray-500">{flight.duration}</p>
                    <div className="flex items-center gap-2">
                      <div className="h-px w-16 bg-gray-300"></div>
                      <Plane size={16} className="text-gray-400 rotate-90" />
                      <div className="h-px w-16 bg-gray-300"></div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{flight.arrivalTime}</p>
                    <p className="text-sm text-gray-600">{flight.arrivalAirport}</p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="flex items-center gap-4 flex-wrap">
                {flight.cabinClass && (
                  <Badge variant="outline" className="text-xs">
                    {flight.cabinClass}
                  </Badge>
                )}
                {flight.stops === 0 && (
                  <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                    Direct Flight
                  </Badge>
                )}
              </div>
            </div>

            {/* Price & Actions */}
            <div className="flex flex-col items-end gap-3 min-w-[200px] w-full lg:w-auto">
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-700">{flight.price}</p>
                <p className="text-xs text-gray-500">per person</p>
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Button
                  onClick={() => onBook(flight)}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl"
                >
                  <ExternalLink size={16} className="mr-2" />
                  Book Now
                </Button>

                <div className="flex gap-2">
                  {onSaveItem && (
                    <Button
                      onClick={() => onSave(flight)}
                      variant="outline"
                      className={`flex-1 ${isSaved ? 'bg-purple-50 border-purple-300' : ''}`}
                    >
                      {isSaved ? (
                        <>
                          <BookmarkCheck size={16} className="mr-2 text-purple-600" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Bookmark size={16} className="mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                  )}
                  <Button onClick={() => onShare(flight)} variant="outline" size="icon">
                    <Share2 size={16} />
                  </Button>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">💡 We earn a small commission</p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ==================== HELPER FUNCTIONS ====================

function parseDuration(duration: string): number {
  const hours = duration.match(/(\d+)h/);
  const minutes = duration.match(/(\d+)m/);
  return (hours ? parseInt(hours[1]) : 0) * 60 + (minutes ? parseInt(minutes[1]) : 0);
}

async function trackFlightClick(flight: Flight) {
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
        estimatedCommission: parseFloat(flight.price.replace(/[^0-9.]/g, '')) * 0.02, // 2% commission
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Failed to track flight click:', error);
  }
}