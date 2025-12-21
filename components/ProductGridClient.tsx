"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Product, ProductMetadata } from "@/lib/erp";
import ProductCard from "./ProductCard";
import HeroSection from "./HeroSection";
import Image from "next/image";
import { X, Plus, ShoppingBag } from "lucide-react";
import { Button, useDisclosure } from "@heroui/react";
import { useCart } from "@/contexts/CartContext";
import StoreFilters from "./StoreFilters";
import ProductGrid from "./ProductGrid";
import CartDrawer from "./CartDrawer";
import { calculateOrderTotal } from "@/lib/shop-rules";
import { useStoreFilters } from "@/hooks/useStoreFilters";

// --- SCROLL HOOK ---
function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState("up");
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY ? "down" : "up";
      if (direction !== scrollDirection && (Math.abs(scrollY - lastScrollY) > 10)) {
        setScrollDirection(direction);
      }
      setLastScrollY(scrollY > 0 ? scrollY : 0);
    };
    window.addEventListener("scroll", updateScrollDirection);
    return () => window.removeEventListener("scroll", updateScrollDirection);
  }, [scrollDirection, lastScrollY]);

  return scrollDirection;
}

// --- CONFIG ---
const BRANDS = ["Anjali", "MaxFresh", "Tibros", "Sigma"];
const CATEGORY_PRIORITY = ["Pressure Cooker", "Bottle", "Lunch Box", "Steelware", "Crockery"];

// Fuzzy Search
const levenshteinDistance = (a: string, b: string) => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
  for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
};

const fuzzyMatch = (text: string, search: string) => {
  if (!text) return false;
  const cleanText = text.toLowerCase().replace(/\s+/g, ' ').trim();
  const cleanSearch = search.toLowerCase().replace(/\s+/g, ' ').trim();
  if (cleanText.includes(cleanSearch)) return true;
  return cleanSearch.split(' ').every(searchTerm => {
    return cleanText.split(' ').some(word => {
      const allowedErrors = searchTerm.length > 6 ? 2 : searchTerm.length > 3 ? 1 : 0;
      if (Math.abs(word.length - searchTerm.length) > allowedErrors) return false;
      return levenshteinDistance(word, searchTerm) <= allowedErrors;
    });
  });
};





