'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation, Car, Train, PersonStanding, Clock,
  MapPin, ChevronRight, ExternalLink, Loader2,
  RefreshCw, Locate,
} from 'lucide-react';

const SKY = '#0EA5E9';

// ── TYPES ──────────────────────────────────────────────────────────────────────

interface DirectionOption {
  mode:        'driving' | 'transit' | 'walking';
  duration:    string;
  durationVal: number; // seconds for sorting
  distance:    string;
  summary:     string;
  steps?:      string[];
}

interface VenueDirectionsProps {
  venue:         string;
  city:          string;
  eventName?:    string;
  eventDate?:    string;
  eventTime?:    string;
  accentColor?:  string;
}

const MODE_CONFIG = {
  driving: { icon: Car,             label: 'Drive',   color: '#0EA5E9' },
  transit: { icon: Train,           label: 'Transit', color: '#8B5CF6' },
  walking: { icon: PersonStanding,  label: 'Walk',    color: '#10B981' },
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────

export default function VenueDirections({
  venue, city, eventName, eventDate, eventTime, accentColor,
}: VenueDirectionsProps) {
  const accent = accentColor || SKY;

  const [expanded,   setExpanded]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [options,    setOptions]    = useState<DirectionOption[]>([]);
  const [selected,   setSelected]   = useState<'driving' | 'transit' | 'walking'>('driving');
  const [origin,     setOrigin]     = useState('');
  const [locating,   setLocating]   = useState(false);
  const [error,      setError]      = useState('');
  const [showSteps,  setShowSteps]  = useState(false);

  const destination = `${venue}, ${city}`;

  // ── Get user location ──
  const getUserLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        // Reverse geocode using Nominatim (free)
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          .then(r => r.json())
          .then(d => {
            const addr = d.display_name?.split(',').slice(0, 2).join(',').trim() || `${lat.toFixed(4)},${lng.toFixed(4)}`;
            setOrigin(addr);
          })
          .catch(() => setOrigin(`${lat.toFixed(4)},${lng.toFixed(4)}`))
          .finally(() => setLocating(false));
      },
      () => { setError('Could not get your location'); setLocating(false); }
    );
  };

  // ── Fetch directions ──
  const fetchDirections = async () => {
    if (!origin.trim()) { setError('Enter your starting point'); return; }
    setLoading(true); setError(''); setOptions([]);

    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      // Fallback — just open Google Maps
      setError('');
      setOptions([{
        mode: 'driving', duration: 'Tap to view', durationVal: 0,
        distance: '', summary: 'Opens in Google Maps',
      }]);
      setLoading(false);
      return;
    }

    try {
      const modes: Array<'driving' | 'transit' | 'walking'> = ['driving', 'transit', 'walking'];
      const results = await Promise.allSettled(
        modes.map(async mode => {
          const params = new URLSearchParams({
            origin:      origin,
            destination: destination,
            mode,
            key,
          });
          const res  = await fetch(`/api/maps-directions?${params}`);
          const data = await res.json();
          return { mode, data };
        })
      );

      const directions: DirectionOption[] = [];
      for (const r of results) {
        if (r.status !== 'fulfilled') continue;
        const { mode, data } = r.value;
        if (data.status !== 'OK' || !data.routes?.[0]) continue;
        const leg  = data.routes[0].legs[0];
        const steps = (data.routes[0].legs[0].steps ?? [])
          .slice(0, 5)
          .map((s: any) => s.html_instructions?.replace(/<[^>]+>/g, '') ?? '')
          .filter(Boolean);

        directions.push({
          mode,
          duration:    leg.duration.text,
          durationVal: leg.duration.value,
          distance:    leg.distance.text,
          summary:     data.routes[0].summary || mode,
          steps,
        });
      }

      directions.sort((a, b) => a.durationVal - b.durationVal);
      setOptions(directions.length > 0 ? directions : [{
        mode: 'driving', duration: 'Tap to get directions', durationVal: 0,
        distance: '', summary: 'Opens Google Maps',
      }]);
    } catch {
      setError('Could not load directions — tap any mode to open Google Maps');
    } finally {
      setLoading(false);
    }
  };

  // ── Google Maps deep link ──
  const mapsUrl = (mode: string) =>
    `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin || 'My+Location')}&destination=${encodeURIComponent(destination)}&travelmode=${mode}`;

  const uberUrl = `https://m.uber.com/ul/?action=setPickup&dropoff[formatted_address]=${encodeURIComponent(destination)}`;

  const selectedOption = options.find(o => o.mode === selected);

  // ── Days until event ──
  const daysUntil = eventDate
    ? Math.ceil((new Date(eventDate).getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <div className="rounded-3xl overflow-hidden border-2 border-slate-100 bg-white">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-5 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: accent + '15' }}>
          <Navigation size={20} style={{ color: accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-900 text-sm">Get to the Venue</p>
          <p className="text-xs text-slate-400 truncate mt-0.5">{venue}, {city}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {daysUntil !== null && daysUntil >= 0 && daysUntil <= 3 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
              style={{ background: daysUntil === 0 ? '#EF4444' : accent }}>
              {daysUntil === 0 ? 'Today!' : `${daysUntil}d`}
            </span>
          )}
          <ChevronRight size={16} className={`text-slate-300 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-slate-100">

              {/* Origin input */}
              <div className="pt-4">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 block">
                  Starting from
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={origin}
                      onChange={e => setOrigin(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && fetchDirections()}
                      placeholder="Your hotel, airport, address..."
                      className="w-full pl-9 pr-3 h-11 border-2 border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-sky-400 transition-all"
                    />
                  </div>
                  <button
                    onClick={getUserLocation}
                    disabled={locating}
                    title="Use my location"
                    className="w-11 h-11 rounded-xl border-2 border-slate-200 flex items-center justify-center hover:border-sky-400 transition-all flex-shrink-0"
                  >
                    {locating
                      ? <Loader2 size={16} className="animate-spin text-slate-400" />
                      : <Locate size={16} className="text-slate-400" />
                    }
                  </button>
                  <button
                    onClick={fetchDirections}
                    disabled={loading || !origin.trim()}
                    className="h-11 px-4 rounded-xl text-sm font-black text-white disabled:opacity-40 transition-all flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, #38BDF8, #0284C7)` }}
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : 'Go'}
                  </button>
                </div>
                {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
              </div>

              {/* Mode selector */}
              {options.length > 0 && (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {(['driving', 'transit', 'walking'] as const).map(mode => {
                      const cfg    = MODE_CONFIG[mode];
                      const opt    = options.find(o => o.mode === mode);
                      const Icon   = cfg.icon;
                      const active = selected === mode;
                      return (
                        <button
                          key={mode}
                          onClick={() => { setSelected(mode); setShowSteps(false); }}
                          className="flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all"
                          style={{
                            borderColor: active ? cfg.color : '#E2E8F0',
                            background:  active ? cfg.color + '10' : 'white',
                          }}
                        >
                          <Icon size={18} style={{ color: active ? cfg.color : '#94A3B8' }} />
                          <span className="text-xs font-black" style={{ color: active ? cfg.color : '#64748B' }}>
                            {cfg.label}
                          </span>
                          {opt && (
                            <span className="text-[10px] font-semibold text-slate-400">{opt.duration}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected route detail */}
                  {selectedOption && (
                    <div className="rounded-2xl p-4 space-y-3"
                      style={{ background: MODE_CONFIG[selected].color + '08', border: `1.5px solid ${MODE_CONFIG[selected].color}20` }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-black text-slate-900 text-base">{selectedOption.duration}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {selectedOption.distance} via {selectedOption.summary}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {selected === 'driving' && (
                            <a href={uberUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl bg-black text-white">
                              🚗 Uber
                            </a>
                          )}
                          <a
                            href={mapsUrl(selected)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-white"
                            style={{ background: `linear-gradient(135deg, #38BDF8, #0284C7)` }}
                          >
                            <ExternalLink size={11} />
                            Open Maps
                          </a>
                        </div>
                      </div>

                      {/* Turn-by-turn steps */}
                      {selectedOption.steps && selectedOption.steps.length > 0 && (
                        <>
                          <button
                            onClick={() => setShowSteps(!showSteps)}
                            className="text-xs font-bold flex items-center gap-1"
                            style={{ color: MODE_CONFIG[selected].color }}
                          >
                            {showSteps ? 'Hide' : 'Show'} directions
                            <ChevronRight size={12} className={`transition-transform ${showSteps ? 'rotate-90' : ''}`} />
                          </button>
                          <AnimatePresence>
                            {showSteps && (
                              <motion.ol
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2 overflow-hidden"
                              >
                                {selectedOption.steps.map((step, i) => (
                                  <li key={i} className="flex gap-2 text-xs text-slate-600">
                                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-shrink-0 mt-0.5"
                                      style={{ background: MODE_CONFIG[selected].color }}>
                                      {i + 1}
                                    </span>
                                    {step}
                                  </li>
                                ))}
                              </motion.ol>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Quick links — always show */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-slate-200 text-xs font-bold text-slate-600 hover:border-slate-300 transition-all"
                >
                  <MapPin size={13} />View on Map
                </a>
                <a
                  href={uberUrl}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-slate-200 text-xs font-bold text-slate-600 hover:border-slate-300 transition-all"
                >
                  🚗 Book Uber
                </a>
              </div>

              {/* Event time reminder */}
              {eventTime && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: accent + '10' }}>
                  <Clock size={13} style={{ color: accent }} />
                  <p className="text-xs font-bold" style={{ color: accent }}>
                    Event starts at {eventTime} — allow extra time for entry queues
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}