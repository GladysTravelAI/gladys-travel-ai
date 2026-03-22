'use client';

// components/TripUpsells.tsx
// Affiliate partner cards shown at the bottom of every itinerary
// Uses real partner logos for trust + brand recognition

import { useState } from 'react';
import { ExternalLink, Plane, Hotel, Ticket, Map, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trackAffiliateClick } from '@/lib/analytics';

const SKY = '#0EA5E9';

interface Props {
  city:          string;
  country:       string;
  arrivalDate?:  string;
  departureDate?: string;
  eventName?:    string;
  accentColor?:  string;
}

// ── PARTNER LOGO SVGs ─────────────────────────────────────────────────────────
// Inline SVGs — no external image dependency, renders instantly

const BookingLogo = () => (
  <svg viewBox="0 0 120 30" className="h-5 w-auto" aria-label="Booking.com">
    <text x="0" y="22" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="20" fill="#003580">
      booking
    </text>
    <text x="72" y="22" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="20" fill="#003580">
      .
    </text>
    <text x="78" y="22" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="20" fill="#0071C2">
      com
    </text>
  </svg>
);

const SkyscannerLogo = () => (
  <svg viewBox="0 0 140 30" className="h-5 w-auto" aria-label="Skyscanner">
    <rect x="0" y="4" width="22" height="22" rx="4" fill="#0770E3"/>
    <path d="M5 20 L11 8 L17 20 M8 16 L14 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <text x="28" y="22" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="17" fill="#0770E3">
      Skyscanner
    </text>
  </svg>
);

const TicketmasterLogo = () => (
  <svg viewBox="0 0 150 30" className="h-5 w-auto" aria-label="Ticketmaster">
    <rect x="0" y="2" width="26" height="26" rx="4" fill="#026CDF"/>
    <text x="5" y="20" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="16" fill="white">TM</text>
    <text x="33" y="21" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="15" fill="#026CDF">
      Ticketmaster
    </text>
  </svg>
);

const ViatorLogo = () => (
  <svg viewBox="0 0 90 30" className="h-5 w-auto" aria-label="Viator">
    <rect x="0" y="2" width="26" height="26" rx="13" fill="#1A1A2E"/>
    <text x="6" y="20" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="13" fill="white">V</text>
    <text x="32" y="21" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="17" fill="#1A1A2E">
      Viator
    </text>
  </svg>
);

const GetYourGuideLogo = () => (
  <svg viewBox="0 0 145 30" className="h-5 w-auto" aria-label="GetYourGuide">
    <rect x="0" y="2" width="26" height="26" rx="4" fill="#FF5533"/>
    <text x="4" y="20" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="13" fill="white">GYG</text>
    <text x="32" y="21" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="14" fill="#FF5533">
      GetYourGuide
    </text>
  </svg>
);

const AgodaLogo = () => (
  <svg viewBox="0 0 100" className="h-5 w-auto" aria-label="Agoda">
    <text x="0" y="22" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="20" fill="#E3001B">
      agoda
    </text>
  </svg>
);

// ── PARTNER CARDS DATA ────────────────────────────────────────────────────────

