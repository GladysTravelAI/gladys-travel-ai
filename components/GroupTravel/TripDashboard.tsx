'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { subscribeMembers, subscribeTripUpdates } from '@/lib/tripService'
import MembersList   from './MembersList'
import CostSplitter  from './CostSplitter'
import GroupChat     from './GroupChat'
import type { Trip, TripMember } from '@/types/trip'

interface Props {
  trip: Trip
  currentUserId: string
  currentUserName: string
  currentUserPhoto?: string
}

type Tab = 'overview' | 'members' | 'costs' | 'chat'

const STATUS_CONFIG = {
  planning:  { label: 'Planning',  color: 'bg-amber-100 text-amber-700'  },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700'    },
  active:    { label: 'Active 🔥', color: 'bg-green-100 text-green-700'  },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-600'    },
}

function DaysUntilTrip({ startDate }: { startDate: string }) {
  const days = Math.ceil((new Date(startDate).getTime() - Date.now()) / 86400000)
  if (days < 0)   return <span className="text-green-600 font-semibold">Trip in progress</span>
  if (days === 0) return <span className="text-green-600 font-semibold">Trip starts today!</span>
  return <span><span className="font-bold text-gray-900">{days}</span> days to go</span>
}

export default function TripDashboard({ trip: initialTrip, currentUserId, currentUserName, currentUserPhoto }: Props) {
  const [trip,    setTrip]    = useState(initialTrip)
  const [members, setMembers] = useState<TripMember[]>([])
  const [tab,     setTab]     = useState<Tab>('overview')
  const [unread,  setUnread]  = useState(0)

  useEffect(() => {
    const unsubTrip    = subscribeTripUpdates(trip.id, setTrip)
    const unsubMembers = subscribeMembers(trip.id, setMembers)
    return () => { unsubTrip(); unsubMembers() }
  }, [trip.id])

  // Track unread chat messages when not on chat tab
  useEffect(() => {
    if (tab === 'chat') setUnread(0)
  }, [tab])

  const startFormatted = new Date(trip.startDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })
  const endFormatted   = new Date(trip.endDate).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
  const statusCfg      = STATUS_CONFIG[trip.status] ?? STATUS_CONFIG.planning
  const totalBudget    = trip.totalBudget

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: 'overview', label: 'Overview', emoji: '✦'  },
    { id: 'members',  label: 'Crew',     emoji: '👥' },
    { id: 'costs',    label: 'Costs',    emoji: '💸' },
    { id: 'chat',     label: 'Chat',     emoji: '💬' },
  ]

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ── Hero ───────────────────────────────────────────────── */}
      <div className="relative bg-gray-900 text-white px-6 pt-8 pb-6">
        {trip.coverImage && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${trip.coverImage})` }}
          />
        )}
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
            <div className="flex -space-x-2">
              {members.slice(0, 5).map(m => (
                <div key={m.id}
                  className="w-7 h-7 rounded-full bg-gray-600 border-2 border-gray-900 flex items-center justify-center text-xs font-bold"
                  title={m.displayName}
                >
                  {m.photoURL
                    ? <img src={m.photoURL} className="w-full h-full rounded-full object-cover" alt="" />
                    : m.displayName[0].toUpperCase()
                  }
                </div>
              ))}
              {members.length > 5 && (
                <div className="w-7 h-7 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center text-[10px] font-bold">
                  +{members.length - 5}
                </div>
              )}
            </div>
          </div>

          <h1 className="text-xl font-black leading-tight mb-1">{trip.name}</h1>
          <p className="text-white/60 text-sm">
            {trip.destinationCity}{trip.destinationCountry ? `, ${trip.destinationCountry}` : ''}
            {trip.eventName && <span className="ml-2 text-white/40">· {trip.eventName}</span>}
          </p>

          <div className="flex items-center gap-4 mt-4">
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Dates</p>
              <p className="text-xs font-semibold text-white/80 mt-0.5">{startFormatted} — {endFormatted}</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Countdown</p>
              <p className="text-xs font-semibold text-white/80 mt-0.5">
                <DaysUntilTrip startDate={trip.startDate} />
              </p>
            </div>
            {totalBudget && (
              <>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Budget</p>
                  <p className="text-xs font-semibold text-white/80 mt-0.5">
                    {trip.currency} {totalBudget.toLocaleString()}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div className="flex border-b border-gray-100 px-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`relative flex-1 py-3 text-xs font-medium transition-colors ${
              tab === t.id ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="flex items-center justify-center gap-1">
              <span>{t.emoji}</span>
              <span>{t.label}</span>
              {t.id === 'chat' && unread > 0 && (
                <span className="w-4 h-4 bg-black text-white rounded-full text-[9px] flex items-center justify-center">
                  {unread}
                </span>
              )}
            </span>
            {tab === t.id && (
              <motion.div layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <AnimatePresence mode="wait">

          {tab === 'overview' && (
            <motion.div key="overview"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 overflow-y-auto px-5 py-5 space-y-4"
            >
              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-gray-900">{members.length}</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Travellers</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-gray-900">
                    {Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000)}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Nights</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <p className="text-xl font-black text-gray-900">{trip.inviteCode}</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Invite Code</p>
                </div>
              </div>

              {/* Member flight info */}
              {members.some(m => m.flightNumber) && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Flight Info</p>
                  <div className="space-y-2">
                    {members.filter(m => m.flightNumber).map(m => (
                      <div key={m.id} className="flex items-center gap-3 bg-blue-50 rounded-xl px-4 py-3">
                        <span className="text-blue-500">✈</span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-900">{m.displayName}</p>
                          <p className="text-xs text-gray-500">{m.flightNumber}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hotel info */}
              {members.some(m => m.hotelName) && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Accommodation</p>
                  <div className="space-y-2">
                    {members.filter(m => m.hotelName).map(m => (
                      <div key={m.id} className="flex items-center gap-3 bg-emerald-50 rounded-xl px-4 py-3">
                        <span className="text-emerald-500">🏨</span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-900">{m.displayName}</p>
                          <p className="text-xs text-gray-500">{m.hotelName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ask Gladys CTA */}
              <div className="bg-gray-900 rounded-2xl p-5 text-white text-center">
                <p className="text-sm font-bold mb-1">Ask Gladys to plan this trip</p>
                <p className="text-xs text-white/50 mb-4">
                  Flights, hotels, transfers, packing — Gladys handles it all for your group
                </p>
                <button
                  onClick={() => {
                    // Trigger Gladys with trip context
                    const event = new CustomEvent('gladys:open', {
                      detail: `Plan a group trip to ${trip.destinationCity} for ${members.length} people from ${trip.startDate} to ${trip.endDate}${trip.eventName ? ` for ${trip.eventName}` : ''}`
                    })
                    window.dispatchEvent(event)
                  }}
                  className="px-6 py-2.5 bg-white text-black rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
                >
                  🎙 Talk to Gladys
                </button>
              </div>
            </motion.div>
          )}

          {tab === 'members' && (
            <motion.div key="members"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 overflow-y-auto px-5 py-5"
            >
              <MembersList trip={trip} currentUserId={currentUserId} />
            </motion.div>
          )}

          {tab === 'costs' && (
            <motion.div key="costs"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 overflow-y-auto px-5 py-5"
            >
              <CostSplitter
                trip={trip}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
              />
            </motion.div>
          )}

          {tab === 'chat' && (
            <motion.div key="chat"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <GroupChat
                trip={trip}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                currentUserPhoto={currentUserPhoto}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}