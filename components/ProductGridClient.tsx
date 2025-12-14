"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Product } from "@/lib/erp";
import ProductCard from "./ProductCard";
import HeroSection from "./HeroSection"; 
import { 
  X, Minus, Plus, ShoppingBag, ArrowRight, Filter, 
  Loader2, ChevronDown, PlusCircle, Search, SlidersHorizontal, ArrowUpDown, Check
} from "lucide-react";
import { Button, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Chip, Divider } from "@heroui/react";

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

interface CartItem extends Product { qty: number; }

type SortOption = 'default' | 'price_asc' | 'price_desc' | 'material' | 'category';

export default function ProductGridClient({ products = [] }: { products: Product[] }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQ); 
  
  const pathname = usePathname();
  const { replace } = useRouter();

  // Filters
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOption, setSortOption] = useState<SortOption>('default');

  // UI State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [showAddressLine2, setShowAddressLine2] = useState(false);
  
  // Pagination / Visibility
  const [visibleCategoriesCount, setVisibleCategoriesCount] = useState(2);
  const [visibleItemsCount, setVisibleItemsCount] = useState(20); 
  
  // Refs & Hooks
  const loaderRef = useRef<HTMLDivElement>(null);
  const scrollDirection = useScrollDirection(); 
  const { isOpen: isFilterOpen, onOpen: onFilterOpen, onOpenChange: onFilterChange } = useDisclosure();
  const { isOpen: isSortOpen, onOpen: onSortOpen, onOpenChange: onSortChange } = useDisclosure();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({ name: "", phone: "", gst: "", address: "", addressLine2: "", note: "" });

  // --- EFFECTS ---
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null && q !== searchQuery) setSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (searchQuery) params.set("q", searchQuery);
    else params.delete("q");
    replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchQuery]);

  useEffect(() => {
    const saved = localStorage.getItem("nandan_customer_details");
    if (saved) try { setFormData(JSON.parse(saved)); } catch {}
  }, []);

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
  const clearFilters = () => {
    setSelectedBrand("All");
    setSelectedCategory("All");
    setSearchQuery("");
    setSortOption("default");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCartQty = (itemCode: string) => cart.find(i => i.item_code === itemCode)?.qty || 0;

  const handleAdd = (item: Product, customQty?: number) => {
    setCart(prev => {
      const exists = prev.find(p => p.item_code === item.item_code);
      const defaultAdd = exists ? 1 : 6;
      const qtyToAdd = customQty || defaultAdd;
      return exists ? prev.map(p => p.item_code === item.item_code ? { ...p, qty: p.qty + qtyToAdd } : p) : [...prev, { ...item, qty: qtyToAdd }]; 
    });
    setSelectedProduct(null);
  };

  const updateQty = (code: string, delta: number) => {
    setCart(prev => prev.map(item => {
        if (item.item_code !== code) return item;
        const newQty = item.qty + delta;
        if (newQty < 6) return { ...item, qty: 0 }; 
        return { ...item, qty: newQty };
    }).filter(i => i.qty > 0));
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const finalData = { ...formData, address: showAddressLine2 ? `${formData.address}, ${formData.addressLine2}` : formData.address };
    try {
      localStorage.setItem("nandan_customer_details", JSON.stringify(finalData));
      const res = await fetch('/api/order', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ cart, customer: finalData }) });
      if (res.ok) { alert("✅ Order Placed!"); setCart([]); setIsCartOpen(false); setShowMoreDetails(false); }
      else { alert("❌ Failed to place order."); }
    } catch { alert("❌ Connection Error"); } finally { setLoading(false); }
  };

  // --- RENDER HELPERS ---
  const activeFilterCount = (selectedBrand !== "All" ? 1 : 0) + (selectedCategory !== "All" ? 1 : 0);
  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = cart.reduce((sum, i) => {
      const rate = i.qty > 24 ? i.standard_rate * 0.975 : i.standard_rate;
      return sum + (rate * i.qty);
  }, 0);

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
      
      {/* 🚀 ACTION BAR (FILTER + SEARCH + SORT) */}
      <div 
        className={`sticky top-[64px] z-30 transition-transform duration-500 ease-in-out bg-background/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 shadow-sm
        ${scrollDirection === 'down' ? '-translate-y-[120%]' : 'translate-y-0'}`}
      >
         <div className="max-w-[1400px] mx-auto px-4 py-2 flex gap-3 items-center h-16">
            
            {/* 1. FILTER BUTTON */}
            <Button 
              variant="flat" 
              className={`bg-default-100 font-bold ${activeFilterCount > 0 ? 'text-primary' : 'text-default-600'}`}
              onPress={onFilterOpen}
              startContent={<SlidersHorizontal size={18} strokeWidth={2.5} />}
            >
              Filters
              {activeFilterCount > 0 && <span className="bg-primary text-primary-foreground text-[10px] w-5 h-5 flex items-center justify-center rounded-full ml-1">{activeFilterCount}</span>}
            </Button>

            {/* 2. SORT BUTTON */}
            <Button 
              isIconOnly
              variant="flat" 
              className={`bg-default-100 ${sortOption !== 'default' ? 'text-primary' : 'text-default-600'}`}
              onPress={onSortOpen}
            >
              <ArrowUpDown size={18} strokeWidth={2.5} />
            </Button>

            <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700 mx-1"></div>

            {/* 3. SEARCH INPUT */}
            <div className="flex-1 relative group">
               <Input 
                 classNames={{
                   base: "w-full",
                   inputWrapper: "bg-default-100 hover:bg-default-200 transition-colors h-10 rounded-xl pr-2",
                   input: "text-sm font-medium placeholder:text-default-500",
                 }}
                 placeholder="Search products..."
                 startContent={<Search size={18} className="text-default-400 group-hover:text-default-600 transition-colors" />}
                 value={searchQuery}
                 onValueChange={setSearchQuery}
                 isClearable
                 onClear={() => setSearchQuery("")}
               />
            </div>

         </div>
      </div>

      {/* 🚀 HERO SECTION (Transitions) */}
      <div className={`transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden ${isHeroVisible ? 'max-h-[500px] opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'}`}>
        <HeroSection />
      </div>

      {/* 🚀 MAIN GRID */}
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
                            <div className="flex items-center gap-3 mb-4 sticky top-32 z-10 bg-background/50 backdrop-blur-sm py-2 w-fit pr-4 rounded-r-xl">
                                <div className="w-1 h-6 bg-primary rounded-full"></div>
                                <h2 className="text-lg font-black uppercase tracking-tight text-foreground">{group.name}</h2>
                                <span className="text-xs font-bold text-muted-foreground bg-default-100 px-2 py-0.5 rounded-md">{group.items.length}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                                {itemsToShow.map(p => (
                                    <ProductCard 
                                        key={p.item_code} 
                                        product={p} 
                                        cartQty={getCartQty(p.item_code)}
                                        onAdd={handleAdd} 
                                        onClick={() => setSelectedProduct(p)} 
                                    />
                                ))}
                            </div>
                            
                            {remaining > 0 && !isExpanded && (
                                <Button 
                                  fullWidth 
                                  variant="flat" 
                                  onPress={() => setExpandedSections(prev => ({...prev, [group.name]: true}))} 
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
                    />
                ))}
            </div>
        )}

        <div ref={loaderRef} className="w-full py-12 flex justify-center opacity-50">
            {(groupedProducts && visibleCategoriesCount < groupedProducts.length) || (!groupedProducts && visibleItemsCount < processProducts.length) 
              ? <Loader2 className="animate-spin" /> : null}
        </div>
      </div>

      {/* --- CART BAR (Bottom) --- */}
      {totalItems > 0 && !isCartOpen && (
         <div className="fixed bottom-0 left-0 right-0 z-[60] bg-background border-t border-border p-3 md:p-4 shadow-xl animate-in slide-in-from-bottom-full duration-300">
            <Button
              size="lg"
              className="w-full h-14 md:h-16 text-lg font-bold bg-foreground text-background shadow-lg rounded-2xl"
              onPress={() => setIsCartOpen(true)}
            >
               <div className="flex w-full items-center justify-between px-2">
                  <div className="flex flex-col items-start leading-tight gap-0.5">
                     <span className="text-[10px] uppercase opacity-70 font-semibold tracking-wider">{totalItems} ITEMS</span>
                     <span className="text-xl md:text-2xl">₹{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-background/10 py-2 px-4 rounded-xl">
                     <span className="text-sm md:text-base tracking-wide">View Cart</span>
                     <ArrowRight size={20} />
                  </div>
               </div>
            </Button>
         </div>
      )}

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

      {/* --- PRODUCT MODAL (Existing) --- */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200 border border-border flex flex-col max-h-[90vh]">
            <Button isIconOnly variant="flat" onPress={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-10 rounded-full"><X size={20} /></Button>
            <div className="p-8 bg-white flex justify-center items-center h-64 shrink-0 border-b border-zinc-100">
                 <img src={`/images/${selectedProduct.item_code}.jpg`} alt={selectedProduct.item_name} className="max-h-full max-w-full object-contain mix-blend-multiply" onError={(e) => (e.currentTarget.src = "https://placehold.co/600x600/png?text=No+Image")} />
            </div>
            <div className="p-6 overflow-y-auto bg-card">
                <div className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">{selectedProduct.brand || "Nandan Traders"}</div>
                <h2 className="text-xl font-bold text-foreground mb-3 leading-tight">{selectedProduct.item_name}</h2>
                <p className="text-muted-foreground text-sm mb-8 leading-relaxed font-medium">{selectedProduct.description}</p>
                <div className="flex items-center justify-between gap-4 p-4 bg-default-100 rounded-2xl mt-auto">
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Price</div>
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

      {/* --- CART DRAWER (Existing Logic, No Changes) --- */}
      {isCartOpen && (
        <>
            <div className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
            <div className="fixed top-0 left-0 h-full w-full sm:w-[450px] bg-card shadow-2xl z-[61] border-r border-border transform transition-transform duration-300 animate-in slide-in-from-left overflow-hidden flex flex-col">
                <div className="p-5 border-b border-border flex justify-between items-center bg-card flex-none h-[10%] min-h-[70px]">
                    <div><h2 className="text-2xl font-black uppercase tracking-tight text-foreground">Cart</h2><p className="text-xs text-muted-foreground font-medium mt-1">{totalItems} items selected</p></div>
                    <Button isIconOnly variant="light" onPress={() => setIsCartOpen(false)}><X size={24} /></Button>
                </div>
                <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-default-50 h-[60%]">
                    {cart.map(item => (
                        <div key={item.item_code} className="flex gap-3 p-3 bg-card rounded-2xl border border-border items-start group shadow-sm">
                            <div className="flex-1">
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 truncate">{item.item_code}</div>
                                <h4 className="font-bold text-sm text-foreground leading-snug line-clamp-2">{item.item_name}</h4>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs font-mono bg-default-100 px-2 py-1 rounded text-muted-foreground border border-border">₹{item.standard_rate} {item.stock_uom ? `/ ${item.stock_uom}` : ''}</span>
                                    <span className="text-xs text-muted-foreground">x {item.qty}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className="font-black text-base">₹{((item.qty > 24 ? item.standard_rate * 0.975 : item.standard_rate) * item.qty).toLocaleString()}</span>
                                <div className="flex items-center gap-1 bg-default-100 rounded-lg border border-border p-1">
                                  <Button isIconOnly size="sm" variant="light" onPress={() => updateQty(item.item_code, -1)} className="h-6 w-6 min-w-6"><Minus size={14}/></Button>
                                  <span className="w-6 text-center text-xs font-bold">{item.qty}</span>
                                  <Button isIconOnly size="sm" variant="light" onPress={() => updateQty(item.item_code, 1)} className="h-6 w-6 min-w-6"><Plus size={14}/></Button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && ( <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50"><ShoppingBag size={64} strokeWidth={1} className="mb-4" /><p className="text-lg font-medium">Your cart is empty</p><Button variant="light" onPress={() => setIsCartOpen(false)} className="mt-4 font-bold underline">Start Shopping</Button></div>)}
                </div>
                <div className={`border-t border-border bg-card transition-all duration-300 ease-in-out flex flex-col relative ${showMoreDetails ? 'h-full absolute inset-0 z-50' : 'flex-none h-[30%] min-h-[240px]'}`}>
                    {showMoreDetails && ( <div className="p-5 border-b border-border flex justify-between items-center bg-card flex-none"><h3 className="font-bold text-lg flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div> Order Details</h3><Button size="sm" variant="flat" onPress={() => setShowMoreDetails(false)} startContent={<ChevronDown size={14}/>}>Minimize</Button></div>)}
                    <form onSubmit={submitOrder} className="flex flex-col h-full overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-5 pb-0">
                            {!showMoreDetails && ( <div className="flex justify-between items-end mb-4 pb-4 border-b border-border border-dashed flex-none"><span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Pay</span><span className="text-3xl font-black text-foreground">₹{totalPrice.toLocaleString()}</span></div>)}
                            <div className="space-y-3 pb-4">
                                <div className="grid grid-cols-2 gap-3"><Input isRequired label="Name" placeholder="Your Name" value={formData.name} onValueChange={(v: string) => setFormData({...formData, name: v})} /><Input isRequired label="Phone" placeholder="10 digits" type="tel" value={formData.phone} onChange={(e) => { const val = e.target.value; if (/^\d*$/.test(val) && val.length <= 10) setFormData({ ...formData, phone: val }); }} /></div>
                                {!showMoreDetails && ( <Button variant="bordered" onPress={() => setShowMoreDetails(true)} className="w-full font-bold text-muted-foreground border-dashed" startContent={<PlusCircle size={14}/>}>Add Address & GST</Button>)}
                                {showMoreDetails && ( <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4"><div className="flex justify-between items-center py-2 bg-default-100 px-3 rounded-lg"><span className="text-xs font-bold text-muted-foreground uppercase">Cart Total</span><span className="text-xl font-black text-foreground">₹{totalPrice.toLocaleString()}</span></div><div><Input label="GST Number (Optional)" placeholder="Ex: 22AAAAA0000A1Z5" value={formData.gst} onValueChange={(v: string) => setFormData({...formData, gst: v})} /></div><div><div className="flex justify-between items-center mb-1"><span className="text-xs font-bold text-muted-foreground uppercase">Address</span><span onClick={() => setShowAddressLine2(!showAddressLine2)} className="text-primary text-tiny cursor-pointer hover:underline flex items-center gap-1"><PlusCircle size={10}/> Add Line 2</span></div><div className="space-y-2"><textarea placeholder="Street, Building, Area..." rows={2} className="w-full p-3 bg-default-100 rounded-xl outline-none text-sm font-medium resize-none focus:ring-2 ring-primary/50 transition-all" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />{showAddressLine2 && ( <Input placeholder="Landmark / City / Pincode" value={formData.addressLine2} onValueChange={(v: string) => setFormData({...formData, addressLine2: v})} />)}</div></div><div><label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Order Notes</label><textarea placeholder="Special instructions..." rows={2} className="w-full p-3 bg-default-100 rounded-xl outline-none text-sm font-medium resize-none focus:ring-2 ring-primary/50" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} /></div></div>)}
                            </div>
                        </div>
                        <div className="p-5 border-t border-border bg-card flex-none pb-8 sm:pb-6"><Button type="submit" color="primary" size="lg" fullWidth isLoading={loading} isDisabled={cart.length === 0} className="font-black text-lg shadow-xl" endContent={<ArrowRight size={20} />}>{loading ? "Processing..." : "Confirm Order"}</Button></div>
                    </form>
                </div>
            </div>
        </>
      )}
    </div>
  );
}