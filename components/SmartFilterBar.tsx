// components/SmartFilterBar.tsx
"use client";

import { useState } from "react";
import { useScrollDirection } from "@/hooks/useScrollDirection"; 
import { SlidersHorizontal, ArrowUpDown, X, Check } from "lucide-react";
import { cn } from "@/lib/utils"; // Ensure this path is correct for your project

// --- MOCK DATA (Replace with your real data later) ---
const BRANDS = ["Milton", "Cello", "Hawkins", "Prestige", "Bajaj", "Signoraware"];
const CATEGORIES = ["Lunch Boxes", "Water Bottles", "Cookware", "Thermos", "Containers", "Gift Sets"];

export function SmartFilterBar() {
  const scrollDirection = useScrollDirection();
  
  // State for modals
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  // State for Filter Tabs (Brand vs Category)
  const [activeFilterTab, setActiveFilterTab] = useState<"brand" | "category">("brand");

  return (
    <>
      {/* --- THE STICKY BAR --- */}
      <div
        className={cn(
          "fixed left-0 right-0 z-40 bg-white border-b shadow-sm transition-transform duration-300 ease-in-out",
          // Adjust 'top-[60px]' to match your actual Main Navbar height
          "top-[60px]", 
          // Logic: Hide on scroll down, show on scroll up
          scrollDirection === "down" ? "-translate-y-[150%]" : "translate-y-0"
        )}
      >
        <div className="flex items-center h-12 max-w-7xl mx-auto">
          
          {/* Filter Button */}
          <button 
            onClick={() => setIsFilterOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-medium border-r hover:bg-gray-50 active:bg-gray-100 h-full transition-colors"
          >
            <SlidersHorizontal size={16} className="text-gray-600" />
            Filter
          </button>

          {/* Sort Button */}
          <button 
            onClick={() => setIsSortOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-medium hover:bg-gray-50 active:bg-gray-100 h-full transition-colors"
          >
            <ArrowUpDown size={16} className="text-gray-600" />
            Sort
          </button>
        </div>
      </div>

      {/* --- FILTER MODAL --- */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-md h-[65vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold text-lg">Filters</h3>
              <button onClick={() => setIsFilterOpen(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>

            {/* Modal Body: Split Layout */}
            <div className="flex flex-1 overflow-hidden">
              
              {/* Sidebar (Brand/Category Toggles) */}
              <div className="w-1/3 bg-gray-50 border-r flex flex-col">
                <button 
                  onClick={() => setActiveFilterTab("brand")}
                  className={cn(
                    "p-4 text-left text-sm font-medium transition-colors", 
                    activeFilterTab === "brand" ? "bg-white text-blue-600 border-l-4 border-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
                  )}
                >
                  Brands
                </button>
                <button 
                  onClick={() => setActiveFilterTab("category")}
                  className={cn(
                    "p-4 text-left text-sm font-medium transition-colors", 
                    activeFilterTab === "category" ? "bg-white text-blue-600 border-l-4 border-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
                  )}
                >
                  Categories
                </button>
              </div>

              {/* Content Area (Checkboxes) */}
              <div className="w-2/3 p-4 overflow-y-auto bg-white">
                <div className="space-y-3">
                  {activeFilterTab === "brand" 
                    ? BRANDS.map((brand) => (
                        <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center">
                            <input type="checkbox" className="peer h-4 w-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500" />
                          </div>
                          <span className="text-sm text-gray-700 group-hover:text-black">{brand}</span>
                        </label>
                      ))
                    : CATEGORIES.map((cat) => (
                        <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center">
                            <input type="checkbox" className="peer h-4 w-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500" />
                          </div>
                          <span className="text-sm text-gray-700 group-hover:text-black">{cat}</span>
                        </label>
                      ))
                  }
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              <button 
                onClick={() => setIsFilterOpen(false)} 
                className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
              <button 
                onClick={() => setIsFilterOpen(false)} 
                className="flex-1 py-2.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors shadow-md"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SORT MODAL --- */}
      {isSortOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsSortOpen(false)}>
          <div 
            className="bg-white w-full sm:max-w-sm sm:rounded-xl rounded-t-2xl p-5 animate-in slide-in-from-bottom-10 duration-300 shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-semibold text-lg">Sort By</h3>
              <button onClick={() => setIsSortOpen(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="space-y-1">
              {/* Standard Sorts */}
              <SortOption label="Price: Low to High" />
              <SortOption label="Price: High to Low" />
              
              <div className="my-3 border-t border-gray-100"></div>
              
              {/* Custom Material/Type Sorts */}
              <SortOption label="Material: Steel to Plastic" />
              <SortOption label="Material: Plastic to Steel" />
              <SortOption label="Type: Lunch Boxes First" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper component for Sort Options
function SortOption({ label }: { label: string }) {
  return (
    <button className="w-full text-left py-3 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex justify-between items-center group transition-colors">
      {label}
      <Check size={16} className="opacity-0 group-hover:opacity-100 text-blue-600 transition-opacity" />
    </button>
  );
}