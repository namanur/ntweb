"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Product } from "@/lib/erp";
import ProductCard from "./ProductCard";
import { X, Minus, Plus, ShoppingBag, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Filter, FileText, Check, Layers, Trash2, MapPin, PlusCircle, ArrowRight } from "lucide-react";

interface CartItem extends Product {
  qty: number;
}

const BRANDS = [
  { name: "MaxFresh", logo: "/brands/maxfresh.png" },
  { name: "Tibros", logo: "/brands/tibros.png" },
  { name: "Sigma", logo: "/brands/sigma.png" },
];

const ITEMS_PER_PAGE = 25; 

export default function ProductGridClient({ products = [] }: { products: Product[] }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const pathname = usePathname();
  const { replace } = useRouter();

  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [loading, setLoading] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [showAddressLine2, setShowAddressLine2] = useState(false);
  
  const moreDetailsRef = useRef<HTMLDivElement>(null);
  const gridTopRef = useRef<HTMLDivElement>(null); 
  const [formData, setFormData] = useState({ 
    name: "", 
    phone: "", 
    gst: "", 
    address: "", 
    addressLine2: "", 
    note: "" 
  });

  useEffect(() => {
    const saved = localStorage.getItem("nandan_customer_details");
    if (saved) try { setFormData(JSON.parse(saved)); } catch {}
  }, []);

  useEffect(() => {
    if (showMoreDetails && moreDetailsRef.current) {
      setTimeout(() => {
        moreDetailsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  }, [showMoreDetails]);

  useEffect(() => {
    setCurrentPage(1);
    if (selectedBrand !== "All") setSelectedCategory("All");
  }, [selectedBrand, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("q");
    replace(`${pathname}?${params.toString()}`);
    setSelectedBrand("All");
    setSelectedCategory("All");
    setIsCategoryOpen(false);
  };

  const productsInBrand = useMemo(() => {
    if (selectedBrand === "All") return products;
    return products.filter(p => p.brand === selectedBrand);
  }, [products, selectedBrand]);

  const availableCategories = useMemo(() => {
    const groups = productsInBrand.map(p => p.item_group || "Other");
    return ["All", ...Array.from(new Set(groups)).sort()];
  }, [productsInBrand]);

  const finalDisplayedProducts = useMemo(() => {
    const cleanSearch = searchQuery.trim().toLowerCase();
    if (cleanSearch.length > 0) {
      return products.filter(p => 
        (p.item_name || "").toLowerCase().includes(cleanSearch) ||
        (p.item_code || "").toLowerCase().includes(cleanSearch)
      );
    } else {
      let filtered = productsInBrand;
      if (selectedCategory !== "All") {
        filtered = filtered.filter(p => (p.item_group || "Other") === selectedCategory);
      }
      return filtered;
    }
  }, [searchQuery, products, productsInBrand, selectedCategory]);

  const totalPages = Math.ceil(finalDisplayedProducts.length / ITEMS_PER_PAGE);
  const displayedProducts = finalDisplayedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const changePage = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 400, behavior: 'smooth' }); 
  };

  const handleAdd = (item: Product) => {
    setCart(prev => {
      const exists = prev.find(p => p.item_code === item.item_code);
      return exists 
        ? prev.map(p => p.item_code === item.item_code ? { ...p, qty: p.qty + 1 } : p) 
        : [...prev, { ...item, qty: 1 }];
    });
    setSelectedProduct(null);
  };

  const updateQty = (code: string, delta: number) => {
    setCart(prev => prev.map(item => 
      item.item_code === code ? { ...item, qty: Math.max(0, item.qty + delta) } : item
    ).filter(i => i.qty > 0));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*$/.test(val) && val.length <= 10) {
      setFormData({ ...formData, phone: val });
    }
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const finalData = {
        ...formData,
        address: showAddressLine2 ? `${formData.address}, ${formData.addressLine2}` : formData.address
    };

    try {
      localStorage.setItem("nandan_customer_details", JSON.stringify(finalData));
      const res = await fetch('/api/order', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ cart, customer: finalData })
      });
      if (res.ok) { alert("✅ Order Placed!"); setCart([]); setIsCartOpen(false); setShowMoreDetails(false); }
      else { alert("❌ Failed to place order."); }
    } catch { alert("❌ Connection Error"); } finally { setLoading(false); }
  };

  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = cart.reduce((sum, i) => sum + (i.standard_rate * i.qty), 0);

  return (
    <div className="w-full" ref={gridTopRef}>
      
      {isCategoryOpen && (
        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsCategoryOpen(false)} />
      )}

      {/* STICKY FILTER BAR */}
      <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-xl py-3 -mx-4 px-4 mb-6 border-b border-border shadow-sm">
        {searchQuery.trim().length === 0 ? (
            <div className="flex flex-col gap-3 relative z-50">
                
                {/* 1. BRANDS - BUBBLE SCROLL */}
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    <button onClick={() => setSelectedBrand("All")} className={`flex-shrink-0 px-5 py-2 rounded-full font-bold text-xs border transition-all ${selectedBrand === "All" ? "bg-foreground text-background border-foreground shadow-md" : "bg-card text-muted-foreground border-border hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-foreground"}`}>All Brands</button>
                    {BRANDS.map((brand) => (
                    <button key={brand.name} onClick={() => setSelectedBrand(brand.name)} className={`flex-shrink-0 flex items-center gap-2 px-5 py-2 rounded-full font-bold text-xs border transition-all ${selectedBrand === brand.name ? `ring-2 ring-offset-2 ring-foreground bg-foreground text-background border-foreground` : "bg-card text-muted-foreground border-border grayscale opacity-70 hover:grayscale-0 hover:opacity-100 hover:bg-zinc-200 dark:hover:bg-zinc-800"}`}>
                        {brand.name}
                    </button>))}
                </div>

                {/* 2. CATEGORY - SOLID GREY DROPDOWN */}
                <div className="relative w-full sm:w-auto">
                    <button 
                        onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                        className={`flex items-center justify-between w-full sm:w-auto gap-3 px-5 py-2.5 rounded-2xl font-bold text-xs border transition-all ${selectedCategory !== 'All' ? 'bg-zinc-800 text-white border-zinc-700 dark:bg-zinc-100 dark:text-black dark:border-zinc-300' : 'bg-zinc-100 dark:bg-zinc-900 text-foreground border-border hover:bg-zinc-200 dark:hover:bg-zinc-800'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Layers size={14} className={selectedCategory !== 'All' ? 'opacity-100' : 'opacity-50'} />
                            {selectedCategory === 'All' ? 'Filter by Category' : selectedCategory}
                        </div>
                        <ChevronDown size={14} className={`transition-transform duration-300 ${isCategoryOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isCategoryOpen && (
                        <div className="absolute top-full left-0 mt-2 w-full sm:w-72 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-3xl shadow-xl p-2 animate-in zoom-in-95 origin-top-left max-h-80 overflow-y-auto z-50">
                            <button onClick={() => { setSelectedCategory('All'); setIsCategoryOpen(false); }} className="w-full text-left px-4 py-3 rounded-2xl text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between text-foreground">
                                All Categories
                                {selectedCategory === 'All' && <Check size={16} />}
                            </button>
                            <div className="h-px bg-border/50 my-1 mx-2"></div>
                            {availableCategories.filter(c => c !== 'All').map(cat => (
                                <button key={cat} onClick={() => { setSelectedCategory(cat); setIsCategoryOpen(false); }} className="w-full text-left px-4 py-3 rounded-2xl text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between group text-muted-foreground hover:text-foreground">
                                    {cat}
                                    {selectedCategory === cat && <Check size={16} className="text-foreground" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        ) : (
            <div className="flex items-center justify-between w-full text-sm px-2">
                <div className="text-muted-foreground">Searching results for <span className="font-bold text-foreground">"{searchQuery}"</span></div>
                <button onClick={clearSearch} className="text-xs font-bold text-primary hover:underline bg-zinc-200 dark:bg-zinc-800 px-3 py-1 rounded-full">Clear Search</button>
            </div>
        )}
      </div>

      {/* PRODUCT GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 w-full pb-8 min-h-[50vh]">
        {displayedProducts.map(p => (
          <ProductCard 
            key={p.item_code} 
            product={p} 
            onAdd={handleAdd} 
            onClick={() => setSelectedProduct(p)}
          />
        ))}
        {displayedProducts.length === 0 && (
          <div className="col-span-full text-center py-20 text-muted-foreground">
             <Filter className="mx-auto mb-2 opacity-50" size={32} />
             <p>No items found.</p>
             <button onClick={clearSearch} className="text-primary text-sm underline mt-2 font-bold">Clear Search</button>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pb-24 pt-8 border-t border-border">
          <button onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1} className="p-3 rounded-full bg-card border border-border disabled:opacity-30 hover:bg-secondary hover:scale-110 transition-all"><ChevronLeft size={20} /></button>
          <span className="text-sm font-medium text-muted-foreground bg-secondary/50 px-4 py-1 rounded-full">Page <span className="text-foreground font-bold">{currentPage}</span> of {totalPages}</span>
          <button onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages} className="p-3 rounded-full bg-card border border-border disabled:opacity-30 hover:bg-secondary hover:scale-110 transition-all"><ChevronRight size={20} /></button>
        </div>
      )}

      {/* FLOATING CART BUTTON */}
      {totalItems > 0 && !isCartOpen && (
        <div className="fixed bottom-8 left-4 right-4 z-50 flex justify-center md:hidden">
          <button onClick={() => setIsCartOpen(true)} className="bg-foreground text-background w-full max-w-md px-6 py-4 rounded-2xl shadow-2xl font-bold flex items-center justify-between hover:scale-[1.03] transition-transform active:scale-95 border border-border/50 backdrop-blur-md">
            <div className="flex flex-col text-left leading-none gap-1"><span className="text-[10px] font-bold opacity-70 tracking-widest uppercase">Cart ({totalItems})</span><span className="text-xl">₹{totalPrice.toLocaleString()}</span></div>
            <div className="flex items-center gap-2 text-sm uppercase tracking-wide bg-background/20 px-3 py-1.5 rounded-full">View <ShoppingBag size={16} /></div>
          </button>
        </div>
      )}

      {/* DESKTOP/TABLET TOGGLE */}
      {!isCartOpen && totalItems > 0 && (
        <button 
            onClick={() => setIsCartOpen(true)}
            className="hidden md:flex fixed top-24 left-0 z-40 bg-foreground text-background p-3 rounded-r-xl shadow-xl hover:pl-4 transition-all items-center gap-2 font-bold text-sm"
        >
            <ShoppingBag size={20} />
            <span className="writing-mode-vertical">Cart ({totalItems})</span>
        </button>
      )}

      {/* PRODUCT DETAIL MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200 border border-border/50">
            <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-10 bg-black/10 dark:bg-white/10 p-2 rounded-full hover:bg-black/20 dark:hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
                <X size={20} />
            </button>

            <div className="p-8 bg-card flex justify-center items-center h-72 border-b border-border/50">
                 <img 
                    src={`/images/${selectedProduct.item_code}.jpg`} 
                    alt={selectedProduct.item_name}
                    className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal drop-shadow-xl"
                    onError={(e) => (e.currentTarget.src = "https://placehold.co/600x600/png?text=No+Image")}
                 />
            </div>
            
            <div className="p-6">
                <div className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">
                    {selectedProduct.brand || "Nandan Traders"}
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3 leading-tight">
                    {selectedProduct.item_name}
                </h2>
                <p className="text-muted-foreground text-sm mb-8 leading-relaxed font-medium">
                    {selectedProduct.description}
                </p>

                <div className="flex items-center justify-between gap-4 p-4 bg-secondary/30 rounded-2xl">
                    <div>
                        <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Price</div>
                        <div className="text-3xl font-black text-foreground">₹{selectedProduct.standard_rate}</div>
                    </div>
                    <button 
                        onClick={() => handleAdd(selectedProduct)}
                        className="flex-1 bg-foreground text-background py-4 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Plus size={20} /> Add to Cart
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* LEFT SIDE CART DRAWER */}
      {isCartOpen && (
        <>
            <div 
                className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm transition-opacity" 
                onClick={() => setIsCartOpen(false)}
            />
            
            <div className="fixed top-0 left-0 h-full w-full sm:w-[450px] bg-card shadow-2xl z-[61] border-r border-border transform transition-transform duration-300 animate-in slide-in-from-left overflow-hidden flex flex-col">
                
                {/* 1. Header (Fixed) */}
                <div className="p-5 border-b border-border flex justify-between items-center bg-card flex-none h-[10%] min-h-[70px]">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">Cart</h2>
                        <p className="text-xs text-muted-foreground font-medium mt-1">{totalItems} items selected</p>
                    </div>
                    <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <X size={24} className="text-foreground" />
                    </button>
                </div>

                {/* 2. Cart Items (70% Height - Grows to fill available) */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-black/40 h-[60%]">
                    {cart.map(item => (
                        <div key={item.item_code} className="flex gap-4 p-4 bg-card rounded-2xl border border-border/50 items-start group shadow-sm">
                            <div className="flex-1">
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 truncate">{item.item_code}</div>
                                <h4 className="font-bold text-sm text-foreground leading-snug">{item.item_name}</h4>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs font-mono bg-secondary px-2 py-1 rounded text-muted-foreground border border-border">₹{item.standard_rate}</span>
                                    <span className="text-xs text-muted-foreground">x {item.qty}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <span className="font-black text-lg">₹{(item.standard_rate * item.qty).toLocaleString()}</span>
                                <div className="flex items-center gap-1 bg-secondary rounded-lg border border-border p-1">
                                    <button onClick={() => updateQty(item.item_code, -1)} className="p-1 hover:bg-background rounded-md"><Minus size={14}/></button>
                                    <span className="w-6 text-center text-xs font-bold">{item.qty}</span>
                                    <button onClick={() => updateQty(item.item_code, 1)} className="p-1 hover:bg-background rounded-md"><Plus size={14}/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                            <ShoppingBag size={64} strokeWidth={1} className="mb-4" />
                            <p className="text-lg font-medium">Your cart is empty</p>
                            <button onClick={() => setIsCartOpen(false)} className="mt-4 text-sm font-bold text-foreground underline">Start Shopping</button>
                        </div>
                    )}
                </div>

                {/* 3. Footer / Checkout Form (Fixed Container for structure) */}
                <div 
                    className={`
                        border-t border-border bg-card transition-all duration-300 ease-in-out flex flex-col relative
                        ${showMoreDetails ? 'h-full absolute inset-0 z-50' : 'flex-none h-[30%] min-h-[240px]'}
                    `}
                >
                    {/* Header for Expanded View */}
                    {showMoreDetails && (
                        <div className="p-5 border-b border-border flex justify-between items-center bg-card flex-none">
                            <h3 className="font-bold text-lg flex items-center gap-2"><FileText size={18}/> Order Details</h3>
                            <button onClick={() => setShowMoreDetails(false)} className="text-xs font-bold bg-secondary px-3 py-1.5 rounded-full hover:bg-secondary/80 flex items-center gap-1">
                                <ChevronDown size={14}/> Minimize
                            </button>
                        </div>
                    )}

                    {/* Main Form Container - Using Flex Column */}
                    <form onSubmit={submitOrder} className="flex flex-col h-full overflow-hidden">
                        
                        {/* SCROLLABLE INPUT AREA (Flex-1) */}
                        <div className="flex-1 overflow-y-auto p-5 pb-0">
                            
                            {/* Total (Only show if not expanded to save space, or keep top) */}
                            {!showMoreDetails && (
                                <div className="flex justify-between items-end mb-4 pb-4 border-b border-border border-dashed flex-none">
                                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Pay</span>
                                    <span className="text-3xl font-black text-foreground">₹{totalPrice.toLocaleString()}</span>
                                </div>
                            )}

                            <div className="space-y-3 pb-4">
                                {/* Basic Fields */}
                                <div className="grid grid-cols-2 gap-3">
                                    <input 
                                        required 
                                        placeholder="Your Name" 
                                        className="w-full p-3 bg-secondary/30 rounded-xl border border-border outline-none focus:border-foreground text-sm font-medium transition-all" 
                                        value={formData.name} 
                                        onChange={e => setFormData({...formData, name: e.target.value})} 
                                    />
                                    <input 
                                        required 
                                        placeholder="Phone (10 digits)" 
                                        type="tel" 
                                        className="w-full p-3 bg-secondary/30 rounded-xl border border-border outline-none focus:border-foreground text-sm font-medium transition-all" 
                                        value={formData.phone} 
                                        onChange={handlePhoneChange} 
                                    />
                                </div>

                                {/* Expand Button (Only in collapsed state) */}
                                {!showMoreDetails && (
                                    <button type="button" onClick={() => setShowMoreDetails(true)} className="w-full py-3 text-xs font-bold text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 border border-dashed border-border rounded-xl hover:bg-secondary/50 transition-all">
                                        <PlusCircle size={14}/> Add Address & GST
                                    </button>
                                )}

                                {/* Expanded Fields */}
                                {showMoreDetails && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                        
                                        {/* Total inside expanded view */}
                                        <div className="flex justify-between items-center py-2 bg-secondary/20 px-3 rounded-lg">
                                            <span className="text-xs font-bold text-muted-foreground uppercase">Cart Total</span>
                                            <span className="text-xl font-black text-foreground">₹{totalPrice.toLocaleString()}</span>
                                        </div>

                                        {/* GST */}
                                        <div>
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">GST Number (Optional)</label>
                                            <input 
                                                placeholder="Ex: 22AAAAA0000A1Z5" 
                                                className="w-full p-3 bg-secondary/30 rounded-xl border border-border outline-none focus:border-foreground text-sm font-medium" 
                                                value={formData.gst} 
                                                onChange={e => setFormData({...formData, gst: e.target.value})} 
                                            />
                                        </div>

                                        {/* ADDRESS SECTION */}
                                        <div>
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block flex justify-between">
                                                Address
                                                <button type="button" onClick={() => setShowAddressLine2(!showAddressLine2)} className="text-primary hover:underline flex items-center gap-1 text-[10px]">
                                                    <PlusCircle size={10}/> Add Line 2
                                                </button>
                                            </label>
                                            <div className="space-y-2">
                                                <textarea 
                                                    placeholder="Street, Building, Area..." 
                                                    rows={2} 
                                                    className="w-full p-3 bg-secondary/30 rounded-xl border border-border outline-none focus:border-foreground text-sm font-medium resize-none" 
                                                    value={formData.address} 
                                                    onChange={e => setFormData({...formData, address: e.target.value})} 
                                                />
                                                {showAddressLine2 && (
                                                    <input 
                                                        placeholder="Landmark / City / Pincode" 
                                                        className="w-full p-3 bg-secondary/30 rounded-xl border border-border outline-none focus:border-foreground text-sm font-medium animate-in fade-in slide-in-from-top-1" 
                                                        value={formData.addressLine2} 
                                                        onChange={e => setFormData({...formData, addressLine2: e.target.value})} 
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        {/* NOTES */}
                                        <div>
                                            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Order Notes</label>
                                            <textarea 
                                                placeholder="Special instructions..." 
                                                rows={2} 
                                                className="w-full p-3 bg-secondary/30 rounded-xl border border-border outline-none focus:border-foreground text-sm font-medium resize-none" 
                                                value={formData.note} 
                                                onChange={e => setFormData({...formData, note: e.target.value})} 
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* FIXED BOTTOM BUTTON AREA (Flex-None) */}
                        <div className="p-5 border-t border-border bg-card flex-none pb-8 sm:pb-6">
                            <button type="submit" disabled={loading || cart.length === 0} className="w-full bg-foreground text-background py-4 rounded-xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-between px-6">
                                <span>{loading ? "Processing..." : "Confirm Order"}</span>
                                <div className="flex items-center gap-2">
                                    <ArrowRight size={20} />
                                </div>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
      )}
    </div>
  );
}