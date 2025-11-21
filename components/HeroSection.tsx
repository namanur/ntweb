"use client";
import React from "react";
import { ArrowDown, Star, Sparkles } from "lucide-react";

export default function HeroSection() {
  
  const scrollToCatalog = () => {
    const catalog = document.getElementById("catalog-section");
    if (catalog) {
      catalog.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    // ✅ Added 'border-y' to frame the poster nicely in Light Mode
    <div className="relative bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 text-white overflow-hidden border-y border-gray-200 dark:border-gray-800 shadow-sm">
      
      {/* Abstract Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24 relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
        
        {/* LEFT: Text Content */}
        <div className="text-center md:text-left max-w-lg">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-bottom-4">
            <Sparkles size={12} /> New Stock Arrived
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6">
            Upgrade Your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Kitchen Today.
            </span>
          </h1>
          
          <p className="text-gray-300 text-lg mb-8 leading-relaxed">
            Premium stainless steel, durable plasticware, and chef-grade tools. 
            <span className="block mt-2 text-white font-semibold">Wholesale prices for everyone.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <button 
              onClick={scrollToCatalog}
              className="bg-white text-blue-900 px-8 py-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1"
            >
              View Full Catalog <ArrowDown size={18} />
            </button>
            <button className="px-8 py-4 rounded-full font-bold text-sm border border-white/20 hover:bg-white/10 transition-all text-white">
              Contact Us
            </button>
          </div>
        </div>

        {/* RIGHT: The "Flaunt" Product Image */}
        <div className="relative w-full max-w-md md:max-w-sm aspect-square flex items-center justify-center">
          
          {/* Glowing Circle behind product */}
          <div className="absolute inset-4 bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
          
          {/* The Product Image */}
          <img 
            src="https://cdn-icons-png.flaticon.com/512/3082/3082060.png" 
            alt="Featured Product" 
            className="relative z-10 w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
          />

          {/* Floating Badge */}
          <div className="absolute -bottom-4 -right-4 bg-yellow-500 text-black font-bold px-4 py-2 rounded-lg shadow-lg transform rotate-3 flex items-center gap-2">
            <Star size={16} fill="black" /> Best Seller
          </div>
        </div>

      </div>
    </div>
  );
}