"use client";

import React from "react";
import { Filter, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@heroui/react";
import { Product } from "@/lib/erp";
import ProductCard from "./ProductCard";

interface ProductGridProps {
    processProducts: Product[];
    groupedProducts: { name: string; items: Product[] }[] | null;
    visibleCategoriesCount: number;
    visibleItemsCount: number;
    expandedSections: Record<string, boolean>;
    setExpandedSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    clearFilters: () => void;
    getCartQty: (code: string) => number;
    handleAdd: (item: Product, qty?: number) => void;
    setSelectedProduct: (p: Product) => void;
    loaderRef: React.RefObject<HTMLDivElement | null>;
}

export default function ProductGrid({
    processProducts,
    groupedProducts,
    visibleCategoriesCount,
    visibleItemsCount,
    expandedSections,
    setExpandedSections,
    clearFilters,
    getCartQty,
    handleAdd,
    setSelectedProduct,
    loaderRef,
    onOpenCart,
    onFilterOpen
}: ProductGridProps & { onOpenCart?: () => void, onFilterOpen?: () => void }) {
    return (
        <div className="min-h-[50vh] px-4 mt-4">
            {processProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Filter size={48} className="opacity-20 mb-4" />
                    <p className="font-medium text-lg">No products match your criteria.</p>
                    <Button variant="light" color="primary" onPress={clearFilters} className="mt-4 font-bold">Clear All Filters</Button>
                </div>
            )}

            {groupedProducts ? (
                <div className="space-y-10">
                    {groupedProducts.slice(0, visibleCategoriesCount).map((group) => {
                        const isExpanded = expandedSections[group.name] || false;
                        const itemsToShow = isExpanded ? group.items : group.items.slice(0, 20);
                        const remaining = group.items.length - 20;

                        return (
                            <div key={group.name} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="flex items-center gap-2 mb-4 sticky top-32 z-10 w-fit">
                                    <div
                                        onClick={() => onFilterOpen?.()}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 active:scale-95"
                                    >
                                        <h2 className="text-xs font-black uppercase tracking-wide text-black dark:text-white">
                                            {group.name} <span className="opacity-60 ml-0.5">({group.items.length})</span>
                                        </h2>
                                        <ChevronDown size={14} className="text-black dark:text-white opacity-60" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                                    {itemsToShow.map(p => (
                                        <ProductCard
                                            key={p.item_code}
                                            product={p}
                                            cartQty={getCartQty(p.item_code)}
                                            onAdd={handleAdd}
                                            onClick={() => setSelectedProduct(p)}
                                            onOpenCart={onOpenCart}
                                        />
                                    ))}
                                </div>

                                {remaining > 0 && !isExpanded && (
                                    <Button
                                        fullWidth
                                        variant="flat"
                                        onPress={() => setExpandedSections(prev => ({ ...prev, [group.name]: true }))}
                                        className="mt-4 font-bold h-12 bg-default-50 text-default-500"
                                    >
                                        Show {remaining} more {group.name} items <ChevronDown size={16} />
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                    {processProducts.slice(0, visibleItemsCount).map(p => (
                        <ProductCard
                            key={p.item_code}
                            product={p}
                            cartQty={getCartQty(p.item_code)}
                            onAdd={handleAdd}
                            onClick={() => setSelectedProduct(p)}
                            onOpenCart={onOpenCart}
                        />
                    ))}
                </div>
            )}

            <div ref={loaderRef} className="w-full py-12 flex justify-center opacity-50">
                {(groupedProducts && visibleCategoriesCount < groupedProducts.length) || (!groupedProducts && visibleItemsCount < processProducts.length)
                    ? <Loader2 className="animate-spin" /> : null}
            </div>
        </div>
    );
}
