import { getProducts } from "@/lib/erp";
import ProductGridClient from "@/components/ProductGridClient";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ThemeToggle";
import AnnouncementBar from "@/components/AnnouncementBar";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const products = await getProducts();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
      
      {/* 1. Top Ticker */}
      <AnnouncementBar />

      {/* 2. Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-200 dark:border-gray-800 h-16 flex-none transition-colors">
        <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
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
          <ThemeToggle />
        </div>
      </header>

      {/* 3. Main Content (Catalog only) */}
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 py-6">
        <ProductGridClient products={products} />
      </main>

      {/* 4. Footer */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 mt-auto">
        <Footer />
      </div>
    </div>
  );
}