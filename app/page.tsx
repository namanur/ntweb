import { Suspense } from "react";
import { getProducts } from "@/lib/erp";
import ProductGridClient from "@/components/ProductGridClient";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import MustHaveSlider from "@/components/MustHaveSlider";
import LandingPage from "@/components/LandingPage"; 

export const dynamic = 'force-dynamic';

export default async function Home() {
  
  // 1. CHECK MODE
  // If set to 'landing', show the Welcome Screen.
  // Default is 'catalog'.
  const isLandingMode = process.env.NEXT_PUBLIC_SITE_MODE === 'landing';

  if (isLandingMode) {
    return <LandingPage />;
  }

  // --- CATALOG MODE (Existing Logic) ---
  const products = await getProducts();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <AnnouncementBar />
      <Suspense fallback={<div className="h-16 bg-background border-b border-border" />}>
        <Header />
      </Suspense>
      <MustHaveSlider />
      <main id="catalog-section" className="flex-grow w-full max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
           <h3 className="text-xl font-bold text-foreground">Explore All Products</h3>
           <p className="text-muted-foreground text-sm">Find the best deals on wholesale kitchenware.</p>
        </div>
        <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Loading products...</div>}>
          <ProductGridClient products={products} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}