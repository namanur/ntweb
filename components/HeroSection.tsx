import React from 'react';
import Image from 'next/image';

const HeroSection = () => {
  return (
    <div className="w-full mb-8 animate-in fade-in duration-700">
      <div className="relative w-full overflow-hidden rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        
        {/* Red Accent Strip on the Left */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#ed1c24]" />

        <div className="flex items-center justify-between px-6 py-6 sm:py-8">
            <div className="flex items-center gap-6">
                {/* Anjali Logo */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-white p-2 rounded-xl border border-zinc-100 shadow-sm">
                    <Image 
                        src="/brands/anjali.png" 
                        alt="Anjali Kitchenware" 
                        fill 
                        className="object-contain p-1"
                        priority
                    />
                </div>

                <div className="flex flex-col justify-center">
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white leading-none">
                        Anjali Kitchenware
                    </h2>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#ed1c24]/10 text-[#ed1c24] tracking-wider border border-[#ed1c24]/20">
                            Authorized Partner
                        </span>
                        <span className="text-sm font-medium text-zinc-500">
                           • Coming Soon
                        </span>
                    </div>
                </div>
            </div>

            {/* Optional "Notify Me" or Simple Decoration */}
            <div className="hidden sm:block text-right">
                 <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    New Catalog
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                    Launching full range shortly
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;