import { MapPin, Navigation, Clock, Car, Train, Bus, } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface DirectionsResult {
  distance: string;
  duration: string;
  mode: string;
  steps: string[];
}

interface MapsDirectionsProps {
  destination: string;
}

export default function MapsDirections({ destination }: MapsDirectionsProps) {
  const [origin, setOrigin] = useState("");
  const [directions, setDirections] = useState<DirectionsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"driving" | "transit" | "walking">("driving");

  const modes = [
    { value: "driving", label: "Driving", icon: Car },
    { value: "transit", label: "Transit", icon: Bus },
    { value: "walking", label: "Walking", icon: Navigation },
  ];

  const getDirections = async () => {
    if (!origin) return;
    
    setLoading(true);
    try {
      const response = await fetch("/api/directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin, destination, mode: selectedMode }),
      });
      
      const data = await response.json();
      setDirections(data.directions);
    } catch (error) {
      console.error("Failed to fetch directions:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <MapPin className="text-blue-600" size={24} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Maps & Directions</h3>
          <p className="text-sm text-gray-500">Get directions to {destination}</p>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="flex space-x-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.value}
              onClick={() => setSelectedMode(mode.value as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 transition-all ${
                selectedMode === mode.value
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Origin Input */}
      <div className="flex space-x-3">
        <div className="flex-1">
          <Input
            placeholder="Enter your starting location..."
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="border-gray-200 focus:border-blue-500 rounded-xl px-4 py-6 text-base"
          />
        </div>
        <Button
          onClick={getDirections}
          disabled={!origin || loading}
          className="px-6 py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Finding...</span>
            </div>
          ) : (
            <>
              <Navigation size={18} className="mr-2" />
              Get Directions
            </>
          )}
        </Button>
      </div>

      {/* Google Maps Embed */}
      <Card className="overflow-hidden border-gray-200">
        <iframe
          width="100%"
          height="400"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(destination)}&zoom=14`}
        ></iframe>
      </Card>

      {/* Directions Results */}
      {directions && (
        <Card className="p-6 border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-gray-800">Your Route</h4>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin size={16} />
                <span className="text-sm font-semibold">{directions.distance}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock size={16} />
                <span className="text-sm font-semibold">{directions.duration}</span>
              </div>
            </div>
          </div>

          {/* Step-by-step directions */}
          <div className="space-y-3">
            {directions.steps.map((step, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-700 flex-1">{step}</p>
              </div>
            ))}
          </div>

          {/* Open in Google Maps */}
          <div className="mt-6 flex space-x-3">
            <Button
              onClick={() => {
                const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${selectedMode}`;
                window.open(url, '_blank');
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <MapPin size={16} className="mr-2" />
              Open in Google Maps
            </Button>
            <Button
              onClick={() => {
                const text = `Route from ${origin} to ${destination}\n\nDistance: ${directions.distance}\nTime: ${directions.duration}\n\n${directions.steps.join('\n')}`;
                navigator.clipboard.writeText(text);
              }}
              variant="outline"
              className="px-6"
            >
              Copy Directions
            </Button>
          </div>
        </Card>
      )}

      {/* Quick Tips */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
          <Navigation size={18} className="mr-2" />
          Travel Tips
        </h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Check traffic conditions before you leave</li>
          <li>• Consider public transit for eco-friendly travel</li>
          <li>• Download offline maps in case of poor signal</li>
          <li>• Allow extra time for security and check-in at airports</li>
        </ul>
      </Card>
    </div>
  );
}