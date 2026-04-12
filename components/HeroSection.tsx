"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight, Search, Mic, Trophy, Music2, Sparkles, Users, Bookmark } from "lucide-react";
import { fetchImages } from "@/lib/imageSearch";
import type { PlaceImage } from "@/lib/Image";

interface HeroSectionProps {
  destination?: string;
  onSearch?: (query: string) => void;
  onCategorySelect?: (category: string) => void;
}

const CATEGORIES = [
  { id: "sports", label: "Sports", icon: Trophy },
  { id: "music", label: "Music", icon: Music2 },
  { id: "festivals", label: "Festivals", icon: Sparkles },
];

const SkeletonLoader = () => (
  <div className="relative w-full h-[480px] md:h-[560px] rounded-3xl overflow-hidden bg-[#0a0a0a]">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />
  </div>
);

// ─── Main Export ────────────────────────────────────────────────────────────
const HeroSection: React.FC<HeroSectionProps> = ({
  destination,
  onSearch,
  onCategorySelect,
}) => {
  const [images, setImages] = useState<PlaceImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [searchValue, setSearchValue] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, 120]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.4]);

  // ── Image Fetching ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!destination) { setLoading(false); return; }
    const load = async () => {
      setLoading(true); setImages([]); setCurrentIndex(0);
      try { setImages(await fetchImages(destination)); }
      catch (e) { console.error("Hero image error:", e); }
      finally { setLoading(false); }
    };
    load();
  }, [destination]);

  // ── Autoplay ───────────────────────────────────────────────────────────
  const resetAutoplay = () => {
    if (timeoutRef.current) clearInterval(timeoutRef.current);
    if (images.length > 1) {
      timeoutRef.current = setInterval(() => {
        setDirection("next");
        setCurrentIndex((p) => (p + 1) % images.length);
      }, 6000);
    }
  };
  useEffect(() => { resetAutoplay(); return () => { if (timeoutRef.current) clearInterval(timeoutRef.current); }; }, [images]);

  const handlePrev = () => { setDirection("prev"); setCurrentIndex((p) => (p === 0 ? images.length - 1 : p - 1)); resetAutoplay(); };
  const handleNext = () => { setDirection("next"); setCurrentIndex((p) => (p + 1) % images.length); resetAutoplay(); };
  const handleDragEnd = (_: any, info: any) => { if (info.offset.x > 80) handlePrev(); else if (info.offset.x < -80) handleNext(); };

  const slideVariants = {
    enter: (d: "next" | "prev") => ({ x: d === "next" ? "100%" : "-100%", opacity: 0, scale: 1.04 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: "next" | "prev") => ({ x: d === "next" ? "-100%" : "100%", opacity: 0, scale: 0.97 }),
  };

  // ── No destination state (main landing) ───────────────────────────────
  if (!destination) {
    return (
      <LandingHero
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        onSearch={onSearch}
        onCategorySelect={onCategorySelect}
      />
    );
  }

  // ── Destination image carousel ─────────────────────────────────────────
  return (
    <section className="relative w-full py-10 md:py-16 bg-[#050505]">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 md:mb-14"
        >
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#6ee7b7] mb-3">
            Destination
          </p>
          <h2
            className="text-4xl md:text-6xl lg:text-7xl font-black tracking-[-0.03em] text-white leading-[0.95]"
            style={{ fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif" }}
          >
            {destination}
          </h2>
        </motion.div>

        {loading && <SkeletonLoader />}

        {!loading && images.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="relative w-full h-[480px] rounded-3xl bg-[#111] flex items-center justify-center border border-white/5"
          >
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-white/5 flex items-center justify-center">
                <Search size={22} className="text-white/30" />
              </div>
              <p className="text-white/40 text-base font-medium">
                {destination ? "Loading visuals…" : "Search for a destination"}
              </p>
            </div>
          </motion.div>
        )}

        {!loading && images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            style={{ y: heroY, opacity: heroOpacity }}
          >
            <div
              onMouseEnter={() => timeoutRef.current && clearInterval(timeoutRef.current)}
              onMouseLeave={resetAutoplay}
              className="relative w-full h-[480px] md:h-[580px] group"
            >
              <div className="relative w-full h-full overflow-hidden rounded-3xl bg-black">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  <motion.div
                    key={currentIndex}
                    className="absolute inset-0"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ x: { type: "spring", stiffness: 280, damping: 32, mass: 0.9 }, opacity: { duration: 0.35 }, scale: { duration: 0.6 } }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.04}
                    onDragEnd={handleDragEnd}
                  >
                    <Image
                      src={images[currentIndex].url}
                      alt={destination}
                      fill
                      style={{ objectFit: "cover" }}
                      priority={currentIndex === 0}
                      className="select-none"
                      quality={95}
                    />
                    {/* Cinematic vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
                  </motion.div>
                </AnimatePresence>

                {/* Nav Buttons */}
                {[{ side: "left", label: "Previous", icon: ChevronLeft, fn: handlePrev }, { side: "right", label: "Next", icon: ChevronRight, fn: handleNext }].map(({ side, label, icon: Icon, fn }) => (
                  <button
                    key={side}
                    onClick={fn}
                    aria-label={label}
                    className={`absolute top-1/2 ${side === "left" ? "left-5" : "right-5"} -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 backdrop-blur-xl text-white border border-white/10 opacity-0 group-hover:opacity-100 hover:bg-black/60 active:scale-95 transition-all duration-200 flex items-center justify-center z-20`}
                  >
                    <Icon size={20} strokeWidth={2.5} />
                  </button>
                ))}

                {/* Progress pills */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setCurrentIndex(idx); resetAutoplay(); }}
                      aria-label={`Image ${idx + 1}`}
                    >
                      <div className={`h-[3px] rounded-full transition-all duration-400 ${idx === currentIndex ? "w-7 bg-white" : "w-[3px] bg-white/35 hover:bg-white/60"}`} />
                    </button>
                  ))}
                </div>

                {/* Counter */}
                <div className="absolute bottom-6 right-6 text-white/60 text-xs font-medium tabular-nums opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  {currentIndex + 1}/{images.length}
                </div>

                {images[currentIndex].attributions && (
                  <div
                    className="absolute top-5 right-5 px-3 py-1 bg-black/30 backdrop-blur-xl text-white/50 rounded-full text-[10px] z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                    dangerouslySetInnerHTML={{ __html: images[currentIndex].attributions }}
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700;12..96,800;12..96,900&display=swap');
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
      `}</style>
    </section>
  );
};

// ─── Landing Hero (No destination — main homepage) ───────────────────────────
interface LandingHeroProps {
  searchValue: string;
  setSearchValue: (v: string) => void;
  activeCategory: string | null;
  setActiveCategory: (v: string | null) => void;
  onSearch?: (query: string) => void;
  onCategorySelect?: (category: string) => void;
}

const LandingHero: React.FC<LandingHeroProps> = ({
  searchValue, setSearchValue, activeCategory, setActiveCategory, onSearch, onCategorySelect
}) => {
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim() && onSearch) onSearch(searchValue.trim());
  };

  const handleCategory = (id: string) => {
    const next = activeCategory === id ? null : id;
    setActiveCategory(next);
    if (next && onCategorySelect) onCategorySelect(next);
  };

  const stagger = (i: number) => ({ delay: 0.1 + i * 0.08 });

  return (
    <section className="relative w-full min-h-[100svh] bg-[#050505] flex flex-col overflow-hidden">
      {/* ── Background texture ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radial glow — top center */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-[#1a3a5c]/25 blur-[120px]" />
        {/* Bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-[300px] bg-gradient-to-t from-[#0a1628]/60 to-transparent" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-5 pt-24 pb-16 text-center">

        {/* Status pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl mb-10"
        >
          <span className="relative flex h-[7px] w-[7px]">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6ee7b7] opacity-75" />
            <span className="relative inline-flex rounded-full h-[7px] w-[7px] bg-[#6ee7b7]" />
          </span>
          <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-white/50">
            Live Event Intelligence · 13 AI Tools Active
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          className="mb-6"
        >
          <h1
            className="text-[clamp(2.8rem,8vw,6rem)] font-black tracking-[-0.035em] leading-[0.92] text-white"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            You pick the event.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] via-[#6ee7b7] to-[#38bdf8] bg-[length:200%] animate-[gradientShift_4s_linear_infinite]">
              We build the trip.
            </span>
          </h1>
        </motion.div>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="text-[15px] md:text-[17px] text-white/40 max-w-[420px] leading-[1.65] mb-12 font-normal"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          One search finds your tickets, flights, hotels, and complete itinerary. Or just ask Gladys.
        </motion.p>

        {/* Category pills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.22 }}
          className="flex items-center gap-2.5 mb-5"
        >
          <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-white/25 mr-1">
            Browse
          </span>
          {CATEGORIES.map(({ id, label, icon: Icon }, i) => {
            const active = activeCategory === id;
            return (
              <motion.button
                key={id}
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={stagger(i)}
                onClick={() => handleCategory(id)}
                className={`group inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-200 ${
                  active
                    ? "bg-white text-[#050505] shadow-[0_0_24px_rgba(255,255,255,0.15)]"
                    : "bg-white/[0.06] text-white/60 border border-white/[0.08] hover:bg-white/[0.10] hover:text-white/80 hover:border-white/[0.15]"
                }`}
              >
                <Icon size={13} strokeWidth={active ? 2.5 : 2} />
                {label}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Search bar */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.28 }}
          className="w-full max-w-[580px] mb-4"
        >
          <div
            className={`relative flex items-center rounded-2xl border transition-all duration-300 ${
              focused
                ? "bg-white/[0.07] border-white/20 shadow-[0_0_0_4px_rgba(56,189,248,0.08)]"
                : "bg-white/[0.05] border-white/[0.08]"
            }`}
          >
            <Search
              size={18}
              className={`absolute left-5 transition-colors duration-200 ${focused ? "text-white/60" : "text-white/25"}`}
              strokeWidth={2}
            />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Search any event worldwide…"
              className="w-full bg-transparent text-white placeholder:text-white/25 text-[15px] font-normal pl-12 pr-16 py-4 rounded-2xl outline-none"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            />
            <button
              type="button"
              className="absolute right-3 w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.06] hover:bg-white/[0.10] text-white/35 hover:text-white/60 transition-all duration-200"
              aria-label="Voice search"
            >
              <Mic size={15} strokeWidth={2} />
            </button>
          </div>
        </motion.form>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
          className="w-full max-w-[580px] mb-14"
        >
          <button
            onClick={() => onSearch && onSearch(searchValue)}
            className="w-full py-[15px] rounded-2xl font-bold text-[15px] tracking-[-0.01em] text-[#050505] bg-white hover:bg-white/90 active:scale-[0.98] transition-all duration-200 shadow-[0_0_40px_rgba(255,255,255,0.08)]"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Find Event Travel
          </button>
        </motion.div>

        {/* Bottom action row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex items-center gap-3"
        >
          {[
            { icon: Mic, label: "Ask Gladys" },
            { icon: Users, label: "Group Trip" },
            { icon: Bookmark, label: "Saved" },
          ].map(({ icon: Icon, label }, i) => (
            <button
              key={label}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[12px] font-semibold text-white/40 border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:text-white/60 transition-all duration-200"
            >
              <Icon size={12} strokeWidth={2} />
              {label}
            </button>
          ))}
        </motion.div>
      </div>

      {/* ── Scroll indicator ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="relative z-10 flex flex-col items-center pb-8 gap-1.5"
      >
        <span className="text-[10px] tracking-[0.18em] uppercase text-white/20 font-medium">Scroll</span>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="w-[1px] h-7 bg-gradient-to-b from-white/20 to-transparent"
        />
      </motion.div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800;12..96,900&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes gradientShift {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;