import { useState } from "react";
import { TripPreferences } from "@/components/TripRefinementModal";
import { ItineraryData } from "@/lib/mock-itinerary";

interface UseItineraryOptions {
  onSuccess?: (data: ItineraryData) => void;
  onError?: (error: string) => void;
}

export function useItinerary(options?: UseItineraryOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ItineraryData | null>(null);

  const generateItinerary = async (
    destination: string,
    preferences: TripPreferences
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Location
          location: destination,
          
          // From TripPreferences
          days: preferences.days,
          budget: preferences.budget,           // 'budget' | 'mid-range' | 'luxury'
          tripType: preferences.tripType,       // 'adventure' | 'romantic' | 'cultural' etc.
          groupSize: preferences.groupSize,     // number of people
          groupType: preferences.groupType,     // 'solo' | 'couple' | 'family' | 'group'
          origin: preferences.origin,           // optional departure city
          
          // Defaults
          optimize: true,                       // always optimize routes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate itinerary");
      }

      const itineraryData: ItineraryData = await response.json();
      setData(itineraryData);
      options?.onSuccess?.(itineraryData);
      
      return itineraryData;
    } catch (err: any) {
      const errorMessage = err.message || "Something went wrong";
      setError(errorMessage);
      options?.onError?.(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
    setIsLoading(false);
  };

  return {
    generateItinerary,
    isLoading,
    error,
    data,
    reset,
  };
}