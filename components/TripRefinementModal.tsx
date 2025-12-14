"use client";

import { useState } from "react";
import { X, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TripRefinementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (preferences: TripPreferences) => void;
  destination: string;
  isLoading?: boolean;
}

export interface TripPreferences {
  budget: string;
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
  const [budget, setBudget] = useState<string>('Mid-range');
  const [tripType, setTripType] = useState('balanced');
  const [groupType, setGroupType] = useState<'solo' | 'couple' | 'family' | 'group'>('solo');
  const [days, setDays] = useState(5);
  const [origin, setOrigin] = useState('Johannesburg, South Africa');

  if (!isOpen) return null;

  const budgetOptions = [
    { value: 'Budget', label: 'Budget', description: '$50-100/day', icon: '💰' },
    { value: 'Mid-range', label: 'Mid-Range', description: '$100-250/day', icon: '💳' },
    { value: 'Luxury', label: 'Luxury', description: '$250+/day', icon: '💎' },
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
    { value: 'solo', label: 'Solo', icon: '🚶', size: 1 },
    { value: 'couple', label: 'Couple', icon: '💑', size: 2 },
    { value: 'family', label: 'Family', icon: '👨‍👩‍👧', size: 4 },
    { value: 'group', label: 'Group', icon: '👥', size: 6 },
  ];

  const dayOptions = [3, 5, 7, 10, 14];

  const handleGenerate = () => {
    const selectedGroup = groupOptions.find(g => g.value === groupType);
    const prefs: TripPreferences = {
      budget,
      tripType,
      groupType,
      groupSize: selectedGroup?.size || 1,
      days,
      origin: origin || undefined
    };
    console.log('🚀 Generating trip with preferences:', prefs);
    onGenerate(prefs);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <MapPin className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">Refine Your Trip</h2>
                <p className="text-white/90">To {destination}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="text-white" size={24} />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 space-y-8">

          {/* Budget Level */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Level</h3>
            <div className="grid grid-cols-3 gap-3">
              {budgetOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    console.log('Budget selected:', option.value);
                    setBudget(option.value);
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all text-center ${
                    budget === option.value
                      ? 'border-green-500 bg-green-50 scale-105 shadow-lg'
                      : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-3xl mb-2">{option.icon}</div>
                  <div className="text-sm font-semibold text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Travel Style */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Travel Style</h3>
            <div className="grid grid-cols-3 gap-3">
              {styleOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    console.log('Trip type selected:', option.value);
                    setTripType(option.value);
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all text-center ${
                    tripType === option.value
                      ? 'border-purple-500 bg-purple-50 scale-105 shadow-lg'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-2xl mb-2">{option.icon}</div>
                  <div className="text-sm font-semibold text-gray-900">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Who's Traveling */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Who's Traveling?</h3>
            <div className="grid grid-cols-4 gap-3">
              {groupOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    console.log('Group type selected:', option.value);
                    setGroupType(option.value as any);
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all text-center ${
                    groupType === option.value
                      ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-2xl mb-2">{option.icon}</div>
                  <div className="text-xs font-semibold text-gray-900">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Trip Duration */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Duration</h3>
            <div className="grid grid-cols-5 gap-3">
              {dayOptions.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    console.log('Days selected:', d);
                    setDays(d);
                  }}
                  className={`px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    days === d
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {d} days
                </button>
              ))}
            </div>
          </div>

          {/* Origin */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Departing From</h3>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Your city"
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              disabled={isLoading}
              variant="outline"
              className="flex-1 py-6 rounded-2xl text-base font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="flex-1 py-6 rounded-2xl text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  Generating...
                </span>
              ) : (
                'Generate Trip'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}