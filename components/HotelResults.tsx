'use client';

import { useState, useMemo } from 'react';
import {
  Hotel,
  MapPin,
  Star,
  Wifi,
  Coffee,
  Dumbbell,
  ExternalLink,
  TrendingUp,
  Bookmark,
  BookmarkCheck,
  Filter,
  SortAsc,
  Grid,
  List,
  Share2,
  Heart,
  Award,
  Sparkles,
  ChevronDown,
  X,
  Utensils,
  Car,
  Wind,
  Waves,
  Users,
  BedDouble,
  DollarSign,
  TrendingDown,
  MapPinned,
  Eye,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ==================== TYPES ====================

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
  reviews?: number;
  distanceFromCenter?: string;
  roomType?: string;
  dealBadge?: string;
  images?: string[];
}

interface HotelResultsProps {
  hotels: HotelItem[];
  onSaveItem?: (hotel: HotelItem) => void;
  loading?: boolean;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'recommended' | 'price-low' | 'price-high' | 'rating' | 'distance';

// ==================== MAIN COMPONENT ====================

export default function HotelResults({
  hotels,
  onSaveItem,
  loading = false,
}: HotelResultsProps) {
  const [selectedHotel, setSelectedHotel] = useState<string | null>(null);
  const [savedHotels, setSavedHotels] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(new Set());
  const [minRating, setMinRating] = useState(0);

  // ==================== FILTERING & SORTING ====================

  const filteredAndSortedHotels = useMemo(() => {
    let result = [...hotels];

    // Filter by amenities
    if (selectedAmenities.size > 0) {
      result = result.filter(hotel =>
        hotel.amenities?.some(amenity => selectedAmenities.has(amenity))
      );
    }

    // Filter by rating
    if (minRating > 0) {
      result = result.filter(hotel => (hotel.rating || 0) >= minRating);
    }

    // Filter by price
    result = result.filter(hotel => {
      const price = parseFloat(hotel.price.replace(/[^0-9.]/g, ''));
      return price >= priceRange[0] && price <= priceRange[1];
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
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'distance':
          const aDistance = parseFloat(a.distanceFromCenter?.split(' ')[0] || '999');
          const bDistance = parseFloat(b.distanceFromCenter?.split(' ')[0] || '999');
          return aDistance - bDistance;
        default:
          return 0;
      }
    });

    return result;
  }, [hotels, selectedAmenities, minRating, priceRange, sortBy]);

  // Get unique amenities
  const allAmenities = useMemo(() => {
    const amenities = new Set<string>();
    hotels.forEach(hotel => {
      hotel.amenities?.forEach(amenity => amenities.add(amenity));
    });
    return Array.from(amenities);
  }, [hotels]);

  // Best rated hotel
  const bestRatedHotel = useMemo(() => {
    return filteredAndSortedHotels.reduce((max, hotel) => {
      const rating = hotel.rating || 0;
      const maxRating = max.rating || 0;
      return rating > maxRating ? hotel : max;
    }, filteredAndSortedHotels[0]);
  }, [filteredAndSortedHotels]);

  // ==================== HANDLERS ====================

  const handleBookHotel = async (hotel: HotelItem) => {
    setSelectedHotel(hotel.id);
    await trackHotelClick(hotel);

    toast.success('Opening booking page', {
      description: `You'll be redirected to ${hotel.partner || 'Booking.com'}`,
    });

    setTimeout(() => {
      if (hotel.bookingUrl) {
        window.open(hotel.bookingUrl, '_blank');
      } else {
        const searchUrl = `https://www.booking.com/search?ss=${encodeURIComponent(
          hotel.name
        )}`;
        window.open(searchUrl, '_blank');
      }
    }, 500);
  };

