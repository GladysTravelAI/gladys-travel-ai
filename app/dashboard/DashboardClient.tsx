"use client";

import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  MapPin, Calendar, DollarSign, Plane, Hotel, 
  Camera, Edit2, Settings, Bookmark, TrendingUp,
  Globe, Award, Star, ChevronRight
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    tripsPlanned: 12,
    destinationsVisited: 8,
    totalSpent: 24500,
    upcomingTrips: 2
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-48"></div>

        <div className="max-w-5xl mx-auto px-4 -mt-32">
          {/* Profile Card */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                  {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'T'}
                </div>
                <button className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-lg">
                  <Camera size={18} className="text-gray-700" />
                </button>
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-semibold text-gray-900 mb-1">
                  {user.displayName || 'Traveler'}
                </h1>
                <p className="text-gray-600 mb-4">{user.email}</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" className="rounded-xl">
                    <Edit2 size={16} className="mr-2" />
                    Edit Profile
                  </Button>
                  <Link href="/settings">
                    <Button variant="outline" className="rounded-xl">
                      <Settings size={16} className="mr-2" />
                      Settings
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Badge */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="text-yellow-600" size={24} />
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-semibold text-gray-900">Explorer</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((i) => (
                    <Star key={i} className="text-yellow-500 fill-yellow-500" size={16} />
                  ))}
                  {[4, 5].map((i) => (
                    <Star key={i} className="text-gray-300" size={16} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={MapPin}
              label="Destinations"
              value={stats.destinationsVisited}
              color="from-blue-500 to-blue-600"
            />
            <StatCard
              icon={Calendar}
              label="Trips Planned"
              value={stats.tripsPlanned}
              color="from-purple-500 to-purple-600"
            />
            <StatCard
              icon={DollarSign}
              label="Total Spent"
              value={`$${(stats.totalSpent / 1000).toFixed(1)}k`}
              color="from-green-500 to-green-600"
            />
            <StatCard
              icon={TrendingUp}
              label="Upcoming"
              value={stats.upcomingTrips}
              color="from-orange-500 to-orange-600"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Upcoming Trips */}
            <QuickActionCard
              title="Upcoming Trips"
              description="You have 2 trips planned"
              icon={Calendar}
              color="blue"
              href="/saved-trips"
            />
            {/* Saved Items */}
            <QuickActionCard
              title="Saved Items"
              description="24 hotels, flights, and activities"
              icon={Bookmark}
              color="purple"
              href="/saved-trips"
            />
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Recent Activity</h2>
              <Link href="/saved-trips">
                <Button variant="ghost" className="text-blue-600">
                  View All
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </Link>
            </div>
            
            <div className="space-y-4">
              <ActivityItem
                icon={Plane}
                title="Booked flight to Paris"
                time="2 days ago"
                color="blue"
              />
              <ActivityItem
                icon={Hotel}
                title="Saved hotel in Tokyo"
                time="5 days ago"
                color="purple"
              />
              <ActivityItem
                icon={MapPin}
                title="Created Dubai itinerary"
                time="1 week ago"
                color="green"
              />
            </div>
          </div>

          {/* Travel Preferences */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Travel Preferences</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <PreferenceItem label="Default Budget" value="Mid-range" />
              <PreferenceItem label="Preferred Airline" value="Any" />
              <PreferenceItem label="Travel Style" value="Adventure" />
              <PreferenceItem label="Group Size" value="Solo / Couple" />
            </div>
            <Button variant="outline" className="w-full mt-4 rounded-xl">
              Update Preferences
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
        <Icon className="text-white" size={24} />
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

function QuickActionCard({ title, description, icon: Icon, color, href }: any) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600'
  };

  return (
    <Link href={href}>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 bg-gradient-to-br ${colors[color as keyof typeof colors]} rounded-xl flex items-center justify-center shadow-lg`}>
            <Icon className="text-white" size={28} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-gray-600">{description}</p>
          </div>
          <ChevronRight className="text-gray-400" size={20} />
        </div>
      </div>
    </Link>
  );
}

function ActivityItem({ icon: Icon, title, time, color }: any) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600'
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colors[color as keyof typeof colors]}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{time}</p>
      </div>
    </div>
  );
}

function PreferenceItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-gray-50 rounded-xl">
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );
}