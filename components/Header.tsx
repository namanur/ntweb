"use client";

import { Search } from "lucide-react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";
import ThemeToggle from "./ThemeToggle";
import Image from "next/image";

function SearchInput() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex-1 max-w-md relative mx-4">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
      <input 
        type="text"
        placeholder="Search 400+ items..."
        className="w-full pl-9 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
        defaultValue={searchParams.get("q")?.toString()}
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-200 dark:border-gray-800 h-16 flex-none transition-colors">
        <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-10 w-auto object-contain dark:invert dark:brightness-0"
            />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="font-bold text-lg tracking-tight uppercase">Nandan Traders</span>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Wholesale</span>
            </div>
          </div>

          {/* Universal Search Bar */}
          <Suspense fallback={<div className="flex-1" />}>
            <SearchInput />
          </Suspense>

          {/* Theme Toggle */}
          <div className="flex-shrink-0">
            <ThemeToggle />
          </div>
        </div>
    </header>
  );
}