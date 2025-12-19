"use client";
import React from "react";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HeroSection() {
  const scrollToCatalog = () => {
    const grid = document.getElementById("product-grid-start");
    if (grid) {
      grid.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="w-full px-4 pt-4 pb-2">
      <div
        className="relative w-full rounded-[1.5rem] overflow-hidden bg-gradient-to-r from-red-50 to-white dark:from-red-950/20 dark:to-zinc-900 border border-red-100 dark:border-red-900/30 py-8 px-6 flex items-center justify-between shadow-sm"
      >
        {/* Soft Glow */}
        <div className="absolute left-[-10%] top-[-50%] w-[40%] h-[200%] bg-red-500/5 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end justify-between w-full gap-6">

          {/* Left: Brand & Product Name */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2">

            {/* LOGO SECTION */}
            {/* ⚠️ NOTE: Upload your logo to public/brands/anjali.png */}
            <Image
              src="/brands/anjali.png"
              alt="Anjali Kitchenware"
              width={120}
              height={40}
              className="h-8 sm:h-10 w-auto object-contain mb-1"
              style={{ height: 'auto' }} // Ensure aspect ratio 
              priority
            />
            {/* Fallback Text Logo */}
            <span className="hidden text-xl font-black tracking-tighter text-red-600 uppercase">Anjali</span>

            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-white leading-none">
                Pressure Cooker
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                New Launch
              </span>
            </div>

            <p className="text-xs sm:text-sm text-zinc-500 font-medium max-w-sm">
              Experience the legacy of 50 years. Safety meets perfection.
            </p>
          </div>

          {/* Right: Action */}
          <button
            onClick={scrollToCatalog}
            className="group flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-md hover:bg-red-700 hover:shadow-lg active:scale-95 transition-all"
          >
            Shop Now <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}