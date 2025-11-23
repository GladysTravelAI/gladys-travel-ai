"use client";

import { useState } from "react";
import { Utensils, MapPin, Star, Clock, ExternalLink, Phone, TrendingUp, Bookmark, BookmarkCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ========================================
// AFFILIATE CONFIGURATION
// ========================================
const AFFILIATE_CONFIG = {
  dining: {
    enabled: false,
    affiliateId: 'YOUR_OPENTABLE_ID',
    commissionRate: 1.5,
    trackingEnabled: true
  }
};

// ========================================
// ANALYTICS TRACKING
// ========================================
const trackRestaurantClick = async (
  restaurantId: string,
  restaurantName: string,
  type: 'reservation' | 'directions' | 'call'
) => {
  if (typeof window === 'undefined') return;
  
  try {
    await fetch('/api/analytics/affiliate-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'dining',
        itemId: restaurantId,
        estimatedValue: 50,
        estimatedCommission: 1.5,
        action: type,
        restaurantName,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      })
    });
  } catch (error) {
    console.error('Failed to track restaurant click:', error);
  }
};

// ========================================
// INTERFACES
// ========================================
interface Restaurant {
  id: string | number;
  name: string;
  cuisine: string;
  rating?: number | string;
  priceLevel?: string;
  address: string;
  phone?: string;
  hours?: string;
  photo?: string;
  description?: string;
  distance?: string;
  features?: string[];
  reservationUrl?: string;
  menuUrl?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

interface RestaurantResultsProps {
  restaurants: Restaurant[];
  destination?: string;
  onReservation?: (restaurant: Restaurant) => void;
  onSaveItem?: (restaurant: Restaurant) => void;
}

// ========================================
// HELPER FUNCTIONS
// ========================================
const formatRating = (rating?: number | string): string => {
  if (!rating) return '0.0';
  const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  return isNaN(numRating) ? '0.0' : numRating.toFixed(1);
};

const getRatingValue = (rating?: number | string): number => {
  if (!rating) return 0;
  const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  return isNaN(numRating) ? 0 : numRating;
};

// ========================================
// COMPONENT
// ========================================
export default function RestaurantResults({ 
  restaurants, 
  destination = "Paris",
  onReservation,
  onSaveItem
}: RestaurantResultsProps) {
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | number | null>(null);
  const [savedRestaurants, setSavedRestaurants] = useState<Set<string | number>>(new Set());

  if (!restaurants || restaurants.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Utensils className="mx-auto mb-4 text-gray-400" size={64} />
        <p className="text-xl font-semibold mb-2">No restaurants found</p>
        <p className="text-sm">Try searching for a different destination</p>
      </div>
    );
  }

