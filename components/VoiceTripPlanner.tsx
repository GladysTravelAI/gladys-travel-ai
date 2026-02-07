'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Sparkles, Volume2, X, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ==================== TYPES ====================

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
  onPlan?: (newPlan: Itinerary) => void;
  onDestinationCapture?: (destination: string) => void;
  compact?: boolean;
  autoClose?: boolean;
};

// ==================== MAIN COMPONENT ====================

const VoiceTripPlanner: React.FC<VoiceTripPlannerProps> = ({
  onPlan,
  onDestinationCapture,
  compact = false,
  autoClose = false,
}) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');

  const recognitionRef = useRef<any>(null);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      console.warn('⚠️ Speech Recognition not supported in this browser');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // ==================== HANDLERS ====================

  const handleStartListening = () => {
    if (!isSupported) {
      toast.error('Not supported', {
        description: 'Speech recognition is not supported in your browser. Try Chrome or Edge.',
      });
      return;
    }

    setError(null);
    setTranscript('');
    setInterimTranscript('');
    setShowModal(true);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;

    recognition.onstart = () => {
      console.log('🎤 Voice recognition started');
      setIsListening(true);
      toast.success('Listening...', {
        description: 'Speak your destination clearly',
        duration: 2000,
      });
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      if (interim) {
        setInterimTranscript(interim);
      }

      if (final) {
        setTranscript(prev => (prev + final).trim());
        setInterimTranscript('');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error);
      setIsListening(false);

      let errorMessage = 'Failed to capture voice';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not available. Check permissions.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow access.';
          break;
        case 'network':
          errorMessage = 'Network error. Check your connection.';
          break;
      }

      setError(errorMessage);
      toast.error('Voice capture failed', {
        description: errorMessage,
      });
    };

    recognition.onend = () => {
      console.log('🎤 Voice recognition ended');
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      console.error('❌ Failed to start recognition:', err);
      setError('Failed to start voice recognition');
      setIsListening(false);
      toast.error('Failed to start', {
        description: 'Could not access microphone',
      });
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleConfirm = () => {
    if (!transcript.trim()) {
      toast.error('No destination captured', {
        description: 'Please speak a destination',
      });
      return;
    }

    handleStopListening();

    // Extract destination (simple parsing)
    const destination = extractDestination(transcript);

    if (onDestinationCapture) {
      onDestinationCapture(destination);
      toast.success('Destination captured!', {
        description: `Searching for ${destination}`,
      });
    } else {
      generatePlan(destination);
    }

    if (autoClose) {
      setShowModal(false);
    }
  };

  const generatePlan = async (destination: string) => {
    if (!onPlan) {
      console.warn('⚠️ No onPlan handler provided');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/planTrip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          interests: ['sightseeing'],
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch itinerary');
      }

      const data = await res.json();
      onPlan(data);

      toast.success('Trip plan generated!', {
        description: `Created itinerary for ${destination}`,
      });

      setShowModal(false);
    } catch (err) {
      console.error('❌ Error generating trip:', err);
      toast.error('Generation failed', {
        description: 'Could not create trip plan. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    handleStopListening();
    setShowModal(false);
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  };

  // ==================== RENDER ====================

  if (!isSupported) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-amber-900 text-sm">
              Voice input not supported
            </p>
            <p className="text-amber-700 text-xs mt-1">
              Please use Chrome or Edge browser for voice features
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Compact mode - just the button
  if (compact) {
    return (
      <>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStartListening}
          disabled={isListening || isLoading}
          className="relative group"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all">
            <Mic className="text-white" size={24} />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
        </motion.button>

        {showModal && <VoiceModal />}
      </>
    );
  }

  // Full mode
  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
              <Volume2 className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Voice Trip Planner</h2>
              <p className="text-sm text-gray-600">Speak your destination</p>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStartListening}
          disabled={isListening || isLoading}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
        >
          <Mic size={20} />
          {isListening ? 'Listening...' : isLoading ? 'Generating...' : 'Start Voice Input'}
        </motion.button>

        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-xl"
          >
            <p className="text-sm font-semibold text-purple-900 mb-1">You said:</p>
            <p className="text-gray-700">{transcript}</p>
          </motion.div>
        )}
      </div>

      {showModal && <VoiceModal />}
    </>
  );

  // ==================== VOICE MODAL ====================

  function VoiceModal() {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={!isListening ? handleClose : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8"
          >
            {/* Close button */}
            {!isListening && (
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-10 h-10 hover:bg-gray-100 rounded-full flex items-center justify-center transition-all"
              >
                <X size={20} />
              </button>
            )}

            {/* Microphone animation */}
            <div className="flex flex-col items-center mb-6">
              <motion.div
                animate={
                  isListening
                    ? {
                        scale: [1, 1.2, 1],
                        boxShadow: [
                          '0 0 0 0 rgba(147, 51, 234, 0.4)',
                          '0 0 0 20px rgba(147, 51, 234, 0)',
                          '0 0 0 0 rgba(147, 51, 234, 0)',
                        ],
                      }
                    : {}
                }
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4 shadow-2xl"
              >
                {isListening ? (
                  <Mic className="text-white" size={40} />
                ) : (
                  <MicOff className="text-white" size={40} />
                )}
              </motion.div>

              {isListening && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-1"
                >
                  {[0, 1, 2, 3].map(i => (
                    <motion.div
                      key={i}
                      animate={{
                        height: ['10px', '30px', '10px'],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.8,
                        delay: i * 0.1,
                      }}
                      className="w-1 bg-purple-600 rounded-full"
                    />
                  ))}
                </motion.div>
              )}
            </div>

            {/* Status */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {isListening ? 'Listening...' : isLoading ? 'Creating Plan...' : 'Ready to Listen'}
              </h3>
              <p className="text-gray-600">
                {isListening
                  ? 'Speak clearly and say your destination'
                  : isLoading
                  ? 'Generating your perfect itinerary'
                  : 'Click the button to start'}
              </p>
            </div>

            {/* Transcript */}
            <AnimatePresence>
              {(transcript || interimTranscript) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-purple-50 rounded-xl p-4 mb-6"
                >
                  <p className="text-sm font-semibold text-purple-900 mb-2">
                    {isListening ? 'Hearing:' : 'You said:'}
                  </p>
                  <p className="text-gray-900">
                    {transcript}
                    {interimTranscript && (
                      <span className="text-gray-500 italic"> {interimTranscript}</span>
                    )}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex gap-3">
              {isListening ? (
                <button
                  onClick={handleStopListening}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <MicOff size={20} />
                  Stop
                </button>
              ) : transcript && !isLoading ? (
                <>
                  <button
                    onClick={handleStartListening}
                    className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Mic size={20} />
                    Retry
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Check size={20} />
                    Confirm
                  </button>
                </>
              ) : isLoading ? (
                <button
                  disabled
                  className="flex-1 py-3 bg-gray-400 text-white rounded-xl font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <Loader2 className="animate-spin" size={20} />
                  Loading...
                </button>
              ) : (
                <button
                  onClick={handleStartListening}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Mic size={20} />
                  Start Listening
                </button>
              )}
            </div>

            {/* Tips */}
            {!transcript && !isListening && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 text-center"
              >
                <p className="text-xs text-gray-500">
                  💡 Try: "I want to visit Paris" or "Plan a trip to Tokyo"
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }
};

// ==================== HELPER FUNCTIONS ====================

function extractDestination(transcript: string): string {
  // Simple extraction - remove common phrases
  const cleanTranscript = transcript
    .toLowerCase()
    .replace(/^(i want to|i'd like to|please|can you|let's|plan a trip to|visit|go to|travel to)\s*/gi, '')
    .trim();

  // Capitalize first letter of each word
  return cleanTranscript
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default VoiceTripPlanner;