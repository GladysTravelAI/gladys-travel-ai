'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { subscribeMembers, regenerateInviteCode, updateMemberInfo } from '@/lib/tripService'
import type { Trip, TripMember } from '@/types/trip'

interface Props {
  trip: Trip
  currentUserId: string
}

function MemberAvatar({ member, size = 'md' }: { member: TripMember; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-sm'
  const initials = member.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500']
  const color = colors[member.displayName.charCodeAt(0) % colors.length]

  if (member.photoURL) {
    return <img src={member.photoURL} alt={member.displayName} className={`${dim} rounded-full object-cover flex-shrink-0`} />
  }
  return (
    <div className={`${dim} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  )
}

export default function MembersList({ trip, currentUserId }: Props) {
  const [members,    setMembers]    = useState<TripMember[]>([])
  const [showInvite, setShowInvite] = useState(false)
  const [copied,     setCopied]     = useState(false)
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [flightNum,  setFlightNum]  = useState('')
  const [hotelName,  setHotelName]  = useState('')

  useEffect(() => {
    const unsub = subscribeMembers(trip.id, setMembers)
    return unsub
  }, [trip.id])

  const isOwner = members.find(m => m.id === currentUserId)?.role === 'owner'

  const copyInviteCode = async () => {
    await navigator.clipboard.writeText(trip.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyInviteLink = async () => {
    const link = `${window.location.origin}/trips/join?code=${trip.inviteCode}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSaveInfo = async (memberId: string) => {
    await updateMemberInfo(trip.id, memberId, {
      flightNumber: flightNum || undefined,
      hotelName:    hotelName || undefined,
    })
    setEditingId(null)
  }

  return (
    <div className="space-y-4">
      {/* Member count header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {members.slice(0, 4).map(m => <MemberAvatar key={m.id} member={m} size="sm" />)}
            {members.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 border-2 border-white">
                +{members.length - 4}
              </div>
            )}
          </div>
          <span className="text-sm font-medium text-gray-900">{members.length} traveller{members.length !== 1 ? 's' : ''}</span>
        </div>

        <button
          onClick={() => setShowInvite(!showInvite)}
          className="flex items-center gap-1.5 text-xs font-semibold text-black bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors"
        >
          + Invite
        </button>
      </div>

      {/* Invite panel */}
      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Invite your travel crew</p>

              {/* Code display */}
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-center">
                  <p className="text-2xl font-black tracking-widest text-gray-900 font-mono">
                    {trip.inviteCode}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Invite code</p>
                </div>
                <button
                  onClick={copyInviteCode}
                  className="px-4 py-3 bg-black text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors min-w-[72px]"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>

              {/* Share link */}
              <button
                onClick={copyInviteLink}
                className="w-full text-xs text-gray-500 hover:text-gray-700 py-2 border border-dashed border-gray-200 rounded-xl transition-colors"
              >
                📋 Copy invite link instead
              </button>

              {/* Regenerate (owner only) */}
              {isOwner && (
                <button
                  onClick={async () => await regenerateInviteCode(trip.id)}
                  className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  ↻ Generate new code (invalidates old one)
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Member list */}
      <div className="space-y-2">
        {members.map(member => (
          <div key={member.id} className="bg-white border border-gray-100 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <MemberAvatar member={member} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">{member.displayName}</p>
                  {member.role === 'owner' && (
                    <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded-full font-medium">Owner</span>
                  )}
                  {member.id === currentUserId && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">You</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{member.email}</p>

                {/* Flight / Hotel info */}
                {(member.flightNumber || member.hotelName) && editingId !== member.id && (
                  <div className="flex gap-3 mt-1.5">
                    {member.flightNumber && (
                      <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        ✈ {member.flightNumber}
                      </span>
                    )}
                    {member.hotelName && (
                      <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        🏨 {member.hotelName}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Edit button (own profile only) */}
              {member.id === currentUserId && editingId !== member.id && (
                <button
                  onClick={() => {
                    setEditingId(member.id)
                    setFlightNum(member.flightNumber ?? '')
                    setHotelName(member.hotelName ?? '')
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>

            {/* Inline edit panel */}
            <AnimatePresence>
              {editingId === member.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400"
                        placeholder="Flight e.g. BA123"
                        value={flightNum}
                        onChange={e => setFlightNum(e.target.value.toUpperCase())}
                      />
                      <input
                        className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400"
                        placeholder="Hotel name"
                        value={hotelName}
                        onChange={e => setHotelName(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveInfo(member.id)}
                        className="flex-1 py-1.5 bg-black text-white rounded-lg text-xs font-medium">
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="flex-1 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}