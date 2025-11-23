import { Plane, Hotel, Calendar, MapPin, Star, TrendingUp, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TripPreviewProps {
  destination: string;
  flights: any[];
  hotels: any[];
  startDate?: Date | null;
  endDate?: Date | null;
  onViewDetails: () => void;
}

export default function TripPreview({ 
  destination, 
  flights, 
  hotels, 
  startDate, 
  endDate,
  onViewDetails 
}: TripPreviewProps) {
  // Get airline logos from CDN
  const getAirlineLogo = (airline: string) => {
    const logos: { [key: string]: string } = {
      'Emirates': 'https://images.kiwi.com/airlines/64/EK.png',
      'Qatar Airways': 'https://images.kiwi.com/airlines/64/QR.png',
      'Turkish Airlines': 'https://images.kiwi.com/airlines/64/TK.png',
      'British Airways': 'https://images.kiwi.com/airlines/64/BA.png',
      'Air France': 'https://images.kiwi.com/airlines/64/AF.png',
      'Lufthansa': 'https://images.kiwi.com/airlines/64/LH.png',
      'South African Airways': 'https://images.kiwi.com/airlines/64/SA.png',
    };
    return logos[airline] || 'https://via.placeholder.com/64?text=' + airline.charAt(0);
  };

  const topFlight = flights[0];
  const topHotel = hotels[0];

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="overflow-hidden border-2 border-blue-200 shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-1">Your Trip to {destination}</h3>
            {startDate && endDate && (
              <div className="flex items-center space-x-2 text-white/80">
                <Calendar size={16} />
                <span className="text-sm">
                  {formatDate(startDate)} — {formatDate(endDate)}
                </span>
              </div>
            )}
          </div>
          <Badge className="bg-white/20 text-white border-white/30">
            <Sparkles size={14} className="mr-1" />
            AI Curated
          </Badge>
        </div>
      </div>

      {/* Preview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
        {/* Top Flight */}
        {topFlight && (
          <div className="p-6 bg-blue-50/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Plane className="text-white" size={20} />
              </div>
              <h4 className="font-bold text-gray-800">Featured Flight</h4>
            </div>

            <div className="flex items-center space-x-4 mb-4">
              <img 
                src={getAirlineLogo(topFlight.airline)}
                alt={topFlight.airline}
                className="w-16 h-16 object-contain bg-white rounded-lg p-2 shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=' + topFlight.airline.charAt(0);
                }}
              />
              <div className="flex-1">
                <p className="font-bold text-gray-800">{topFlight.airline}</p>
                <p className="text-sm text-gray-600">{topFlight.flightNumber}</p>
                <Badge variant="outline" className="mt-1 text-xs">
                  {topFlight.stops}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-gray-200">
              <div className="text-center">
                <p className="text-xs text-gray-500">Depart</p>
                <p className="font-bold text-gray-800">{topFlight.departTime}</p>
              </div>
              <div className="flex-1 mx-4">
                <div className="h-px bg-gray-300 relative">
                  <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600 bg-blue-50 p-1 rounded-full" size={20} />
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Arrive</p>
                <p className="font-bold text-gray-800">{topFlight.arriveTime}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-600">${topFlight.price}</span>
              <span className="text-xs text-gray-500">per person</span>
            </div>
          </div>
        )}

        {/* Top Hotel */}
        {topHotel && (
          <div className="p-6 bg-green-50/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Hotel className="text-white" size={20} />
              </div>
              <h4 className="font-bold text-gray-800">Featured Hotel</h4>
            </div>

            <div className="mb-4">
              {topHotel.image && (
                <img 
                  src={topHotel.image}
                  alt={topHotel.name}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
              )}
              <div>
                <h5 className="font-bold text-gray-800 mb-1">{topHotel.name}</h5>
                <div className="flex items-center space-x-2 mb-2">
                  {topHotel.rating && (
                    <div className="flex items-center space-x-1">
                      <Star className="text-yellow-500 fill-yellow-500" size={14} />
                      <span className="text-sm font-semibold text-gray-700">{topHotel.rating}</span>
                    </div>
                  )}
                  {topHotel.location && (
                    <div className="flex items-center space-x-1 text-gray-500">
                      <MapPin size={12} />
                      <span className="text-xs">{topHotel.location}</span>
                    </div>
                  )}
                </div>
                {topHotel.amenities && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {topHotel.amenities.slice(0, 3).map((amenity: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-green-600">${topHotel.price || 150}</span>
                <span className="text-xs text-gray-500 ml-1">/ night</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Events & Experiences (if available) */}
      <div className="bg-amber-50 p-4 border-t border-amber-100">
        <div className="flex items-center space-x-2 mb-2">
          <TrendingUp className="text-amber-600" size={16} />
          <span className="text-sm font-semibold text-amber-800">Happening During Your Visit</span>
        </div>
        <p className="text-xs text-amber-700">
          Check local events and festivals happening in {destination} during your travel dates
        </p>
      </div>

      {/* Action Footer */}
      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-600">
            Total from: <span className="text-2xl font-bold text-gray-800 ml-2">
              ${(topFlight?.price || 0) + ((topHotel?.price || 150) * 7)}
            </span>
          </div>
        </div>
        <Button 
          onClick={onViewDetails}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-6 text-lg font-semibold"
        >
          View Full Itinerary & Book
        </Button>
      </div>
    </Card>
  );
}