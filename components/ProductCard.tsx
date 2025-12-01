"use client";

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/erp';
import { Plus, Ban } from 'lucide-react'; // Added Ban icon for out of stock

interface ProductCardProps {
  product: Product;
  onAdd: (item: Product) => void;
  onClick?: () => void;
}

export default function ProductCard({ product, onAdd, onClick }: ProductCardProps) {
  // Logic: Check stock status. Default to true if undefined (safety fallback)
  const isOutOfStock = product.in_stock === false;

  // Construct image URL:
  const getImageUrl = () => {
    const baseUrl = `/images/${product.item_code}.jpg`;
    return product.imageVersion ? `${baseUrl}?v=${product.imageVersion}` : baseUrl;
  };

  const [imgSrc, setImgSrc] = useState(getImageUrl());

  useEffect(() => {
    setImgSrc(getImageUrl());
  }, [product]);

  return (
    <div 
      onClick={isOutOfStock ? undefined : onClick} // Optional: Disable card click if out of stock
      className={`group flex flex-col bg-card border border-border/50 rounded-3xl cursor-pointer 
                 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] 
                 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)]
                 dark:shadow-[0_4px_20px_-12px_rgba(255,255,255,0.05)]
                 ${isOutOfStock 
                   ? 'opacity-60 grayscale-[0.8] hover:opacity-100 hover:grayscale-0' 
                   : 'hover:scale-[1.02] hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_20px_40px_-12px_rgba(255,255,255,0.1)]'
                 }`}
    >
      {/* HEADER: ID & Brand */}
      <div className="flex justify-between items-start p-4 pb-0">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider truncate max-w-[70%] transition-colors group-hover:text-foreground">
          {product.item_code}
        </span>
        {product.brand && (
          <span className="text-[10px] font-bold border border-border/50 px-2 py-0.5 rounded-full text-foreground/80 shrink-0 bg-background/50 backdrop-blur-md">
            {product.brand}
          </span>
        )}
      </div>

      {/* IMAGE */}
      <div className="relative w-full aspect-square p-5 flex items-center justify-center bg-transparent">
        <img 
          src={imgSrc} 
          alt={product.item_name}
          className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out"
          onError={() => setImgSrc("https://placehold.co/400x400/png?text=No+Image")}
        />
        
        {/* OUT OF STOCK OVERLAY */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/10 backdrop-blur-[1px] z-10">
            <span className="px-3 py-1 bg-destructive/90 text-destructive-foreground text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t border-border/50 mt-auto bg-secondary/30 rounded-b-3xl group-hover:bg-secondary/50 transition-colors">
        <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 h-10 group-hover:text-primary transition-colors" title={product.item_name}>
          {product.item_name}
        </h3>
        
        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Price</span>
            <span className="text-base font-black text-foreground tracking-tight">
              ₹{product.standard_rate.toLocaleString()}
            </span>
          </div>

          <button 
            disabled={isOutOfStock}
            onClick={(e) => {
              e.stopPropagation();
              onAdd(product);
            }}
            className={`h-9 w-9 flex items-center justify-center rounded-full transition-all shadow-lg
              ${isOutOfStock 
                ? 'bg-muted text-muted-foreground cursor-not-allowed shadow-none' 
                : 'bg-primary text-primary-foreground hover:scale-110 active:scale-95'
              }`}
          >
            {isOutOfStock ? (
              <Ban size={16} strokeWidth={2} /> 
            ) : (
              <Plus size={18} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}