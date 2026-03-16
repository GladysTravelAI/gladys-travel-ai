'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Hotel, MapPin, Star, Wifi, Coffee, Dumbbell, ExternalLink, Bookmark, BookmarkCheck, Share2, Award, Utensils, Car, Waves } from 'lucide-react'
import ComingSoonBanner from '@/components/ComingSoonBanner'
import WaitlistModal from '@/components/WaitlistModal'

// ==================== TYPES ====================

interface HotelItem {
  id: string
  name: string
  price: string
  rating?: number
  location?: string
  image?: string
  amenities?: string[]
  description?: string
  bookingUrl?: string
  partner?: string
  pricePerNight?: string
  reviews?: number
  distanceFromCenter?: string
  roomType?: string
  dealBadge?: string
}

interface HotelResultsProps {
  hotels?: HotelItem[]
  onSaveItem?: (hotel: HotelItem) => void
  loading?: boolean
  comingSoon?: boolean
}

// ==================== AMENITY ICONS ====================

function AmenityIcon({ name }: { name: string }) {
  const icons: Record<string, any> = {
    WiFi: Wifi, Breakfast: Coffee, Gym: Dumbbell,
    Restaurant: Utensils, Parking: Car, Pool: Waves,
  }
  const Icon = icons[name] ?? Hotel
  return <Icon size={12} />
}

// ==================== COMING SOON STATE ====================

function HotelComingSoon() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="w-full space-y-6" style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');`}</style>

      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
          style={{ background: 'linear-gradient(135deg, #A78BFA, #7C3AED)' }}>
          <Hotel size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">Hotels</h2>
          <p className="text-xs text-slate-400">Best rates near every venue</p>
        </div>
      </div>

      {/* Coming soon banner */}
      <ComingSoonBanner type="hotels" onNotifyClick={() => setModalOpen(true)} />

      {/* Ghost skeleton cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-30 pointer-events-none select-none">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl overflow-hidden animate-pulse">
            <div className="h-44 bg-slate-200" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-slate-200 rounded-full w-3/4" />
              <div className="h-3 bg-slate-100 rounded-full w-1/2" />
              <div className="h-8 bg-slate-200 rounded-xl mt-3" />
            </div>
          </div>
        ))}
      </div>

      <WaitlistModal isOpen={modalOpen} onClose={() => setModalOpen(false)} source="hotels" />
    </div>
  )
}

// ==================== HOTEL CARD ====================

function HotelCard({
  hotel, index, isTopRated, isSaved, onBook, onSave, onShare,
}: {
  hotel: HotelItem; index: number; isTopRated: boolean
  isSaved: boolean; onBook: (h: HotelItem) => void; onSave: (h: HotelItem) => void; onShare: (h: HotelItem) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white border-2 rounded-2xl overflow-hidden transition-all hover:shadow-lg group ${
        isTopRated ? 'border-violet-300' : 'border-slate-100 hover:border-slate-200'
      }`}
      style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}
    >
      {/* Image */}
      {hotel.image && (
        <div className="relative h-44 overflow-hidden">
          <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {isTopRated && (
            <div className="absolute top-3 left-3">
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-violet-600 text-white flex items-center gap-1">
                <Award size={10} />Top Rated
              </span>
            </div>
          )}
          {hotel.dealBadge && (
            <div className="absolute top-3 right-3">
              <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-500 text-white">{hotel.dealBadge}</span>
            </div>
          )}
          {hotel.rating && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
              <Star size={11} className="text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-slate-900">{hotel.rating.toFixed(1)}</span>
            </div>
          )}
          {/* Hover actions */}
          <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onSave(hotel)}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${isSaved ? 'bg-violet-600 text-white' : 'bg-white/90'}`}>
              {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} className="text-slate-600" />}
            </button>
            <button onClick={() => onShare(hotel)}
              className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-md">
              <Share2 size={14} className="text-slate-600" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-slate-900 text-sm mb-1 line-clamp-1">{hotel.name}</h3>

        {hotel.location && (
          <p className="flex items-center gap-1 text-xs text-slate-400 mb-2">
            <MapPin size={11} />{hotel.location}
          </p>
        )}

        {hotel.description && (
          <p className="text-xs text-slate-500 mb-3 line-clamp-2">{hotel.description}</p>
        )}

        {hotel.amenities && hotel.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {hotel.amenities.slice(0, 4).map(a => (
              <span key={a} className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                <AmenityIcon name={a} />{a}
              </span>
            ))}
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <p className="text-xl font-black text-violet-600">{hotel.price}</p>
            {hotel.reviews && <p className="text-[10px] text-slate-400">{hotel.reviews} reviews</p>}
          </div>
          <button
            onClick={() => onBook(hotel)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-90 active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #A78BFA, #7C3AED)' }}
          >
            <ExternalLink size={12} />Book
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ==================== MAIN COMPONENT ====================

export default function HotelResults({ hotels = [], onSaveItem, loading = false, comingSoon = false }: HotelResultsProps) {
  const [savedHotels, setSavedHotels] = useState<Set<string>>(new Set())

  // Coming soon mode
  if (comingSoon || hotels.length === 0 && !loading) {
    return <HotelComingSoon />
  }

  // Loading
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl overflow-hidden animate-pulse">
            <div className="h-44 bg-slate-200" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-slate-200 rounded-full w-3/4" />
              <div className="h-3 bg-slate-100 rounded-full w-1/2" />
              <div className="h-8 bg-slate-200 rounded-xl mt-3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const topRated = hotels.reduce((a, b) => (b.rating ?? 0) > (a.rating ?? 0) ? b : a, hotels[0])

  const handleBook = (h: HotelItem) => {
    if (h.bookingUrl) window.open(h.bookingUrl, '_blank')
    else window.open(`https://www.booking.com/search?ss=${encodeURIComponent(h.name)}`, '_blank')
  }

  const handleSave = (h: HotelItem) => {
    const s = new Set(savedHotels)
    s.has(h.id) ? s.delete(h.id) : s.add(h.id)
    setSavedHotels(s)
    if (!savedHotels.has(h.id) && onSaveItem) onSaveItem(h)
  }

  const handleShare = async (h: HotelItem) => {
    if (navigator.share) await navigator.share({ title: h.name, url: window.location.href })
    else navigator.clipboard.writeText(window.location.href)
  }

  return (
    <div className="space-y-5" style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');`}</style>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
          style={{ background: 'linear-gradient(135deg, #A78BFA, #7C3AED)' }}>
          <Hotel size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">Hotels</h2>
          <p className="text-xs text-slate-400">{hotels.length} properties found</p>
        </div>
      </div>

      {/* Top rated pill */}
      {topRated?.rating && topRated.rating >= 4.5 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200 w-fit">
          <Award size={12} className="text-violet-600" />
          <span className="text-xs font-bold text-violet-700">Top Rated: {topRated.name} · {topRated.rating}⭐</span>
        </div>
      )}

      {/* Hotel grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {hotels.map((h, i) => (
          <HotelCard
            key={h.id} hotel={h} index={i}
            isTopRated={h.id === topRated?.id && (h.rating ?? 0) >= 4.5}
            isSaved={savedHotels.has(h.id)}
            onBook={handleBook} onSave={handleSave} onShare={handleShare}
          />
        ))}
      </div>
    </div>
  )
}