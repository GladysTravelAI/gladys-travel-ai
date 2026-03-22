'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Trophy, Music, PartyPopper, Sparkles, Calendar, MapPin, Loader2, X, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SKY = '#0EA5E9';

// ── TYPES ──────────────────────────────────────────────────────────────────────

interface Suggestion {
  id:       string;
  name:     string;
  type:     'event' | 'attraction' | 'venue';
  category: 'sports' | 'music' | 'festival' | 'other';
  date?:    string;
  venue?:   string;
  city?:    string;
  image?:   string;
}

interface SearchBarProps {
  value:          string;
  onChange:       (v: string) => void;
  onSearch:       (v: string) => void;
  onShowDates:    () => void;
  placeholder?:   string;
  borderColor?:   string;
  background?:    string;
  accentColor?:   string;
  loading?:       boolean;
  eventType?:     string | null;
}

// ── HELPERS ────────────────────────────────────────────────────────────────────

function catColor(cat: string) {
  if (cat === 'sports')   return SKY;
  if (cat === 'music')    return '#8B5CF6';
  if (cat === 'festival') return '#F97316';
  return '#10B981';
}

function CatIcon({ cat, size = 12 }: { cat: string; size?: number }) {
  if (cat === 'sports')   return <Trophy size={size} />;
  if (cat === 'music')    return <Music size={size} />;
  if (cat === 'festival') return <PartyPopper size={size} />;
  return <Sparkles size={size} />;
}

function fmtDate(d: string) {
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return d; }
}

// ── TRENDING SEARCHES ─────────────────────────────────────────────────────────
// Shown when input is focused but empty

const TRENDING: Array<{ name: string; category: Suggestion['category']; emoji: string }> = [
  { name: 'UEFA Champions League',            category: 'sports',   emoji: '🏆' },
  { name: 'Coachella 2026',                   category: 'festival', emoji: '🎪' },
  { name: 'Taylor Swift',                     category: 'music',    emoji: '🎤' },
  { name: 'NBA Finals',                       category: 'sports',   emoji: '🏀' },
  { name: 'Coldplay Music of the Spheres',    category: 'music',    emoji: '🎵' },
  { name: 'Formula 1 Monaco Grand Prix',      category: 'sports',   emoji: '🏎️' },
  { name: 'Glastonbury Festival',             category: 'festival', emoji: '🌟' },
  { name: 'Premier League',                  category: 'sports',   emoji: '⚽' },
];

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────