  const handleSaveHotel = (hotel: HotelItem) => {
    const newSaved = new Set(savedHotels);
    const wasSaved = newSaved.has(hotel.id);

    if (wasSaved) {
      newSaved.delete(hotel.id);
      toast.success('Removed from trip', {
        description: hotel.name,
      });
    } else {
      newSaved.add(hotel.id);
      if (onSaveItem) {
        onSaveItem(hotel);
      }
      toast.success('Saved to trip!', {
        description: hotel.name,
        action: {
          label: 'View Trip',
          onClick: () => {
            window.location.href = '/trips';
          },
        },
      });
    }

    setSavedHotels(newSaved);
  };

  const handleShare = async (hotel: HotelItem) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: hotel.name,
          text: hotel.description,
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

  const toggleAmenity = (amenity: string) => {
    const newAmenities = new Set(selectedAmenities);
    if (newAmenities.has(amenity)) {
      newAmenities.delete(amenity);
    } else {
      newAmenities.add(amenity);
    }
    setSelectedAmenities(newAmenities);
  };

  const clearFilters = () => {
    setSelectedAmenities(new Set());
    setMinRating(0);
    setPriceRange([0, 1000]);
    toast.success('Filters cleared');
  };

  // ==================== AMENITY ICONS ====================

  const getAmenityIcon = (amenity: string) => {
    const icons: Record<string, any> = {
      WiFi: Wifi,
      Breakfast: Coffee,
      Gym: Dumbbell,
      Restaurant: Utensils,
      Parking: Car,
      'Air Conditioning': Wind,
      Pool: Waves,
      'Room Service': BedDouble,
    };
    return icons[amenity] || Hotel;
  };

