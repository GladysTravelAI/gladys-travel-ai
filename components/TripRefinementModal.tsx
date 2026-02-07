'use client';

import { useState, useEffect } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Loader2,
  DollarSign,
  Users,
  Calendar,
  MapPin,
  Sparkles,
  Heart,
  Mountain,
  Palmtree,
  Building2,
  Ticket,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ==================== TYPES ====================

interface TripRefinementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (preferences: TripPreferences) => void;
  destination: string;
  isLoading?: boolean;
  eventContext?: {
    name: string;
    date: string;
    type: 'concert' | 'sports' | 'festival' | 'theater' | 'other';
  };
}

export interface TripPreferences {
  budget: 'Budget' | 'Mid-range' | 'Luxury' | 'Ultra-Luxury';
  tripType: string;
  groupType: 'solo' | 'couple' | 'family' | 'group';
  groupSize: number;
  days: number;
  origin?: string;
  startDate?: string;
  endDate?: string;
  interests: string[];
}

// ==================== MAIN COMPONENT ====================

export default function TripRefinementModal({
  isOpen,
  onClose,
  onGenerate,
  destination,
  isLoading = false,
  eventContext,
}: TripRefinementModalProps) {
  const [step, setStep] = useState(1);
  const [budget, setBudget] = useState<TripPreferences['budget']>('Mid-range');
  const [tripType, setTripType] = useState('balanced');
  const [groupType, setGroupType] = useState<TripPreferences['groupType']>('solo');
  const [days, setDays] = useState(5);
  const [origin, setOrigin] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      
      // Pre-fill interests based on event context
      if (eventContext) {
        const eventInterests = getEventInterests(eventContext.type);
        setInterests(eventInterests);
      }
    }
  }, [isOpen, eventContext]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  // ==================== OPTIONS ====================

  const budgetOptions = [
    {
      value: 'Budget' as const,
      label: 'Budget',
      desc: '$50-100/day',
      icon: '💰',
      color: 'from-green-500 to-emerald-600',
    },
    {
      value: 'Mid-range' as const,
      label: 'Moderate',
      desc: '$100-250/day',
      icon: '💳',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      value: 'Luxury' as const,
      label: 'Luxury',
      desc: '$250-500/day',
      icon: '💎',
      color: 'from-purple-500 to-pink-600',
    },
    {
      value: 'Ultra-Luxury' as const,
      label: 'Ultra-Luxury',
      desc: '$500+/day',
      icon: '👑',
      color: 'from-amber-500 to-orange-600',
    },
  ];

  const styleOptions = [
    { value: 'adventure', label: 'Adventure', icon: Mountain, color: 'text-green-600' },
    { value: 'romantic', label: 'Romantic', icon: Heart, color: 'text-pink-600' },
    { value: 'cultural', label: 'Cultural', icon: Building2, color: 'text-purple-600' },
    { value: 'relaxation', label: 'Relaxation', icon: Palmtree, color: 'text-blue-600' },
  ];

  const groupOptions = [
    { value: 'solo' as const, label: 'Solo', size: 1, emoji: '🧳' },
    { value: 'couple' as const, label: 'Couple', size: 2, emoji: '💑' },
    { value: 'family' as const, label: 'Family', size: 4, emoji: '👨‍👩‍👧‍👦' },
    { value: 'group' as const, label: 'Group', size: 6, emoji: '👥' },
  ];

  const interestOptions = [
    'Museums',
    'Nightlife',
    'Shopping',
    'Food Tours',
    'Nature',
    'Photography',
    'Sports',
    'History',
    'Beach',
    'Adventure',
    'Wellness',
    'Local Culture',
  ];

  // ==================== HANDLERS ====================

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleGenerate();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleGenerate = () => {
    const selectedGroup = groupOptions.find(g => g.value === groupType);

    const prefs: TripPreferences = {
      budget,
      tripType,
      groupType,
      groupSize: selectedGroup?.size || 1,
      days,
      origin: origin || undefined,
      interests,
    };

    console.log('🚀 Generating trip with preferences:', prefs);
    onGenerate(prefs);
  };

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  // ==================== RENDER ====================

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={!isLoading ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 p-8 text-white overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0 opacity-10">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle, white 1px, transparent 1px)',
                    backgroundSize: '30px 30px',
                  }}
                ></div>
              </div>

              <div className="relative z-10">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="absolute top-0 right-0 w-10 h-10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all disabled:opacity-50"
                >
                  <X size={20} />
                </button>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles size={32} />
                    <h2 className="text-3xl font-bold">Plan Your Trip</h2>
                  </div>
                  <p className="text-white/90 text-lg flex items-center gap-2">
                    <MapPin size={18} />
                    To {destination}
                  </p>
                  {eventContext && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-3 flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-xl px-4 py-2 inline-block"
                    >
                      <Ticket size={16} />
                      <span className="text-sm">
                        {eventContext.name} • {eventContext.date}
                      </span>
                    </motion.div>
                  )}
                </motion.div>

                {/* Progress */}
                <div className="flex gap-2 mt-6">
                  {[1, 2, 3].map(s => (
                    <motion.div
                      key={s}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: step >= s ? 1 : 0.3 }}
                      transition={{ duration: 0.3 }}
                      className={`h-1 flex-1 rounded-full origin-left ${
                        step >= s ? 'bg-white' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <AnimatePresence mode="wait">
                {/* Step 1: Budget & Style */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <DollarSign size={24} className="text-green-600" />
                        Budget Per Day
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {budgetOptions.map((option, idx) => (
                          <motion.button
                            key={option.value}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => setBudget(option.value)}
                            className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden ${
                              budget === option.value
                                ? 'border-purple-600 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {budget === option.value && (
                              <motion.div
                                layoutId="budget-selected"
                                className="absolute inset-0 bg-purple-50"
                                transition={{ type: 'spring', duration: 0.5 }}
                              />
                            )}
                            <div className="relative flex justify-between items-start">
                              <div>
                                <div className="text-2xl mb-1">{option.icon}</div>
                                <div className="font-bold text-gray-900">
                                  {option.label}
                                </div>
                                <div className="text-sm text-gray-600">{option.desc}</div>
                              </div>
                              {budget === option.value && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center"
                                >
                                  <Check size={14} className="text-white" />
                                </motion.div>
                              )}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Sparkles size={24} className="text-purple-600" />
                        Trip Style
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {styleOptions.map((option, idx) => {
                          const Icon = option.icon;
                          return (
                            <motion.button
                              key={option.value}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              onClick={() => setTripType(option.value)}
                              className={`p-4 rounded-xl border-2 transition-all ${
                                tripType === option.value
                                  ? 'border-purple-600 bg-purple-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <Icon size={32} className={`mx-auto mb-2 ${option.color}`} />
                              <div className="font-semibold text-gray-900">
                                {option.label}
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Group & Duration */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Users size={24} className="text-blue-600" />
                        Traveling With
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {groupOptions.map((option, idx) => (
                          <motion.button
                            key={option.value}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => setGroupType(option.value)}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              groupType === option.value
                                ? 'border-purple-600 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="text-3xl mb-2">{option.emoji}</div>
                            <div className="font-semibold text-gray-900">
                              {option.label}
                            </div>
                            <div className="text-sm text-gray-500">{option.size} travelers</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar size={24} className="text-orange-600" />
                        Duration
                      </h3>
                      <div className="flex gap-3">
                        {[3, 5, 7, 10, 14].map((d, idx) => (
                          <motion.button
                            key={d}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => setDays(d)}
                            className={`flex-1 py-4 rounded-xl font-bold transition-all ${
                              days === d
                                ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <div className="text-2xl">{d}</div>
                            <div className="text-xs mt-1 opacity-90">days</div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin size={24} className="text-red-600" />
                        Departing From
                      </h3>
                      <input
                        type="text"
                        value={origin}
                        onChange={e => setOrigin(e.target.value)}
                        placeholder="Your city (optional)"
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-600 focus:outline-none transition-colors"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Interests */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <Heart size={24} className="text-pink-600" />
                        Your Interests
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Select activities you'd like to experience
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {interestOptions.map((interest, idx) => (
                          <motion.button
                            key={interest}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.03 }}
                            onClick={() => toggleInterest(interest)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                              interests.includes(interest)
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {interest}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Summary */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200"
                    >
                      <h4 className="font-bold text-gray-900 mb-4">Trip Summary</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Budget:</span>
                          <span className="ml-2 font-semibold">{budget}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Style:</span>
                          <span className="ml-2 font-semibold capitalize">{tripType}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Group:</span>
                          <span className="ml-2 font-semibold capitalize">{groupType}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Duration:</span>
                          <span className="ml-2 font-semibold">{days} days</span>
                        </div>
                        {origin && (
                          <div className="col-span-2">
                            <span className="text-gray-600">From:</span>
                            <span className="ml-2 font-semibold">{origin}</span>
                          </div>
                        )}
                        {interests.length > 0 && (
                          <div className="col-span-2">
                            <span className="text-gray-600">Interests:</span>
                            <span className="ml-2 font-semibold">
                              {interests.slice(0, 3).join(', ')}
                              {interests.length > 3 && ` +${interests.length - 3} more`}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 mt-8"
              >
                {step > 1 && (
                  <button
                    onClick={handleBack}
                    disabled={isLoading}
                    className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={20} />
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={isLoading}
                  className={`py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 ${
                    step === 1 ? 'w-full' : 'flex-1'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Creating Your Perfect Trip...
                    </>
                  ) : step === 3 ? (
                    <>
                      <Sparkles size={20} />
                      Generate Trip Plan
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ==================== HELPER FUNCTIONS ====================

function getEventInterests(eventType: string): string[] {
  const interestMap: Record<string, string[]> = {
    concert: ['Nightlife', 'Music', 'Local Culture', 'Photography'],
    sports: ['Sports', 'Nightlife', 'Food Tours', 'Local Culture'],
    festival: ['Local Culture', 'Food Tours', 'Nightlife', 'Photography'],
    theater: ['Culture', 'Museums', 'History', 'Shopping'],
    other: ['Local Culture', 'Food Tours', 'Photography'],
  };

  return interestMap[eventType] || [];
}