export default function ProductGridClient({ products = [], metadata, isStale = false }: { products: Product[], metadata?: ProductMetadata | null, isStale?: boolean }) {
  // --- CART CONTEXT ---
  const { cart, addToCart, getCartQty } = useCart();

  // Filters (URL Based)
  const {
    searchQuery, setSearchQuery,
    selectedBrand, setSelectedBrand,
    selectedCategory, setSelectedCategory,
    sortOption, setSortOption,
    clearFilters
  } = useStoreFilters();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalImage, setModalImage] = useState("");

  useEffect(() => {
    if (selectedProduct) {
      setModalImage(`/images/${selectedProduct.item_code}.jpg`);
    }
  }, [selectedProduct]);

  // Pagination / Visibility
  const [visibleCategoriesCount, setVisibleCategoriesCount] = useState(2);
  const [visibleItemsCount, setVisibleItemsCount] = useState(20);

  // Refs & Hooks
  const loaderRef = useRef<HTMLDivElement>(null);
  const scrollDirection = useScrollDirection();
  const { isOpen: isFilterOpen, onOpen: onFilterOpen, onOpenChange: onFilterChange } = useDisclosure();
  const { isOpen: isSortOpen, onOpen: onSortOpen, onOpenChange: onSortChange } = useDisclosure();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});



  // --- FILTER & SORT LOGIC ---
  const isHeroVisible = searchQuery.trim() === "" && selectedBrand === "All" && selectedCategory === "All";

  const availableCategories = useMemo(() => {
    const allCats = products.map(p => p.item_group || "Other");
    return Array.from(new Set(allCats)).sort();
  }, [products]);

  const processProducts = useMemo(() => {
    let result = products;

    // 1. Filter by Brand
    if (selectedBrand !== "All") {
      result = result.filter(p => p.brand === selectedBrand);
    }

    // 2. Filter by Search OR Category
    if (searchQuery.trim().length > 0) {
      result = result.filter(p =>
        fuzzyMatch(p.item_name || "", searchQuery) ||
        fuzzyMatch(p.item_code || "", searchQuery) ||
        fuzzyMatch(p.item_group || "", searchQuery)
      );
    } else if (selectedCategory !== "All") {
      result = result.filter(p => (p.item_group || "Other") === selectedCategory);
    }

    // 3. Sorting
    if (sortOption !== 'default') {
      result = [...result].sort((a, b) => {
        switch (sortOption) {
          case 'price_asc':
            return a.standard_rate - b.standard_rate;
          case 'price_desc':
            return b.standard_rate - a.standard_rate;
          case 'material':
            // Priority to Steel items
            const aSteel = (a.item_name + a.description).toLowerCase().includes('steel') ? 1 : 0;
            const bSteel = (b.item_name + b.description).toLowerCase().includes('steel') ? 1 : 0;
            return bSteel - aSteel;
          case 'category':
            const idxA = CATEGORY_PRIORITY.indexOf(a.item_group || "");
            const idxB = CATEGORY_PRIORITY.indexOf(b.item_group || "");
            const valA = idxA === -1 ? 999 : idxA;
            const valB = idxB === -1 ? 999 : idxB;
            return valA - valB;
          default: return 0;
        }
      });
    }

    return result;
  }, [products, selectedBrand, selectedCategory, searchQuery, sortOption]);

  // Grouping logic (Only if not searching/sorting specifically breaks groups, but keeping consistent with original intent)
  const groupedProducts = useMemo(() => {
    if (selectedCategory !== "All" || searchQuery.trim().length > 0 || sortOption !== 'default') return null;

    const groups: Record<string, Product[]> = {};
    processProducts.forEach(p => {
      const g = p.item_group || "Other";
      if (!groups[g]) groups[g] = [];
      groups[g].push(p);
    });

    const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
      const idxA = CATEGORY_PRIORITY.indexOf(a);
      const idxB = CATEGORY_PRIORITY.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return sortedGroupKeys.map(key => ({ name: key, items: groups[key] }));
  }, [processProducts, selectedCategory, searchQuery, sortOption]);

  // --- ACTIONS ---


  const handleAdd = (item: Product, customQty?: number) => {
    addToCart(item, customQty);
    setSelectedProduct(null);
  };

  // --- RENDER HELPERS ---
  const activeFilterCount = (selectedBrand !== "All" ? 1 : 0) + (selectedCategory !== "All" ? 1 : 0);
  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = calculateOrderTotal(cart);

  // Lazy Load Observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (groupedProducts) setVisibleCategoriesCount(prev => prev + 2);
        else setVisibleItemsCount(prev => prev + 20);
      }
    }, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [groupedProducts, processProducts]);


  return (
    <div className="w-full pb-32">

      {/* ⚠️ STALENESS WARNING */}
      {isStale && metadata && (
        <div className="w-full bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 p-3 text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
          <span>⚠️ Data may be stale.</span>
          <span className="opacity-70">Last Synced: {new Date(metadata.generated_at).toLocaleString()}</span>
        </div>
      )}

      {/* 🚀 ACTION BAR & FILTERS */}
      <StoreFilters
        productsCount={products.length}
        scrollDirection={scrollDirection}
        activeFilterCount={activeFilterCount}
        onFilterOpen={onFilterOpen}
        clearFilters={clearFilters}
        onSortOpen={onSortOpen}
        sortOption={sortOption}
        isFilterOpen={isFilterOpen}
        onFilterChange={onFilterChange}
        selectedBrand={selectedBrand}
        setSelectedBrand={setSelectedBrand}
        BRANDS={BRANDS}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        availableCategories={availableCategories}
        isSortOpen={isSortOpen}
        onSortChange={onSortChange}
        setSortOption={setSortOption}
      />

      {/* 🚀 HERO SECTION (Transitions) */}
      <div className={`transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden ${isHeroVisible ? 'max-h-[500px] opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'}`}>
        <HeroSection
          onBrandSelect={(brand) => setSelectedBrand(brand)}
          selectedBrand={selectedBrand}
        />
      </div>

      {/* 🚀 MAIN GRID */}
      <ProductGrid
        processProducts={processProducts}
        groupedProducts={groupedProducts}
        visibleCategoriesCount={visibleCategoriesCount}
        visibleItemsCount={visibleItemsCount}
        expandedSections={expandedSections}
        setExpandedSections={setExpandedSections}
        clearFilters={clearFilters}
        getCartQty={getCartQty}
        handleAdd={handleAdd}
        setSelectedProduct={setSelectedProduct}
        loaderRef={loaderRef}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* --- CART BAR (Floating Bubble) --- */}
      {totalItems > 0 && !isCartOpen && (
        <div className="fixed bottom-6 right-6 z-[60] animate-in zoom-in slide-in-from-bottom-10 duration-300">
          <Button
            size="lg"
            className="h-16 w-auto px-6 shadow-xl shadow-primary/20 rounded-full bg-primary text-primary-foreground font-bold flex items-center gap-4 hover:scale-105 transition-transform"
            onPress={() => setIsCartOpen(true)}
          >
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[11px] uppercase opacity-80 tracking-wider font-semibold">{totalItems} ITEMS</span>
              <span className="text-lg">₹{totalPrice.toLocaleString()}</span>
            </div>
            <div className="bg-white/20 dark:bg-black/10 p-2 rounded-full">
              <ShoppingBag size={20} />
            </div>
          </Button>
        </div>
      )}


      {/* --- PRODUCT MODAL (Existing) --- */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200 border border-border flex flex-col max-h-[90vh]">
            <Button isIconOnly variant="flat" onPress={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-10 rounded-full"><X size={20} /></Button>
            <div className="p-8 bg-white flex justify-center items-center h-64 shrink-0 border-b border-zinc-100 relative">
              <Image
                src={modalImage || `/images/${selectedProduct.item_code}.jpg`}
                alt={selectedProduct.item_name}
                width={500}
                height={500}
                className="max-h-full max-w-full object-contain mix-blend-multiply"
                priority
                onError={() => setModalImage("https://placehold.co/600x600/png?text=Coming+Soon")}
              />
            </div>
            <div className="p-6 overflow-y-auto bg-card">
              <div className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">{selectedProduct.brand || "Nandan Traders"}</div>
              <h2 className="text-xl font-bold text-foreground mb-3 leading-tight">{selectedProduct.item_name}</h2>
              <p className="text-muted-foreground text-sm mb-8 leading-relaxed font-medium">{selectedProduct.description}</p>
              <div className="flex items-center justify-between gap-4 p-4 bg-default-100 rounded-2xl mt-auto">
                <div>
                  <div className="text-[11px] uppercase text-muted-foreground font-bold tracking-wider">Price</div>
                  <div className="text-3xl font-black text-foreground">
                    ₹{selectedProduct.standard_rate}
                  </div>
                </div>
                <Button
                  color="primary"
                  size="lg"
                  onPress={() => handleAdd(selectedProduct)}
                  className="flex-1 font-bold shadow-lg"
                  startContent={<Plus size={20} />}
                >
                  {getCartQty(selectedProduct.item_code) > 0 ? "Add +1" : "Add 6 (Min)"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- CART DRAWER --- */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </div>
  );
}