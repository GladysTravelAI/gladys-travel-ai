"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchImages } from "@/lib/imageSearch";
import type { PlaceImage } from "@/lib/Image";

interface HeroSectionProps {
  destination?: string;
}

const SkeletonLoader = () => (
  <div className="relative w-full mx-auto h-[500px] md:h-[600px]">
    <div className="w-full h-full bg-gray-100 rounded-3xl animate-pulse"></div>
  </div>
);

const HeroSection: React.FC<HeroSectionProps> = ({ destination }) => {
  const [images, setImages] = useState<PlaceImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        console.log("🌍 HeroSection images loaded:", imgs.length);
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
      }, 5000);
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
      x: direction === "next" ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: "next" | "prev") => ({
      x: direction === "next" ? -1000 : 1000,
      opacity: 0,
    }),
  };

  return (
    <section className="w-full py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Apple-style heading */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-gray-900 mb-3">
            Plan your journey.
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 font-normal">
            Discover destinations with intelligence.
          </p>
        </div>

        {loading && <SkeletonLoader />}

        {!loading && images.length === 0 && (
          <div className="relative w-full mx-auto h-[500px] md:h-[600px]">
            <div className="w-full h-full bg-gray-50 rounded-3xl flex items-center justify-center border border-gray-200">
              <p className="text-gray-400 text-lg">
                {destination ? `No images found for ${destination}` : "Choose a destination to begin"}
              </p>
            </div>
          </div>
        )}

        {!loading && images.length > 0 && (
          <div
            onMouseEnter={() => timeoutRef.current && clearInterval(timeoutRef.current)}
            onMouseLeave={resetAutoplay}
            className="relative w-full mx-auto h-[500px] md:h-[600px] overflow-hidden rounded-3xl shadow-2xl"
          >
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                className="absolute w-full h-full"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
              >
                <Image
                  src={images[currentIndex].url}
                  alt={`View of ${destination}`}
                  fill
                  style={{ objectFit: "cover" }}
                  priority={currentIndex === 0}
                  className="select-none"
                />
              </motion.div>
            </AnimatePresence>

            {/* Apple-style Navigation Buttons */}
            <button
              onClick={handlePrev}
              className="absolute top-1/2 left-4 -translate-y-1/2 w-11 h-11 bg-white/90 backdrop-blur-md text-gray-900 rounded-full hover:bg-white transition-all shadow-lg flex items-center justify-center z-10"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            <button
              onClick={handleNext}
              className="absolute top-1/2 right-4 -translate-y-1/2 w-11 h-11 bg-white/90 backdrop-blur-md text-gray-900 rounded-full hover:bg-white transition-all shadow-lg flex items-center justify-center z-10"
              aria-label="Next image"
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>

            {/* Image Counter - Apple style */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/30 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium z-10">
              {currentIndex + 1} of {images.length}
            </div>

            {/* Attribution - Apple style */}
            <div 
              className="absolute bottom-6 right-6 bg-black/30 backdrop-blur-md text-white/90 px-3 py-1.5 rounded-full text-xs font-medium z-10"
              dangerouslySetInnerHTML={{ __html: images[currentIndex].attributions }} 
            />

            {/* Progress dots - Apple style */}
            <div className="absolute bottom-6 left-6 flex gap-1.5 z-10">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    resetAutoplay();
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentIndex 
                      ? 'bg-white w-6' 
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSection;