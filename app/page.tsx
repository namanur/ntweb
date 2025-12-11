import React from 'react';
import Header from '@/components/Header'; // Ensure this path matches your Header file
import HeroSection from '@/components/HeroSection';
import ProductGridClient from '@/components/ProductGridClient';
import { getProducts } from '@/lib/erp';
import Footer from '@/components/Footer';

// Ensure fresh data on every request so searchParams are accurate
export const revalidate = 0; 

export default async function Home({ 
  searchParams 
}: { 
  searchParams: { q?: string; category?: string; brand?: string } 
}) {
  
  // 1. Fetch data
  const products = await getProducts();

  // 2. Check if any filter is active
  // We check if parameters exist AND are not set to the default "All"
  const hasFilters = 
    (searchParams?.q && searchParams.q.length > 0) || 
    (searchParams?.brand && searchParams.brand !== 'All') || 
    (searchParams?.category && searchParams.category !== 'All');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 3. Header restored at the top level */}
      <Header />

      <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* 4. Conditional Rendering: Only show Hero if NO filters are active */}
        {!hasFilters && <HeroSection />}

        {/* Product Grid */}
        <ProductGridClient products={products} />
      </main>

      <Footer />
    </div>
  );
}