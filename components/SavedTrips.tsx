"use client";

import { useState, useEffect } from "react";
import { Bookmark, Trash2, ExternalLink, Calendar, MapPin, DollarSign, Plus, Search, Filter, Hotel, Plane, Activity, Utensils, Eye, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Link from "next/link";

interface SavedTrip {
  id: string;
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  budget: string;
  travelers: number;
  status: 'planning' | 'booked' | 'completed';
  image?: string;
  items: {
    hotels: number;
    flights: number;
    activities: number;
    restaurants: number;
  };
  estimatedTotal: number;
}

export default function SavedTrips() {
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'planning' | 'booked' | 'completed'>('all');

  useEffect(() => {
    // Simulate loading saved trips
    // In production, fetch from your API or local storage
    setTimeout(() => {
      setTrips([
        {
          id: '1',
          destination: 'Paris',
          country: 'France',
          startDate: '2025-06-15',
          endDate: '2025-06-22',
          createdAt: '2025-01-10',
          budget: 'Luxury',
          travelers: 2,
          status: 'planning',
          image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
          items: { hotels: 2, flights: 1, activities: 5, restaurants: 3 },
          estimatedTotal: 5400
        },
        {
          id: '2',
          destination: 'Tokyo',
          country: 'Japan',
          startDate: '2025-08-01',
          endDate: '2025-08-10',
          createdAt: '2025-01-12',
          budget: 'Mid-range',
          travelers: 1,
          status: 'planning',
          image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
          items: { hotels: 1, flights: 1, activities: 8, restaurants: 4 },
          estimatedTotal: 3200
        },
        {
          id: '3',
          destination: 'Dubai',
          country: 'UAE',
          startDate: '2025-03-10',
          endDate: '2025-03-17',
          createdAt: '2025-01-08',
          budget: 'Luxury',
          travelers: 4,
          status: 'booked',
          image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800',
          items: { hotels: 1, flights: 1, activities: 6, restaurants: 5 },
          estimatedTotal: 8900
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleDeleteTrip = (tripId: string) => {
    if (confirm('Are you sure you want to delete this trip?')) {
      setTrips(trips.filter(trip => trip.id !== tripId));
    }
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trip.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || trip.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'booked': return 'bg-green-100 text-green-700 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">My Saved Trips</h1>
              <p className="text-white/90">Plan, save, and book your dream vacations</p>
            </div>
            <Link href="/">
              <Button className="bg-white text-purple-600 hover:bg-white/90">
                <Plus size={20} className="mr-2" />
                Plan New Trip
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="max-w-7xl mx-auto px-6 -mt-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 rounded-xl border-gray-200 w-full"
              />
            </div>

            {/* Status Filter */}
            <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)} className="w-full md:w-auto">
              <TabsList className="bg-gray-100 p-1 rounded-xl w-full md:w-auto">
                <TabsTrigger value="all" className="rounded-lg px-6">All</TabsTrigger>
                <TabsTrigger value="planning" className="rounded-lg px-6">Planning</TabsTrigger>
                <TabsTrigger value="booked" className="rounded-lg px-6">Booked</TabsTrigger>
                <TabsTrigger value="completed" className="rounded-lg px-6">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Trips Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bookmark className="text-gray-400" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Trips Found</h2>
            <p className="text-gray-600 mb-6">
              {searchQuery ? 'Try a different search term' : 'Start planning your first adventure!'}
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                <Plus size={20} className="mr-2" />
                Plan Your First Trip
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onDelete={() => handleDeleteTrip(trip.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats Section */}
      {trips.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Travel Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard
                icon={MapPin}
                label="Destinations"
                value={trips.length}
                color="purple"
              />
              <StatCard
                icon={Calendar}
                label="Days Traveling"
                value={trips.reduce((sum, trip) => {
                  const days = Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24));
                  return sum + days;
                }, 0)}
                color="blue"
              />
              <StatCard
                icon={DollarSign}
                label="Total Budget"
                value={`$${trips.reduce((sum, trip) => sum + trip.estimatedTotal, 0).toLocaleString()}`}
                color="green"
              />
              <StatCard
                icon={Bookmark}
                label="Saved Items"
                value={trips.reduce((sum, trip) => 
                  sum + trip.items.hotels + trip.items.flights + trip.items.activities + trip.items.restaurants, 0
                )}
                color="pink"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Trip Card Component
function TripCard({ trip, onDelete }: { trip: SavedTrip; onDelete: () => void }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {trip.image ? (
          <img
            src={trip.image}
            alt={trip.destination}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        
        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <Badge className={`${getStatusColor(trip.status)} border capitalize`}>
            {trip.status}
          </Badge>
        </div>

        {/* Destination Name */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-bold text-white mb-1">{trip.destination}</h3>
          <p className="text-white/90 text-sm">{trip.country}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Dates */}
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <Calendar size={16} className="mr-2" />
          <span>
            {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4 pb-4 border-b border-gray-200">
          <div className="text-center">
            <Hotel className="mx-auto text-purple-600 mb-1" size={18} />
            <p className="text-xs font-semibold text-gray-900">{trip.items.hotels}</p>
            <p className="text-xs text-gray-500">Hotels</p>
          </div>
          <div className="text-center">
            <Plane className="mx-auto text-blue-600 mb-1" size={18} />
            <p className="text-xs font-semibold text-gray-900">{trip.items.flights}</p>
            <p className="text-xs text-gray-500">Flights</p>
          </div>
          <div className="text-center">
            <Activity className="mx-auto text-green-600 mb-1" size={18} />
            <p className="text-xs font-semibold text-gray-900">{trip.items.activities}</p>
            <p className="text-xs text-gray-500">Things</p>
          </div>
          <div className="text-center">
            <Utensils className="mx-auto text-orange-600 mb-1" size={18} />
            <p className="text-xs font-semibold text-gray-900">{trip.items.restaurants}</p>
            <p className="text-xs text-gray-500">Dining</p>
          </div>
        </div>

        {/* Budget & Travelers */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm">
            <span className="text-gray-600">Budget:</span>
            <span className="ml-2 font-semibold text-gray-900">{trip.budget}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Travelers:</span>
            <span className="ml-2 font-semibold text-gray-900">{trip.travelers}</span>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
          <span className="text-sm font-medium text-gray-700">Estimated Total:</span>
          <span className="text-xl font-bold text-purple-700">${trip.estimatedTotal.toLocaleString()}</span>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/?destination=${trip.destination}`}>
            <Button variant="outline" className="w-full">
              <Eye size={16} className="mr-2" />
              View Details
            </Button>
          </Link>
          <Button
            onClick={onDelete}
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} className="mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  color: string;
}) {
  const colorClasses = {
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    pink: 'from-pink-500 to-pink-600'
  };

  return (
    <div className="text-center">
      <div className={`w-16 h-16 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
        <Icon className="text-white" size={28} />
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'planning': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'booked': return 'bg-green-100 text-green-700 border-green-200';
    case 'completed': return 'bg-gray-100 text-gray-700 border-gray-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}