export default function SearchBar({
  value, onChange, onSearch, onShowDates,
  placeholder, borderColor, background, accentColor, loading, eventType,
}: SearchBarProps) {
  const [suggestions,   setSuggestions]   = useState<Suggestion[]>([]);
  const [showDropdown,  setShowDropdown]  = useState(false);
  const [fetching,      setFetching]      = useState(false);
  const [activeIndex,   setActiveIndex]   = useState(-1);

  const inputRef      = useRef<HTMLInputElement>(null);
  const dropdownRef   = useRef<HTMLDivElement>(null);
  const debounceRef   = useRef<NodeJS.Timeout | null>(null);
  const abortRef      = useRef<AbortController | null>(null);

  const accent = accentColor || SKY;

  // ── Fetch suggestions ──
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); return; }

    // Cancel previous request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setFetching(true);
    try {
      const res  = await fetch(`/api/autocomplete?q=${encodeURIComponent(q)}`, {
        signal: abortRef.current.signal,
      });
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
      setActiveIndex(-1);
    } catch (e: any) {
      if (e.name !== 'AbortError') setSuggestions([]);
    } finally {
      setFetching(false);
    }
  }, []);

  // ── Debounce input ──
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 280);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [value, fetchSuggestions]);

  // ── Close dropdown on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current   && !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Keyboard navigation ──
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = suggestions.length > 0 ? suggestions : TRENDING;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && items[activeIndex]) {
        selectSuggestion(items[activeIndex].name);
      } else {
        setShowDropdown(false);
        onSearch(value);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const selectSuggestion = (name: string) => {
    onChange(name);
    setShowDropdown(false);
    setSuggestions([]);
    setActiveIndex(-1);
    onShowDates();
    // Small delay so state updates first
    setTimeout(() => onSearch(name), 80);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setShowDropdown(true);
    if (e.target.value) onShowDates();
  };

  const clearInput = () => {
    onChange('');
    setSuggestions([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const showTrending  = showDropdown && !value.trim();
  const showResults   = showDropdown && value.trim().length >= 2;
  const dropdownOpen  = showTrending || showResults;

  // ── RENDER ──────────────────────────────────────────────────────────────────

  return (
    <div className="relative w-full">
      {/* ── Input ── */}
      <div className="relative">
        <Search size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
          style={{ color: dropdownOpen ? accent : '#94A3B8' }}
        />
        <input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Search any event worldwide...'}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full h-14 sm:h-16 pl-12 pr-12 text-base sm:text-lg font-medium rounded-2xl border-2 outline-none transition-all"
          style={{
            borderColor: dropdownOpen ? accent : (borderColor || '#BAE6FD'),
            background:  background   || 'white',
            boxShadow:   dropdownOpen
              ? `0 0 0 3px ${accent}20, 0 4px 20px rgba(14,165,233,0.12)`
              : '0 2px 16px rgba(14,165,233,0.08)',
          }}
        />

        {/* Right side: spinner or clear */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {fetching && (
            <Loader2 size={16} className="animate-spin text-slate-300" />
          )}
          {value && !fetching && (
            <button onClick={clearInput}
              className="w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors">
              <X size={12} className="text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* ── Dropdown ── */}
      <AnimatePresence>
        {dropdownOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50"
            style={{ maxHeight: '420px', overflowY: 'auto' }}
          >
            {/* ── Trending (shown when input is empty) ── */}
            {showTrending && (
              <div className="p-3">
                <div className="flex items-center gap-2 px-3 py-2 mb-1">
                  <TrendingUp size={13} className="text-slate-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Trending searches
                  </span>
                </div>
                {TRENDING.map((t, i) => (
                  <button key={i} onMouseDown={() => selectSuggestion(t.name)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all text-left hover:bg-slate-50 active:scale-[0.99]"
                    style={{ background: activeIndex === i ? '#F8FAFC' : 'transparent' }}>
                    <span className="text-lg leading-none w-7 text-center flex-shrink-0">{t.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{t.name}</p>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white flex-shrink-0"
                      style={{ background: catColor(t.category) }}>
                      {t.category}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* ── Live Ticketmaster suggestions ── */}
            {showResults && (
              <div className="p-3">
                {fetching && suggestions.length === 0 && (
                  <div className="flex items-center gap-3 px-3 py-4 text-slate-400 text-sm">
                    <Loader2 size={16} className="animate-spin flex-shrink-0" />
                    Searching Ticketmaster...
                  </div>
                )}

                {!fetching && suggestions.length === 0 && (
                  <div className="px-3 py-4 text-slate-400 text-sm text-center">
                    <Sparkles size={20} className="mx-auto mb-2 opacity-40" />
                    No events found — try a different search
                  </div>
                )}

                {suggestions.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Live results
                      </span>
                    </div>

                    {suggestions.map((s, i) => (
                      <button key={s.id} onMouseDown={() => selectSuggestion(s.name)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all text-left group"
                        style={{ background: activeIndex === i ? '#F0F9FF' : 'transparent' }}
                        onMouseEnter={() => setActiveIndex(i)}
                        onMouseLeave={() => setActiveIndex(-1)}>

                        {/* Thumbnail or icon */}
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center"
                          style={{ background: s.image ? undefined : catColor(s.category) + '15' }}>
                          {s.image
                            ? <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                            : <CatIcon cat={s.category} size={16} />
                          }
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900 text-sm truncate leading-tight">
                            {s.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {s.type === 'event' && s.date && (
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Calendar size={9} />{fmtDate(s.date)}
                              </span>
                            )}
                            {s.city && (
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <MapPin size={9} />{s.city}
                              </span>
                            )}
                            {s.type === 'attraction' && (
                              <span className="text-xs text-slate-400">Artist / Team</span>
                            )}
                          </div>
                        </div>

                        {/* Category pill */}
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white flex-shrink-0"
                          style={{ background: catColor(s.category) }}>
                          <CatIcon cat={s.category} size={9} />
                        </span>
                      </button>
                    ))}
                  </>
                )}

                {/* "Search for X" footer */}
                <div className="border-t border-slate-100 mt-2 pt-2">
                  <button onMouseDown={() => { setShowDropdown(false); onSearch(value); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-slate-50 transition-colors text-left">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: accent + '15' }}>
                      <Search size={16} style={{ color: accent }} />
                    </div>
                    <div>
                      <p className="font-black text-sm text-slate-900">
                        Search "<span style={{ color: accent }}>{value}</span>"
                      </p>
                      <p className="text-xs text-slate-400">Browse all matching results</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}