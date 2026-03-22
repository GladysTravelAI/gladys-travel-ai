'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Car, ChevronRight, ExternalLink, Loader2, Star, Navigation, Clock } from 'lucide-react'

const SKY = '#0EA5E9'

interface ParkingHubProps {
  venue:        string
  city:         string
  eventDate?:   string
  accentColor?: string
}

interface ParkingOption {
  id:          string
  name:        string
  address:     string
  distance:    string
  walkTime:    string
  walkMinutes: number
  rating?:     number
  openNow?:    boolean
  mapsUrl:     string
  spothero:    string
  parkwhiz:    string
}

export default function ParkingHub({ venue, city, eventDate, accentColor }: ParkingHubProps) {
  const accent = accentColor || SKY

  const [expanded, setExpanded] = useState(false)
  const [parking,  setParking]  = useState<ParkingOption[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [loaded,   setLoaded]   = useState(false)

  const fetchParking = async () => {
    if (loaded) { setExpanded(!expanded); return }
    setExpanded(true)
    setLoading(true)
    setError('')

    try {
      const res  = await fetch(`/api/parking?venue=${encodeURIComponent(venue)}&city=${encodeURIComponent(city)}`)
      const data = await res.json()

      if (data.error && !data.parking?.length) {
        setError(data.error || 'Could not find parking options')
      } else {
        setParking(data.parking ?? [])
        setLoaded(true)
      }
    } catch {
      setError('Could not load parking options')
    } finally {
      setLoading(false)
    }
  }

  const uberUrl = `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${encodeURIComponent(venue + ', ' + city)}`

  return (
    <div className="rounded-3xl overflow-hidden border-2 border-slate-100 bg-white">
      {/* Header */}
      <button
        onClick={fetchParking}
        className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: accent + '15' }}>
          <Car size={20} style={{ color: accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-900 text-sm">Parking & Transport</p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            {loaded ? `${parking.length} options near ${venue}` : `Find parking near ${venue}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {loading && <Loader2 size={15} className="animate-spin text-slate-400" />}
          <ChevronRight size={16} className={`text-slate-300 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="p-5 space-y-4">

              {/* Always show transport quick links */}
              <div className="grid grid-cols-2 gap-2">
                <a href={uberUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-black text-white text-xs font-black transition-opacity hover:opacity-90">
                  🚗 Book Uber
                </a>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue + ', ' + city)}&travelmode=transit`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-slate-200 text-xs font-black text-slate-600 hover:border-slate-300 transition-all">
                  🚌 Transit
                </a>
              </div>

              {/* Affiliate promo */}
              <div className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: accent + '08', border: `1.5px solid ${accent}20` }}>
                <Car size={18} style={{ color: accent }} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-900">Save up to 50% on parking</p>
                  <p className="text-[10px] text-slate-400">Book in advance via SpotHero or ParkWhiz</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <a href={`https://spothero.com/search?utm_source=gladystravel`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-[10px] font-black px-2.5 py-1.5 rounded-xl text-white"
                    style={{ background: accent }}>
                    SpotHero
                  </a>
                </div>
              </div>

              {error && (
                <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {error} — Try searching Google Maps for parking near {venue}.
                </div>
              )}

              {loading && (
                <div className="flex items-center gap-2 py-4 text-slate-400 text-xs justify-center">
                  <Loader2 size={16} className="animate-spin" />Finding parking options...
                </div>
              )}

              {/* Parking list */}
              {parking.length > 0 && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                    Nearby parking
                  </p>
                  <div className="space-y-2">
                    {parking.map((p, i) => (
                      <div key={p.id || i}
                        className="flex items-start gap-3 p-4 rounded-2xl border-2 border-slate-100 hover:border-slate-200 transition-all">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: accent + '10' }}>
                          <Car size={15} style={{ color: accent }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900 text-sm truncate">{p.name}</p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">{p.address}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                              <Navigation size={9} />{p.distance}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                              <Clock size={9} />{p.walkTime}
                            </span>
                            {p.rating && (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                                <Star size={9} fill="#F59E0B" />{p.rating}
                              </span>
                            )}
                            {p.openNow === false && (
                              <span className="text-[10px] font-bold text-red-400">Closed</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <a href={p.spothero} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] font-black px-2.5 py-1.5 rounded-xl text-white text-center"
                            style={{ background: accent }}>
                            Book
                          </a>
                          <a href={p.mapsUrl} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-500 text-center hover:bg-slate-50">
                            Map
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!loading && loaded && parking.length === 0 && !error && (
                <div className="text-center py-4">
                  <p className="text-xs text-slate-400">No parking found nearby</p>
                  <a href={`https://www.google.com/maps/search/parking+near+${encodeURIComponent(venue + ' ' + city)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold"
                    style={{ color: accent }}>
                    <ExternalLink size={11} />Search on Google Maps
                  </a>
                </div>
              )}

              {/* Public transport tip */}
              <div className="flex items-start gap-2 p-3 rounded-2xl bg-sky-50 border border-sky-200">
                <span className="text-sm flex-shrink-0">💡</span>
                <p className="text-xs text-sky-800">
                  Events cause major congestion. Public transport or Uber is usually faster than driving on event day.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}