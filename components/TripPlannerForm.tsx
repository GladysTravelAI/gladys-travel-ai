'use client';

import React, { useState } from 'react';
import { Mic } from 'lucide-react';

export type Itinerary = {
  destination: string;
  startDate: string;
  endDate: string;
  interests: string[];
  plan: {
    day: number;
    activity: string;
  }[];
};

type TripPlannerFormProps = {
  onPlan: (newPlan: Itinerary) => void;
};

const TripPlannerForm: React.FC<TripPlannerFormProps> = ({ onPlan }) => {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('2025-08-01');
  const [endDate, setEndDate] = useState('2025-08-05');
  const [interests, setInterests] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/planTrip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, startDate, endDate, interests }),
      });

      if (!res.ok) throw new Error('Failed to fetch itinerary');
      const data = await res.json();
      onPlan(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const spokenText = event.results[0][0].transcript;
      setDestination(spokenText);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Where do you want to go?"
          className="w-full border border-gray-300 rounded px-4 py-2 pr-10"
          required
        />
        <button
          type="button"
          onClick={handleVoiceInput}
          className="absolute right-2 top-2 text-gray-600 hover:text-blue-600"
        >
          <Mic
            className={`w-5 h-5 ${isListening ? 'text-blue-600 animate-pulse' : 'text-gray-600'}`}
          />
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {['sightseeing', 'food', 'adventure', 'relaxation', 'nightlife'].map((interest) => (
          <button
            key={interest}
            type="button"
            className={`px-3 py-1 rounded-full border ${
              interests.includes(interest)
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700'
            }`}
            onClick={() => toggleInterest(interest)}
          >
            {interest}
          </button>
        ))}
      </div>

      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        disabled={loading}
      >
        {loading ? 'Planning...' : 'Generate Itinerary'}
      </button>
    </form>
  );
};

export default TripPlannerForm;
