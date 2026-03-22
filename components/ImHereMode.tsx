'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Locate, Utensils, Wine, Star, ExternalLink, Bell, ChevronRight, Navigation, Loader2 } from 'lucide-react'
import { showDoorsOpenNotification, requestPermission } from '@/lib/pushNotifications'

const SKY = '#0EA5E9'
const NEAR_THRESHOLD = 500 // metres — "you're here" when within 500m

interface ImHereModeProps {
  venue:       string
  city:        string
  eventName:   string
  eventDate:   string
  eventTime?:  string  // HH:MM
  accentColor?: string
}

interface NearbyPlace {
  name:     string
  category: string
  distance: string
  rating?:  string | null
  link:     string
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R    = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a    = Math.sin(dLat / 2) ** 2 +
               Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
               Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function catIcon(cat: string) {
  const c = cat.toLowerCase()
  if (c.includes('food') || c.includes('restaurant') || c.includes('dining')) return '🍽'
  if (c.includes('bar') || c.includes('night') || c.includes('drink'))        return '🍸'
  if (c.includes('coffee') || c.includes('café') || c.includes('cafe'))       return '☕'
  if (c.includes('shop') || c.includes('retail'))                             return '🛍'
  if (c.includes('park') || c.includes('garden') || c.includes('outdoor'))   return '🌿'
  return '📍'
}

export default function ImHereMode({
  venue, city, eventName, eventDate, eventTime, accentColor,
}: ImHereModeProps) {
  const accent = accentColor || SKY

  const [mode,       setMode]       = useState<'idle' | 'locating' | 'near' | 'far' | 'error'>('idle')
  const [places,     setPlaces]     = useState<NearbyPlace[]>([])
  const [placesLoad, setPlacesLoad] = useState(false)
  const [expanded,   setExpanded]   = useState(false)
  const [distanceM,  setDistanceM]  = useState<number | null>(null)
  const [notifSet,   setNotifSet]   = useState(false)
  const [doorsMsg,   setDoorsMsg]   = useState<string | null>(null)
  const watchRef = useRef<number | null>(null)

  // Check if event is today
  const today   = new Date().toISOString().split('T')[0]
  const isToday = eventDate === today

  // Calculate minutes until doors open (assume 1h before event time)
  const getMinutesUntilDoors = () => {
    if (!eventTime) return null
    const [h, m]  = eventTime.split(':').map(Number)
    const eventMs = new Date().setHours(h - 1, m, 0, 0) // doors 1hr before
    return Math.ceil((eventMs - Date.now()) / 60_000)
  }

  // Fetch nearby places via Foursquare
  const fetchNearby = async () => {
    setPlacesLoad(true)
    try {
      const res  = await fetch('/api/gladys-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `What are the best bars, restaurants and cafes near ${venue} in ${city}?` }),
      })
      const data = await res.json()
      if (data.toolResult?.places?.length) {
        setPlaces(data.toolResult.places.slice(0, 6))
      }
    } catch { /* silent */ }
    finally { setPlacesLoad(false) }
  }

