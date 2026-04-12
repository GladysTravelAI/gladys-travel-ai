"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUpRight, Flame } from "lucide-react";
import Link from "next/link";
import { getEventHeroImage, type EventImage } from "@/lib/eventImageSearch";
import type { Event } from "@/lib/eventService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatEventDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function getUrgency(days: number): { label: string; hot: boolean } {
  if (days <= 7)  return { label: "This week", hot: true };
  if (days <= 14) return { label: "Next week", hot: true };
  if (days <= 30) return { label: "This month", hot: false };
  if (days <= 60) return { label: `In ${days} days`, hot: false };
  return { label: formatEventDate(""), hot: false };
}

function getCategoryLabel(event: Event): string {
  const id   = (event.id   ?? "").toLowerCase();
  const name = (event.name ?? "").toLowerCase();
  const cat  = ((event as any).category ?? event.type ?? "").toLowerCase();

  if (id.includes("world-cup")  || name.includes("world cup")       || id.includes("fifa"))         return "FIFA World Cup";
  if (id.includes("champions")  || name.includes("champions league"))                                 return "Champions League";
  if (id.includes("super-bowl") || name.includes("super bowl"))                                       return "Super Bowl";
  if (id.includes("coachella")  || name.includes("coachella"))                                        return "Coachella";
  if (name.includes("glastonbury"))                                                                     return "Glastonbury";
  if (name.includes("tomorrowland"))                                                                    return "Tomorrowland";
  if (name.includes("rock in rio"))                                                                     return "Rock in Rio";
  if (name.includes("lollapalooza"))                                                                    return "Lollapalooza";
  if (name.includes("formula 1") || name.includes("grand prix") || name.includes("f1 "))              return "Formula 1";
  const festKeywords = ['festival', 'fest ', ' fest', 'carnival', 'bonnaroo', 'burning man', 'primavera'];
  if (cat === 'festival' || festKeywords.some(k => name.includes(k)))                                   return "Festival";
  if (cat.includes("sport") || cat.includes("football") || cat.includes("basketball"))                 return "Sports";
  if (cat === 'music' || cat.includes("concert"))                                                       return "Music";
  return "Live Event";
}

function getCategoryEmoji(label: string): string {
  if (label.includes("FIFA") || label.includes("Champions") || label.includes("Super Bowl")) return "🏆";
  if (label === "Formula 1")   return "🏎️";
  if (label === "Sports")      return "⚽";
  if (label === "Coachella")   return "🌵";
  if (label === "Glastonbury") return "🎪";
  if (label === "Tomorrowland")return "🎆";
  if (label === "Rock in Rio") return "🎸";
  if (label === "Lollapalooza")return "🎡";
  if (label === "Festival")    return "🎉";
  if (label === "Music")       return "🎵";
  return "🎫";
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  "FIFA World Cup":    "from-emerald-950 via-green-900 to-slate-900",
  "Champions League":  "from-indigo-950 via-blue-900 to-slate-900",
  "Super Bowl":        "from-red-950 via-slate-900 to-slate-900",
  "Formula 1":         "from-red-950 via-gray-900 to-slate-900",
  "Sports":            "from-blue-950 via-slate-900 to-slate-900",
  "Music":             "from-violet-950 via-purple-900 to-slate-900",
  "Coachella":         "from-amber-950 via-orange-900 to-slate-900",
  "Glastonbury":       "from-green-950 via-emerald-900 to-slate-900",
  "Tomorrowland":      "from-purple-950 via-violet-900 to-slate-900",
  "Rock in Rio":       "from-yellow-950 via-orange-900 to-slate-900",
  "Lollapalooza":      "from-pink-950 via-rose-900 to-slate-900",
  "Festival":          "from-orange-950 via-amber-900 to-slate-900",
  "Live Event":        "from-gray-900 to-slate-950",
};

function imageAttribution(image: EventImage): string | null {
  if (image.source === "ticketmaster") return null;
  if (image.source === "unsplash" && image.photographer) return `${image.photographer} · Unsplash`;
  if (image.source === "pexels"   && image.photographer) return `${image.photographer} · Pexels`;
  return null;
}

// ─── Dismiss helpers ──────────────────────────────────────────────────────────

const KEY  = (id: string) => `gladys_notif_v2_${id}`;
const COOL = 12;

function wasDismissed(id: string): boolean {
  try {
    const ts = localStorage.getItem(KEY(id));
    return !!ts && (Date.now() - parseInt(ts)) / 3_600_000 < COOL;
  } catch { return false; }
}

function setDismissed(id: string) {
  try { localStorage.setItem(KEY(id), Date.now().toString()); } catch {}
}

// ─── Event scoring ────────────────────────────────────────────────────────────

