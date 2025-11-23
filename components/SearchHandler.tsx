"use client";

import React, { useState } from "react";
import ItineraryView from "@/components/ItineraryView";
import HotelResults from "@/components/HotelResults";
import RestaurantResults from "@/components/RestaurantResults";
import ActivityResults from "@/components/ActivityResults"; // ✅ fixed import
import { ItineraryData } from "@/lib/mock-itinerary";
import {imageSearch} from "@/lib/imageSearch"; // ✅ use lib instead of component

export default function SearchHandler() {
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<ItineraryData | null>(null);
  const [hotels, setHotels] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);

  async function handleSearch() {
    if (!destination) return;
    setLoading(true);

    try {
      // Run all API requests in parallel
      const [itineraryRes, hotelsRes, restaurantsRes, activitiesRes, photosData] =
        await Promise.all([
          fetch("/api/itinerary", {
            method: "POST",
            body: JSON.stringify({ destination }),
          }),
          fetch("/api/hotels", {
            method: "POST",
            body: JSON.stringify({ location: destination }),
          }),
          fetch("/api/restaurants", {
            method: "POST",
            body: JSON.stringify({ location: destination }),
          }),
          fetch("/api/activities", {
            method: "POST",
            body: JSON.stringify({ location: destination }),
          }),
          imageSearch(destination), // ✅ directly call lib
        ]);

      const [itineraryData, hotelsData, restaurantsData, activitiesData] =
        await Promise.all([
          itineraryRes.json(),
          hotelsRes.json(),
          restaurantsRes.json(),
          activitiesRes.json(),
        ]);

      setItinerary(itineraryData);
      setHotels(hotelsData.hotels || []);
      setRestaurants(restaurantsData.restaurants || []);
      setActivities(activitiesData.activities || []);
      setPhotos(photosData || []); // ✅ already an array from lib
    } catch (err) {
      console.error("❌ Error fetching travel data:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Search Bar */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search destination..."
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          className="flex-1 border rounded-xl px-4 py-2"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {loading && <p className="text-gray-600">Loading travel data...</p>}

      {/* Results */}
      {itinerary && <ItineraryView data={itinerary} />}
      {hotels.length > 0 && <HotelResults hotels={hotels} />}
      {restaurants.length > 0 && <RestaurantResults restaurants={restaurants} />}
      {activities.length > 0 && <ActivityResults activities={activities} />}

      {/* Photos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo, i) => (
            <img
              key={i}
              src={photo.url}
              alt={photo.alt || "Destination"}
              className="rounded-xl shadow-md object-cover w-full h-48"
            />
          ))}
        </div>
      )}

      {/* Google Maps */}
      {destination && (
        <iframe
          className="w-full h-64 rounded-2xl mt-4"
          src={`https://www.google.com/maps?q=${encodeURIComponent(
            destination
          )}&output=embed`}
        />
      )}
    </div>
  );
}