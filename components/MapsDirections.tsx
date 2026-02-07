'use client';

import {
  MapPin,
  Navigation,
  Clock,
  Car,
  Bus,
  AlertCircle,
  Bike,
  Share2,
  Copy,
  Printer,
  Download,
  Bookmark,
  BookmarkCheck,
  Locate,
  Route,
  TrendingUp,
  Info,
  CheckCircle,
  MapPinned,
  Sparkles,
  ExternalLink,
  X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ==================== TYPES ====================

interface DirectionsResult {
  distance: string;
  duration: string;
  mode: string;
  steps: string[];
  alternatives?: AlternativeRoute[];
}

interface AlternativeRoute {
  name: string;
  distance: string;
  duration: string;
  traffic?: 'light' | 'moderate' | 'heavy';
}

interface MapsDirectionsProps {
  destination: string;
  defaultOrigin?: string;
}

type TravelMode = 'driving' | 'transit' | 'walking' | 'bicycling';

// ==================== MAIN COMPONENT ====================

export default function MapsDirections({ destination, defaultOrigin }: MapsDirectionsProps) {
  const [origin, setOrigin] = useState(defaultOrigin || '');
  const [directions, setDirections] = useState<DirectionsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<TravelMode>('driving');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [savedLocations, setSavedLocations] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [avoidHighways, setAvoidHighways] = useState(false);

  // Check if Google Maps API key exists
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    setHasApiKey(!!apiKey && apiKey !== '');

    if (!apiKey || apiKey === '') {
      console.error(
        '❌ Google Maps API key is missing! Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local'
      );
    } else {
      console.log('✅ Google Maps API key found');
    }

    // Load saved locations
    const saved = localStorage.getItem('gladys_saved_locations');
    if (saved) {
      setSavedLocations(JSON.parse(saved));
    }
  }, []);

  // ==================== MODES CONFIG ====================

  const modes = [
    { value: 'driving', label: 'Driving', icon: Car, color: 'text-blue-600' },
    { value: 'transit', label: 'Transit', icon: Bus, color: 'text-green-600' },
    { value: 'walking', label: 'Walking', icon: Navigation, color: 'text-purple-600' },
    { value: 'bicycling', label: 'Bicycling', icon: Bike, color: 'text-orange-600' },
  ];

  // ==================== HANDLERS ====================

  const getCurrentLocation = () => {
    setGettingLocation(true);

    if (!navigator.geolocation) {
      toast.error('Geolocation not supported', {
        description: 'Your browser does not support location services',
      });
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setOrigin(`${lat},${lng}`);
        setGettingLocation(false);
        toast.success('Location detected!', {
          description: 'Using your current location',
        });
      },
      error => {
        console.error('Geolocation error:', error);
        toast.error('Location access denied', {
          description: 'Please enable location services',
        });
        setGettingLocation(false);
      }
    );
  };

  const getDirections = async () => {
    if (!origin) {
      toast.error('Enter starting location', {
        description: 'Please provide where you want to start from',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/directions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          mode: selectedMode,
          avoidTolls,
          avoidHighways,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch directions');

      const data = await response.json();
      setDirections(data.directions);
      
      toast.success('Directions loaded!', {
        description: `${data.directions.distance} • ${data.directions.duration}`,
      });
    } catch (error) {
      console.error('Failed to fetch directions:', error);
      toast.error('Failed to get directions', {
        description: 'Please try again or check your locations',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocation = () => {
    const newSaved = isSaved
      ? savedLocations.filter(loc => loc !== destination)
      : [...savedLocations, destination];

    setSavedLocations(newSaved);
    setIsSaved(!isSaved);
    localStorage.setItem('gladys_saved_locations', JSON.stringify(newSaved));

    toast.success(isSaved ? 'Location removed' : 'Location saved!', {
      description: isSaved ? destination : 'Added to saved locations',
    });
  };

  const handleCopyDirections = () => {
    if (!directions) return;

    const text = `Route from ${origin} to ${destination}\n\nDistance: ${directions.distance}\nTime: ${directions.duration}\nMode: ${selectedMode}\n\nDirections:\n${directions.steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    toast.success('Directions copied!', {
      description: 'Copied to clipboard',
    });
  };

  const handleShare = async () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${selectedMode}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Directions to ${destination}`,
          text: `Get directions from ${origin} to ${destination}`,
          url: url,
        });
        toast.success('Shared successfully!');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!', {
        description: 'Share link copied to clipboard',
      });
    }
  };

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const handleDownload = () => {
    if (!directions) return;

    const text = `DIRECTIONS TO ${destination.toUpperCase()}\n\nFrom: ${origin}\nTo: ${destination}\nMode: ${selectedMode}\nDistance: ${directions.distance}\nDuration: ${directions.duration}\n\n${directions.steps.map((step, i) => `${i + 1}. ${step}`).join('\n\n')}\n\nGenerated by GladysTravelAI`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `directions-to-${destination.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Directions downloaded!');
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${selectedMode}`;
    window.open(url, '_blank');
    toast.success('Opening in Google Maps...');
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
            <MapPin className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Maps & Directions</h3>
            <p className="text-sm text-gray-600">Get directions to {destination}</p>
          </div>
        </div>

        <Button
          onClick={handleSaveLocation}
          variant="outline"
          size="sm"
          className="rounded-xl"
        >
          {isSaved ? (
            <>
              <BookmarkCheck size={16} className="mr-2 text-purple-600" />
              Saved
            </>
          ) : (
            <>
              <Bookmark size={16} className="mr-2" />
              Save
            </>
          )}
        </Button>
      </motion.div>

      {/* API Key Warning */}
      <AnimatePresence>
        {!hasApiKey && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="p-6 bg-yellow-50 border-2 border-yellow-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={24} />
                <div>
                  <h4 className="font-bold text-yellow-900 mb-2">
                    Google Maps API Key Missing
                  </h4>
                  <p className="text-sm text-yellow-800 mb-3">
                    To enable maps, add your Google Maps API key to the environment variables:
                  </p>
                  <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
                    <li>
                      Get a key from{' '}
                      <a
                        href="https://console.cloud.google.com/google/maps-apis"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-semibold"
                      >
                        Google Cloud Console
                      </a>
                    </li>
                    <li>
                      Add to <code className="bg-yellow-200 px-2 py-0.5 rounded">.env.local</code>
                      :{' '}
                      <code className="bg-yellow-200 px-2 py-0.5 rounded">
                        NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
                      </code>
                    </li>
                    <li>Restart your development server</li>
                  </ol>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <p className="text-sm font-semibold text-gray-700 mb-3">Travel Mode</p>
        <div className="grid grid-cols-4 gap-3">
          {modes.map((mode, idx) => {
            const Icon = mode.icon;
            return (
              <motion.button
                key={mode.value}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + idx * 0.05 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedMode(mode.value as TravelMode)}
                className={`flex flex-col items-center justify-center space-y-2 px-4 py-4 rounded-xl border-2 transition-all ${
                  selectedMode === mode.value
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <Icon size={24} className={selectedMode === mode.value ? mode.color : 'text-gray-600'} />
                <span className={`font-medium text-sm ${selectedMode === mode.value ? 'text-blue-700' : 'text-gray-600'}`}>
                  {mode.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Origin Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3"
      >
        <p className="text-sm font-semibold text-gray-700">Starting Location</p>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <MapPinned className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Enter your starting location..."
              value={origin}
              onChange={e => setOrigin(e.target.value)}
              className="border-2 border-gray-200 focus:border-blue-500 rounded-xl pl-12 pr-4 py-6 text-base"
              onKeyPress={e => e.key === 'Enter' && getDirections()}
            />
          </div>
          <Button
            onClick={getCurrentLocation}
            disabled={gettingLocation}
            variant="outline"
            className="px-4 py-6 rounded-xl border-2"
          >
            {gettingLocation ? (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Locate size={18} />
            )}
          </Button>
        </div>

        {/* Avoid Options */}
        {selectedMode === 'driving' && (
          <div className="flex gap-3">
            <button
              onClick={() => setAvoidTolls(!avoidTolls)}
              className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                avoidTolls
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              Avoid Tolls
            </button>
            <button
              onClick={() => setAvoidHighways(!avoidHighways)}
              className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                avoidHighways
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              Avoid Highways
            </button>
          </div>
        )}
      </motion.div>

      {/* Get Directions Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          onClick={getDirections}
          disabled={!origin || loading}
          className="w-full py-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Finding Route...</span>
            </div>
          ) : (
            <>
              <Navigation size={20} className="mr-2" />
              Get Directions
            </>
          )}
        </Button>
      </motion.div>

      {/* Google Maps Embed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {hasApiKey ? (
          <Card className="overflow-hidden border-2 border-gray-200 shadow-xl">
            <iframe
              width="100%"
              height="450"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(destination)}&zoom=14`}
            ></iframe>
          </Card>
        ) : (
          <Card className="p-16 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200">
            <div className="text-center">
              <MapPin className="mx-auto text-gray-300 mb-4" size={80} />
              <p className="text-gray-600 font-semibold mb-2 text-lg">Map Preview Unavailable</p>
              <p className="text-sm text-gray-500">Add Google Maps API key to enable maps</p>
            </div>
          </Card>
        )}
      </motion.div>

      {/* Directions Results */}
      <AnimatePresence>
        {directions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6 border-2 border-gray-200 shadow-xl">
              {/* Route Header */}
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Route className="text-blue-600" size={24} />
                  Your Route
                </h4>
                <div className="flex items-center gap-4">
                  <Badge className="bg-blue-100 text-blue-700 px-3 py-1">
                    <MapPin size={14} className="mr-1" />
                    {directions.distance}
                  </Badge>
                  <Badge className="bg-green-100 text-green-700 px-3 py-1">
                    <Clock size={14} className="mr-1" />
                    {directions.duration}
                  </Badge>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3 mb-6">
                {directions.steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
                  >
                    <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-sm text-gray-700 flex-1 pt-0.5">{step}</p>
                  </motion.div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  onClick={openInGoogleMaps}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  <ExternalLink size={16} className="mr-2" />
                  Open
                </Button>
                <Button onClick={handleCopyDirections} variant="outline">
                  <Copy size={16} className="mr-2" />
                  Copy
                </Button>
                <Button onClick={handleShare} variant="outline">
                  <Share2 size={16} className="mr-2" />
                  Share
                </Button>
                <Button onClick={handleDownload} variant="outline">
                  <Download size={16} className="mr-2" />
                  Save
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
          <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
            <Sparkles size={18} />
            Travel Tips
          </h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>Check traffic conditions before you leave</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>Consider public transit for eco-friendly travel</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>Download offline maps in case of poor signal</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>Allow extra time for security and check-in at airports</span>
            </li>
          </ul>
        </Card>
      </motion.div>

      {/* Alternative: Quick Open Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <Button
          onClick={() => {
            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
            window.open(url, '_blank');
          }}
          variant="outline"
          className="w-full rounded-xl border-2"
        >
          <MapPin size={16} className="mr-2" />
          Open {destination} in Google Maps
        </Button>
      </motion.div>
    </div>
  );
}