function buildPartners(city: string, country: string, arrival?: string, departure?: string, eventName?: string) {
  const citySlug     = encodeURIComponent(city);
  const checkin      = arrival   || '';
  const checkout     = departure || '';
  const eventEncoded = encodeURIComponent(eventName || city);

  return [
    // FLIGHTS
    {
      type:     'flights' as const,
      label:    'Search Flights',
      desc:     `Find the cheapest flights to ${city}`,
      Logo:     SkyscannerLogo,
      bg:       '#EFF6FF',
      border:   '#BFDBFE',
      btnColor: '#0770E3',
      url:      `https://www.skyscanner.com/transport/flights/anywhere/${citySlug}/?utm_source=gladystravel`,
      partner:  'Skyscanner',
    },
    // HOTELS
    {
      type:     'hotels' as const,
      label:    'Find Hotels',
      desc:     `Compare hotels in ${city} for your dates`,
      Logo:     BookingLogo,
      bg:       '#EFF6FF',
      border:   '#BFDBFE',
      btnColor: '#003580',
      url:      `https://www.booking.com/searchresults.html?ss=${citySlug}${checkin ? `&checkin=${checkin}` : ''}${checkout ? `&checkout=${checkout}` : ''}&utm_source=gladystravel`,
      partner:  'Booking.com',
    },
    // TICKETS
    {
      type:     'tickets' as const,
      label:    'Get Tickets',
      desc:     `Official tickets for ${eventName || 'your event'}`,
      Logo:     TicketmasterLogo,
      bg:       '#EFF6FF',
      border:   '#BFDBFE',
      btnColor: '#026CDF',
      url:      `https://www.ticketmaster.com/search?q=${eventEncoded}&utm_source=gladystravel`,
      partner:  'Ticketmaster',
    },
    // TOURS & EXPERIENCES
    {
      type:     'tours' as const,
      label:    'Tours & Experiences',
      desc:     `Things to do in ${city} — guided tours, day trips`,
      Logo:     ViatorLogo,
      bg:       '#F5F3FF',
      border:   '#DDD6FE',
      btnColor: '#1A1A2E',
      url:      `https://www.viator.com/searchResults/all?text=${citySlug}&utm_source=gladystravel`,
      partner:  'Viator',
    },
    // ACTIVITIES
    {
      type:     'activities' as const,
      label:    'Activities & Day Trips',
      desc:     `Top-rated activities in ${city}`,
      Logo:     GetYourGuideLogo,
      bg:       '#FFF5F3',
      border:   '#FED7CC',
      btnColor: '#FF5533',
      url:      `https://www.getyourguide.com/s/?q=${citySlug}&utm_source=gladystravel`,
      partner:  'GetYourGuide',
    },
  ];
}

const TYPE_ICONS = {
  flights:    Plane,
  hotels:     Hotel,
  tickets:    Ticket,
  tours:      Map,
  activities: Map,
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export default function TripUpsells({
  city, country, arrivalDate, departureDate, eventName, accentColor,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const partners = buildPartners(city, country, arrivalDate, departureDate, eventName);

  const handleClick = (partner: string, type: string, url: string) => {
    trackAffiliateClick({ partner, type, eventName: eventName || city, city });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="rounded-3xl border-2 border-slate-100 overflow-hidden bg-white shadow-sm">

      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#F0F9FF' }}>
            <ExternalLink size={17} style={{ color: SKY }} />
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-slate-900">Book Your Trip</p>
            <p className="text-xs text-slate-400 mt-0.5">Flights · Hotels · Tickets · Activities</p>
          </div>
        </div>
        <ChevronDown
          size={16}
          className="text-slate-400 transition-transform"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 pt-4">
              {partners.map((p, i) => {
                const TypeIcon = TYPE_ICONS[p.type];
                return (
                  <motion.div
                    key={p.partner}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex flex-col justify-between rounded-2xl p-4 border-2 transition-all hover:shadow-md"
                    style={{ background: p.bg, borderColor: p.border }}
                  >
                    {/* Logo + category badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p.Logo />
                      <span className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full bg-white/70 text-slate-500">
                        <TypeIcon size={9} />
                        {p.type.charAt(0).toUpperCase() + p.type.slice(1)}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 leading-relaxed mb-3 flex-1">{p.desc}</p>

                    {/* CTA button */}
                    <button
                      onClick={() => handleClick(p.partner, p.type, p.url)}
                      className="w-full h-9 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90 active:scale-[0.97]"
                      style={{ background: p.btnColor }}
                    >
                      {p.label} <ExternalLink size={10} />
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Disclaimer */}
            <div className="px-5 py-3 border-t border-slate-100">
              <p className="text-[11px] text-slate-300 text-center">
                Links above are affiliate links — Gladys Travel earns a small commission at no extra cost to you.
                Prices shown on partner sites.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}