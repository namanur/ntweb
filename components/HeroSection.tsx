"use client";
import React from "react";
// ✅ FIXED: Added 'Check' to imports
import { ArrowDown, Zap, Star, Check } from "lucide-react";

const HERO_IMAGE = "/hero-product.png"; // Replace this with a .gif for motion!

export default function HeroSection() {
  const scrollToCatalog = () => {
    const catalog = document.getElementById("catalog-section");
    if (catalog) {
      catalog.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="w-full px-3 sm:px-6 py-4 sm:py-6 bg-background transition-colors">
      
      <div 
        className="relative rounded-[2.5rem] overflow-hidden shadow-2xl group min-h-[400px] flex items-center"
        style={{ 
          background: `radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)`,
        }}
      >
        
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[url('/watermark.svg')] opacity-10 rotate-12 animate-pulse"></div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8 relative z-10 w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          {/* LEFT: Text Content */}
          <div className="text-center md:text-left order-2 md:order-1">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)] animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Zap size={14} fill="currentColor" /> Just Launched
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-[0.9] mb-6 text-white drop-shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-1000">
              The Ultimate <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Lunch Box.
              </span>
            </h1>
            
            <p className="text-zinc-400 text-sm sm:text-base mb-8 leading-relaxed max-w-md mx-auto md:mx-0 font-medium animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
              Keep your food 100% fresh & hot. Leak-proof technology with premium stainless steel inner. 
            </p>

            <button 
              onClick={scrollToCatalog}
              className="px-8 py-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] text-black active:scale-95 bg-white mx-auto md:mx-0 animate-in zoom-in duration-500 delay-200"
            >
              Shop Now <ArrowDown size={16} />
            </button>
          </div>

          {/* RIGHT: Product Showcase */}
          <div className="relative order-1 md:order-2 flex justify-center h-[300px] md:h-[450px]">
            
            {/* Glow Behind Product */}
            <div className="absolute inset-0 bg-blue-500/20 blur-[80px] rounded-full scale-75 animate-pulse"></div>
            
            {/* Product Image / GIF */}
            <img 
              src={HERO_IMAGE} 
              alt="New Lunchbox" 
              className="relative z-10 w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:scale-105 transition-transform duration-700 ease-out"
            />

            {/* Floating Review Badge */}
            <div className="absolute bottom-10 right-4 sm:right-10 bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-2xl flex gap-3 items-center animate-bounce duration-[3000ms]">
                <div className="bg-green-500 rounded-full p-1.5"><Check size={12} className="text-white" strokeWidth={4} /></div>
                <div className="text-left">
                    <div className="text-[10px] text-zinc-300 uppercase font-bold tracking-wider">Durability</div>
                    <div className="text-xs font-bold text-white">5 Star Rated</div>
                </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}