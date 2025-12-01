"use client";

import { useState } from "react";
import { X, Calendar, MapPin, Loader2 } from "lucide-react";

interface TripRefinementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (preferences: TripPreferences) => void;
  destination: string;
  isLoading?: boolean;
}

export interface TripPreferences {
  budget: 'budget' | 'mid-range' | 'luxury';
  tripType: string;
  groupType: 'solo' | 'couple' | 'family' | 'group';
  groupSize: number;
  days: number;
  origin?: string;
}

export default function TripRefinementModal({ 
  isOpen, 
  onClose, 
  onGenerate,
  destination,
  isLoading = false
}: TripRefinementModalProps) {
  const [budget, setBudget] = useState<'budget' | 'mid-range' | 'luxury'>('mid-range');
  const [tripType, setTripType] = useState('balanced');
  const [groupType, setGroupType] = useState<'solo' | 'couple' | 'family' | 'group'>('couple');
  const [days, setDays] = useState(5);
  const [origin, setOrigin] = useState('');

  if (!isOpen) return null;

  const budgetOptions = [
    { value: 'budget', label: 'Budget', description: '$50-100/day', icon: '💰' },
    { value: 'mid-range', label: 'Mid-Range', description: '$100-250/day', icon: '💳' },
    { value: 'luxury', label: 'Luxury', description: '$250+/day', icon: '💎' },
  ];

  const styleOptions = [
    { value: 'adventure', label: 'Adventure', icon: '🏔️' },
    { value: 'romantic', label: 'Romantic', icon: '💕' },
    { value: 'family-friendly', label: 'Family', icon: '👨‍👩‍👧‍👦' },
    { value: 'cultural', label: 'Cultural', icon: '🏛️' },
    { value: 'relaxation', label: 'Relaxation', icon: '🧘' },
    { value: 'foodie', label: 'Foodie', icon: '🍽️' },
  ];

  const groupOptions = [
    { value: 'solo', label: 'Solo', icon: '🎒', size: 1 },
    { value: 'couple', label: 'Couple', icon: '💑', size: 2 },
    { value: 'family', label: 'Family', icon: '👨‍👩‍👧', size: 4 },
    { value: 'group', label: 'Group', icon: '👥', size: 6 },
  ];

  const dayOptions = [3, 5, 7, 10];

  const handleGenerate = () => {
    const selectedGroup = groupOptions.find(g => g.value === groupType);
    onGenerate({ 
      budget, 
      tripType, 
      groupType,
      groupSize: selectedGroup?.size || 2,
      days,
      origin: origin || undefined
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-5 sm:rounded-t-3xl rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <MapPin className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Refine Your Trip</h2>
                <p className="text-white/80 text-sm">To {destination}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="text-white" size={22} />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto max-h-[calc(95vh-200px)] sm:max-h-[calc(90vh-200px)] p-5 space-y-6">
          
          {/* Trip Duration */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="text-blue-600" size={18} />
              <h3 className="text-base font-semibold text-gray-900">Trip Duration</h3>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {dayOptions.map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    days === d
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {/* Budget Selection */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">Budget Level</h3>
            <div className="grid grid-cols-3 gap-2">
              {budgetOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setBudget(option.value as any)}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    budget === option.value
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{option.icon}</div>
                  <div className="text-xs font-semibold text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Travel Style */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">Travel Style</h3>
            <div className="grid grid-cols-3 gap-2">
              {styleOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTripType(option.value)}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    tripType === option.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-xl mb-1">{option.icon}</div>
                  <div className="text-xs font-semibold text-gray-900">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Group Size */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">Who's Traveling?</h3>
            <div className="grid grid-cols-4 gap-2">
              {groupOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setGroupType(option.value as any)}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    groupType === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="text-xl mb-1">{option.icon}</div>
                  <div className="text-xs font-semibold text-gray-900">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Origin (Optional) */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Departing From <span className="text-gray-400 font-normal text-sm">(optional)</span>
            </h3>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g., New York, London..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Generating...</span>
                </>
              ) : (
                <span>Generate Trip</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}