"use client";

import { useState, useEffect } from "react";
import {
  Shield, Check, Star, ExternalLink, ChevronDown, ChevronUp,
  AlertCircle, Loader2, Info, Plane, Calendar, Users, DollarSign
} from "lucide-react";

interface Partner {
  id: string;
  name: string;
  provider: string;
  logo: string;
  rating: number;
  reviewCount: number;
  highlights: string[];
}

interface Coverage {
  name: string;
  description: string;
  includes: string[];
  priceMultiplier: number;
}

interface InsuranceQuote {
  id: string;
  partner: Partner;
  coverageType: string;
  coverage: Coverage;
  estimatedPrice: string;
  priceValue: number;
  tripDetails: {
    destination: string;
    startDate: string;
    endDate: string;
    travelers: number;
    tripCost: number;
  };
  affiliateUrl: string;
  features: string[];
}

interface InsuranceData {
  quotes: InsuranceQuote[];
  coverageOptions: Record<string, Coverage>;
  tripSummary: {
    destination: string;
    duration: string;
    travelers: number;
    tripCost: string;
  };
  disclaimer: string;
}

interface InsuranceViewProps {
  destination?: string;
  startDate?: string;
  endDate?: string;
  travelers?: number;
  tripCost?: number;
  onSelect?: (quote: InsuranceQuote) => void;
}

export default function InsuranceView({
  destination = "",
  startDate = "",
  endDate = "",
  travelers = 1,
  tripCost = 2000,
  onSelect
}: InsuranceViewProps) {
  const [data, setData] = useState<InsuranceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCoverage, setSelectedCoverage] = useState<string>("standard");
  const [expandedQuote, setExpandedQuote] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    destination,
    startDate,
    endDate,
    travelers,
    tripCost
  });

  const fetchQuotes = async () => {
    if (!formData.destination || !formData.tripCost) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/insurance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          coverageType: selectedCoverage
        })
      });

      if (!res.ok) throw new Error("Failed to fetch quotes");
      
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load insurance quotes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (destination && tripCost) {
      fetchQuotes();
    }
  }, [selectedCoverage]);

  const handleGetQuotes = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuotes();
  };

  const toggleQuote = (quoteId: string) => {
    setExpandedQuote(expandedQuote === quoteId ? null : quoteId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trip Insurance</h1>
          <p className="text-gray-600">Protect your trip with coverage from trusted providers</p>
        </div>

        {/* Trip Details Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Trip Details</h2>
          <form onSubmit={handleGetQuotes} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Plane size={14} className="inline mr-1" />
                Destination
              </label>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder="e.g., Paris, France"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar size={14} className="inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar size={14} className="inline mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Users size={14} className="inline mr-1" />
                Travelers
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.travelers}
                onChange={(e) => setFormData({ ...formData, travelers: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign size={14} className="inline mr-1" />
                Total Trip Cost (USD)
              </label>
              <input
                type="number"
                min="100"
                step="100"
                value={formData.tripCost}
                onChange={(e) => setFormData({ ...formData, tripCost: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    Getting Quotes...
                  </span>
                ) : (
                  "Get Quotes"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Coverage Type Selector */}
        {data && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Coverage Level</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(data.coverageOptions).map(([key, coverage]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCoverage(key)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedCoverage === key
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <h3 className="font-bold text-gray-900">{coverage.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{coverage.description}</p>
                  <p className="text-xs text-green-600 font-medium">
                    ~{(coverage.priceMultiplier * 100).toFixed(0)}% of trip cost
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6 flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-red-800">Error Loading Quotes</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Loader2 className="animate-spin text-green-500 mx-auto mb-4" size={48} />
            <p className="text-gray-600">Finding the best insurance quotes...</p>
          </div>
        )}

        {/* Quotes List */}
        {data && !loading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {data.quotes.length} Quotes Found
              </h2>
              <p className="text-sm text-gray-500">
                Sorted by price: lowest first
              </p>
            </div>

            {data.quotes.map((quote, idx) => (
              <div
                key={quote.id}
                className={`bg-white rounded-2xl shadow-xl overflow-hidden border transition-all ${
                  idx === 0 ? "border-green-300 ring-2 ring-green-100" : "border-gray-100"
                }`}
              >
                {/* Best Value Badge */}
                {idx === 0 && (
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center py-1 text-sm font-semibold">
                    ✨ Best Value
                  </div>
                )}

                {/* Quote Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Shield className="text-green-600" size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{quote.partner.name}</h3>
                        <p className="text-sm text-gray-500">by {quote.partner.provider}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="text-yellow-400 fill-yellow-400" size={14} />
                          <span className="text-sm font-medium text-gray-700">
                            {quote.partner.rating}
                          </span>
                          <span className="text-sm text-gray-400">
                            ({quote.partner.reviewCount.toLocaleString()} reviews)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-600">{quote.estimatedPrice}</p>
                      <p className="text-sm text-gray-500">estimated</p>
                    </div>
                  </div>

                  {/* Quick Features */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {quote.partner.highlights.slice(0, 3).map((highlight: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full"
                      >
                        <Check size={12} className="inline mr-1" />
                        {highlight}
                      </span>
                    ))}
                  </div>

                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleQuote(quote.id)}
                    className="flex items-center gap-2 mt-4 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {expandedQuote === quote.id ? (
                      <>
                        <ChevronUp size={18} />
                        <span className="text-sm">Hide details</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown size={18} />
                        <span className="text-sm">Show coverage details</span>
                      </>
                    )}
                  </button>

                  {/* Expanded Details */}
                  {expandedQuote === quote.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        {quote.coverage.name} Coverage Includes:
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {quote.coverage.includes.map((item: string, i: number) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <Check className="text-green-500 flex-shrink-0" size={16} />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA Button */}
                  <div className="mt-6 flex gap-3">
                    <a
                      href={quote.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onSelect?.(quote)}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg text-center flex items-center justify-center gap-2"
                    >
                      Get Quote
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </div>
            ))}

            {/* Disclaimer */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-blue-700">{data.disclaimer}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!data && !loading && !error && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Shield className="text-gray-300 mx-auto mb-4" size={64} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Get Protected</h3>
            <p className="text-gray-600">
              Enter your trip details above to compare insurance quotes from top providers.
            </p>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}