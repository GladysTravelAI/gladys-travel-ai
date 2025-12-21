import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, Send, X } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripData: {
    destination: string;
    startDate: string;
    endDate: string;
    tripId: string;
  };
  onSubmit: (feedback: any) => void;
}

export default function FeedbackModal({ isOpen, onClose, tripData, onSubmit }: FeedbackModalProps) {
  const [ratings, setRatings] = useState({
    overall: 0,
    itinerary: 0,
    hotels: 0,
    restaurants: 0,
    activities: 0,
    valueForMoney: 0
  });

  const [highlights, setHighlights] = useState('');
  const [disappointments, setDisappointments] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [usedRecommendations, setUsedRecommendations] = useState({
    hotels: [] as string[],
    restaurants: [] as string[],
    activities: [] as string[]
  });

  if (!isOpen) return null;

  const categories = [
    { key: 'overall', label: 'Overall Experience', icon: '🌟' },
    { key: 'itinerary', label: 'Itinerary Quality', icon: '📋' },
    { key: 'hotels', label: 'Hotel Satisfaction', icon: '🏨' },
    { key: 'restaurants', label: 'Restaurant Quality', icon: '🍽️' },
    { key: 'activities', label: 'Activities Enjoyment', icon: '🎭' },
    { key: 'valueForMoney', label: 'Value for Money', icon: '💰' }
  ];

  const handleSubmit = () => {
    const feedback = {
      tripId: tripData.tripId,
      destination: tripData.destination,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      
      overallRating: ratings.overall,
      wouldRecommend: wouldRecommend || false,
      
      itineraryAccuracy: ratings.itinerary,
      hotelSatisfaction: ratings.hotels,
      restaurantQuality: ratings.restaurants,
      activitiesEnjoyment: ratings.activities,
      valueForMoney: ratings.valueForMoney,
      
      highlights: highlights.split('\n').filter(h => h.trim()),
      disappointments: disappointments.split('\n').filter(d => d.trim()),
      suggestions: suggestions,
      
      usedRecommendations,
      timestamp: new Date().toISOString()
    };

    onSubmit(feedback);
    onClose();
  };

  const isValid = ratings.overall > 0 && wouldRecommend !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                How was your trip?
              </h2>
              <p className="text-white/80 text-sm">
                {tripData.destination} • {new Date(tripData.startDate).toLocaleDateString()}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="text-white" size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Would Recommend */}
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 mb-4">
              Would you recommend this trip to others?
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setWouldRecommend(true)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  wouldRecommend === true
                    ? 'bg-green-500 text-white scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ThumbsUp size={20} />
                Yes!
              </button>
              <button
                onClick={() => setWouldRecommend(false)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  wouldRecommend === false
                    ? 'bg-red-500 text-white scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ThumbsDown size={20} />
                Not Really
              </button>
            </div>
          </div>

          {/* Rating Categories */}
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.key} className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {category.icon} {category.label}
                  </span>
                  <span className="text-xs text-gray-500">
                    {ratings[category.key as keyof typeof ratings]}/5
                  </span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRatings({ ...ratings, [category.key]: star })}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        size={28}
                        className={`${
                          star <= ratings[category.key as keyof typeof ratings]
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Text Feedback */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                ✨ What were the highlights?
              </label>
              <textarea
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                placeholder="What did you love? (one per line)"
                className="w-full h-24 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                😕 Any disappointments?
              </label>
              <textarea
                value={disappointments}
                onChange={(e) => setDisappointments(e.target.value)}
                placeholder="What didn't work out? (optional)"
                className="w-full h-24 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                💡 Any suggestions for us?
              </label>
              <textarea
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
                placeholder="How can we improve? (optional)"
                className="w-full h-24 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none resize-none"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${
              isValid
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            <Send size={20} />
            Submit Feedback
          </button>

          <p className="text-xs text-center text-gray-500">
            Your feedback helps us improve Gladys for everyone! 🙏
          </p>
        </div>
      </div>
    </div>
  );
}