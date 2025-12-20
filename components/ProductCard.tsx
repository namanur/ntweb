"use client";

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/erp';
import { Plus, ShoppingCart } from 'lucide-react';
import Image from "next/image";

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
    // @ts-ignore
    return product.imageVersion ? `${baseUrl}?v=${product.imageVersion}` : baseUrl;
  };

  // ✅ STATE FOR IMAGE SOURCE
  const [imgSrc, setImgSrc] = useState(getImageUrl());

  useEffect(() => {
    setImgSrc(getImageUrl());
  }, [product]);

  const discountPrice = product.standard_rate * 0.975;
  const cleanBrand = (product.brand || "").toLowerCase().trim();
  const showBrand = cleanBrand.length > 0 && cleanBrand !== "generic";

  const handlePress = () => {
    if (onClick) onClick();
  };

  const handleAddToCart = () => {
    onAdd(product, Number(qty));
  };

  return (
    <div
      onClick={handlePress}
      className="group relative bg-card rounded-3xl p-4 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
    >
      {/* Brand & Code Badges */}
      {(showBrand || product.is_hot) && (
        <div className="absolute top-2 left-2 z-20 flex flex-col gap-1 items-start">
          {product.is_hot && (
            <span className="text-[10px] font-bold bg-gradient-to-r from-orange-500 to-red-600 text-white px-2 py-1 rounded-full shadow-sm animate-pulse">
              HOT
            </span>
          )}
          {showBrand && (
            <span className="text-[10px] font-bold bg-background/80 backdrop-blur-md px-2 py-1 rounded-full border border-divider shadow-sm">
              {product.brand}
            </span>
          )}
        </div>
      )}

      {/* Image Container with subtle zoom */}
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-zinc-50 dark:bg-zinc-900 mb-4 flex items-center justify-center">
        <Image
          src={imgSrc}
          alt={product.item_name}
          width={400}
          height={400}
          className="object-contain w-full h-full mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-110 p-4"
          onError={() => setImgSrc("https://placehold.co/400x400/png?text=Coming+Soon")}
        />

        {/* Floating Quick Add Button (Appears on Hover) */}
        <button
          onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
          className="absolute bottom-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 z-30 flex items-center gap-2"
          title="Quick Add"
        >
          {isInCart ? (
            <>
              <Plus size={16} /> <span className="text-xs font-bold">Add More</span>
            </>
          ) : (
            <>
              <ShoppingCart size={16} /> <span className="text-xs font-bold">Add 6</span>
            </>
          )}
        </button>

        {/* Quantity Input (Only visual on hover if needed, or simplified) */}
        {isInCart && (
          <div className="absolute bottom-4 left-4 z-30" onClick={e => e.stopPropagation()}>
            <div className="bg-white/90 dark:bg-zinc-800/90 backdrop-blur rounded-full px-2 py-1 shadow-md border border-zinc-100 dark:border-zinc-700 flex items-center gap-2">
              <span className="text-xs font-bold px-1">{qty}</span>
            </div>
          </div>
        )}
      </div>

      {/* Clean Typography */}
      <div className="space-y-1">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 min-h-[2.5em]">
          {product.item_name}
        </h3>
        <p className="text-xs text-zinc-400 font-mono">{product.item_code}</p>
      </div>

      {/* Price Area */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">₹{product.standard_rate.toLocaleString()}</span>
          {discountPrice < product.standard_rate && (
            <div className="flex flex-col leading-none">
              <span className="text-[10px] text-green-600 dark:text-green-400 font-bold">Bulk: ₹{discountPrice.toFixed(0)}</span>
              <span className="text-[9px] text-zinc-400 font-medium">For 24+ pcs</span>
            </div>
          )}
        </div>

        {isInCart ? (
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1" onClick={(e) => e.stopPropagation()}>
            <div className="text-xs font-bold px-2">{qty} in cart</div>
          </div>
        ) : (
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-zinc-400 mb-0.5">Min Qty: 6</span>
          </div>
        )}
      </div>
    </div>
  );
}