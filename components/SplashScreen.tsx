'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Render a full-viewport splash overlay with a brand mark that remains visible for at least 2 seconds before hiding.
 *
 * @returns A React element for the splash screen while visible, or `null` after it is hidden.
 */
export default function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2000); // Show splash for 2s minimum

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-[9999] bg-zinc-950 flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${visible ? 'translate-y-0' : '-translate-y-full'}`}>

      {/* Monochrome SVG Background */}
      <div
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url('/background.svg')`,
          backgroundSize: '40px 40px',
          backgroundPosition: 'center'
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 mb-6 relative grayscale contrast-125">
          <div className="w-full h-full border-4 border-white rounded-full flex items-center justify-center bg-black">
            <span className="text-4xl font-black text-white">N</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-3xl font-black text-white tracking-[0.2em] uppercase">Nandan</h1>
          <div className="mt-4 w-32 h-[1px] bg-zinc-800 overflow-hidden relative">
            <div className="absolute inset-0 bg-white animate-[shimmer_1.5s_infinite]" />
          </div>
        </div>
      </div>
    </div>
  );
}