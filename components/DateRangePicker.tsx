'use client';

import { useState, useMemo } from 'react';
import {
  Calendar, Info, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Sparkles, Clock,
  Sun, Cloud, Snowflake, Umbrella, Check, X, AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const SKY = '#0EA5E9';

// ── TYPES ──────────────────────────────────────────────────────────────────────

interface DateRangePickerProps {
  startDate:       Date | null;
  endDate:         Date | null;
  onDateChange:    (start: Date | null, end: Date | null) => void;
  destination?:    string;
  showCalendar?:   boolean;
  showPriceTrends?: boolean;
  minNights?:      number;
  maxNights?:      number;
}

interface DateInfo {
  date:        Date;
  isToday:     boolean;
  isSelected:  boolean;
  isInRange:   boolean;
  isStartDate: boolean;
  isEndDate:   boolean;
  isDisabled:  boolean;
  isWeekend:   boolean;
  priceTrend?: 'low' | 'medium' | 'high';
}

// ── SEASONAL DATA ──────────────────────────────────────────────────────────────

const SEASONAL: Record<string, { bestMonths: string; reason: string; avoid: string; icon: any; color: string }> = {
  dubai:      { bestMonths: 'November – March', reason: 'Cooler weather (20–30°C)',          avoid: 'June–August (40°C+)',              icon: Sun,       color: '#F97316' },
  paris:      { bestMonths: 'April – June, Sep – Oct', reason: 'Mild weather, fewer crowds', avoid: 'July–August (peak tourist season)', icon: Cloud,     color: SKY       },
  tokyo:      { bestMonths: 'March – May, Sep – Nov', reason: 'Cherry blossoms or fall colours', avoid: 'July–August (hot & humid)',   icon: Sparkles,  color: '#EC4899' },
  'new york': { bestMonths: 'April – June, Sep – Nov', reason: 'Pleasant weather, festivals', avoid: 'January–February (very cold)',   icon: Cloud,     color: SKY       },
  'cape town':{ bestMonths: 'November – March', reason: 'Summer season, beaches',            avoid: 'June–August (rainy & cold)',      icon: Sun,       color: '#F59E0B' },
  london:     { bestMonths: 'May – September', reason: 'Warmer weather, longer days',        avoid: 'November–February (cold & rainy)',icon: Umbrella,  color: '#64748B' },
  iceland:    { bestMonths: 'June – August', reason: 'Midnight sun, accessible roads',       avoid: 'November–March (limited daylight)',icon: Snowflake, color: '#06B6D4' },
};

// ── QUICK PRESETS ──────────────────────────────────────────────────────────────

const QUICK = [
  { label: 'Weekend', days: 2,  offset: () => { const d = new Date().getDay(); return d === 6 ? 0 : d === 0 ? 6 : 6 - d; } },
  { label: '3 Days',  days: 3,  offset: () => 7  },
  { label: '1 Week',  days: 7,  offset: () => 7  },
  { label: '10 Days', days: 10, offset: () => 14 },
  { label: '2 Weeks', days: 14, offset: () => 14 },
  { label: '3 Weeks', days: 21, offset: () => 21 },
  { label: '1 Month', days: 30, offset: () => 30 },
  { label: '6 Weeks', days: 42, offset: () => 30 },
];

// ── MAIN ───────────────────────────────────────────────────────────────────────

export default function DateRangePicker({
  startDate, endDate, onDateChange, destination,
  showCalendar = true, showPriceTrends = true,
  minNights = 1, maxNights = 90,
}: DateRangePickerProps) {
  const [currentMonth,     setCurrentMonth]     = useState(new Date());
  const [showSeasonalInfo, setShowSeasonalInfo] = useState(false);
  const [selectingStart,   setSelectingStart]   = useState(true);
  const [hoveredDate,      setHoveredDate]      = useState<Date | null>(null);

  const seasonal = destination
    ? Object.entries(SEASONAL).find(([k]) => destination.toLowerCase().includes(k))?.[1] ?? null
    : null;
  const SeasonIcon = seasonal?.icon ?? Sun;

  // ── Helpers ──

  const getDuration = (s?: Date | null, e?: Date | null) => {
    const a = s ?? startDate; const b = e ?? endDate;
    if (!a || !b) return null;
    return Math.ceil((b.getTime() - a.getTime()) / 86_400_000);
  };
  const duration = getDuration();

  const fmtShort = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // ── Handlers ──

  const handleQuickSelect = (days: number, offsetFn: () => number) => {
    const start = new Date(); start.setDate(start.getDate() + offsetFn()); start.setHours(0,0,0,0);
    const end   = new Date(start); end.setDate(end.getDate() + days);
    onDateChange(start, end);
    toast.success(`${days} days selected`, { description: `${fmtShort(start)} – ${fmtShort(end)}` });
  };

  const handleDateClick = (date: Date) => {
    if (selectingStart || !startDate) {
      onDateChange(date, null); setSelectingStart(false);
      toast.success('Start date set', { description: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) });
    } else {
      const [s, e] = date < startDate ? [date, startDate] : [startDate, date];
      const d = getDuration(s, e);
      if (d !== null && d < minNights) { toast.error(`Minimum ${minNights} night${minNights === 1 ? '' : 's'} required`); return; }
      if (d !== null && d > maxNights) { toast.error(`Maximum ${maxNights} nights allowed`); return; }
      onDateChange(s, e);
      if (d !== null) toast.success('Dates confirmed', { description: `${d} day${d === 1 ? '' : 's'} · ${fmtShort(s)} – ${fmtShort(e)}` });
      setSelectingStart(true);
    }
  };

  const handleClear = () => { onDateChange(null, null); setSelectingStart(true); };

  // ── Calendar generation ──

  const calendarDays = useMemo(() => {
    const yr = currentMonth.getFullYear(); const mo = currentMonth.getMonth();
    const firstDay = new Date(yr, mo, 1); const startDow = firstDay.getDay();
    const daysInMonth = new Date(yr, mo + 1, 0).getDate();
    const prevLast    = new Date(yr, mo, 0).getDate();
    const today = new Date(); today.setHours(0,0,0,0);
    const days: DateInfo[] = [];

    const make = (date: Date, disabled: boolean): DateInfo => {
      const dt = date.getTime(); const st = startDate?.getTime() ?? 0; const et = endDate?.getTime() ?? 0; const ht = hoveredDate?.getTime() ?? 0;
      const inRange = startDate && endDate
        ? dt >= st && dt <= et
        : startDate && hoveredDate && !selectingStart
          ? (dt >= st && dt <= ht) || (dt <= st && dt >= ht)
          : false;
      return {
        date, isToday: dt === today.getTime(),
        isSelected: (!!startDate && dt === st) || (!!endDate && dt === et),
        isInRange: !!inRange,
        isStartDate: !!startDate && dt === st,
        isEndDate:   !!endDate   && dt === et,
        isDisabled:  disabled || dt < today.getTime(),
        isWeekend:   date.getDay() === 0 || date.getDay() === 6,
        priceTrend:  showPriceTrends ? getPriceTrend(date) : undefined,
      };
    };

    for (let i = startDow - 1; i >= 0; i--)
      days.push(make(new Date(yr, mo - 1, prevLast - i), true));
    for (let d = 1; d <= daysInMonth; d++)
      days.push(make(new Date(yr, mo, d), false));
    const rem = 42 - days.length;
    for (let d = 1; d <= rem; d++)
      days.push(make(new Date(yr, mo + 1, d), true));
    return days;
  }, [currentMonth, startDate, endDate, hoveredDate]);

  function getPriceTrend(d: Date): 'low' | 'medium' | 'high' {
    const dow = d.getDay(); const mo = d.getMonth();
    if (dow === 0 || dow === 6 || mo === 11 || mo === 0 || mo === 6 || mo === 7) return 'high';
    if (mo === 9 || mo === 10 || mo === 2 || mo === 3) return 'medium';
    return 'low';
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4"
      style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}>

      {/* ── Date inputs ── */}
      <div className="grid grid-cols-2 gap-3">
        {([
          { label: 'Start Date', val: startDate,  onChange: (v: Date | null) => onDateChange(v, endDate),   min: new Date() },
          { label: 'End Date',   val: endDate,    onChange: (v: Date | null) => onDateChange(startDate, v), min: startDate ?? new Date() },
        ] as const).map((f, i) => (
          <div key={i} className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500">{f.label}</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input type="date"
                value={f.val ? f.val.toISOString().split('T')[0] : ''}
                onChange={e => f.onChange(e.target.value ? new Date(e.target.value) : null)}
                min={f.min.toISOString().split('T')[0]}
                className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-slate-200 rounded-xl outline-none focus:border-sky-400 transition-all text-slate-900"
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Duration pill ── */}
      <AnimatePresence>
        {duration && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="flex items-center justify-between p-3.5 rounded-2xl border-2 border-sky-200" style={{ background: '#F0F9FF' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: SKY }}>
                  <Clock size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">{duration} {duration === 1 ? 'day' : 'days'}</p>
                  <p className="text-xs text-slate-400">{startDate && fmtShort(startDate)} – {endDate && fmtShort(endDate)}</p>
                </div>
              </div>
              <button onClick={handleClear}
                className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-white transition-all">
                <X size={13} />Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quick select ── */}
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Quick select</p>
        <div className="grid grid-cols-4 gap-1.5">
          {QUICK.map((q, i) => (
            <motion.button key={q.label}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
              onClick={() => handleQuickSelect(q.days, q.offset)}
              className="py-2 text-xs font-bold rounded-xl border-2 border-slate-200 text-slate-600 hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50 transition-all active:scale-[0.97]">
              {q.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Calendar ── */}
      {showCalendar && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border-2 border-slate-100 p-4">

          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { const m = new Date(currentMonth); m.setMonth(m.getMonth() - 1); setCurrentMonth(m); }}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
              <ChevronLeft size={16} className="text-slate-600" />
            </button>
            <h3 className="text-sm font-black text-slate-900">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => { const m = new Date(currentMonth); m.setMonth(m.getMonth() + 1); setCurrentMonth(m); }}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
              <ChevronRight size={16} className="text-slate-600" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d} className="text-center text-[10px] font-black text-slate-400 py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((di, i) => (
              <DayCell key={i} di={di}
                onClick={() => !di.isDisabled && handleDateClick(di.date)}
                onHover={() => setHoveredDate(di.date)} />
            ))}
          </div>

          {/* Legend */}
          {showPriceTrends && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-center gap-5 text-xs text-slate-400">
              <span className="flex items-center gap-1"><TrendingDown size={10} className="text-emerald-500" />Lower prices</span>
              <span className="flex items-center gap-1"><TrendingUp   size={10} className="text-red-400"     />Higher prices</span>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Seasonal info ── */}
      {seasonal && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
          <button onClick={() => setShowSeasonalInfo(!showSeasonalInfo)}
            className="flex items-start gap-3 w-full text-left">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <SeasonIcon size={17} style={{ color: seasonal.color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-amber-900">Best Time to Visit</p>
                <Info size={13} className="text-amber-500" />
              </div>
              <AnimatePresence>
                {showSeasonalInfo && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mt-2 space-y-2 overflow-hidden">
                    <div className="flex items-start gap-2">
                      <Check size={12} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-amber-900">{seasonal.bestMonths}</p>
                        <p className="text-xs text-amber-700">{seasonal.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle size={12} className="text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-amber-900">Avoid:</p>
                        <p className="text-xs text-amber-700">{seasonal.avoid}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </button>
        </motion.div>
      )}

      {/* ── Status hint ── */}
      <p className="text-center text-xs text-slate-400">
        {!startDate && !endDate && 'Select your travel dates to continue'}
        {startDate  && !endDate  && '✓ Start date set — now choose your return date'}
        {startDate  && endDate   && '✓ Dates confirmed — ready to plan your trip'}
      </p>
    </div>
  );
}

// ── DAY CELL ───────────────────────────────────────────────────────────────────

function DayCell({ di, onClick, onHover }: { di: DateInfo; onClick: () => void; onHover: () => void }) {
  const { date, isToday, isSelected, isInRange, isStartDate, isEndDate, isDisabled, priceTrend } = di;

  let bg = '', textColor = '', ring = '';
  if (isSelected)                          { bg = SKY;      textColor = 'white'; }
  else if (isInRange)                      { bg = '#E0F2FE'; textColor = '#0284C7'; }
  else if (!isDisabled)                    { bg = '';        textColor = '#0F172A'; }
  else                                     { bg = '';        textColor = '#CBD5E1'; }
  if (isToday && !isSelected)             ring = `ring-2 ring-sky-400`;

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.08 } : {}}
      whileTap={!isDisabled ? { scale: 0.94 } : {}}
      onClick={onClick}
      onMouseEnter={onHover}
      disabled={isDisabled}
      className={`relative aspect-square rounded-xl text-xs font-bold transition-all ${ring} ${!isSelected && !isInRange && !isDisabled ? 'hover:bg-sky-50' : ''}`}
      style={{ background: bg, color: textColor }}
    >
      <span className="relative z-10">{date.getDate()}</span>

      {/* Price trend dot */}
      {priceTrend && !isDisabled && !isSelected && (
        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2">
          {priceTrend === 'low'    && <TrendingDown size={8} className="text-emerald-500" />}
          {priceTrend === 'high'   && <TrendingUp   size={8} className="text-red-400"     />}
          {priceTrend === 'medium' && <div className="w-1 h-1 rounded-full bg-amber-400" />}
        </div>
      )}

      {/* Today dot */}
      {isToday && !isSelected && (
        <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: SKY }} />
      )}
    </motion.button>
  );
}