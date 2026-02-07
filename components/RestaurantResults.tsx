'use client';

import { useState, useMemo } from 'react';
import {
  Utensils,
  MapPin,
  Star,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Filter,
  Grid,
  List,
  Share2,
  Award,
  Navigation,
  X,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ==================== TYPES ====================

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
  reviews?: number;
  openNow?: boolean;
}

interface RestaurantResultsProps {
  restaurants: Restaurant[];
  destination?: string;
  onReservation?: (restaurant: Restaurant) => void;
  onSaveItem?: (restaurant: Restaurant) => void;
  loading?: boolean;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'recommended' | 'rating' | 'price-low' | 'price-high' | 'distance';

// ==================== MAIN COMPONENT ====================

export default function RestaurantResults({
  restaurants,
  destination = 'your destination',
  onReservation,
  onSaveItem,
  loading = false,
}: RestaurantResultsProps) {
  const [savedRestaurants, setSavedRestaurants] = useState<Set<string | number>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCuisines, setSelectedCuisines] = useState<Set<string>>(new Set());
  const [selectedPriceLevel, setSelectedPriceLevel] = useState<string | null>(null);
  const [minRating, setMinRating] = useState(0);

  // ==================== FILTERING & SORTING ====================

  const filteredAndSortedRestaurants = useMemo(() => {
    let result = [...restaurants];

    // Filter by cuisine
    if (selectedCuisines.size > 0) {
      result = result.filter(restaurant =>
        selectedCuisines.has(restaurant.cuisine)
      );
    }

    // Filter by price level
    if (selectedPriceLevel) {
      result = result.filter(restaurant => restaurant.priceLevel === selectedPriceLevel);
    }

    // Filter by rating
    if (minRating > 0) {
      result = result.filter(restaurant => {
        const rating = formatRatingNumber(restaurant.rating);
        return rating >= minRating;
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return formatRatingNumber(b.rating) - formatRatingNumber(a.rating);
        case 'price-low':
          return getPriceValue(a.priceLevel) - getPriceValue(b.priceLevel);
        case 'price-high':
          return getPriceValue(b.priceLevel) - getPriceValue(a.priceLevel);
        case 'distance':
          const aDistance = parseFloat(a.distance?.split(' ')[0] || '999');
          const bDistance = parseFloat(b.distance?.split(' ')[0] || '999');
          return aDistance - bDistance;
        default:
          return 0;
      }
    });

    return result;
  }, [restaurants, selectedCuisines, selectedPriceLevel, minRating, sortBy]);

  // Get unique cuisines
  const cuisines = useMemo(() => {
    const cuisineSet = new Set<string>();
    restaurants.forEach(restaurant => {
      if (restaurant.cuisine) cuisineSet.add(restaurant.cuisine);
    });
    return Array.from(cuisineSet);
  }, [restaurants]);

  // Top rated
  const topRatedRestaurant = useMemo(() => {
    return filteredAndSortedRestaurants.reduce((max, restaurant) => {
      const rating = formatRatingNumber(restaurant.rating);
      const maxRating = formatRatingNumber(max.rating);
      return rating > maxRating ? restaurant : max;
    }, filteredAndSortedRestaurants[0]);
  }, [filteredAndSortedRestaurants]);

  // ==================== HANDLERS ====================

