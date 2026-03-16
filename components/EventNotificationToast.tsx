"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUpRight, Flame, MapPin, Calendar, Ticket } from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Trademark-safe category display ─────────────────────────────────────────

function getSafeDisplay(event: LiveEvent): { tag: string; color: string; gradient: string } {
  const name = (event.name       ?? "").toLowerCase()
  const attr = (event.attraction ?? "").toLowerCase()

  if (name.includes("world cup") || name.includes("fifa") || attr.includes("world cup"))
    return { tag: "⚽ International Football", color: "#10B981", gradient: "linear-gradient(135deg,#064E3B,#065F46,#0F172A)" }
  if (name.includes("champions league"))
    return { tag: "⚽ Club Football",          color: "#3B82F6", gradient: "linear-gradient(135deg,#1E3A5F,#1E3A8A,#0F172A)" }
  if (name.includes("super bowl"))
    return { tag: "🏈 American Football",      color: "#EF4444", gradient: "linear-gradient(135deg,#7F1D1D,#991B1B,#0F172A)" }
  if (name.includes("nba") || name.includes("basketball"))
    return { tag: "🏀 Basketball",             color: "#F97316", gradient: "linear-gradient(135deg,#7C2D12,#9A3412,#0F172A)" }
  if (name.includes("nhl") || name.includes("hockey"))
    return { tag: "🏒 Hockey",                color: "#0EA5E9", gradient: "linear-gradient(135deg,#0C4A6E,#075985,#0F172A)" }
  if (event.category === 'sports')
    return { tag: "🏆 Live Sports",            color: "#0EA5E9", gradient: "linear-gradient(135deg,#0C4A6E,#075985,#0F172A)" }
  if (event.category === 'festival')
    return { tag: "🎪 Festival",               color: "#F59E0B", gradient: "linear-gradient(135deg,#78350F,#92400E,#1C1917)" }
  if (event.category === 'music')
    return { tag: "🎵 Live Music",             color: "#8B5CF6", gradient: "linear-gradient(135deg,#4C1D95,#5B21B6,#0F172A)" }
  return   { tag: "🎫 Live Event",             color: "#6B7280", gradient: "linear-gradient(135deg,#1F2937,#374151,#0F172A)" }
}

// Never output FIFA / World Cup from our own UI text
function getSafeName(event: LiveEvent): string {
  const low = (event.name ?? "").toLowerCase()
  if (low.includes("fifa world cup") || low.includes("fifa"))
    return "North America 2026 — Football Championship"
  if (low.includes("uefa champions league"))
    return "UEFA Club Football Championship"
  return event.name
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  })
}

const DISMISS_KEY  = (id: string) => `gladys_toast_v4_${id}`
const DISMISS_COOL = 12 // hours before re-showing

function wasDismissed(id: string): boolean {
  try {
    const ts = localStorage.getItem(DISMISS_KEY(id))
    return !!ts && (Date.now() - parseInt(ts)) / 3_600_000 < DISMISS_COOL
  } catch { return false }
}

function markDismissed(id: string) {
  try { localStorage.setItem(DISMISS_KEY(id), Date.now().toString()) } catch {}
}

// Pick the best event — highest rank, has image, not dismissed, in future
function pickBestEvent(events: LiveEvent[]): LiveEvent | null {
  const today = new Date().toISOString().split("T")[0]
  return events
    .filter(e => e.date >= today)
    .filter(e => !wasDismissed(e.id))
    .filter(e => !!e.image) // only real images from Ticketmaster / API-Football
    .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))[0] ?? null
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  userLocation?: string
  onDismiss?:    () => void
}

