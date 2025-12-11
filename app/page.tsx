import React from 'react';
import Header from '@/components/Header'; 
import ProductGridClient from '@/components/ProductGridClient';
import { getProducts } from '@/lib/erp';
import Footer from '@/components/Footer';

// Ensure fresh data on every request
export const revalidate = 0; 

export default async function Home() {
  
  // 1. Fetch data
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">
        {/* Hero Section is now integrated inside ProductGridClient */}
        <ProductGridClient products={products} />
      </main>

      <Footer />
    </div>
  );
}