import { useState } from "react";
import { MapPin, Loader2, Navigation2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LocationAutoCompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export default function LocationAutoComplete({ 
  value, 
  onChange, 
  placeholder = "Enter location",
  label 
}: LocationAutoCompleteProps) {
  const [detecting, setDetecting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Popular locations for quick suggestions
  const popularLocations = [
    "Johannesburg, South Africa",
    "Cape Town, South Africa",
    "Durban, South Africa",
    "Paris, France",
    "London, UK",
    "New York, USA",
    "Dubai, UAE",
    "Tokyo, Japan",
    "Barcelona, Spain",
  ];

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setDetecting(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use reverse geocoding to get city name
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await response.json();
          
          const city = data.city || data.locality;
          const country = data.countryName;
          const location = `${city}, ${country}`;
          
          onChange(location);
        } catch (error) {
          console.error("Error detecting location:", error);
          // Fallback to default
          onChange("Johannesburg, South Africa");
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setDetecting(false);
        alert("Could not detect your location. Please enter manually.");
      }
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    
    // Filter suggestions
    if (inputValue.length > 0) {
      const filtered = popularLocations.filter(loc =>
        loc.toLowerCase().includes(inputValue.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative flex items-center space-x-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={() => value.length === 0 && setSuggestions(popularLocations) && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder}
            className="pl-10 pr-4 py-6 rounded-2xl text-base border-gray-200 focus:border-blue-500"
          />
        </div>

        <Button
          type="button"
          onClick={detectLocation}
          disabled={detecting}
          variant="outline"
          className="h-14 px-4 rounded-2xl border-gray-200 hover:border-blue-500 hover:bg-blue-50"
          title="Use current location"
        >
          {detecting ? (
            <Loader2 className="animate-spin text-blue-600" size={20} />
          ) : (
            <Navigation2 className="text-blue-600" size={20} />
          )}
        </Button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onMouseDown={() => selectSuggestion(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center space-x-2 border-b border-gray-100 last:border-b-0"
            >
              <MapPin size={14} className="text-gray-400" />
              <span className="text-sm text-gray-700">{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}