  // Geocode venue to check proximity
  const geocodeVenue = async (): Promise<{ lat: number; lng: number } | null> => {
    try {
      const res  = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(venue + ' ' + city)}&count=1&language=en&format=json`
      )
      const data = await res.json()
      if (!data.results?.[0]) return null
      return { lat: data.results[0].latitude, lng: data.results[0].longitude }
    } catch { return null }
  }

  const startLocating = async () => {
    if (!navigator.geolocation) { setMode('error'); return }
    setMode('locating')

    const venueCoords = await geocodeVenue()

    watchRef.current = navigator.geolocation.watchPosition(
      pos => {
        const { latitude, longitude } = pos.coords
        if (venueCoords) {
          const dist = getDistance(latitude, longitude, venueCoords.lat, venueCoords.lng)
          setDistanceM(Math.round(dist))

          if (dist <= NEAR_THRESHOLD) {
            setMode('near')
            setExpanded(true)
            fetchNearby()

            // Check doors notification
            const mins = getMinutesUntilDoors()
            if (mins !== null && mins <= 30 && mins >= 0) {
              setDoorsMsg(mins === 0 ? 'Doors are open now!' : `Doors open in ${mins} minutes!`)
              showDoorsOpenNotification(eventName, mins)
            }
          } else {
            setMode('far')
          }
        } else {
          setMode('far')
        }
      },
      () => setMode('error'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    )
  }

  const stopLocating = () => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = null
    }
    setMode('idle')
    setDistanceM(null)
  }

  useEffect(() => () => stopLocating(), [])

  const scheduleDoorsNotif = async () => {
    const granted = await requestPermission()
    if (granted) {
      setNotifSet(true)
      // Check every minute and fire when doors open
      const check = setInterval(() => {
        const mins = getMinutesUntilDoors()
        if (mins !== null && mins <= 30 && mins >= 0) {
          showDoorsOpenNotification(eventName, mins)
          clearInterval(check)
        }
      }, 60_000)
    }
  }

  const uberUrl = `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${encodeURIComponent(venue + ', ' + city)}`

  return (
    <div className={`rounded-3xl overflow-hidden border-2 bg-white transition-all ${mode === 'near' ? 'border-emerald-300' : 'border-slate-100'}`}>

      {/* Header */}
      <button
        onClick={() => mode === 'near' ? setExpanded(!expanded) : startLocating()}
        className="w-full flex items-center gap-4 p-5 text-left transition-colors hover:bg-slate-50"
      >
        <div className="relative w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: mode === 'near' ? '#D1FAE5' : accent + '15' }}>
          <Locate size={20} style={{ color: mode === 'near' ? '#10B981' : accent }} />
          {mode === 'near' && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-900 text-sm">
            {mode === 'near'   ? "You're at the venue! 🎉"
            : mode === 'far'   ? `${distanceM ? `${distanceM < 1000 ? distanceM + 'm' : (distanceM / 1000).toFixed(1) + 'km'} away` : 'Away from venue'}`
            : mode === 'locating' ? 'Detecting your location...'
            : mode === 'error' ? 'Location unavailable'
            : "I'm Here Mode"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">
            {mode === 'idle'   ? 'Tap to detect when you arrive at the venue'
            : mode === 'near'  ? `Near ${venue}`
            : mode === 'far'   ? `Head to ${venue}`
            : mode === 'error' ? 'Enable location access in your browser'
            : 'Checking distance to venue...'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {mode === 'locating' && <Loader2 size={15} className="animate-spin text-slate-400" />}
          {mode !== 'idle' && mode !== 'locating' && mode !== 'error' && (
            <button onClick={e => { e.stopPropagation(); stopLocating(); }}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-all">
              Stop
            </button>
          )}
          {mode === 'near' && (
            <ChevronRight size={16} className={`text-slate-300 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          )}
        </div>
      </button>

      {/* Doors open alert */}
      {doorsMsg && (
        <div className="mx-5 mb-3 flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-500 text-white">
          <Bell size={16} className="flex-shrink-0" />
          <p className="text-sm font-black">{doorsMsg}</p>
        </div>
      )}

      {/* Expanded content — shown when near venue */}
      <AnimatePresence>
        {expanded && mode === 'near' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="p-5 space-y-4">

              {/* Quick actions */}
              <div className="grid grid-cols-3 gap-2">
                <a href={uberUrl} target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-black text-white text-xs font-bold text-center">
                  🚗<span>Uber home</span>
                </a>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('toilets near ' + venue + ' ' + city)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 border-slate-200 text-xs font-bold text-slate-600 text-center">
                  🚻<span>Toilets</span>
                </a>
                <button
                  onClick={scheduleDoorsNotif}
                  disabled={notifSet}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 border-slate-200 text-xs font-bold text-slate-600 text-center disabled:opacity-50">
                  {notifSet ? '✅' : '🔔'}<span>{notifSet ? 'Set!' : 'Door alert'}</span>
                </button>
              </div>

              {/* Nearby food & bars */}
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                  🍔 Nearby food & drinks
                </p>
                {placesLoad ? (
                  <div className="flex items-center gap-2 py-3 text-slate-400 text-xs">
                    <Loader2 size={14} className="animate-spin" />Finding nearby places...
                  </div>
                ) : places.length > 0 ? (
                  <div className="space-y-2">
                    {places.map((p, i) => (
                      <a key={i} href={p.link} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors group">
                        <span className="text-lg leading-none flex-shrink-0">{catIcon(p.category)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-xs truncate group-hover:underline">{p.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400">{p.distance}</span>
                            {p.rating && <span className="text-[10px] font-bold text-amber-500">★ {p.rating}</span>}
                          </div>
                        </div>
                        <ExternalLink size={11} className="text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <button onClick={fetchNearby}
                    className="text-xs font-bold px-4 py-2 rounded-xl border-2 border-slate-200 text-slate-600 hover:border-slate-300 transition-all">
                    Find food & bars nearby
                  </button>
                )}
              </div>

              {/* Note on queue times */}
              <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <Star size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Arrive at least 45 minutes before the event to clear security and find your seat.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}