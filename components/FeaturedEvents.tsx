'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, MapPin, Sparkles, TrendingUp, Trophy, Music, PartyPopper, ArrowRight, Ticket, ChevronRight } from 'lucide-react'

// ── TYPES ──────────────────────────────────────────────────────────────────────

interface LiveEvent {
  id:          string
  name:        string
  category:    'sports' | 'music' | 'festival' | 'other'
  date:        string
  time?:       string
  venue:       string
  city:        string
  country:     string
  image?:      string
  ticketUrl?:  string
  priceMin?:   number
  currency?:   string
  attraction?: string
  rank?:       number
}

interface FeaturedEventsProps {
  onSearch: (name: string) => void
}

// ── HELPERS ────────────────────────────────────────────────────────────────────

function getDaysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
}

function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return d }
}

function catColor(cat: string) {
  if (cat === 'sports')   return '#0EA5E9'
  if (cat === 'music')    return '#8B5CF6'
  if (cat === 'festival') return '#F97316'
  return '#10B981'
}

function CatIcon({ cat, size = 12 }: { cat: string; size?: number }) {
  if (cat === 'sports')   return <Trophy size={size} />
  if (cat === 'music')    return <Music size={size} />
  if (cat === 'festival') return <PartyPopper size={size} />
  return <Sparkles size={size} />
}

// ── HERO CARD (large, first event) ────────────────────────────────────────────

