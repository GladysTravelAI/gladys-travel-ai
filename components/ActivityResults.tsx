"use client";

import { useState } from "react";
import { Activity, MapPin, Clock, Users, Star, ExternalLink, DollarSign, Bookmark, BookmarkCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  price: string;
  duration?: string;
  rating?: number;
  location?: string;
  category?: string;
  image?: string;
  bookingUrl?: string;
  groupSize?: string;
  partner?: string;
}

interface ActivityResultsProps {
  activities: ActivityItem[];
  onSaveItem?: (activity: ActivityItem) => void; // NEW: Save functionality
}

// Affiliate tracking
const trackActivityClick = async (activity: ActivityItem) => {
  try {
    await fetch('/api/analytics/affiliate-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'activity',
        itemId: activity.id,
        itemName: activity.title,
        partner: activity.partner || 'Viator',
        estimatedValue: parseFloat(activity.price.replace(/[^0-9.]/g, '')),
        estimatedCommission: parseFloat(activity.price.replace(/[^0-9.]/g, '')) * 0.10,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Failed to track activity click:', error);
  }
};

export default function ActivityResults({ activities, onSaveItem }: ActivityResultsProps) {
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [savedActivities, setSavedActivities] = useState<Set<string>>(new Set());

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Activity className="mx-auto mb-4 text-gray-400" size={64} />
        <p className="text-xl font-semibold mb-2">No activities found</p>
        <p className="text-sm">Try searching for a different destination</p>
      </div>
    );
  }

  const handleBookActivity = (activity: ActivityItem) => {
    setSelectedActivity(activity.id);
    trackActivityClick(activity);
    
    if (activity.bookingUrl) {
      window.open(activity.bookingUrl, '_blank');
    } else {
      const searchUrl = `https://www.viator.com/search?text=${encodeURIComponent(activity.title)}`;
      window.open(searchUrl, '_blank');
    }
  };

  const handleSaveActivity = (activity: ActivityItem) => {
    const newSaved = new Set(savedActivities);
    if (newSaved.has(activity.id)) {
      newSaved.delete(activity.id);
    } else {
      newSaved.add(activity.id);
      if (onSaveItem) {
        onSaveItem(activity);
      }
    }
    setSavedActivities(newSaved);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="text-green-500" />
            Things to Do
          </h2>
          <p className="text-gray-600">{activities.length} experiences found</p>
        </div>
        <Badge variant="outline" className="border-green-300 text-green-700">
          Powered by Viator
        </Badge>
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map((activity) => {
          const isSelected = selectedActivity === activity.id;
          const isSaved = savedActivities.has(activity.id);

          return (
            <Card
              key={activity.id}
              className={`overflow-hidden hover:shadow-xl transition-all duration-300 border-2 ${
                isSelected ? 'border-green-500 shadow-lg' : 'hover:border-green-300'
              }`}
            >
              {/* Image */}
              {activity.image && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={activity.image}
                    alt={activity.title}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                  {/* Rating Badge */}
                  {activity.rating && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-white text-gray-800 font-bold shadow-lg">
                        <Star size={14} className="text-yellow-500 fill-yellow-500 mr-1" />
                        {activity.rating.toFixed(1)}
                      </Badge>
                    </div>
                  )}
                  {/* Category Badge */}
                  {activity.category && (
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-green-500 text-white shadow-lg">
                        {activity.category}
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                  {activity.title}
                </h3>

                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {activity.description}
                </p>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  {activity.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin size={16} className="mr-2 flex-shrink-0" />
                      <span className="line-clamp-1">{activity.location}</span>
                    </div>
                  )}
                  {activity.duration && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock size={16} className="mr-2 flex-shrink-0" />
                      <span>{activity.duration}</span>
                    </div>
                  )}
                  {activity.groupSize && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Users size={16} className="mr-2 flex-shrink-0" />
                      <span>{activity.groupSize}</span>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b">
                  <span className="text-2xl font-bold text-green-700">{activity.price}</span>
                  <Badge variant="outline" className="text-xs">
                    via {activity.partner || 'Viator'}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button
                    onClick={() => handleBookActivity(activity)}
                    className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                  >
                    <ExternalLink size={16} className="mr-2" />
                    Book Experience
                  </Button>

                  {onSaveItem && (
                    <Button
                      onClick={() => handleSaveActivity(activity)}
                      variant="outline"
                      className={`w-full ${isSaved ? 'bg-purple-50 border-purple-300' : ''}`}
                    >
                      {isSaved ? (
                        <>
                          <BookmarkCheck size={16} className="mr-2 text-purple-600" />
                          Saved to Trip
                        </>
                      ) : (
                        <>
                          <Bookmark size={16} className="mr-2" />
                          Save to Trip
                        </>
                      )}
                    </Button>
                  )}
                </div>

                <p className="text-xs text-gray-500 text-center mt-3">
                  💡 We earn a small commission
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Selected Activity Info */}
      {selectedActivity && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm text-green-800">
            🎯 Complete your booking to secure your spot for this amazing experience!
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <h4 className="font-semibold text-gray-900 mb-2">💡 Activity Booking Tips:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Book popular activities in advance to avoid sold-out dates</li>
          <li>• Check cancellation policies before booking</li>
          <li>• Read reviews from other travelers</li>
          <li>• Consider combo packages for better value</li>
        </ul>
      </div>
    </div>
  );
}