  const handleReservation = async (restaurant: Restaurant) => {
    if (restaurant.reservationUrl) {
      window.open(restaurant.reservationUrl, '_blank');
    } else {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
        restaurant.name + ' ' + destination + ' reservations'
      )}`;
      window.open(searchUrl, '_blank');
    }

    await trackRestaurantClick(restaurant);

    if (onReservation) {
      onReservation(restaurant);
    }

    toast.success('Opening reservation page', {
      description: restaurant.name,
    });
  };

  const handleSave = (restaurant: Restaurant) => {
    const newSaved = new Set(savedRestaurants);
    const wasSaved = newSaved.has(restaurant.id);

    if (wasSaved) {
      newSaved.delete(restaurant.id);
      toast.success('Removed from trip', {
        description: restaurant.name,
      });
    } else {
      newSaved.add(restaurant.id);
      if (onSaveItem) {
        onSaveItem(restaurant);
      }
      toast.success('Saved to trip!', {
        description: restaurant.name,
        action: {
          label: 'View Trip',
          onClick: () => {
            window.location.href = '/trips';
          },
        },
      });
    }

    setSavedRestaurants(newSaved);
  };

  const handleShare = async (restaurant: Restaurant) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: restaurant.name,
          text: `${restaurant.cuisine} • ${restaurant.address}`,
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

  const toggleCuisine = (cuisine: string) => {
    const newCuisines = new Set(selectedCuisines);
    if (newCuisines.has(cuisine)) {
      newCuisines.delete(cuisine);
    } else {
      newCuisines.add(cuisine);
    }
    setSelectedCuisines(newCuisines);
  };

  const clearFilters = () => {
    setSelectedCuisines(new Set());
    setSelectedPriceLevel(null);
    setMinRating(0);
    toast.success('Filters cleared');
  };

  // ==================== RENDER ====================

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!restaurants || restaurants.length === 0) {
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
          className="w-24 h-24 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Utensils className="text-orange-600" size={48} />
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Restaurants Found</h3>
        <p className="text-gray-600 mb-6">Try searching for a different destination or cuisine</p>
        <Button
          onClick={clearFilters}
          className="bg-gradient-to-r from-orange-600 to-red-600"
        >
          Clear Filters
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Restaurants in {destination}
        </h2>
        <p className="text-gray-600">
          {filteredAndSortedRestaurants.length} options
          {selectedCuisines.size > 0 || selectedPriceLevel || minRating > 0
            ? ` (filtered from ${restaurants.length})`
            : ''}
        </p>
      </motion.div>

      {/* Top Rated Banner */}
      <AnimatePresence>
        {topRatedRestaurant && formatRatingNumber(topRatedRestaurant.rating) >= 4.5 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl flex items-center justify-between overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <Award className="text-orange-600" size={24} />
              <span className="text-sm text-orange-900">
                <strong>Top Rated:</strong> {topRatedRestaurant.name} •{' '}
                {formatRating(topRatedRestaurant.rating)} ⭐
              </span>
            </div>
            <Badge className="bg-orange-600 text-white">Must Try</Badge>
          </motion.div>
        )}
      </AnimatePresence>

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
            className={showFilters ? 'bg-orange-50 border-orange-300' : ''}
          >
            <Filter size={16} className="mr-2" />
            Filters
            {(selectedCuisines.size > 0 || selectedPriceLevel || minRating > 0) && (
              <Badge className="ml-2 bg-orange-600">
                {selectedCuisines.size +
                  (selectedPriceLevel ? 1 : 0) +
                  (minRating > 0 ? 1 : 0)}
              </Badge>
            )}
          </Button>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="recommended">Recommended</option>
            <option value="rating">Highest Rated</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="distance">Nearest First</option>
          </select>

          {/* Clear Filters */}
          {(selectedCuisines.size > 0 || selectedPriceLevel || minRating > 0) && (
            <Button onClick={clearFilters} variant="outline" size="sm">
              <X size={16} className="mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode('grid')}
            variant="outline"
            size="sm"
            className={viewMode === 'grid' ? 'bg-orange-50 border-orange-300' : ''}
          >
            <Grid size={16} />
          </Button>
          <Button
            onClick={() => setViewMode('list')}
            variant="outline"
            size="sm"
            className={viewMode === 'list' ? 'bg-orange-50 border-orange-300' : ''}
          >
            <List size={16} />
          </Button>
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
                {/* Cuisines */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Cuisine</h4>
                  <div className="space-y-2">
                    {cuisines.slice(0, 6).map(cuisine => (
                      <button
                        key={cuisine}
                        onClick={() => toggleCuisine(cuisine)}
                        className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-all ${
                          selectedCuisines.has(cuisine)
                            ? 'bg-orange-100 text-orange-700 font-semibold'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {cuisine}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Level */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Price Range</h4>
                  <div className="space-y-2">
                    {['$', '$$', '$$$', '$$$$'].map(price => (
                      <button
                        key={price}
                        onClick={() =>
                          setSelectedPriceLevel(selectedPriceLevel === price ? null : price)
                        }
                        className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-all ${
                          selectedPriceLevel === price
                            ? 'bg-orange-100 text-orange-700 font-semibold'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {price}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Minimum Rating</h4>
                  <div className="space-y-2">
                    {[4, 3, 2, 0].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setMinRating(rating)}
                        className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-all flex items-center gap-2 ${
                          minRating === rating
                            ? 'bg-orange-100 text-orange-700 font-semibold'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {rating === 0 ? (
                          'Any rating'
                        ) : (
                          <>
                            <Star size={14} className="text-yellow-500 fill-yellow-500" />
                            {rating}+ Stars
                          </>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Restaurants Grid/List */}
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }
      >
        <AnimatePresence mode="popLayout">
          {filteredAndSortedRestaurants.map((restaurant, index) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              index={index}
              viewMode={viewMode}
              isTopRated={
                restaurant.id === topRatedRestaurant?.id &&
                formatRatingNumber(restaurant.rating) >= 4.5
              }
              isSaved={savedRestaurants.has(restaurant.id)}
              onReservation={handleReservation}
              onSave={handleSave}
              onShare={handleShare}
              onSaveItem={onSaveItem}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Simple Tip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-50 rounded-2xl p-6"
      >
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Tip:</span> Book popular restaurants in advance,
          especially during peak travel seasons.
        </p>
      </motion.div>
    </div>
  );
}

// ==================== RESTAURANT CARD COMPONENT ====================

interface RestaurantCardProps {
  restaurant: Restaurant;
  index: number;
  viewMode: ViewMode;
  isTopRated: boolean;
  isSaved: boolean;
  onReservation: (restaurant: Restaurant) => void;
  onSave: (restaurant: Restaurant) => void;
  onShare: (restaurant: Restaurant) => void;
  onSaveItem?: (restaurant: Restaurant) => void;
}

function RestaurantCard({
  restaurant,
  index,
  viewMode,
  isTopRated,
  isSaved,
  onReservation,
  onSave,
  onShare,
  onSaveItem,
}: RestaurantCardProps) {
  if (viewMode === 'list') {
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
            isTopRated ? 'border-orange-500 bg-orange-50' : 'hover:border-orange-300'
          }`}
        >
          <div className="flex flex-col md:flex-row">
            {restaurant.photo && (
              <div className="relative md:w-80 h-64 md:h-auto overflow-hidden flex-shrink-0">
                <img
                  src={restaurant.photo}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
                {restaurant.rating && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white text-gray-800 font-bold shadow-lg">
                      <Star size={14} className="text-yellow-500 fill-yellow-500 mr-1" />
                      {formatRating(restaurant.rating)}
                    </Badge>
                  </div>
                )}
                {isTopRated && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-orange-600 text-white shadow-lg">🏆 Top Rated</Badge>
                  </div>
                )}
              </div>
            )}

            <div className="p-6 flex-1">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-gray-900 mb-1">{restaurant.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{restaurant.cuisine}</p>
                  {restaurant.priceLevel && (
                    <Badge variant="outline" className="text-xs">
                      {restaurant.priceLevel}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2 text-sm text-gray-600 mb-4">
                <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{restaurant.address}</span>
              </div>

              {restaurant.description && (
                <p className="text-gray-600 mb-4 line-clamp-2">{restaurant.description}</p>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => onReservation(restaurant)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink size={16} className="mr-2" />
                  View Details
                </Button>
                <Button onClick={() => onSave(restaurant)} variant="outline" size="icon">
                  {isSaved ? (
                    <BookmarkCheck size={20} className="text-orange-600" />
                  ) : (
                    <Bookmark size={20} />
                  )}
                </Button>
                <Button onClick={() => onShare(restaurant)} variant="outline" size="icon">
                  <Share2 size={20} />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
    >
      <div
        className={`bg-white border rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all group ${
          isTopRated ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
        }`}
      >
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
            {isTopRated && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-orange-600 text-white shadow-lg">🏆 Must Try</Badge>
              </div>
            )}

            {/* Quick Actions */}
            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onShare(restaurant)}
                className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
              >
                <Share2 size={16} />
              </motion.button>
            </div>
          </div>
        )}

        <div className="p-6 space-y-4">
          <div>
            <h3 className="font-bold text-xl text-gray-900 mb-1">{restaurant.name}</h3>
            <p className="text-sm text-gray-600">{restaurant.cuisine}</p>
            {restaurant.priceLevel && (
              <p className="text-sm text-gray-500 mt-1">{restaurant.priceLevel}</p>
            )}
          </div>

          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin size={16} className="mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{restaurant.address}</span>
          </div>

          {restaurant.distance && <p className="text-sm text-gray-500">{restaurant.distance}</p>}

          {restaurant.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{restaurant.description}</p>
          )}

          <button
            onClick={() => onReservation(restaurant)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            View Details
            <ExternalLink size={16} />
          </button>

          {onSaveItem && (
            <button
              onClick={() => onSave(restaurant)}
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
    </motion.div>
  );
}

// ==================== HELPER FUNCTIONS ====================

function formatRating(rating?: number | string): string {
  if (!rating) return '0.0';
  const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  return isNaN(numRating) ? '0.0' : numRating.toFixed(1);
}

function formatRatingNumber(rating?: number | string): number {
  if (!rating) return 0;
  const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  return isNaN(numRating) ? 0 : numRating;
}

function getPriceValue(priceLevel?: string): number {
  if (!priceLevel) return 2;
  return priceLevel.length;
}

async function trackRestaurantClick(restaurant: Restaurant) {
  try {
    await fetch('/api/analytics/affiliate-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'restaurant',
        itemId: restaurant.id,
        itemName: restaurant.name,
        partner: 'OpenTable',
        cuisine: restaurant.cuisine,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Failed to track restaurant click:', error);
  }
}