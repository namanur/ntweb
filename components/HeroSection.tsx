"use client";
import React from "react";
import { ArrowDown, Star, Sparkles } from "lucide-react";

// 🔧 SETTING: Ensure this image exists in your public folder
const HERO_IMAGE = "/hero-product.png"; 

export default function HeroSection() {
  
  // 🎨 SAFE MODE COLORS (No Library Required)
  // We use a premium Blue/Gold theme that works with everything
  const bgColor = "#0f172a"; // Dark Slate
  const accentColor = "#3b82f6"; // Blue
  const textColor = "#e2e8f0"; // Light Gray

  const scrollToCatalog = () => {
    const catalog = document.getElementById("catalog-section");
    if (catalog) {
      catalog.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 py-6 bg-gray-50 dark:bg-gray-950 transition-colors">
      
      <div 
        className="relative rounded-[2.5rem] overflow-hidden transition-all duration-1000 ease-in-out shadow-2xl group"
        style={{ 
          background: `linear-gradient(135deg, ${bgColor} 0%, #000000 100%)`,
          border: `1px solid ${accentColor}40`, 
          boxShadow: `0 20px 60px -15px ${bgColor}50`
        }}
      >
        
        {/* Abstract Shapes */}
        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
          <div 
            className="absolute top-10 right-[-20px] w-40 h-12 rounded-full -rotate-12 blur-sm" 
            style={{ backgroundColor: accentColor }}
          />
          <div 
            className="absolute bottom-10 left-10 w-64 h-16 rounded-full rotate-3 blur-md" 
            style={{ backgroundColor: "white", opacity: 0.1 }}
          />
        </div>

        {/* Content Container */}
        <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* LEFT: Text Content */}
          <div className="text-center md:text-left max-w-lg">
            <div 
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-6 border border-white/10 backdrop-blur-md shadow-sm"
              style={{ color: textColor, backgroundColor: `${accentColor}20` }}
            >
              <Sparkles size={12} /> New Collection
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4 text-white drop-shadow-lg">
              Kitchenware <br/>
              <span 
                  className="text-transparent bg-clip-text"
                  style={{ 
                      backgroundImage: `linear-gradient(to right, #ffffff, ${accentColor})` 
                  }}
              >
                Reimagined.
              </span>
            </h1>
            
            <p className="text-gray-300 text-base sm:text-lg mb-8 leading-relaxed max-w-md mx-auto md:mx-0">
              Premium stainless steel & durable plasticware. 
              <span className="block mt-1 font-semibold text-white opacity-90">Wholesale rates for your business.</span>
            </p>

            <button 
              onClick={scrollToCatalog}
              className="px-8 py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl hover:scale-105 hover:shadow-2xl text-gray-900 active:scale-95 bg-white"
            >
              View Catalog <ArrowDown size={16} />
            </button>
          </div>

          {/* RIGHT: The Hero Image */}
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center mt-4 md:mt-0">
            <div 
              className="absolute inset-0 rounded-full blur-[60px] animate-pulse opacity-40"
              style={{ backgroundColor: accentColor }}
            ></div>
            
            <img 
              src={HERO_IMAGE} 
              alt="Featured Product" 
              className="relative z-10 w-full h-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500 filter hover:brightness-110"
              onError={(e) => e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/3082/3082060.png"}
            />

            <div className="absolute -bottom-2 -right-2 bg-white/95 backdrop-blur text-black font-bold px-4 py-2 rounded-xl shadow-xl transform rotate-2 flex items-center gap-2 border border-gray-100/50 text-xs">
              <Star size={14} className="text-yellow-500" fill="currentColor" /> 
              Best Seller
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}