"use client";

import { useState } from "react";
import { X, ExternalLink, Trash2, Mail, Download, Bookmark, Hotel, Plane, Utensils, Activity, DollarSign, Calendar, MapPin, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SavedItem {
  id: string;
  type: 'hotel' | 'flight' | 'restaurant' | 'activity';
  name: string;
  price: string;
  location?: string;
  date?: string;
  image?: string;
  affiliateUrl: string;
  partner: string; // 'Booking.com', 'Expedia', etc.
  description?: string;
}

interface TripSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  savedItems: {
    hotels: SavedItem[];
    flights: SavedItem[];
    restaurants: SavedItem[];
    activities: SavedItem[];
  };
  onRemoveItem: (type: string, id: string) => void;
  destination: string;
}

export default function TripSummary({
  isOpen,
  onClose,
  savedItems,
  onRemoveItem,
  destination
}: TripSummaryProps) {
  const [emailSent, setEmailSent] = useState(false);

  if (!isOpen) return null;

  const allItems = [
    ...savedItems.hotels,
    ...savedItems.flights,
    ...savedItems.restaurants,
    ...savedItems.activities
  ];

  const totalEstimated = allItems.reduce((sum, item) => {
    const price = parseFloat(item.price.replace(/[^0-9.]/g, ''));
    return sum + (isNaN(price) ? 0 : price);
  }, 0);

  const handleBookNow = (item: SavedItem) => {
    // Track affiliate click
    fetch('/api/analytics/affiliate-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: item.type,
        itemId: item.id,
        partner: item.partner,
        estimatedValue: parseFloat(item.price.replace(/[^0-9.]/g, '')),
        timestamp: new Date().toISOString()
      })
    });

    // Open affiliate link
    window.open(item.affiliateUrl, '_blank');
  };

  const handleEmailItinerary = async () => {
    // Simulate sending email
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
    
    // In production, call your email API
    // await fetch('/api/email-itinerary', { ... });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `My ${destination} Trip Plan`,
        text: `Check out my trip to ${destination}!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'hotel': return Hotel;
      case 'flight': return Plane;
      case 'restaurant': return Utensils;
      case 'activity': return Activity;
      default: return Bookmark;
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full md:w-[600px] bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Bookmark size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">My Trip Plan</h2>
              <p className="text-white/90 text-sm">{destination}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100vh-200px)] p-6">
          {allItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bookmark className="text-gray-400" size={48} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Saved Items</h3>
              <p className="text-gray-600 mb-6">
                Start adding hotels, flights, and activities to your trip plan
              </p>
              <Button onClick={onClose} className="bg-gradient-to-r from-purple-600 to-pink-600">
                Start Planning
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Hotels */}
              {savedItems.hotels.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                    <Hotel className="mr-2 text-purple-600" size={20} />
                    Hotels ({savedItems.hotels.length})
                  </h3>
                  <div className="space-y-3">
                    {savedItems.hotels.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onBook={() => handleBookNow(item)}
                        onRemove={() => onRemoveItem('hotel', item.id)}
                        icon={Hotel}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Flights */}
              {savedItems.flights.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                    <Plane className="mr-2 text-blue-600" size={20} />
                    Flights ({savedItems.flights.length})
                  </h3>
                  <div className="space-y-3">
                    {savedItems.flights.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onBook={() => handleBookNow(item)}
                        onRemove={() => onRemoveItem('flight', item.id)}
                        icon={Plane}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Activities */}
              {savedItems.activities.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                    <Activity className="mr-2 text-green-600" size={20} />
                    Activities ({savedItems.activities.length})
                  </h3>
                  <div className="space-y-3">
                    {savedItems.activities.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onBook={() => handleBookNow(item)}
                        onRemove={() => onRemoveItem('activity', item.id)}
                        icon={Activity}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Restaurants */}
              {savedItems.restaurants.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                    <Utensils className="mr-2 text-orange-600" size={20} />
                    Restaurants ({savedItems.restaurants.length})
                  </h3>
                  <div className="space-y-3">
                    {savedItems.restaurants.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onBook={() => handleBookNow(item)}
                        onRemove={() => onRemoveItem('restaurant', item.id)}
                        icon={Utensils}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {allItems.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6">
            {/* Total */}
            <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700 font-medium">Estimated Total:</span>
                <span className="text-2xl font-bold text-purple-700">
                  ${totalEstimated.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                💡 Prices shown are estimates. Final prices confirmed on booking sites.
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleEmailItinerary}
                variant="outline"
                className="w-full"
                disabled={emailSent}
              >
                {emailSent ? (
                  <>✓ Sent!</>
                ) : (
                  <>
                    <Mail size={16} className="mr-2" />
                    Email Plan
                  </>
                )}
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                className="w-full"
              >
                <Share2 size={16} className="mr-2" />
                Share
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500 mt-3">
              Click "Book Now" on any item to complete your reservation
            </p>
          </div>
        )}
      </div>
    </>
  );
}

// Item Card Component
function ItemCard({ 
  item, 
  onBook, 
  onRemove,
  icon: Icon 
}: { 
  item: SavedItem; 
  onBook: () => void; 
  onRemove: () => void;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all">
      <div className="flex items-start space-x-4">
        {/* Image or Icon */}
        {item.image ? (
          <img 
            src={item.image} 
            alt={item.name}
            className="w-20 h-20 object-cover rounded-lg"
          />
        ) : (
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
            <Icon className="text-purple-600" size={32} />
          </div>
        )}

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">
                {item.name}
              </h4>
              {item.location && (
                <p className="text-xs text-gray-600 flex items-center mb-1">
                  <MapPin size={12} className="mr-1" />
                  {item.location}
                </p>
              )}
              {item.date && (
                <p className="text-xs text-gray-600 flex items-center">
                  <Calendar size={12} className="mr-1" />
                  {item.date}
                </p>
              )}
            </div>
            <button
              onClick={onRemove}
              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* Price & Partner */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-purple-700">{item.price}</span>
            <Badge variant="outline" className="text-xs">
              via {item.partner}
            </Badge>
          </div>

          {/* Book Button */}
          <Button
            onClick={onBook}
            size="sm"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-sm"
          >
            <ExternalLink size={14} className="mr-2" />
            Book Now on {item.partner}
          </Button>
        </div>
      </div>
    </div>
  );
}