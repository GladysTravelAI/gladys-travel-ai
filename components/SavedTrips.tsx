'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Bookmark,
  Trash2,
  Calendar,
  MapPin,
  DollarSign,
  Plus,
  Search,
  Hotel,
  Plane,
  Activity,
  Utensils,
  Eye,
  Edit2,
  Download,
  Share2,
  Copy,
  Archive,
  TrendingUp,
  Clock,
  Star,
  Heart,
  AlertCircle,
  Filter,
  SortAsc,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

// ==================== TYPES ====================

interface SavedTrip {
  id: string;
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt?: string;
  budget: 'Budget' | 'Mid-range' | 'Luxury' | 'Ultra-Luxury';
  travelers: number;
  status: 'planning' | 'booked' | 'completed' | 'archived';
  image?: string;
  items: {
    hotels: number;
    flights: number;
    activities: number;
    restaurants: number;
  };
  estimatedTotal: number;
  notes?: string;
  tags?: string[];
  isFavorite?: boolean;
}

type SortOption = 'date' | 'budget' | 'destination' | 'created';

// ==================== MAIN COMPONENT ====================

export default function SavedTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'planning' | 'booked' | 'completed' | 'archived'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // ==================== LOAD TRIPS ====================

  useEffect(() => {
    loadTrips();
  }, [user]);

  const loadTrips = async () => {
    setLoading(true);
    
    try {
      // Load from localStorage (in production, fetch from API)
      const storageKey = `gladys_saved_trips_${user?.uid || 'guest'}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const loadedTrips = JSON.parse(stored);
        setTrips(loadedTrips);
      } else {
        // Demo data for first-time users
        setTrips(getDemoTrips());
      }
    } catch (error) {
      console.error('❌ Failed to load trips:', error);
      toast.error('Load failed', {
        description: 'Could not load your saved trips',
      });
    } finally {
      setLoading(false);
    }
  };

  // ==================== SAVE TRIPS ====================

  const saveTrips = (updatedTrips: SavedTrip[]) => {
    try {
      const storageKey = `gladys_saved_trips_${user?.uid || 'guest'}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedTrips));
      setTrips(updatedTrips);
    } catch (error) {
      console.error('❌ Failed to save trips:', error);
      toast.error('Save failed', {
        description: 'Could not save changes',
      });
    }
  };

  // ==================== TRIP ACTIONS ====================

  const handleDeleteTrip = (tripId: string) => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;

    const updatedTrips = trips.filter(t => t.id !== tripId);
    saveTrips(updatedTrips);

    toast.success('Trip deleted', {
      description: `${trip.destination} has been removed`,
      action: {
        label: 'Undo',
        onClick: () => {
          saveTrips([...updatedTrips, trip]);
        },
      },
    });
  };

  const handleToggleFavorite = (tripId: string) => {
    const updatedTrips = trips.map(trip =>
      trip.id === tripId ? { ...trip, isFavorite: !trip.isFavorite } : trip
    );
    saveTrips(updatedTrips);

    const trip = updatedTrips.find(t => t.id === tripId);
    toast.success(
      trip?.isFavorite ? 'Added to favorites' : 'Removed from favorites',
      {
        description: trip?.destination,
      }
    );
  };

  const handleArchiveTrip = (tripId: string) => {
    const updatedTrips = trips.map(trip => {
      if (trip.id !== tripId) return trip;
      
      const newStatus: SavedTrip['status'] = trip.status === 'archived' ? 'planning' : 'archived';
      return { ...trip, status: newStatus };
    });
    saveTrips(updatedTrips);

    const trip = updatedTrips.find(t => t.id === tripId);
    toast.success(
      trip?.status === 'archived' ? 'Trip archived' : 'Trip restored',
      {
        description: trip?.destination,
      }
    );
  };

  const handleDuplicateTrip = (tripId: string) => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;

    const duplicatedTrip: SavedTrip = {
      ...trip,
      id: Date.now().toString(),
      destination: `${trip.destination} (Copy)`,
      createdAt: new Date().toISOString(),
      status: 'planning',
    };

    saveTrips([duplicatedTrip, ...trips]);

    toast.success('Trip duplicated', {
      description: `Created a copy of ${trip.destination}`,
    });
  };

  const handleExportTrip = (tripId: string) => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;

    const dataStr = JSON.stringify(trip, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${trip.destination.toLowerCase().replace(/\s+/g, '-')}-trip.json`;
    link.click();

    toast.success('Trip exported', {
      description: `Downloaded ${trip.destination} trip data`,
    });
  };

  const handleShareTrip = async (tripId: string) => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;

    const shareData = {
      title: `${trip.destination} Trip`,
      text: `Check out my ${trip.destination} trip plan! ${trip.startDate} to ${trip.endDate}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Shared successfully');
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Link copied', {
          description: 'Trip link copied to clipboard',
        });
      }
    } catch (error) {
      console.error('❌ Share failed:', error);
    }
  };

  // ==================== FILTERING & SORTING ====================

  const filteredAndSortedTrips = useMemo(() => {
    let result = [...trips];

    // Filter by search
    if (searchQuery) {
      result = result.filter(
        trip =>
          trip.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
          trip.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
          trip.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(trip => trip.status === filterStatus);
    }

    // Filter by favorites
    if (showFavoritesOnly) {
      result = result.filter(trip => trip.isFavorite);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        case 'budget':
          return b.estimatedTotal - a.estimatedTotal;
        case 'destination':
          return a.destination.localeCompare(b.destination);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [trips, searchQuery, filterStatus, showFavoritesOnly, sortBy]);

  // ==================== STATS ====================

  const stats = useMemo(() => {
    const activeTrips = trips.filter(t => t.status !== 'archived');
    
    return {
      totalDestinations: activeTrips.length,
      totalDays: activeTrips.reduce((sum, trip) => {
        const days = Math.ceil(
          (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0),
      totalBudget: activeTrips.reduce((sum, trip) => sum + trip.estimatedTotal, 0),
      totalItems: activeTrips.reduce(
        (sum, trip) =>
          sum +
          trip.items.hotels +
          trip.items.flights +
          trip.items.activities +
          trip.items.restaurants,
        0
      ),
      upcomingTrips: activeTrips.filter(
        t => new Date(t.startDate) > new Date() && t.status !== 'completed'
      ).length,
      favorites: trips.filter(t => t.isFavorite).length,
    };
  }, [trips]);

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 py-12 px-6 relative overflow-hidden"
      >
        {/* Animated background */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '30px 30px',
            }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-bold text-white mb-2 flex items-center gap-3"
              >
                <Bookmark size={40} />
                My Saved Trips
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white/90 text-lg"
              >
                Plan, save, and book your dream vacations
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Link href="/">
                <Button className="bg-white text-purple-600 hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all">
                  <Plus size={20} className="mr-2" />
                  Plan New Trip
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="max-w-7xl mx-auto px-6 -mt-8 mb-6"
      >
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <QuickStat
              icon={MapPin}
              label="Destinations"
              value={stats.totalDestinations}
              color="purple"
            />
            <QuickStat
              icon={Calendar}
              label="Days"
              value={stats.totalDays}
              color="blue"
            />
            <QuickStat
              icon={DollarSign}
              label="Budget"
              value={`$${(stats.totalBudget / 1000).toFixed(1)}k`}
              color="green"
            />
            <QuickStat
              icon={Clock}
              label="Upcoming"
              value={stats.upcomingTrips}
              color="orange"
            />
            <QuickStat
              icon={Heart}
              label="Favorites"
              value={stats.favorites}
              color="pink"
            />
            <QuickStat
              icon={Bookmark}
              label="Saved Items"
              value={stats.totalItems}
              color="indigo"
            />
          </div>
        </div>
      </motion.div>

      {/* Filters & Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="max-w-7xl mx-auto px-6 mb-8"
      >
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <Input
                placeholder="Search destinations, countries, or tags..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 rounded-xl border-gray-200"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="date">Sort by Date</option>
              <option value="budget">Sort by Budget</option>
              <option value="destination">Sort by Name</option>
              <option value="created">Sort by Created</option>
            </select>

            {/* Favorites Toggle */}
            <Button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              variant={showFavoritesOnly ? 'default' : 'outline'}
              className={showFavoritesOnly ? 'bg-pink-600 hover:bg-pink-700' : ''}
            >
              <Heart size={16} className="mr-2" />
              Favorites
            </Button>
          </div>

          {/* Status Filter Tabs */}
          <div className="mt-4">
            <Tabs
              value={filterStatus}
              onValueChange={v => setFilterStatus(v as any)}
            >
              <TabsList className="bg-gray-100 p-1 rounded-xl w-full grid grid-cols-5">
                <TabsTrigger value="all" className="rounded-lg">
                  All
                </TabsTrigger>
                <TabsTrigger value="planning" className="rounded-lg">
                  Planning
                </TabsTrigger>
                <TabsTrigger value="booked" className="rounded-lg">
                  Booked
                </TabsTrigger>
                <TabsTrigger value="completed" className="rounded-lg">
                  Completed
                </TabsTrigger>
                <TabsTrigger value="archived" className="rounded-lg">
                  Archived
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </motion.div>

      {/* Trips Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 animate-pulse"
                >
                  <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </motion.div>
          ) : filteredAndSortedTrips.length === 0 ? (
            <EmptyState
              searchQuery={searchQuery}
              filterStatus={filterStatus}
              showFavoritesOnly={showFavoritesOnly}
            />
          ) : (
            <motion.div
              key="trips"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredAndSortedTrips.map((trip, index) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  index={index}
                  onDelete={() => handleDeleteTrip(trip.id)}
                  onToggleFavorite={() => handleToggleFavorite(trip.id)}
                  onArchive={() => handleArchiveTrip(trip.id)}
                  onDuplicate={() => handleDuplicateTrip(trip.id)}
                  onExport={() => handleExportTrip(trip.id)}
                  onShare={() => handleShareTrip(trip.id)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ==================== TRIP CARD ====================

interface TripCardProps {
  trip: SavedTrip;
  index: number;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onArchive: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onShare: () => void;
}

function TripCard({
  trip,
  index,
  onDelete,
  onToggleFavorite,
  onArchive,
  onDuplicate,
  onExport,
  onShare,
}: TripCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const statusConfig = {
    planning: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '📝' },
    booked: { color: 'bg-green-100 text-green-700 border-green-200', icon: '✓' },
    completed: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: '✓' },
    archived: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: '📦' },
  };

  const config = statusConfig[trip.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 group"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {trip.image ? (
          <img
            src={trip.image}
            alt={trip.destination}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-400 via-pink-400 to-purple-500"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

        {/* Top badges */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          <Badge className={`${config.color} border capitalize`}>
            {config.icon} {trip.status}
          </Badge>

          <div className="flex gap-2">
            {/* Favorite */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onToggleFavorite}
              className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
                trip.isFavorite
                  ? 'bg-pink-500 text-white'
                  : 'bg-white/90 text-gray-700'
              }`}
            >
              <Heart
                size={18}
                fill={trip.isFavorite ? 'white' : 'none'}
              />
            </motion.button>

            {/* Menu */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowMenu(!showMenu)}
                className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-gray-700"
              >
                <MoreVertical size={18} />
              </motion.button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-10"
                  >
                    <button
                      onClick={() => {
                        onDuplicate();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Copy size={16} />
                      Duplicate
                    </button>
                    <button
                      onClick={() => {
                        onExport();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Download size={16} />
                      Export
                    </button>
                    <button
                      onClick={() => {
                        onShare();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Share2 size={16} />
                      Share
                    </button>
                    <button
                      onClick={() => {
                        onArchive();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Archive size={16} />
                      {trip.status === 'archived' ? 'Restore' : 'Archive'}
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => {
                        onDelete();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Destination Name */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-bold text-white mb-1">
            {trip.destination}
          </h3>
          <p className="text-white/90 text-sm flex items-center gap-1">
            <MapPin size={14} />
            {trip.country}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Dates */}
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <Calendar size={16} className="mr-2 flex-shrink-0" />
          <span>
            {new Date(trip.startDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}{' '}
            -{' '}
            {new Date(trip.endDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4 pb-4 border-b border-gray-200">
          <StatBubble icon={Hotel} value={trip.items.hotels} label="Hotels" color="purple" />
          <StatBubble icon={Plane} value={trip.items.flights} label="Flights" color="blue" />
          <StatBubble icon={Activity} value={trip.items.activities} label="Things" color="green" />
          <StatBubble icon={Utensils} value={trip.items.restaurants} label="Dining" color="orange" />
        </div>

        {/* Budget & Travelers */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-gray-400" />
            <span className="font-semibold text-gray-900">{trip.budget}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Travelers:</span>
            <span className="font-semibold text-gray-900">{trip.travelers}</span>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
          <span className="text-sm font-medium text-gray-700">Estimated Total:</span>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            ${trip.estimatedTotal.toLocaleString()}
          </span>
        </div>

        {/* Tags */}
        {trip.tags && trip.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {trip.tags.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/?destination=${trip.destination}`}>
            <Button variant="default" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Eye size={16} className="mr-2" />
              View
            </Button>
          </Link>
          <Link href={`/trips/${trip.id}/edit`}>
            <Button variant="outline" className="w-full">
              <Edit2 size={16} className="mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ==================== HELPER COMPONENTS ====================

function QuickStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600',
    indigo: 'from-indigo-500 to-indigo-600',
  };

  return (
    <div className="text-center">
      <div
        className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center mx-auto mb-2`}
      >
        <Icon className="text-white" size={20} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </div>
  );
}

function StatBubble({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    purple: 'text-purple-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
  };

  return (
    <div className="text-center">
      <Icon className={`mx-auto ${colorClasses[color]} mb-1`} size={18} />
      <p className="text-xs font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function EmptyState({
  searchQuery,
  filterStatus,
  showFavoritesOnly,
}: {
  searchQuery: string;
  filterStatus: string;
  showFavoritesOnly: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-20"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        {searchQuery || filterStatus !== 'all' || showFavoritesOnly ? (
          <AlertCircle className="text-purple-600" size={48} />
        ) : (
          <Bookmark className="text-purple-600" size={48} />
        )}
      </motion.div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {searchQuery || filterStatus !== 'all' || showFavoritesOnly
          ? 'No Trips Found'
          : 'No Saved Trips Yet'}
      </h2>

      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {searchQuery
          ? 'Try adjusting your search terms or filters'
          : filterStatus !== 'all'
          ? `No trips with status: ${filterStatus}`
          : showFavoritesOnly
          ? 'No favorite trips yet. Add some favorites!'
          : 'Start planning your first adventure and save it here!'}
      </p>

      <Link href="/">
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl">
          <Plus size={20} className="mr-2" />
          Plan Your First Trip
        </Button>
      </Link>
    </motion.div>
  );
}

// ==================== DEMO DATA ====================

function getDemoTrips(): SavedTrip[] {
  return [
    {
      id: '1',
      destination: 'Paris',
      country: 'France',
      startDate: '2025-06-15',
      endDate: '2025-06-22',
      createdAt: '2025-01-10T10:00:00Z',
      budget: 'Luxury',
      travelers: 2,
      status: 'planning',
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
      items: { hotels: 2, flights: 1, activities: 5, restaurants: 3 },
      estimatedTotal: 5400,
      tags: ['Romantic', 'Culture', 'Food'],
      isFavorite: true,
    },
    {
      id: '2',
      destination: 'Tokyo',
      country: 'Japan',
      startDate: '2025-08-01',
      endDate: '2025-08-10',
      createdAt: '2025-01-12T14:30:00Z',
      budget: 'Mid-range',
      travelers: 1,
      status: 'planning',
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
      items: { hotels: 1, flights: 1, activities: 8, restaurants: 4 },
      estimatedTotal: 3200,
      tags: ['Solo', 'Adventure', 'Culture'],
    },
    {
      id: '3',
      destination: 'Dubai',
      country: 'UAE',
      startDate: '2025-03-10',
      endDate: '2025-03-17',
      createdAt: '2025-01-08T09:15:00Z',
      budget: 'Luxury',
      travelers: 4,
      status: 'booked',
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
      items: { hotels: 1, flights: 1, activities: 6, restaurants: 5 },
      estimatedTotal: 8900,
      tags: ['Family', 'Luxury', 'Shopping'],
      isFavorite: false,
    },
  ];
}