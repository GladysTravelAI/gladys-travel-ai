'use client';

// components/AffiliateTab.tsx
// One focused tab per travel category.
// Only shows CONNECTED / APPROVED partners to users.
// Hotels & Flights show Coming Soon until affiliate accounts are approved.

import { useState, useEffect } from 'react';
import { ExternalLink, Plane, Hotel, Globe, Sparkles, ChevronRight, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { trackAffiliateClick } from '@/lib/analytics';

const SKY = '#0EA5E9';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AffiliateTabProps {
  type:           'hotels' | 'flights' | 'activities' | 'more';
  city:           string;
  country:        string;
  arrivalDate?:   string;
  departureDate?: string;
  eventName?:     string;
}

interface PartnerCard {
  id:       string;
  name:     string;
  tagline:  string;
  desc:     string;
  badge:    string;
  btnLabel: string;
  btnColor: string;
  bg:       string;
  border:   string;
  url:      string;
  Logo:     React.FC;
}

// ── Logo SVGs ─────────────────────────────────────────────────────────────────

const YesimLogo = () => (
  <svg viewBox="0 0 100 24" className="h-5 w-auto">
    <rect x="0" y="1" width="22" height="22" rx="4" fill="#6C47FF"/>
    <text x="4" y="16" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="11" fill="white">eSIM</text>
    <text x="28" y="18" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="15" fill="#6C47FF">Yesim</text>
  </svg>
);

const AiraloLogo = () => (
  <svg viewBox="0 0 100 24" className="h-5 w-auto">
    <rect x="0" y="1" width="22" height="22" rx="4" fill="#E84393"/>
    <text x="4" y="16" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="10" fill="white">eSIM</text>
    <text x="28" y="18" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="15" fill="#E84393">Airalo</text>
  </svg>
);

const KiwitaxiLogo = () => (
  <svg viewBox="0 0 120 24" className="h-5 w-auto">
    <rect x="0" y="1" width="22" height="22" rx="4" fill="#FFA500"/>
    <text x="6" y="16" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="12" fill="white">KT</text>
    <text x="28" y="18" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="14" fill="#FFA500">Kiwitaxi</text>
  </svg>
);

const GetTransferLogo = () => (
  <svg viewBox="0 0 140 24" className="h-5 w-auto">
    <rect x="0" y="1" width="22" height="22" rx="4" fill="#FF6B35"/>
    <text x="4" y="16" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="10" fill="white">GT</text>
    <text x="28" y="18" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="13" fill="#FF6B35">GetTransfer.com</text>
  </svg>
);

const AirHelpLogo = () => (
  <svg viewBox="0 0 110 24" className="h-5 w-auto">
    <rect x="0" y="1" width="22" height="22" rx="4" fill="#1B6CF2"/>
    <text x="4" y="16" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="10" fill="white">AH</text>
    <text x="28" y="18" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="14" fill="#1B6CF2">AirHelp</text>
  </svg>
);

const EktaLogo = () => (
  <svg viewBox="0 0 90 24" className="h-5 w-auto">
    <rect x="0" y="1" width="22" height="22" rx="4" fill="#00B4A2"/>
    <text x="4" y="16" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="11" fill="white">EK</text>
    <text x="28" y="18" fontFamily="Arial,sans-serif" fontWeight="bold" fontSize="15" fill="#00B4A2">EKTA</text>
  </svg>
);

// ── Build cards — only approved partners ──────────────────────────────────────

function buildCards(
  type: AffiliateTabProps['type'],
  city: string,
  country: string,
): PartnerCard[] {
  const cs = encodeURIComponent(city);

  if (type === 'activities') return [
    {
      id: 'kiwitaxi', name: 'Kiwitaxi', Logo: KiwitaxiLogo,
      tagline:  'Airport transfers in 100+ countries',
      desc:     `Pre-book your airport transfer in ${city} — English-speaking drivers, fixed prices, no surprises.`,
      badge:    'Transfers',
      btnLabel: 'Book Transfer',
      btnColor: '#FFA500',
      bg: '#FFFBEB', border: '#FDE68A',
      url: `https://kiwitaxi.com/?utm_source=gladystravel&city=${cs}`,
    },
    {
      id: 'gettransfer', name: 'GetTransfer.com', Logo: GetTransferLogo,
      tagline:  'Long-distance trips & cab rides',
      desc:     `Book transfers, long-distance trips and cab rides in ${city} at attractive prices.`,
      badge:    'Transfers',
      btnLabel: 'Find a Ride',
      btnColor: '#FF6B35',
      bg: '#FFF7ED', border: '#FED7AA',
      url: `https://gettransfer.com/?utm_source=gladystravel`,
    },
  ];

  if (type === 'more') return [
    {
      id: 'yesim', name: 'Yesim eSIM', Logo: YesimLogo,
      tagline:  'Stay connected abroad without roaming fees',
      desc:     `Get a local eSIM for ${country || 'your destination'} — instant activation, works in 100+ countries. No physical SIM needed.`,
      badge:    'eSIM',
      btnLabel: 'Get eSIM',
      btnColor: '#6C47FF',
      bg: '#F5F3FF', border: '#DDD6FE',
      url: `https://yesim.app/?utm_source=gladystravel`,
    },
    {
      id: 'airalo', name: 'Airalo eSIM', Logo: AiraloLogo,
      tagline:  'The world\'s first eSIM store',
      desc:     `Access eSIMs for 200+ countries from one app. Compare data plans before you travel.`,
      badge:    'eSIM',
      btnLabel: 'Browse eSIMs',
      btnColor: '#E84393',
      bg: '#FDF2F8', border: '#FBCFE8',
      url: `https://www.airalo.com/?utm_source=gladystravel`,
    },
    {
      id: 'airhelp', name: 'AirHelp', Logo: AirHelpLogo,
      tagline:  'Claim compensation for delayed flights',
      desc:     'If your flight was delayed or cancelled, you may be owed up to \u20ac600. AirHelp handles the claim process for you.',
      badge:    'Insurance',
      btnLabel: 'Check My Flight',
      btnColor: '#1B6CF2',
      bg: '#EFF6FF', border: '#BFDBFE',
      url: `https://www.airhelp.com/?utm_source=gladystravel`,
    },
    {
      id: 'ekta', name: 'EKTA Insurance', Logo: EktaLogo,
      tagline:  'Travel insurance made simple',
      desc:     'Comprehensive travel insurance with competitive pricing and fast claims. Covers medical, cancellation and baggage.',
      badge:    'Insurance',
      btnLabel: 'Get Insured',
      btnColor: '#00B4A2',
      bg: '#F0FDFA', border: '#99F6E4',
      url: `https://ekta.one/?utm_source=gladystravel`,
    },
  ];

  return [];
}

// ── Coming Soon — Hotels & Flights ────────────────────────────────────────────

function ComingSoon({ type }: { type: 'hotels' | 'flights' }) {
  const isHotels = type === 'hotels';
  const Icon     = isHotels ? Hotel : Plane;
  const title    = isHotels ? 'Hotels' : 'Flights';
  const subtitle = isHotels
    ? 'Direct hotel booking is coming to GladysTravel'
    : 'Direct flight search is coming to GladysTravel';
  const tip = isHotels
    ? 'Compare and book hotels at your destination with real-time pricing and free cancellation options.'
    : 'Search and compare flights from 1,200+ airlines — all in one place.';
  const features = isHotels
    ? ['Compare hundreds of hotels with real prices', 'Free cancellation on most bookings', 'Exclusive deals for event dates']
    : ['Search 1,200+ airlines at once', 'Flexible date search', 'Cheapest fare alerts'];

  return (
    <div className="flex flex-col items-center text-center py-12 px-4 space-y-6">

      <div className="relative">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-lg"
          style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
          <Icon size={38} />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
          <span className="text-[10px] font-black text-white">!</span>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-black text-slate-900 mb-2">{title} — Coming Soon</h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">{subtitle}</p>
      </div>

      <div className="w-full max-w-xs rounded-2xl border-2 border-slate-100 bg-white p-4 text-left space-y-3">
        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">What to expect</p>
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: SKY }} />
            <span className="text-xs text-slate-600 font-medium">{f}</span>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 p-3 rounded-2xl bg-sky-50 border border-sky-100 max-w-xs text-left">
        <Sparkles size={14} className="text-sky-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-sky-700 leading-snug">{tip}</p>
      </div>

      <p className="text-xs text-slate-400">We will notify you as soon as this is live.</p>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ type }: { type: string }) {
  const msgs: Record<string, { icon: React.ReactNode; text: string }> = {
    activities: { icon: <Globe size={36} className="opacity-20" />,    text: 'Search for an event to explore activities and transfers' },
    more:       { icon: <Sparkles size={36} className="opacity-20" />, text: 'Search for an event to unlock travel tools'              },
  };
  const m = msgs[type] ?? msgs.more;
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
      {m.icon}
      <p className="font-semibold text-slate-500 text-center text-sm max-w-xs">{m.text}</p>
    </div>
  );
}

