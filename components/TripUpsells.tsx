// components/TripUpsells.tsx
// 💰 TRIP UPSELLS — Wires all connected TravelPayouts programs
// Yesim (eSIM), EKTA (insurance), Kiwitaxi (transfers), AirHelp, GetTransfer, Radical Storage

"use client";

import { useState } from "react";
import {
  Wifi, Shield, Car, Plane, Package, Luggage,
  ExternalLink, ChevronDown, ChevronUp, Sparkles, Zap
} from "lucide-react";

// ── TRAVELPAYOUTS MARKER ──────────────────────────────────────────────────────
// Replace with your actual marker ID from app.travelpayouts.com → Tools → Your marker
const TP_MARKER = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || '500540';

// ── LINK BUILDERS ─────────────────────────────────────────────────────────────

function yesimLink(country: string): string {
  // Yesim eSIM — 18% commission, 90 day cookie
  return `https://yesim.app/?ref=gladystravel&country=${encodeURIComponent(country)}`;
}

function airaloLink(country: string): string {
  // Airalo eSIM — 12% commission, 30 day cookie
  return `https://ref.airalo.com/gladystravel?country=${encodeURIComponent(country)}`;
}

function ektaLink(destination: string, startDate: string, endDate: string): string {
  // EKTA Insurance — 20% commission, 30 day cookie
  return `https://ekta.io/?marker=${TP_MARKER}&destination=${encodeURIComponent(destination)}&from=${startDate}&to=${endDate}`;
}

function kiwitaxiLink(city: string, date: string): string {
  // Kiwitaxi airport transfer — 9-11% commission, 30 day cookie
  return `https://kiwitaxi.com/?marker=${TP_MARKER}&city=${encodeURIComponent(city)}&date=${date}`;
}

function getTransferLink(city: string): string {
  // GetTransfer — 4-25% commission, 30 day cookie
  return `https://gettransfer.com/?marker=${TP_MARKER}&city=${encodeURIComponent(city)}`;
}

function airhelpLink(): string {
  // AirHelp — 15-16.6% commission, 45 day cookie
  return `https://www.airhelp.com/en/?marker=${TP_MARKER}`;
}

function radicalStorageLink(city: string): string {
  // Radical Storage luggage — 8% commission
  return `https://radicalstorage.com/?marker=${TP_MARKER}&city=${encodeURIComponent(city)}`;
}

// ── TYPES ─────────────────────────────────────────────────────────────────────

interface TripUpsellsProps {
  city: string;
  country: string;
  arrivalDate: string;
  departureDate: string;
  eventName: string;
  accentColor?: string;
}

interface UpsellItem {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  cta: string;
  url: string;
  commission: string;
  tag?: string;
  tagColor?: string;
  color: string;
  bg: string;
  border: string;
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function TripUpsells({
  city,
  country,
  arrivalDate,
  departureDate,
  eventName,
  accentColor = '#0EA5E9',
}: TripUpsellsProps) {
  const [expanded, setExpanded] = useState(true);

  const upsells: UpsellItem[] = [
    {
      id: 'esim',
      icon: Wifi,
      title: 'Stay Connected',
      subtitle: 'eSIM for ' + country,
      description: `Instant data in ${country}. No roaming fees. Activate before you land.`,
      cta: 'Get eSIM',
      url: yesimLink(country),
      commission: '18% back',
      tag: 'Best Value',
      tagColor: '#10B981',
      color: '#0EA5E9',
      bg: '#F0F9FF',
      border: '#BAE6FD',
    },
    {
      id: 'insurance',
      icon: Shield,
      title: 'Trip Insurance',
      subtitle: 'EKTA Travel Cover',
      description: `Event cancelled? Flight delayed? Covered from ${arrivalDate} to ${departureDate}.`,
      cta: 'Get Covered',
      url: ektaLink(country, arrivalDate, departureDate),
      commission: '20% back',
      tag: 'Recommended',
      tagColor: '#8B5CF6',
      color: '#8B5CF6',
      bg: '#F5F3FF',
      border: '#DDD6FE',
    },
    {
      id: 'transfer',
      icon: Car,
      title: 'Airport Transfer',
      subtitle: 'Private ride to ' + city,
      description: `Skip the taxi queue. Private driver waiting when you land in ${city}.`,
      cta: 'Book Transfer',
      url: kiwitaxiLink(city, arrivalDate),
      commission: '9-11% back',
      color: '#F97316',
      bg: '#FFF7ED',
      border: '#FED7AA',
    },
    {
      id: 'airhelp',
      icon: Plane,
      title: 'Flight Disruption?',
      subtitle: 'Claim up to €600',
      description: 'If your flight to the event is delayed or cancelled, AirHelp claims your compensation.',
      cta: 'Check Eligibility',
      url: airhelpLink(),
      commission: '15% back',
      tag: '🔥 Hot',
      tagColor: '#EF4444',
      color: '#EF4444',
      bg: '#FFF1F2',
      border: '#FECDD3',
    },
    {
      id: 'luggage',
      icon: Luggage,
      title: 'Luggage Storage',
      subtitle: 'Near the venue',
      description: `Store bags on event day. Explore ${city} hands-free, pick up after.`,
      cta: 'Find Storage',
      url: radicalStorageLink(city),
      commission: '8% back',
      color: '#64748B',
      bg: '#F8FAFC',
      border: '#E2E8F0',
    },
    {
      id: 'rideshare',
      icon: Package,
      title: 'Private Transfers',
      subtitle: 'GetTransfer · ' + city,
      description: `Hotel to venue and back. Book in advance, no surge pricing on event night.`,
      cta: 'Book Ride',
      url: getTransferLink(city),
      commission: '4-25% back',
      color: '#F59E0B',
      bg: '#FFFBEB',
      border: '#FDE68A',
    },
  ];

  return (
    <div className="mt-8 rounded-3xl border-2 border-slate-100 overflow-hidden bg-white">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-5 flex items-center justify-between bg-slate-50 border-b border-slate-100 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: accentColor + '15' }}>
            <Sparkles size={16} style={{ color: accentColor }} />
          </div>
          <div className="text-left">
            <p className="font-black text-slate-900 text-sm">Complete Your Trip</p>
            <p className="text-xs text-slate-400 mt-0.5">eSIM · Insurance · Transfers · More</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
            style={{ background: accentColor }}>
            6 extras
          </span>
          {expanded
            ? <ChevronUp size={16} className="text-slate-400" />
            : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </button>

      {/* Grid */}
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {upsells.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col p-5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: item.bg, border: `1.5px solid ${item.border}` }}>
                    <Icon size={17} style={{ color: item.color }} />
                  </div>
                  {item.tag && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ background: item.tagColor }}>
                      {item.tag}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-black text-slate-900 text-sm leading-tight">{item.title}</p>
                  <p className="text-xs font-semibold mt-0.5 mb-2" style={{ color: item.color }}>
                    {item.subtitle}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                    <Zap size={10} />{item.commission}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold transition-colors group-hover:opacity-70"
                    style={{ color: item.color }}>
                    {item.cta} <ExternalLink size={10} />
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}