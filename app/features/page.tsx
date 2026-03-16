'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles, Users, CloudRain, AlertTriangle, MapPin,
  Globe, Shield, Wifi, Luggage, TrendingUp,
  Trophy, Mic, Plane, Hotel, Search,
  ArrowRight, CheckCircle,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const SKY = '#0EA5E9';

const FEATURES = [
  { icon: Mic,           title: 'Voice + Chat AI',           desc: 'Ask Gladys anything — weather, packing, nearby restaurants, football fixtures. Responds in seconds.',                    color: SKY,       tag: 'Core'            },
  { icon: Trophy,        title: 'Football fixtures',          desc: 'Next Premier League, Champions League, La Liga and World Cup matches pulled live from API-Football.',                    color: '#10B981',  tag: 'Live data'       },
  { icon: MapPin,        title: 'Nearby places',              desc: 'Restaurants, bars, landmarks and things to do near any event venue — powered by Foursquare Places.',                     color: '#F97316',  tag: 'Live data'       },
  { icon: CloudRain,     title: 'Live weather & packing',     desc: 'Real-time 7-day forecast for your destination with a smart packing list tailored to the event type.',                    color: SKY,       tag: 'Live data'       },
  { icon: Users,         title: 'Group coordination',         desc: 'Shared trip page, invite code, group chat, and automatic cost splitting — everyone on the same page.',                    color: '#8B5CF6',  tag: 'Group travel'    },
  { icon: AlertTriangle, title: 'Flight disruption recovery', desc: 'Gladys auto-detects cancellations and delays — and immediately finds alternative flight options.',                        color: '#EF4444',  tag: 'Protection'      },
  { icon: Globe,         title: 'Cheapest city finder',       desc: 'Same artist, 5 cities — we show you the most affordable total option including flights and hotel.',                       color: '#F97316',  tag: 'Smart savings'   },
  { icon: Shield,        title: 'Trip insurance',             desc: 'Event cancelled? Travel insurance coverage integrated from the moment you confirm your trip.',                             color: '#64748B',  tag: 'Protection'      },
  { icon: Wifi,          title: 'eSIM data',                  desc: 'Arrive connected. eSIMs for 150+ countries, recommended before you land — no roaming fees.',                              color: '#06B6D4',  tag: 'Travel essential' },
  { icon: Luggage,       title: 'Luggage storage',            desc: 'Drop bags before check-in or after checkout. Storage locations near every major venue.',                                  color: '#A855F7',  tag: 'Convenience'     },
  { icon: Plane,         title: 'Flight search',              desc: 'Real-time flight search from your origin city to the event destination — with price comparison.',                         color: SKY,       tag: 'Coming soon',    soon: true },
  { icon: Hotel,         title: 'Hotel booking',              desc: 'Best-rate hotels near the venue — prioritised by proximity, guest rating, and cancellation policy.',                      color: '#8B5CF6',  tag: 'Coming soon',    soon: true },
];

const SAMPLE_TRIPS = [
  { event: 'Coachella 2026',                    category: 'Music',    where: 'Indio, CA',      nights: 4, total: 2840, saved: 23, breakdown: { Tickets: 899,  Flights: 620, Hotel: 980, Activities: 341 } },
  { event: 'North America 2026 Football Final', category: 'Sports',   where: 'New York, USA',  nights: 3, total: 3210, saved: 18, breakdown: { Tickets: 1200, Flights: 890, Hotel: 780, Activities: 340 } },
  { event: 'Rio Carnival',                      category: 'Festival', where: 'Rio de Janeiro', nights: 5, total: 2190, saved: 31, breakdown: { Tickets: 320,  Flights: 780, Hotel: 750, Activities: 340 } },
];

const catColor = (c: string) => c === 'Sports' ? SKY : c === 'Music' ? '#8B5CF6' : '#F97316';

