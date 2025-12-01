import { Suspense } from "react";
import { getProducts } from "@/lib/erp";
import ProductGridClient from "@/components/ProductGridClient";
import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import MustHaveSlider from "@/components/MustHaveSlider";
import LandingPage from "@/components/LandingPage"; 

export const dynamic = 'force-dynamic';

interface HomeProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home(props: HomeProps) {
  
  // 1. CHECK MODE
  const isLandingMode = process.env.NEXT_PUBLIC_SITE_MODE === 'landing';

  if (isLandingMode) {
    return <LandingPage />;
  }

  // 2. CHECK SEARCH STATE
  const searchParams = await props.searchParams;
  const searchQuery = searchParams?.q?.toString() || "";
  const hasSearch = searchQuery.length > 0;

  // --- CATALOG MODE ---
  const products = await getProducts();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      
      {/* Hide Announcement on Search */}
      {!hasSearch && <AnnouncementBar />}
      
      <Suspense fallback={<div className="h-16 bg-background border-b border-border" />}>
        <Header />
      </Suspense>

      {/* Hide Hero Slider on Search */}
      {!hasSearch && <MustHaveSlider />}

      <main id="catalog-section" className="flex-grow w-full max-w-6xl mx-auto px-4 py-4">
        
        {!hasSearch && (
          <div className="mb-6">
             <h3 className="text-xl font-bold text-foreground">Explore All Products</h3>
             <p className="text-muted-foreground text-sm">Find the best deals on wholesale kitchenware.</p>
          </div>
        )}

        <Suspense fallback={<div className="text-center py-20 text-muted-foreground">Loading products...</div>}>
          <ProductGridClient products={products} />
        </Suspense>
      </main>
      
      {/* NOTE: Footer removed from Homepage as requested. 
         Footer details are now inside the Header's Hamburger Menu.
      */}
    </div>
  );
}