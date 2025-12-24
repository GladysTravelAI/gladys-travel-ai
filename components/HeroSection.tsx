"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchImages } from "@/lib/imageSearch";
import type { PlaceImage } from "@/lib/Image";

interface HeroSectionProps {
  destination?: string;
}

const SkeletonLoader = () => (
  <div className="relative w-full mx-auto h-[600px] md:h-[700px]">
    <div className="relative w-full h-full bg-gray-100 rounded-[2.5rem] overflow-hidden">
      {/* Minimal shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
    </div>
  </div>
);

const HeroSection: React.FC<HeroSectionProps> = ({ destination }) => {
  const [images, setImages] = useState<PlaceImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);

  // Image Fetching
  useEffect(() => {
    if (!destination) {
      setLoading(false);
      return;
    }

    const loadImages = async () => {
      setLoading(true);
      setImages([]);
      setCurrentIndex(0);
      try {
        const imgs = await fetchImages(destination);
        setImages(imgs);
      } catch (err) {
        console.error("❌ HeroSection image fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [destination]);

  // Autoplay
  const resetAutoplay = () => {
    if (timeoutRef.current) clearInterval(timeoutRef.current);
    if (images.length > 1) {
      timeoutRef.current = setInterval(() => {
        setDirection("next");
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 7000);
    }
  };

  useEffect(() => {
    resetAutoplay();
    return () => {
      if (timeoutRef.current) clearInterval(timeoutRef.current);
    };
  }, [images]);

  const handlePrev = () => {
    setDirection("prev");
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    resetAutoplay();
  };

  const handleNext = () => {
    setDirection("next");
    setCurrentIndex((prev) => (prev + 1) % images.length);
    resetAutoplay();
  };

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 100) handlePrev();
    else if (info.offset.x < -100) handleNext();
  };

  const slideVariants = {
    enter: (direction: "next" | "prev") => ({
      x: direction === "next" ? 1200 : -1200,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: "next" | "prev") => ({
      x: direction === "next" ? -1200 : 1200,
      opacity: 0,
    }),
  };

  return (
    <section className="relative w-full py-16 md:py-24 bg-white">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        
        {/* Apple-style Heading - Ultra Clean */}
        <motion.div 
          className="text-center mb-16 md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-gray-900 mb-4 leading-[1.05]">
            Discover your
            <br />
            next journey.
          </h2>
          <p className="text-xl md:text-2xl text-gray-500 font-normal max-w-2xl mx-auto leading-relaxed">
            Explore destinations with intelligence and ease.
          </p>
        </motion.div>

        {loading && <SkeletonLoader />}

        {!loading && images.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full mx-auto h-[600px] md:h-[700px]"
          >
            <div className="w-full h-full bg-gray-50 rounded-[2.5rem] flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gray-200 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  {destination || "Choose a destination"}
                </h3>
                <p className="text-lg text-gray-500">
                  {destination 
                    ? "Loading beautiful views..." 
                    : "Search for a destination to begin"}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {!loading && images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            style={{ y }}
          >
            <div
              onMouseEnter={() => timeoutRef.current && clearInterval(timeoutRef.current)}
              onMouseLeave={resetAutoplay}
              className="relative w-full h-[600px] md:h-[700px] group"
            >
              {/* Main Image Container */}
              <div className="relative w-full h-full overflow-hidden rounded-[2.5rem] bg-black shadow-2xl">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  <motion.div
                    key={currentIndex}
                    className="absolute inset-0"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { 
                        type: "spring", 
                        stiffness: 300, 
                        damping: 30,
                        mass: 0.8
                      },
                      opacity: { duration: 0.4 }
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.05}
                    onDragEnd={handleDragEnd}
                  >
                    <Image
                      src={images[currentIndex].url}
                      alt={`${destination}`}
                      fill
                      style={{ objectFit: "cover" }}
                      priority={currentIndex === 0}
                      className="select-none"
                      quality={95}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons - Apple Minimal */}
                <motion.button
                  onClick={handlePrev}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-1/2 left-6 -translate-y-1/2 w-12 h-12 bg-white/95 backdrop-blur-2xl text-gray-900 rounded-full opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center z-20 shadow-lg"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={22} strokeWidth={2} />
                </motion.button>
                
                <motion.button
                  onClick={handleNext}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-1/2 right-6 -translate-y-1/2 w-12 h-12 bg-white/95 backdrop-blur-2xl text-gray-900 rounded-full opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center z-20 shadow-lg"
                  aria-label="Next image"
                >
                  <ChevronRight size={22} strokeWidth={2} />
                </motion.button>

                {/* Progress Indicators - Minimal Pills */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentIndex(idx);
                        resetAutoplay();
                      }}
                      className="group/dot"
                      aria-label={`Go to image ${idx + 1}`}
                    >
                      <div className={`h-[3px] rounded-full transition-all duration-300 ${
                        idx === currentIndex 
                          ? 'w-8 bg-white' 
                          : 'w-[3px] bg-white/50 group-hover/dot:bg-white/75 group-hover/dot:w-5'
                      }`} />
                    </button>
                  ))}
                </div>

                {/* Image Counter - Minimal */}
                <div className="absolute bottom-8 right-8 px-4 py-2 bg-black/30 backdrop-blur-xl text-white/90 rounded-full text-sm font-medium z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {currentIndex + 1} of {images.length}
                </div>

                {/* Attribution - Clean */}
                {images[currentIndex].attributions && (
                  <div 
                    className="absolute top-8 right-8 px-3 py-1.5 bg-black/30 backdrop-blur-xl text-white/80 rounded-full text-xs font-normal z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    dangerouslySetInnerHTML={{ __html: images[currentIndex].attributions }} 
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;