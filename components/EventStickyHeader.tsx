// components/EventStickyHeader.tsx
// 🎯 Always-visible event header across all tabs

"use client";

import { Calendar, MapPin, Ticket, Share2, Bookmark, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

interface EventHeaderProps {
  event: {
    id: string;
    name: string;
    startDate: string;
    venue: {
      name: string;
      city: string;
      country: string;
    };
    estimatedTicketPrice?: {
      min: number;
      max: number;
      currency: string;
    };
    priceRange?: {
      min: number;
      max: number;
      currency: string;
    };
    type: string;
    url?: string;
  };
  compact?: boolean;
}

export default function EventStickyHeader({ event, compact = false }: EventHeaderProps) {
  const [isSaved, setIsSaved] = useState(false);

  // Get price info
  const priceInfo = event.estimatedTicketPrice || event.priceRange;
  const priceDisplay = priceInfo 
    ? `From ${priceInfo.currency || 'USD'} $${priceInfo.min?.toLocaleString()}`
    : 'Price TBD';

  // Format date
  const eventDate = new Date(event.startDate);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: `Check out ${event.name} on ${formattedDate}!`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    // TODO: Implement actual save logic
  };

  if (compact) {
    return (
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">
                  {event.name}
                </h1>
                <p className="text-sm text-gray-600">
                  {formattedDate} • {event.venue.city}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={handleSave}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <Bookmark size={16} className={isSaved ? 'fill-blue-600 text-blue-600' : ''} />
              </Button>
              <Button
                onClick={handleShare}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <Share2 size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-40 bg-white border-b-2 border-gray-200 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-4">
          
          {/* Event Title */}
          <div>
            <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold mb-3">
              {event.type.charAt(0).toUpperCase() + event.type.slice(1)} Event
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {event.name}
            </h1>
          </div>

          {/* Event Meta */}
          <div className="flex flex-wrap items-center gap-6 text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar size={20} />
              <span className="font-medium">{formattedDate}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin size={20} />
              <span className="font-medium">
                {event.venue.name}, {event.venue.city}, {event.venue.country}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Ticket size={20} />
              <span className="font-medium">{priceDisplay}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {event.url && (
              <Button
                onClick={() => window.open(event.url, '_blank')}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <Ticket size={18} />
                Get Tickets
                <ExternalLink size={16} />
              </Button>
            )}
            
            <Button
              onClick={handleSave}
              variant="outline"
              className="gap-2"
            >
              <Bookmark size={18} className={isSaved ? 'fill-blue-600 text-blue-600' : ''} />
              {isSaved ? 'Saved' : 'Save Event'}
            </Button>
            
            <Button
              onClick={handleShare}
              variant="outline"
              className="gap-2"
            >
              <Share2 size={18} />
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}