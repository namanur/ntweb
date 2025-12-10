"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowDown, ShieldCheck, Percent, Box, Truck } from "lucide-react";

export default function IntroOverlay() {
  const [isVisible, setIsVisible] = useState(false); // Start false to prevent hydration mismatch
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // 1. Check if user has already seen this in this session
    const hasSeen = sessionStorage.getItem("hasSeenIntro");
    if (!hasSeen) {
      setIsVisible(true);
      // Disable scrolling on the BODY while intro is active
      document.body.style.overflow = "hidden";
    }
  }, []);

  const dismissIntro = () => {
    setIsFading(true);
    // Wait for animation to finish before unmounting
    setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem("hasSeenIntro", "true");
      // Re-enable scrolling
      document.body.style.overflow = "auto";
    }, 800);
  };

  const handleScroll = (e: React.WheelEvent | React.TouchEvent) => {
    // Detect scroll intent (downwards)
    if (isFading) return;
    
    // Simple threshold: if they try to scroll, dismiss.
    // We can add logic to require a "stronger" scroll if needed.
    dismissIntro();
  };

  if (!isVisible) return null;

  return (
    <div 
      onWheel={handleScroll}
      onTouchMove={handleScroll}
      className={`fixed inset-0 z-40 bg-background text-foreground flex flex-col items-center justify-center overflow-hidden transition-all duration-700 ease-in-out ${isFading ? "opacity-0 -translate-y-full pointer-events-none" : "opacity-100 translate-y-0"}`}
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[50vh] h-[50vh] bg-secondary/30 rounded-full blur-[100px] opacity-50" />
          <div className="absolute bottom-0 left-0 w-[40vh] h-[40vh] bg-primary/5 rounded-full blur-[100px] opacity-50" />
      </div>

      <div className="relative z-10 max-w-4xl w-full px-6 flex flex-col items-center text-center space-y-12">
        
        {/* LOGO & HERO */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
           <div className="relative w-32 h-32 mx-auto bg-card rounded-full p-6 shadow-2xl border border-border/50">
              <Image src="/logo.png" alt="Logo" fill className="object-contain p-4 dark:invert" priority />
           </div>
           
           <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-secondary/50 border border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <ShieldCheck size={12} className="text-green-600" /> Authorized Distributor
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9]">
                Nandan Traders
              </h1>
              <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-lg mx-auto font-medium">
                Premium Kitchenware Wholesale.<br/>
                <span className="text-foreground">Tibros • MaxFresh • Sigma</span>
              </p>
           </div>
        </div>

        {/* FEATURES (The "Skeleton" / Value Props) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full animate-in fade-in zoom-in-95 duration-700 delay-300">
            <FeatureBox icon={<Percent />} title="Bulk Margins" desc="Deep discounts on volume" />
            <FeatureBox icon={<Box />} title="Ready Stock" desc="Ships from Hazaribagh" />
            <FeatureBox icon={<Truck />} title="Fast Logistic" desc="Same-day dispatch" />
        </div>

        {/* SCROLL INDICATOR */}
        <div 
          onClick={dismissIntro}
          className="pt-8 animate-bounce cursor-pointer flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
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
    <div className="p-4 rounded-2xl bg-secondary/20 border border-border/50 flex flex-col items-center gap-3 text-center">
      <div className="text-foreground opacity-80">{icon}</div>
      <div>
        <h3 className="font-bold text-sm uppercase tracking-wide">{title}</h3>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}