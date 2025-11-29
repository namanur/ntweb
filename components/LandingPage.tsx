"use client";
import React from "react";
import Image from "next/image";
import { ShoppingBag, MessageCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-6 relative overflow-hidden font-sans">
      
      {/* Background Watermark */}
      <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
         <div className="relative w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw] animate-pulse">
            <Image src="/logo.png" alt="Bg" fill className="object-contain invert" priority />
         </div>
      </div>

      <div className="max-w-md w-full text-center z-10 space-y-8 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Logo */}
        <div className="relative w-32 h-32 mx-auto mb-6 bg-white/5 rounded-full p-6 border border-white/10 shadow-2xl backdrop-blur-md">
          <Image src="/logo.png" alt="Nandan Traders" fill className="object-contain invert p-2" />
        </div>

        {/* Text */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-white drop-shadow-lg">
            Nandan Traders
          </h1>
          <p className="text-zinc-400 text-lg font-medium leading-relaxed">
            Authorized Wholesale Distributor for <br/>
            <span className="text-white">MaxFresh, Tibros & Sigma</span>
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-4 pt-6">
          <a 
            href="https://catalog.nandantrader.in"
            className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:scale-105 hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-white/20"
          >
            <ShoppingBag size={22} /> View Wholesale Catalog
          </a>

          <a 
            href="https://wa.me/919431394095" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] text-white py-4 rounded-xl font-bold text-lg hover:scale-105 hover:bg-[#20b857] transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-green-500/20"
          >
            <MessageCircle size={22} /> Chat on WhatsApp
          </a>
        </div>

        {/* Footer */}
        <div className="pt-16 text-zinc-600 text-[10px] uppercase tracking-widest">
          <p>Khapriyawan, Barkagaon Road, Hazaribagh</p>
          <p className="mt-1">© {new Date().getFullYear()} Nandan Traders</p>
        </div>
      </div>
    </div>
  );
}