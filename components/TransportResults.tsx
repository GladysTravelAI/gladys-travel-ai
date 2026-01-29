"use client";

import { useState } from "react";
import { Car, Clock, DollarSign, MapPin } from "lucide-react";

interface TransportOption {
  type: string;
  name: string;
  description: string;
  duration: string;
  price: number;
  currency: string;
  availability: string;
}

interface TransportData {
  airport: string;
  distance: string;
  options: TransportOption[];
}

interface TransportResultsProps {
  transport?: TransportData | null;
  destination?: string;
}

export default function TransportResults({ transport, destination = "your destination" }: TransportResultsProps) {

  if (!transport) {
    return (
      <div className="text-center py-12">
        <Car className="mx-auto mb-4 text-gray-300" size={64} />
        <p className="text-xl font-semibold text-gray-900 mb-2">No transport options</p>
        <p className="text-gray-600">Search for a destination to see transport options</p>
      </div>
    );
  }

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
    <div className="space-y-6">
      
      {/* Simple Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Getting around {destination}
        </h2>
        <div className="flex items-center gap-4 text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin size={18} />
            <span>{transport.airport}</span>
          </div>
          <span>•</span>
          <span>{transport.distance}</span>
        </div>
      </div>

      {/* Clean Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {transport.options.map((option, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-lg transition-all"
          >
            <div className="space-y-4">
              {/* Type Badge */}
              <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold">
                {option.type}
              </div>

              {/* Name & Description */}
              <div>
                <h3 className="font-bold text-xl text-gray-900 mb-2">
                  {option.name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {option.description}
                </p>
              </div>

              {/* Details */}
              <div className="space-y-2 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={14} />
                    <span>Duration</span>
                  </div>
                  <span className="font-semibold text-gray-900">{option.duration}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign size={14} />
                    <span>Price</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {getCurrencySymbol(option.currency)}{option.price}
                  </span>
                </div>

                <div className="flex justify-between text-sm pt-2">
                  <span className="text-gray-500">Available</span>
                  <span className="text-gray-700">{option.availability}</span>
                </div>
              </div>

              {/* CTA */}
              <button 
                onClick={() => {
                  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(option.name + ' ' + destination)}`;
                  window.open(searchUrl, '_blank');
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
              >
                More Info
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Simple Tip */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">Tip:</span> Book airport transfers in advance for better rates, especially during peak travel times.
        </p>
      </div>
    </div>
  );
}