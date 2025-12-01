import { useState } from "react";
import { Calendar, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateChange: (start: Date | null, end: Date | null) => void;
  destination?: string;
}

export default function DateRangePicker({ 
  startDate, 
  endDate, 
  onDateChange,
  destination 
}: DateRangePickerProps) {
  const [showSeasonalTip, setShowSeasonalTip] = useState(false);

  const getSeasonalTip = (dest: string) => {
    const tips: { [key: string]: string } = {
      'dubai': 'Best: November–March (cooler weather)',
      'paris': 'Best: April–June or September–October',
      'tokyo': 'Best: March–May or September–November',
      'new york': 'Best: April–June or September–November',
      'cape town': 'Best: November–March (summer)',
      'barcelona': 'Best: May–June or September–October',
      'thohoyandou': 'Best: April–September (dry season)',
      'varanasi': 'Best: October–March (cooler weather)',
      'jerusalem': 'Best: April–May or September–November',
    };
    
    const normalizedDest = dest.toLowerCase();
    for (const [key, tip] of Object.entries(tips)) {
      if (normalizedDest.includes(key)) return tip;
    }
    return null;
  };

  const seasonalTip = destination ? getSeasonalTip(destination) : null;

  const quickSelections = [
    { label: 'Weekend', days: 2, offset: getDaysUntilWeekend() },
    { label: '1 Week', days: 7, offset: 7 },
    { label: '2 Weeks', days: 14, offset: 14 },
    { label: '1 Month', days: 30, offset: 30 },
  ];

  function getDaysUntilWeekend() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    return dayOfWeek === 6 ? 0 : dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
  }

  const handleQuickSelect = (days: number, offset: number) => {
    const start = new Date();
    start.setDate(start.getDate() + offset);
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    onDateChange(start, end);
  };

  const getDuration = () => {
    if (!startDate || !endDate) return null;
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="space-y-3">
      {/* Date Input Fields */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Start Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            <input
              type="date"
              value={startDate ? startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => onDateChange(e.target.value ? new Date(e.target.value) : null, endDate)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            End Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            <input
              type="date"
              value={endDate ? endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => onDateChange(startDate, e.target.value ? new Date(e.target.value) : null)}
              min={startDate ? startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Duration Display */}
      {getDuration() && (
        <div className="text-center py-2 bg-blue-50 rounded-lg">
          <span className="text-xs font-semibold text-blue-700">
            {getDuration()} {getDuration() === 1 ? 'day' : 'days'} trip
          </span>
        </div>
      )}

      {/* Quick Selections */}
      <div className="grid grid-cols-4 gap-2">
        {quickSelections.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={() => handleQuickSelect(preset.days, preset.offset)}
            className="text-xs h-8 hover:bg-blue-50 hover:border-blue-300"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Seasonal Tip */}
      {seasonalTip && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <button
            onClick={() => setShowSeasonalTip(!showSeasonalTip)}
            className="flex items-start gap-2 w-full text-left"
          >
            <Info className="text-amber-600 flex-shrink-0 mt-0.5" size={14} />
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-800">Best Time to Visit</p>
              {showSeasonalTip && (
                <p className="text-xs text-amber-700 mt-1">{seasonalTip}</p>
              )}
            </div>
          </button>
        </div>
      )}
    </div>
  );
}