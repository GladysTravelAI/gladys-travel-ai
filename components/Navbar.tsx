"use client";

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { User, LogOut, Settings } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, userProfile, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Gladys</h1>
              <p className="text-xs text-amber-600 font-semibold">Travel AI</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium transition">
              Home
            </Link>
            <Link href="/explore" className="text-gray-700 hover:text-blue-600 font-medium transition">
              Explore
            </Link>
            <Link href="/trips" className="text-gray-700 hover:text-blue-600 font-medium transition">
              My Trips
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-3 hover:bg-gray-50 rounded-xl px-3 py-2 transition"
                >
                  {userProfile?.profileImage ? (
                    <img
                      src={userProfile.profileImage}
                      alt={userProfile.name || 'User'}
                      className="w-9 h-9 rounded-full object-cover border-2 border-blue-500"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {userProfile?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {userProfile?.name || 'Traveler'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {userProfile?.status || 'Explorer'}
                    </p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                        <p className="font-semibold text-gray-900">
                          {userProfile?.name || 'Traveler'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {user.email}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                            {userProfile?.status || 'Explorer'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {userProfile?.totalTripsPlanned || 0} trips
                          </span>
                        </div>
                      </div>
                      
                      <div className="py-2">
                        <Link
                          href="/profile"
                          onClick={() => setShowMenu(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                        >
                          <User size={18} className="text-gray-600" />
                          <span className="text-gray-700 font-medium">View Profile</span>
                        </Link>
                        
                        <Link
                          href="/settings"
                          onClick={() => setShowMenu(false)}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                        >
                          <Settings size={18} className="text-gray-600" />
                          <span className="text-gray-700 font-medium">Settings</span>
                        </Link>
                        
                        <button
                          onClick={() => {
                            logout();
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition text-left"
                        >
                          <LogOut size={18} className="text-red-600" />
                          <span className="text-red-600 font-medium">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-blue-600 font-medium transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}