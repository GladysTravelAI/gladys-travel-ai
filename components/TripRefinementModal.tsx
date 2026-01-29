import { useState, useEffect } from "react";
import { X, ArrowRight, Loader2 } from "lucide-react";

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
  const [step, setStep] = useState(1);
  const [budget, setBudget] = useState<string>('Mid-range');
  const [tripType, setTripType] = useState('balanced');
  const [groupType, setGroupType] = useState<'solo' | 'couple' | 'family' | 'group'>('solo');
  const [days, setDays] = useState(5);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const budgetOptions = [
    { value: 'Budget', label: 'Budget', desc: '$50-100/day' },
    { value: 'Mid-range', label: 'Moderate', desc: '$100-250/day' },
    { value: 'Luxury', label: 'Luxury', desc: '$250+/day' },
  ];

  const styleOptions = [
    { value: 'adventure', label: 'Adventure' },
    { value: 'romantic', label: 'Romantic' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'relaxation', label: 'Relaxation' },
  ];

  const groupOptions = [
    { value: 'solo', label: 'Solo', size: 1 },
    { value: 'couple', label: 'Couple', size: 2 },
    { value: 'family', label: 'Family', size: 4 },
    { value: 'group', label: 'Group', size: 6 },
  ];

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      handleGenerate();
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
      origin
    };
    onGenerate(prefs);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-200">
          <button 
            onClick={onClose} 
            disabled={isLoading}
            className="absolute top-6 right-6 w-10 h-10 hover:bg-gray-100 rounded-full flex items-center justify-center transition-all"
          >
            <X size={20} />
          </button>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Plan your trip
            </h2>
            <p className="text-gray-600">To {destination}</p>
          </div>

          {/* Progress */}
          <div className="flex gap-2 mt-6">
            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          
          {/* Step 1: Budget & Style */}
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Budget</h3>
                <div className="space-y-3">
                  {budgetOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setBudget(option.value)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        budget === option.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-600">{option.desc}</div>
                        </div>
                        {budget === option.value && (
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Trip style</h3>
                <div className="grid grid-cols-2 gap-3">
                  {styleOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTripType(option.value)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        tripType === option.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Group & Duration */}
          {step === 2 && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Traveling with</h3>
                <div className="grid grid-cols-2 gap-3">
                  {groupOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setGroupType(option.value as any)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        groupType === option.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Duration</h3>
                <div className="flex gap-3">
                  {[3, 5, 7, 10, 14].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDays(d)}
                      className={`flex-1 py-4 rounded-xl font-bold transition-all ${
                        days === d
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-2xl">{d}</div>
                      <div className="text-xs mt-1">days</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">From</h3>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Your city (optional)"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                disabled={isLoading}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={isLoading}
              className={`py-3 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center justify-center gap-2 ${
                step === 1 ? 'w-full' : 'flex-1'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Creating...
                </>
              ) : step === 2 ? (
                'Generate Trip'
              ) : (
                <>
                  Continue
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}