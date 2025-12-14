"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  SlidersHorizontal, ArrowUpDown, X, Check, Search, 
  ShoppingBag, Plus, Minus, ArrowRight, Loader2, ArrowUp 
} from "lucide-react";
import { cn } from "@/lib/utils"; 
import HeroSection from "@/components/HeroSection"; 

// --- 1. CONFIGURATION ---
const CATEGORY_PRIORITY = ["Pressure Cooker", "Bottle", "Lunch Box", "Steelware", "Crockery"];

// --- SCROLL HOOK ---
function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState("up");
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY ? "down" : "up";
      if (direction !== scrollDirection && (Math.abs(scrollY - lastScrollY) > 10)) {
        setScrollDirection(direction);
      }
      lastScrollY = scrollY > 0 ? scrollY : 0;
    };
    window.addEventListener("scroll", updateScrollDirection);
    return () => window.removeEventListener("scroll", updateScrollDirection);
  }, [scrollDirection]);
  return scrollDirection;
}

// --- FUZZY SEARCH ---
const fuzzyMatch = (text: string, search: string) => {
  if (!text) return false;
  const cleanText = text.toLowerCase().replace(/\s+/g, ' ').trim();
  const cleanSearch = search.toLowerCase().replace(/\s+/g, ' ').trim();
  return cleanText.includes(cleanSearch);
};

// --- TYPES ---
export type Product = {
  item_code: string;
  item_name: string;
  standard_rate: number;
  item_group?: string; 
  brand?: string;
  image?: string;
  description?: string;
  stock_uom?: string;
  imageVersion?: number; 
};

interface CartItem extends Product {
  qty: number;
}

interface ShopInterfaceProps {
  products: Product[];
}

