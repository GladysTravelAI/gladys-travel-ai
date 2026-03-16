'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useVapiContext } from './VapiProvider';

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
  type: 'weather' | 'packing' | 'tips' | 'flight_status' | 'nearby' | 'affiliate';
  data: any;
}

type Mode = 'voice' | 'chat';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconMic = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    case 'get_weather':             return { type: 'weather',       data: result };
    case 'get_packing_list':        return { type: 'packing',       data: result };
    case 'get_travel_tips':         return { type: 'tips',          data: result };
    case 'check_flight_status':     return { type: 'flight_status', data: result };
    case 'find_nearby_attractions': return { type: 'nearby',        data: result };
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

// ─── Tool Card renderer ───────────────────────────────────────────────────────

function ToolCardRenderer({ card }: { card: ToolCard }) {
  switch (card.type) {
    case 'weather':       return <WeatherCard data={card.data} />;
    case 'packing':       return <PackingCard data={card.data} />;
    case 'tips':          return <TipsCard data={card.data} />;
    case 'flight_status': return <FlightStatusCard data={card.data} />;
    case 'nearby':        return <NearbyCard data={card.data} />;
    default:              return null;
  }
}

// ─── Voice Orb ────────────────────────────────────────────────────────────────

function VoiceOrb({ volumeLevel, status }: { volumeLevel: number; status: string }) {
  const isActive     = status === 'active';
  const isConnecting = status === 'connecting';
  const scale        = isActive ? 1 + volumeLevel * 0.35 : 1;

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="relative flex items-center justify-center">
        {isActive && (
          <>
            <div className="absolute rounded-full border border-black/5 transition-all duration-100"
              style={{ width: `${120 + volumeLevel * 60}px`, height: `${120 + volumeLevel * 60}px` }} />
            <div className="absolute rounded-full border border-black/5 transition-all duration-150"
              style={{ width: `${100 + volumeLevel * 40}px`, height: `${100 + volumeLevel * 40}px` }} />
          </>
        )}
        {isConnecting && (
          <div className="absolute w-24 h-24 rounded-full border-2 border-black/10 animate-ping" />
        )}
        <div
          className="w-20 h-20 rounded-full bg-black flex items-center justify-center shadow-xl transition-transform duration-100"
          style={{ transform: `scale(${scale})` }}
        >
          {isActive ? (
            <div className="flex gap-1 items-center">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="w-0.5 bg-white rounded-full animate-pulse"
                  style={{ height: `${8 + (i % 3) * 6}px`, animationDelay: `${i * 0.1}s`, animationDuration: '0.6s' }} />
              ))}
            </div>
          ) : isConnecting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <IconMic size={24} />
          )}
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-900">
          {isActive ? 'Gladys is listening' : isConnecting ? 'Connecting...' : 'Tap to speak'}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {isActive ? 'Ask anything — events, weather, packing, flights' : 'Your AI travel companion'}
        </p>
      </div>
    </div>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
      <div className={`max-w-[82%] min-w-[48px] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? 'bg-black text-white rounded-br-sm'
          : 'bg-gray-50 text-gray-900 rounded-bl-sm border border-gray-100'
      }`}>
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>

      {message.toolCard && (
        <div className="w-full max-w-[95%]">
          <ToolCardRenderer card={message.toolCard} />
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
  { text: 'Plan my World Cup 2026 trip',           emoji: '⚽' },
  { text: "What's the weather in Madrid?",          emoji: '🌤' },
  { text: 'What should I pack for Barcelona?',      emoji: '🧳' },
  { text: 'Check flight BA123',                     emoji: '✈️' },
  { text: "What's on near me tonight?",             emoji: '📍' },
  { text: 'Build a trip to Coachella',              emoji: '🎵' },
];

// Grouped prompts — shown on empty chat state
const CHAT_PROMPT_GROUPS = [
  {
    label: 'Say hello',
    prompts: [
      { text: 'Hey Gladys! 👋',              emoji: '👋' },
      { text: "What can you help me with?",   emoji: '💡' },
    ],
  },
  {
    label: 'Live tools',
    prompts: [
      { text: "Weather in Dubai next week?",       emoji: '🌤' },
      { text: 'Pack list for 5 days in London',    emoji: '🧳' },
      { text: 'Check flight status for BA456',     emoji: '✈️' },
      { text: "What's on near me in New York?",    emoji: '📍' },
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

export default function GladysCompanion({ eventContext }: { eventContext?: string }) {
  const vapi = useVapiContext();
  const [isOpen,   setIsOpen]   = useState(false);
  const [mode,     setMode]     = useState<Mode>('voice');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input,    setInput]    = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const prevToolCount  = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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

  // ─── handleSend — /api/gladys-chat (~2-3s) ───────────────────────────────
  // Replaced from /api/agent (was 38s due to Ticketmaster + PredictHQ lookup)
  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`, role: 'user', content: text, timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res    = await fetch('/api/gladys-chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: text, context: eventContext }),
      });
      const result = await res.json();

      // Build tool card if a tool was triggered
      const toolCard = result.toolName
        ? detectToolCard(result.toolName, result.toolResult)
        : undefined;

      // Show toast for tool results
      if (result.toolName && result.toolResult) {
        const { title, description } = getToastConfig(result.toolName, result.toolResult);
        const isDisruption = result.toolName === 'check_flight_status' &&
          ['cancelled', 'diverted'].includes(result.toolResult?.status);
        if (isDisruption) {
          toast.error(title, { description, duration: 10000 });
        } else {
          toast.success(title, { description, duration: 5000 });
        }
      }

      setMessages(prev => [...prev, {
        id:        `assistant-${Date.now()}`,
        role:      'assistant',
        content:   result.reply ?? result.message ?? "I'm here to help with your travel plans!",
        toolCard:  toolCard ?? undefined,
        timestamp: new Date(),
      }]);
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
  }, [input, isTyping, eventContext]);

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
            className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
          >
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-black text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg"
            >
              Talk to Gladys
            </motion.div>

            <button
              onClick={() => setIsOpen(true)}
              className="relative w-14 h-14 rounded-full bg-black shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            >
              {hasActivity && (
                <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
              )}
              {isVoiceActive ? (
                <div className="flex gap-0.5 items-center">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="w-0.5 bg-white rounded-full animate-pulse"
                      style={{ height: `${10 + i * 3}px`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              ) : (
                <IconMic size={22} />
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
              className="fixed bottom-6 right-6 z-50 w-[400px] max-h-[680px] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
              style={{ maxWidth: 'calc(100vw - 24px)' }}
            >
              {/* ── Header ─────────────────────────────────────── */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">G</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 leading-tight">Gladys</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isVoiceActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                      <span className="text-xs text-gray-400">
                        {isVoiceActive ? 'On a call' : isVoiceConnecting ? 'Connecting...' : 'AI Travel Companion'}
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
                      <VoiceOrb volumeLevel={vapi.volumeLevel} status={vapi.status} />

                      <div className="flex items-center justify-center gap-3 pb-6 px-5">
                        {isVoiceActive && (
                          <button onClick={vapi.toggleMute}
                            className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${
                              vapi.isMuted
                                ? 'bg-red-50 border-red-200 text-red-500'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                            }`}>
                            {vapi.isMuted ? <IconMicOff size={18} /> : <IconMic size={18} />}
                          </button>
                        )}

                        <button
                          onClick={handleVoiceToggle}
                          disabled={isVoiceConnecting || vapi.status === 'ending'}
                          className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            isVoiceActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-black hover:bg-gray-800 text-white'
                          }`}
                        >
                          {isVoiceConnecting ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Connecting...</>
                          ) : isVoiceActive ? (
                            <><IconStop size={14} />End Call</>
                          ) : (
                            <><IconMic size={16} />Start Voice</>
                          )}
                        </button>
                      </div>

                      {vapi.status === 'idle' && (
                        <div className="px-5 pb-6 space-y-2">
                          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Try saying</p>
                          {VOICE_PROMPTS.map((p, i) => (
                            <button key={i}
                              onClick={() => vapi.startCall(`User wants: ${p.text}`)}
                              className="w-full text-left text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl px-4 py-3 transition-colors border border-transparent hover:border-gray-200 flex items-center gap-3"
                            >
                              <span>{p.emoji}</span>
                              <span>"{p.text}"</span>
                            </button>
                          ))}
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
                        {messages.map(msg => <ChatBubble key={msg.id} message={msg} />)}
                        {isTyping && <TypingIndicator />}

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