"use client";

import { useState } from "react";
import { Hotel, MapPin, Star, Wifi, Coffee, Dumbbell, ExternalLink, TrendingUp, Bookmark, BookmarkCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HotelItem {
  id: string;
  name: string;
  price: string;
  rating?: number;
  location?: string;
  image?: string;
  amenities?: string[];
  description?: string;
  bookingUrl?: string;
  partner?: string;
  pricePerNight?: string;
}

interface HotelResultsProps {
  hotels: HotelItem[];
  onSaveItem?: (hotel: HotelItem) => void; // NEW: Save functionality
}

// Affiliate tracking
const trackHotelClick = async (hotel: HotelItem) => {
  try {
    await fetch('/api/analytics/affiliate-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'hotel',
        itemId: hotel.id,
        itemName: hotel.name,
        partner: hotel.partner || 'Booking.com',
        estimatedValue: parseFloat(hotel.price.replace(/[^0-9.]/g, '')),
        estimatedCommission: parseFloat(hotel.price.replace(/[^0-9.]/g, '')) * 0.04,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Failed to track hotel click:', error);
  }
};

export default function HotelResults({ hotels, onSaveItem }: HotelResultsProps) {
  const [selectedHotel, setSelectedHotel] = useState<string | null>(null);
  const [savedHotels, setSavedHotels] = useState<Set<string>>(new Set());

  if (!hotels || hotels.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Hotel className="mx-auto mb-4 text-gray-400" size={64} />
        <p className="text-xl font-semibold mb-2">No hotels found</p>
        <p className="text-sm">Try adjusting your search criteria</p>
      </div>
    );
  }

  const handleBookHotel = (hotel: HotelItem) => {
    setSelectedHotel(hotel.id);
    trackHotelClick(hotel);
    
    if (hotel.bookingUrl) {
      window.open(hotel.bookingUrl, '_blank');
    } else {
      const searchUrl = `https://www.booking.com/search?ss=${encodeURIComponent(hotel.name)}`;
      window.open(searchUrl, '_blank');
    }
  };

  const handleSaveHotel = (hotel: HotelItem) => {
    const newSaved = new Set(savedHotels);
    if (newSaved.has(hotel.id)) {
      newSaved.delete(hotel.id);
    } else {
      newSaved.add(hotel.id);
      if (onSaveItem) {
        onSaveItem(hotel);
      }
    }
    setSavedHotels(newSaved);
  };

  const bestRatedHotel = hotels.reduce((max, hotel) => {
    const rating = hotel.rating || 0;
    const maxRating = max.rating || 0;
    return rating > maxRating ? hotel : max;
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Hotel className="text-purple-500" />
            Recommended Hotels
          </h2>
          <p className="text-gray-600">{hotels.length} properties found</p>
        </div>
        <Badge variant="outline" className="border-purple-300 text-purple-700">
          Powered by Booking.com
        </Badge>
      </div>

      {/* Best Rated Banner */}
      {bestRatedHotel.rating && bestRatedHotel.rating >= 4.5 && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-purple-600" size={20} />
            <span className="text-sm text-purple-800">
              <strong>Top Rated:</strong> {bestRatedHotel.name} - {bestRatedHotel.rating} ⭐
            </span>
          </div>
          <Badge className="bg-purple-500">
            Guest Favorite
          </Badge>
        </div>
      )}

      {/* Hotels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hotels.map((hotel) => {
          const isTopRated = hotel.id === bestRatedHotel.id && hotel.rating && hotel.rating >= 4.5;
          const isSelected = selectedHotel === hotel.id;
          const isSaved = savedHotels.has(hotel.id);

          return (
            <Card
              key={hotel.id}
              className={`overflow-hidden hover:shadow-xl transition-all duration-300 border-2 ${
                isTopRated ? 'border-purple-500 bg-purple-50' : isSelected ? 'border-purple-500 shadow-lg' : 'hover:border-purple-300'
              }`}
            >
              {/* Image */}
              {hotel.image && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={hotel.image}
                    alt={hotel.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                  {/* Rating Badge */}
                  {hotel.rating && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-white text-gray-800 font-bold shadow-lg">
                        <Star size={14} className="text-yellow-500 fill-yellow-500 mr-1" />
                        {hotel.rating.toFixed(1)}
                      </Badge>
                    </div>
                  )}
                  {/* Top Rated Badge */}
                  {isTopRated && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-purple-500 text-white shadow-lg">
                        🏆 Top Rated
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">
                  {hotel.name}
                </h3>

                {/* Location */}
                {hotel.location && (
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <MapPin size={16} className="mr-2 flex-shrink-0" />
                    <span className="line-clamp-1">{hotel.location}</span>
                  </div>
                )}

                {/* Description */}
                {hotel.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {hotel.description}
                  </p>
                )}

                {/* Amenities */}
                {hotel.amenities && hotel.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {hotel.amenities.slice(0, 3).map((amenity, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {amenity === 'WiFi' && <Wifi size={12} className="mr-1" />}
                        {amenity === 'Breakfast' && <Coffee size={12} className="mr-1" />}
                        {amenity === 'Gym' && <Dumbbell size={12} className="mr-1" />}
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b">
                  <div>
                    <span className="text-2xl font-bold text-purple-700">{hotel.price}</span>
                    {hotel.pricePerNight && (
                      <p className="text-xs text-gray-500">{hotel.pricePerNight} per night</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    via {hotel.partner || 'Booking.com'}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button
                    onClick={() => handleBookHotel(hotel)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <ExternalLink size={16} className="mr-2" />
                    Check Availability
                  </Button>

                  {onSaveItem && (
                    <Button
                      onClick={() => handleSaveHotel(hotel)}
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

                <p className="text-xs text-gray-500 text-center mt-3">
                  💡 We earn a small commission
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Selected Hotel Info */}
      {selectedHotel && (
        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <p className="text-sm text-purple-800">
            🏨 Complete your booking to secure your stay!
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <h4 className="font-semibold text-gray-900 mb-2">🏨 Hotel Booking Tips:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Book early for better rates and availability</li>
          <li>• Check cancellation policies before booking</li>
          <li>• Look for hotels near public transportation</li>
          <li>• Read recent guest reviews for honest feedback</li>
        </ul>
      </div>
    </div>
  );
}