function HeroCard({ ev, onSearch }: { ev: LiveEvent; onSearch: (n: string) => void }) {
  const days   = getDaysUntil(ev.date)
  const color  = catColor(ev.category)
  const isHot  = (ev.rank ?? 0) > 70 || days <= 14

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onClick={() => onSearch(ev.name)}
      className="relative cursor-pointer rounded-3xl overflow-hidden group"
      style={{ background: '#0F172A', minHeight: 420 }}
    >
      {/* Background image */}
      {ev.image && (
        <img
          src={ev.image}
          alt={ev.name}
          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700"
        />
      )}
      {!ev.image && (
        <div className="absolute inset-0 opacity-20"
          style={{ background: `radial-gradient(ellipse at 60% 40%, ${color}, transparent 70%)` }} />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-8 sm:p-10" style={{ minHeight: 420 }}>

        {/* Top row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-bold"
            style={{ background: `${color}CC`, backdropFilter: 'blur(8px)' }}>
            <CatIcon cat={ev.category} size={11} />
            {ev.category.charAt(0).toUpperCase() + ev.category.slice(1)}
          </div>
          {isHot && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/90 text-white text-xs font-black">
              <TrendingUp size={11} />
              {days <= 7 ? 'This week' : days <= 14 ? 'Soon' : 'Trending'}
            </div>
          )}
        </div>

        {/* Bottom content */}
        <div>
          {ev.attraction && (
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color }}>
              {ev.attraction}
            </p>
          )}
          <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4 line-clamp-2">
            {ev.name}
          </h2>

          <div className="flex flex-wrap items-center gap-4 mb-6 text-white/60 text-sm">
            <span className="flex items-center gap-1.5">
              <Calendar size={13} />{fmtDate(ev.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={13} />{ev.venue ? `${ev.venue}, ` : ''}{ev.city}
            </span>
            {days > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white/10 text-white">
                {days}d away
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={e => { e.stopPropagation(); onSearch(ev.name) }}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90 active:scale-[0.97] shadow-lg"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
            >
              <Sparkles size={14} />Plan This Trip
            </button>
            {ev.priceMin && (
              <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm text-white text-sm font-bold">
                From {ev.currency ?? 'USD'} {ev.priceMin.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── COMPACT CARD (side stack) ─────────────────────────────────────────────────

function CompactCard({ ev, onSearch, index }: { ev: LiveEvent; onSearch: (n: string) => void; index: number }) {
  const days  = getDaysUntil(ev.date)
  const color = catColor(ev.category)

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      onClick={() => onSearch(ev.name)}
      className="group relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200 border-2 border-slate-100 hover:border-slate-200 hover:shadow-lg bg-white active:scale-[0.98]"
    >
      {/* Thumbnail */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
        {ev.image
          ? <img src={ev.image} alt={ev.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center" style={{ background: `${color}20` }}>
              <CatIcon cat={ev.category} size={22} />
            </div>
        }
        {/* Color strip */}
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: color }} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-black text-slate-900 text-sm leading-tight line-clamp-2 mb-1">
          {ev.name}
        </p>
        <p className="text-xs text-slate-400 flex items-center gap-1 mb-1.5">
          <Calendar size={10} />{fmtDate(ev.date)}
        </p>
        <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
          <MapPin size={10} />{ev.city}
        </p>
      </div>

      {/* Right: days pill + arrow */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        {days > 0 && days <= 90 && (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
            style={{ background: color }}>
            {days}d
          </span>
        )}
        <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
      </div>
    </motion.div>
  )
}

// ── GRID CARD (3-col bottom row) ──────────────────────────────────────────────

function GridCard({ ev, onSearch, index }: { ev: LiveEvent; onSearch: (n: string) => void; index: number }) {
  const days  = getDaysUntil(ev.date)
  const color = catColor(ev.category)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 + index * 0.07 }}
      onClick={() => onSearch(ev.name)}
      className="group relative rounded-2xl overflow-hidden cursor-pointer border border-slate-100 hover:shadow-xl transition-all duration-300 active:scale-[0.98] bg-white"
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-slate-900">
        {ev.image
          ? <img src={ev.image} alt={ev.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
          : <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, #0F172A, ${color}40)` }}>
              <CatIcon cat={ev.category} size={40} />
            </div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3">
          <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full text-white"
            style={{ background: `${color}DD` }}>
            <CatIcon cat={ev.category} size={9} />
            {ev.category.charAt(0).toUpperCase() + ev.category.slice(1)}
          </span>
        </div>

        {(ev.rank ?? 0) > 70 && (
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500 text-white">
              <TrendingUp size={8} />Hot
            </span>
          </div>
        )}

        {/* Event name on image */}
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white font-black text-sm leading-tight line-clamp-2 drop-shadow-lg">{ev.name}</p>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
              <Calendar size={10} />{fmtDate(ev.date)}
            </p>
            <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
              <MapPin size={10} />{ev.venue ? `${ev.venue}, ` : ''}{ev.city}
            </p>
          </div>
          {ev.priceMin && (
            <div className="text-right flex-shrink-0">
              <p className="text-[9px] text-slate-400 font-bold uppercase">From</p>
              <p className="text-sm font-black text-slate-900">
                {ev.currency ?? 'USD'} {ev.priceMin.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={e => { e.stopPropagation(); onSearch(ev.name) }}
          className="w-full py-2.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90 active:scale-[0.97]"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}
        >
          <Sparkles size={11} />Plan This Trip
        </button>
      </div>
    </motion.div>
  )
}

// ── FILTER TABS ────────────────────────────────────────────────────────────────

const FILTERS = ['All', 'Sports', 'Music', 'Festival'] as const
type Filter = typeof FILTERS[number]

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────

// ── MOBILE HERO CARD ──────────────────────────────────────────────────────────
function MobileHeroCard({ ev, onSearch }: { ev: LiveEvent; onSearch: (n: string) => void }) {
  const cat   = ev.category ?? 'other'
  const color = cat === 'sports' ? '#0EA5E9' : cat === 'music' ? '#8B5CF6' : '#F97316'
  const daysAway = Math.ceil((new Date(ev.date).getTime() - Date.now()) / 86_400_000)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="relative h-[260px] rounded-3xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
      onClick={() => onSearch(ev.name)}
    >
      {ev.image
        ? <img src={ev.image} alt={ev.name} className="absolute inset-0 w-full h-full object-cover" />
        : <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${color}33, ${color}99)` }} />
      }
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Top badges */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <span className="text-xs font-black px-3 py-1 rounded-full text-white uppercase tracking-wide"
          style={{ background: color }}>
          {cat}
        </span>
        {daysAway >= 0 && daysAway <= 7 && (
          <span className="text-xs font-black px-3 py-1 rounded-full bg-rose-500 text-white">This week</span>
        )}
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-4 left-4 right-4">
        {ev.attraction && (
          <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color }}>
            {ev.attraction}
          </p>
        )}
        <h3 className="text-white font-black text-xl leading-tight mb-2 line-clamp-2">{ev.name}</h3>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-white/70 text-xs flex items-center gap-1">
              <Calendar size={10} />
              {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            {ev.venue && (
              <p className="text-white/60 text-xs flex items-center gap-1">
                <MapPin size={10} />{ev.venue}{ev.city ? `, ${ev.city}` : ''}
              </p>
            )}
          </div>
          <button
            onClick={e => { e.stopPropagation(); onSearch(ev.name); }}
            className="flex items-center gap-1.5 text-xs font-black px-4 py-2.5 rounded-2xl text-white flex-shrink-0"
            style={{ background: color }}
          >
            <Sparkles size={12} />Plan Trip
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ── MOBILE SCROLL CARD ─────────────────────────────────────────────────────────
function MobileCard({ ev, onSearch, index }: { ev: LiveEvent; onSearch: (n: string) => void; index: number }) {
  const cat   = ev.category ?? 'other'
  const color = cat === 'sports' ? '#0EA5E9' : cat === 'music' ? '#8B5CF6' : '#F97316'
  const daysAway = Math.ceil((new Date(ev.date).getTime() - Date.now()) / 86_400_000)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onSearch(ev.name)}
      className="snap-card flex-shrink-0 w-[220px] bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm active:scale-[0.97] transition-transform cursor-pointer"
    >
      {/* Image */}
      <div className="relative h-[130px] overflow-hidden">
        {ev.image
          ? <img src={ev.image} alt={ev.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${color}40, ${color}80)` }} />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white uppercase"
            style={{ background: color }}>{cat}</span>
          {daysAway >= 0 && daysAway <= 7 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-white">This week</span>
          )}
        </div>
        {daysAway >= 0 && (
          <div className="absolute bottom-2 left-3">
            <span className="text-[10px] font-black text-white/70">
              {daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `${daysAway}d away`}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3">
        <p className="font-black text-slate-900 text-sm leading-tight line-clamp-2 mb-1.5">{ev.name}</p>
        <p className="text-[11px] text-slate-400 flex items-center gap-1 mb-0.5">
          <Calendar size={9} />
          {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
        {ev.city && (
          <p className="text-[11px] text-slate-400 flex items-center gap-1 mb-3">
            <MapPin size={9} />{ev.city}
          </p>
        )}
        <button
          onClick={e => { e.stopPropagation(); onSearch(ev.name); }}
          className="w-full py-2 rounded-xl text-xs font-black text-white transition-opacity hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${color}DD, ${color})` }}
        >
          Plan This Trip
        </button>
      </div>
    </motion.div>
  )
}

export default function FeaturedEvents({ onSearch }: FeaturedEventsProps) {
  const [events,      setEvents]      = useState<LiveEvent[]>([])
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState<Filter>('All')
  const [showAll,     setShowAll]     = useState(false)

  useEffect(() => {
    fetch('/api/featured-events')
      .then(r => r.json())
      .then(d => { if (d.success) setEvents(d.events) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'All'
    ? events
    : events.filter(e => e.category === filter.toLowerCase() || (filter === 'Festival' && e.category === 'festival'))

  // Layout: hero (1st) + side stack (2nd–4th) + bottom grid (5th–10th)
  const hero      = filtered[0]
  const sideCards = filtered.slice(1, 4)
  const gridCards = showAll ? filtered.slice(4) : filtered.slice(4, 7)

  return (
    <section
      className="py-10 md:py-20"
      style={{ background: '#F8FAFC', fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        .snap-carousel { scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; }
        .snap-card     { scroll-snap-align: start; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="max-w-7xl mx-auto">

        {/* ── Section header ── */}
        <div className="flex items-end justify-between gap-4 mb-6 px-4 sm:px-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2 h-2 rounded-full animate-pulse bg-emerald-500" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Live · Updated now</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Upcoming Events</h2>
            <p className="text-slate-500 mt-1 text-xs sm:text-sm">Real events worldwide. Tap any to plan instantly.</p>
          </div>

          {/* Filter pills — horizontal scroll on mobile */}
          <div className="flex gap-1.5 overflow-x-auto hide-scrollbar flex-shrink-0 pb-0.5">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setShowAll(false) }}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-[0.96] whitespace-nowrap flex-shrink-0"
                style={{
                  background: filter === f
                    ? f === 'All' ? '#0EA5E9' : f === 'Sports' ? '#0EA5E9' : f === 'Music' ? '#8B5CF6' : '#F97316'
                    : '#E2E8F0',
                  color: filter === f ? 'white' : '#64748B',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <>
            {/* Mobile loading skeleton — horizontal scroll */}
            <div className="flex gap-4 overflow-x-auto hide-scrollbar px-4 sm:px-5 pb-2 md:hidden">
              {[1,2,3].map(i => (
                <div key={i} className="flex-shrink-0 w-[260px] h-[300px] rounded-3xl bg-slate-200 animate-pulse snap-card" />
              ))}
            </div>
            {/* Desktop loading skeleton */}
            <div className="hidden md:grid grid-cols-3 gap-5 px-5">
              <div className="col-span-2 h-[420px] rounded-3xl bg-slate-200 animate-pulse" />
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-slate-200 animate-pulse" />)}
              </div>
            </div>
          </>
        )}

        {/* ── No results ── */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-slate-400 px-4">
            <Sparkles size={40} className="mx-auto mb-4 opacity-30" />
            <p className="font-semibold">No events found</p>
          </div>
        )}

        {/* ── MOBILE: Horizontal snap carousel ── */}
        {!loading && filtered.length > 0 && (
          <>
            <div className="md:hidden">
              {/* Featured pill card — full width */}
              {hero && (
                <div className="px-4 mb-4">
                  <MobileHeroCard ev={hero} onSearch={onSearch} />
                </div>
              )}

              {/* Horizontal scroll row */}
              <div className="flex gap-3 overflow-x-auto snap-carousel hide-scrollbar px-4 pb-3">
                {filtered.slice(1).map((ev, i) => (
                  <MobileCard key={ev.id} ev={ev} onSearch={onSearch} index={i} />
                ))}
              </div>

              {/* View all link */}
              <div className="px-4 mt-4">
                <button
                  onClick={() => window.location.href = '/events'}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-slate-200 text-sm font-bold text-slate-600 bg-white active:scale-[0.98] transition-all"
                >
                  Browse all events <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* ── DESKTOP: Editorial layout (unchanged) ── */}
            <div className="hidden md:block px-5 space-y-5">

              {/* Row 1: Hero + side stack */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {hero && (
                  <div className="lg:col-span-3">
                    <HeroCard ev={hero} onSearch={onSearch} />
                  </div>
                )}
                {sideCards.length > 0 && (
                  <div className="lg:col-span-2 flex flex-col gap-3">
                    {sideCards.map((ev, i) => (
                      <CompactCard key={ev.id} ev={ev} onSearch={onSearch} index={i} />
                    ))}
                    {sideCards.length < 3 && (
                      <div className="flex-1 flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center">
                        <div>
                          <Ticket size={24} className="mx-auto mb-2 text-slate-300" />
                          <p className="text-sm font-bold text-slate-400">More events loading</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Row 2: 3-col grid */}
              {filtered.slice(4).length > 0 && (
                <AnimatePresence>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {gridCards.map((ev, i) => (
                      <GridCard key={ev.id} ev={ev} onSearch={onSearch} index={i} />
                    ))}
                  </div>
                </AnimatePresence>
              )}

              {/* Show more / less */}
              {filtered.slice(4).length > 3 && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:border-slate-300 hover:bg-white transition-all active:scale-[0.97]"
                  >
                    {showAll ? 'Show less' : `View all ${filtered.length} events`}
                    <ArrowRight size={14} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
          </div>
        
    </section>
  )
}