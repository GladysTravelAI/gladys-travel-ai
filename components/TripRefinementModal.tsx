"use client";

import { useState } from "react";
import { X, DollarSign, Heart, Users, Sparkles, Calendar, MapPin, Loader2 } from "lucide-react";

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
    { value: 'budget', label: 'Budget', description: '$50-100/day', icon: '💰', color: 'green' },
    { value: 'mid-range', label: 'Mid-Range', description: '$100-250/day', icon: '💳', color: 'blue' },
    { value: 'luxury', label: 'Luxury', description: '$250+/day', icon: '💎', color: 'purple' },
  ];

  const styleOptions = [
    { value: 'luxury', label: 'Luxury', icon: '✨' },
    { value: 'adventure', label: 'Adventure', icon: '🏔️' },
    { value: 'romantic', label: 'Romantic', icon: '💕' },
    { value: 'family-friendly', label: 'Family-Friendly', icon: '👨‍👩‍👧‍👦' },
    { value: 'cultural', label: 'Cultural', icon: '🏛️' },
    { value: 'relaxation', label: 'Relaxation', icon: '🧘' },
    { value: 'foodie', label: 'Food & Culinary', icon: '🍽️' },
    { value: 'nightlife', label: 'Nightlife', icon: '🌃' },
  ];

  const groupOptions = [
    { value: 'solo', label: 'Solo', icon: '🎒', size: 1 },
    { value: 'couple', label: 'Couple', icon: '💑', size: 2 },
    { value: 'family', label: 'Family', icon: '👨‍👩‍👧', size: 4 },
    { value: 'group', label: 'Group', icon: '👥', size: 6 },
  ];

  const dayOptions = [3, 5, 7, 10, 14];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <MapPin className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Refine Your Trip</h2>
                <p className="text-white/80 text-sm mt-0.5">To {destination}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
            >
              <X className="text-white" size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          
          {/* Trip Duration */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="text-orange-500" size={20} />
              <h3 className="text-lg font-bold text-gray-800">Trip Duration</h3>
            </div>
            <div className="flex gap-2 flex-wrap">
              {dayOptions.map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    days === d
                      ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {d} Days
                </button>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={days}
                  onChange={(e) => setDays(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-20 px-3 py-3 rounded-xl border-2 border-gray-200 text-center font-semibold focus:border-orange-500 focus:outline-none"
                />
                <span className="text-gray-500 text-sm">custom</span>
              </div>
            </div>
          </div>

          {/* Budget Selection */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="text-green-600" size={20} />
              <h3 className="text-lg font-bold text-gray-800">Budget Level</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {budgetOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setBudget(option.value as any)}
                  className={`p-4 rounded-2xl border-2 transition-all text-center ${
                    budget === option.value
                      ? 'border-green-500 bg-green-50 shadow-lg scale-[1.02]'
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                  }`}
                >
                  <div className="text-3xl mb-2">{option.icon}</div>
                  <div className="font-bold text-gray-800">{option.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Travel Style */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="text-pink-500" size={20} />
              <h3 className="text-lg font-bold text-gray-800">Travel Style</h3>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {styleOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTripType(option.value)}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    tripType === option.value
                      ? 'border-pink-500 bg-pink-50 shadow-md scale-[1.02]'
                      : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/50'
                  }`}
                >
                  <div className="text-2xl mb-1">{option.icon}</div>
                  <div className="text-xs font-semibold text-gray-800">{option.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Group Size */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="text-purple-600" size={20} />
              <h3 className="text-lg font-bold text-gray-800">Who's Traveling?</h3>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {groupOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setGroupType(option.value as any)}
                  className={`p-4 rounded-2xl border-2 transition-all text-center ${
                    groupType === option.value
                      ? 'border-purple-500 bg-purple-50 shadow-lg scale-[1.02]'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                  }`}
                >
                  <div className="text-3xl mb-2">{option.icon}</div>
                  <div className="text-sm font-semibold text-gray-800">{option.label}</div>
                  <div className="text-xs text-gray-400">{option.size} {option.size === 1 ? 'person' : 'people'}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Origin (Optional) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="text-blue-600" size={20} />
              <h3 className="text-lg font-bold text-gray-800">Departing From <span className="text-gray-400 font-normal">(optional)</span></h3>
            </div>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g., New York, London, Tokyo..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
            />
            <p className="text-xs text-gray-400 mt-2">Add your origin to get flight suggestions</p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-4 pb-6 px-6 border-t border-gray-100">
          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">{days} days</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium capitalize">{budget}</span>
              <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full font-medium capitalize">{tripType || 'Balanced'}</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium capitalize">{groupType}</span>
              {origin && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">From: {origin}</span>}
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate My Trip
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}