"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const SLIDES = [
  {
    id: 1,
    tag: "Best Seller",
    title: "Premium Tiffin Box",
    description: "Keep your food warm and fresh for hours. Made with high-grade insulated plastic and stainless steel interiors.",
    image: "/hero-product.png", 
    bgColor: "bg-zinc-100 dark:bg-zinc-900",
    textColor: "text-black dark:text-white",
  },
  {
    id: 2,
    tag: "New Arrival",
    title: "MaxFresh Steel Bottle",
    description: "The ultimate hydration companion. Vacuum insulated technology keeps water cold for 24 hours.",
    image: "/brands/maxfresh.png", 
    bgColor: "bg-zinc-100 dark:bg-zinc-900",
    textColor: "text-black dark:text-white",
  },
  {
    id: 3,
    tag: "Kitchen Essential",
    title: "Turbo Vegetable Chopper",
    description: "Save time in the kitchen! Chop onions, tomatoes, and nuts in seconds with our heavy-duty blade system.",
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
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      {/* ✅ UPDATED: rounded-3xl */}
      <div className="relative rounded-3xl overflow-hidden border border-border min-h-[500px] md:min-h-0 md:aspect-[21/9] shadow-2xl dark:shadow-none">
        
        <div 
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] h-full"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {SLIDES.map((slide) => (
            <div key={slide.id} className={`w-full flex-shrink-0 flex flex-col md:flex-row items-center justify-between p-8 md:p-16 h-full ${slide.bgColor}`}>
              
              <div className="flex-1 space-y-4 text-center md:text-left z-10 order-2 md:order-1">
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border border-current/20 backdrop-blur-md ${slide.textColor}`}>
                  <Star size={12} fill="currentColor" /> {slide.tag}
                </span>
                <h2 className={`text-4xl md:text-6xl font-black ${slide.textColor} tracking-tight drop-shadow-sm`}>
                  {slide.title}
                </h2>
                <p className="text-muted-foreground text-sm md:text-lg max-w-lg mx-auto md:mx-0 leading-relaxed font-medium">
                  {slide.description}
                </p>
              </div>

              <div className="flex-1 flex justify-center items-center relative w-full h-48 md:h-full mb-6 md:mb-0 order-1 md:order-2">
                 <Image 
                   src={slide.image} 
                   alt={slide.title} 
                   width={400} 
                   height={400}
                   className="object-contain max-h-full drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                 />
              </div>
            </div>
          ))}
        </div>

        <button onClick={prevSlide} className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/80 hover:bg-background border border-border transition-all z-20 backdrop-blur-md shadow-lg">
          <ChevronLeft size={22} className="text-foreground" />
        </button>
        <button onClick={nextSlide} className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/80 hover:bg-background border border-border transition-all z-20 backdrop-blur-md shadow-lg">
          <ChevronRight size={22} className="text-foreground" />
        </button>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${current === idx ? "w-8 bg-foreground" : "w-2 bg-foreground/20 hover:bg-foreground/40"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}