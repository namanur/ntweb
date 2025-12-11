"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowDown, ShieldCheck, Percent, Box, Truck } from "lucide-react";

export default function IntroOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem("hasSeenIntro");
    if (!hasSeen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
    }
  }, []);

  const dismissIntro = () => {
    setIsFading(true);
    setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem("hasSeenIntro", "true");
      document.body.style.overflow = "auto";
    }, 800);
  };

  const handleScroll = () => {
    if (isFading) return;
    dismissIntro();
  };

  if (!isVisible) return null;

  return (
    <div 
      onWheel={handleScroll}
      onTouchMove={handleScroll}
      // ✅ CHANGED: z-[100] to cover header, overflow-y-auto to prevent cutting off on small screens
      className={`fixed inset-0 z-[100] bg-background text-foreground flex flex-col items-center justify-center 
                 transition-all duration-700 ease-in-out overflow-y-auto overflow-x-hidden
                 ${isFading ? "opacity-0 -translate-y-full pointer-events-none" : "opacity-100 translate-y-0"}`}
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none fixed">
          <div className="absolute top-0 right-0 w-[50vh] h-[50vh] bg-secondary/30 rounded-full blur-[100px] opacity-50" />
          <div className="absolute bottom-0 left-0 w-[40vh] h-[40vh] bg-primary/5 rounded-full blur-[100px] opacity-50" />
      </div>

      <div className="relative z-10 max-w-4xl w-full px-6 py-10 flex flex-col items-center text-center">
        
        {/* LOGO & HERO */}
        {/* ✅ CHANGED: Reduced gaps (space-y-6 instead of 12) for laptops */}
        <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
           {/* ✅ CHANGED: Smaller logo on mobile/laptop (w-24), larger on desktop (md:w-32) */}
           <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto bg-card rounded-full p-5 shadow-2xl border border-border/50">
              <Image src="/logo.png" alt="Logo" fill className="object-contain p-2 dark:invert" priority />
           </div>
           
           <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-secondary/50 border border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <ShieldCheck size={12} className="text-green-600" /> Authorized Distributor
              </div>
              
              {/* ✅ CHANGED: Responsive text sizes */}
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9]">
                Nandan Traders
              </h1>
              <p className="mt-4 text-base md:text-xl text-muted-foreground max-w-lg mx-auto font-medium">
                Premium Kitchenware Wholesale.<br/>
                <span className="text-foreground">Tibros • MaxFresh • Sigma</span>
              </p>
           </div>
        </div>

        {/* FEATURES */}
        {/* ✅ CHANGED: Added margin-top to separate, grid stays compact */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full animate-in fade-in zoom-in-95 duration-700 delay-300 mt-10">
            <FeatureBox icon={<Percent />} title="Bulk Margins" desc="Deep discounts on volume" />
            <FeatureBox icon={<Box />} title="Ready Stock" desc="Ships from Hazaribagh" />
            <FeatureBox icon={<Truck />} title="Fast Logistic" desc="Same-day dispatch" />
        </div>

        {/* SCROLL INDICATOR */}
        <div 
          onClick={dismissIntro}
          className="mt-12 animate-bounce cursor-pointer flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
        >
          <span className="text-[10px] uppercase font-bold tracking-widest">Scroll to Shop</span>
          <ArrowDown size={24} />
        </div>

      </div>
    </div>
  );
}

function FeatureBox({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-4 rounded-2xl bg-secondary/20 border border-border/50 flex flex-col items-center gap-2 text-center hover:bg-secondary/40 transition-colors">
      <div className="text-foreground opacity-80 scale-90">{icon}</div>
      <div>
        <h3 className="font-bold text-xs uppercase tracking-wide">{title}</h3>
        <p className="text-[10px] text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}