'use client';

import { useState, useMemo } from 'react';
import {
  Activity,
  MapPin,
  Clock,
  Users,
  Star,
  ExternalLink,
  DollarSign,
  Bookmark,
  BookmarkCheck,
  Filter,
  SortAsc,
  Grid,
  List,
  Share2,
  Heart,
  TrendingUp,
  Award,
  Sparkles,
  ChevronDown,
  X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ==================== TYPES ====================

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  price: string;
  duration?: string;
  rating?: number;
  location?: string;
  category?: string;
  image?: string;
  bookingUrl?: string;
  groupSize?: string;
  partner?: string;
  reviews?: number;
  difficulty?: 'Easy' | 'Moderate' | 'Hard';
  highlights?: string[];
}

interface ActivityResultsProps {
  activities: ActivityItem[];
  onSaveItem?: (activity: ActivityItem) => void;
  loading?: boolean;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'recommended' | 'price-low' | 'price-high' | 'rating' | 'duration';

// ==================== MAIN COMPONENT ====================

export default function ActivityResults({
  activities,
  onSaveItem,
  loading = false,
}: ActivityResultsProps) {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [savedActivities, setSavedActivities] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [minRating, setMinRating] = useState(0);

  // ==================== FILTERING & SORTING ====================

  const filteredAndSortedActivities = useMemo(() => {
    let result = [...activities];

    // Filter by categories
    if (selectedCategories.size > 0) {
      result = result.filter(
        activity => activity.category && selectedCategories.has(activity.category)
      );
    }

    // Filter by rating
    if (minRating > 0) {
      result = result.filter(activity => (activity.rating || 0) >= minRating);
    }

    // Filter by price
    result = result.filter(activity => {
      const price = parseFloat(activity.price.replace(/[^0-9.]/g, ''));
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
        case 'duration':
          // Simple duration comparison (assumes format like "2 hours")
          const aDuration = parseInt(a.duration?.match(/\d+/)?.[0] || '0');
          const bDuration = parseInt(b.duration?.match(/\d+/)?.[0] || '0');
          return aDuration - bDuration;
        default:
          return 0;
      }
    });

    return result;
  }, [activities, selectedCategories, minRating, priceRange, sortBy]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    activities.forEach(activity => {
      if (activity.category) cats.add(activity.category);
    });
    return Array.from(cats);
  }, [activities]);

  // ==================== HANDLERS ====================

  const handleBookActivity = async (activity: ActivityItem) => {
    setSelectedActivity(activity.id);
    await trackActivityClick(activity);

    toast.success('Opening booking page', {
      description: `You'll be redirected to ${activity.partner || 'Viator'}`,
    });

    setTimeout(() => {
      if (activity.bookingUrl) {
        window.open(activity.bookingUrl, '_blank');
      } else {
        const searchUrl = `https://www.viator.com/search?text=${encodeURIComponent(
          activity.title
        )}`;
        window.open(searchUrl, '_blank');
      }
    }, 500);
  };

  const handleSaveActivity = (activity: ActivityItem) => {
    const newSaved = new Set(savedActivities);
    const wasSaved = newSaved.has(activity.id);

    if (wasSaved) {
      newSaved.delete(activity.id);
      toast.success('Removed from trip', {
        description: activity.title,
      });
    } else {
      newSaved.add(activity.id);
      if (onSaveItem) {
        onSaveItem(activity);
      }
      toast.success('Saved to trip!', {
        description: activity.title,
        action: {
          label: 'View Trip',
          onClick: () => {
            // Navigate to saved trips
            window.location.href = '/trips';
          },
        },
      });
    }

    setSavedActivities(newSaved);
  };

  const handleShare = async (activity: ActivityItem) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: activity.title,
          text: activity.description,
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

  const toggleCategory = (category: string) => {
    const newCategories = new Set(selectedCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    setSelectedCategories(newCategories);
  };

  const clearFilters = () => {
    setSelectedCategories(new Set());
    setMinRating(0);
    setPriceRange([0, 500]);
    toast.success('Filters cleared');
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
  if (!activities || activities.length === 0) {
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
          className="w-24 h-24 bg-gradient-to-br from-green-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Activity className="text-green-600" size={48} />
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Activities Found</h3>
        <p className="text-gray-600 mb-6">
          Try searching for a different destination or adjusting your filters
        </p>
        <Button
          onClick={clearFilters}
          className="bg-gradient-to-r from-green-600 to-teal-600"
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
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Activity className="text-white" size={24} />
              </div>
              Things to Do
            </h2>
            <p className="text-gray-600">
              {filteredAndSortedActivities.length} experiences found
              {selectedCategories.size > 0 || minRating > 0
                ? ` (filtered from ${activities.length})`
                : ''}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-green-300 text-green-700 px-4 py-2">
              <Sparkles size={14} className="mr-1" />
              Powered by Viator
            </Badge>
          </div>
        </div>
      </motion.div>

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
            className={showFilters ? 'bg-green-50 border-green-300' : ''}
          >
            <Filter size={16} className="mr-2" />
            Filters
            {(selectedCategories.size > 0 || minRating > 0) && (
              <Badge className="ml-2 bg-green-600">{selectedCategories.size + (minRating > 0 ? 1 : 0)}</Badge>
            )}
          </Button>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="recommended">Recommended</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="duration">Duration</option>
          </select>

          {/* Clear Filters */}
          {(selectedCategories.size > 0 || minRating > 0) && (
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
            className={viewMode === 'grid' ? 'bg-green-50 border-green-300' : ''}
          >
            <Grid size={16} />
          </Button>
          <Button
            onClick={() => setViewMode('list')}
            variant="outline"
            size="sm"
            className={viewMode === 'list' ? 'bg-green-50 border-green-300' : ''}
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
                {/* Categories */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Categories</h4>
                  <div className="space-y-2">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-all ${
                          selectedCategories.has(category)
                            ? 'bg-green-100 text-green-700 font-semibold'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
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
                            ? 'bg-green-100 text-green-700 font-semibold'
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
                  <h4 className="font-semibold text-gray-900 mb-3">Price Range</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">$0</span>
                      <input
                        type="range"
                        min="0"
                        max="500"
                        value={priceRange[1]}
                        onChange={e => setPriceRange([0, parseInt(e.target.value)])}
                        className="flex-1"
                      />
                      <span className="text-sm font-semibold">${priceRange[1]}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Showing activities up to ${priceRange[1]}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activities Grid/List */}
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }
      >
        <AnimatePresence mode="popLayout">
          {filteredAndSortedActivities.map((activity, index) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              index={index}
              viewMode={viewMode}
              isSelected={selectedActivity === activity.id}
              isSaved={savedActivities.has(activity.id)}
              onBook={handleBookActivity}
              onSave={handleSaveActivity}
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
        className="mt-12 bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-200 rounded-2xl p-6"
      >
        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Award className="text-green-600" size={20} />
          Activity Booking Tips
        </h4>
        <div className="grid md:grid-cols-2 gap-4">
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-green-600 font-bold">✓</span>
              <span>Book popular activities in advance to avoid sold-out dates</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-green-600 font-bold">✓</span>
              <span>Check cancellation policies before booking</span>
            </li>
          </ul>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-green-600 font-bold">✓</span>
              <span>Read reviews from other travelers</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-green-600 font-bold">✓</span>
              <span>Consider combo packages for better value</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}

// ==================== ACTIVITY CARD ====================

interface ActivityCardProps {
  activity: ActivityItem;
  index: number;
  viewMode: ViewMode;
  isSelected: boolean;
  isSaved: boolean;
  onBook: (activity: ActivityItem) => void;
  onSave: (activity: ActivityItem) => void;
  onShare: (activity: ActivityItem) => void;
}

function ActivityCard({
  activity,
  index,
  viewMode,
  isSelected,
  isSaved,
  onBook,
  onSave,
  onShare,
}: ActivityCardProps) {
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
            isSelected ? 'border-green-500 shadow-lg' : 'hover:border-green-300'
          }`}
        >
          <div className="flex flex-col md:flex-row">
            {/* Image */}
            {activity.image && (
              <div className="relative md:w-80 h-64 md:h-auto overflow-hidden flex-shrink-0">
                <img
                  src={activity.image}
                  alt={activity.title}
                  className="w-full h-full object-cover"
                />
                {activity.rating && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white text-gray-800 font-bold shadow-lg">
                      <Star size={14} className="text-yellow-500 fill-yellow-500 mr-1" />
                      {activity.rating.toFixed(1)}
                    </Badge>
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-gray-900 mb-2">{activity.title}</h3>
                  {activity.category && (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      {activity.category}
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-700">{activity.price}</p>
                  <p className="text-xs text-gray-500">per person</p>
                </div>
              </div>

              <p className="text-gray-600 mb-4">{activity.description}</p>

              <div className="flex flex-wrap gap-4 mb-4">
                {activity.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin size={16} className="mr-2" />
                    {activity.location}
                  </div>
                )}
                {activity.duration && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock size={16} className="mr-2" />
                    {activity.duration}
                  </div>
                )}
                {activity.groupSize && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users size={16} className="mr-2" />
                    {activity.groupSize}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => onBook(activity)}
                  className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                >
                  <ExternalLink size={16} className="mr-2" />
                  Book Now
                </Button>
                <Button onClick={() => onSave(activity)} variant="outline" size="icon">
                  {isSaved ? (
                    <BookmarkCheck size={20} className="text-green-600" />
                  ) : (
                    <Bookmark size={20} />
                  )}
                </Button>
                <Button onClick={() => onShare(activity)} variant="outline" size="icon">
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
          isSelected ? 'border-green-500 shadow-lg' : 'hover:border-green-300'
        }`}
      >
        {/* Image */}
        {activity.image && (
          <div className="relative h-56 overflow-hidden">
            <img
              src={activity.image}
              alt={activity.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            {/* Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
              {activity.category && (
                <Badge className="bg-green-500 text-white shadow-lg">{activity.category}</Badge>
              )}
              {activity.rating && (
                <Badge className="bg-white text-gray-800 font-bold shadow-lg">
                  <Star size={14} className="text-yellow-500 fill-yellow-500 mr-1" />
                  {activity.rating.toFixed(1)}
                </Badge>
              )}
            </div>

            {/* Quick Actions */}
            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onShare(activity)}
                className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
              >
                <Share2 size={16} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onSave(activity)}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                  isSaved ? 'bg-green-600 text-white' : 'bg-white/90 backdrop-blur-sm'
                }`}
              >
                {isSaved ? (
                  <BookmarkCheck size={16} />
                ) : (
                  <Bookmark size={16} />
                )}
              </motion.button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 min-h-[56px]">
            {activity.title}
          </h3>

          <p className="text-sm text-gray-600 mb-4 line-clamp-3 min-h-[60px]">
            {activity.description}
          </p>

          {/* Details */}
          <div className="space-y-2 mb-4">
            {activity.location && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPin size={14} className="mr-2 flex-shrink-0" />
                <span className="line-clamp-1">{activity.location}</span>
              </div>
            )}
            {activity.duration && (
              <div className="flex items-center text-sm text-gray-600">
                <Clock size={14} className="mr-2 flex-shrink-0" />
                <span>{activity.duration}</span>
              </div>
            )}
            {activity.groupSize && (
              <div className="flex items-center text-sm text-gray-600">
                <Users size={14} className="mr-2 flex-shrink-0" />
                <span>{activity.groupSize}</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <div>
              <span className="text-2xl font-bold text-green-700">{activity.price}</span>
              <span className="text-xs text-gray-500 ml-1">per person</span>
            </div>
            {activity.reviews && (
              <span className="text-xs text-gray-500">{activity.reviews} reviews</span>
            )}
          </div>

          {/* Actions */}
          <Button
            onClick={() => onBook(activity)}
            className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-lg hover:shadow-xl"
          >
            <ExternalLink size={16} className="mr-2" />
            Book Experience
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

async function trackActivityClick(activity: ActivityItem) {
  try {
    await fetch('/api/analytics/affiliate-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'activity',
        itemId: activity.id,
        itemName: activity.title,
        partner: activity.partner || 'Viator',
        estimatedValue: parseFloat(activity.price.replace(/[^0-9.]/g, '')),
        estimatedCommission: parseFloat(activity.price.replace(/[^0-9.]/g, '')) * 0.1,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Failed to track activity click:', error);
  }
}