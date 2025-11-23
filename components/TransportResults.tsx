// components/TransportSection.tsx
"use client";

import { useState, useEffect } from "react";
import { Plane, Car, Train, Bus, Clock, DollarSign, Loader2, Search, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TransportOption {
  type: string;
  name: string;
  description: string;
  duration: string;
  price: number;
  currency: string;
  availability: string;
  icon: string;
}

interface TransportData {
  airport: string;
  distance: string;
  options: TransportOption[];
}

interface TransportResultsProps {
    transport: WebTransport[];
  currentDestination?: string;
}

export default function TransportResults({ currentDestination = "Paris" }: TransportResultsProps) {
  const [transportData, setTransportData] = useState<TransportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(currentDestination);
  const [error, setError] = useState<string | null>(null);

  // Auto-search when component mounts or destination changes
  useEffect(() => {
    if (currentDestination) {
      setSearchQuery(currentDestination);
      searchTransport(currentDestination);
    }
  }, [currentDestination]);

  const searchTransport = async (destination: string) => {
    if (!destination.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/transport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          destination: destination.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transport options');
      }

      const data = await response.json();
      setTransportData(data.transport || null);
    } catch (error) {
      console.error('Error fetching transport:', error);
      setError('Unable to load transport options. Please try again.');
      setTransportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchTransport(searchQuery);
  };

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      '🚆': Train,
      '🚇': Train,
      '🚌': Bus,
      '🚕': Car,
      '🚗': Car,
      '📱': Car,
      '🚄': Train,
      '⛵': Car,
      '🚙': Car
    };
    const IconComponent = icons[iconName] || Car;
    return <IconComponent size={24} className="text-blue-600" />;
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'ZAR': 'R',
      'AED': 'د.إ'
    };
    return symbols[currency] || currency;
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Search Bar */}
      <div className="mb-8">
        <div className="flex gap-3 max-w-2xl">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search destination (e.g., Paris, Dubai, Tokyo)..."
              className="pl-10 h-12"
            />
          </div>
          <Button 
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            className="h-12 px-8 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Search'}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
          <p className="text-gray-600">Loading transport options for {searchQuery}...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">⚠️ {error}</div>
          <Button onClick={() => searchTransport(searchQuery)} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && !transportData && (
        <div className="text-center py-16 text-gray-500">
          <Car className="mx-auto mb-4 text-gray-400" size={64} />
          <p className="text-xl font-semibold mb-2">Search for a destination to see transport options</p>
          <p className="text-sm">Try: Paris, Dubai, Tokyo, New York, Cape Town</p>
        </div>
      )}

      {/* Transport Data */}
      {!loading && transportData && (
        <>
          {/* Airport Info Header */}
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-600 rounded-xl">
                <Plane className="text-white" size={32} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Airport Transfer - {searchQuery}
                </h2>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin size={18} />
                    <span className="font-medium">{transportData.airport}</span>
                  </div>
                  <Badge variant="outline" className="font-medium">
                    {transportData.distance}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Transport Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {transportData.options.map((option, index) => (
              <Card 
                key={index}
                className="p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300"
              >
                {/* Icon and Type */}
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    {getIconComponent(option.icon)}
                  </div>
                  <Badge className="bg-blue-600">
                    {option.type}
                  </Badge>
                </div>

                {/* Name and Description */}
                <h3 className="font-bold text-lg text-gray-800 mb-2">
                  {option.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {option.description}
                </p>

                {/* Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={16} />
                      <span>Duration</span>
                    </div>
                    <span className="font-semibold text-gray-800">{option.duration}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <DollarSign size={16} />
                      <span>Price</span>
                    </div>
                    <span className="font-semibold text-gray-800">
                      {getCurrencySymbol(option.currency)}{option.price}
                    </span>
                  </div>
                </div>

                {/* Availability */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Available:</span>
                    <span className="text-xs font-medium text-gray-700">{option.availability}</span>
                  </div>
                </div>

                {/* Book Button */}
                <Button 
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    // Open Google Maps or booking site
                    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(option.name + ' ' + searchQuery)}`;
                    window.open(searchUrl, '_blank');
                  }}
                >
                  More Info
                </Button>
              </Card>
            ))}
          </div>

          {/* Tips Section */}
          <div className="mt-8 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-2xl">
            <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
              💡 Travel Tips for {searchQuery}
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Book airport transfers in advance for better rates</li>
              <li>• Consider traffic conditions during peak hours (7-9 AM, 5-7 PM)</li>
              <li>• Public transport is usually the most cost-effective option</li>
              <li>• Keep some local currency for taxi or bus fares</li>
              <li>• Download offline maps before your trip</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}