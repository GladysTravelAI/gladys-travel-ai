'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Bookmark,
  Trash2,
  Calendar,
  MapPin,
  Plus,
  Search,
  Hotel,
  Plane,
  Eye,
  Download,
  Share2,
  Copy,
  Archive,
  Clock,
  Heart,
  AlertCircle,
  Trophy,
  Music,
  PartyPopper,
  Sparkles,
  MoreVertical,
  ArrowRight,
  Ticket,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';

// ==================== TYPES ====================

interface SavedTrip {
  id: string;
  destination: string;
  country: string;
  eventName?: string;
  eventType?: 'sports' | 'music' | 'festivals' | 'other';
  eventDate?: string;
  venue?: string;
  startDate: string;
  endDate: string;
  createdAt: string;
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
  currency?: string;
  tags?: string[];
  isFavorite?: boolean;
}

type SortOption = 'date' | 'budget' | 'destination' | 'created';
type FilterStatus = 'all' | 'planning' | 'booked' | 'completed' | 'archived';

// ==================== EVENT CONFIG ====================

const EVENT_CONFIG = {
  sports: {
    icon: Trophy,
    label: 'Sports',
    gradient: 'from-blue-600 to-cyan-500',
    light: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  music: {
    icon: Music,
    label: 'Music',
    gradient: 'from-purple-600 to-pink-500',
    light: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  festivals: {
    icon: PartyPopper,
    label: 'Festival',
    gradient: 'from-orange-500 to-rose-500',
    light: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  other: {
    icon: Sparkles,
    label: 'Event',
    gradient: 'from-slate-500 to-slate-600',
    light: 'bg-slate-50 text-slate-700 border-slate-200',
  },
};

const STATUS_CONFIG = {
  planning: { label: 'Planning', dot: 'bg-blue-500' },
  booked: { label: 'Booked', dot: 'bg-green-500' },
  completed: { label: 'Completed', dot: 'bg-gray-400' },
  archived: { label: 'Archived', dot: 'bg-orange-400' },
};

// ==================== MAIN COMPONENT ====================

export default function SavedTrips() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    loadTrips();
  }, [user]);

  // Close menu when clicking outside
  useEffect(() => {
    const handler = () => setActiveMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const storageKey = `gladys_saved_trips_${user?.uid || 'guest'}`;

  const loadTrips = async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem(storageKey);
      setTrips(stored ? JSON.parse(stored) : getDemoTrips());
    } catch {
      toast.error('Could not load your saved trips');
    } finally {
      setLoading(false);
    }
  };

  const persist = (updated: SavedTrip[]) => {
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setTrips(updated);
  };

  const handleDelete = (id: string) => {
    const trip = trips.find(t => t.id === id)!;
    const next = trips.filter(t => t.id !== id);
    persist(next);
    toast.success('Trip removed', {
      action: { label: 'Undo', onClick: () => persist([...next, trip]) },
    });
  };

  const handleFavorite = (id: string) => {
    const next = trips.map(t => t.id === id ? { ...t, isFavorite: !t.isFavorite } : t);
    persist(next);
    const trip = next.find(t => t.id === id);
    toast.success(trip?.isFavorite ? '❤️ Added to favorites' : 'Removed from favorites');
  };

  const handleArchive = (id: string) => {
    const next = trips.map(t =>
      t.id === id ? { ...t, status: (t.status === 'archived' ? 'planning' : 'archived') as SavedTrip['status'] } : t
    );
    persist(next);
    const trip = next.find(t => t.id === id);
    toast.success(trip?.status === 'archived' ? 'Trip archived' : 'Trip restored');
  };

  const handleDuplicate = (id: string) => {
    const trip = trips.find(t => t.id === id)!;
    persist([{ ...trip, id: Date.now().toString(), destination: `${trip.destination} (Copy)`, createdAt: new Date().toISOString(), status: 'planning' }, ...trips]);
    toast.success('Trip duplicated');
  };

  const handleExport = (id: string) => {
    const trip = trips.find(t => t.id === id)!;
    const blob = new Blob([JSON.stringify(trip, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trip.destination.toLowerCase().replace(/\s+/g, '-')}-trip.json`;
    a.click();
    toast.success('Trip exported');
  };

  const handleShare = async (id: string) => {
    const trip = trips.find(t => t.id === id)!;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${trip.destination} Trip`, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    } catch {}
  };

  const filtered = useMemo(() => {
    let r = [...trips];
    if (searchQuery) r = r.filter(t =>
      t.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.eventName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filterStatus !== 'all') r = r.filter(t => t.status === filterStatus);
    if (showFavoritesOnly) r = r.filter(t => t.isFavorite);
    r.sort((a, b) => {
      if (sortBy === 'date') return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      if (sortBy === 'budget') return b.estimatedTotal - a.estimatedTotal;
      if (sortBy === 'destination') return a.destination.localeCompare(b.destination);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return r;
  }, [trips, searchQuery, filterStatus, showFavoritesOnly, sortBy]);

  const stats = useMemo(() => {
    const active = trips.filter(t => t.status !== 'archived');
    return {
      total: active.length,
      upcoming: active.filter(t => new Date(t.startDate) > new Date() && t.status !== 'completed').length,
      totalSpend: active.reduce((s, t) => s + t.estimatedTotal, 0),
      favorites: trips.filter(t => t.isFavorite).length,
    };
  }, [trips]);

  const FILTER_TABS: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'planning', label: 'Planning' },
    { value: 'booked', label: 'Booked' },
    { value: 'completed', label: 'Completed' },
    { value: 'archived', label: 'Archived' },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* ==================== HEADER ==================== */}
      <div className="bg-gray-950 px-6 pt-16 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-gray-500 text-sm font-semibold uppercase tracking-widest mb-3">GladysTravel</p>
              <h1 className="text-5xl font-black text-white tracking-tight leading-none mb-3">
                My Trips
              </h1>
              <p className="text-gray-400 text-lg">
                {stats.total} saved · {stats.upcoming} upcoming
              </p>
            </div>
            <Link href="/">
              <button className="flex items-center gap-2 bg-white text-gray-950 font-bold px-5 py-3 rounded-2xl hover:bg-gray-100 transition-colors text-sm mt-2">
                <Plus size={16} />
                New Trip
              </button>
            </Link>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              { label: 'Saved Trips', value: stats.total },
              { label: 'Upcoming', value: stats.upcoming },
              { label: 'Est. Spend', value: `$${(stats.totalSpend / 1000).toFixed(1)}k` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/5 rounded-2xl px-5 py-4 border border-white/10">
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== CONTROLS ==================== */}
      <div className="max-w-6xl mx-auto px-6 -mt-6 mb-8">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-5 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                placeholder="Search trips, events, destinations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="px-4 py-3 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none bg-white"
            >
              <option value="date">By Date</option>
              <option value="budget">By Budget</option>
              <option value="destination">A–Z</option>
              <option value="created">Recently Added</option>
            </select>
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-4 py-3 rounded-2xl text-sm font-semibold border transition-all flex items-center gap-2 ${
                showFavoritesOnly
                  ? 'bg-rose-500 text-white border-rose-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              <Heart size={15} fill={showFavoritesOnly ? 'white' : 'none'} />
              {stats.favorites}
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setFilterStatus(tab.value)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  filterStatus === tab.value
                    ? 'bg-gray-950 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== GRID ==================== */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-100 rounded-3xl h-80 animate-pulse" />
              ))}
            </motion.div>
          ) : filtered.length === 0 ? (
            <EmptyState searchQuery={searchQuery} filterStatus={filterStatus} showFavoritesOnly={showFavoritesOnly} />
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {filtered.map((trip, idx) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  index={idx}
                  isMenuOpen={activeMenu === trip.id}
                  onMenuToggle={(e) => {
                    e.stopPropagation();
                    setActiveMenu(activeMenu === trip.id ? null : trip.id);
                  }}
                  onDelete={() => handleDelete(trip.id)}
                  onFavorite={() => handleFavorite(trip.id)}
                  onArchive={() => handleArchive(trip.id)}
                  onDuplicate={() => handleDuplicate(trip.id)}
                  onExport={() => handleExport(trip.id)}
                  onShare={() => handleShare(trip.id)}
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

function TripCard({
  trip, index, isMenuOpen,
  onMenuToggle, onDelete, onFavorite, onArchive, onDuplicate, onExport, onShare
}: {
  trip: SavedTrip;
  index: number;
  isMenuOpen: boolean;
  onMenuToggle: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onFavorite: () => void;
  onArchive: () => void;
  onDuplicate: () => void;
  onExport: () => void;
  onShare: () => void;
}) {
  const eventCfg = EVENT_CONFIG[trip.eventType || 'other'];
  const EventIcon = eventCfg.icon;
  const status = STATUS_CONFIG[trip.status];
  const cur = trip.currency || 'USD';
  const nights = Math.max(1, Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group"
    >
      {/* Image / Gradient top */}
      <div className="relative h-44 overflow-hidden">
        {trip.image ? (
          <img
            src={trip.image}
            alt={trip.destination}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${eventCfg.gradient}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Top row */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/20">
            <EventIcon size={12} className="text-white" />
            <span className="text-white text-xs font-semibold">{eventCfg.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onFavorite}
              className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
                trip.isFavorite ? 'bg-rose-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Heart size={14} fill={trip.isFavorite ? 'white' : 'none'} />
            </button>
            <div className="relative">
              <button
                onClick={onMenuToggle}
                className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all"
              >
                <MoreVertical size={14} />
              </button>
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -5 }}
                    className="absolute right-0 top-10 w-44 bg-white rounded-2xl shadow-2xl border border-gray-100 py-1.5 z-20"
                  >
                    {[
                      { icon: Copy, label: 'Duplicate', action: onDuplicate },
                      { icon: Download, label: 'Export', action: onExport },
                      { icon: Share2, label: 'Share', action: onShare },
                      { icon: Archive, label: trip.status === 'archived' ? 'Restore' : 'Archive', action: onArchive },
                    ].map(({ icon: Icon, label, action }) => (
                      <button
                        key={label}
                        onClick={action}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-700 font-medium"
                      >
                        <Icon size={14} className="text-gray-400" />
                        {label}
                      </button>
                    ))}
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={onDelete}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 flex items-center gap-3 text-red-600 font-medium"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="absolute bottom-3 left-4 right-4">
          <div className="flex items-center gap-1.5 mb-1">
            <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            <span className="text-white/70 text-xs font-medium">{status.label}</span>
          </div>
          <h3 className="text-white font-black text-xl leading-tight">
            {trip.eventName || trip.destination}
          </h3>
          {trip.eventName && (
            <p className="text-white/70 text-xs mt-0.5 flex items-center gap-1">
              <MapPin size={11} />
              {trip.destination}, {trip.country}
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">

        {/* Date + nights */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar size={14} className="text-gray-400" />
            <span>
              {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {' – '}
              {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
            {nights}n
          </span>
        </div>

        {/* Saved items */}
        <div className="flex items-center gap-3">
          {[
            { icon: Hotel, val: trip.items.hotels, label: 'hotels' },
            { icon: Plane, val: trip.items.flights, label: 'flights' },
            { icon: Ticket, val: trip.items.activities, label: 'activities' },
          ].filter(i => i.val > 0).map(({ icon: Icon, val, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-xl">
              <Icon size={12} className="text-gray-400" />
              <span className="font-semibold text-gray-700">{val}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Budget + CTA */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400 font-medium">Est. Total</p>
            <p className="text-xl font-black text-gray-950">
              {cur} {trip.estimatedTotal.toLocaleString()}
            </p>
          </div>
          <Link href={`/?destination=${trip.destination}`}>
            <button className="flex items-center gap-2 bg-gray-950 text-white text-sm font-bold px-4 py-2.5 rounded-2xl hover:bg-gray-800 transition-colors">
              View <ChevronRight size={15} />
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ==================== EMPTY STATE ====================

function EmptyState({ searchQuery, filterStatus, showFavoritesOnly }: {
  searchQuery: string;
  filterStatus: string;
  showFavoritesOnly: boolean;
}) {
  const isFiltered = searchQuery || filterStatus !== 'all' || showFavoritesOnly;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-24"
    >
      <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
        {isFiltered ? <AlertCircle className="text-gray-400" size={32} /> : <Bookmark className="text-gray-400" size={32} />}
      </div>
      <h2 className="text-2xl font-black text-gray-950 mb-2">
        {isFiltered ? 'No trips found' : 'No saved trips yet'}
      </h2>
      <p className="text-gray-500 mb-8 max-w-sm mx-auto">
        {searchQuery
          ? `No results for "${searchQuery}"`
          : filterStatus !== 'all'
          ? `No ${filterStatus} trips`
          : showFavoritesOnly
          ? 'No favorites yet — heart a trip to save it here'
          : 'Search for an event above to start planning'}
      </p>
      <Link href="/">
        <button className="flex items-center gap-2 bg-gray-950 text-white font-bold px-6 py-3.5 rounded-2xl hover:bg-gray-800 transition-colors mx-auto">
          <Plus size={18} />
          Plan Your First Trip
        </button>
      </Link>
    </motion.div>
  );
}

// ==================== DEMO DATA (event-centric) ====================

function getDemoTrips(): SavedTrip[] {
  return [
    {
      id: '1',
      destination: 'New York',
      country: 'United States',
      eventName: 'FIFA World Cup 2026 — Final',
      eventType: 'sports',
      eventDate: '2026-07-19',
      venue: 'MetLife Stadium',
      startDate: '2026-07-17',
      endDate: '2026-07-21',
      createdAt: new Date().toISOString(),
      budget: 'Luxury',
      travelers: 2,
      status: 'planning',
      image: 'https://images.unsplash.com/photo-1508098682722-e99c643e7f0b?w=800',
      items: { hotels: 1, flights: 1, activities: 3, restaurants: 2 },
      estimatedTotal: 4200,
      currency: 'USD',
      tags: ['World Cup', 'Football', 'NYC'],
      isFavorite: true,
    },
    {
      id: '2',
      destination: 'Los Angeles',
      country: 'United States',
      eventName: 'Coachella Valley Music Festival',
      eventType: 'music',
      eventDate: '2026-04-11',
      venue: 'Empire Polo Club',
      startDate: '2026-04-10',
      endDate: '2026-04-14',
      createdAt: new Date().toISOString(),
      budget: 'Mid-range',
      travelers: 3,
      status: 'planning',
      image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800',
      items: { hotels: 1, flights: 1, activities: 5, restaurants: 4 },
      estimatedTotal: 2800,
      currency: 'USD',
      tags: ['Music', 'Festival', 'LA'],
    },
    {
      id: '3',
      destination: 'Rio de Janeiro',
      country: 'Brazil',
      eventName: 'Rio Carnival 2026',
      eventType: 'festivals',
      eventDate: '2026-02-16',
      venue: 'Sambadrome Marquês de Sapucaí',
      startDate: '2026-02-14',
      endDate: '2026-02-22',
      createdAt: new Date().toISOString(),
      budget: 'Mid-range',
      travelers: 2,
      status: 'booked',
      image: 'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=800',
      items: { hotels: 1, flights: 1, activities: 6, restaurants: 5 },
      estimatedTotal: 3500,
      currency: 'USD',
      tags: ['Carnival', 'Culture', 'Brazil'],
      isFavorite: true,
    },
  ];
}