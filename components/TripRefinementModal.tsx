import { useState, useEffect } from "react";
import { X, MapPin, Loader2, Sparkles, ArrowRight } from "lucide-react";
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

export default function OpulentTripRefinementModal({
  isOpen,
  onClose,
  onGenerate,
  destination,
  isLoading = false
}: TripRefinementModalProps) {
  const [step, setStep] = useState(1);
  const [budget, setBudget] = useState<string>('Mid-range');
  const [tripType, setTripType] = useState('balanced');
  const [groupType, setGroupType] = useState<'solo' | 'couple' | 'family' | 'group'>('solo');
  const [days, setDays] = useState(5);
  const [origin, setOrigin] = useState('Johannesburg, South Africa');

  useEffect(() => {
    if (isOpen) setStep(1);
  }, [isOpen]);

  if (!isOpen) return null;

  const budgetOptions = [
    { value: 'Budget', label: 'Budget Explorer', price: '$50-100/day', icon: '🎒', gradient: 'from-green-400 to-emerald-500' },
    { value: 'Mid-range', label: 'Comfort Traveler', price: '$100-250/day', icon: '✈️', gradient: 'from-blue-400 to-cyan-500' },
    { value: 'Luxury', label: 'Premium Experience', price: '$250+/day', icon: '👑', gradient: 'from-purple-400 to-pink-500' },
  ];

  const styleOptions = [
    { value: 'adventure', label: 'Adventure', icon: '🏔️' },
    { value: 'romantic', label: 'Romantic', icon: '💕' },
    { value: 'cultural', label: 'Cultural', icon: '🏛️' },
    { value: 'relaxation', label: 'Relaxation', icon: '🧘' },
  ];

  const groupOptions = [
    { value: 'solo', label: 'Solo', icon: '🚶', size: 1, desc: 'Just me' },
    { value: 'couple', label: 'Couple', icon: '💑', size: 2, desc: 'Romantic getaway' },
    { value: 'family', label: 'Family', icon: '👨‍👩‍👧', size: 4, desc: 'With kids' },
    { value: 'group', label: 'Group', icon: '👥', size: 6, desc: 'Friends trip' },
  ];

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else handleGenerate();
  };

  const handleGenerate = () => {
    const selectedGroup = groupOptions.find(g => g.value === groupType);
    const prefs: TripPreferences = {
      budget,
      tripType,
      groupType,
      groupSize: selectedGroup?.size || 1,
      days,
      origin
    };
    onGenerate(prefs);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md" 
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Animated Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient"></div>
          <div className="relative p-8">
            <button 
              onClick={onClose} 
              disabled={isLoading}
              className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
            >
              <X className="text-white" size={20} />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Sparkles className="text-white" size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">
                  Plan Your Perfect Trip
                </h2>
                <p className="text-white/90 text-lg">To {destination}</p>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="flex gap-2">
              {[1, 2, 3].map(s => (
                <div 
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    s <= step ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          
          {/* Step 1: Budget */}
          {step === 1 && (
            <div className="space-y-6 animate-slide-in">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Choose Your Travel Style
                </h3>
                <p className="text-gray-600">Select the budget that suits you best</p>
              </div>

              <div className="space-y-4">
                {budgetOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setBudget(option.value)}
                    className={`w-full p-6 rounded-2xl border-2 transition-all text-left relative overflow-hidden group ${
                      budget === option.value
                        ? 'border-transparent shadow-xl scale-105'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
                    }`}
                  >
                    {/* Gradient Background when selected */}
                    {budget === option.value && (
                      <div className={`absolute inset-0 bg-gradient-to-r ${option.gradient} opacity-10`}></div>
                    )}

                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${option.gradient} flex items-center justify-center text-3xl`}>
                          {option.icon}
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-900 mb-1">
                            {option.label}
                          </h4>
                          <p className="text-gray-600 text-sm">{option.price}</p>
                        </div>
                      </div>

                      {budget === option.value && (
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg">✓</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Style & Group */}
          {step === 2 && (
            <div className="space-y-8 animate-slide-in">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Personalize Your Experience
                </h3>
                <p className="text-gray-600">What kind of trip are you planning?</p>
              </div>

              {/* Travel Style */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block">
                  Travel Style
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {styleOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTripType(option.value)}
                      className={`p-5 rounded-2xl border-2 transition-all ${
                        tripType === option.value
                          ? 'border-purple-500 bg-purple-50 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-4xl mb-2">{option.icon}</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {option.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Group Type */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block">
                  Who's Traveling?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {groupOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setGroupType(option.value as any)}
                      className={`p-5 rounded-2xl border-2 transition-all text-left ${
                        groupType === option.value
                          ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-3xl mb-2">{option.icon}</div>
                      <div className="text-sm font-bold text-gray-900">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {option.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Duration & Origin */}
          {step === 3 && (
            <div className="space-y-6 animate-slide-in">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Final Details
                </h3>
                <p className="text-gray-600">How long will you be traveling?</p>
              </div>

              {/* Duration Selector */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block">
                  Trip Duration
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {[3, 5, 7, 10, 14].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDays(d)}
                      className={`py-4 rounded-2xl font-bold transition-all ${
                        days === d
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-110'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-2xl">{d}</div>
                      <div className="text-xs mt-1">days</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Origin */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block">
                  Departing From
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Your city"
                  className="w-full px-6 py-4 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-lg"
                />
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                <h4 className="font-bold text-gray-900 mb-3">Your Trip Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Budget:</span>
                    <span className="font-semibold">{budget}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Style:</span>
                    <span className="font-semibold capitalize">{tripType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Group:</span>
                    <span className="font-semibold capitalize">{groupType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-semibold">{days} days</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button
                onClick={() => setStep(step - 1)}
                disabled={isLoading}
                variant="outline"
                className="flex-1 py-6 rounded-2xl text-lg font-semibold"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={isLoading}
              className={`py-6 rounded-2xl text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg ${
                step === 1 ? 'w-full' : 'flex-1'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  Creating Magic...
                </span>
              ) : step === 3 ? (
                <span className="flex items-center gap-2">
                  <Sparkles size={20} />
                  Generate My Trip
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Continue
                  <ArrowRight size={20} />
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-slide-in {
          animation: slide-in 0.4s ease-out;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}