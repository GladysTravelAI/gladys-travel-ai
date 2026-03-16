'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plane, Clock, ArrowRight, ExternalLink, Bookmark, BookmarkCheck, Share2, Zap, TrendingUp } from 'lucide-react'
import ComingSoonBanner from '@/components/ComingSoonBanner'
import WaitlistModal from '@/components/WaitlistModal'

// ==================== TYPES ====================

interface Flight {
  id: string
  airline: string
  flightNumber: string
  departureTime: string
  arrivalTime: string
  duration: string
  price: string
  stops: number
  departureAirport: string
  arrivalAirport: string
  cabinClass?: string
  bookingUrl?: string
  partner?: string
  featured?: boolean
}

interface FlightResultsProps {
  flights?: Flight[]
  onSaveItem?: (flight: Flight) => void
  loading?: boolean
  comingSoon?: boolean
}

// ==================== COMING SOON STATE ====================

function FlightComingSoon() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div
      className="w-full space-y-6"
      style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');`}</style>

      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
          style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
          <Plane size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">Flights</h2>
          <p className="text-xs text-slate-400">Direct connections from 200+ cities</p>
        </div>
      </div>

      {/* Coming soon banner */}
      <ComingSoonBanner type="flights" onNotifyClick={() => setModalOpen(true)} />

      {/* Ghost skeleton cards */}
      <div className="space-y-3 opacity-30 pointer-events-none select-none">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-slate-200 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded-full w-1/3" />
              <div className="h-3 bg-slate-100 rounded-full w-1/2" />
            </div>
            <div className="space-y-2 text-right">
              <div className="h-5 bg-slate-200 rounded-full w-20" />
              <div className="h-3 bg-slate-100 rounded-full w-16" />
            </div>
          </div>
        ))}
      </div>

      <WaitlistModal isOpen={modalOpen} onClose={() => setModalOpen(false)} source="flights" />
    </div>
  )
}

// ==================== FLIGHT CARD ====================

function FlightCard({
  flight, index, isCheapest, isFastest, isSaved, onBook, onSave, onShare,
}: {
  flight: Flight; index: number; isCheapest: boolean; isFastest: boolean
  isSaved: boolean; onBook: (f: Flight) => void; onSave: (f: Flight) => void; onShare: (f: Flight) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white border-2 rounded-2xl p-5 transition-all hover:shadow-lg ${
        isCheapest ? 'border-emerald-300' : isFastest ? 'border-sky-300' : 'border-slate-100'
      }`}
      style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Airline */}
        <div className="flex items-center gap-3 flex-1">
          <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Plane size={20} className="text-slate-600" />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">{flight.airline}</p>
            <p className="text-xs text-slate-400">{flight.flightNumber}</p>
          </div>
          {isCheapest && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Best Price</span>
          )}
          {isFastest && !isCheapest && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">Fastest</span>
          )}
        </div>

        {/* Route */}
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-xl font-black text-slate-900">{flight.departureTime}</p>
            <p className="text-xs text-slate-400">{flight.departureAirport}</p>
          </div>
          <div className="flex flex-col items-center gap-0.5 px-2">
            <p className="text-[10px] text-slate-400">{flight.duration}</p>
            <div className="flex items-center gap-1">
              <div className="h-px w-8 bg-slate-300" />
              <Plane size={12} className="text-slate-400" />
              <div className="h-px w-8 bg-slate-300" />
            </div>
            <p className="text-[10px] text-slate-400">{flight.stops === 0 ? 'Direct' : `${flight.stops} stop`}</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-black text-slate-900">{flight.arrivalTime}</p>
            <p className="text-xs text-slate-400">{flight.arrivalAirport}</p>
          </div>
        </div>

        {/* Price + actions */}
        <div className="flex sm:flex-col items-center sm:items-end gap-3">
          <div className="text-right">
            <p className="text-2xl font-black text-sky-600">{flight.price}</p>
            <p className="text-[10px] text-slate-400">per person</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onBook(flight)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-90 active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}
            >
              <ExternalLink size={12} />Book
            </button>
            <button onClick={() => onSave(flight)}
              className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${isSaved ? 'bg-violet-50 border-violet-300' : 'border-slate-200 hover:border-slate-300'}`}>
              {isSaved ? <BookmarkCheck size={14} className="text-violet-600" /> : <Bookmark size={14} className="text-slate-400" />}
            </button>
            <button onClick={() => onShare(flight)}
              className="w-8 h-8 rounded-xl border-2 border-slate-200 hover:border-slate-300 flex items-center justify-center transition-all">
              <Share2 size={14} className="text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ==================== MAIN COMPONENT ====================

export default function FlightResults({ flights = [], onSaveItem, loading = false, comingSoon = false }: FlightResultsProps) {
  const [savedFlights, setSavedFlights] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)

  // Coming soon mode
  if (comingSoon || flights.length === 0 && !loading) {
    return <FlightComingSoon />
  }

  // Loading
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 animate-pulse">
            <div className="flex gap-4">
              <div className="w-11 h-11 bg-slate-200 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded-full w-1/3" />
                <div className="h-3 bg-slate-100 rounded-full w-1/2" />
              </div>
              <div className="w-20 h-8 bg-slate-200 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const cheapest = flights.reduce((a, b) =>
    parseFloat(a.price.replace(/\D/g, '')) < parseFloat(b.price.replace(/\D/g, '')) ? a : b
  , flights[0])

  const fastest = flights.reduce((a, b) => {
    const parse = (d: string) => { const h = d.match(/(\d+)h/); const m = d.match(/(\d+)m/); return (h ? +h[1] : 0) * 60 + (m ? +m[1] : 0) }
    return parse(a.duration) < parse(b.duration) ? a : b
  }, flights[0])

  const handleBook = (f: Flight) => {
    if (f.bookingUrl) window.open(f.bookingUrl, '_blank')
    else window.open(`https://www.skyscanner.com/transport/flights/${f.departureAirport}/${f.arrivalAirport}`, '_blank')
  }

  const handleSave = (f: Flight) => {
    const s = new Set(savedFlights)
    s.has(f.id) ? s.delete(f.id) : s.add(f.id)
    setSavedFlights(s)
    if (!savedFlights.has(f.id) && onSaveItem) onSaveItem(f)
  }

  const handleShare = async (f: Flight) => {
    if (navigator.share) await navigator.share({ title: `${f.airline} ${f.flightNumber}`, url: window.location.href })
    else navigator.clipboard.writeText(window.location.href)
  }

  return (
    <div className="space-y-4" style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');`}</style>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
            style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
            <Plane size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Flights</h2>
            <p className="text-xs text-slate-400">{flights.length} options found</p>
          </div>
        </div>
      </div>

      {/* Best deal pills */}
      <div className="flex gap-2 flex-wrap">
        {cheapest && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
            <TrendingUp size={12} className="text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700">Best price: {cheapest.airline} · {cheapest.price}</span>
          </div>
        )}
        {fastest && fastest.id !== cheapest?.id && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200">
            <Zap size={12} className="text-sky-600" />
            <span className="text-xs font-bold text-sky-700">Fastest: {fastest.airline} · {fastest.duration}</span>
          </div>
        )}
      </div>

      {/* Flight cards */}
      <div className="space-y-3">
        {flights.map((f, i) => (
          <FlightCard
            key={f.id} flight={f} index={i}
            isCheapest={f.id === cheapest?.id}
            isFastest={f.id === fastest?.id}
            isSaved={savedFlights.has(f.id)}
            onBook={handleBook} onSave={handleSave} onShare={handleShare}
          />
        ))}
      </div>
    </div>
  )
}