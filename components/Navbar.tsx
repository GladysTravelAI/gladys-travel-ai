"use client";

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { User, LogOut, Settings, Sparkles, ShoppingCart, Trophy, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, userProfile, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load cart count from localStorage
  useEffect(() => {
    const savedContext = localStorage.getItem('gladys-agent-context');
    if (savedContext) {
      const context = JSON.parse(savedContext);
      setCartCount(context.savedCarts?.length || 0);
      setNotifications(context.watchlist?.filter((w: any) => w.alertEnabled).length || 0);
    }
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border-b border-zinc-200/50 dark:border-zinc-700/50 shadow-lg' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo - Apple Style */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11">
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 via-rose-400 to-purple-500 opacity-60 blur-md group-hover:opacity-80 transition-opacity"></div>
              
              {/* Main logo */}
              <div className="relative w-full h-full bg-gradient-to-br from-amber-500 via-rose-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent group-hover:from-amber-600 group-hover:to-purple-600 transition-all">
                Gladys
              </h1>
              <p className="text-[10px] font-semibold tracking-wider uppercase bg-gradient-to-r from-amber-600 to-purple-600 bg-clip-text text-transparent">
                Travel AI
              </p>
            </div>
          </Link>

          {/* Navigation Links - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              href="/" 
              className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link 
              href="/events" 
              className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
            >
              Explore Events
            </Link>
            <Link 
              href="/trips" 
              className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
            >
              My Trips
            </Link>
            <Link 
              href="/about" 
              className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
            >
              How It Works
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Cart Icon */}
            {user && (
              <Link href="/cart" className="relative p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                <ShoppingCart size={20} className="text-zinc-700 dark:text-zinc-300" />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-400 to-teal-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </Link>
            )}

            {/* Notifications */}
            {user && (
              <button className="relative p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                <Bell size={20} className="text-zinc-700 dark:text-zinc-300" />
                {notifications > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-400 to-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                  >
                    {notifications}
                  </motion.span>
                )}
              </button>
            )}

            {user ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl px-3 py-2 transition-all"
                >
                  {userProfile?.profileImage ? (
                    <img
                      src={userProfile.profileImage}
                      alt={userProfile.name || 'User'}
                      className="w-9 h-9 rounded-full object-cover border-2 border-amber-500"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {userProfile?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {userProfile?.name || 'Traveler'}
                    </p>
                    <div className="flex items-center gap-1">
                      <Trophy size={12} className="text-amber-500" />
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {userProfile?.status || 'Explorer'}
                      </p>
                    </div>
                  </div>
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
                      >
                        {/* Profile Header */}
                        <div className="p-5 bg-gradient-to-r from-amber-50 via-rose-50 to-purple-50 dark:from-zinc-800 dark:to-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                          <div className="flex items-center gap-3 mb-3">
                            {userProfile?.profileImage ? (
                              <img
                                src={userProfile.profileImage}
                                alt={userProfile.name || 'User'}
                                className="w-14 h-14 rounded-full object-cover border-2 border-amber-500"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {userProfile?.name?.[0]?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-bold text-zinc-900 dark:text-white">
                                {userProfile?.name || 'Traveler'}
                              </p>
                              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="flex-1 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-rose-100 dark:from-amber-900/30 dark:to-rose-900/30 text-amber-900 dark:text-amber-100 rounded-lg text-xs font-bold flex items-center gap-1">
                              <Trophy size={12} />
                              {userProfile?.status || 'Explorer'}
                            </span>
                            <span className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-semibold">
                              {userProfile?.totalTripsPlanned || 0} trips
                            </span>
                          </div>
                        </div>
                        
                        {/* Menu Items */}
                        <div className="py-2">
                          <Link
                            href="/profile"
                            onClick={() => setShowMenu(false)}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <User size={18} className="text-zinc-600 dark:text-zinc-400" />
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">View Profile</span>
                          </Link>
                          
                          <Link
                            href="/trips"
                            onClick={() => setShowMenu(false)}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <Trophy size={18} className="text-zinc-600 dark:text-zinc-400" />
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">My Trips</span>
                          </Link>
                          
                          <Link
                            href="/settings"
                            onClick={() => setShowMenu(false)}
                            className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            <Settings size={18} className="text-zinc-600 dark:text-zinc-400" />
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Settings</span>
                          </Link>
                          
                          <div className="my-2 border-t border-zinc-200 dark:border-zinc-700"></div>
                          
                          <button
                            onClick={() => {
                              logout();
                              setShowMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                          >
                            <LogOut size={18} className="text-red-600" />
                            <span className="text-sm font-medium text-red-600">Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors px-4 py-2"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-600 hover:via-rose-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg text-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}