// --- MAIN COMPONENT ---
export function ShopInterface({ products: initialProducts }: ShopInterfaceProps) {
  const scrollDirection = useScrollDirection();
  
  // -- UI STATE --
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  // -- DATA STATE --
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("All"); 
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<string>("default");

  // -- CHECKOUT STATE --
  const [formData, setFormData] = useState({ name: "", phone: "", address: "" });
  const [loading, setLoading] = useState(false);

  // -- DERIVED DATA --
  const allBrands = useMemo(() => ["All", ...new Set(initialProducts.map(p => p.brand).filter(Boolean) as string[])], [initialProducts]);
  const allCategories = useMemo(() => [...new Set(initialProducts.map(p => p.item_group).filter(Boolean) as string[])], [initialProducts]);

  // -- FILTERING LOGIC --
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // 1. Search
    if (searchQuery.trim().length > 0) {
      result = result.filter(p => 
        fuzzyMatch(p.item_name || "", searchQuery) || 
        fuzzyMatch(p.item_code || "", searchQuery)
      );
    }

    // 2. Brand (Top Bar)
    if (selectedBrand !== "All") {
      result = result.filter(p => p.brand === selectedBrand);
    }

    // 3. Category (Modal)
    if (selectedCategories.length > 0) {
      result = result.filter(p => p.item_group && selectedCategories.includes(p.item_group));
    }

    // 4. Sort
    if (sortOption === "price-asc") result.sort((a, b) => a.standard_rate - b.standard_rate);
    if (sortOption === "price-desc") result.sort((a, b) => b.standard_rate - a.standard_rate);
    
    return result;
  }, [initialProducts, searchQuery, selectedBrand, selectedCategories, sortOption]);

  // -- SECTION VIEW LOGIC --
  const isDefaultView = searchQuery === "" && selectedBrand === "All" && selectedCategories.length === 0 && sortOption === "default";

  const groupedSections = useMemo(() => {
    if (!isDefaultView) return null;
    const groups: Record<string, Product[]> = {};
    filteredProducts.forEach(p => {
      const g = p.item_group || "Other";
      if (!groups[g]) groups[g] = [];
      groups[g].push(p);
    });
    return Object.keys(groups)
      .sort((a, b) => {
        const idxA = CATEGORY_PRIORITY.indexOf(a);
        const idxB = CATEGORY_PRIORITY.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        return a.localeCompare(b);
      })
      .map(key => ({ name: key, items: groups[key] }));
  }, [filteredProducts, isDefaultView]);

  // -- CART ACTIONS --
  const handleAdd = (item: Product, customQty?: number) => {
    setCart(prev => {
      const exists = prev.find(p => p.item_code === item.item_code);
      const defaultAdd = exists ? 1 : 6;
      const qtyToAdd = customQty || defaultAdd;
      return exists 
        ? prev.map(p => p.item_code === item.item_code ? { ...p, qty: p.qty + qtyToAdd } : p) 
        : [...prev, { ...item, qty: qtyToAdd }]; 
    });
  };

  const updateQty = (code: string, delta: number) => {
    setCart(prev => prev.map(item => {
        if (item.item_code !== code) return item;
        const newQty = item.qty + delta;
        if (newQty <= 0) return { ...item, qty: 0 }; 
        return { ...item, qty: newQty };
    }).filter(i => i.qty > 0));
  };

  const totalPrice = cart.reduce((sum, i) => {
    const rate = i.qty > 24 ? i.standard_rate * 0.975 : i.standard_rate;
    return sum + (rate * i.qty);
  }, 0);

  // -- SUBMIT ORDER --
  const submitOrder = async () => {
    if (!formData.name || !formData.phone) return alert("Please enter Name and Phone");
    setLoading(true);
    try {
      const res = await fetch('/api/order', { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({ cart, customer: formData }) 
      });
      if (res.ok) { 
        alert("✅ Order Placed Successfully!"); 
        setCart([]); 
        setIsCartOpen(false); 
      } else { 
        alert("❌ Failed to place order. Try again."); 
      }
    } catch { 
      alert("❌ Connection Error"); 
    } finally { 
      setLoading(false); 
    }
  };

  // Back to Top Listener
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-background min-h-screen pb-32 text-foreground transition-colors duration-300">
      
      {/* --- A. HERO SECTION --- */}
      <div className={cn(
        "transition-all duration-700 ease-in-out overflow-hidden",
        isDefaultView ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
      )}>
         <HeroSection />
         <div className="bg-card py-6 text-center border-b border-border px-4">
            <h1 className="text-2xl font-bold tracking-tight">Welcome to Nandan Traders</h1>
            <p className="text-sm text-muted-foreground mt-1">Wholesale Kitchenware & Essentials</p>
         </div>
      </div>

      {/* --- B. STICKY HEADER AREA --- */}
      <div className={cn(
          "fixed left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-b border-border shadow-sm transition-transform duration-300 ease-in-out",
          "top-[64px]", // Matches Header Height
          scrollDirection === "down" ? "-translate-y-[150%]" : "translate-y-0"
        )}>
        
        {/* Row 1: Search & Controls */}
        <div className="flex items-center h-14 max-w-[1400px] mx-auto px-4 gap-3">
          <div className="flex-1 relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
             <input 
               type="text" 
               placeholder="Search items..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-9 pr-4 py-2 bg-muted/50 dark:bg-muted/20 rounded-full text-sm outline-none focus:ring-2 ring-primary/20 transition-all placeholder:text-muted-foreground"
             />
             {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={14} className="text-muted-foreground"/></button>}
          </div>
          <button onClick={() => setIsFilterOpen(true)} className="p-2 hover:bg-muted rounded-full relative transition-colors">
            <SlidersHorizontal size={20} />
            {selectedCategories.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>}
          </button>
          <button onClick={() => setIsSortOpen(true)} className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowUpDown size={20} />
          </button>
        </div>

        {/* Row 2: BRAND BAR (Fixed Horizontal Scroll) */}
        <div className="flex overflow-x-auto no-scrollbar py-3 px-4 gap-2 border-t border-border bg-background">
           {allBrands.map(brand => (
             <button
               key={brand}
               onClick={() => setSelectedBrand(brand)}
               className={cn(
                 "whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all border shrink-0",
                 selectedBrand === brand 
                   ? "bg-foreground text-background border-foreground shadow-md" 
                   : "bg-card text-muted-foreground border-border hover:border-foreground/50 hover:text-foreground"
               )}
             >
               {brand}
             </button>
           ))}
        </div>
      </div>

      {/* --- C. PRODUCT GRID --- */}
      {/* pt-48 ensures content is not hidden behind the double-decker sticky header */}
      <div className="max-w-[1400px] mx-auto p-4 pt-48">
        
        {!isDefaultView && (
          <div className="mb-6 flex justify-between items-center animate-in fade-in">
             <h2 className="text-xl font-bold">Results ({filteredProducts.length})</h2>
             {selectedBrand !== "All" && <span className="text-xs bg-muted px-2 py-1 rounded">Brand: {selectedBrand}</span>}
          </div>
        )}

        {isDefaultView && groupedSections ? (
          // SECTION VIEW (Auto-sorted)
          <div className="space-y-12">
            {groupedSections.map((group) => (
              <div key={group.name} className="animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/80">{group.name}</h2>
                  <div className="h-px bg-border flex-1"></div>
                </div>
                {/* 4 COLUMNS & MORE SPACING */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {group.items.slice(0, 8).map((product) => (
                    <SimpleProductCard 
                      key={product.item_code} 
                      product={product} 
                      qtyInCart={cart.find(c => c.item_code === product.item_code)?.qty || 0}
                      onAdd={handleAdd}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // FLAT GRID VIEW
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <SimpleProductCard 
                  key={product.item_code}
                  product={product} 
                  qtyInCart={cart.find(c => c.item_code === product.item_code)?.qty || 0}
                  onAdd={handleAdd}
                />
              ))}
          </div>
        )}
      </div>

      {/* --- D. FLOATING CART BAR --- */}
      {cart.length > 0 && !isCartOpen && (
         <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-full">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full flex items-center justify-between bg-foreground text-background p-4 rounded-xl shadow-xl hover:opacity-90 transition-all"
            >
               <div className="flex flex-col items-start leading-none gap-1">
                  <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider">{cart.reduce((a,b)=>a+b.qty,0)} ITEMS</span>
                  <span className="text-xl font-bold">₹{totalPrice.toLocaleString()}</span>
               </div>
               <div className="flex items-center gap-2 bg-background/20 px-3 py-1.5 rounded-lg">
                  <span className="text-sm font-bold">Checkout</span>
                  <ArrowRight size={16} />
               </div>
            </button>
         </div>
      )}

      {/* --- E. CART DRAWER --- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[70] flex justify-end">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
           <div className="relative w-full max-w-md bg-background h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-border">
              <div className="p-5 border-b border-border flex justify-between items-center bg-muted/30">
                 <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingBag size={20}/> Cart</h2>
                 <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-muted rounded-full"><X size={20}/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4">
                       <ShoppingBag size={48} className="opacity-20"/>
                       <p className="font-medium">Cart is empty</p>
                    </div>
                 ) : (
                    cart.map(item => (
                       <div key={item.item_code} className="flex gap-4 p-3 bg-card border border-border rounded-xl shadow-sm">
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                             <img src={`/images/${item.item_code}.jpg`} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"/>
                          </div>
                          <div className="flex-1 min-w-0">
                             <h4 className="font-bold text-sm line-clamp-1">{item.item_name}</h4>
                             <p className="text-xs text-muted-foreground mt-0.5">{item.item_code}</p>
                             <div className="flex justify-between items-end mt-2">
                                <div className="font-bold text-sm">₹{item.standard_rate}</div>
                                <div className="flex items-center gap-3 bg-muted rounded-lg px-2 py-1">
                                   <button onClick={() => updateQty(item.item_code, -1)} className="hover:text-primary"><Minus size={14}/></button>
                                   <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                                   <button onClick={() => updateQty(item.item_code, 1)} className="hover:text-primary"><Plus size={14}/></button>
                                </div>
                             </div>
                          </div>
                       </div>
                    ))
                 )}
              </div>

              {cart.length > 0 && (
                 <div className="p-5 border-t border-border bg-background pb-8">
                    <div className="flex justify-between items-center mb-6">
                       <span className="text-sm font-bold text-muted-foreground uppercase">Total Pay</span>
                       <span className="text-3xl font-black">₹{totalPrice.toLocaleString()}</span>
                    </div>
                    
                    <div className="space-y-4 mb-4">
                       <input 
                         placeholder="Your Name" 
                         className="w-full p-3 text-sm bg-muted border-transparent focus:border-primary rounded-lg outline-none transition-colors" 
                         value={formData.name} 
                         onChange={e => setFormData({...formData, name: e.target.value})} 
                       />
                       <input 
                         placeholder="Phone Number" 
                         type="tel"
                         className="w-full p-3 text-sm bg-muted border-transparent focus:border-primary rounded-lg outline-none transition-colors" 
                         value={formData.phone} 
                         onChange={e => setFormData({...formData, phone: e.target.value})} 
                       />
                    </div>
                    
                    <button 
                      onClick={submitOrder} 
                      disabled={loading}
                      className="w-full py-4 bg-foreground text-background font-bold rounded-xl shadow-lg hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       {loading ? <Loader2 className="animate-spin"/> : <>Confirm Order <ArrowRight size={18}/></>}
                    </button>
                 </div>
              )}
           </div>
        </div>
      )}

      {/* --- BACK TO TOP BUTTON --- */}
      {showBackToTop && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-24 right-4 z-40 bg-foreground text-background p-3 rounded-full shadow-xl animate-in fade-in zoom-in hover:scale-110 transition-transform"
        >
          <ArrowUp size={20} />
        </button>
      )}

      {/* --- SORT MODAL --- */}
      {isSortOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsSortOpen(false)}>
          <div className="bg-card w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 border-t border-border" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">Sort By</h3>
            <div className="space-y-2">
              {[{ l: "Default", v: "default" }, { l: "Price: Low to High", v: "price-asc" }, { l: "Price: High to Low", v: "price-desc" }].map((o) => (
                <button key={o.v} onClick={() => { setSortOption(o.v); setIsSortOpen(false); }} className="w-full text-left py-3 px-4 rounded-xl hover:bg-muted flex justify-between transition-colors">
                  {o.l} {sortOption === o.v && <Check size={16} className="text-primary"/>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* --- FILTER MODAL (Category Only) --- */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setIsFilterOpen(false)}>
           <div className="bg-card w-full max-w-sm rounded-2xl p-6 h-[60vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-lg">Filter Categories</h3>
                 <button onClick={() => setIsFilterOpen(false)}><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                 {allCategories.map(cat => (
                    <label key={cat} className="flex items-center gap-3 p-3 hover:bg-muted rounded-xl cursor-pointer">
                       <input 
                         type="checkbox" 
                         checked={selectedCategories.includes(cat)} 
                         onChange={() => setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}
                         className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                       />
                       <span>{cat}</span>
                    </label>
                 ))}
              </div>
              <div className="pt-4 border-t border-border mt-2 flex gap-3">
                 <button onClick={() => setSelectedCategories([])} className="flex-1 py-3 border border-border rounded-xl font-bold">Clear</button>
                 <button onClick={() => setIsFilterOpen(false)} className="flex-1 py-3 bg-foreground text-background rounded-xl font-bold">Apply</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: SIMPLE CARD ---
function SimpleProductCard({ product, qtyInCart, onAdd }: { product: Product, qtyInCart: number, onAdd: (p: Product) => void }) {
  const imgSrc = product.imageVersion ? `/images/${product.item_code}.jpg?v=${product.imageVersion}` : `/images/${product.item_code}.jpg`;

  return (
    <div className={cn("bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all group flex flex-col h-full", qtyInCart > 0 ? "ring-2 ring-primary" : "")}>
      <div className="aspect-square bg-white p-6 relative flex items-center justify-center">
         {product.brand && <span className="absolute top-2 left-2 text-[10px] font-bold bg-gray-100 text-black px-2 py-1 rounded-full z-10">{product.brand}</span>}
         <img 
            src={imgSrc} 
            onError={(e) => (e.currentTarget.src = "https://placehold.co/400x400/png?text=No+Img")}
            alt={product.item_name}
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
         />
      </div>
      <div className="p-4 flex flex-col flex-1 bg-muted/30">
         <h3 className="font-semibold text-sm line-clamp-2 leading-snug mb-3 flex-1" title={product.item_name}>{product.item_name}</h3>
         <div className="flex items-end justify-between mt-auto">
            <div>
               <div className="text-lg font-bold">₹{product.standard_rate}</div>
               {product.stock_uom && <div className="text-[10px] text-muted-foreground">{product.stock_uom}</div>}
            </div>
            <button 
               onClick={() => onAdd(product)}
               className={cn(
                  "h-9 px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm",
                  qtyInCart > 0 ? "bg-foreground text-background" : "bg-card border border-border hover:bg-muted"
               )}
            >
               {qtyInCart > 0 ? <Check size={14}/> : <Plus size={14}/>}
               {qtyInCart > 0 ? "Added" : "Add"}
            </button>
         </div>
      </div>
    </div>
  );
}