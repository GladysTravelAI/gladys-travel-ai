'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Camera, Edit, Settings, MapPin, Calendar, TrendingUp,
  ChevronRight, Star, User, Sparkles, Bookmark, Trophy,
  Plane, Clock, CheckCircle, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

const SKY = '#0EA5E9';

export default function ProfileScreen() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [editOpen,     setEditOpen]     = useState(false);
  const [editForm,     setEditForm]     = useState({ name: '', email: '' });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.push('/signin');
  }, [user, authLoading, router]);

  // Populate from Firebase
  useEffect(() => {
    if (!user) return;
    setEditForm({
      name:  userProfile?.name  || user.displayName || '',
      email: user.email || '',
    });
    // Prefer Firebase photo, fall back to localStorage
    const savedImg = localStorage.getItem('gladys-profile-image');
    setProfileImage(userProfile?.profileImage || savedImg || user.photoURL || null);
  }, [user, userProfile]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      setProfileImage(b64);
      localStorage.setItem('gladys-profile-image', b64);
      toast.success('Profile photo updated');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = () => {
    // Persist name to localStorage until Firebase profile update is wired
    try {
      const saved = JSON.parse(localStorage.getItem('gladys-user-settings') || '{}');
      localStorage.setItem('gladys-user-settings', JSON.stringify({ ...saved, displayName: editForm.name }));
    } catch {}
    toast.success('Profile updated');
    setEditOpen(false);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-2 border-slate-200 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  const name          = userProfile?.name || user.displayName || 'Traveler';
  const email         = user.email || '';
  const status        = userProfile?.status || 'Explorer';
  const tripsPlanned  = userProfile?.totalTripsPlanned ?? 0;
  const memberSince   = userProfile?.createdAt
    ? new Date(userProfile.createdAt).getFullYear()
    : new Date().getFullYear();

  // Star rating based on trips
  const starRating = tripsPlanned >= 20 ? 5 : tripsPlanned >= 10 ? 4 : tripsPlanned >= 5 ? 3 : tripsPlanned >= 2 ? 2 : 1;

  const STATS = [
    { icon: TrendingUp, value: tripsPlanned, label: 'Trips Planned', color: SKY       },
    { icon: Calendar,   value: 0,            label: 'Upcoming',      color: '#8B5CF6' },
    { icon: Bookmark,   value: 0,            label: 'Saved',         color: '#F97316' },
    { icon: Trophy,     value: status,       label: 'Status',        color: '#10B981' },
  ];

  return (
    <div className="min-h-screen bg-slate-50"
      style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="font-black text-slate-900 text-base">Gladys</span>
        </Link>
        <Link href="/settings"
          className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
          <Settings size={16} className="text-slate-600" />
        </Link>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* ── PROFILE CARD ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl overflow-hidden shadow-xl"
          style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7, #1E40AF)' }}>

          {/* Decorative rings */}
          <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full border-4 border-white/10 pointer-events-none" />
          <div className="absolute right-8 bottom-0 w-24 h-24 rounded-full border-4 border-white/10 pointer-events-none" />

          <div className="relative p-6 pb-8 text-center">
            {/* Avatar */}
            <div className="relative inline-block mb-4">
              <div className="w-28 h-28 rounded-full border-4 border-white/30 overflow-hidden bg-white/20 shadow-xl mx-auto">
                {profileImage
                  ? <img src={profileImage} alt={name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <User size={44} className="text-white/80" />
                    </div>
                }
              </div>
              <label className="absolute bottom-0 right-0 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform"
                style={{ color: SKY }}>
                <Camera size={15} />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>

            {/* Name & email */}
            <h1 className="text-2xl font-black text-white mb-1">{name}</h1>
            <p className="text-white/60 text-sm mb-4">{email}</p>

            {/* Badges */}
            <div className="flex items-center justify-center gap-2 flex-wrap mb-5">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-bold text-white">
                {user.emailVerified
                  ? <><CheckCircle size={11} />Verified</>
                  : <><AlertCircle size={11} />Not Verified</>
                }
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-bold text-white">
                <Clock size={11} />Since {memberSince}
              </span>
            </div>

            {/* Stars */}
            <div className="flex items-center justify-center gap-1 mb-5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18}
                  className={i < starRating ? 'fill-amber-400 text-amber-400' : 'text-white/20'} />
              ))}
            </div>

            {/* Status pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-2xl">
              <Trophy size={14} className="text-amber-300" />
              <span className="text-white font-black text-sm">{status}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="bg-white/10 backdrop-blur-sm border-t border-white/10 grid grid-cols-2 divide-x divide-white/10">
            <button onClick={() => setEditOpen(true)}
              className="flex items-center justify-center gap-2 py-3.5 text-white text-sm font-bold hover:bg-white/10 transition-colors">
              <Edit size={15} />Edit Profile
            </button>
            <Link href="/settings"
              className="flex items-center justify-center gap-2 py-3.5 text-white text-sm font-bold hover:bg-white/10 transition-colors">
              <Settings size={15} />Settings
            </Link>
          </div>
        </motion.div>

        {/* ── STATS GRID ── */}
        <div className="grid grid-cols-2 gap-3">
          {STATS.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="bg-white rounded-2xl p-5 border-2 border-slate-100 shadow-sm">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                style={{ background: s.color + '15' }}>
                <s.icon size={20} style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-black text-slate-900 mb-0.5">{s.value}</p>
              <p className="text-xs text-slate-400 font-semibold">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── UPCOMING TRIPS ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Link href="/trips"
            className="flex items-center gap-4 bg-white rounded-2xl p-5 border-2 border-slate-100 shadow-sm hover:border-sky-200 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${SKY}15` }}>
              <Plane size={20} style={{ color: SKY }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-slate-900 text-sm">My Trips</p>
              <p className="text-xs text-slate-400 mt-0.5">View and manage your trips</p>
            </div>
            <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
          </Link>
        </motion.div>

        {/* ── QUICK LINKS ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm">
          {[
            { icon: Sparkles, label: 'Explore Events',  sub: 'Concerts, sports, festivals', href: '/events'     },
            { icon: Settings, label: 'Account Settings',sub: 'Privacy, security, preferences', href: '/settings' },
          ].map((item, i) => (
            <Link key={i} href={item.href}
              className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${SKY}15` }}>
                <item.icon size={17} style={{ color: SKY }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-sm">{item.label}</p>
                <p className="text-xs text-slate-400 truncate">{item.sub}</p>
              </div>
              <ChevronRight size={15} className="text-slate-300 flex-shrink-0" />
            </Link>
          ))}
        </motion.div>

        {/* ── VERSION ── */}
        <div className="text-center pb-2">
          <p className="text-xs text-slate-300 flex items-center justify-center gap-1">
            <Sparkles size={10} style={{ color: SKY }} />
            GladysTravel.com · © 2026
          </p>
        </div>
      </div>

      {/* ── EDIT PROFILE MODAL ── */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setEditOpen(false)}>
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-xl font-black text-slate-900 mb-5">Edit Profile</h2>

            {/* Avatar in modal */}
            <div className="flex justify-center mb-5">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100">
                  {profileImage
                    ? <img src={profileImage} alt={name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center bg-sky-50">
                        <User size={36} style={{ color: SKY }} />
                      </div>
                  }
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-transform"
                  style={{ color: SKY }}>
                  <Camera size={14} />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {[
                { label: 'Full Name',      key: 'name',  type: 'text',  ph: 'Your name'    },
                { label: 'Email Address',  key: 'email', type: 'email', ph: 'your@email.com' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">{f.label}</label>
                  <input
                    type={f.type}
                    value={editForm[f.key as keyof typeof editForm]}
                    onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
                    placeholder={f.ph}
                    className="w-full h-11 px-4 border-2 border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:border-sky-400 transition-all"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setEditOpen(false)}
                className="flex-1 h-11 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSaveEdit}
                className="flex-1 h-11 rounded-xl text-sm font-black text-white transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}