  // ==================== RENDER ====================

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6">
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
  if (!hotels || hotels.length === 0) {
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
          className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Hotel className="text-purple-600" size={48} />
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Hotels Found</h3>
        <p className="text-gray-600 mb-6">
          Try searching for a different destination or adjusting your filters
        </p>
        <Button
          onClick={clearFilters}
          className="bg-gradient-to-r from-purple-600 to-pink-600"
        >
          Clear Filters
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Hotel className="text-white" size={24} />
              </div>
              Recommended Hotels
            </h2>
            <p className="text-gray-600">
              {filteredAndSortedHotels.length} properties found
              {selectedAmenities.size > 0 || minRating > 0
                ? ` (filtered from ${hotels.length})`
                : ''}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-purple-300 text-purple-700 px-4 py-2">
              <Sparkles size={14} className="mr-1" />
              Powered by Booking.com
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Best Rated Banner */}
      <AnimatePresence>
        {bestRatedHotel?.rating && bestRatedHotel.rating >= 4.5 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl flex items-center justify-between overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <Award className="text-purple-600" size={24} />
              <span className="text-sm text-purple-900">
                <strong>Top Rated:</strong> {bestRatedHotel.name} - {bestRatedHotel.rating} ⭐
              </span>
            </div>
            <Badge className="bg-purple-600 text-white">Guest Favorite</Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters & Controls */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"
      >
        <div className="flex gap-2 flex-wrap">
          {/* Filter Button */}
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className={showFilters ? 'bg-purple-50 border-purple-300' : ''}
          >
            <Filter size={16} className="mr-2" />
            Filters
            {(selectedAmenities.size > 0 || minRating > 0) && (
              <Badge className="ml-2 bg-purple-600">
                {selectedAmenities.size + (minRating > 0 ? 1 : 0)}
              </Badge>
            )}
          </Button>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="recommended">Recommended</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="distance">Distance from Center</option>
          </select>

          {/* Clear Filters */}
          {(selectedAmenities.size > 0 || minRating > 0) && (
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
            className={viewMode === 'grid' ? 'bg-purple-50 border-purple-300' : ''}
          >
            <Grid size={16} />
          </Button>
          <Button
            onClick={() => setViewMode('list')}
            variant="outline"
            size="sm"
            className={viewMode === 'list' ? 'bg-purple-50 border-purple-300' : ''}
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
            className="mb-6 overflow-hidden"
          >
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Amenities */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Amenities</h4>
                  <div className="space-y-2">
                    {allAmenities.slice(0, 6).map(amenity => {
                      const Icon = getAmenityIcon(amenity);
                      return (
                        <button
                          key={amenity}
                          onClick={() => toggleAmenity(amenity)}
                          className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-all flex items-center gap-2 ${
                            selectedAmenities.has(amenity)
                              ? 'bg-purple-100 text-purple-700 font-semibold'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Icon size={14} />
                          {amenity}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Minimum Rating</h4>
                  <div className="space-y-2">
                    {[4, 3, 2, 1, 0].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setMinRating(rating)}
                        className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-all flex items-center gap-2 ${
                          minRating === rating
                            ? 'bg-purple-100 text-purple-700 font-semibold'
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

                {/* Price Range */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Price Range (per night)</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">$0</span>
                      <input
                        type="range"
                        min="0"
                        max="1000"
                        value={priceRange[1]}
                        onChange={e => setPriceRange([0, parseInt(e.target.value)])}
                        className="flex-1"
                      />
                      <span className="text-sm font-semibold">${priceRange[1]}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Showing hotels up to ${priceRange[1]}/night
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hotels Grid/List */}
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }
      >
        <AnimatePresence mode="popLayout">
          {filteredAndSortedHotels.map((hotel, index) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              index={index}
              viewMode={viewMode}
              isTopRated={
                !!(hotel.id === bestRatedHotel?.id && hotel.rating && hotel.rating >= 4.5)
              }
              isSelected={selectedHotel === hotel.id}
              isSaved={savedHotels.has(hotel.id)}
              onBook={handleBookHotel}
              onSave={handleSaveHotel}
              onShare={handleShare}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6"
      >
        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Award className="text-purple-600" size={20} />
          Hotel Booking Tips
        </h4>
        <div className="grid md:grid-cols-2 gap-4">
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-purple-600 font-bold">✓</span>
              <span>Book early for better rates and availability</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-purple-600 font-bold">✓</span>
              <span>Check cancellation policies before booking</span>
            </li>
          </ul>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-purple-600 font-bold">✓</span>
              <span>Look for hotels near public transportation</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-purple-600 font-bold">✓</span>
              <span>Read recent guest reviews for honest feedback</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}

// ==================== HOTEL CARD COMPONENT ====================

interface HotelCardProps {
  hotel: HotelItem;
  index: number;
  viewMode: ViewMode;
  isTopRated: boolean;
  isSelected: boolean;
  isSaved: boolean;
  onBook: (hotel: HotelItem) => void;
  onSave: (hotel: HotelItem) => void;
  onShare: (hotel: HotelItem) => void;
}

function HotelCard({
  hotel,
  index,
  viewMode,
  isTopRated,
  isSelected,
  isSaved,
  onBook,
  onSave,
  onShare,
}: HotelCardProps) {
  if (viewMode === 'list') {
    // List view
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
            isTopRated
              ? 'border-purple-500 bg-purple-50'
              : isSelected
              ? 'border-purple-500 shadow-lg'
              : 'hover:border-purple-300'
          }`}
        >
          <div className="flex flex-col md:flex-row">
            {/* Image */}
            {hotel.image && (
              <div className="relative md:w-80 h-64 md:h-auto overflow-hidden flex-shrink-0">
                <img
                  src={hotel.image}
                  alt={hotel.name}
                  className="w-full h-full object-cover"
                />
                {hotel.rating && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white text-gray-800 font-bold shadow-lg">
                      <Star size={14} className="text-yellow-500 fill-yellow-500 mr-1" />
                      {hotel.rating.toFixed(1)}
                    </Badge>
                  </div>
                )}
                {isTopRated && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-purple-600 text-white shadow-lg">
                      🏆 Top Rated
                    </Badge>
                  </div>
                )}
                {hotel.dealBadge && (
                  <div className="absolute bottom-3 left-3">
                    <Badge className="bg-red-600 text-white shadow-lg">
                      {hotel.dealBadge}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-gray-900 mb-2">{hotel.name}</h3>
                  {hotel.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <MapPin size={14} />
                      {hotel.location}
                    </div>
                  )}
                  {hotel.distanceFromCenter && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPinned size={14} />
                      {hotel.distanceFromCenter} from center
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-700">{hotel.price}</p>
                  {hotel.pricePerNight && (
                    <p className="text-xs text-gray-500">{hotel.pricePerNight} per night</p>
                  )}
                </div>
              </div>

              {hotel.description && (
                <p className="text-gray-600 mb-4">{hotel.description}</p>
              )}

              {hotel.amenities && hotel.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {hotel.amenities.slice(0, 6).map((amenity, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => onBook(hotel)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <ExternalLink size={16} className="mr-2" />
                  Check Availability
                </Button>
                <Button onClick={() => onSave(hotel)} variant="outline" size="icon">
                  {isSaved ? (
                    <BookmarkCheck size={20} className="text-purple-600" />
                  ) : (
                    <Bookmark size={20} />
                  )}
                </Button>
                <Button onClick={() => onShare(hotel)} variant="outline" size="icon">
                  <Share2 size={20} />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={`overflow-hidden hover:shadow-xl transition-all duration-300 border-2 group ${
          isTopRated
            ? 'border-purple-500 bg-purple-50'
            : isSelected
            ? 'border-purple-500 shadow-lg'
            : 'hover:border-purple-300'
        }`}
      >
        {/* Image */}
        {hotel.image && (
          <div className="relative h-56 overflow-hidden">
            <img
              src={hotel.image}
              alt={hotel.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            {/* Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
              {isTopRated && (
                <Badge className="bg-purple-600 text-white shadow-lg">🏆 Top Rated</Badge>
              )}
              {hotel.dealBadge && (
                <Badge className="bg-red-600 text-white shadow-lg">{hotel.dealBadge}</Badge>
              )}
              {hotel.rating && (
                <Badge className="bg-white text-gray-800 font-bold shadow-lg ml-auto">
                  <Star size={14} className="text-yellow-500 fill-yellow-500 mr-1" />
                  {hotel.rating.toFixed(1)}
                </Badge>
              )}
            </div>

            {/* Quick Actions */}
            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onShare(hotel)}
                className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
              >
                <Share2 size={16} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onSave(hotel)}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                  isSaved ? 'bg-purple-600 text-white' : 'bg-white/90 backdrop-blur-sm'
                }`}
              >
                {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              </motion.button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1 min-h-[28px]">
            {hotel.name}
          </h3>

          {/* Location & Distance */}
          <div className="space-y-1 mb-3">
            {hotel.location && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin size={14} className="mr-2 flex-shrink-0" />
                <span className="line-clamp-1">{hotel.location}</span>
              </div>
            )}
            {hotel.distanceFromCenter && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPinned size={14} className="mr-2 flex-shrink-0" />
                <span>{hotel.distanceFromCenter} from center</span>
              </div>
            )}
          </div>

          {hotel.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
              {hotel.description}
            </p>
          )}

          {/* Amenities */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {hotel.amenities.slice(0, 3).map((amenity, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
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
            {hotel.reviews && (
              <span className="text-xs text-gray-500">{hotel.reviews} reviews</span>
            )}
          </div>

          {/* Actions */}
          <Button
            onClick={() => onBook(hotel)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl"
          >
            <ExternalLink size={16} className="mr-2" />
            Check Availability
          </Button>

          <p className="text-xs text-center text-gray-500 mt-3">
            💡 We earn a small commission
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

// ==================== HELPER FUNCTIONS ====================

async function trackHotelClick(hotel: HotelItem) {
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
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Failed to track hotel click:', error);
  }
}