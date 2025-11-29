"use client";

import { Search } from "lucide-react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image"; // Import Image component
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
          
          {/* Brand Logo Section */}
          <div className="flex items-center gap-3 group cursor-pointer">
            
            {/* LOGO IMAGE CONTAINER */}
            <div className="relative h-12 w-12 group-hover:rotate-12 transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]">
              <Image 
                src="/logo.png"  // Ensure your file is named logo.png or logo.jpg in public/
                alt="Nandan Traders"
                fill
                className="object-contain dark:invert filter" // The Magic: Inverts colors in dark mode
                priority
              />
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