'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  MapPin,
  Calendar,
  DollarSign,
  Plane,
  Hotel,
  Camera,
  Edit2,
  Settings,
  Bookmark,
  TrendingUp,
  Globe,
  Award,
  Star,
  ChevronRight,
  Activity,
  Target,
  Trophy,
  Zap,
  Heart,
  User,
  Clock,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ==================== MAIN COMPONENT ====================

export default function DashboardClient() {
  const { user, loading, userProfile } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    tripsPlanned: 0,
    destinationsVisited: 0,
    totalSpent: 0,
    upcomingTrips: 0,
    points: 0,
  });
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && userProfile) {
      // Load real stats from userProfile
      setStats({
        tripsPlanned: userProfile.totalTripsPlanned || 0,
        destinationsVisited: userProfile.totalDestinations || 0,
        totalSpent: userProfile.totalSpent || 0,
        upcomingTrips: userProfile.upcomingEvents?.length || 0,
        points: userProfile.points || 0,
      });

      // Calculate profile completion
      const completion = calculateProfileCompletion(userProfile);
      setProfileCompletion(completion);
    }
  }, [user, userProfile]);

  const calculateProfileCompletion = (profile: any) => {
    let completed = 0;
    const total = 8;

    if (profile.name) completed++;
    if (profile.email) completed++;
    if (profile.preferredActivities?.length > 0) completed++;
    if (profile.budgetRange) completed++;
    if (profile.preferredTripTypes?.length > 0) completed++;
    if (profile.interests?.length > 0) completed++;
    if (profile.visitedDestinations?.length > 0) completed++;
    if (profile.profileImage) completed++;

    return Math.round((completed / total) * 100);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full animate-spin mx-auto mb-4"
            style={{
              background: 'linear-gradient(45deg, #9333ea, #ec4899)',
              WebkitMask: 'radial-gradient(farthest-side,#0000 calc(100% - 8px),#000 0)',
            }}
          ></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) return null;

  const userLevel = Math.floor((stats.points || 0) / 100) + 1;
  const nextLevelPoints = userLevel * 100;
  const levelProgress = ((stats.points % 100) / 100) * 100;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50">
        {/* Animated Header Banner */}
        <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 h-64 overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '30px 30px',
              }}
            ></div>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                Welcome back, {user.displayName?.split(' ')[0] || 'Traveler'}! 👋
              </h1>
              <p className="text-white/90 text-lg">
                Ready for your next adventure?
              </p>
            </motion.div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 -mt-32 pb-12">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border-2 border-gray-200 shadow-xl p-8 mb-6"
          >
            <div className="flex flex-col lg:flex-row items-start gap-6">
              {/* Avatar & Info */}
              <div className="flex items-start gap-6 flex-1">
                {/* Avatar */}
                <div className="relative">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-5xl font-bold shadow-2xl"
                  >
                    {user.displayName?.charAt(0)?.toUpperCase() ||
                      user.email?.charAt(0)?.toUpperCase() ||
                      'T'}
                  </motion.div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-lg"
                  >
                    <Camera size={18} className="text-gray-700" />
                  </motion.button>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-1">
                        {user.displayName || 'Traveler'}
                      </h2>
                      <p className="text-gray-600 mb-2">{user.email}</p>
                      <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                        Level {userLevel} • {userProfile?.status || 'Explorer'}
                      </Badge>
                    </div>
                  </div>

                  {/* Profile Completion */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        Profile Completion
                      </span>
                      <span className="text-sm font-bold text-purple-600">
                        {profileCompletion}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${profileCompletion}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                      ></motion.div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => setShowEditProfile(true)}
                      variant="outline"
                      className="rounded-xl"
                    >
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
              </div>

              {/* Level & XP Card */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 min-w-[280px]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                    <Trophy className="text-white" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Your Level</p>
                    <p className="text-2xl font-bold text-gray-900">Level {userLevel}</p>
                  </div>
                </div>

                {/* XP Progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-600">
                      {stats.points} XP
                    </span>
                    <span className="text-xs font-semibold text-gray-600">
                      {nextLevelPoints} XP
                    </span>
                  </div>
                  <div className="w-full h-3 bg-white rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${levelProgress}%` }}
                      transition={{ duration: 1, delay: 0.7 }}
                      className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                    ></motion.div>
                  </div>
                </div>

                <p className="text-xs text-gray-600 text-center">
                  {nextLevelPoints - stats.points} XP to Level {userLevel + 1}
                </p>

                {/* Achievement Stars */}
                <div className="flex items-center justify-center gap-1 mt-4 pt-4 border-t border-purple-200">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star
                      key={i}
                      className={
                        i <= Math.floor(userLevel / 2)
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300'
                      }
                      size={18}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Animated Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <AnimatedStatCard
              icon={MapPin}
              label="Destinations"
              value={stats.destinationsVisited}
              color="from-blue-500 to-cyan-600"
              delay={0.1}
            />
            <AnimatedStatCard
              icon={Calendar}
              label="Trips Planned"
              value={stats.tripsPlanned}
              color="from-purple-500 to-pink-600"
              delay={0.2}
            />
            <AnimatedStatCard
              icon={DollarSign}
              label="Total Spent"
              value={`$${(stats.totalSpent / 1000).toFixed(1)}k`}
              color="from-green-500 to-emerald-600"
              delay={0.3}
              prefix="$"
            />
            <AnimatedStatCard
              icon={TrendingUp}
              label="Upcoming"
              value={stats.upcomingTrips}
              color="from-orange-500 to-red-600"
              delay={0.4}
            />
          </div>

          {/* Achievements Section */}
          {userProfile?.achievements && userProfile.achievements.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-3xl border-2 border-gray-200 p-6 mb-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Award className="text-yellow-600" size={28} />
                  Achievements
                </h2>
                <Badge className="bg-yellow-100 text-yellow-700">
                  {userProfile.achievements.length} Unlocked
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {userProfile.achievements.map((achievement: any, idx: number) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + idx * 0.1 }}
                    className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl"
                  >
                    <div className="text-4xl mb-2">{achievement.icon}</div>
                    <p className="font-bold text-gray-900 text-sm mb-1">
                      {achievement.name}
                    </p>
                    <p className="text-xs text-gray-600">{achievement.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <QuickActionCard
              title="Plan New Trip"
              description="Start planning your next adventure"
              icon={Sparkles}
              color="purple"
              href="/"
            />
            <QuickActionCard
              title="Saved Trips"
              description={`${stats.tripsPlanned} trips saved`}
              icon={Bookmark}
              color="blue"
              href="/saved-trips"
            />
            <QuickActionCard
              title="Explore Destinations"
              description="Discover new places to visit"
              icon={Globe}
              color="green"
              href="/"
            />
          </div>

          {/* Recent Activity & Travel Preferences Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-3xl border-2 border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
                <Link href="/saved-trips">
                  <Button variant="ghost" className="text-purple-600 hover:text-purple-700">
                    View All
                    <ChevronRight size={16} className="ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {userProfile?.bookingHistory?.slice(0, 5).map((booking: any, idx: number) => (
                  <ActivityItem
                    key={idx}
                    icon={getBookingIcon(booking.type)}
                    title={booking.itemName || booking.name || 'Booking'}
                    time={getTimeAgo(booking.timestamp || booking.date)}
                    color={getBookingColor(booking.type)}
                  />
                )) || (
                  <>
                    <ActivityItem
                      icon={Plane}
                      title="No recent activity"
                      time="Start planning a trip!"
                      color="gray"
                    />
                  </>
                )}
              </div>
            </motion.div>

            {/* Travel Preferences */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-3xl border-2 border-gray-200 p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Travel Preferences</h2>
              <div className="space-y-3">
                <PreferenceItem
                  label="Budget Range"
                  value={userProfile?.budgetRange || 'Not set'}
                  icon={DollarSign}
                />
                <PreferenceItem
                  label="Travel Style"
                  value={userProfile?.preferredTripTypes?.[0] || 'Adventure'}
                  icon={Heart}
                />
                <PreferenceItem
                  label="Preferred Activities"
                  value={
                    userProfile?.preferredActivities?.slice(0, 2).join(', ') || 'Not set'
                  }
                  icon={Activity}
                />
                <PreferenceItem
                  label="Group Type"
                  value={userProfile?.typicalGroupType || 'Solo'}
                  icon={User}
                />
              </div>
              <Link href="/settings">
                <Button variant="outline" className="w-full mt-4 rounded-xl">
                  Update Preferences
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

// ==================== ANIMATED STAT CARD ====================

function AnimatedStatCard({
  icon: Icon,
  label,
  value,
  color,
  delay,
  prefix = '',
}: any) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (typeof value === 'number') {
      const duration = 1000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setDisplayValue(value);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg hover:shadow-xl transition-shadow"
    >
      <div
        className={`w-14 h-14 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}
      >
        <Icon className="text-white" size={28} />
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">
        {typeof value === 'number' ? displayValue : value}
      </p>
      <p className="text-sm text-gray-600">{label}</p>
    </motion.div>
  );
}

// ==================== QUICK ACTION CARD ====================

function QuickActionCard({ title, description, icon: Icon, color, href }: any) {
  const colors = {
    purple: 'from-purple-500 to-pink-600',
    blue: 'from-blue-500 to-cyan-600',
    green: 'from-green-500 to-emerald-600',
  };

  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.03, y: -5 }}
        whileTap={{ scale: 0.98 }}
        className="bg-white rounded-2xl border-2 border-gray-200 p-6 hover:shadow-xl transition-all cursor-pointer group"
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-14 h-14 bg-gradient-to-br ${
              colors[color as keyof typeof colors]
            } rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
          >
            <Icon className="text-white" size={28} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
              {title}
            </h3>
            <p className="text-gray-600 text-sm">{description}</p>
          </div>
          <ArrowUpRight className="text-gray-400 group-hover:text-purple-600 transition-colors" size={20} />
        </div>
      </motion.div>
    </Link>
  );
}

// ==================== ACTIVITY ITEM ====================

function ActivityItem({ icon: Icon, title, time, color }: any) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <motion.div
      whileHover={{ x: 5 }}
      className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${
          colors[color as keyof typeof colors]
        }`}
      >
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </motion.div>
  );
}

// ==================== PREFERENCE ITEM ====================

function PreferenceItem({ label, value, icon: Icon }: any) {
  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
        <Icon size={18} className="text-purple-600" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-gray-600 mb-0.5">{label}</p>
        <p className="font-semibold text-gray-900 text-sm">{value}</p>
      </div>
    </div>
  );
}

// ==================== HELPER FUNCTIONS ====================

function getBookingIcon(type: string) {
  const icons: Record<string, any> = {
    hotel: Hotel,
    flight: Plane,
    activity: Activity,
    restaurant: Activity,
  };
  return icons[type] || Activity;
}

function getBookingColor(type: string) {
  const colors: Record<string, string> = {
    hotel: 'blue',
    flight: 'purple',
    activity: 'green',
    restaurant: 'orange',
  };
  return colors[type] || 'blue';
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}