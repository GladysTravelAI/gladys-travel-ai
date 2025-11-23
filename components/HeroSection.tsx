"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchImages } from "@/lib/imageSearch";
import type { PlaceImage } from "@/lib/Image"; // 1. IMPORT THE TYPE

interface HeroSectionProps {
  destination?: string;
}

const SkeletonLoader = () => (
  <div className="relative w-full max-w-4xl mx-auto h-64 sm:h-80 md:h-96">
    <div className="w-full h-full bg-gray-200 rounded-xl animate-pulse"></div>
  </div>
);

const HeroSection: React.FC<HeroSectionProps> = ({ destination }) => {
  // 2. UPDATE THE STATE TYPE
  const [images, setImages] = useState<PlaceImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- 1. Image Fetching (No changes needed here) ---
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
        setImages(imgs); // This line is now correct!
        console.log("🌍 HeroSection images loaded:", imgs.length);
      } catch (err) {
        console.error("❌ HeroSection image fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [destination]);

  // --- 2, 3, 4 (No changes needed here) ---
  const resetAutoplay = () => { /* ... */ };
  useEffect(() => { /* ... */ }, [images]);
  const handlePrev = () => { /* ... */ };
  const handleNext = () => { /* ... */ };
  const handleDragEnd = (event: any, info: any) => { /* ... */ };
  const slideVariants = { /* ... */ };

  // --- 5. Render ---
  return (
    <div className="text-center mt-10 px-4">
      <h2 className="text-2xl font-semibold mb-2">Plan Your Smart Trip</h2>
      <p className="text-gray-600 mb-6">Discover destinations, activities, and hotels with AI</p>

      {loading && <SkeletonLoader />}

      {!loading && images.length === 0 && (
         <div className="relative w-full max-w-4xl mx-auto h-64 sm:h-80 md:h-96">
           <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
             <p className="text-gray-500">
               {destination ? `Could not load images for ${destination}` : "Select a destination"}
             </p>
           </div>
         </div>
      )}

      {!loading && images.length > 0 && (
        <div
          onMouseEnter={() => timeoutRef.current && clearInterval(timeoutRef.current)}
          onMouseLeave={resetAutoplay}
          className="relative w-full max-w-4xl mx-auto h-64 sm:h-80 md:h-96 overflow-hidden rounded-xl shadow-lg"
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
                // 3. UPDATE THE SRC PROP
                src={images[currentIndex].url}
                alt={`View of ${destination}`}
                fill
                style={{ objectFit: "cover" }}
                priority={currentIndex === 0}
              />
            </motion.div>
          </AnimatePresence>

          {/* Prev/Next Buttons */}
          <button
            onClick={handlePrev}
            className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition z-10"
            aria-label="Previous image"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={handleNext}
            className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition z-10"
            aria-label="Next image"
          >
            <ChevronRight size={24} />
          </button>

          {/* Image Counter */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm z-10">
            {currentIndex + 1} / {images.length}
          </div>

          {/* 4. ADD THE ATTRIBUTION (CRITICAL) */}
          <div 
            className="absolute bottom-2 right-2 bg-black/50 text-white/90 px-3 py-1 rounded-full text-xs z-10"
            // This is the standard React way to render an HTML string
            dangerouslySetInnerHTML={{ __html: images[currentIndex].attributions }} 
          />
        </div>
      )}
    </div>
  );
};

export default HeroSection;