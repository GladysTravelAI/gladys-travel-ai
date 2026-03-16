'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, Sparkles, LogIn, Plane, Calendar, Clock } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { getUserTrips } from '@/lib/tripService'
import CreateTripModal from '@/components/GroupTravel/CreateTripModal'
import type { Trip } from '@/types/trip'

const SKY = '#0EA5E9'

// ─── TRIP CARD ────────────────────────────────────────────────────────────────

function TripCard({ trip, onClick }: { trip: Trip; onClick: () => void }) {
  const days      = Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000)
  const daysUntil = Math.ceil((new Date(trip.startDate).getTime() - Date.now()) / 86400000)
  const isActive  = trip.status === 'active' || (daysUntil <= 0 && daysUntil > -days)

  const statusColors: Record<string, string> = {
    planning:  'bg-amber-100 text-amber-700',
    confirmed: 'bg-blue-100 text-blue-700',
    active:    'bg-emerald-100 text-emerald-700',
    completed: 'bg-slate-100 text-slate-500',
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white border border-slate-100 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all duration-200"
    >
      {/* Cover image */}
      <div className="relative h-36 bg-slate-900 overflow-hidden">
        {trip.coverImage ? (
          <img src={trip.coverImage} alt={trip.name} className="w-full h-full object-cover opacity-70" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)' }}>
            <Plane size={36} className="text-white opacity-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-3 left-4 right-16">
          <p className="text-white font-bold text-base leading-tight line-clamp-1">{trip.name}</p>
          <p className="text-white/60 text-xs mt-0.5">
            {trip.destinationCity}{trip.destinationCountry ? `, ${trip.destinationCountry}` : ''}
          </p>
        </div>
        <div className="absolute top-3 right-3">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusColors[trip.status] ?? statusColors.planning}`}>
            {isActive ? '🔥 Active' : trip.status}
          </span>
        </div>
      </div>

      {/* Info row */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar size={11} />
            {new Date(trip.startDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })} —{' '}
            {new Date(trip.endDate).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          {trip.eventName && (
            <p className="text-xs text-slate-400">🎫 {trip.eventName}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0 ml-3">
          <div className="flex items-center gap-1 justify-end">
            <Users size={12} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-900">{trip.memberCount}</span>
            <span className="text-xs text-slate-400">
              traveller{trip.memberCount !== 1 ? 's' : ''}
            </span>
          </div>
          {daysUntil > 0 && (
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 justify-end">
              <Clock size={10} />{daysUntil}d to go
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── SIGN-IN PROMPT ───────────────────────────────────────────────────────────

function SignInPrompt() {
  return (
    <div
      className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center pt-20 md:pt-24"
      style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');`}</style>

      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-lg"
        style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}
      >
        <Users size={36} className="text-white" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Group Travel</h1>
      <p className="text-slate-500 max-w-xs mb-2 text-sm sm:text-base leading-relaxed">
        Plan trips with your crew — shared itinerary, group chat, and automatic cost splitting.
      </p>
      <p className="text-slate-400 text-sm mb-8">Sign in to create or join a trip.</p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Link
          href="/signup"
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white transition-opacity hover:opacity-90 active:scale-[0.97] shadow-md"
          style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}
        >
          <Sparkles size={15} />Get started free
        </Link>
        <Link
          href="/signin"
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-slate-700 border-2 border-slate-200 hover:border-slate-300 transition-all active:scale-[0.97]"
        >
          <LogIn size={15} />Sign in
        </Link>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mt-10">
        {['Shared trip page', 'Invite with a code', 'Split costs', 'Group chat'].map(f => (
          <span key={f} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 text-slate-500">
            {f}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function TripsPage() {
  const router          = useRouter()
  const { user }        = useAuth()
  const [trips,         setTrips]     = useState<Trip[]>([])
  const [loading,       setLoading]   = useState(false)
  const [showModal,     setShowModal] = useState(false)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    getUserTrips(user.uid)
      .then(setTrips)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  // Not logged in — inline prompt, no redirect
  if (!user) return <SignInPrompt />

  const upcoming = trips.filter(t => new Date(t.endDate) >= new Date())
  const past     = trips.filter(t => new Date(t.endDate)  < new Date())

  return (
    <div
      className="min-h-screen bg-slate-50 pb-20 md:pb-8"
      style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');`}</style>

      <div className="max-w-2xl mx-auto px-4 pt-20 md:pt-24 pb-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">My Trips</h1>
            <p className="text-sm text-slate-400 mt-0.5">Plan together, travel together</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-[0.97] shadow-md"
            style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}
          >
            <Plus size={16} />New Trip
          </button>
        </div>

        {/* Loading spinner */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-8 h-8 border-2 border-slate-200 rounded-full animate-spin"
              style={{ borderTopColor: SKY }}
            />
          </div>
        )}

        {/* Empty state */}
        {!loading && trips.length === 0 && (
          <div className="text-center py-16">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-md"
              style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}
            >
              <Plane size={36} className="text-white" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">No trips yet</h2>
            <p className="text-sm text-slate-400 mb-8 max-w-xs mx-auto leading-relaxed">
              Create your first group trip or join one with an invite code.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90 shadow-md active:scale-[0.97]"
                style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}
              >
                Plan a trip
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl text-sm font-bold hover:border-slate-300 transition-all active:scale-[0.97]"
              >
                Join with code
              </button>
            </div>
          </div>
        )}

        {/* Trips list */}
        {!loading && trips.length > 0 && (
          <div className="space-y-8">
            {upcoming.length > 0 && (
              <section>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Upcoming · {upcoming.length}
                </p>
                <div className="space-y-3">
                  {upcoming.map(trip => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      onClick={() => router.push(`/trips/${trip.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Past · {past.length}
                </p>
                <div className="space-y-3 opacity-60">
                  {past.map(trip => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      onClick={() => router.push(`/trips/${trip.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Create / Join modal */}
      <AnimatePresence>
        {showModal && (
          <CreateTripModal
            onCreated={trip => { setShowModal(false); router.push(`/trips/${trip.id}`) }}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}