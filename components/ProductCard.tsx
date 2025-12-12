"use client";

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/erp';
import { Plus, ShoppingCart, Minus } from 'lucide-react';
import { Card, CardBody, CardFooter, Image, Button, Input } from "@heroui/react";

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
    <Card 
      isPressable 
      onPress={handlePress}
      className={`w-full border-none shadow-sm hover:shadow-md transition-shadow duration-200 ${isInCart ? 'ring-2 ring-primary' : ''}`}
    >
      <CardBody className="p-0 overflow-visible relative">
        {showBrand && (
          <div className="absolute top-2 left-2 z-20">
             <span className="text-[10px] font-bold bg-background/80 backdrop-blur-md px-2 py-1 rounded-full border border-divider shadow-sm">
                {product.brand}
             </span>
          </div>
        )}
        
        <div className="absolute top-2 right-2 z-20">
           <span className="text-[10px] font-mono font-bold text-default-500 bg-background/50 px-1.5 py-0.5 rounded-md">
             {product.item_code}
           </span>
        </div>

        <div className="aspect-square p-6 flex items-center justify-center bg-white">
           <Image
             src={getImageUrl()}
             alt={product.item_name}
             className="object-contain w-full h-full mix-blend-multiply"
             radius="lg"
             shadow="none"
             onError={(e) => (e.currentTarget.src = "https://placehold.co/400x400/png?text=No+Image")}
           />
        </div>
      </CardBody>

      <CardFooter className="flex flex-col items-start p-3 bg-default-50/50 backdrop-blur-sm space-y-3">
        <div className="w-full">
           <h3 className="text-sm font-semibold leading-tight line-clamp-2 min-h-[2.5em]" title={product.item_name}>
             {product.item_name}
           </h3>
        </div>

        <div className="flex flex-col w-full gap-1">
           <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-default-900">₹{product.standard_rate.toLocaleString()}</span>
              {product.stock_uom && <span className="text-tiny text-default-400">/{product.stock_uom}</span>}
           </div>
           <div className="text-[10px] font-medium text-success bg-success-50 px-2 py-0.5 rounded w-fit">
              24+ @ ₹{discountPrice.toFixed(2)}
           </div>
        </div>

        <div 
          className="flex items-center gap-2 w-full mt-1" 
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
           <Input
             type="number"
             min={minQty}
             value={String(qty)}
             size="sm"
             variant="bordered"
             classNames={{
               base: "w-16 flex-none",
               input: "text-center font-bold",
               inputWrapper: "px-1 h-9 min-h-9 border-default-200"
             }}
             onValueChange={(v) => setQty(Math.max(minQty, Number(v) || minQty))}
           />
           
           <Button
             size="sm"
             color={isInCart ? "success" : "primary"}
             variant="solid"
             className="flex-1 font-bold h-9 min-h-9 shadow-sm"
             onPress={handleAddToCart}
             startContent={isInCart ? <Plus size={16} /> : <ShoppingCart size={16} />}
           >
             {isInCart ? "Add More" : "Add"}
           </Button>
        </div>
      </CardFooter>
    </Card>
  );
}