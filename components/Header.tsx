"use client";

import { Search, Menu, X, ShieldCheck, MapPin, Phone, Mail, FileText, Info } from "lucide-react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import Image from "next/image";
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
    // Hidden on mobile, shown on desktop
    <div className="hidden md:block flex-1 max-w-md relative mx-4">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
      <input 
        type="text"
        placeholder="Search..."
        className="w-full pl-9 p-2.5 rounded-xl border border-border bg-secondary/50 text-sm focus:border-foreground focus:bg-background focus:ring-0 outline-none transition-all placeholder:text-muted-foreground font-medium"
        defaultValue={searchParams.get("q")?.toString()}
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  );
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    // ✅ SOLID BACKGROUND: bg-background/95 ensures it's opaque but lets a tiny bit of color through
    <header className="sticky top-0 z-[60] bg-background/95 backdrop-blur-md border-b border-border h-16 flex-none transition-all shadow-sm">
        <div className="w-full h-full flex items-center justify-between px-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 group cursor-pointer shrink-0" onClick={() => window.location.href='/'}>
            <div className="relative h-10 w-10 sm:h-12 sm:w-12 group-hover:rotate-12 transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]">
              <Image 
                src="/logo.png"
                alt="Nandan"
                fill
                className="object-contain dark:invert filter"
                priority
              />
            </div>
            <span className="font-black text-lg tracking-widest uppercase text-foreground hidden xs:block">
              Nandan Trader
            </span>
          </div>

          <Suspense fallback={<div className="hidden md:block flex-1" />}>
            <SearchInput />
          </Suspense>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:block">
               <ThemeToggle />
            </div>
            
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="p-2.5 rounded-xl bg-secondary hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-sm active:scale-95"
              aria-label="Open Menu"
            >
              <Menu size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* --- MENU DRAWER --- */}
        {isMenuOpen && (
          <div className="fixed inset-0 z-[100]">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* ✅ SOLID DRAWER BACKGROUND */}
            <div className="absolute top-0 right-0 h-full w-[85vw] sm:w-[350px] bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              
              <div className="flex justify-between items-center p-5 border-b border-border">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-secondary rounded-lg">
                      <ThemeToggle />
                   </div>
                   <span className="font-bold text-sm">Appearance</span>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-secondary rounded-full hover:bg-zinc-200 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <nav className="p-5 space-y-2">
                <a href="/about" className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 hover:bg-secondary font-bold text-sm transition-all">
                  <div className="p-2 bg-background rounded-full shadow-sm"><Info size={18} /></div> About Us
                </a>
                <a href="/terms" className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 hover:bg-secondary font-bold text-sm transition-all">
                  <div className="p-2 bg-background rounded-full shadow-sm"><FileText size={18} /></div> Terms & Conditions
                </a>
                <a href="/privacy" className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 hover:bg-secondary font-bold text-sm transition-all">
                  <div className="p-2 bg-background rounded-full shadow-sm"><ShieldCheck size={18} /></div> Privacy Policy
                </a>
              </nav>

              <div className="mt-auto p-6 bg-secondary/20 border-t border-border">
                <div className="mb-6">
                  <h3 className="font-black text-xl text-foreground uppercase tracking-tight mb-1">Nandan Trader</h3>
                  <p className="text-sm font-medium text-muted-foreground">Proprietor: Ram Nandan Mishra</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-mono font-bold text-foreground shadow-sm">
                    <ShieldCheck size={12} className="text-green-600" /> GST: 20AIIPM2082N1Z7
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="shrink-0 mt-0.5 text-muted-foreground" />
                    <span className="leading-snug text-muted-foreground">Khapriyawan, Barkagaon Road,<br/>Hazaribagh, Jharkhand - 825302</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="shrink-0 text-muted-foreground" />
                    <div className="flex flex-col gap-1">
                      <a href="https://wa.me/919431394095" className="font-bold text-green-600 hover:underline">WhatsApp: 94313-94095</a>
                      <a href="tel:6204188728" className="text-foreground hover:underline">Call: 62041-88728</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="shrink-0 text-muted-foreground" />
                    <a href="mailto:nandantrader1963@gmail.com" className="text-foreground hover:underline break-all">nandantrader1963@gmail.com</a>
                  </div>
                </div>

                <div className="text-center text-[10px] pt-8 opacity-40 font-medium uppercase tracking-widest">
                  © {new Date().getFullYear()} Nandan Trader
                </div>
              </div>

            </div>
          </div>
        )}
    </header>
  );
}