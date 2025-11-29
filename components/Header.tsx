"use client";

import { Search } from "lucide-react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";
import ThemeToggle from "./ThemeToggle";

function SearchInput() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) params.set("q", term);
    else params.delete("q");
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex-1 max-w-md relative mx-4">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
      {/* ✅ UPDATED: rounded-2xl for Search Bar */}
      <input 
        type="text"
        placeholder="Search items..."
        className="w-full pl-11 p-2.5 rounded-2xl border border-border bg-secondary/50 text-sm focus:border-foreground focus:bg-background focus:ring-0 outline-none transition-all placeholder:text-muted-foreground font-medium"
        defaultValue={searchParams.get("q")?.toString()}
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border h-16 flex-none transition-all">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          
          {/* Brand */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="h-9 w-9 bg-foreground text-background flex items-center justify-center font-black text-lg rounded-xl group-hover:rotate-12 transition-transform">
              N
            </div>
            <span className="hidden sm:block font-black text-sm tracking-widest uppercase text-foreground">
              Nandan Traders
            </span>
          </div>

          {/* Search */}
          <Suspense fallback={<div className="flex-1" />}>
            <SearchInput />
          </Suspense>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
    </header>
  );
}