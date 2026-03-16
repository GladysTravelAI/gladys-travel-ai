'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Hotel, Plane, ArrowRight, Clock } from 'lucide-react'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type BannerType = 'hotels' | 'flights'

interface ComingSoonBannerProps {
  type: BannerType
  onNotifyClick?: () => void
}

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const CONFIG = {
  hotels: {
    icon:     Hotel,
    label:    'Hotels',
    headline: 'Best rates near every venue',
    sub:      'We\'re partnering with top hotel providers to bring you exclusive rates near World Cup stadiums, concert venues, and festival grounds.',
    features: ['Near-venue priority booking', 'Group room blocks', 'Flexible cancellation', 'Price match guarantee'],
    accent:   '#0EA5E9',
    bg:       'from-sky-50 to-white',
    iconBg:   'from-sky-400 to-sky-600',
  },
  flights: {
    icon:     Plane,
    label:    'Flights',
    headline: 'Find flights from your city',
    sub:      'Direct connections from 200+ cities worldwide. We\'re integrating real-time flight search with event-aware pricing alerts.',
    features: ['Event-day flight alerts', 'Price drop notifications', 'Multi-city itineraries', 'Group booking discounts'],
    accent:   '#8B5CF6',
    bg:       'from-violet-50 to-white',
    iconBg:   'from-violet-400 to-violet-600',
  },
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function ComingSoonBanner({ type, onNotifyClick }: ComingSoonBannerProps) {
  const c    = CONFIG[type]
  const Icon = c.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br ${c.bg} p-6 sm:p-8`}
      style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* Background decoration */}
      <div
        className="absolute -right-12 -top-12 w-48 h-48 rounded-full opacity-[0.06]"
        style={{ background: `radial-gradient(circle, ${c.accent}, transparent)` }}
      />
      <div
        className="absolute -right-4 -bottom-8 w-32 h-32 rounded-full opacity-[0.04]"
        style={{ background: `radial-gradient(circle, ${c.accent}, transparent)` }}
      />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">

        {/* Icon + label */}
        <div className="flex-shrink-0">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${c.iconBg} shadow-lg`}
          >
            <Icon size={26} className="text-white" />
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{c.label}</span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: c.accent }}
            >
              Coming Soon
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-1">{c.headline}</h3>
          <p className="text-sm text-slate-500 leading-relaxed max-w-md">{c.sub}</p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-3">
            {c.features.map(f => (
              <span
                key={f}
                className="text-xs font-semibold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex-shrink-0">
          <button
            onClick={onNotifyClick}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.97] shadow-md whitespace-nowrap"
            style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.accent}cc)` }}
          >
            <Clock size={14} />
            Notify me
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}