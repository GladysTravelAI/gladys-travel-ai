'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createTrip, getTripByInviteCode, joinTrip } from '@/lib/tripService'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import type { Trip } from '@/types/trip'

interface Props {
  onCreated: (trip: Trip) => void
  onClose: () => void
}

type Tab = 'create' | 'join'

export default function CreateTripModal({ onCreated, onClose }: Props) {
  const [user] = useAuthState(auth)
  const [tab, setTab]       = useState<Tab>('create')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  // Create form
  const [name, setName]               = useState('')
  const [destination, setDestination] = useState('')
  const [city, setCity]               = useState('')
  const [country, setCountry]         = useState('')
  const [startDate, setStartDate]     = useState('')
  const [endDate, setEndDate]         = useState('')
  const [eventName, setEventName]     = useState('')
  const [budget, setBudget]           = useState('')
  const [currency, setCurrency]       = useState('USD')

  // Join form
  const [inviteCode, setInviteCode]   = useState('')

  const handleCreate = async () => {
    if (!user) return setError('You must be signed in')
    if (!name || !destination || !startDate || !endDate) return setError('Fill in all required fields')
    setLoading(true)
    setError('')
    try {
      const trip = await createTrip(
        {
          name,
          destination,
          destinationCity: city || destination,
          destinationCountry: country,
          startDate,
          endDate,
          eventName: eventName || undefined,
          currency,
          totalBudget: budget ? parseFloat(budget) : undefined,
        },
        user.uid,
        user.displayName ?? 'Traveller',
        user.email ?? ''
      )
      onCreated(trip)
    } catch (e) {
      setError('Failed to create trip. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!user) return setError('You must be signed in')
    if (!inviteCode.trim()) return setError('Enter an invite code')
    setLoading(true)
    setError('')
    try {
      const trip = await getTripByInviteCode(inviteCode.trim())
      if (!trip) return setError('Invalid invite code. Check with your travel buddy.')
      await joinTrip(trip.id, user.uid, user.displayName ?? 'Traveller', user.email ?? '')
      onCreated(trip)
    } catch (e) {
      setError('Failed to join trip. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
  const labelClass = "block text-xs font-medium text-gray-500 mb-1.5"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Plan a Group Trip</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
              ✕
            </button>
          </div>

          {/* Tab toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            {(['create', 'join'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t === 'create' ? '✦ Create Trip' : '→ Join Trip'}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            {tab === 'create' ? (
              <motion.div key="create"
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div>
                  <label className={labelClass}>Trip Name *</label>
                  <input className={inputClass} placeholder="e.g. World Cup 2026 with the boys" value={name} onChange={e => setName(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>City *</label>
                    <input className={inputClass} placeholder="New York" value={city} onChange={e => { setCity(e.target.value); setDestination(e.target.value) }} />
                  </div>
                  <div>
                    <label className={labelClass}>Country</label>
                    <input className={inputClass} placeholder="USA" value={country} onChange={e => setCountry(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Event (optional)</label>
                  <input className={inputClass} placeholder="e.g. FIFA World Cup 2026" value={eventName} onChange={e => setEventName(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>From *</label>
                    <input type="date" className={inputClass} value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>To *</label>
                    <input type="date" className={inputClass} value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Budget (optional)</label>
                    <input type="number" className={inputClass} placeholder="5000" value={budget} onChange={e => setBudget(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Currency</label>
                    <select className={inputClass} value={currency} onChange={e => setCurrency(e.target.value)}>
                      {['USD','EUR','GBP','ZAR','AED','JPY','AUD','CAD'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                <button onClick={handleCreate} disabled={loading}
                  className="w-full py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  {loading ? 'Creating...' : 'Create Trip →'}
                </button>
              </motion.div>
            ) : (
              <motion.div key="join"
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="bg-gray-50 rounded-2xl p-5 text-center">
                  <p className="text-4xl mb-3">🔗</p>
                  <p className="text-sm font-medium text-gray-900 mb-1">Got an invite code?</p>
                  <p className="text-xs text-gray-400">Ask your trip organiser for the 6-character code</p>
                </div>

                <div>
                  <label className={labelClass}>Invite Code</label>
                  <input
                    className={`${inputClass} text-center text-xl font-bold tracking-widest uppercase`}
                    placeholder="ABC123"
                    maxLength={6}
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  />
                </div>

                {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                <button onClick={handleJoin} disabled={loading || inviteCode.length < 6}
                  className="w-full py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  {loading ? 'Joining...' : 'Join Trip →'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}