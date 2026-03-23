'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useVapiContext } from './VapiProvider';
import { useAuth } from '@/lib/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCard?: ToolCard;
  affiliateCards?: AffiliateCard[];
  timestamp: Date;
}

interface AffiliateCard {
  service: string;
  displayText: string;
  affiliateUrl: string;
  message: string;
}

// Structured results from intelligence tools
interface ToolCard {
  type: 'weather' | 'packing' | 'tips' | 'flight_status' | 'nearby' | 'affiliate' | 'trip' | 'football' | 'airport' | 'live_match' | 'checklist';
  data: any;
}

type Mode = 'voice' | 'chat';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconMic = ({ size = 20, className, color }: { size?: number; className?: string; color?: string }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="22"/>
    <line x1="8" y1="22" x2="16" y2="22"/>
  </svg>
);

const IconMicOff = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="2" x2="22" y2="22"/>
    <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/>
    <path d="M5 10v2a7 7 0 0 0 12 5"/>
    <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/>
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12"/>
    <line x1="12" y1="19" x2="12" y2="22"/>
    <line x1="8" y1="22" x2="16" y2="22"/>
  </svg>
);

const IconSend = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const IconX = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconExternalLink = ({ size = 12, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

const IconStop = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2"/>
  </svg>
);

// ─── Service colors ───────────────────────────────────────────────────────────

const SERVICE_COLORS: Record<string, string> = {
  'Aviasales':       '#FF6B35',
  'Booking.com':     '#003580',
  'Kiwitaxi':        '#00C58E',
  'Yesim':           '#6C63FF',
  'EKTA':            '#E63946',
  'Radical Storage': '#F4A261',
  'AirHelp':         '#2196F3',
  'StubHub':         '#53A548',
};

// ─── Tool result → card type mapper ──────────────────────────────────────────

function detectToolCard(toolName: string, result: any): ToolCard | null {
  if (!result) return null;
  switch (toolName) {
    case 'get_weather':              return { type: 'weather',       data: result };
    case 'get_packing_list':         return { type: 'packing',       data: result };
    case 'get_travel_tips':          return { type: 'tips',          data: result };
    case 'check_flight_status':      return { type: 'flight_status', data: result };
    case 'find_nearby_attractions':  return { type: 'nearby',        data: result };
    case 'find_football_fixtures':   return { type: 'football',      data: result };
    case 'get_airport_info':         return { type: 'airport',       data: result };
    case 'live_match':               return { type: 'live_match',    data: result };
    case 'event_checklist':          return { type: 'checklist',     data: result };
    default: return null;
  }
}

// ─── Weather Card ─────────────────────────────────────────────────────────────

function WeatherCard({ data }: { data: any }) {
  const today    = data.today;
  const forecast = (data.forecast ?? []).slice(0, 5);

  const wmoEmoji = (code: number): string => {
    if (code === 0 || code === 1) return '☀️';
    if (code === 2 || code === 3) return '⛅';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '🌦️';
    if (code >= 95) return '⛈️';
    return '🌤️';
  };

  return (
    <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white mt-2">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-white/50 uppercase tracking-wider">{data.city}</p>
          <p className="text-2xl font-bold">{today?.maxTemp}°C</p>
          <p className="text-xs text-white/70 mt-0.5">{today?.description}</p>
        </div>
        <span className="text-4xl">{wmoEmoji(today?.code ?? 0)}</span>
      </div>

      {/* 5-day strip */}
      <div className="flex gap-1.5 mt-3">
        {forecast.map((day: any, i: number) => (
          <div key={i} className="flex-1 bg-white/10 rounded-lg py-2 px-1 text-center">
            <p className="text-[9px] text-white/50 mb-1">
              {i === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
            </p>
            <p className="text-sm">{wmoEmoji(day.code)}</p>
            <p className="text-[10px] font-semibold mt-1">{day.maxTemp}°</p>
            <p className="text-[9px] text-white/40">{day.minTemp}°</p>
          </div>
        ))}
      </div>

      {/* Advice pill */}
      {data.summary?.advice && (
        <p className="text-xs text-white/60 mt-3 bg-white/5 rounded-lg px-3 py-2">
          💡 {data.summary.advice}
        </p>
      )}
    </div>
  );
}

// ─── Packing Card ─────────────────────────────────────────────────────────────

function PackingCard({ data }: { data: any }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const essentials    = (data.packingList ?? []).filter((c: any) => c.essential);
  const nonEssentials = (data.packingList ?? []).filter((c: any) => !c.essential);

  return (
    <div className="rounded-xl border border-gray-100 bg-white mt-2 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-900">Packing List · {data.destination}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {data.days} days · {data.totalItems} items · {data.weatherContext?.avgTemp}°C avg
          </p>
        </div>
        <span className="text-lg">🧳</span>
      </div>

      <div className="px-4 py-3 space-y-2">
        {[...essentials, ...nonEssentials].map((cat: any) => (
          <div key={cat.category}>
            <button
              onClick={() => setExpanded(expanded === cat.category ? null : cat.category)}
              className="w-full flex items-center justify-between py-1.5 text-left"
            >
              <div className="flex items-center gap-2">
                {cat.essential && <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />}
                <span className="text-xs font-semibold text-gray-800">{cat.category}</span>
                <span className="text-[10px] text-gray-400">({cat.items.length})</span>
              </div>
              <span className="text-gray-300 text-xs">{expanded === cat.category ? '▲' : '▼'}</span>
            </button>

            <AnimatePresence>
              {expanded === cat.category && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="pb-2 pl-3.5 space-y-1">
                    {cat.items.map((item: string, i: number) => (
                      <p key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <span className="text-gray-300 mt-0.5 flex-shrink-0">—</span>{item}
                      </p>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {data.proTips?.length > 0 && (
        <div className="px-4 pb-3 border-t border-gray-50 pt-2">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Pro Tips</p>
          {data.proTips.slice(0, 2).map((tip: string, i: number) => (
            <p key={i} className="text-[11px] text-gray-500 flex gap-1.5 mb-1"><span>✦</span>{tip}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Travel Tips Card ─────────────────────────────────────────────────────────

function TipsCard({ data }: { data: any }) {
  const tips        = data.tips;
  const localEvents = data.localEvents ?? [];

  return (
    <div className="rounded-xl border border-gray-100 bg-white mt-2 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-900">Insider Tips · {data.city}</p>
        <span className="text-lg">🗺️</span>
      </div>

      <div className="px-4 py-3 space-y-3">
        {tips?.mustDo?.length > 0 && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Must Do</p>
            {tips.mustDo.slice(0, 3).map((item: string, i: number) => (
              <p key={i} className="text-xs text-gray-700 flex gap-2 mb-1.5">
                <span className="text-black font-bold flex-shrink-0">{i + 1}.</span>{item}
              </p>
            ))}
          </div>
        )}

        {tips?.localFood?.length > 0 && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Local Food</p>
            {tips.localFood.slice(0, 2).map((item: string, i: number) => (
              <p key={i} className="text-xs text-gray-700 flex gap-1.5 mb-1"><span>🍽</span>{item}</p>
            ))}
          </div>
        )}

        {tips?.watchOut?.length > 0 && (
          <div className="bg-amber-50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider mb-1">Watch Out</p>
            <p className="text-xs text-amber-800">{tips.watchOut[0]}</p>
          </div>
        )}

        {localEvents.length > 0 && (
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Happening While You're There</p>
            {localEvents.slice(0, 2).map((event: any, i: number) => (
              <div key={i} className="flex items-center gap-2 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                <p className="text-xs text-gray-700 truncate">{event.title}</p>
                <span className="text-[10px] text-gray-400 flex-shrink-0">
                  {new Date(event.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Flight Status Card ───────────────────────────────────────────────────────

function FlightStatusCard({ data }: { data: any }) {
  const isDisrupted = ['cancelled', 'diverted'].includes(data.status);

  const statusConfig = {
    cancelled: { bg: 'bg-red-50',    border: 'border-red-200',   dot: 'bg-red-500',   label: 'Cancelled',   emoji: '🚫' },
    diverted:  { bg: 'bg-red-50',    border: 'border-red-200',   dot: 'bg-red-500',   label: 'Diverted',    emoji: '⚠️' },
    delayed:   { bg: 'bg-amber-50',  border: 'border-amber-200', dot: 'bg-amber-500', label: 'Delayed',     emoji: '⏱'  },
    scheduled: { bg: 'bg-green-50',  border: 'border-green-200', dot: 'bg-green-500', label: 'On Schedule', emoji: '✅' },
    active:    { bg: 'bg-blue-50',   border: 'border-blue-200',  dot: 'bg-blue-500',  label: 'In the Air',  emoji: '✈️' },
    landed:    { bg: 'bg-green-50',  border: 'border-green-200', dot: 'bg-green-500', label: 'Landed',      emoji: '🛬' },
    unknown:   { bg: 'bg-gray-50',   border: 'border-gray-200',  dot: 'bg-gray-400',  label: 'Unknown',     emoji: '❓' },
  };

  const cfg        = statusConfig[data.status as keyof typeof statusConfig] ?? statusConfig.unknown;
  const formatTime = (iso: string) => iso
    ? new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} mt-2 overflow-hidden`}>
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${cfg.dot} ${isDisrupted ? 'animate-pulse' : ''}`} />
          <p className="text-xs font-bold text-gray-900">{data.flightNumber}</p>
          <span className="text-xs text-gray-500">{data.airline}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-base">{cfg.emoji}</span>
          <span className="text-xs font-semibold text-gray-700">{cfg.label}</span>
        </div>
      </div>

      <div className="px-4 pb-3 flex items-center gap-3">
        <div className="text-center flex-1">
          <p className="text-lg font-bold text-gray-900">{data.departure?.iata}</p>
          <p className="text-[10px] text-gray-500 truncate">{data.departure?.airport}</p>
          <p className="text-xs font-medium text-gray-700 mt-0.5">
            {formatTime(data.departure?.estimated || data.departure?.scheduled)}
          </p>
          {data.departure?.delay > 0 && (
            <p className="text-[10px] text-amber-600">+{data.departure.delay}min</p>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div className="w-full flex items-center gap-1">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-xs">✈</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>
          {data.departure?.gate && (
            <p className="text-[10px] text-gray-400 mt-1">Gate {data.departure.gate}</p>
          )}
        </div>
        <div className="text-center flex-1">
          <p className="text-lg font-bold text-gray-900">{data.arrival?.iata}</p>
          <p className="text-[10px] text-gray-500 truncate">{data.arrival?.airport}</p>
          <p className="text-xs font-medium text-gray-700 mt-0.5">
            {formatTime(data.arrival?.estimated || data.arrival?.scheduled)}
          </p>
        </div>
      </div>

      {data.recoveryOptions?.length > 0 && (
        <div className="px-4 pb-3 space-y-2 border-t border-red-100 pt-3">
          <p className="text-[10px] text-red-600 font-semibold uppercase tracking-wider">Recovery Options</p>
          {data.recoveryOptions.map((opt: any, i: number) => (
            <a key={i} href={opt.affiliateUrl} target="_blank" rel="noopener noreferrer"
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                opt.urgency === 'immediate'
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}>
              <span className="truncate mr-2">{opt.description}</span>
              <IconExternalLink size={11} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Nearby Attractions Card ──────────────────────────────────────────────────

function NearbyCard({ data }: { data: any }) {
  const events = data.events ?? [];
  return (
    <div className="rounded-xl border border-gray-100 bg-white mt-2 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-900">Near You · {data.city}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{events.length} events found</p>
        </div>
        <span className="text-lg">📍</span>
      </div>
      <div className="divide-y divide-gray-50">
        {events.slice(0, 4).map((event: any, i: number) => (
          <a key={i} href={event.ticketUrl || '#'} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs">
                {event.category?.includes('sport') ? '⚽' :
                 event.category?.includes('music') || event.category?.includes('concert') ? '🎵' : '🎫'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{event.title}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {event.venue && `${event.venue} · `}
                {event.date && new Date(event.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                {event.priceFrom && ` · From $${event.priceFrom}`}
              </p>
            </div>
            <IconExternalLink size={11} className="text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── Affiliate Card ───────────────────────────────────────────────────────────

function AffiliateCardItem({ card }: { card: AffiliateCard }) {
  const color = SERVICE_COLORS[card.service] || '#111';
  return (
    <a href={card.affiliateUrl} target="_blank" rel="noopener noreferrer"
      className="group flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 bg-white hover:shadow-sm transition-all">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
        style={{ backgroundColor: color }}>
        {card.service[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900 truncate">{card.displayText}</p>
        <p className="text-xs text-gray-400">{card.service}</p>
      </div>
      <IconExternalLink size={12} className="text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
    </a>
  );
}

// ─── Trip Card ───────────────────────────────────────────────────────────────

const SKY = '#0EA5E9';

function TripCard({ data, onTripPlan }: { data: any; onTripPlan?: (q: string) => void }) {
  const color =
    data.eventType === 'music'    ? '#8B5CF6' :
    data.eventType === 'festival' ? '#F97316' : SKY;

  const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return d; }
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white mt-2 shadow-sm">
      {/* Image */}
      {data.image && (
        <div className="relative h-32 overflow-hidden">
          <img src={data.image} alt={data.eventName} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3">
            <p className="text-white font-black text-sm leading-tight line-clamp-2">{data.eventName}</p>
          </div>
        </div>
      )}

      <div className="p-3">
        {!data.image && (
          <p className="font-black text-gray-900 text-sm mb-2 leading-tight">{data.eventName}</p>
        )}

        <div className="space-y-1 mb-3">
          {data.eventDate && (
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <span>📅</span>{fmtDate(data.eventDate)}
            </p>
          )}
          {(data.venue || data.city) && (
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <span>📍</span>{[data.venue, data.city].filter(Boolean).join(', ')}
            </p>
          )}
          {data.budget && (
            <p className="text-xs text-gray-500 flex items-center gap-1.5">
              <span>💰</span>Est. {data.budget.currency || 'USD'} {data.budget.total?.toLocaleString()} total
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {/* Plan Trip — triggers full homepage flow */}
          <button
            onClick={() => onTripPlan?.(data.query || data.eventName)}
            className="flex-1 py-2.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${color}DD, ${color})` }}
          >
            ✈️ Plan Full Trip
          </button>

          {/* Buy Tickets */}
          {data.ticketUrl && (
            <a
              href={data.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-center border-2 transition-colors hover:bg-gray-50"
              style={{ borderColor: color, color }}
            >
              🎫 Tickets{data.priceMin ? ` · ${data.currency || '$'}${data.priceMin}+` : ''}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tool Card renderer ───────────────────────────────────────────────────────

// ─── Football Fixtures Card ───────────────────────────────────────────────────

function FootballFixturesCard({ data, onTripPlan }: { data: any; onTripPlan?: (q: string) => void }) {
  const fixtures = data.fixtures ?? [];
  if (!fixtures.length) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white mt-2 p-4 text-center text-xs text-gray-400">
        No upcoming fixtures found for {data.league ?? 'this league'}
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-gray-100 bg-white mt-2 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-900">⚽ {data.league ?? 'Football'}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{fixtures.length} upcoming fixtures</p>
        </div>
        <span className="text-lg">🏆</span>
      </div>
      <div className="divide-y divide-gray-50">
        {fixtures.slice(0, 5).map((f: any, i: number) => (
          <button
            key={i}
            onClick={() => onTripPlan?.(f.match)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{f.match}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] text-gray-400">{f.date} · {f.time}</p>
                {f.venue && f.venue !== 'TBC' && (
                  <p className="text-[10px] text-gray-400 truncate">📍 {f.city || f.venue}</p>
                )}
              </div>
            </div>
            <span className="text-[10px] font-bold text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              Plan →
            </span>
          </button>
        ))}
      </div>
      <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 text-center">Tap any match to plan your trip</p>
      </div>
    </div>
  );
}

// ─── Airport Info Card ───────────────────────────────────────────────────────

function AirportCard({ data }: { data: any }) {
  const [tab, setTab] = useState<'transport' | 'lounges' | 'tips' | 'navigation'>('transport');
  if (!data.found) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white mt-2 p-4">
        <p className="text-xs font-semibold text-gray-900 mb-2">✈️ {data.airport}</p>
        <div className="space-y-1.5">
          {(data.guidance ?? []).map((g: string, i: number) => (
            <p key={i} className="text-xs text-gray-600 flex gap-2"><span className="text-gray-300 flex-shrink-0">—</span>{g}</p>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          {data.uber && <a href={data.uber} target="_blank" rel="noopener noreferrer" className="text-xs font-bold px-3 py-1.5 rounded-xl bg-black text-white">🚗 Uber</a>}
          {data.maps && <a href={data.maps} target="_blank" rel="noopener noreferrer" className="text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700">🗺 Map</a>}
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'transport',  label: '🚌 Transport' },
    { id: 'lounges',    label: '🛋 Lounges'   },
    { id: 'tips',       label: '💡 Tips'      },
  ].filter(t => data[t.id]);

  return (
    <div className="rounded-xl border border-gray-100 bg-white mt-2 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-900">✈️ {data.airport}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{data.city}</p>
      </div>

      {/* Tab pills */}
      <div className="flex gap-1.5 px-4 pt-3 pb-2 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
              tab === t.id ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 pb-4">
        {tab === 'transport' && data.transport && (
          <div className="space-y-2">
            {Object.entries(data.transport).map(([k, v]: [string, any]) => (
              <div key={k} className="flex gap-2">
                <span className="text-[10px] font-black uppercase text-gray-400 w-14 flex-shrink-0 mt-0.5">{k}</span>
                <p className="text-xs text-gray-700">{v}</p>
              </div>
            ))}
            {data.uberLink && (
              <a href={data.uberLink} target="_blank" rel="noopener noreferrer"
                className="mt-2 flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl bg-black text-white w-fit">
                🚗 Book Uber from Airport
              </a>
            )}
          </div>
        )}
        {tab === 'lounges' && data.lounges && (
          <div className="space-y-1.5">
            {data.lounges.map((l: string, i: number) => (
              <p key={i} className="text-xs text-gray-700 flex gap-2"><span className="text-gray-300 flex-shrink-0">—</span>{l}</p>
            ))}
          </div>
        )}
        {tab === 'tips' && data.tips && (
          <div className="space-y-1.5">
            {data.tips.map((t: string, i: number) => (
              <p key={i} className="text-xs text-gray-700 flex gap-2"><span className="text-amber-400 flex-shrink-0">★</span>{t}</p>
            ))}
          </div>
        )}
      </div>

      {data.mapsLink && (
        <div className="px-4 pb-3">
          <a href={data.mapsLink} target="_blank" rel="noopener noreferrer"
            className="text-xs font-bold text-sky-500 hover:underline">
            View airport on Google Maps →
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Live Match Card (compact, for chat panel) ───────────────────────────────

function LiveMatchCard({ data }: { data: any }) {
  const [liveData,  setLiveData]  = useState<any>(null);
  const [loading,   setLoading]   = useState(false);
  const [lastSync,  setLastSync]  = useState<Date | null>(null);
  const [tab,       setTab]       = useState<'score' | 'events' | 'setlist'>('score');
  const intervalRef = useRef<any>(null);

  const fetch_ = async () => {
    setLoading(true);
    try {
      const params = data.fixtureId
        ? `type=football&fixtureId=${data.fixtureId}`
        : `type=concert&artist=${encodeURIComponent(data.artistName ?? '')}&date=${data.eventDate}`;
      const res  = await fetch(`/api/live-match?${params}`);
      const json = await res.json();
      setLiveData(json);
      setLastSync(new Date());
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (data.autoFetch) fetch_();
    intervalRef.current = setInterval(() => {
      if (liveData?.status?.isLive) fetch_();
    }, 30_000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const isLive  = liveData?.status?.isLive;
  const isEnded = liveData?.status?.isEnded;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white mt-2 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm">{data.eventType === 'sports' ? '⚽' : '🎵'}</span>
          <p className="text-xs font-black text-gray-900 truncate">{data.eventName}</p>
          {isLive  && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-red-500 text-white animate-pulse">LIVE</span>}
          {isEnded && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-gray-400 text-white">FT</span>}
        </div>
        <button onClick={fetch_} disabled={loading}
          className="text-[10px] font-bold text-sky-500 hover:underline disabled:opacity-40">
          {loading ? '...' : 'Refresh'}
        </button>
      </div>

      {/* Not fetched yet */}
      {!liveData && !loading && (
        <div className="text-center py-5">
          <p className="text-xs text-gray-400 mb-2">
            {data.autoFetch ? 'Loading...' : 'Live updates available on event day'}
          </p>
          {!data.autoFetch && (
            <button onClick={fetch_}
              className="text-xs font-bold px-4 py-2 rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg,#38BDF8,#0284C7)' }}>
              Load Now
            </button>
          )}
        </div>
      )}

      {/* Football scoreboard */}
      {liveData?.type === 'football' && (
        <div className="p-3 space-y-3">
          {/* Score */}
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {liveData.teams?.home?.logo && (
                <img src={liveData.teams.home.logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
              )}
              <p className="text-xs font-black text-gray-900 truncate">{liveData.teams?.home?.name}</p>
            </div>
            <div className="text-center flex-shrink-0 px-3">
              <p className="text-2xl font-black text-gray-900 leading-none">
                {liveData.teams?.home?.score ?? '–'}&nbsp;:&nbsp;{liveData.teams?.away?.score ?? '–'}
              </p>
              {liveData.status?.elapsed && (
                <p className="text-[10px] font-bold mt-0.5" style={{ color: isLive ? '#EF4444' : '#94A3B8' }}>
                  {isLive ? `${liveData.status.elapsed}'` : liveData.status.label}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
              <p className="text-xs font-black text-gray-900 truncate text-right">{liveData.teams?.away?.name}</p>
              {liveData.teams?.away?.logo && (
                <img src={liveData.teams.away.logo} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
              )}
            </div>
          </div>

          {/* Tab pills */}
          <div className="flex gap-1.5">
            {[{ id: 'score', label: '⚡ Events' }, { id: 'events', label: '👥 Lineups' }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
                style={{ background: tab === t.id ? '#0EA5E9' : '#F1F5F9', color: tab === t.id ? 'white' : '#64748B' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Goals */}
          {tab === 'score' && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {(liveData.goals ?? []).map((g: any, i: number) => (
                <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-green-50 border border-green-200">
                  <span className="text-sm">⚽</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-gray-900 truncate">{g.player}</p>
                    <p className="text-[9px] text-gray-400">{g.team}</p>
                  </div>
                  <span className="text-[10px] font-black text-gray-400 flex-shrink-0">{g.minute}'</span>
                </div>
              ))}
              {(liveData.cards ?? []).map((c: any, i: number) => (
                <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-sm">{c.type?.includes('Red') ? '🟥' : '🟨'}</span>
                  <p className="text-[11px] font-black text-gray-900 flex-1 truncate">{c.player}</p>
                  <span className="text-[10px] font-black text-gray-400 flex-shrink-0">{c.minute}'</span>
                </div>
              ))}
              {!(liveData.goals?.length) && !(liveData.cards?.length) && (
                <p className="text-[11px] text-gray-400 text-center py-2">No events yet</p>
              )}
            </div>
          )}

          {/* Lineups */}
          {tab === 'events' && (
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
              {(liveData.lineups ?? []).map((l: any, i: number) => (
                <div key={i}>
                  <p className="text-[10px] font-black text-gray-700 mb-1 truncate">{l.team} <span className="font-normal text-gray-400">({l.formation})</span></p>
                  {(l.startingXI ?? []).slice(0, 5).map((p: any, j: number) => (
                    <p key={j} className="text-[10px] text-gray-600 leading-5 truncate">
                      <span className="text-[9px] text-gray-400 mr-1">{p.number}</span>{p.name}
                    </p>
                  ))}
                  {l.startingXI?.length > 5 && <p className="text-[9px] text-gray-400">+{l.startingXI.length - 5} more</p>}
                </div>
              ))}
              {!liveData.lineups?.length && <p className="text-[11px] text-gray-400 col-span-2 text-center py-2">Lineups not announced</p>}
            </div>
          )}
        </div>
      )}

      {/* Concert setlist */}
      {liveData?.type === 'concert' && (
        <div className="p-3 space-y-2">
          {liveData.note && <p className="text-[11px] text-amber-700 bg-amber-50 rounded-xl px-3 py-2 border border-amber-200">{liveData.note}</p>}
          {(liveData.setlist ?? []).length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-0.5">
              {liveData.setlist.map((song: string, i: number) => (
                <div key={i} className="flex items-center gap-2.5 py-1">
                  <span className="text-[10px] font-black text-gray-300 w-4 text-right flex-shrink-0">{i + 1}</span>
                  <p className="text-[11px] font-semibold text-gray-900">{song}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Last sync */}
      {lastSync && (
        <div className="px-4 py-2 border-t border-gray-50 flex items-center justify-between">
          <p className="text-[9px] text-gray-300">
            Updated {lastSync.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            {isLive && ' · auto-refreshing'}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Checklist Card (compact, for chat panel) ─────────────────────────────────

function ChecklistCard({ data }: { data: any }) {
  const storageKey = `gladys_checklist_${data.eventDate}`;
  const [checks, setChecks] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) ?? '{}'); } catch { return {}; }
  });
  const [notifSet, setNotifSet] = useState(false);

  const toggle = (id: string) => {
    setChecks(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const daysUntil = data.eventDate
    ? Math.ceil((new Date(data.eventDate).getTime() - new Date().setHours(0,0,0,0)) / 86_400_000)
    : null;

  const items = [
    { id: 'ticket',    emoji: '🎫', label: 'Ticket saved / screenshotted'   },
    { id: 'weather',   emoji: '🌤', label: 'Checked event-day weather'       },
    { id: 'transport', emoji: '🚌', label: 'Transport to venue planned'      },
    { id: 'packing',   emoji: '🎒', label: 'ID, phone, charger, cash packed' },
  ];
  const doneCount = items.filter(i => checks[i.id]).length;
  const progress  = doneCount / items.length;
  const allDone   = doneCount === items.length;

  const scheduleAlert = async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    if (perm === 'granted') setNotifSet(true);
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white mt-2 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-black text-gray-900">
            {daysUntil === 0 ? '🎉 Event Day Checklist'
            : daysUntil === 1 ? '⚡ Event Tomorrow!'
            : daysUntil !== null ? `📋 ${daysUntil} days to go`
            : '📋 Event Checklist'}
          </p>
          <span className="text-[10px] font-black text-gray-400">{doneCount}/{items.length}</span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%`, background: allDone ? '#10B981' : '#0EA5E9' }}
          />
        </div>
      </div>

      <div className="p-3 space-y-1.5">
        {items.map(item => (
          <button key={item.id} onClick={() => toggle(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${
              checks[item.id] ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100 hover:border-gray-200'
            }`}>
            <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              checks[item.id] ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
            }`}>
              {checks[item.id] && <span className="text-white text-[10px] font-black">✓</span>}
            </div>
            <span className="text-sm flex-shrink-0">{item.emoji}</span>
            <p className={`text-xs font-semibold flex-1 ${checks[item.id] ? 'text-emerald-700 line-through' : 'text-gray-900'}`}>
              {item.label}
            </p>
          </button>
        ))}
      </div>

      {allDone ? (
        <div className="mx-3 mb-3 px-4 py-3 rounded-xl bg-emerald-500 text-white text-center">
          <p className="text-xs font-black">🎉 You're all set for {data.eventName}!</p>
        </div>
      ) : !notifSet ? (
        <div className="px-3 pb-3">
          <button onClick={scheduleAlert}
            className="w-full py-2.5 rounded-xl text-xs font-black text-white"
            style={{ background: 'linear-gradient(135deg,#38BDF8,#0284C7)' }}>
            🔔 Set 24hr Reminder
          </button>
        </div>
      ) : (
        <p className="text-center text-[10px] text-emerald-500 font-bold pb-3">✓ Reminder set!</p>
      )}
    </div>
  );
}

function ToolCardRenderer({ card, onTripPlan }: { card: ToolCard; onTripPlan?: (q: string) => void }) {
  switch (card.type) {
    case 'weather':       return <WeatherCard data={card.data} />;
    case 'packing':       return <PackingCard data={card.data} />;
    case 'tips':          return <TipsCard data={card.data} />;
    case 'flight_status': return <FlightStatusCard data={card.data} />;
    case 'nearby':        return <NearbyCard data={card.data} />;
    case 'trip':          return <TripCard data={card.data} onTripPlan={onTripPlan} />;
    case 'football':      return <FootballFixturesCard data={card.data} onTripPlan={onTripPlan} />;
    case 'airport':       return <AirportCard data={card.data} />;
    case 'live_match':    return <LiveMatchCard data={card.data} />;
    case 'checklist':     return <ChecklistCard data={card.data} />;
    default:              return null;
  }
}

// ─── Voice Orb ────────────────────────────────────────────────────────────────

function VoiceOrb({ volumeLevel, status }: { volumeLevel: number; status: string }) {
  const isActive     = status === 'active';
  const isConnecting = status === 'connecting';

  // 7 bars for the waveform — heights driven by volume + sine offsets
  const BAR_COUNT = 7;
  const getBarHeight = (i: number) => {
    if (!isActive) return 8;
    const wave = Math.sin(Date.now() / 200 + i * 0.8) * 0.5 + 0.5;
    const base = 8 + volumeLevel * 32;
    return Math.max(6, Math.min(40, base * wave + 8));
  };

  return (
    <div className="flex flex-col items-center gap-5 pt-8 pb-4">

      {/* ── Orb ── */}
      <div className="relative flex items-center justify-center">

        {/* Pulse rings when active */}
        {isActive && (
          <>
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0, 0.15] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute w-28 h-28 rounded-full"
              style={{ background: 'radial-gradient(circle, #0EA5E9 0%, transparent 70%)' }}
            />
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0, 0.2] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              className="absolute w-24 h-24 rounded-full"
              style={{ background: 'radial-gradient(circle, #38BDF8 0%, transparent 70%)' }}
            />
          </>
        )}

        {/* Connecting ring */}
        {isConnecting && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            className="absolute w-24 h-24 rounded-full border-2 border-transparent"
            style={{ borderTopColor: '#0EA5E9', borderRightColor: '#BAE6FD' }}
          />
        )}

        {/* Main orb */}
        <motion.div
          animate={isActive
            ? { scale: [1, 1 + volumeLevel * 0.12, 1] }
            : { scale: 1 }
          }
          transition={{ duration: 0.15, repeat: isActive ? Infinity : 0 }}
          className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden"
          style={{
            background: isActive
              ? 'linear-gradient(135deg, #38BDF8, #0284C7)'
              : isConnecting
              ? 'linear-gradient(135deg, #BAE6FD, #0EA5E9)'
              : 'linear-gradient(135deg, #1E293B, #0F172A)',
          }}
        >
          {/* Shine overlay */}
          <div className="absolute inset-0 rounded-full"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%)' }} />

          {isConnecting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <IconMic size={22} color="white" />
          )}
        </motion.div>
      </div>

      {/* ── Animated waveform bars (shown when active) ── */}
      <div className="h-12 flex items-center justify-center gap-1">
        {isActive ? (
          Array.from({ length: BAR_COUNT }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                height: [
                  `${8 + Math.sin(i * 1.1) * 6}px`,
                  `${20 + volumeLevel * 28 + Math.sin(i * 0.9) * 12}px`,
                  `${8 + Math.sin(i * 1.3) * 6}px`,
                ],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 0.5 + i * 0.07,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.05,
              }}
              className="w-1 rounded-full"
              style={{
                background: `linear-gradient(to top, #0284C7, #7DD3FC)`,
                minHeight: '6px',
              }}
            />
          ))
        ) : (
          /* Static flat bars when idle */
          Array.from({ length: BAR_COUNT }).map((_, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-slate-200"
              style={{ height: `${i === 3 ? 12 : i % 2 === 0 ? 8 : 6}px` }}
            />
          ))
        )}
      </div>

      {/* ── Status text ── */}
      <div className="text-center">
        <p className="text-sm font-bold text-slate-900 tracking-tight">
          {isActive ? 'Gladys is listening…' : isConnecting ? 'Connecting…' : 'Tap to speak'}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {isActive
            ? 'Ask about events, flights, hotels or anything'
            : 'Your AI travel companion'}
        </p>
      </div>
    </div>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────

function ChatBubble({ message, onTripPlan, isStreaming }: {
  message:     ChatMessage;
  onTripPlan?: (q: string) => void;
  isStreaming?: boolean;
}) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
      <div className={`max-w-[82%] min-w-[48px] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? 'bg-black text-white rounded-br-sm'
          : 'bg-gray-50 text-gray-900 rounded-bl-sm border border-gray-100'
      }`}>
        <p className="whitespace-pre-wrap">
          {message.content}
          {/* Blinking cursor while streaming */}
          {isStreaming && (
            <span className="inline-block w-0.5 h-3.5 bg-gray-400 ml-0.5 align-middle animate-pulse" />
          )}
        </p>
      </div>

      {message.toolCard && (
        <div className="w-full max-w-[95%]">
          <ToolCardRenderer card={message.toolCard} onTripPlan={onTripPlan} />
        </div>
      )}

      {message.affiliateCards?.map((card, i) => (
        <div key={i} className="w-full max-w-[90%]">
          <AffiliateCardItem card={card} />
        </div>
      ))}
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start">
      <div className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const VOICE_PROMPTS = [
  { text: 'Plan my World Cup 2026 trip',            emoji: '⚽', tag: 'Popular' },
  { text: 'Build me a trip to Coachella 2026',      emoji: '🎵', tag: 'Music'   },
  { text: 'Find events near me this weekend',       emoji: '📍', tag: 'Local'   },
  { text: 'Best hotels near MetLife Stadium',       emoji: '🏨', tag: 'Stay'    },
  { text: 'What flights go to Miami in June?',      emoji: '✈️', tag: 'Flights' },
  { text: 'Surprise me with a festival trip',       emoji: '🎪', tag: 'Fun'     },
];

// Grouped prompts — shown on empty chat state
const CHAT_PROMPT_GROUPS = [
  {
    label: 'Plan a trip',
    prompts: [
      { text: 'Plan a trip to the Champions League Final', emoji: '🏆' },
      { text: 'I want to go to Coachella 2026',           emoji: '🎪' },
      { text: 'Plan a trip to the NBA Finals',            emoji: '🏀' },
      { text: 'Book me a trip to Formula 1 Monaco',       emoji: '🏎️' },
    ],
  },
  {
    label: 'Live tools',
    prompts: [
      { text: "What's the score?",                 emoji: '🔴' },
      { text: 'Show my event checklist',            emoji: '✅' },
      { text: 'Check flight status for BA456',     emoji: '✈️' },
      { text: "Weather in Dubai next week?",        emoji: '🌤' },
    ],
  },
  {
    label: 'Ask anything',
    prompts: [
      { text: 'Best countries to visit in 2026',              emoji: '🌍' },
      { text: 'Is Japan safe for solo travellers?',           emoji: '🇯🇵' },
      { text: 'Cheapest month to fly to Europe',              emoji: '💶' },
      { text: 'Visa info for South Africans going to the US', emoji: '🛂' },
    ],
  },
];

// Quick-reply chips — shown below messages during a conversation
const CHAT_QUICK_PROMPTS = [
  "Weather somewhere?",
  "What can you help with?",
  "Best time to visit Bali",
  "Pack list ideas",
];

// ─── Toast config per tool ────────────────────────────────────────────────────

function getToastConfig(toolName: string, result: any): { title: string; description: string } {
  switch (toolName) {
    case 'get_weather':
      return { title: `Weather · ${result.city}`, description: result.today?.description ?? 'Check screen for forecast' };
    case 'get_packing_list':
      return { title: `Packing List · ${result.destination}`, description: `${result.totalItems} items for ${result.days} days` };
    case 'get_travel_tips':
      return { title: `Tips · ${result.city}`, description: 'Insider guide ready on screen' };
    case 'check_flight_status':
      return {
        title: `Flight ${result.flightNumber} · ${result.status?.toUpperCase()}`,
        description: result.departure?.delay > 0 ? `Delayed ${result.departure.delay} min` : 'Check screen for details',
      };
    case 'find_nearby_attractions':
      return { title: `Near You · ${result.city}`, description: `${result.events?.length ?? 0} events found` };
    default:
      return { title: `${result.service ?? 'Gladys'} link ready`, description: result.displayText ?? '' };
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

// ─── Event intent detector ───────────────────────────────────────────────────

const TRIP_PATTERNS = [
  /plan.*trip/i, /book.*trip/i, /travel.*to/i,
  /flights?.*to/i, /hotels?.*in/i, /itinerary/i,
  /visit.*(for|to)/i, /go.*to/i,
  /world cup/i, /uchampions league/i, /ucl/i,
  /nba finals/i, /super bowl/i, /coachella/i,
  /glaston(bury)?/i, /formula 1/i, /f1.*grand prix/i,
  /vs\.?/i, // "Chelsea vs Arsenal" pattern
]

function detectTripIntent(text: string): boolean {
  return TRIP_PATTERNS.some(p => p.test(text))
}

const LIVE_PATTERNS = [
  /score/i, /what.*happening/i, /how.*match/i, /how.*game/i,
  /live.*update/i, /any.*goal/i, /half.?time/i, /full.?time/i,
  /setlist/i, /what.*playing/i, /what.*song/i, /lineup/i,
  /who.*scored/i, /result/i, /update.*match/i,
]
function detectLiveIntent(text: string): boolean {
  return LIVE_PATTERNS.some(p => p.test(text))
}

const CHECKLIST_PATTERNS = [
  /checklist/i, /am i ready/i, /ready for/i, /what do i need/i,
  /pre.?event/i, /before.*event/i, /don't forget/i, /remind me/i,
  /show.*checklist/i, /my list/i, /preparation/i, /prepared/i,
]
function detectChecklistIntent(text: string): boolean {
  return CHECKLIST_PATTERNS.some(p => p.test(text))
}

export default function GladysCompanion({
  eventContext,
  onTripPlan,
}: {
  eventContext?: string;
  onTripPlan?: (query: string) => void;
}) {
  const vapi = useVapiContext();
  const { user, userProfile } = useAuth();

  const [isOpen,      setIsOpen]      = useState(false);
  const [mode,        setMode]        = useState<Mode>('voice');
  const [messages,    setMessages]    = useState<ChatMessage[]>([]);
  const [input,       setInput]       = useState('');
  const [isTyping,    setIsTyping]    = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);

  const messagesEndRef   = useRef<HTMLDivElement>(null);
  const inputRef         = useRef<HTMLInputElement>(null);
  const prevToolCount    = useRef(0);
  const proactiveFired   = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Proactive first message when panel opens with context ─────────────────
  useEffect(() => {
    if (!isOpen || mode !== 'chat') return;
    if (proactiveFired.current || messages.length > 0) return;
    if (!eventContext && !userProfile) return;

    proactiveFired.current = true;

    // Build a contextual greeting based on what we know
    const name       = userProfile?.name || user?.displayName || null;
    const greeting   = name ? `Hey ${name.split(' ')[0]}! 👋` : 'Hey! 👋';
    const today         = new Date().toISOString().split('T')[0];
    const dateInCtx     = eventContext?.match(/(\d{4}-\d{2}-\d{2})/)?.[1];
    const isEventToday  = dateInCtx === today;
    const cleanCtx      = eventContext
      ?.replace('User is planning a trip to ', '')
      .replace('User is planning a trip for ', '') ?? '';

    const contextual = eventContext
      ? isEventToday
        ? `It looks like your event is **today** — ${cleanCtx}! Ask me for live scores, your event checklist, or directions to the venue.`
        : `I see you're planning a trip to **${cleanCtx}**. Want me to check the weather there, find things to do nearby, or show your event checklist?`
      : `I'm Gladys, your AI travel companion. I can check weather, find football fixtures, build packing lists, track flights, and plan full event trips. What are you thinking?`;

    // Stream the proactive message word by word
    const proactiveId = `proactive-${Date.now()}`;
    const fullText    = `${greeting} ${contextual}`;
    const words       = fullText.split(' ');

    setMessages([{
      id:        proactiveId,
      role:      'assistant',
      content:   '',
      timestamp: new Date(),
    }]);
    setStreamingId(proactiveId);

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setMessages(prev => prev.map(m =>
        m.id === proactiveId
          ? { ...m, content: words.slice(0, i).join(' ') }
          : m
      ));
      if (i >= words.length) {
        clearInterval(interval);
        setStreamingId(null);
      }
    }, 45);

    return () => clearInterval(interval);
  }, [isOpen, mode]);

  // Reset proactive flag when context changes (new trip search)
  useEffect(() => {
    proactiveFired.current = false;
  }, [eventContext]);

  // Handle all tool results from Vapi voice calls
  useEffect(() => {
    const results = vapi.toolResults ?? [];
    if (results.length <= prevToolCount.current) return;

    const newResults = results.slice(prevToolCount.current);
    prevToolCount.current = results.length;

    newResults.forEach((result: any) => {
      const toolName = result.toolName ?? '';
      const data     = result.result ?? result;

      const { title, description } = getToastConfig(toolName, data);
      const isDisruption = toolName === 'check_flight_status' &&
        ['cancelled', 'diverted'].includes(data.status);

      if (isDisruption) {
        toast.error(title, { description, duration: 10000 });
      } else {
        toast.success(title, { description, duration: 5000 });
      }

      const toolCard       = detectToolCard(toolName, data);
      const affiliateCards = data.affiliateCards ?? (data.affiliateUrl ? [{
        service: data.service ?? 'Gladys', displayText: data.displayText ?? title,
        affiliateUrl: data.affiliateUrl,   message: data.message ?? '',
      }] : []);

      setMessages(prev => [...prev, {
        id: `tool-${Date.now()}-${Math.random()}`, role: 'assistant',
        content: data.message ?? '', toolCard: toolCard ?? undefined,
        affiliateCards: affiliateCards.length > 0 ? affiliateCards : undefined,
        timestamp: new Date(),
      }]);
    });

    if (newResults.length > 0) setMode('chat');
  }, [vapi.toolResults]);

  const handleVoiceToggle = useCallback(() => {
    if (vapi.status === 'active')    vapi.endCall();
    else if (vapi.status === 'idle') vapi.startCall(eventContext);
  }, [vapi, eventContext]);

  // ─── handleSend ─────────────────────────────────────────────────────────────
  // Smart routing: trip intent → /api/agent | everything else → /api/gladys-chat
  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`, role: 'user', content: text, timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const isTripQuery      = detectTripIntent(text);
    const isLiveQuery      = detectLiveIntent(text);
    const isChecklistQuery = detectChecklistIntent(text);

    try {
      // ── LIVE MATCH PATH ───────────────────────────────────────────────────────
      if (isLiveQuery && eventContext) {
        // Extract fixture context from eventContext string
        const fixtureMatch  = eventContext.match(/fixtureId[=:](\d+)/i)
        const fixtureId     = fixtureMatch?.[1]
        const artistMatch   = eventContext.match(/artist[=:]([^,]+)/i)
        const artistName    = artistMatch?.[1]?.trim()
        const dateMatch     = eventContext.match(/(\d{4}-\d{2}-\d{2})/)
        const eventDate     = dateMatch?.[1] ?? new Date().toISOString().split('T')[0]
        const today         = new Date().toISOString().split('T')[0]
        const isToday       = eventDate === today

        const liveId = `live-${Date.now()}`
        setMessages(prev => [...prev, {
          id: liveId, role: 'assistant', timestamp: new Date(),
          content: isToday
            ? 'Here are the live updates for your event 🔴'
            : "Live updates will be available on event day. Here's what I have:",
          toolCard: {
            type: 'live_match' as const,
            data: {
              fixtureId,
              artistName,
              eventDate,
              eventName:  eventContext.replace(/fixtureId[=:]\d+/gi, '').replace(/artist[=:][^,]+/gi, '').trim() || 'Your Event',
              eventType:  fixtureId ? 'sports' : 'music',
              autoFetch:  isToday,
            },
          },
        }])
        return

      // ── CHECKLIST PATH ────────────────────────────────────────────────────────
      } else if (isChecklistQuery && eventContext) {
        const dateMatch  = eventContext.match(/(\d{4}-\d{2}-\d{2})/)
        const venueMatch = eventContext.match(/venue[=:]([^,]+)/i)
        const eventDate  = dateMatch?.[1] ?? ''
        const venue      = venueMatch?.[1]?.trim() ?? 'the venue'

        const checkId = `checklist-${Date.now()}`
        setMessages(prev => [...prev, {
          id: checkId, role: 'assistant', timestamp: new Date(),
          content: "Here's your pre-event checklist 📋",
          toolCard: {
            type: 'checklist' as const,
            data: {
              eventName: eventContext.split(',')[0]?.trim() || 'Your Event',
              eventDate,
              venue,
              city: eventContext.match(/city[=:]([^,]+)/i)?.[1]?.trim() ?? '',
            },
          },
        }])
        return

      } else if (isLiveQuery && !eventContext) {
        // No active event — ask user which event they mean
        setMessages(prev => [...prev, {
          id: `no-event-${Date.now()}`, role: 'assistant', timestamp: new Date(),
          content: "I don't have an active event loaded. Search for your event on the homepage first, then come back and I'll show you live updates!",
        }])
        return

      } else if (isChecklistQuery && !eventContext) {
        setMessages(prev => [...prev, {
          id: `no-event-${Date.now()}`, role: 'assistant', timestamp: new Date(),
          content: "Search for your event on the homepage first and I'll pull up your personalised checklist!",
        }])
        return
      }

      if (isTripQuery) {
        // ── TRIP PLANNING PATH ─────────────────────────────────────────────────
        // Show "building trip" message immediately
        const thinkingId = `thinking-${Date.now()}`;
        setMessages(prev => [...prev, {
          id:        thinkingId,
          role:      'assistant',
          content:   `Planning your trip for "${text}"... Give me a moment ✈️`,
          timestamp: new Date(),
        }]);

        // If parent provided onTripPlan, use it to trigger full homepage flow
        if (onTripPlan) {
          onTripPlan(text);
          setMessages(prev => prev.map(m =>
            m.id === thinkingId
              ? { ...m, content: `I've started planning your trip for "${text}"! Check the results below 👇` }
              : m
          ));
          setIsTyping(false);
          return;
        }

        // Otherwise call /api/agent directly and render trip card inline
        const res    = await fetch('/api/agent', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            message: text,
            context: { eventType: 'sports', origin: 'Johannesburg, South Africa', days: 5 },
          }),
        });
        const result = await res.json();

        if (result.success && result.data?.event?.name) {
          const d = result.data;
          setMessages(prev => prev.map(m =>
            m.id === thinkingId
              ? {
                  ...m,
                  content: `Here's what I found for "${d.event.name}"! Tap Plan Trip to get the full itinerary.`,
                  toolCard: {
                    type: 'trip' as const,
                    data: {
                      eventName:  d.event.name,
                      eventDate:  d.event.date,
                      venue:      d.event.venue,
                      city:       d.destination?.city,
                      country:    d.destination?.country,
                      image:      d.event.image,
                      ticketUrl:  d.event.ticketUrl || d.affiliate_links?.tickets,
                      priceMin:   d.event.priceMin,
                      currency:   d.event.currency,
                      eventType:  d.event.type,
                      budget:     d.budget,
                      query:      text,
                    },
                  },
                }
              : m
          ));
        } else {
          // Agent didn't find event — fall through to chat
          setMessages(prev => prev.map(m =>
            m.id === thinkingId
              ? { ...m, content: result.data?.message || "I couldn't find that event — try searching on the homepage for the best results!" }
              : m
          ));
        }

      } else {
        // ── CHAT PATH — STREAMING ─────────────────────────────────────────────
        const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));

        // Inject user memory into context
        const userContext = userProfile
          ? `User: ${userProfile.name || user?.displayName || 'Traveller'}, based in ${userProfile.homeCity || 'Johannesburg'}.`
          : undefined;

        const res = await fetch('/api/gladys-chat/stream', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            message: text,
            context: eventContext || userContext,
            history,
            userContext,
          }),
        });

        if (!res.ok || !res.body) {
          // Fallback to non-streaming if stream endpoint fails
          const fallback = await fetch('/api/gladys-chat', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, context: eventContext, history }),
          });
          const result = await fallback.json();
          const toolCard = result.toolName ? detectToolCard(result.toolName, result.toolResult) : undefined;
          if (result.toolName && result.toolResult) {
            const { title, description } = getToastConfig(result.toolName, result.toolResult);
            const isDisruption = result.toolName === 'check_flight_status' && ['cancelled', 'diverted'].includes(result.toolResult?.status);
            if (isDisruption) toast.error(title, { description, duration: 10000 });
            else toast.success(title, { description, duration: 5000 });
          }
          setMessages(prev => [...prev, { id: `assistant-${Date.now()}`, role: 'assistant', content: result.reply ?? "I'm here to help!", toolCard: toolCard ?? undefined, timestamp: new Date() }]);
          return;
        }

        // ── Stream the response word by word ──
        const streamId = `stream-${Date.now()}`;
        setStreamingId(streamId);
        setMessages(prev => [...prev, {
          id: streamId, role: 'assistant', content: '', timestamp: new Date(),
        }]);

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer    = '';
        let toolName: string | null   = null;
        let toolResult: any           = null;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (data === '[DONE]') break;

              try {
                const parsed = JSON.parse(data);

                if (parsed.type === 'text') {
                  // Append text chunk to message
                  setMessages(prev => prev.map(m =>
                    m.id === streamId ? { ...m, content: m.content + parsed.text } : m
                  ));
                } else if (parsed.type === 'tool') {
                  // Tool result arrived — update message with card
                  toolName   = parsed.toolName;
                  toolResult = parsed.toolResult;
                  const toolCard = detectToolCard(toolName!, toolResult);
                  if (toolName && toolResult) {
                    const { title, description } = getToastConfig(toolName, toolResult);
                    const isDisruption = toolName === 'check_flight_status' && ['cancelled', 'diverted'].includes(toolResult?.status);
                    if (isDisruption) toast.error(title, { description, duration: 10000 });
                    else toast.success(title, { description, duration: 5000 });
                  }
                  setMessages(prev => prev.map(m =>
                    m.id === streamId ? { ...m, toolCard: toolCard ?? undefined } : m
                  ));
                }
              } catch {}
            }
          }
        } finally {
          setStreamingId(null);
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        id:        `error-${Date.now()}`,
        role:      'assistant',
        content:   "Sorry, hit a snag — try again!",
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, eventContext, onTripPlan]);

  // Clicking a prompt chip fires immediately (no extra Enter needed)
  const handlePromptClick = (text: string) => {
    if (isTyping) return;
    handleSend(text);
  };

  const isVoiceActive     = vapi.status === 'active';
  const isVoiceConnecting = vapi.status === 'connecting';
  const hasActivity       = isVoiceActive || messages.length > 0;

  return (
    <>
      {/* ── Floating Button ──────────────────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed bottom-20 sm:bottom-8 right-4 sm:right-6 z-50 flex flex-col items-end gap-2"
          >
            {/* Label pill */}
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="hidden sm:flex items-center gap-1.5 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
              style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}
            >
              <IconMic size={11} />
              Talk to Gladys
            </motion.div>

            {/* Main FAB button */}
            <button
              onClick={() => { setIsOpen(true); if (eventContext) setMode('chat'); }}
              className="relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)',
                boxShadow: '0 8px 32px rgba(14,165,233,0.45)' }}
            >
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ background: '#0EA5E9' }} />
              {hasActivity && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white" />
              )}
              {isVoiceActive ? (
                <div className="flex gap-0.5 items-center">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="w-0.5 bg-white rounded-full animate-pulse"
                      style={{ height: `${10 + i * 3}px`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              ) : (
                <IconMic size={24} className="text-white" />
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Panel ────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            />

            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="fixed bottom-0 right-0 left-0 sm:bottom-6 sm:right-6 sm:left-auto z-50 w-full sm:w-[400px] max-h-[80svh] sm:max-h-[680px] flex flex-col bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden border border-gray-100"
              style={{ maxWidth: 'calc(100vw - 24px)' }}
            >
              {/* ── Header ─────────────────────────────────────── */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
                    <span className="text-white text-xs font-bold">G</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 leading-tight">Gladys</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isVoiceActive ? 'bg-green-500 animate-pulse' : streamingId ? 'bg-sky-400 animate-pulse' : 'bg-gray-300'}`} />
                      <span className="text-xs text-gray-400">
                        {isVoiceActive ? 'On a call' : isVoiceConnecting ? 'Connecting...' : streamingId ? 'Typing...' : 'AI Travel Companion'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-gray-100 rounded-xl p-0.5">
                    {(['voice', 'chat'] as Mode[]).map((m) => (
                      <button key={m} onClick={() => setMode(m)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {m === 'voice' ? '🎙 Voice' : '💬 Chat'}
                        {m === 'chat' && messages.length > 0 && mode !== 'chat' && (
                          <span className="ml-1 inline-block w-1.5 h-1.5 bg-black rounded-full align-middle" />
                        )}
                      </button>
                    ))}
                  </div>

                  <button onClick={() => setIsOpen(false)}
                    className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                    <IconX size={14} />
                  </button>
                </div>
              </div>

              {/* ── Content ──────────────────────────────────────── */}
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <AnimatePresence mode="wait">

                  {/* ── VOICE MODE ──────────────────────────────── */}
                  {mode === 'voice' && (
                    <motion.div key="voice"
                      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.18 }}
                      className="flex-1 overflow-y-auto"
                    >
                      {/* ── Orb + waveform ── */}
                      <VoiceOrb volumeLevel={vapi.volumeLevel} status={vapi.status} />

                      {/* ── Controls ── */}
                      <div className="flex items-center justify-center gap-3 pb-5 px-5">
                        {isVoiceActive && (
                          <button onClick={vapi.toggleMute}
                            className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all ${
                              vapi.isMuted
                                ? 'bg-red-50 border-red-200 text-red-500'
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}>
                            {vapi.isMuted ? <IconMicOff size={17} /> : <IconMic size={17} />}
                          </button>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={handleVoiceToggle}
                          disabled={isVoiceConnecting || vapi.status === 'ending'}
                          className={`flex items-center gap-2 px-7 py-3 rounded-full font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
                            isVoiceActive
                              ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200'
                              : 'text-white shadow-sky-200'
                          }`}
                          style={!isVoiceActive ? { background: 'linear-gradient(135deg, #38BDF8, #0284C7)' } : {}}
                        >
                          {isVoiceConnecting ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Connecting…</>
                          ) : isVoiceActive ? (
                            <><IconStop size={14} />End Call</>
                          ) : (
                            <><IconMic size={15} />Start Voice</>
                          )}
                        </motion.button>
                      </div>

                      {/* ── Try Saying ── only when idle ── */}
                      {vapi.status === 'idle' && (
                        <div className="px-4 pb-5">
                          {/* Header */}
                          <div className="flex items-center gap-2 mb-3 px-1">
                            <div className="h-px flex-1 bg-slate-100" />
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Try saying</p>
                            <div className="h-px flex-1 bg-slate-100" />
                          </div>

                          {/* 2-col grid of prompt chips */}
                          <div className="grid grid-cols-2 gap-2">
                            {VOICE_PROMPTS.map((p, i) => (
                              <motion.button
                                key={i}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => vapi.startCall(`User wants: ${p.text}`)}
                                className="text-left rounded-2xl px-3 py-3 transition-all border border-slate-100 hover:border-sky-200 hover:bg-sky-50 bg-slate-50 group"
                              >
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <span className="text-base leading-none">{p.emoji}</span>
                                  <span className="text-[9px] font-black uppercase tracking-wider text-sky-500 bg-sky-100 px-1.5 py-0.5 rounded-full">
                                    {p.tag}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 font-semibold leading-snug group-hover:text-sky-700">
                                  "{p.text}"
                                </p>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}

                      {vapi.affiliateCards?.length > 0 && (
                        <div className="px-5 pb-5 space-y-2">
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Found for you</p>
                          {vapi.affiliateCards.map((card: AffiliateCard, i: number) => (
                            <AffiliateCardItem key={i} card={card} />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ── CHAT MODE ───────────────────────────────── */}
                  {mode === 'chat' && (
                    <motion.div key="chat"
                      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                      transition={{ duration: 0.18 }}
                      className="flex-1 flex flex-col min-h-0"
                    >
                      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

                        {/* ── Empty state: grouped prompt categories ── */}
                        {messages.length === 0 && (
                          <div className="flex flex-col gap-5 py-2">
                            <div className="text-center">
                              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                                <span className="text-2xl">✈️</span>
                              </div>
                              <p className="text-sm font-semibold text-gray-900">Hey! I'm Gladys 👋</p>
                              <p className="text-xs text-gray-400 mt-1 max-w-[260px] mx-auto">
                                Your AI travel companion. Say hi, ask about visa rules, plan a trip, get weather — I'm here for everything travel.
                              </p>
                            </div>

                            {CHAT_PROMPT_GROUPS.map(group => (
                              <div key={group.label}>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                                  {group.label}
                                </p>
                                <div className="space-y-1.5">
                                  {group.prompts.map((p, i) => (
                                    <button key={i}
                                      onClick={() => handlePromptClick(p.text)}
                                      className="w-full text-left text-xs text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2.5 transition-colors flex items-center gap-2.5"
                                    >
                                      <span className="flex-shrink-0">{p.emoji}</span>
                                      <span>{p.text}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* ── Messages ── */}
                        {messages.map(msg => (
                          <ChatBubble
                            key={msg.id}
                            message={msg}
                            onTripPlan={onTripPlan}
                            isStreaming={streamingId === msg.id}
                          />
                        ))}
                        {isTyping && !streamingId && <TypingIndicator />}

                        {/* ── Quick-reply chips after conversation starts ── */}
                        {messages.length > 0 && !isTyping && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {CHAT_QUICK_PROMPTS.map((q, i) => (
                              <button key={i}
                                onClick={() => handlePromptClick(q)}
                                className="text-[11px] text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-100 hover:border-gray-200 px-3 py-1.5 rounded-full transition-colors"
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        )}

                        <div ref={messagesEndRef} />
                      </div>

                      {/* ── Input ── */}
                      <div className="px-4 pb-4 pt-2 border-t border-gray-50">
                        <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-2 border border-gray-100 focus-within:border-gray-300 focus-within:bg-white transition-all">
                          <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder="Ask me anything about travel..."
                            disabled={isTyping}
                            className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none disabled:opacity-50 py-1"
                          />
                          <button onClick={() => handleSend()} disabled={!input.trim() || isTyping}
                            className="w-7 h-7 rounded-xl bg-black text-white flex items-center justify-center disabled:opacity-30 hover:bg-gray-800 transition-all flex-shrink-0 active:scale-95"
                          >
                            <IconSend size={13} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* ── Footer ─────────────────────────────────────── */}
              <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-300">Gladys Travel AI</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-xs text-gray-400">13 tools active</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}