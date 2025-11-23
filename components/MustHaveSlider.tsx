"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const SLIDES = [
  {
    id: 1,
    tag: "Best Seller",
    title: "Premium Tiffin Box",
    description: "Keep your food warm and fresh for hours. Made with high-grade insulated plastic and stainless steel interiors. Perfect for office and school.",
    image: "/hero-product.png", 
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    textColor: "text-orange-600",
  },
  {
    id: 2,
    tag: "New Arrival",
    title: "MaxFresh Steel Bottle",
    description: "The ultimate hydration companion. Vacuum insulated technology keeps water cold for 24 hours and hot for 18 hours. Leak-proof design.",
    image: "/brands/maxfresh.png", 
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    textColor: "text-blue-600",
  },
  {
    id: 3,
    tag: "Kitchen Essential",
    title: "Turbo Vegetable Chopper",
    description: "Save time in the kitchen! Chop onions, tomatoes, and nuts in seconds with our heavy-duty blade system. A must-have for every home.",
    image: "/brands/sigma.png", 
    bgColor: "bg-green-50 dark:bg-green-950/30",
    textColor: "text-green-600",
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
    <div className="w-full max-w-5xl mx-auto px-4 py-6">
      {/* ✅ FIX: Added min-h-[500px] for mobile so content isn't cut off */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-800 min-h-[500px] md:min-h-0 md:aspect-[21/9]">
        
        <div 
          className="flex transition-transform duration-500 ease-out h-full"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {SLIDES.map((slide) => (
            <div key={slide.id} className={`w-full flex-shrink-0 flex flex-col md:flex-row items-center justify-between p-8 md:p-16 h-full ${slide.bgColor}`}>
              
              {/* Text Content */}
              <div className="flex-1 space-y-4 text-center md:text-left z-10 order-2 md:order-1">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white dark:bg-gray-900 ${slide.textColor} shadow-sm`}>
                  <Star size={12} fill="currentColor" /> {slide.tag}
                </span>
                <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white leading-tight">
                  {slide.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base max-w-lg mx-auto md:mx-0 leading-relaxed">
                  {slide.description}
                </p>
              </div>

              {/* Image - ✅ FIX: Adjusted height and margin for mobile */}
              <div className="flex-1 flex justify-center items-center relative w-full h-48 md:h-full mb-6 md:mb-0 md:mt-0 order-1 md:order-2">
                 <Image 
                   src={slide.image} 
                   alt={slide.title} 
                   width={400} 
                   height={400}
                   className="object-contain drop-shadow-2xl max-h-full"
                 />
              </div>
            </div>
          ))}
        </div>

        <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-black/50 hover:bg-white shadow-lg backdrop-blur-sm transition-all z-20">
          <ChevronLeft size={24} />
        </button>
        <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-black/50 hover:bg-white shadow-lg backdrop-blur-sm transition-all z-20">
          <ChevronRight size={24} />
        </button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {SLIDES.map((_, idx) => (
            <div 
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${current === idx ? "w-8 bg-gray-900 dark:bg-white" : "w-2 bg-gray-400/50"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}