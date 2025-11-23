import { Suspense } from "react";
import { getProducts } from "@/lib/erp";
import ProductGridClient from "@/components/ProductGridClient";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/AnnouncementBar";
// import HeroSection from "@/components/HeroSection"; // ❌ Remove or Comment out old hero
import Header from "@/components/Header";
import MustHaveSlider from "@/components/MustHaveSlider"; // ✅ Import new Slider

export const dynamic = 'force-dynamic';

export default async function Home() {
  const products = await getProducts();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
      
      {/* 1. Top Ticker */}
      <AnnouncementBar />

      {/* 2. Header */}
      <Suspense fallback={<div className="h-16 bg-white border-b" />}>
        <Header />
      </Suspense>

      {/* 3. ✅ NEW MUST HAVE SLIDER (Replaces Hero) */}
      <MustHaveSlider />

      {/* 4. Main Content (Catalog) */}
      <main id="catalog-section" className="flex-grow w-full max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
           <h3 className="text-xl font-bold text-gray-900 dark:text-white">Explore All Products</h3>
           <p className="text-gray-500 text-sm">Find the best deals on wholesale kitchenware.</p>
        </div>
        <Suspense fallback={<div className="text-center py-20">Loading products...</div>}>
          <ProductGridClient products={products} />
        </Suspense>
      </main>

      {/* 5. Footer */}
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 mt-auto">
        <Footer />
      </div>
    </div>
  );
}