export default function EventNotificationToast({ userLocation, onDismiss }: Props) {
  const [visible,  setVisible]  = useState(false)
  const [event,    setEvent]    = useState<LiveEvent | null>(null)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    let dead = false

    async function load() {
      try {
        const res  = await fetch("/api/featured-events", { signal: AbortSignal.timeout(8000) })
        const data = await res.json()
        if (dead || !data.success) return

        const best = pickBestEvent(data.events ?? [])
        if (!best || dead) return

        setEvent(best)
        const t = setTimeout(() => { if (!dead) setVisible(true) }, 3500)
        return () => clearTimeout(t)
      } catch (err) {
        console.warn("[EventNotificationToast]", err)
      }
    }

    load()
    return () => { dead = true }
  }, [])

  const dismiss = useCallback(() => {
    setVisible(false)
    if (event) markDismissed(event.id)
    onDismiss?.()
  }, [event, onDismiss])

  if (!event) return null

  const days        = getDaysUntil(event.date)
  const isHot       = days >= 0 && days <= 14
  const display     = getSafeDisplay(event)
  const safeName    = getSafeName(event)
  const location    = [event.city, event.country].filter(Boolean).join(", ")
  const progressPct = days > 0 && days <= 180 ? Math.max(4, 100 - (days / 180) * 100) : 0
  const ctaUrl      = event.ticketUrl || `/events/${event.id}`
  const isExternal  = !!event.ticketUrl

  const ctaBase = "flex items-center justify-between w-full px-4 py-3 rounded-2xl text-sm font-black text-white transition-all hover:opacity-90 active:scale-[0.98] group"

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.93 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={{   opacity: 0, y: 20,  scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          className="fixed bottom-24 right-5 z-40 w-[320px]"
          style={{
            maxWidth: "calc(100vw - 20px)",
            fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
          }}
        >
          <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');`}</style>

          <div
            className="rounded-3xl overflow-hidden"
            style={{ boxShadow: `0 24px 60px -12px ${display.color}50, 0 8px 32px -4px rgba(0,0,0,0.5)` }}
          >
            {/* ── Hero image (real from Ticketmaster/API-Football) ── */}
            <div className="relative w-full h-[165px] overflow-hidden">

              {event.image && !imgError ? (
                <img
                  src={event.image}
                  alt={safeName}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: display.gradient }}
                >
                  <span className="text-6xl opacity-25">{display.tag.split(" ")[0]}</span>
                </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent" />

              {/* Category pill */}
              <div className="absolute top-3 left-3">
                <span
                  className="text-[11px] font-black px-2.5 py-1 rounded-full text-white"
                  style={{ background: `${display.color}DD`, backdropFilter: "blur(8px)" }}
                >
                  {display.tag}
                </span>
              </div>

              {/* Hot badge */}
              {isHot && (
                <div className="absolute top-3 right-9">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                    className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full"
                  >
                    <Flame size={9} />{days <= 7 ? "This week" : "Soon"}
                  </motion.span>
                </div>
              )}

              {/* Dismiss button */}
              <button
                onClick={dismiss}
                aria-label="Dismiss notification"
                className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
              >
                <X size={12} />
              </button>

              {/* Event name at bottom of image */}
              <div className="absolute bottom-3 left-4 right-4">
                <p className="text-white font-black text-[15px] leading-snug line-clamp-2 drop-shadow-lg">
                  {safeName}
                </p>
                {event.attraction && event.attraction !== event.name && (
                  <p className="text-white/40 text-[11px] mt-0.5 line-clamp-1">{event.attraction}</p>
                )}
              </div>
            </div>

            {/* ── Info body ─────────────────────── */}
            <div className="bg-[#0F172A] px-4 pt-3 pb-4 space-y-3">

              {/* Date + price */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <Calendar size={11} className="text-slate-500 flex-shrink-0" />
                    {formatDate(event.date)}{event.time ? ` · ${event.time}` : ""}
                  </p>
                  {location && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin size={11} className="flex-shrink-0" />
                      <span className="truncate">{location}</span>
                    </p>
                  )}
                  {event.venue && event.venue !== event.city && (
                    <p className="text-xs text-slate-600 pl-[19px] truncate">{event.venue}</p>
                  )}
                </div>

                {event.priceMin && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider font-bold">From</p>
                    <p className="text-sm font-black text-white">
                      {event.currency ?? "USD"} {event.priceMin.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Countdown progress bar */}
              {progressPct > 0 && (
                <div className="h-0.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1.4, delay: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: display.color }}
                  />
                </div>
              )}

              {/* CTA */}
              {isExternal ? (
                <a
                  href={ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={dismiss}
                  className={ctaBase}
                  style={{ background: `linear-gradient(135deg, ${display.color}, ${display.color}88)` }}
                >
                  <span className="flex items-center gap-2"><Ticket size={14} />Plan Trip</span>
                  <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              ) : (
                <Link
                  href={ctaUrl}
                  onClick={dismiss}
                  className={ctaBase}
                  style={{ background: `linear-gradient(135deg, ${display.color}, ${display.color}88)` }}
                >
                  <span className="flex items-center gap-2"><Ticket size={14} />Plan Trip</span>
                  <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              )}

              <p className="text-center text-[10px] text-slate-700 tracking-widest uppercase font-semibold">
                Gladys Travel AI
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}