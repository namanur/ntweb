import { Suspense } from "react";
import { getProducts } from "@/lib/erp";
import ProductGridClient from "@/components/ProductGridClient";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import MustHaveSlider from "@/components/MustHaveSlider";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const products = await getProducts();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      
      {/* 1. Top Ticker */}
      <AnnouncementBar />

      {/* 2. Header */}
      <Suspense fallback={<div className="h-16 bg-background border-b border-border" />}>
        <Header />
      </Suspense>

      {/* 3. Slider */}
      <MustHaveSlider />

      {/* 4. Main Content (Catalog) */}
      <main id="catalog-section" className="flex-grow w-full max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
           <h3 className="text-xl font-bold text-foreground">Explore All Products</h3>
           <p className="text-muted-foreground text-sm">Find the best deals on wholesale kitchenware.</p>
        </div>
        <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Loading products...</div>}>
          <ProductGridClient products={products} />
        </Suspense>
      </main>

      {/* 5. Footer */}
      <Footer />
    </div>
  );
}