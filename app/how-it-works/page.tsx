'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles, Search, CalendarCheck, Users, Ticket,
  Plane, Hotel, CloudRain, AlertTriangle, MapPin, Mic,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const SKY = '#0EA5E9';

const STEPS = [
  {
    n: '1', color: SKY, icon: Search,
    title: 'Name your event or ask Gladys',
    desc: 'Type a concert, sport, or festival — or just tap the Gladys button and speak. We search Ticketmaster and global event databases simultaneously.',
    detail: [
      { icon: Search, text: 'Searches Ticketmaster and global event sources'          },
      { icon: Mic,    text: 'Voice search via Gladys — just speak naturally'           },
      { icon: MapPin, text: 'Detects your city or lets you pick from multiple venues'  },
    ],
  },
  {
    n: '2', color: '#8B5CF6', icon: Sparkles,
    title: 'AI orchestrates everything',
    desc: 'Tickets, flights, hotels, weather forecast, packing list, and a day-by-day itinerary — all built in seconds. Gladys handles flight disruptions automatically.',
    detail: [
      { icon: Ticket,        text: 'Ticket links direct from Ticketmaster'                        },
      { icon: Plane,         text: 'Flights via TravelPayouts — cheapest fares from your origin'  },
      { icon: Hotel,         text: 'Hotels near the venue — coming soon'                          },
      { icon: CloudRain,     text: 'Live 7-day weather + smart packing list'                      },
      { icon: AlertTriangle, text: 'Auto-detects cancellations and finds alternative flights'      },
    ],
  },
  {
    n: '3', color: '#F97316', icon: CalendarCheck,
    title: 'Book, coordinate, and go',
    desc: 'Every link goes directly to trusted partners. Invite your crew to a shared trip page, split costs, and chat — all in one place.',
    detail: [
      { icon: Users,         text: 'Shared group trip page with invite code'   },
      { icon: CalendarCheck, text: 'Downloadable day-by-day itinerary'         },
      { icon: MapPin,        text: 'Maps and directions to every venue'         },
    ],
  },
];

const FAQS = [
  { q: 'Is Gladys free to use?',             a: 'Yes. Searching and planning is completely free. Gladys earns a small commission when you book through our partner links — at no extra cost to you.'                                          },
  { q: 'Which events can I plan trips for?',  a: 'Any sports event, music concert, or festival worldwide. From local college games to the biggest championships — if it has tickets, Gladys can plan around it.'                              },
  { q: 'How accurate is the pricing?',        a: 'Prices are pulled live from Ticketmaster and TravelPayouts. They reflect current availability and will match what you see at checkout.'                                                     },
  { q: 'Can I plan trips with friends?',      a: 'Yes — Group Travel lets you create a shared trip page, invite friends via a 6-character code, split costs automatically, and chat in real time.'                                          },
  { q: 'What if my flight is cancelled?',     a: "Gladys monitors your flight and proactively finds alternatives. You'll get notified immediately with rebooking options."                                                                   },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white"
      style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>

      <Navbar />

      {/* ── HERO ── */}
      <section className="pt-32 pb-14 px-4 sm:px-6 text-center bg-white">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border border-slate-200 text-slate-500 bg-white shadow-sm mb-6">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: SKY }} />
              Three steps. One intelligent system.
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 mb-4 leading-tight tracking-tight">
              How <span style={{ color: SKY }}>Gladys</span> works
            </h1>
            <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
              From event search to full itinerary in seconds — powered by 13 AI tools working in parallel.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── 3 STEPS ── */}
      <section className="py-8 md:py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-5">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden hover:border-slate-200 hover:shadow-md transition-all"
              >
                <div className="h-1" style={{ background: step.color }} />
                <div className="p-5 sm:p-6 md:p-8">
                  <div className="flex gap-4 md:gap-6 items-start">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-black text-xl md:text-2xl shadow-md"
                      style={{ background: step.color }}>
                      {step.n}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 mb-2">{step.title}</h2>
                      <p className="text-sm sm:text-base text-slate-500 leading-relaxed mb-4">{step.desc}</p>
                      <div className="space-y-2">
                        {step.detail.map((d, j) => {
                          const DIcon = d.icon;
                          return (
                            <div key={j} className="flex items-center gap-2.5 text-sm text-slate-600">
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: step.color + '15' }}>
                                <DIcon size={12} style={{ color: step.color }} />
                              </div>
                              {d.text}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 md:py-20 px-4 sm:px-6 bg-slate-50 mt-8 border-t border-slate-100">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-10 text-center tracking-tight">
            Common questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <details key={i}
                className="group bg-white rounded-2xl border-2 border-slate-100 overflow-hidden hover:border-slate-200 transition-all">
                <summary className="flex items-center justify-between p-4 sm:p-5 cursor-pointer font-bold text-slate-900 text-sm sm:text-base list-none">
                  {faq.q}
                  <span className="ml-4 flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-open:rotate-180 transition-transform text-xs">
                    ▼
                  </span>
                </summary>
                <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm sm:text-base text-slate-500 leading-relaxed border-t border-slate-50 pt-3">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 md:py-20 px-4 sm:px-6" style={{ background: SKY }}>
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3 tracking-tight">Ready to try it?</h2>
          <p className="text-sky-100 mb-6 text-sm sm:text-base">Search any event and see a full trip plan in seconds.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/"
              className="inline-flex items-center justify-center gap-2 bg-white font-black px-7 py-3.5 rounded-2xl text-sm sm:text-base transition-opacity hover:opacity-90 active:scale-[0.97] shadow-lg"
              style={{ color: SKY }}>
              <Sparkles size={16} />Plan an event trip →
            </Link>
            <Link href="/features"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-black px-7 py-3.5 rounded-2xl text-sm sm:text-base hover:bg-white/10 transition-colors active:scale-[0.97]">
              See all features
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}