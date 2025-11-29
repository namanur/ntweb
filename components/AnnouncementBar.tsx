"use client";
import React from "react";

export default function AnnouncementBar() {
  return (
    <div className="bg-foreground text-background dark:bg-white dark:text-black text-[10px] sm:text-xs font-bold py-2 overflow-hidden relative z-50 tracking-widest uppercase">
      <div className="whitespace-nowrap animate-marquee flex gap-8 items-center justify-center w-max mx-auto">
        <span>⭐ Must Have Products</span>
        <span>•</span>
        <span>🚀 Free Delivery in Hazaribagh Area</span>
        <span>•</span>
        <span>📦 Wholesale Prices Guaranteed</span>
        <span>•</span>
        <span>📞 Order via Call: 94313-94095</span>
        <span>•</span>
        <span>⭐ Check Out Our Best Sellers</span>
        <span>•</span>
        <span>🔪 Premium Steel & Plasticware</span>
      </div>
    </div>
  );
}