function selectBestEvent(events: Event[], userLocation?: string): Event | null {
  const future = events.filter(e => new Date(e.startDate) > new Date());
  if (!future.length) return null;

  const scored = future.map(e => {
    if (wasDismissed(e.id)) return { e, score: -999 };

    let s = 0;
    const days  = getDaysUntil(e.startDate);
    const label = getCategoryLabel(e);

    if (days <= 7)       s += 100;
    else if (days <= 30) s += 50;
    else if (days <= 90) s += 20;

    if (label.includes("FIFA") || label.includes("Champions") || label.includes("Super Bowl")) s += 60;
    if (label === "Sports")                                      s += 40;
    if (label === "Coachella" || label.includes("Festival"))     s += 55;
    if (label === "Music")                                       s += 45;

    if (e.priceRange?.min)                           s += 20;
    if ((e as any).images?.length)                   s += 15;
    if ((e as any).imageUrl || (e as any).image)     s += 10;

    if (userLocation) {
      const loc = `${e.location?.city ?? ""} ${e.location?.country ?? ""}`.toLowerCase();
      if (loc.includes(userLocation.toLowerCase()))  s += 60;
    }

    return { e, score: s };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored[0];
  return top.score > -999 ? top.e : null;
}

// ─── Hero image component ─────────────────────────────────────────────────────

function HeroImage({ event, image }: { event: Event; image: EventImage | null }) {
  const [err, setErr] = useState(false);
  const category = getCategoryLabel(event);
  const gradient = CATEGORY_GRADIENTS[category] ?? CATEGORY_GRADIENTS["Live Event"];
  const src = image?.url ?? "";

  if (!src || err) {
    return (
      <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <div className="text-center">
          <span className="text-5xl opacity-70 block">{getCategoryEmoji(category)}</span>
          <span className="text-white/40 text-xs mt-2 block font-medium tracking-widest uppercase">
            {category}
          </span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={image?.alt ?? event.name}
      className="w-full h-full object-cover"
      onError={() => setErr(true)}
    />
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props {
  userLocation?: string;
  onDismiss?: () => void;
}

export default function EventNotificationToast({ userLocation, onDismiss }: Props) {
  const [visible,      setVisible]      = useState(false);
  const [event,        setEvent]        = useState<Event | null>(null);
  const [heroImage,    setHeroImage]    = useState<EventImage | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    let dead = false;

    async function init() {
      try {
        const res  = await fetch('/api/featured-events');
        const json = await res.json();
        if (!json.success || !Array.isArray(json.events) || json.events.length === 0) return;

        const events: Event[] = json.events.map((ev: any) => ({
          ...ev,
          startDate: ev.date ?? ev.startDate ?? '',
          endDate:   ev.date ?? ev.endDate   ?? '',
          type: (ev.category === 'festival' ? 'festival'
               : ev.category === 'music'   ? 'music'
               : 'sports') as Event['type'],
          location: {
            city:    ev.city    ?? ev.location?.city    ?? '',
            country: ev.country ?? ev.location?.country ?? '',
            venue:   ev.venue   ?? ev.location?.venue,
          },
          priceRange: ev.priceMin != null
            ? { min: ev.priceMin, max: ev.priceMax ?? ev.priceMin, currency: ev.currency ?? 'USD' }
            : undefined,
        }));

        const best = selectBestEvent(events, userLocation);
        if (!best || dead) return;
        setEvent(best);

        setImageLoading(true);
        try {
          const img = await getEventHeroImage(best);
          if (!dead) setHeroImage(img);
        } catch {
          // Gradient fallback handled in HeroImage
        } finally {
          if (!dead) setImageLoading(false);
        }

        const t = setTimeout(() => { if (!dead) setVisible(true); }, 4000);
        return () => clearTimeout(t);
      } catch (err) {
        console.error("[EventNotificationToast]", err);
      }
    }

    init();
    return () => { dead = true; };
  }, [userLocation]);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (event) setDismissed(event.id);
    onDismiss?.();
  }, [event, onDismiss]);

  if (!event) return null;

  const days        = getDaysUntil(event.startDate);
  const urgency     = getUrgency(days);
  const hasPrice    = event.priceRange?.min != null;
  const progressPct = days > 0 && days <= 180 ? Math.max(4, 100 - (days / 180) * 100) : 0;
  const credit      = heroImage ? imageAttribution(heroImage) : null;

  // ── FIX: Always navigate to homepage with ?q=EventName so Gladys plans the
  // trip. Previously this used event.officialUrl which sent users to Ticketmaster.
  const planUrl = `/?q=${encodeURIComponent(event.name)}`;

  const ctaClass =
    "flex items-center justify-between w-full px-4 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-900 active:scale-95 transition-all group";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 360, damping: 32 }}
          className="fixed bottom-24 right-6 z-40 w-[340px]"
          style={{ maxWidth: "calc(100vw - 24px)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

            {/* ── Hero image ── */}
            <div className="relative w-full h-36 overflow-hidden bg-gray-100">
              {imageLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse" />
              )}

              <HeroImage event={event} image={heroImage} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <span className="absolute top-3 left-3 text-xs font-semibold text-white bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full tracking-wide">
                {getCategoryLabel(event)}
              </span>

              {urgency.hot && (
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute top-3 right-9 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full"
                >
                  <Flame size={9} />{urgency.label}
                </motion.div>
              )}

              {heroImage?.source === "ticketmaster" && (
                <div className="absolute bottom-10 right-3">
                  <span className="text-[9px] text-white/50 bg-black/30 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
                    Official image
                  </span>
                </div>
              )}

              <button
                onClick={dismiss}
                aria-label="Dismiss"
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <X size={11} />
              </button>

              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-white font-bold text-[15px] leading-snug line-clamp-2 drop-shadow">
                  {event.name}
                </p>
                {credit && (
                  <p className="text-white/40 text-[10px] mt-0.5">{credit}</p>
                )}
              </div>
            </div>

            {/* ── Body ── */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-900">
                    {formatEventDate(event.startDate)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[event.location?.city, event.location?.country].filter(Boolean).join(", ")}
                  </p>
                </div>
                {hasPrice && (
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">From</p>
                    <p className="text-sm font-bold text-gray-900">
                      {event.priceRange?.currency ?? "USD"}{" "}
                      {event.priceRange!.min!.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {progressPct > 0 && (
                <div className="h-0.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full ${urgency.hot ? "bg-red-500" : "bg-black"}`}
                  />
                </div>
              )}

              {/* ── FIX: Always go to /?q=EventName — never to officialUrl (Ticketmaster) */}
              <Link href={planUrl} onClick={dismiss} className={ctaClass}>
                <span>Plan Event Trip</span>
                <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>

              <p className="text-center text-[10px] text-gray-300 tracking-wide">
                Gladys Travel AI
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}