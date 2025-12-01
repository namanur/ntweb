"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const SLIDES = [
  {
    id: 1,
    tag: "Best Seller",
    title: "Premium Tiffin Box",
    description: "Keep your food warm and fresh for hours.",
    image: "/hero-product.png", 
    bgColor: "bg-zinc-100 dark:bg-zinc-900",
    textColor: "text-black dark:text-white",
  },
  {
    id: 2,
    tag: "New Arrival",
    title: "MaxFresh Steel Bottle",
    description: "Vacuum insulated technology keeps water cold for 24 hours.",
    image: "/brands/maxfresh.png", 
    bgColor: "bg-zinc-100 dark:bg-zinc-900",
    textColor: "text-black dark:text-white",
  },
  {
    id: 3,
    tag: "Kitchen Essential",
    title: "Turbo Vegetable Chopper",
    description: "Chop onions, tomatoes, and nuts in seconds.",
    image: "/brands/sigma.png", 
    bgColor: "bg-zinc-100 dark:bg-zinc-900",
    textColor: "text-black dark:text-white",
  },
];

export default function MustHaveSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrent(current === SLIDES.length - 1 ? 0 : current + 1);
  const prevSlide = () => setCurrent(current === 0 ? SLIDES.length - 1 : current - 1);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4">
      {/* ✅ OPTIMIZED FOR MOBILE:
         - min-h-[190px]: Reduced from 250px to remove dead space.
         - md:min-h-0: Lets desktop aspect ratio take over on larger screens.
      */}
      <div className="relative rounded-3xl overflow-hidden border border-border min-h-[190px] md:min-h-0 md:aspect-[32/9] shadow-lg dark:shadow-none">
        
        <div 
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] h-full"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {SLIDES.map((slide) => (
            <div key={slide.id} className={`w-full flex-shrink-0 flex flex-row items-center justify-between p-4 md:p-10 h-full ${slide.bgColor}`}>
              
              <div className="flex-1 space-y-2 z-10 pr-2">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-current/20 backdrop-blur-md ${slide.textColor}`}>
                  <Star size={10} fill="currentColor" /> {slide.tag}
                </span>
                <h2 className={`text-lg sm:text-2xl md:text-4xl font-black ${slide.textColor} tracking-tight leading-tight`}>
                  {slide.title}
                </h2>
                <p className="text-muted-foreground text-xs md:text-sm max-w-md leading-relaxed font-medium line-clamp-2 md:line-clamp-none">
                  {slide.description}
                </p>
              </div>

              {/* Adjusted image container for tighter height */}
              <div className="w-28 h-28 sm:w-40 sm:h-40 md:w-auto md:h-full flex justify-center items-center relative flex-shrink-0">
                 <Image 
                   src={slide.image} 
                   alt={slide.title} 
                   width={300} 
                   height={300}
                   className="object-contain max-h-full drop-shadow-xl"
                 />
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Buttons (Hidden on very small screens to save space, visible on sm+) */}
        <button onClick={prevSlide} className="hidden sm:block absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background border border-border transition-all z-20 backdrop-blur-md shadow-sm">
          <ChevronLeft size={18} className="text-foreground" />
        </button>
        <button onClick={nextSlide} className="hidden sm:block absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background border border-border transition-all z-20 backdrop-blur-md shadow-sm">
          <ChevronRight size={18} className="text-foreground" />
        </button>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${current === idx ? "w-5 bg-foreground" : "w-1.5 bg-foreground/20 hover:bg-foreground/40"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}