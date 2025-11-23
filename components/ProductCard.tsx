"use client";

import React, { useState } from 'react';
import { Product } from '@/lib/erp';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAdd: (item: Product) => void;
  onClick?: () => void; // ✅ Added optional click handler
}

export default function ProductCard({ product, onAdd, onClick }: ProductCardProps) {
  const [imgSrc, setImgSrc] = useState(`/images/${product.item_code}.jpg`);

  return (
    <div 
      // ✅ Added onClick to the main container
      onClick={onClick}
      className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow h-full cursor-pointer group"
    >
      
      {/* IMAGE */}
      <div className="h-36 sm:h-48 w-full p-4 bg-white flex items-center justify-center border-b border-gray-100 dark:border-gray-800 relative">
        <img 
          src={imgSrc} 
          alt={product.item_name}
          className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
          onError={() => setImgSrc("https://placehold.co/400x400/png?text=No+Image")}
        />
      </div>

      {/* TEXT CONTENT */}
      <div className="p-3 flex flex-col flex-grow">
        <div className="text-[10px] font-bold text-gray-400 uppercase mb-1 truncate">
          {product.item_code}
        </div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-2 leading-snug">
          {product.item_name}
        </h3>
        
        {/* PRICE & BUTTON ROW */}
        <div className="mt-auto flex items-center justify-between pt-2">
          <div>
            <span className="text-xs text-gray-500 block">Price</span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              ₹{product.standard_rate}
            </span>
          </div>

          <button 
            onClick={(e) => {
              e.stopPropagation(); // Prevents opening the modal when clicking Add
              onAdd(product);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white h-9 w-9 rounded-lg flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}