"use client";

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Trophy, Music, PartyPopper, Sparkles,
  TrendingUp, Calendar, MapPin, Flame, Globe,
  Loader2, ArrowRight, Ticket, ChevronLeft, ChevronRight,
  X, SlidersHorizontal,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar  from '@/components/Navbar'
import Footer  from '@/components/Footer'

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

const SKY = '#0EA5E9'

// ── HELPERS ────────────────────────────────────────────────────────────────────

function getDaysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000)
}
function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return d }
}
function catColor(cat: string) {
  if (cat === 'sports')   return SKY
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

// ── HERO EVENT CARD (first result — full width) ────────────────────────────────

function HeroEventCard({ ev, onPlan }: { ev: LiveEvent; onPlan: (n: string) => void }) {
  const color = catColor(ev.category)
  const days  = getDaysUntil(ev.date)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onPlan(ev.name)}
      className="relative rounded-3xl overflow-hidden cursor-pointer group col-span-full"
      style={{ background: '#0F172A', minHeight: 320 }}
    >
      {ev.image && (
        <img src={ev.image} alt={ev.name}
          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-75 group-hover:scale-105 transition-all duration-700" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

      <div className="relative p-8 sm:p-10 flex flex-col justify-end h-full" style={{ minHeight: 320 }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-black px-2.5 py-1 rounded-full text-white"
            style={{ background: `${color}CC` }}>
            <span className="flex items-center gap-1"><CatIcon cat={ev.category} size={10} />
            {ev.category.charAt(0).toUpperCase() + ev.category.slice(1)}</span>
          </span>
          {days >= 0 && days <= 30 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500 text-white flex items-center gap-1">
              <Flame size={9} />{days <= 7 ? 'This week' : `${days}d away`}
            </span>
          )}
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-2 line-clamp-2">
          {ev.name}
        </h2>
        {ev.attraction && <p className="text-white/50 text-sm mb-3">{ev.attraction}</p>}
        <div className="flex flex-wrap items-center gap-4 mb-5 text-white/60 text-sm">
          <span className="flex items-center gap-1.5"><Calendar size={13} />{fmtDate(ev.date)}</span>
          {ev.venue && <span className="flex items-center gap-1.5"><MapPin size={13} />{ev.venue}, {ev.city}</span>}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={e => { e.stopPropagation(); onPlan(ev.name) }}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black text-white shadow-lg hover:opacity-90 active:scale-[0.97] transition-all"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}99)` }}>
            <Sparkles size={13} />Plan This Trip
          </button>
          {ev.priceMin && (
            <div className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm text-white text-sm font-bold">
              From {ev.currency ?? 'USD'} {ev.priceMin.toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── REGULAR EVENT CARD ─────────────────────────────────────────────────────────

function EventCard({ ev, onPlan, index }: { ev: LiveEvent; onPlan: (n: string) => void; index: number }) {
  const color = catColor(ev.category)
  const days  = getDaysUntil(ev.date)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
      onClick={() => onPlan(ev.name)}
      className="group bg-white border-2 border-slate-100 rounded-2xl overflow-hidden hover:border-slate-200 hover:shadow-xl transition-all duration-300 cursor-pointer active:scale-[0.98]"
    >
      <div className="relative h-44 overflow-hidden bg-slate-900">
        {ev.image
          ? <img src={ev.image} alt={ev.name}
              className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
          : <div className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, #0F172A, ${color}40)` }}>
              <CatIcon cat={ev.category} size={36} />
            </div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full text-white"
            style={{ background: `${color}DD` }}>
            <CatIcon cat={ev.category} size={9} />
            {ev.category.charAt(0).toUpperCase() + ev.category.slice(1)}
          </span>
        </div>
        {days >= 0 && days <= 14 && (
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full bg-red-500 text-white">
              <Flame size={8} />{days <= 7 ? 'This week' : 'Soon'}
            </span>
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white font-black text-sm leading-tight line-clamp-2">{ev.name}</p>
          {ev.attraction && <p className="text-white/40 text-[11px] mt-0.5 truncate">{ev.attraction}</p>}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
              <Calendar size={10} className="flex-shrink-0" />{fmtDate(ev.date)}
              {days > 0 && days <= 60 && (
                <span className="ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: color }}>{days}d</span>
              )}
            </p>
            <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
              <MapPin size={10} className="flex-shrink-0" />
              {ev.venue ? `${ev.venue}, ` : ''}{ev.city}{ev.country ? `, ${ev.country}` : ''}
            </p>
          </div>
          {ev.priceMin && (
            <div className="text-right flex-shrink-0">
              <p className="text-[9px] text-slate-400 font-bold uppercase">From</p>
              <p className="text-xs font-black text-slate-900">
                {ev.currency ?? 'USD'} {ev.priceMin.toLocaleString()}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onPlan(ev.name) }}
          className="w-full py-2.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.97] transition-all"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}>
          <Sparkles size={11} />Plan This Trip
        </button>
      </div>
    </motion.div>
  )
}

// ── MAIN PAGE ──────────────────────────────────────────────────────────────────

const FILTERS = [
  { label: 'All',       value: 'all'     },
  { label: '🏆 Sports',  value: 'sports'  },
  { label: '🎵 Music',   value: 'music'   },
  { label: '🎪 Festival',value: 'festival'},
  { label: '🎭 Arts',    value: 'arts'    },
] as const

type FilterValue = typeof FILTERS[number]['value']

export default function ExploreEventsPage() {
  const router = useRouter()

  const [events,   setEvents]   = useState<LiveEvent[]>([])
  const [loading,  setLoading]  = useState(true)
  const [query,    setQuery]    = useState('')
  const [filter,   setFilter]   = useState<FilterValue>('all')
  const [city,     setCity]     = useState('')
  const [page,     setPage]     = useState(0)
  const [total,    setTotal]    = useState(0)
  const [pages,    setPages]    = useState(0)
  const [typing,   setTyping]   = useState(false)

  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const PAGE_SIZE   = 20

  const fetchEvents = useCallback(async (q: string, f: FilterValue, c: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        size: String(PAGE_SIZE),
        page: String(p),
      })
      if (q.trim())   params.set('keyword',  q.trim())
      if (f !== 'all') params.set('category', f)
      if (c.trim())   params.set('city',     c.trim())

      const res  = await fetch(`/api/explore-events?${params}`)
      const data = await res.json()

      if (data.success) {
        setEvents(data.events ?? [])
        setTotal(data.total ?? 0)
        setPages(data.pages ?? 0)
      } else {
        setEvents([])
      }
    } catch (err) {
      console.error('[explore]', err)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchEvents('', 'all', '', 0)
  }, [])

  // Debounced search
  useEffect(() => {
    setTyping(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setTyping(false)
      setPage(0)
      fetchEvents(query, filter, city, 0)
    }, 500)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, filter, city])

  // Page change
  useEffect(() => {
    if (page > 0) fetchEvents(query, filter, city, page)
  }, [page])

  function handlePlan(name: string) {
    router.push(`/?q=${encodeURIComponent(name)}`)
  }

  function handleFilterChange(f: FilterValue) {
    setFilter(f); setPage(0)
  }

  const hero = events[0]
  const rest = events.slice(1)

  return (
    <main className="min-h-screen bg-white"
      style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>
      <Navbar />

      {/* ── HERO SEARCH ── */}
      <section className="pt-28 pb-10 px-4 sm:px-6 border-b border-slate-100" style={{ background: '#F8FAFC' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full animate-pulse bg-emerald-500" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
              Live · Powered by Ticketmaster
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-3">
            Explore <span style={{ color: SKY }}>Any Event</span>
          </h1>
          <p className="text-base text-slate-500 mb-8 max-w-lg mx-auto">
            Search millions of events worldwide — concerts, sports, festivals, theatre. Find it, plan it, go.
          </p>

          {/* Search row */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto mb-5">
            {/* Keyword */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Artist, event, team, festival..."
                className="w-full h-12 pl-11 pr-10 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 text-sm outline-none focus:border-sky-400 transition-all shadow-sm"
              />
              {(typing || (loading && query)) && (
                <Loader2 size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-sky-500 animate-spin" />
              )}
              {query && !typing && !loading && (
                <button onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* City */}
            <div className="relative sm:w-44">
              <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="City (optional)"
                className="w-full h-12 pl-10 pr-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 text-sm outline-none focus:border-sky-400 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {FILTERS.map(f => (
              <button key={f.value} onClick={() => handleFilterChange(f.value)}
                className="px-4 py-2 rounded-full text-sm font-bold transition-all active:scale-[0.96]"
                style={{
                  background: filter === f.value
                    ? f.value === 'all' ? SKY : f.value === 'sports' ? SKY : f.value === 'music' ? '#8B5CF6' : f.value === 'festival' ? '#F97316' : '#10B981'
                    : '#E2E8F0',
                  color: filter === f.value ? 'white' : '#64748B',
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── RESULTS ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* Result count */}
        {!loading && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-bold text-slate-900">
                {total > 0
                  ? `${total.toLocaleString()} events found${query ? ` for "${query}"` : ''}${city ? ` in ${city}` : ''}`
                  : 'No events found'
                }
              </p>
              {pages > 1 && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Page {page + 1} of {pages}
                </p>
              )}
            </div>
            {(query || city || filter !== 'all') && (
              <button
                onClick={() => { setQuery(''); setCity(''); setFilter('all'); setPage(0) }}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all">
                <X size={12} />Clear all
              </button>
            )}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-5">
            <div className="h-80 rounded-3xl bg-slate-200 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {/* Events grid */}
        {!loading && events.length > 0 && (
          <div className="space-y-5">
            {/* Hero card — first result */}
            {hero && page === 0 && (
              <HeroEventCard ev={hero} onPlan={handlePlan} />
            )}

            {/* Rest in grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {(page === 0 ? rest : events).map((ev, i) => (
                <EventCard key={ev.id} ev={ev} onPlan={handlePlan} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && events.length === 0 && (
          <div className="text-center py-24">
            <Globe size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-xl font-black text-slate-900 mb-2">No events found</p>
            <p className="text-sm text-slate-400 mb-6 max-w-sm mx-auto">
              Try a different search term, remove the city filter, or browse all categories.
            </p>
            <button onClick={() => { setQuery(''); setCity(''); setFilter('all'); setPage(0) }}
              className="px-6 py-3 rounded-2xl text-sm font-black text-white shadow-md"
              style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
              Browse all events
            </button>
          </div>
        )}

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <ChevronLeft size={16} />Previous
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                const p = page < 3 ? i : page - 2 + i
                if (p >= pages) return null
                return (
                  <button key={p}
                    onClick={() => setPage(p)}
                    className="w-9 h-9 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background: p === page ? SKY : '#F1F5F9',
                      color: p === page ? 'white' : '#64748B',
                    }}>
                    {p + 1}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setPage(p => Math.min(pages - 1, p + 1))}
              disabled={page >= pages - 1}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              Next<ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Plan any event CTA */}
        <div className="mt-16 rounded-3xl p-8 sm:p-10 text-center border-2 border-dashed border-slate-200 bg-slate-50">
          <Ticket size={28} className="mx-auto mb-3 text-slate-300" />
          <h3 className="text-lg font-black text-slate-900 mb-2">
            Can't find your event?
          </h3>
          <p className="text-sm text-slate-400 mb-5 max-w-xs mx-auto">
            We can plan any event worldwide — even if it's not listed here. Just describe it on the homepage.
          </p>
          <Link href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black text-white shadow-md hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
            <Sparkles size={13} />Plan any event →
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  )
}