'use client';

import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Sparkles, Globe, Zap, Heart, MapPin, Mail, ArrowRight, Users, Star } from 'lucide-react';

const SKY = '#0EA5E9';
const font = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 28 },
  animate:    { opacity: 1, y: 0  },
  transition: { duration: 0.55, delay, ease: 'easeOut' as const },
});

const fadeIn = (delay = 0) => ({
  initial:    { opacity: 0 },
  animate:    { opacity: 1 },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
});

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: font }}>
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-4 sm:px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(ellipse, #0EA5E9, transparent 70%)' }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div {...fadeUp(0)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-500 mb-8 bg-white shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: SKY }} />
            Founded in Johannesburg · Built for the world
          </motion.div>

          <motion.h1 {...fadeUp(0.07)}
            className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-900 leading-[1.05] mb-6">
            Building Smarter Travel<br />
            <span style={{ color: SKY }}>for a Global Generation</span>
          </motion.h1>

          <motion.p {...fadeUp(0.14)}
            className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
            GladysTravel.com is an AI-powered travel platform designed to simplify how people plan trips around the moments that matter — from football matches and concerts to festivals and global events.
          </motion.p>

          {/* Mission statement */}
          <motion.div {...fadeUp(0.2)}
            className="inline-block px-8 py-5 rounded-2xl border-2 mx-auto"
            style={{ borderColor: `${SKY}30`, background: `${SKY}06` }}>
            <p className="text-base sm:text-lg font-bold text-slate-700 leading-relaxed">
              Our mission is simple:<br />
              <span style={{ color: SKY }}>to make travel planning smarter, faster, and more accessible for everyone.</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── THE STORY — Grandmother section ──────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 bg-slate-900 relative overflow-hidden">
        {/* Subtle texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #38BDF8 0%, transparent 50%), radial-gradient(circle at 80% 20%, #0284C7 0%, transparent 40%)' }} />

        <div className="max-w-4xl mx-auto relative">
          {/* Section label */}
          <motion.p
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-xs font-black uppercase tracking-[0.25em] mb-10 text-center"
            style={{ color: SKY }}>
            The Story Behind GladysTravel
          </motion.p>

          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Quote block */}
            <motion.div
              initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.55 }}
              className="order-2 md:order-1">

              {/* Big decorative quote */}
              <div className="text-8xl font-black leading-none mb-4 opacity-20 select-none"
                style={{ color: SKY }}>&ldquo;</div>

              <blockquote className="text-xl sm:text-2xl font-bold text-white leading-relaxed mb-6">
                Because travel isn&apos;t just about destinations — it&apos;s about people, memories, and meaningful experiences.
              </blockquote>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
                  TN
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Thabelo Nekhavhambe</p>
                  <p className="text-slate-400 text-xs">Founder, GladysTravel.com · Johannesburg, South Africa</p>
                </div>
              </div>
            </motion.div>

            {/* Story text */}
            <motion.div
              initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.55, delay: 0.1 }}
              className="order-1 md:order-2 space-y-5">

              <p className="text-slate-300 leading-relaxed">
                GladysTravel was founded by <span className="text-white font-bold">Thabelo Nekhavhambe</span>, a young entrepreneur from South Africa with a vision to transform how people experience travel.
              </p>

              <p className="text-slate-300 leading-relaxed">
                But this is more than just a tech platform — <span className="text-white font-semibold">it&apos;s personal.</span>
              </p>

              {/* Grandmother callout */}
              <div className="rounded-2xl p-5 border border-slate-700"
                style={{ background: 'rgba(14, 165, 233, 0.08)', borderColor: 'rgba(14, 165, 233, 0.2)' }}>
                <div className="flex items-start gap-3">
                  <Heart size={18} className="flex-shrink-0 mt-0.5" style={{ color: SKY }} />
                  <p className="text-slate-200 leading-relaxed text-sm">
                    The name <span className="text-white font-bold">&quot;Gladys&quot;</span> comes from his grandmother — Gladys — who raised him and had a profound impact on his life. She represents <strong className="text-white">resilience, care, and unwavering support</strong> — values that continue to shape the foundation of this company.
                  </p>
                </div>
              </div>

              <p className="text-slate-300 leading-relaxed">
                GladysTravel was created to honour her legacy and to carry forward that same sense of care into the way people experience the world.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <motion.p
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="text-xs font-black uppercase tracking-[0.2em] mb-3" style={{ color: SKY }}>
              What We Bring Together
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.45 }}
              className="text-3xl sm:text-4xl font-black text-slate-900">
              Everything in one place. One search.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              transition={{ delay: 0.1 }} className="text-slate-500 mt-3 max-w-xl mx-auto leading-relaxed">
              Instead of searching across multiple websites, GladysTravel brings everything into one place — tailored to your destination and event.
            </motion.p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '✈️', label: 'Flights',     desc: 'Find and compare flights to your event destination' },
              { icon: '🏨', label: 'Hotels',       desc: 'Hotels near the venue, matched to your budget'       },
              { icon: '📅', label: 'Itineraries',  desc: 'Day-by-day plans in Gladys AI voice — real and vivid' },
              { icon: '📍', label: 'Experiences',  desc: 'Local restaurants, attractions and hidden gems'       },
            ].map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}
                className="p-5 rounded-2xl border-2 border-slate-100 bg-white hover:border-sky-200 hover:shadow-md transition-all text-center">
                <div className="text-3xl mb-3">{item.icon}</div>
                <p className="font-black text-slate-900 mb-1">{item.label}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT WE'RE BUILDING ──────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6" style={{ background: '#F8FAFC' }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <p className="text-xs font-black uppercase tracking-[0.2em] mb-4" style={{ color: SKY }}>
                What We&apos;re Building
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-6 leading-tight">
                More than a travel website.
              </h2>
              <p className="text-slate-500 leading-relaxed mb-6">
                We are building a platform where global events become accessible to anyone, anywhere — where planning a trip feels as natural as having a conversation.
              </p>
              <p className="text-slate-500 leading-relaxed">
                As we grow, our goal is to become the go-to platform for event-based travel worldwide — connecting millions of people to experiences they&apos;ll never forget.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-3">
              {[
                { icon: <Zap size={16} />,     text: 'Travelers can plan complete trips in seconds'              },
                { icon: <Sparkles size={16} />, text: 'Experiences are personalized through AI'                  },
                { icon: <Globe size={16} />,   text: 'Global events become accessible to anyone, anywhere'       },
                { icon: <Heart size={16} />,   text: 'Every journey feels seamless and intentional'              },
                { icon: <Users size={16} />,   text: 'Group trips planned together, not across five group chats' },
              ].map((item, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.07 }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #38BDF8, #0284C7)' }}>
                    {item.icon}
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{item.text}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── LOOKING AHEAD ────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6" style={{ background: SKY }}>
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <Star size={32} className="text-white/60 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
              This is just the beginning.
            </h2>
            <p className="text-sky-100 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
              GladysTravel is being built with a long-term vision: to redefine travel through technology, personalization, and human-centered design — while staying rooted in the values that inspired its name.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white font-black text-slate-900 text-sm hover:bg-sky-50 transition-colors shadow-lg">
                <Sparkles size={16} style={{ color: SKY }} />
                Plan your trip now
              </Link>
              <a href="mailto:contact@gladystravel.com"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/30 text-white font-bold text-sm hover:bg-white/10 transition-colors">
                <Mail size={16} />
                Get in touch
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CONTACT FOOTER ────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm text-slate-400 mb-4">Questions, partnerships or press enquiries</p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            <a href="mailto:contact@gladystravel.com" className="flex items-center gap-2 hover:text-slate-900 transition-colors">
              <Mail size={14} style={{ color: SKY }} />contact@gladystravel.com
            </a>
            <span className="flex items-center gap-2">
              <MapPin size={14} style={{ color: SKY }} />Johannesburg, South Africa
            </span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}