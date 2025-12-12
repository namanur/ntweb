"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Product } from "@/lib/erp";
import ProductCard from "./ProductCard";
import HeroSection from "./HeroSection"; 
import { X, Minus, Plus, ShoppingBag, ArrowRight, Filter, Loader2, ChevronDown, ArrowUp, PlusCircle, Search, SlidersHorizontal, Grid } from "lucide-react";

// --- SCROLL HOOK (With Threshold to prevent jitter) ---
function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState("up");
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      // Buffer of 10px to prevent rapid shuttering on tiny scrolls
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

interface CartItem extends Product {
  qty: number;
}

const BRANDS = [
  { name: "Anjali", logo: "/brands/anjali.png" },
  { name: "MaxFresh", logo: "/brands/maxfresh.png" },
  { name: "Tibros", logo: "/brands/tibros.png" },
  { name: "Sigma", logo: "/brands/sigma.png" },
];

const CATEGORY_PRIORITY = ["Pressure Cooker", "Bottle", "Lunch Box", "Steelware", "Crockery"];

const sortCategories = (a: string, b: string) => {
  const idxA = CATEGORY_PRIORITY.indexOf(a);
  const idxB = CATEGORY_PRIORITY.indexOf(b);
  if (idxA !== -1 && idxB !== -1) return idxA - idxB;
  if (idxA !== -1) return -1;
  if (idxB !== -1) return 1;
  return a.localeCompare(b);
};

// Fuzzy Search Helpers
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
  const searchTerms = cleanSearch.split(' ');
  if (searchTerms.every(term => cleanText.includes(term))) return true;
  const words = cleanText.split(' ');
  return searchTerms.every(searchTerm => {
    return words.some(word => {
      const allowedErrors = searchTerm.length > 6 ? 2 : searchTerm.length > 3 ? 1 : 0;
      if (Math.abs(word.length - searchTerm.length) > allowedErrors) return false;
      return levenshteinDistance(word, searchTerm) <= allowedErrors;
    });
  });
};

