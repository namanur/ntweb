"use client";

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/erp';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  cartQty?: number; 
  onAdd: (item: Product, qty: number) => void;
  onClick?: () => void;
}

export default function ProductCard({ product, cartQty = 0, onAdd, onClick }: ProductCardProps) {
  const isInCart = cartQty > 0;
  const minQty = isInCart ? 1 : 6;
  
  const [qty, setQty] = useState(minQty);

  useEffect(() => {
    setQty(isInCart ? 1 : 6); 
  }, [isInCart]);

  const getImageUrl = () => {
    const baseUrl = `/images/${product.item_code}.jpg`;
    return product.imageVersion ? `${baseUrl}?v=${product.imageVersion}` : baseUrl;
  };

  const [imgSrc, setImgSrc] = useState(getImageUrl());

  useEffect(() => {
    setImgSrc(getImageUrl());
  }, [product]);

  const discountPrice = product.standard_rate * 0.975; 

  // ✅ FIX: Robust check for "Generic" (case-insensitive, trimmed)
  const brandName = product.brand?.trim();
  const showBrand = brandName && brandName.toLowerCase() !== "generic";

  return (
    <div 
      onClick={onClick}
      className={`group flex flex-col bg-card border rounded-3xl cursor-pointer 
                 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] 
                 hover:scale-[1.02] hover:-translate-y-1
                 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)]
                 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)]
                 ${isInCart ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border/50'}`}
    >
      {/* HEADER: ID & Brand */}
      <div className="flex justify-between items-start p-4 pb-0">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider truncate max-w-[70%] transition-colors group-hover:text-foreground">
          {product.item_code}
        </span>
        {/* Only render if valid AND not generic */}
        {showBrand && (
          <span className="text-[10px] font-bold border border-border/50 px-2 py-0.5 rounded-full text-foreground/80 shrink-0 bg-background/50 backdrop-blur-md">
            {brandName}
          </span>
        )}
      </div>

      {/* IMAGE */}
      <div className="w-full aspect-square p-5 flex items-center justify-center bg-transparent">
        <img 
          src={imgSrc} 
          alt={product.item_name}
          className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out"
          onError={() => setImgSrc("https://placehold.co/400x400/png?text=No+Image")}
        />
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t border-border/50 mt-auto bg-secondary/30 rounded-b-3xl group-hover:bg-secondary/50 transition-colors">
        <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 h-10 group-hover:text-primary transition-colors" title={product.item_name}>
          {product.item_name}
        </h3>
        
        <div className="mt-2 text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded w-fit">
           Buy 24+ @ ₹{discountPrice.toFixed(2)}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase font-semibold">Wholesale</span>
            <span className="text-base font-black text-foreground tracking-tight flex items-baseline gap-1">
              ₹{product.standard_rate.toLocaleString()}
              {product.stock_uom && <span className="text-[10px] font-medium text-muted-foreground">/ {product.stock_uom}</span>}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <input 
              type="number"
              min={minQty}
              value={qty}
              onClick={(e) => e.stopPropagation()} 
              onChange={(e) => setQty(Math.max(minQty, parseInt(e.target.value) || minQty))}
              className={`w-12 h-9 rounded-l-lg border bg-background text-center text-xs font-bold focus:outline-none focus:border-primary transition-colors ${isInCart ? 'border-primary text-primary' : 'border-border'}`}
            />
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onAdd(product, qty);
              }}
              className="h-9 px-3 flex items-center justify-center rounded-r-lg bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
            >
              <Plus size={16} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}