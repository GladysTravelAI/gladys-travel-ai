"use client";

import { useState } from "react";
import { Utensils, MapPin, Star, ExternalLink } from "lucide-react";

interface Restaurant {
  id: string | number;
  name: string;
  cuisine: string;
  rating?: number | string;
  priceLevel?: string;
  address: string;
  phone?: string;
  photo?: string;
  description?: string;
  distance?: string;
  reservationUrl?: string;
}

interface RestaurantResultsProps {
  restaurants: Restaurant[];
  destination?: string;
  onReservation?: (restaurant: Restaurant) => void;
  onSaveItem?: (restaurant: Restaurant) => void;
}

export default function RestaurantResults({ 
  restaurants, 
  destination = "your destination",
  onReservation,
  onSaveItem
}: RestaurantResultsProps) {
  const [savedRestaurants, setSavedRestaurants] = useState<Set<string | number>>(new Set());

  if (!restaurants || restaurants.length === 0) {
    return (
      <div className="text-center py-12">
        <Utensils className="mx-auto mb-4 text-gray-300" size={64} />
        <p className="text-xl font-semibold text-gray-900 mb-2">No restaurants found</p>
        <p className="text-gray-600">Try searching for a different destination</p>
      </div>
    );
  }

  const handleReservation = (restaurant: Restaurant) => {
    if (restaurant.reservationUrl) {
      window.open(restaurant.reservationUrl, '_blank');
    } else {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(restaurant.name + ' ' + destination + ' reservations')}`;
      window.open(searchUrl, '_blank');
    }
    
    if (onReservation) {
      onReservation(restaurant);
    }
  };

  const handleSave = (restaurant: Restaurant) => {
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

  const formatRating = (rating?: number | string): string => {
    if (!rating) return '0.0';
    const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
    return isNaN(numRating) ? '0.0' : numRating.toFixed(1);
  };

  return (
    <div className="space-y-6">
      
      {/* Simple Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Restaurants in {destination}
        </h2>
        <p className="text-gray-600">{restaurants.length} options</p>
      </div>

      {/* Clean Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((restaurant) => {
          const isSaved = savedRestaurants.has(restaurant.id);
          
          return (
          <div
            key={restaurant.id}
            className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all"
          >
            {/* Restaurant Image */}
            {restaurant.photo && (
              <div className="relative h-48">
                <img
                  src={restaurant.photo}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
                {restaurant.rating && (
                  <div className="absolute top-3 right-3 bg-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-sm">{formatRating(restaurant.rating)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Restaurant Info */}
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-bold text-xl text-gray-900 mb-1">
                  {restaurant.name}
                </h3>
                <p className="text-sm text-gray-600">{restaurant.cuisine}</p>
                {restaurant.priceLevel && (
                  <p className="text-sm text-gray-500 mt-1">{restaurant.priceLevel}</p>
                )}
              </div>

              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{restaurant.address}</span>
              </div>

              {restaurant.distance && (
                <p className="text-sm text-gray-500">{restaurant.distance}</p>
              )}

              {restaurant.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {restaurant.description}
                </p>
              )}

              {/* ONE Primary CTA */}
              <button
                onClick={() => handleReservation(restaurant)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                View Details
                <ExternalLink size={16} />
              </button>

              {/* Save to Trip Button */}
              {onSaveItem && (
                <button
                  onClick={() => handleSave(restaurant)}
                  className={`w-full py-2.5 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm ${
                    isSaved
                      ? 'bg-green-50 text-green-700 border-2 border-green-300'
                      : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {isSaved ? '✓ Saved to Trip' : 'Save to Trip'}
                </button>
              )}
            </div>
          </div>
          );
        })}
      </div>

      {/* Simple Tip */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Tip:</span> Book popular restaurants in advance, especially during peak travel seasons.
        </p>
      </div>
    </div>
  );
}