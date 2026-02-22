"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Calendar, ArrowRight, ChevronDown } from "lucide-react";

// ==================== TYPES ====================

interface Session {
  session_id: string;
  date: string;
  time?: string;
  round?: string;
  description?: string;
}

interface City {
  city_id: string;
  name: string;
  country: string;
  iata_code: string;
  sessions: Session[];
}

interface CityPickerProps {
  eventId: string;
  eventName: string;
  cities: City[];
  onSelect: (params: {
    selected_event_id: string;
    selected_city_id: string;
    selected_match_date: string;
  }) => void;
}

// ==================== HELPERS ====================

const COUNTRY_FLAGS: Record<string, string> = {
  'United States': '🇺🇸',
  'Canada': '🇨🇦',
  'Mexico': '🇲🇽',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ==================== COMPONENT ====================

export default function CityPicker({ eventId, eventName, cities, onSelect }: CityPickerProps) {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const handleCityClick = (city: City) => {
    setSelectedCity(city);
    setSelectedSession(null);
  };

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
  };

  const handleConfirm = () => {
    if (!selectedCity || !selectedSession) return;
    onSelect({
      selected_event_id: eventId,
      selected_city_id: selectedCity.city_id,
      selected_match_date: selectedSession.date,
    });
  };

  // Group cities by country
  const grouped = cities.reduce<Record<string, City[]>>((acc, city) => {
    const country = city.country;
    if (!acc[country]) acc[country] = [];
    acc[country].push(city);
    return acc;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">{eventName}</h2>
        <p className="text-gray-500 text-lg">
          Matches across {cities.length} cities — pick where you want to go
        </p>
      </div>

      {/* City Grid */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([country, countryCities]) => (
          <div key={country}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{COUNTRY_FLAGS[country] || '🌍'}</span>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{country}</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {countryCities.map((city) => {
                const isSelected = selectedCity?.city_id === city.city_id;
                return (
                  <button
                    key={city.city_id}
                    onClick={() => handleCityClick(city)}
                    className={`
                      relative p-4 rounded-2xl border-2 text-left transition-all duration-200
                      ${isSelected
                        ? 'border-blue-600 bg-blue-50 shadow-lg scale-[1.02]'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`font-semibold text-sm ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                          {city.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{city.iata_code}</p>
                      </div>
                      <MapPin size={14} className={isSelected ? 'text-blue-600' : 'text-gray-300'} />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {city.sessions.length} match{city.sessions.length !== 1 ? 'es' : ''}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Session Picker — shown when city is selected */}
      <AnimatePresence>
        {selectedCity && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gray-50 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                  Matches in {selectedCity.name}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedCity.sessions.map((session) => {
                  const isSelected = selectedSession?.session_id === session.session_id;
                  return (
                    <button
                      key={session.session_id}
                      onClick={() => handleSessionClick(session)}
                      className={`
                        p-4 rounded-2xl border-2 text-left transition-all duration-200
                        ${isSelected
                          ? 'border-blue-600 bg-white shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`font-semibold text-sm ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                            {formatDate(session.date)}
                          </p>
                          {session.time && (
                            <p className="text-xs text-gray-400 mt-0.5">Kickoff {session.time}</p>
                          )}
                        </div>
                        {session.round && (
                          <span className={`
                            text-xs px-2 py-1 rounded-full font-semibold
                            ${session.round === 'Final' ? 'bg-yellow-100 text-yellow-700' :
                              session.round.includes('Semi') ? 'bg-orange-100 text-orange-700' :
                              session.round.includes('Quarter') ? 'bg-purple-100 text-purple-700' :
                              'bg-blue-100 text-blue-600'}
                          `}>
                            {session.round}
                          </span>
                        )}
                      </div>
                      {session.description && session.description !== 'Group Stage Match' && (
                        <p className="text-xs text-gray-500 mt-1">{session.description}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Button */}
      <AnimatePresence>
        {selectedCity && selectedSession && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <button
              onClick={handleConfirm}
              className="w-full h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-3xl text-lg transition-all shadow-xl flex items-center justify-center gap-3"
            >
              Build my trip to {selectedCity.name}
              <ArrowRight size={20} />
            </button>
            <p className="text-center text-sm text-gray-400 mt-2">
              {formatDate(selectedSession.date)} · {selectedSession.round}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}