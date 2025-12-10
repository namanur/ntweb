"use client";
import React, { Suspense } from "react";
import Image from "next/image";
import { ArrowRight, MessageCircle, Truck, Percent, ShieldCheck, Box } from "lucide-react";
import Header from "./Header";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      
      <Suspense fallback={<div className="h-16 bg-background" />}>
        <Header />
      </Suspense>

      <div className="flex-grow flex flex-col">
        
        {/* --- HERO SECTION --- */}
        <div className="relative overflow-hidden pt-12 pb-20 px-6 sm:px-12 lg:px-20 border-b border-border/40">
           {/* Background Decoration */}
           <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[40rem] h-[40rem] bg-secondary/30 rounded-full blur-3xl opacity-50 pointer-events-none" />
           <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[30rem] h-[30rem] bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none" />

           <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
              <div className="space-y-8 text-center md:text-left animate-in slide-in-from-bottom-10 fade-in duration-700">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <ShieldCheck size={12} className="text-green-600" /> Authorized Distributor
                  </div>
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.9]">
                    PREMIUM <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-500 to-zinc-900 dark:from-zinc-400 dark:to-zinc-100">KITCHENWARE</span>
                  </h1>
                  <p className="text-lg text-muted-foreground font-medium max-w-md mx-auto md:mx-0 leading-relaxed">
                    Direct wholesale pricing on Tibros, MaxFresh, and Sigma products. 
                    <span className="block mt-2 text-foreground font-bold">Minimum Order Quantity: 6 Pieces.</span>
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-2">
                    <a href="https://catalog.nandantrader.in" className="h-14 px-8 rounded-2xl bg-foreground text-background font-bold text-lg flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-2xl">
                      Enter Catalog <ArrowRight size={20} />
                    </a>
                    <a href="https://wa.me/919431394095" className="h-14 px-8 rounded-2xl border border-border bg-secondary/50 text-foreground font-bold text-lg flex items-center justify-center gap-3 hover:bg-secondary transition-colors">
                      <MessageCircle size={20} className="text-green-600" /> WhatsApp
                    </a>
                  </div>
              </div>
              
              <div className="relative aspect-square md:aspect-[4/5] w-full max-w-md mx-auto animate-in zoom-in-95 fade-in duration-1000 delay-200">
                  <div className="absolute inset-0 bg-gradient-to-tr from-zinc-200 to-transparent dark:from-zinc-800 rounded-[3rem] rotate-3 opacity-50" />
                  <div className="absolute inset-0 bg-card rounded-[3rem] border border-border shadow-2xl overflow-hidden flex items-center justify-center p-8">
                     <Image src="/logo.png" alt="Showcase" width={400} height={400} className="object-contain drop-shadow-2xl dark:invert" priority />
                  </div>
              </div>
           </div>
        </div>

        {/* --- FEATURES GRID --- */}
        <div className="py-20 px-6 bg-secondary/10">
           <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
              <Feature 
                 icon={<Percent size={32} />} 
                 title="Bulk Margins" 
                 desc="Access deep wholesale discounts. Buy more, save significantly more on every unit." 
              />
              <Feature 
                 icon={<Box size={32} />} 
                 title="Ready Stock" 
                 desc="Huge warehouse inventory in Hazaribagh. If it's on the site, it's ready to ship." 
              />
              <Feature 
                 icon={<Truck size={32} />} 
                 title="Fast Logistics" 
                 desc="Same-day dispatch for local orders. Reliable transport partners for outstation delivery." 
              />
           </div>
        </div>

      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-3xl bg-background border border-border hover:border-foreground/20 transition-colors shadow-sm text-center sm:text-left">
       <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-foreground mb-6 mx-auto sm:mx-0">
         {icon}
       </div>
       <h3 className="text-xl font-bold mb-3">{title}</h3>
       <p className="text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}