// ── Partner card ───────────────────────────────────────────────────────────────

function PartnerCardItem({ card, index }: { card: PartnerCard; index: number }) {
  const handleClick = () => {
    trackAffiliateClick({ partner: card.name, type: card.badge, eventName: '', city: '' });
    window.open(card.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex flex-col justify-between rounded-2xl p-4 border-2 transition-all hover:shadow-md"
      style={{ background: card.bg, borderColor: card.border }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <card.Logo />
        <span className="text-[10px] font-black px-2 py-1 rounded-full bg-white/80 text-slate-500 flex-shrink-0">
          {card.badge}
        </span>
      </div>
      <p className="text-xs font-bold text-slate-700 mb-1">{card.tagline}</p>
      <p className="text-xs text-slate-500 leading-relaxed mb-3 flex-1">{card.desc}</p>
      <button
        onClick={handleClick}
        className="w-full h-9 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90 active:scale-[0.97]"
        style={{ background: card.btnColor }}
      >
        {card.btnLabel} <ExternalLink size={11} />
      </button>
    </motion.div>
  );
}

// ── Explore City (Activities tab only) ────────────────────────────────────────

function ExploreCitySection({ city }: { city: string }) {
  const [data,    setData]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [active,  setActive]  = useState(0);

  useEffect(() => {
    if (!city) return;
    setLoading(true);
    setError('');
    fetch(`/api/explore-city?city=${encodeURIComponent(city)}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.categories?.length) setData(d.categories);
        else setError(d.error || 'No places found for this city.');
      })
      .catch(() => setError('Could not load places.'))
      .finally(() => setLoading(false));
  }, [city]);

  if (!city) return null;

  return (
    <div className="mt-4 rounded-2xl border-2 border-slate-100 overflow-hidden bg-white">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50">
        <Globe size={16} style={{ color: SKY }} />
        <div>
          <p className="text-sm font-black text-slate-900">Explore {city}</p>
          <p className="text-xs text-slate-400">Restaurants · Attractions · Nightlife · Shopping</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
          <div className="w-4 h-4 border-2 border-slate-200 border-t-sky-400 rounded-full animate-spin" />
          <span className="text-sm">Loading places in {city}...</span>
        </div>
      )}

      {error && !loading && (
        <p className="text-sm text-slate-400 text-center px-4 py-8">{error}</p>
      )}

      {!loading && data.length > 0 && (
        <>
          <div className="flex gap-1 p-2 overflow-x-auto border-b border-slate-50">
            {data.map((cat: any, i: number) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0"
                style={active === i
                  ? { background: SKY, color: 'white' }
                  : { background: '#F1F5F9', color: '#64748B' }
                }
              >
                <span>{cat.emoji}</span>
                {cat.label}
                <span className="text-[10px] opacity-60">({cat.places.length})</span>
              </button>
            ))}
          </div>

          <div className="px-3 py-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(data[active]?.places ?? []).map((p: any) => (
              <a
                key={p.id}
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-sky-50 border border-transparent hover:border-sky-200 transition-all group"
              >
                {p.icon ? (
                  <img src={p.icon} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 text-base">
                    {data[active]?.emoji}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate group-hover:text-sky-700">{p.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{p.address}</p>
                  {p.distance && (
                    <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                      <MapPin size={8} />{p.distance}
                    </p>
                  )}
                </div>
                {p.rating && (
                  <span className="text-[10px] font-black text-amber-500 flex-shrink-0">★ {p.rating}</span>
                )}
                <ChevronRight size={12} className="text-slate-300 flex-shrink-0" />
              </a>
            ))}
          </div>

          <div className="px-4 py-2.5 border-t border-slate-50">
            <p className="text-[10px] text-slate-300 text-center">Powered by Foursquare</p>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function AffiliateTab({
  type, city, country, arrivalDate, departureDate, eventName,
}: AffiliateTabProps) {

  // Hotels & Flights: Coming Soon until affiliate accounts approved
  if (type === 'hotels' || type === 'flights') {
    return <ComingSoon type={type} />;
  }

  const hasCity = !!(city?.trim());
  if (!hasCity) return <EmptyState type={type} />;

  const cards = buildCards(type, city, country);

  const TAB_INFO = {
    activities: { icon: <Globe size={18} />,    title: 'Activities',  sub: 'Transfers, tours & local experiences' },
    more:       { icon: <Sparkles size={18} />, title: 'More Tools',  sub: 'eSIM, insurance & travel extras'      },
  } as const;

  const info = TAB_INFO[type as keyof typeof TAB_INFO];

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
          {info.icon}
        </div>
        <div>
          <p className="font-black text-slate-900">{info.title} in {city}</p>
          <p className="text-xs text-slate-400">{info.sub}</p>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map((card, i) => (
          <PartnerCardItem key={card.id} card={card} index={i} />
        ))}
      </div>

      {/* Explore city — Activities tab only */}
      {type === 'activities' && <ExploreCitySection city={city} />}

      {/* Disclaimer */}
      <p className="text-[11px] text-slate-300 text-center pt-1">
        Links above are affiliate links — GladysTravel.com earns a small commission
        at no extra cost to you. Prices shown on partner sites.
      </p>
    </div>
  );
}