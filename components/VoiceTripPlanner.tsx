'use client';

import React, { useState } from 'react';

type Itinerary = {
  destination: string;
  startDate: string;
  endDate: string;
  interests: string[];
  plan: {
    day: number;
    activity: string;
  }[];
};

type VoiceTripPlannerProps = {
  onPlan: (newPlan: Itinerary) => void;
};

const VoiceTripPlanner: React.FC<VoiceTripPlannerProps> = ({ onPlan }) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const spokenText = event.results[0][0].transcript;
      setTranscript(spokenText);
      setIsListening(false);
      generatePlan(spokenText);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const generatePlan = async (destination: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/planTrip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          startDate: '2025-08-01',
          endDate: '2025-08-05',
          interests: ['sightseeing'],
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch itinerary');
      const data = await res.json();
      onPlan(data);
    } catch (err) {
      console.error('Error generating trip:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">🎙 AI Voice Trip Planner</h2>

      <button
        onClick={handleStartListening}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
        disabled={isListening || isLoading}
      >
        {isListening ? 'Listening...' : isLoading ? 'Generating Plan...' : 'Start Voice Input'}
      </button>

      {transcript && (
        <p className="text-gray-700 mb-2">
          <strong>You said:</strong> {transcript}
        </p>
      )}
    </div>
  );
};

export default VoiceTripPlanner;