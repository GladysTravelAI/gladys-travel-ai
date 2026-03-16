'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, CheckCircle, Plane, Hotel, Globe } from 'lucide-react'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface WaitlistModalProps {
  isOpen:   boolean
  onClose:  () => void
  source?:  'hotels' | 'flights' | 'general'
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function WaitlistModal({ isOpen, onClose, source = 'general' }: WaitlistModalProps) {
  const [email,     setEmail]     = useState('')
  const [name,      setName]      = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  const headlines: Record<string, { title: string; sub: string }> = {
    hotels:  { title: 'Get hotel alerts first',   sub: 'Be first to know when we launch hotel booking near World Cup venues.' },
    flights: { title: 'Get flight alerts first',  sub: 'We\'ll notify you the moment flight search goes live — with early access pricing.' },
    general: { title: 'Join the waitlist',        sub: 'Be among the first to experience Gladys Travel — the AI travel companion built for events.' },
  }

  const h = headlines[source]

  async function handleSubmit() {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    setError('')
    setLoading(true)

    try {
      // Save to your API — create this endpoint or use a form service
      const res = await fetch('/api/waitlist', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), name: name.trim(), source }),
      })

      // Even if endpoint doesn't exist yet, show success
      setSubmitted(true)
    } catch {
      // Still show success — don't block user on a network error
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.95, y: 20  }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}
          >
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>

            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">

              {/* Header */}
              <div className="relative px-6 pt-6 pb-4"
                style={{ background: 'linear-gradient(135deg, #0F172A, #1E293B)' }}>

                {/* Close */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X size={16} className="text-white" />
                </button>

                {/* Icon cluster */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500 flex items-center justify-center">
                    <Plane size={18} className="text-white" />
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-violet-500 flex items-center justify-center">
                    <Hotel size={18} className="text-white" />
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center">
                    <Globe size={18} className="text-white" />
                  </div>
                </div>

                <h2 className="text-xl font-black text-white mb-1">{h.title}</h2>
                <p className="text-sm text-slate-400 leading-relaxed">{h.sub}</p>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                {!submitted ? (
                  <div className="space-y-3">
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                        First name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Your name"
                        className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-sky-400 transition-colors"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                        Email address *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError('') }}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        placeholder="you@example.com"
                        className={`w-full px-4 py-3 rounded-2xl border-2 text-sm font-medium text-slate-900 placeholder:text-slate-300 focus:outline-none transition-colors ${
                          error ? 'border-red-300 focus:border-red-400' : 'border-slate-100 focus:border-sky-400'
                        }`}
                      />
                      {error && <p className="text-xs text-red-500 mt-1.5 font-medium">{error}</p>}
                    </div>

                    {/* Perks */}
                    <div className="bg-slate-50 rounded-2xl p-3 space-y-1.5">
                      {[
                        'Early access before public launch',
                        'Exclusive launch pricing on hotels & flights',
                        'World Cup 2026 travel alerts',
                      ].map(perk => (
                        <div key={perk} className="flex items-center gap-2">
                          <Sparkles size={12} className="text-sky-500 flex-shrink-0" />
                          <span className="text-xs font-semibold text-slate-600">{perk}</span>
                        </div>
                      ))}
                    </div>

                    {/* Submit */}
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="w-full py-3.5 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}
                    >
                      {loading ? 'Joining...' : 'Join the waitlist →'}
                    </button>

                    <p className="text-center text-xs text-slate-400">
                      No spam. Unsubscribe anytime.
                    </p>
                  </div>
                ) : (
                  /* Success state */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6"
                  >
                    <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={32} className="text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">You're on the list! 🎉</h3>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
                      We'll email you at <span className="font-bold text-slate-900">{email}</span> the moment {source === 'hotels' ? 'hotel booking' : source === 'flights' ? 'flight search' : 'everything'} goes live.
                    </p>
                    <button
                      onClick={onClose}
                      className="mt-6 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}
                    >
                      Back to Gladys
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}