export default function ProductGridClient({ products = [] }: { products: Product[] }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(initialQ); 

  const pathname = usePathname();
  const { replace } = useRouter();

  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [loading, setLoading] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [showAddressLine2, setShowAddressLine2] = useState(false);
  
  const [visibleCategoriesCount, setVisibleCategoriesCount] = useState(2);
  const [visibleItemsCount, setVisibleItemsCount] = useState(20); 
  const loaderRef = useRef<HTMLDivElement>(null);
  const scrollDirection = useScrollDirection(); 

  // ✅ Refs Definition (Fixed ReferenceError)
  const gridTopRef = useRef<HTMLDivElement>(null);
  const moreDetailsRef = useRef<HTMLDivElement>(null);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({ name: "", phone: "", gst: "", address: "", addressLine2: "", note: "" });

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

  const isHeroVisible = searchQuery.trim() === "" && selectedBrand === "All" && selectedCategory === "All";

  useEffect(() => {
    const saved = localStorage.getItem("nandan_customer_details");
    if (saved) try { setFormData(JSON.parse(saved)); } catch {}
  }, []);

  useEffect(() => {
    setVisibleCategoriesCount(2);
    setVisibleItemsCount(20);
    if (selectedBrand !== "All") setSelectedCategory("All");
  }, [selectedBrand, searchQuery, selectedCategory]);

  const clearSearch = () => {
    setSearchQuery("");
    setSelectedBrand("All");
    setSelectedCategory("All");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const productsInBrand = useMemo(() => {
    if (selectedBrand === "All") return products;
    return products.filter(p => p.brand === selectedBrand);
  }, [products, selectedBrand]);

  const availableCategories = useMemo(() => {
    const groups = productsInBrand.map(p => p.item_group || "Other");
    return ["All", ...Array.from(new Set(groups)).sort(sortCategories)];
  }, [productsInBrand]);

  // Split categories for UI (Top 6 + Others)
  const topCategories = availableCategories.slice(1, 7); // Skip "All"
  const moreCategories = availableCategories.slice(7);

  const filteredProducts = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      return products.filter(p => 
        fuzzyMatch(p.item_name || "", searchQuery) ||
        fuzzyMatch(p.item_code || "", searchQuery) ||
        fuzzyMatch(p.item_group || "", searchQuery)
      );
    } else {
      let filtered = productsInBrand;
      if (selectedCategory !== "All") {
        filtered = filtered.filter(p => (p.item_group || "Other") === selectedCategory);
      }
      return filtered;
    }
  }, [searchQuery, products, productsInBrand, selectedCategory]);

  const groupedProducts = useMemo(() => {
    if (selectedCategory !== "All" || searchQuery.trim().length > 0) return null; 
    const groups: Record<string, Product[]> = {};
    filteredProducts.forEach(p => {
      const g = p.item_group || "Other";
      if (!groups[g]) groups[g] = [];
      groups[g].push(p);
    });
    return Object.keys(groups).sort(sortCategories).map(key => ({ name: key, items: groups[key] }));
  }, [filteredProducts, selectedCategory, searchQuery]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (groupedProducts) setVisibleCategoriesCount(prev => prev + 2);
        else setVisibleItemsCount(prev => prev + 20);
      }
    }, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [groupedProducts]);

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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*$/.test(val) && val.length <= 10) setFormData({ ...formData, phone: val });
  };

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
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

  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = cart.reduce((sum, i) => {
      const rate = i.qty > 24 ? i.standard_rate * 0.975 : i.standard_rate;
      return sum + (rate * i.qty);
  }, 0);

  const SECTION_LIMIT = 20;

  return (
    <div className="w-full pb-32" ref={gridTopRef}>
      
      {/* 🚀 TOP FILTER BAR (Smoother Transition) */}
      <div className={`sticky top-[64px] z-30 transition-transform duration-700 ease-in-out ${scrollDirection === 'down' ? '-translate-y-[120%]' : 'translate-y-0'}`}>
         {/* ✅ Solid Background */}
         <div className="bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 shadow-sm py-4 px-4">
             <div className="flex flex-col gap-4 max-w-6xl mx-auto">
                 
                 {/* Only show filters if not searching */}
                 {searchQuery.trim().length === 0 && (
                  <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-1">
                      
                      {/* Brand Chips (Horizontal) */}
                      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                          <button onClick={() => setSelectedBrand("All")} className={`flex-shrink-0 px-5 py-2 rounded-full font-bold text-sm border transition-all ${selectedBrand === "All" ? "bg-black text-white border-black dark:bg-white dark:text-black" : "bg-zinc-100 text-zinc-500 border-transparent hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}>All Brands</button>
                          {BRANDS.map((brand) => (
                          <button key={brand.name} onClick={() => setSelectedBrand(brand.name)} className={`flex-shrink-0 flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm border transition-all ${selectedBrand === brand.name ? `bg-black text-white border-black dark:bg-white dark:text-black` : "bg-zinc-100 text-zinc-500 border-transparent hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"}`}>
                              {brand.name}
                          </button>))}
                      </div>

                      {/* Category Chips (Top 6 + Dropdown) */}
                      <div className="flex gap-2 overflow-x-auto no-scrollbar items-center">
                          <button onClick={() => setSelectedCategory('All')} className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${selectedCategory === 'All' ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-black' : 'bg-transparent border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900'}`}>All</button>
                          
                          {/* Top Categories */}
                          {topCategories.map(cat => (
                              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-all border ${selectedCategory === cat ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-black' : 'bg-transparent border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900'}`}>{cat}</button>
                          ))}

                          {/* "More" Dropdown for the rest */}
                          {moreCategories.length > 0 && (
                             <div className="relative flex-shrink-0">
                                <select 
                                  value={moreCategories.includes(selectedCategory) ? selectedCategory : ""}
                                  onChange={(e) => setSelectedCategory(e.target.value)}
                                  className={`appearance-none pl-4 pr-8 py-2 rounded-lg text-xs font-bold transition-all border outline-none cursor-pointer ${moreCategories.includes(selectedCategory) ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-black' : 'bg-transparent border-zinc-200 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900'}`}
                                >
                                    <option value="" disabled>More...</option>
                                    {moreCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                                <ChevronDown size={12} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${moreCategories.includes(selectedCategory) ? 'text-white dark:text-black' : 'text-muted-foreground'}`} />
                             </div>
                          )}
                      </div>
                  </div>
                 )}
             </div>
         </div>
      </div>

      {/* 🚀 HERO SECTION */}
      <div className={`transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden ${isHeroVisible ? 'max-h-[300px] opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'}`}>
        <HeroSection />
      </div>

      {/* 🚀 FIXED BOTTOM SEARCH BAR (Mobile Thumb Zone) */}
      {/* ✅ Solid Background, no translucent glass to fix visibility */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 p-3 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.1)] md:hidden">
          <div className="relative w-full flex gap-3 items-center">
             <div className="relative flex-1">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                 <input 
                    type="text" 
                    placeholder="Search for items..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-10 py-3.5 bg-zinc-100 dark:bg-zinc-900 rounded-2xl text-base font-medium border-none focus:ring-2 focus:ring-red-500/50 outline-none transition-all placeholder:text-muted-foreground text-foreground"
                 />
                 {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full text-foreground"><X size={12}/></button>}
             </div>
             
             {/* Cart Button (If items exist) */}
             {totalItems > 0 && !isCartOpen && (
                 <button onClick={() => setIsCartOpen(true)} className="bg-black dark:bg-white text-white dark:text-black p-3.5 rounded-2xl shadow-lg relative animate-in zoom-in">
                    <ShoppingBag size={20} />
                    <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-black">{totalItems}</span>
                 </button>
             )}
          </div>
      </div>

      {/* --- PRODUCT GRID --- */}
      <div className="min-h-[50vh] px-4 md:px-0 mt-4">
        {groupedProducts ? (
            <div className="space-y-12"> 
                {groupedProducts.slice(0, visibleCategoriesCount).map((group) => {
                    const isExpanded = expandedSections[group.name] || false;
                    const itemsToShow = isExpanded ? group.items : group.items.slice(0, SECTION_LIMIT);
                    const remainingCount = group.items.length - SECTION_LIMIT;
                    const hasMore = group.items.length > SECTION_LIMIT;

                    return (
                        <div key={group.name} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center gap-4 mb-6">
                                <h2 className="text-xl font-black uppercase tracking-tight text-foreground">{group.name}</h2>
                                <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
                                <span className="text-xs font-bold text-muted-foreground bg-zinc-100 dark:bg-zinc-900 px-2 py-1 rounded-md">{group.items.length} Items</span>
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
                            
                            {hasMore && !isExpanded && (
                                <button onClick={() => toggleSection(group.name)} className="w-full mt-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-foreground font-bold text-xs rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                    Show {remainingCount} more in {group.name} <ChevronDown size={14} className="inline ml-1"/>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {filteredProducts.slice(0, visibleItemsCount).map(p => (
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

        <div ref={loaderRef} className="w-full py-12 flex justify-center items-center">
            {((groupedProducts && visibleCategoriesCount < groupedProducts.length) || 
              (!groupedProducts && visibleItemsCount < filteredProducts.length)) ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest">Loading...</span>
                </div>
            ) : (
                <div className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">End of Catalog</div>
            )}
        </div>

        {filteredProducts.length === 0 && (
          <div className="col-span-full text-center py-20 text-muted-foreground">
             <Filter className="mx-auto mb-2 opacity-50" size={32} />
             <p className="font-medium">No items found.</p>
             <button onClick={clearSearch} className="text-primary text-sm underline mt-4 font-bold">Show All Products</button>
          </div>
        )}
      </div>

      {/* --- DESKTOP FLOATING CART --- */}
      {!isCartOpen && totalItems > 0 && (
        <button 
          onClick={() => setIsCartOpen(true)} 
          className="hidden md:flex fixed bottom-8 right-8 z-40 bg-foreground text-background p-4 rounded-full shadow-2xl hover:scale-110 transition-all items-center gap-2"
        >
          <ShoppingBag size={24} />
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-background">{totalItems}</span>
        </button>
      )}

      {/* --- CART DRAWER & PRODUCT MODAL --- */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200 border border-border flex flex-col max-h-[90vh]">
            <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-10 bg-black/10 dark:bg-white/10 p-2 rounded-full hover:bg-black/20 dark:hover:bg-white/20 transition-colors backdrop-blur-sm"><X size={20} /></button>
            <div className="p-8 bg-white flex justify-center items-center h-64 shrink-0 border-b border-zinc-100">
                 <img src={`/images/${selectedProduct.item_code}.jpg`} alt={selectedProduct.item_name} className="max-h-full max-w-full object-contain mix-blend-multiply" onError={(e) => (e.currentTarget.src = "https://placehold.co/600x600/png?text=No+Image")} />
            </div>
            <div className="p-6 overflow-y-auto bg-card">
                <div className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">{selectedProduct.brand || "Nandan Traders"}</div>
                <h2 className="text-xl font-bold text-foreground mb-3 leading-tight">{selectedProduct.item_name}</h2>
                <p className="text-muted-foreground text-sm mb-8 leading-relaxed font-medium">{selectedProduct.description}</p>
                <div className="flex items-center justify-between gap-4 p-4 bg-secondary/30 rounded-2xl mt-auto">
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Price</div>
                      <div className="text-3xl font-black text-foreground">
                        ₹{selectedProduct.standard_rate}
                      </div>
                    </div>
                    <button 
                        onClick={() => handleAdd(selectedProduct)} 
                        className="flex-1 bg-foreground text-background py-4 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Plus size={20} /> 
                        {getCartQty(selectedProduct.item_code) > 0 ? "Add +1" : "Add 6 (Min)"}
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {isCartOpen && (
        <>
            <div className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
            <div className="fixed top-0 left-0 h-full w-full sm:w-[450px] bg-card shadow-2xl z-[61] border-r border-border transform transition-transform duration-300 animate-in slide-in-from-left overflow-hidden flex flex-col">
                <div className="p-5 border-b border-border flex justify-between items-center bg-card flex-none h-[10%] min-h-[70px]">
                    <div><h2 className="text-2xl font-black uppercase tracking-tight text-foreground">Cart</h2><p className="text-xs text-muted-foreground font-medium mt-1">{totalItems} items selected</p></div>
                    <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-secondary rounded-full transition-colors"><X size={24} className="text-foreground" /></button>
                </div>
                <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-black/40 h-[60%]">
                    {cart.map(item => (
                        <div key={item.item_code} className="flex gap-3 p-3 bg-card rounded-2xl border border-border items-start group shadow-sm">
                            <div className="flex-1">
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 truncate">{item.item_code}</div>
                                <h4 className="font-bold text-sm text-foreground leading-snug line-clamp-2">{item.item_name}</h4>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs font-mono bg-secondary px-2 py-1 rounded text-muted-foreground border border-border">
                                      ₹{item.standard_rate} {item.stock_uom ? `/ ${item.stock_uom}` : ''}
                                    </span>
                                    <span className="text-xs text-muted-foreground">x {item.qty}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className="font-black text-base">₹{(
                                    (item.qty > 24 ? item.standard_rate * 0.975 : item.standard_rate) * item.qty
                                ).toLocaleString()}</span>
                                <div className="flex items-center gap-1 bg-secondary rounded-lg border border-border p-1"><button onClick={() => updateQty(item.item_code, -1)} className="p-1 hover:bg-background rounded-md"><Minus size={14}/></button><span className="w-6 text-center text-xs font-bold">{item.qty}</span><button onClick={() => updateQty(item.item_code, 1)} className="p-1 hover:bg-background rounded-md"><Plus size={14}/></button></div>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && ( <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50"><ShoppingBag size={64} strokeWidth={1} className="mb-4" /><p className="text-lg font-medium">Your cart is empty</p><button onClick={() => setIsCartOpen(false)} className="mt-4 text-sm font-bold text-foreground underline">Start Shopping</button></div>)}
                </div>
                <div className={`border-t border-border bg-card transition-all duration-300 ease-in-out flex flex-col relative ${showMoreDetails ? 'h-full absolute inset-0 z-50' : 'flex-none h-[30%] min-h-[240px]'}`}>
                    {showMoreDetails && ( <div className="p-5 border-b border-border flex justify-between items-center bg-card flex-none"><h3 className="font-bold text-lg flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">1</div> Order Details</h3><button onClick={() => setShowMoreDetails(false)} className="text-xs font-bold bg-secondary px-3 py-1.5 rounded-full hover:bg-secondary/80 flex items-center gap-1"><ChevronDown size={14}/> Minimize</button></div>)}
                    <form onSubmit={submitOrder} className="flex flex-col h-full overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-5 pb-0">
                            {!showMoreDetails && ( <div className="flex justify-between items-end mb-4 pb-4 border-b border-border border-dashed flex-none"><span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Pay</span><span className="text-3xl font-black text-foreground">₹{totalPrice.toLocaleString()}</span></div>)}
                            <div className="space-y-3 pb-4">
                                <div className="grid grid-cols-2 gap-3"><input required placeholder="Your Name" className="w-full p-3 bg-secondary/30 rounded-xl border border-border outline-none focus:border-foreground text-sm font-medium transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /><input required placeholder="Phone (10 digits)" type="tel" className="w-full p-3 bg-secondary/30 rounded-xl border border-border outline-none focus:border-foreground text-sm font-medium transition-all" value={formData.phone} onChange={handlePhoneChange} /></div>
                                {!showMoreDetails && ( <button type="button" onClick={() => setShowMoreDetails(true)} className="w-full py-3 text-xs font-bold text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 border border-dashed border-border rounded-xl hover:bg-secondary/50 transition-all"><PlusCircle size={14}/> Add Address & GST</button>)}
                                {showMoreDetails && ( <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4"><div className="flex justify-between items-center py-2 bg-secondary/20 px-3 rounded-lg"><span className="text-xs font-bold text-muted-foreground uppercase">Cart Total</span><span className="text-xl font-black text-foreground">₹{totalPrice.toLocaleString()}</span></div><div><label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">GST Number (Optional)</label><input placeholder="Ex: 22AAAAA0000A1Z5" className="w-full p-3 bg-secondary/30 rounded-xl border border-border outline-none focus:border-foreground text-sm font-medium" value={formData.gst} onChange={e => setFormData({...formData, gst: e.target.value})} /></div><div><label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block flex justify-between">Address<button type="button" onClick={() => setShowAddressLine2(!showAddressLine2)} className="text-primary hover:underline flex items-center gap-1 text-[10px]"><PlusCircle size={10}/> Add Line 2</button></label><div className="space-y-2"><textarea placeholder="Street, Building, Area..." rows={2} className="w-full p-3 bg-secondary/30 rounded-xl border border-border outline-none focus:border-foreground text-sm font-medium resize-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />{showAddressLine2 && ( <input placeholder="Landmark / City / Pincode" className="w-full p-3 bg-secondary/30 rounded-xl border border-border outline-none focus:border-foreground text-sm font-medium animate-in fade-in slide-in-from-top-1" value={formData.addressLine2} onChange={e => setFormData({...formData, addressLine2: e.target.value})} />)}</div></div><div><label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Order Notes</label><textarea placeholder="Special instructions..." rows={2} className="w-full p-3 bg-secondary/30 rounded-xl border border-border outline-none focus:border-foreground text-sm font-medium resize-none" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} /></div></div>)}
                            </div>
                        </div>
                        <div className="p-5 border-t border-border bg-card flex-none pb-8 sm:pb-6"><button type="submit" disabled={loading || cart.length === 0} className="w-full bg-foreground text-background py-4 rounded-xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-between px-6"><span>{loading ? "Processing..." : "Confirm Order"}</span><div className="flex items-center gap-2"><ArrowRight size={20} /></div></button></div>
                    </form>
                </div>
            </div>
        </>
      )}
    </div>
  );
}