"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Product } from "@/lib/erp";
import ProductCard from "./ProductCard";
import { X, Search, Minus, Plus, ShoppingBag, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, FileText, Filter } from "lucide-react";

interface CartItem extends Product {
  qty: number;
}

// Priority Categories
const PRIORITY_CATEGORIES = ["Chopper", "Knife", "Lunch Box", "Bottle", "Rice", "Oil"];
const ITEMS_PER_PAGE = 25; // ✅ LIMIT 25 PER PAGE

export default function ProductGridClient({ products = [] }: { products: Product[] }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal & Loading States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  
  const moreDetailsRef = useRef<HTMLDivElement>(null);
  const gridTopRef = useRef<HTMLDivElement>(null); // To scroll up on page change

  // Form State
  const [formData, setFormData] = useState({ name: "", phone: "", gst: "", address: "", note: "" });

  // Load Saved Data
  useEffect(() => {
    const saved = localStorage.getItem("nandan_customer_details");
    if (saved) try { setFormData(JSON.parse(saved)); } catch {}
  }, []);

  // Auto-Scroll for Address Form
  useEffect(() => {
    if (showMoreDetails && moreDetailsRef.current) {
      setTimeout(() => {
        moreDetailsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  }, [showMoreDetails]);

  // ✅ RESET PAGE WHEN FILTER CHANGES
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  // --- CATEGORY & FILTER LOGIC ---
  const allCategories = useMemo(() => {
    if (!products) return ["All"];
    const groups = products.map(p => p.item_group || "Other");
    return ["All", ...Array.from(new Set(groups))];
  }, [products]);

  const visibleCategories = allCategories.filter(c => c === "All" || PRIORITY_CATEGORIES.some(pc => c.toLowerCase().includes(pc.toLowerCase())));
  const dropdownCategories = allCategories.filter(c => !visibleCategories.includes(c));

  const filteredProducts = (products || []).filter(p => {
    const matchesSearch = (p.item_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.item_code || "").toLowerCase().includes(searchQuery.toLowerCase());
    const pGroup = p.item_group || "Other";
    const matchesCategory = selectedCategory === "All" || pGroup === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // --- PAGINATION LOGIC ---
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const displayedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const changePage = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll back to top of grid so user doesn't stay at bottom
    // setTimeout(() => gridTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    window.scrollTo({ top: 400, behavior: 'smooth' }); // Approx scroll to grid start
  };

  // --- CART LOGIC ---
  const handleAdd = (item: Product) => {
    setCart(prev => {
      const exists = prev.find(p => p.item_code === item.item_code);
      return exists 
        ? prev.map(p => p.item_code === item.item_code ? { ...p, qty: p.qty + 1 } : p) 
        : [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (code: string, delta: number) => {
    setCart(prev => prev.map(item => 
      item.item_code === code ? { ...item, qty: Math.max(0, item.qty + delta) } : item
    ).filter(i => i.qty > 0));
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      localStorage.setItem("nandan_customer_details", JSON.stringify(formData));
      const res = await fetch('/api/order', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ cart, customer: formData })
      });
      if (res.ok) { alert("✅ Order Placed! We will contact you shortly."); setCart([]); setIsCheckoutOpen(false); }
      else { alert("❌ Failed to place order."); }
    } catch { alert("❌ Connection Error"); } finally { setLoading(false); }
  };

  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = cart.reduce((sum, i) => sum + (i.standard_rate * i.qty), 0);

  return (
    <div className="w-full" ref={gridTopRef}>
      
      {/* STICKY FILTER BAR */}
      <div className="sticky top-16 z-40 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur pt-2 pb-4 -mx-4 px-4 mb-4 border-b border-gray-200 dark:border-gray-800">
        {/* Search */}
        <div className="relative mb-3 max-w-xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search items..."
            className="w-full pl-10 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Bubbles */}
        <div className="flex items-center gap-2 max-w-5xl mx-auto">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 w-full">
            {visibleCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setIsDropdownOpen(false); }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === cat 
                    ? "bg-blue-600 text-white border-blue-600 shadow-md" 
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-400"
                }`}
              >
                {cat}
              </button>
            ))}
            {dropdownCategories.length > 0 && (
              <div className="relative border-l border-gray-300 dark:border-gray-700 pl-2 ml-auto">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 whitespace-nowrap hover:bg-gray-300"
                >
                  More <ChevronDown size={14} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-50 max-h-60 overflow-y-auto">
                    {dropdownCategories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { setSelectedCategory(cat); setIsDropdownOpen(false); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRODUCT GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full pb-8 min-h-[50vh]">
        {displayedProducts.map(p => (
          <ProductCard key={p.item_code} product={p} onAdd={handleAdd} />
        ))}
        {displayedProducts.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-400">
             <Filter className="mx-auto mb-2 opacity-50" size={32} />
             <p>No items found.</p>
             <button onClick={() => {setSearchQuery(""); setSelectedCategory("All")}} className="text-blue-600 text-sm underline mt-2">Clear Filters</button>
          </div>
        )}
      </div>

      {/* ✅ PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pb-24 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button 
            onClick={() => changePage(currentPage - 1)} 
            disabled={currentPage === 1}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ChevronLeft size={20} />
          </button>
          
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Page <span className="text-gray-900 dark:text-white font-bold">{currentPage}</span> of {totalPages}
          </span>

          <button 
            onClick={() => changePage(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* FLOATING CART BUTTON */}
      {totalItems > 0 && !isCheckoutOpen && (
        <div className="fixed bottom-6 left-4 right-4 z-50 flex justify-center">
          <button 
            onClick={() => setIsCheckoutOpen(true)}
            className="bg-blue-600 text-white w-full max-w-md px-6 py-4 rounded-xl shadow-2xl font-bold flex items-center justify-between hover:scale-[1.02] transition-transform active:scale-95"
          >
            <div className="flex flex-col text-left leading-none gap-1">
              <span className="text-xs font-medium opacity-90">{totalItems} ITEMS</span>
              <span className="text-lg">₹{totalPrice}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              View Cart <ShoppingBag size={18} />
            </div>
          </button>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10">
            
            {/* Modal Header */}
            <div className="flex justify-between p-4 border-b dark:border-gray-800 bg-white dark:bg-gray-900 rounded-t-2xl z-10">
              <h2 className="font-bold text-lg">Your Cart</h2>
              <button onClick={() => setIsCheckoutOpen(false)}><X /></button>
            </div>
            
            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-950/50">
              {cart.map(item => (
                <div key={item.item_code} className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                  <div>
                    <div className="font-medium text-sm">{item.item_name}</div>
                    <div className="text-xs text-blue-600">₹{item.standard_rate * item.qty}</div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
                    <button onClick={() => updateQty(item.item_code, -1)}><Minus size={14}/></button>
                    <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.item_code, 1)}><Plus size={14}/></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Checkout Form */}
            <div className="p-4 border-t dark:border-gray-800 bg-white dark:bg-gray-900 rounded-b-2xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
              <form onSubmit={submitOrder} className="space-y-3">
                
                <input 
                  required 
                  placeholder="Your Name" 
                  className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
                <input 
                  required 
                  placeholder="Phone Number" 
                  type="tel"
                  className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                />

                {!showMoreDetails && (
                    <button 
                        type="button"
                        onClick={() => setShowMoreDetails(true)}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline py-2 w-full"
                    >
                        Add Address, GST & Notes <ChevronDown size={14}/>
                    </button>
                )}

                {showMoreDetails && (
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-gray-400 pb-1 uppercase tracking-wide">Additional Details</div>
                    <div ref={moreDetailsRef} className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <textarea 
                        placeholder="Delivery Address" 
                        rows={2}
                        className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                        value={formData.address} 
                        onChange={e => setFormData({...formData, address: e.target.value})} 
                        />
                        <input 
                        placeholder="GST Number (Optional)" 
                        className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                        value={formData.gst} 
                        onChange={e => setFormData({...formData, gst: e.target.value})} 
                        />
                        <div className="relative">
                        <FileText size={16} className="absolute top-3 left-3 text-gray-400" />
                        <textarea 
                            placeholder="Note (e.g., Call before coming)" 
                            rows={1}
                            className="w-full pl-10 p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 text-sm" 
                            value={formData.note} 
                            onChange={e => setFormData({...formData, note: e.target.value})} 
                        />
                        </div>
                    </div>

                    <button 
                        type="button"
                        onClick={() => setShowMoreDetails(false)}
                        className="text-xs font-bold text-gray-500 flex items-center justify-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 py-3 w-full"
                    >
                        <ChevronUp size={14}/> Hide Details
                    </button>
                  </div>
                )}

                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-3.5 rounded-xl font-bold shadow-lg mt-2 hover:bg-blue-700 transition-colors">
                  {loading ? "Sending..." : "Place Order"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}