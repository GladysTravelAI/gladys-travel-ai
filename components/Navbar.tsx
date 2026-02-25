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
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    try {
      const savedContext = localStorage.getItem('gladys-agent-context');
      if (savedContext) {
        const context = JSON.parse(savedContext);
        setCartCount(context.savedCarts?.length || 0);
        setNotifications(context.watchlist?.filter((w: any) => w.alertEnabled).length || 0);
      }
    } catch {}
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-2xl border-b border-slate-200/60 shadow-sm'
          : 'bg-white/70 backdrop-blur-md'
      }`}
      style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* ── LOGO ── */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11">
              <div className="absolute inset-0 rounded-full opacity-40 blur-md group-hover:opacity-60 transition-opacity" style={{ background: 'linear-gradient(135deg, #38BDF8, #0EA5E9)' }} />
              <div className="relative w-full h-full rounded-full flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
                <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
                Gladys
              </h1>
              <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#0EA5E9' }}>
                Travel AI
              </p>
            </div>
          </Link>

          {/* ── NAV LINKS ── */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Home', href: '/' },
              { label: 'Explore Events', href: '/events' },
              { label: 'My Trips', href: '/trips' },
              { label: 'How It Works', href: '/about' },
            ].map(l => (
              <Link key={l.label} href={l.href}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>

          {/* ── RIGHT ACTIONS ── */}
          <div className="flex items-center gap-2">

            {/* Cart */}
            {user && (
              <Link href="/cart" className="relative p-2.5 hover:bg-slate-100 rounded-xl transition-colors">
                <ShoppingCart size={20} className="text-slate-600" />
                {cartCount > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 text-white text-xs font-bold rounded-full flex items-center justify-center"
                    style={{ background: '#0EA5E9' }}>
                    {cartCount}
                  </motion.span>
                )}
              </Link>
            )}

            {/* Notifications */}
            {user && (
              <button className="relative p-2.5 hover:bg-slate-100 rounded-xl transition-colors">
                <Bell size={20} className="text-slate-600" />
                {notifications > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {notifications}
                  </motion.span>
                )}
              </button>
            )}

            {/* User menu / auth */}
            {user ? (
              <div className="relative">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 hover:bg-slate-100 rounded-xl px-3 py-2 transition-all">
                  {userProfile?.profileImage ? (
                    <img src={userProfile.profileImage} alt={userProfile.name || 'User'}
                      className="w-9 h-9 rounded-full object-cover border-2" style={{ borderColor: '#0EA5E9' }} />
                  ) : (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shadow"
                      style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
                      {userProfile?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-bold text-slate-900">{userProfile?.name || 'Traveler'}</p>
                    <div className="flex items-center gap-1">
                      <Trophy size={11} style={{ color: '#0EA5E9' }} />
                      <p className="text-xs text-slate-400">{userProfile?.status || 'Explorer'}</p>
                    </div>
                  </div>
                </motion.button>

                <AnimatePresence>
                  {showMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -8 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">

                        {/* Profile header */}
                        <div className="p-5 border-b border-slate-100" style={{ background: '#F0F9FF' }}>
                          <div className="flex items-center gap-3 mb-3">
                            {userProfile?.profileImage ? (
                              <img src={userProfile.profileImage} alt="" className="w-14 h-14 rounded-full border-2" style={{ borderColor: '#0EA5E9' }} />
                            ) : (
                              <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-lg shadow"
                                style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
                                {userProfile?.name?.[0]?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900">{userProfile?.name || 'Traveler'}</p>
                              <p className="text-sm text-slate-500">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="flex-1 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                              style={{ background: '#BAE6FD', color: '#0284C7' }}>
                              <Trophy size={11} />{userProfile?.status || 'Explorer'}
                            </span>
                            <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
                              {userProfile?.totalTripsPlanned || 0} trips
                            </span>
                          </div>
                        </div>

                        <div className="py-2">
                          {[
                            { icon: User, label: 'View Profile', href: '/profile' },
                            { icon: Trophy, label: 'My Trips', href: '/trips' },
                            { icon: Settings, label: 'Settings', href: '/settings' },
                          ].map(item => (
                            <Link key={item.label} href={item.href} onClick={() => setShowMenu(false)}
                              className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
                              <item.icon size={17} className="text-slate-500" />
                              <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                            </Link>
                          ))}
                          <div className="my-2 border-t border-slate-100" />
                          <button onClick={() => { logout(); setShowMenu(false); }}
                            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 transition-colors text-left">
                            <LogOut size={17} className="text-red-500" />
                            <span className="text-sm font-semibold text-red-500">Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors px-4 py-2">
                  Sign In
                </Link>
                <Link href="/signup"
                  className="px-5 py-2.5 text-white rounded-xl font-bold transition-opacity hover:opacity-90 shadow-md text-sm"
                  style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
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