  const handleReservation = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant.id);
    trackRestaurantClick(restaurant.id.toString(), restaurant.name, 'reservation');

    if (AFFILIATE_CONFIG.dining.enabled && AFFILIATE_CONFIG.dining.affiliateId) {
      const openTableUrl = `https://www.opentable.com/s?covers=2&dateTime=${getDefaultDateTime()}&metroId=&restaurantName=${encodeURIComponent(restaurant.name)}&rid=${AFFILIATE_CONFIG.dining.affiliateId}`;
      window.open(openTableUrl, '_blank');
      return;
    }

    if (restaurant.reservationUrl) {
      window.open(restaurant.reservationUrl, '_blank');
      return;
    }

    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(restaurant.name + ' ' + destination + ' reservations')}`;
    window.open(searchUrl, '_blank');

    if (onReservation) {
      onReservation(restaurant);
    }
  };

  const handleDirections = (restaurant: Restaurant) => {
    trackRestaurantClick(restaurant.id.toString(), restaurant.name, 'directions');

    if (restaurant.location) {
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.location.lat},${restaurant.location.lng}`;
      window.open(googleMapsUrl, '_blank');
    } else {
      const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name + ' ' + restaurant.address)}`;
      window.open(searchUrl, '_blank');
    }
  };

  const handleCall = (restaurant: Restaurant) => {
    if (restaurant.phone) {
      trackRestaurantClick(restaurant.id.toString(), restaurant.name, 'call');
      window.location.href = `tel:${restaurant.phone}`;
    }
  };

  const handleSaveRestaurant = (restaurant: Restaurant) => {
    const newSaved = new Set(savedRestaurants);
    if (newSaved.has(restaurant.id)) {
      newSaved.delete(restaurant.id);
    } else {
      newSaved.add(restaurant.id);
      if (onSaveItem) {
        onSaveItem(restaurant);
      }
    }
    setSavedRestaurants(newSaved);
  };

  const getDefaultDateTime = () => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    date.setHours(19, 0, 0, 0);
    return date.toISOString();
  };

  const getPriceLevelSymbol = (level?: string) => {
    if (!level) return '$$';
    return level;
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Utensils className="text-orange-500" />
            Restaurants in {destination}
          </h2>
          <p className="text-gray-600">{restaurants.length} dining options found</p>
        </div>
        {AFFILIATE_CONFIG.dining.enabled && (
          <Badge variant="outline" className="border-orange-300 text-orange-700">
            Powered by OpenTable
          </Badge>
        )}
      </div>

      {/* Potential Revenue Banner */}
      {AFFILIATE_CONFIG.dining.enabled && restaurants.length > 0 && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-orange-600" size={20} />
            <span className="text-sm text-orange-800">
              Potential earnings from reservations: <strong>${(restaurants.length * 1.5).toFixed(2)}</strong>
            </span>
          </div>
          <Badge className="bg-orange-500">
            ~$1.50 per reservation
          </Badge>
        </div>
      )}

      {/* Restaurants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((restaurant) => {
          const isSelected = selectedRestaurant === restaurant.id;
          const ratingValue = getRatingValue(restaurant.rating);
          const isSaved = savedRestaurants.has(restaurant.id);

          return (
            <Card
              key={restaurant.id}
              className={`overflow-hidden hover:shadow-xl transition-all duration-300 border-2 ${
                isSelected ? 'border-orange-500 shadow-lg' : 'hover:border-orange-300'
              }`}
            >
              {/* Restaurant Image */}
              {restaurant.photo && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={restaurant.photo}
                    alt={restaurant.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                  {restaurant.rating && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-white text-gray-800 font-bold shadow-lg">
                        <Star size={14} className="text-yellow-500 fill-yellow-500 mr-1" />
                        {formatRating(restaurant.rating)}
                      </Badge>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-green-500 text-white shadow-lg">
                      {getPriceLevelSymbol(restaurant.priceLevel)}
                    </Badge>
                  </div>
                  {ratingValue >= 4.5 && (
                    <div className="absolute bottom-3 left-3">
                      <Badge className="bg-orange-500 text-white shadow-lg">
                        🔥 Popular
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Restaurant Info */}
              <div className="p-4">
                <div className="mb-3">
                  <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-1">
                    {restaurant.name}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {restaurant.cuisine}
                  </Badge>
                </div>

                <div className="flex items-start text-sm text-gray-600 mb-2">
                  <MapPin size={16} className="mr-1 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{restaurant.address}</span>
                </div>

                {restaurant.distance && (
                  <p className="text-xs text-gray-500 mb-2">📍 {restaurant.distance}</p>
                )}

                {restaurant.hours && (
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Clock size={16} className="mr-1" />
                    <span>{restaurant.hours}</span>
                  </div>
                )}

                {restaurant.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {restaurant.description}
                  </p>
                )}

                {restaurant.features && restaurant.features.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {restaurant.features.slice(0, 3).map((feature, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 pt-3 border-t">
                  <Button
                    onClick={() => handleReservation(restaurant)}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  >
                    <ExternalLink size={16} className="mr-2" />
                    Make Reservation
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleDirections(restaurant)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <MapPin size={14} className="mr-1" />
                      Directions
                    </Button>
                    {restaurant.phone && (
                      <Button
                        onClick={() => handleCall(restaurant)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <Phone size={14} className="mr-1" />
                        Call
                      </Button>
                    )}
                  </div>

                  {restaurant.menuUrl && (
                    <Button
                      onClick={() => window.open(restaurant.menuUrl, '_blank')}
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-gray-600"
                    >
                      View Menu
                    </Button>
                  )}

                  {onSaveItem && (
                    <Button
                      onClick={() => handleSaveRestaurant(restaurant)}
                      variant="outline"
                      size="sm"
                      className={`w-full text-xs ${isSaved ? 'bg-purple-50 border-purple-300' : ''}`}
                    >
                      {isSaved ? (
                        <>
                          <BookmarkCheck size={14} className="mr-1 text-purple-600" />
                          Saved to Trip
                        </>
                      ) : (
                        <>
                          <Bookmark size={14} className="mr-1" />
                          Save to Trip
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {AFFILIATE_CONFIG.dining.enabled && (
                  <p className="text-xs text-green-600 mt-2 text-center">
                    ✨ Earn $1.50 per reservation
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {selectedRestaurant && (
        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <p className="text-sm text-orange-800">
            🍽️ Ready to dine? Complete your reservation to enjoy great food!
          </p>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Dining Tips:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Reserve ahead for popular restaurants, especially during World Cup</li>
          <li>• Check if restaurants are near your stadium or hotel</li>
          <li>• Look for restaurants with outdoor seating for good weather</li>
          <li>• Many restaurants offer pre-game specials on match days</li>
        </ul>
      </div>
    </div>
  );
}