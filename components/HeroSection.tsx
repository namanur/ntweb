"use client";
import React from "react";
import Image from "next/image";

const FEATURED_BRANDS = [
  { name: "Anjali", logo: "/brands/anjali.png" },
  { name: "MaxFresh", logo: "/brands/maxfresh.png" }, // Placeholder if needed
  { name: "Tibros", logo: "/brands/tibros.png" },     // Placeholder
  { name: "Sigma", logo: "/brands/sigma.png" },       // Placeholder
];

export default function HeroSection({ onBrandSelect }: { onBrandSelect?: (brand: string) => void }) {
  return (
    <div className="w-full px-4 pt-6 pb-2">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Featured Brands</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURED_BRANDS.map((brand) => (
            <div
              key={brand.name}
              onClick={() => onBrandSelect?.(brand.name)}
              className="group cursor-pointer bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-lg transition-all active:scale-95"
            >
              <div className="relative w-full h-12 mb-2 flex items-center justify-center">
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  width={100}
                  height={50}
                  className="object-contain max-h-full opacity-80 group-hover:opacity-100 transition-opacity"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter opacity-80 group-hover:opacity-100 transition-opacity">
                  {brand.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}