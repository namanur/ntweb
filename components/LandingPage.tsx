"use client";
import React, { Suspense } from "react";
import Image from "next/image";
import { ArrowRight, MessageCircle } from "lucide-react";
import Header from "./Header";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      
      {/* ✅ SAME HEADER AS MAIN SITE */}
      <Suspense fallback={<div className="h-16 bg-background" />}>
        <Header />
      </Suspense>

      <div className="flex-grow flex flex-col items-center justify-center p-6 relative overflow-hidden">
        
        {/* Background Watermark */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
           <div className="relative w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw]">
              <Image src="/logo.png" alt="Bg" fill className="object-contain dark:invert" />
           </div>
        </div>

        <div className="max-w-md w-full text-center z-10 space-y-8 animate-in fade-in zoom-in-95 duration-700">
          
          {/* Logo & Title */}
          <div className="space-y-6">
            <div className="relative w-28 h-28 mx-auto bg-background/50 rounded-full p-4 border border-border shadow-2xl backdrop-blur-xl">
              <Image src="/logo.png" alt="Nandan Traders" fill className="object-contain dark:invert p-4" />
            </div>
            
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-foreground drop-shadow-sm">
                Nandan Traders
              </h1>
              <p className="text-muted-foreground text-sm mt-3 font-medium tracking-wide">
                Authorized Wholesale Distributor
                <span className="block text-xs mt-1 opacity-70">MaxFresh • Tibros • Sigma</span>
              </p>
            </div>
          </div>

          {/* Buttons Section */}
          <div className="flex flex-col gap-5 pt-4 items-center w-full">
            
            {/* Primary Action: Visit Catalog */}
            <a 
              href="https://catalog.nandantrader.in"
              className="w-full bg-foreground text-background py-4 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl"
            >
              Visit Us / पधारें <ArrowRight size={22} strokeWidth={2.5} />
            </a>

            {/* Secondary Action: WhatsApp (Smaller) */}
            <a 
              href="https://wa.me/919431394095" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-bold text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 transition-colors bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-full border border-green-200 dark:border-green-800"
            >
              <MessageCircle size={16} /> Need Help? Chat on WhatsApp
            </a>

          </div>

          {/* Footer Note */}
          <div className="pt-12 text-muted-foreground/40 text-[10px] uppercase tracking-widest font-bold">
            <p>Hazaribagh, Jharkhand</p>
          </div>
        </div>
      </div>
    </div>
  );
}