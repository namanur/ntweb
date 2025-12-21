"use client";
import React from 'react';
import { Product } from '@/lib/erp';
import Image from 'next/image';
import { Flame } from 'lucide-react';

export default function HotDeals({ products }: { products: Product[] }) {
  // Filter only hot items
  const hotItems = products.filter(p => p.is_hot);

  if (hotItems.length === 0) return null;

  return (
    <div className="w-full mb-8 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex items-center gap-2 mb-4 px-2">
        <div className="p-2 bg-orange-500/10 rounded-lg">
          <Flame className="text-orange-500 fill-orange-500 animate-pulse" size={20} />
        </div>
        <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Trending Now</h3>
      </div>

      {/* Horizontal Scroll / Marquee Container */}
      <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide px-2">
        {hotItems.map((product) => (
          <div
            key={product.item_code}
            className="flex-shrink-0 snap-center w-36 md:w-44 flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
            onClick={() => {
              const el = document.getElementById('catalog-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {/* Image Area */}
            <div className="h-32 w-full bg-white p-4 flex items-center justify-center relative">
              <Image
                src={`/images/${product.item_code}.jpg`}
                alt={product.item_name}
                width={150}
                height={150}
                className="object-contain h-full w-full group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-2 right-2 bg-red-600 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-lg">
                HOT
              </div>
            </div>

            {/* Name Area */}
            <div className="p-3 bg-secondary/30 flex-1 flex flex-col justify-center border-t border-border/50">
              <p className="text-[11px] md:text-xs font-bold leading-tight line-clamp-2 text-center text-foreground/80 group-hover:text-primary transition-colors">
                {product.item_name}
              </p>
              <div className="mt-2 text-center font-mono text-xs font-black text-foreground">
                ₹{product.standard_rate}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}