const STEPS = [
  { n: '01', title: 'Search any event',       desc: 'Type the event name, artist, or team. Gladys finds it on Ticketmaster and builds your trip around the exact date and venue.',     icon: Search,       color: SKY       },
  { n: '02', title: 'Gladys builds the plan', desc: 'In seconds you get a full day-by-day itinerary with morning, afternoon and evening activities — written in plain language.',        icon: Sparkles,     color: '#8B5CF6' },
  { n: '03', title: 'Book what you need',     desc: 'Tickets, flights, hotels, eSIM, insurance — everything is linked. Book directly or ask Gladys to help you decide.',                icon: CheckCircle,  color: '#10B981' },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white"
      style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>
      <Navbar />

      {/* ── HERO ── */}
      <section className="pt-32 pb-16 px-4 sm:px-6 text-center bg-white">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border border-slate-200 text-slate-500 bg-white shadow-sm mb-6">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: SKY }} />
              13 AI tools · All included · No extra cost
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 mb-5 leading-tight tracking-tight">
              Built for<br /><span style={{ color: SKY }}>event travelers.</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed mb-8">
              Not for generic vacations. Every tool is designed around the reality of attending an event — before, during, and after.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-black text-white shadow-lg hover:opacity-90 transition-opacity active:scale-[0.97]"
                style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
                <Sparkles size={15} />Plan an event trip
              </Link>
              <Link href="/how-it-works"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-black text-slate-700 border-2 border-slate-200 hover:border-slate-300 transition-all active:scale-[0.97]">
                How it works <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 md:py-20 px-4 sm:px-6 bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-400 mb-3">Simple process</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              From idea to itinerary<br />in under 30 seconds
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="relative p-6 rounded-2xl border border-slate-800 bg-slate-800/50">
                  <div className="text-6xl font-black mb-4 leading-none select-none"
                    style={{ color: step.color, opacity: 0.2 }}>{step.n}</div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: step.color + '20' }}>
                    <Icon size={18} style={{ color: step.color }} />
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                  {i < STEPS.length - 1 && (
                    <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-slate-700 items-center justify-center">
                      <ArrowRight size={12} className="text-slate-400" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="py-16 md:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3">What's inside</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Every tool you need.<br />Nothing you don't.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  className={`relative p-5 rounded-2xl border-2 bg-white transition-all ${
                    f.soon
                      ? 'border-dashed border-slate-200 opacity-60'
                      : 'border-slate-100 hover:border-slate-200 hover:shadow-lg'
                  }`}>
                  {!f.soon && (
                    <div className="absolute top-0 left-5 right-5 h-0.5 rounded-b-full"
                      style={{ background: f.color, opacity: 0.5 }} />
                  )}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: f.color + '15' }}>
                      <Icon size={18} style={{ color: f.color }} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        background: f.soon ? '#F1F5F9' : f.color + '15',
                        color:      f.soon ? '#94A3B8' : f.color,
                      }}>
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-sm mb-2">{f.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SAMPLE TRIPS ── */}
      <section className="py-16 md:py-20 px-4 sm:px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Real trip examples</p>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">What Gladys builds for you</h2>
            <p className="text-slate-500 mt-2 text-sm">Click any to see the full cost breakdown</p>
          </div>
          <div className="space-y-4">
            {SAMPLE_TRIPS.map((trip, i) => {
              const color = catColor(trip.category);
              return (
                <details key={i} className="group bg-white rounded-2xl border-2 border-slate-100 overflow-hidden hover:shadow-md hover:border-slate-200 transition-all">
                  <div className="h-1" style={{ background: color }} />
                  <summary className="flex items-start justify-between p-5 cursor-pointer list-none">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
                        style={{ color, background: color + '15' }}>{trip.category}</span>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 mt-2 mb-1 leading-tight">{trip.event}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin size={10} />{trip.where} · {trip.nights} nights
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-xl sm:text-2xl font-black text-slate-900">USD {trip.total.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 mb-1">per person</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full"
                        style={{ color, background: color + '15' }}>
                        <TrendingUp size={9} />{trip.saved}% cheaper
                      </span>
                    </div>
                  </summary>
                  <div className="px-5 pb-5 border-t border-slate-50 pt-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      {Object.entries(trip.breakdown).map(([k, v]) => (
                        <div key={k} className="bg-slate-50 rounded-xl p-3">
                          <p className="font-black text-slate-900 text-base">${v}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">{k}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
          <div className="mt-6 p-5 bg-white rounded-2xl border-2 border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p className="font-black text-slate-900 text-sm">Ready to plan yours?</p>
              <p className="text-xs text-slate-400 mt-0.5">Search any event — we'll build the full trip</p>
            </div>
            <Link href="/"
              className="inline-flex items-center gap-1.5 text-sm font-black px-5 py-2.5 rounded-xl text-white shadow-md hover:opacity-90 whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
              <Sparkles size={13} />Start free →
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-12 px-4 sm:px-6 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: '13',    label: 'AI tools built in'   },
            { n: '150+',  label: 'Countries covered'   },
            { n: '< 30s', label: 'Itinerary generated' },
            { n: 'Free',  label: 'To get started'      },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-3xl sm:text-4xl font-black mb-1"
                style={{ color: i === 0 ? SKY : '#0F172A' }}>{s.n}</p>
              <p className="text-xs sm:text-sm text-slate-400 font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 md:py-20 px-4 sm:px-6" style={{ background: SKY }}>
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 tracking-tight">
            All 13 tools. Zero extra cost.
          </h2>
          <p className="text-sky-100 mb-8 text-sm sm:text-base">
            Every feature is included when you search for an event trip.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/"
              className="inline-flex items-center justify-center gap-2 bg-white font-black px-7 py-3.5 rounded-2xl text-sm transition-opacity hover:opacity-90 active:scale-[0.97] shadow-lg"
              style={{ color: SKY }}>
              <Sparkles size={16} />Plan an event trip →
            </Link>
            <Link href="/how-it-works"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-black px-7 py-3.5 rounded-2xl text-sm hover:bg-white/10 transition-colors active:scale-[0.97]">
              How it works
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}