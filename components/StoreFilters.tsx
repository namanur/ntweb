"use client";

import React from "react";
import { SlidersHorizontal, ArrowUpDown, X, Check } from "lucide-react";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Chip, Divider } from "@heroui/react";

type SortOption = 'default' | 'price_asc' | 'price_desc' | 'material' | 'category';

interface StoreFiltersProps {
    productsCount: number;
    scrollDirection: string;
    activeFilterCount: number;
    onFilterOpen: () => void;
    clearFilters: () => void;
    onSortOpen: () => void;
    sortOption: SortOption;
    isFilterOpen: boolean;
    onFilterChange: (isOpen: boolean) => void;
    selectedBrand: string;
    setSelectedBrand: (val: string) => void;
    BRANDS: string[];
    selectedCategory: string;
    setSelectedCategory: (val: string) => void;
    availableCategories: string[];
    isSortOpen: boolean;
    onSortChange: (isOpen: boolean) => void;
    setSortOption: (val: SortOption) => void;
}

export default function StoreFilters({
    productsCount,
    scrollDirection,
    activeFilterCount,
    onFilterOpen,
    clearFilters,
    onSortOpen,
    sortOption,
    isFilterOpen,
    onFilterChange,
    selectedBrand,
    setSelectedBrand,
    BRANDS,
    selectedCategory,
    setSelectedCategory,
    availableCategories,
    isSortOpen,
    onSortChange,
    setSortOption
}: StoreFiltersProps) {
    return (
        <>
            {/* 🚀 ACTION BAR (FILTER + SEARCH + SORT) */}
            <div
                className={`sticky top-[64px] z-35 transition-transform duration-500 ease-in-out bg-background/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-sm
        ${scrollDirection === 'down' ? '-translate-y-[120%]' : 'translate-y-0'}`}
            >
                <div className="max-w-[1400px] mx-auto px-4 py-2 flex justify-between items-center h-16">

                    {/* LEFT: TITLE */}
                    <div className="flex flex-col justify-center">
                        <h2 className="text-xl font-black uppercase tracking-tight text-foreground leading-none">Collection</h2>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{productsCount} Items</p>
                    </div>

                    {/* RIGHT: ACTIONS */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="flat"
                            className="bg-default-100 font-bold text-default-600"
                            onPress={onFilterOpen}
                            startContent={<SlidersHorizontal size={18} strokeWidth={2.5} />}
                        >
                            Filters
                            {activeFilterCount > 0 && <span className="bg-zinc-800 text-white dark:bg-zinc-200 dark:text-black text-[10px] w-5 h-5 flex items-center justify-center rounded-full ml-1">{activeFilterCount}</span>}
                        </Button>

                        {activeFilterCount > 0 && (
                            <Button
                                variant="flat"
                                color="danger"
                                className="bg-default-100 font-bold text-danger px-3 h-10 min-w-0"
                                onPress={clearFilters}
                            >
                                <X size={18} />
                            </Button>
                        )}

                        <Button
                            isIconOnly
                            variant="flat"
                            className={`bg-default-100 ${sortOption !== 'default' ? 'text-primary' : 'text-default-600'}`}
                            onPress={onSortOpen}
                        >
                            <ArrowUpDown size={18} strokeWidth={2.5} />
                        </Button>
                    </div>

                </div>
            </div>

            {/* --- FILTER MODAL --- */}
            <Modal
                isOpen={isFilterOpen}
                onOpenChange={onFilterChange}
                scrollBehavior="inside"
                placement="center"
                backdrop="blur"
                classNames={{ base: "max-w-md m-4 rounded-3xl" }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1 border-b border-default-100 p-5">
                                <span className="text-xl font-black uppercase tracking-tight">Filter Catalog</span>
                            </ModalHeader>
                            <ModalBody className="p-0">
                                <div className="flex flex-col">
                                    {/* Brands Section */}
                                    <div className="p-5">
                                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Brands</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <Chip
                                                className="cursor-pointer font-bold border-1"
                                                variant={selectedBrand === "All" ? "solid" : "bordered"}
                                                color={selectedBrand === "All" ? "primary" : "default"}
                                                onClick={() => setSelectedBrand("All")}
                                            >
                                                All Brands
                                            </Chip>
                                            {BRANDS.map(b => (
                                                <Chip
                                                    key={b}
                                                    className="cursor-pointer font-bold border-1"
                                                    variant={selectedBrand === b ? "solid" : "bordered"}
                                                    color={selectedBrand === b ? "primary" : "default"}
                                                    onClick={() => setSelectedBrand(b)}
                                                >
                                                    {b}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>

                                    <Divider />

                                    {/* Categories Section */}
                                    <div className="p-5">
                                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Categories</h3>
                                        <div className="flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                            <Chip
                                                className="cursor-pointer font-medium border-1"
                                                variant={selectedCategory === "All" ? "solid" : "bordered"}
                                                onClick={() => setSelectedCategory("All")}
                                            >
                                                All Categories
                                            </Chip>
                                            {availableCategories.map(cat => (
                                                <Chip
                                                    key={cat}
                                                    className="cursor-pointer font-medium border-1"
                                                    variant={selectedCategory === cat ? "solid" : "bordered"}
                                                    color={selectedCategory === cat ? "secondary" : "default"}
                                                    onClick={() => setSelectedCategory(cat)}
                                                >
                                                    {cat}
                                                </Chip>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter className="border-t border-default-100 p-4">
                                <Button variant="light" color="danger" onPress={() => { clearFilters(); onClose(); }}>Reset</Button>
                                <Button color="primary" className="font-bold flex-1" onPress={onClose}>Show Results</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* --- SORT MODAL --- */}
            <Modal
                isOpen={isSortOpen}
                onOpenChange={onSortChange}
                placement="bottom"
                classNames={{ base: "max-w-sm m-4 rounded-3xl" }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="border-b border-default-100 p-5">
                                <span className="text-lg font-black uppercase tracking-tight">Sort By</span>
                            </ModalHeader>
                            <ModalBody className="p-2 gap-1">
                                {[
                                    { key: 'default', label: 'Default' },
                                    { key: 'price_asc', label: 'Price: Low to High' },
                                    { key: 'price_desc', label: 'Price: High to Low' },
                                    { key: 'material', label: 'Material (Steel First)' },
                                    { key: 'category', label: 'Category Priority' },
                                ].map((opt) => (
                                    <Button
                                        key={opt.key}
                                        variant={sortOption === opt.key ? "flat" : "light"}
                                        color={sortOption === opt.key ? "primary" : "default"}
                                        className="justify-between h-12 text-medium px-4"
                                        onPress={() => { setSortOption(opt.key as SortOption); onClose(); }}
                                        endContent={sortOption === opt.key && <Check size={18} />}
                                    >
                                        {opt.label}
                                    </Button>
                                ))}
                            </ModalBody>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}
