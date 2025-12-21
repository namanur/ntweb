"use client";
import React from "react";
import Image from "next/image";

const FEATURED_BRANDS = [
  { name: "Anjali", logo: "/brands/anjali.png" },
  { name: "MaxFresh", logo: "/brands/maxfresh.png" }, // Placeholder if needed
  { name: "Tibros", logo: "/brands/tibros.png" },     // Placeholder
  { name: "Sigma", logo: "/brands/sigma.png" },       // Placeholder
];

export default function HeroSection({
  onBrandSelect,
  selectedBrand
}: {
  onBrandSelect?: (brand: string) => void,
  selectedBrand?: string
}) {
  return (
    <div className="w-full px-4 pt-6 pb-2">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Featured Brands</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {FEATURED_BRANDS.map((brand) => {
            const isActive = selectedBrand === brand.name;
            return (
              <div
                key={brand.name}
                onClick={() => onBrandSelect?.(brand.name)}
                className={`
                  group cursor-pointer rounded-xl p-4 flex flex-col items-center justify-center transition-all active:scale-95 border
                  ${isActive
                    ? 'bg-primary/5 border-primary ring-1 ring-primary'
                    : 'bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                  }
                `}
              >
                <div className="relative w-full h-8 flex items-center justify-center">
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    width={100}
                    height={32}
                    className={`object-contain max-h-full transition-opacity ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className={`hidden text-sm font-black uppercase tracking-tighter transition-opacity ${isActive ? 'text-primary' : 'text-zinc-900 dark:text-white opacity-80 group-hover:opacity-100'}`}>
                    {brand.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}