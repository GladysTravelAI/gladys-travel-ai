'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, BellOff, ChevronRight, Check, Ticket,
  Cloud, Navigation, Backpack, X, Loader2,
} from 'lucide-react'
import { schedulePreEventNotification, requestPermission } from '@/lib/pushNotifications'

const SKY = '#0EA5E9'

interface PreEventChecklistProps {
  eventName:   string
  eventDate:   string
  eventTime?:  string
  venue:       string
  city:        string
  ticketUrl?:  string
  accentColor?: string
  userId?:     string
}

interface CheckItem {
  id:       string
  icon:     React.ReactNode
  label:    string
  sublabel: string
  done:     boolean
  action?:  { label: string; href?: string; onClick?: () => void }
}

export default function PreEventChecklist({
  eventName, eventDate, eventTime, venue, city,
  ticketUrl, accentColor, userId,
}: PreEventChecklistProps) {
  const accent = accentColor || SKY

  const [expanded,    setExpanded]    = useState(false)
  const [notifState,  setNotifState]  = useState<'idle' | 'requesting' | 'set' | 'denied'>('idle')
  const [checks,      setChecks]      = useState<Record<string, boolean>>({})
  const [weather,     setWeather]     = useState<{ desc: string; temp: string } | null>(null)
  const [weatherLoad, setWeatherLoad] = useState(false)

  // How many days until the event
  const daysUntil = Math.ceil(
    (new Date(eventDate).getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000
  )
  const isUrgent  = daysUntil <= 1
  const isToday   = daysUntil === 0

  // Load saved checks from localStorage
  const storageKey = `gladys_checklist_${eventDate}`
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) setChecks(JSON.parse(saved))
    } catch {}
  }, [storageKey])

  const toggleCheck = (id: string) => {
    setChecks(prev => {
      const next = { ...prev, [id]: !prev[id] }
      try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch {}
      return next
    })
  }

  // Fetch weather for event day
  const fetchWeather = async () => {
    if (weather || weatherLoad) return
    setWeatherLoad(true)
    try {
      const res  = await fetch(`/api/gladys-chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Weather in ${city} on ${eventDate}` }),
      })
      const data = await res.json()
      if (data.toolResult?.today) {
        setWeather({
          desc: data.toolResult.today.description,
          temp: `${data.toolResult.today.minTemp}–${data.toolResult.today.maxTemp}°C`,
        })
      }
    } catch {}
    setWeatherLoad(false)
  }

  // Schedule push notification
  const scheduleNotif = async () => {
    setNotifState('requesting')
    const ok = await schedulePreEventNotification({
      eventName, eventDate, venue, userId,
    })
    setNotifState(ok ? 'set' : 'denied')
  }

  // Build checklist items
  const items: CheckItem[] = [
    {
      id:       'ticket',
      icon:     <Ticket size={15} />,
      label:    'Ticket ready',
      sublabel: 'Screenshot or save your ticket QR code',
      done:     !!checks['ticket'],
      action:   ticketUrl ? { label: 'View ticket', href: ticketUrl } : undefined,
    },
    {
      id:       'weather',
      icon:     <Cloud size={15} />,
      label:    weather ? `${weather.desc} · ${weather.temp}` : 'Check event-day weather',
      sublabel: weather ? 'Dress accordingly' : `${city} forecast for ${eventDate}`,
      done:     !!checks['weather'],
      action:   !weather ? { label: 'Check', onClick: fetchWeather } : undefined,
    },
    {
      id:       'transport',
      icon:     <Navigation size={15} />,
      label:    'Transport planned',
      sublabel: `Know how you're getting to ${venue}`,
      done:     !!checks['transport'],
      action:   {
        label: 'Get directions',
        href:  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue + ', ' + city)}&travelmode=transit`,
      },
    },
    {
      id:       'packing',
      icon:     <Backpack size={15} />,
      label:    'Bag packed',
      sublabel: 'ID, phone, charger, cash, ticket',
      done:     !!checks['packing'],
    },
  ]

  const doneCount  = items.filter(i => checks[i.id]).length
  const allDone    = doneCount === items.length
  const progress   = doneCount / items.length

  return (
    <div className={`rounded-3xl overflow-hidden border-2 bg-white transition-all ${
      isUrgent ? 'border-amber-300' : 'border-slate-100'
    }`}>

      {/* Header */}
      <button
        onClick={() => { setExpanded(!expanded); if (!expanded) fetchWeather(); }}
        className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="relative w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: allDone ? '#D1FAE5' : isUrgent ? '#FEF3C7' : accent + '15' }}>
          <Bell size={20} style={{ color: allDone ? '#10B981' : isUrgent ? '#F59E0B' : accent }} />
          {isUrgent && !allDone && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-white animate-pulse" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-900 text-sm">
            {isToday   ? 'Event Day Checklist 🎉'
            : daysUntil === 1 ? 'Event Tomorrow — Get Ready!'
            : `Event in ${daysUntil} days`}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            {/* Progress bar */}
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: allDone ? '#10B981' : accent }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <span className="text-[10px] font-black text-slate-400 flex-shrink-0">
              {doneCount}/{items.length}
            </span>
          </div>
        </div>

        <ChevronRight size={16}
          className={`text-slate-300 flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="p-5 space-y-4">

              {/* Push notification toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl"
                style={{ background: accent + '08', border: `1.5px solid ${accent}25` }}>
                <div className="flex items-center gap-3">
                  {notifState === 'set'
                    ? <Bell size={15} className="text-emerald-500" />
                    : notifState === 'denied'
                    ? <BellOff size={15} className="text-red-400" />
                    : <Bell size={15} style={{ color: accent }} />
                  }
                  <div>
                    <p className="text-xs font-black text-slate-900">
                      {notifState === 'set'
                        ? '24hr alert set ✓'
                        : notifState === 'denied'
                        ? 'Notifications blocked'
                        : 'Get a 24hr reminder'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {notifState === 'set'
                        ? `You'll be notified before ${eventName}`
                        : notifState === 'denied'
                        ? 'Enable in browser settings → Site permissions'
                        : "We'll remind you the day before your event"}
                    </p>
                  </div>
                </div>
                {notifState === 'idle' && (
                  <button
                    onClick={scheduleNotif}
                    className="text-xs font-black px-3 py-2 rounded-xl text-white flex-shrink-0 transition-opacity hover:opacity-90"
                    style={{ background: `linear-gradient(135deg, #38BDF8, #0284C7)` }}>
                    Set Alert
                  </button>
                )}
                {notifState === 'requesting' && (
                  <Loader2 size={16} className="animate-spin flex-shrink-0" style={{ color: accent }} />
                )}
                {notifState === 'set' && (
                  <Check size={18} className="text-emerald-500 flex-shrink-0" />
                )}
              </div>

              {/* Checklist items */}
              <div className="space-y-2">
                {items.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                      checks[item.id]
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleCheck(item.id)}
                      className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        checks[item.id]
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-slate-300 hover:border-sky-400'
                      }`}
                    >
                      {checks[item.id] && <Check size={12} className="text-white" />}
                    </button>

                    {/* Icon */}
                    <div className={`flex-shrink-0 ${checks[item.id] ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {item.icon}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-black leading-tight ${checks[item.id] ? 'text-emerald-700 line-through' : 'text-slate-900'}`}>
                        {item.label}
                        {item.id === 'weather' && weatherLoad && (
                          <Loader2 size={10} className="inline ml-1.5 animate-spin text-slate-400" />
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.sublabel}</p>
                    </div>

                    {/* Action */}
                    {item.action && !checks[item.id] && (
                      item.action.href ? (
                        <a
                          href={item.action.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-black px-2.5 py-1.5 rounded-xl border-2 transition-all flex-shrink-0"
                          style={{ borderColor: accent, color: accent }}
                        >
                          {item.action.label}
                        </a>
                      ) : (
                        <button
                          onClick={item.action.onClick}
                          className="text-[10px] font-black px-2.5 py-1.5 rounded-xl border-2 transition-all flex-shrink-0"
                          style={{ borderColor: accent, color: accent }}
                        >
                          {item.action.label}
                        </button>
                      )
                    )}
                  </div>
                ))}
              </div>

              {/* All done */}
              {allDone && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500 text-white"
                >
                  <span className="text-2xl">🎉</span>
                  <div>
                    <p className="text-sm font-black">You're all set!</p>
                    <p className="text-xs opacity-80">Have an amazing time at {eventName}</p>
                  </div>
                </motion.div>
              )}

              {/* Event info strip */}
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                {eventTime && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50">
                    <span>🕐</span>{eventTime} kickoff / doors
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50">
                  <span>📍</span><span className="truncate">{venue}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}