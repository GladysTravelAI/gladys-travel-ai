'use client';

import { useState, useMemo } from 'react';
import {
  Calendar,
  Info,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Clock,
  Sun,
  Cloud,
  Snowflake,
  Umbrella,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ==================== TYPES ====================

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateChange: (start: Date | null, end: Date | null) => void;
  destination?: string;
  showCalendar?: boolean;
  showPriceTrends?: boolean;
  minNights?: number;
  maxNights?: number;
}

interface DateInfo {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  isInRange: boolean;
  isStartDate: boolean;
  isEndDate: boolean;
  isDisabled: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  priceTrend?: 'low' | 'medium' | 'high';
}

// ==================== MAIN COMPONENT ====================

export default function DateRangePicker({
  startDate,
  endDate,
  onDateChange,
  destination,
  showCalendar = true,
  showPriceTrends = true,
  minNights = 1,
  maxNights = 90,
}: DateRangePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showSeasonalInfo, setShowSeasonalInfo] = useState(false);
  const [selectingStart, setSelectingStart] = useState(true);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // ==================== SEASONAL INFO ====================

  const getSeasonalInfo = (dest: string) => {
    const seasonalData: Record<string, any> = {
      dubai: {
        bestMonths: 'November–March',
        reason: 'Cooler weather (20-30°C)',
        avoid: 'June-August (40°C+)',
        icon: Sun,
        color: 'text-orange-600',
      },
      paris: {
        bestMonths: 'April–June, September–October',
        reason: 'Mild weather, fewer crowds',
        avoid: 'July-August (peak tourist season)',
        icon: Cloud,
        color: 'text-blue-600',
      },
      tokyo: {
        bestMonths: 'March–May, September–November',
        reason: 'Cherry blossoms or fall colors',
        avoid: 'July-August (hot & humid)',
        icon: Sparkles,
        color: 'text-pink-600',
      },
      'new york': {
        bestMonths: 'April–June, September–November',
        reason: 'Pleasant weather, festivals',
        avoid: 'January-February (very cold)',
        icon: Cloud,
        color: 'text-blue-600',
      },
      'cape town': {
        bestMonths: 'November–March',
        reason: 'Summer season, beaches',
        avoid: 'June-August (rainy & cold)',
        icon: Sun,
        color: 'text-yellow-600',
      },
      london: {
        bestMonths: 'May–September',
        reason: 'Warmer weather, longer days',
        avoid: 'November-February (cold & rainy)',
        icon: Umbrella,
        color: 'text-gray-600',
      },
      iceland: {
        bestMonths: 'June–August',
        reason: 'Midnight sun, accessible roads',
        avoid: 'November-March (limited daylight)',
        icon: Snowflake,
        color: 'text-cyan-600',
      },
    };

    const normalizedDest = dest.toLowerCase();
    for (const [key, info] of Object.entries(seasonalData)) {
      if (normalizedDest.includes(key)) return info;
    }
    return null;
  };

  const seasonalInfo = destination ? getSeasonalInfo(destination) : null;
  const SeasonIcon = seasonalInfo?.icon || Sun;

  // ==================== QUICK SELECTIONS ====================

  const quickSelections = [
    { label: 'Weekend', days: 2, offset: getDaysUntilWeekend() },
    { label: '3 Days', days: 3, offset: 7 },
    { label: '1 Week', days: 7, offset: 7 },
    { label: '10 Days', days: 10, offset: 14 },
    { label: '2 Weeks', days: 14, offset: 14 },
    { label: '3 Weeks', days: 21, offset: 21 },
    { label: '1 Month', days: 30, offset: 30 },
    { label: '6 Weeks', days: 42, offset: 30 },
  ];

  function getDaysUntilWeekend() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    return dayOfWeek === 6 ? 0 : dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
  }

  // ==================== HANDLERS ====================

  const handleQuickSelect = (days: number, offset: number) => {
    const start = new Date();
    start.setDate(start.getDate() + offset);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + days);

    onDateChange(start, end);
    toast.success('Dates selected', {
      description: `${days} ${days === 1 ? 'day' : 'days'} starting ${start.toLocaleDateString()}`,
    });
  };

  const handleDateClick = (date: Date) => {
    if (selectingStart || !startDate) {
      // Selecting start date
      onDateChange(date, null);
      setSelectingStart(false);
      toast.success('Start date selected', {
        description: date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        }),
      });
    } else {
      // Selecting end date
      if (date < startDate) {
        // If selected date is before start, swap them
        onDateChange(date, startDate);
        toast.success('Dates selected', {
          description: `${getDuration(date, startDate)} ${getDuration(date, startDate) === 1 ? 'day' : 'days'}`,
        });
      } else {
        onDateChange(startDate, date);
        const duration = getDuration(startDate, date);

        if (duration !== null && duration < minNights) {
          toast.error('Trip too short', {
            description: `Minimum ${minNights} ${minNights === 1 ? 'night' : 'nights'} required`,
          });
          return;
        }

        if (duration !== null && duration > maxNights) {
          toast.error('Trip too long', {
            description: `Maximum ${maxNights} nights allowed`,
          });
          return;
        }

        if (duration !== null) {
          toast.success('Dates selected!', {
            description: `${duration} ${duration === 1 ? 'day' : 'days'} trip`,
          });
        }
      }
      setSelectingStart(true);
    }
  };

  const handleClearDates = () => {
    onDateChange(null, null);
    setSelectingStart(true);
    toast.success('Dates cleared');
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
  };

  // ==================== CALCULATIONS ====================

  const getDuration = (start?: Date | null, end?: Date | null) => {
    const s = start || startDate;
    const e = end || endDate;
    if (!s || !e) return null;
    return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  };

  const duration = getDuration();

  // ==================== CALENDAR GENERATION ====================

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: DateInfo[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push(createDateInfo(date, true, today));
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push(createDateInfo(date, false, today));
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push(createDateInfo(date, true, today));
    }

    return days;
  }, [currentMonth, startDate, endDate, hoveredDate]);

  function createDateInfo(date: Date, isDisabled: boolean, today: Date): DateInfo {
    const dateTime = date.getTime();
    const todayTime = today.getTime();
    const startTime = startDate?.getTime() ?? 0;
    const endTime = endDate?.getTime() ?? 0;
    const hoverTime = hoveredDate?.getTime() ?? 0;

    const isBeforeToday = dateTime < todayTime;
    const isSelected =
      (startDate && dateTime === startTime) || (endDate && dateTime === endTime) || false;
    const isInRange =
      startDate && endDate
        ? dateTime >= startTime && dateTime <= endTime
        : startDate && hoveredDate && !selectingStart
        ? (dateTime >= startTime && dateTime <= hoverTime) ||
          (dateTime <= startTime && dateTime >= hoverTime)
        : false;

    return {
      date,
      isToday: dateTime === todayTime,
      isSelected,
      isInRange,
      isStartDate: startDate ? dateTime === startTime : false,
      isEndDate: endDate ? dateTime === endTime : false,
      isDisabled: isDisabled || isBeforeToday,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      isHoliday: false, // Could add holiday detection
      priceTrend: showPriceTrends ? getPriceTrend(date) : undefined,
    };
  }

  function getPriceTrend(date: Date): 'low' | 'medium' | 'high' {
    // Simple algorithm - weekends and holidays are high, weekdays are low
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const month = date.getMonth();
    const isHighSeason = month === 11 || month === 0 || month === 6 || month === 7; // Dec, Jan, Jul, Aug

    if (isWeekend || isHighSeason) return 'high';
    if (month === 9 || month === 10 || month === 2 || month === 3) return 'medium'; // Oct, Nov, Mar, Apr
    return 'low';
  }

  // ==================== RENDER ====================

  return (
    <div className="space-y-4">
      {/* Date Input Fields */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-2"
        >
          <label className="block text-sm font-semibold text-gray-900">Start Date</label>
          <div className="relative">
            <Calendar
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={16}
            />
            <input
              type="date"
              value={startDate ? startDate.toISOString().split('T')[0] : ''}
              onChange={e =>
                onDateChange(e.target.value ? new Date(e.target.value) : null, endDate)
              }
              min={new Date().toISOString().split('T')[0]}
              className="w-full pl-10 pr-3 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-2"
        >
          <label className="block text-sm font-semibold text-gray-900">End Date</label>
          <div className="relative">
            <Calendar
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={16}
            />
            <input
              type="date"
              value={endDate ? endDate.toISOString().split('T')[0] : ''}
              onChange={e =>
                onDateChange(startDate, e.target.value ? new Date(e.target.value) : null)
              }
              min={
                startDate
                  ? startDate.toISOString().split('T')[0]
                  : new Date().toISOString().split('T')[0]
              }
              className="w-full pl-10 pr-3 py-3 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
          </div>
        </motion.div>
      </div>

      {/* Duration Display */}
      <AnimatePresence>
        {duration && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Clock className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {duration} {duration === 1 ? 'day' : 'days'} trip
                  </p>
                  <p className="text-xs text-gray-600">
                    {startDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                    {endDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <Button onClick={handleClearDates} variant="ghost" size="sm">
                <X size={16} className="mr-1" />
                Clear
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Selections */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <p className="text-sm font-semibold text-gray-900 mb-2">Quick select</p>
        <div className="grid grid-cols-4 gap-2">
          {quickSelections.map((preset, idx) => (
            <motion.div
              key={preset.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + idx * 0.05 }}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(preset.days, preset.offset)}
                className="w-full text-xs h-9 hover:bg-purple-50 hover:border-purple-300 transition-all"
              >
                {preset.label}
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Calendar View */}
      {showCalendar && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border-2 border-gray-200 p-4"
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => handleMonthChange('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>

            <h3 className="text-lg font-bold text-gray-900">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>

            <button
              onClick={() => handleMonthChange('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((dayInfo, idx) => (
              <CalendarDay
                key={idx}
                dayInfo={dayInfo}
                onClick={() => !dayInfo.isDisabled && handleDateClick(dayInfo.date)}
                onHover={() => setHoveredDate(dayInfo.date)}
              />
            ))}
          </div>

          {/* Calendar Legend */}
          {showPriceTrends && (
            <div className="mt-4 pt-4 border-t flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <TrendingDown size={12} className="text-green-600" />
                <span className="text-gray-600">Lower prices</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp size={12} className="text-orange-600" />
                <span className="text-gray-600">Higher prices</span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Seasonal Information */}
      {seasonalInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4"
        >
          <button
            onClick={() => setShowSeasonalInfo(!showSeasonalInfo)}
            className="flex items-start gap-3 w-full text-left"
          >
            <div className={`w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 ${seasonalInfo.color}`}>
              <SeasonIcon size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-amber-900">Best Time to Visit</p>
                <Info size={14} className="text-amber-600" />
              </div>
              <AnimatePresence>
                {showSeasonalInfo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <Check size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-amber-900">
                          {seasonalInfo.bestMonths}
                        </p>
                        <p className="text-xs text-amber-700">{seasonalInfo.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-amber-900">Avoid:</p>
                        <p className="text-xs text-amber-700">{seasonalInfo.avoid}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </button>
        </motion.div>
      )}

      {/* Selection Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center"
      >
        <p className="text-xs text-gray-500">
          {!startDate && !endDate && 'Select your travel dates to continue'}
          {startDate && !endDate && '✓ Start date selected. Now choose your return date'}
          {startDate && endDate && '✓ Dates confirmed! Ready to plan your trip'}
        </p>
      </motion.div>
    </div>
  );
}

// ==================== CALENDAR DAY COMPONENT ====================

interface CalendarDayProps {
  dayInfo: DateInfo;
  onClick: () => void;
  onHover: () => void;
}

function CalendarDay({ dayInfo, onClick, onHover }: CalendarDayProps) {
  const { date, isToday, isSelected, isInRange, isStartDate, isEndDate, isDisabled, priceTrend } =
    dayInfo;

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.05 } : {}}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      onMouseEnter={onHover}
      disabled={isDisabled}
      className={`
        relative aspect-square rounded-lg text-sm font-medium transition-all
        ${isDisabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}
        ${isToday && !isSelected ? 'ring-2 ring-purple-400' : ''}
        ${isSelected ? 'bg-purple-600 text-white shadow-lg' : ''}
        ${isInRange && !isSelected ? 'bg-purple-100 text-purple-900' : ''}
        ${!isSelected && !isInRange && !isDisabled ? 'hover:bg-gray-100' : ''}
        ${isStartDate || isEndDate ? 'font-bold' : ''}
      `}
    >
      <span className="relative z-10">{date.getDate()}</span>

      {/* Price Trend Indicator */}
      {priceTrend && !isDisabled && !isSelected && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
          {priceTrend === 'low' && <TrendingDown size={10} className="text-green-600" />}
          {priceTrend === 'high' && <TrendingUp size={10} className="text-red-600" />}
          {priceTrend === 'medium' && (
            <div className="w-1 h-1 bg-yellow-600 rounded-full"></div>
          )}
        </div>
      )}

      {/* Today indicator */}
      {isToday && !isSelected && (
        <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
      )}
    </motion.button>
  );
}