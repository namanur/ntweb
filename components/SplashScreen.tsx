"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Ensure the splash screen stays for at least 1.5 seconds for a smooth welcome
    const minTime = new Promise((resolve) => setTimeout(resolve, 1500));

    const loadTime = new Promise((resolve) => {
      if (document.readyState === "complete") {
        resolve(true);
      } else {
        window.addEventListener("load", () => resolve(true));
      }
    });

    Promise.all([minTime, loadTime]).then(() => {
      setIsVisible(false);
      setTimeout(() => setShouldRender(false), 700); // Wait for fade-out to finish
    });
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-700 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"
        }`}
    >
      <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-1000">
        {/* Logo Section */}
        <div className="relative w-24 h-24 md:w-32 md:h-32">
          <Image
            src="/logo.png"
            alt="Nandan Trader Logo"
            fill
            className="object-contain dark:invert"
            priority
          />
        </div>

        {/* Welcome Text */}
        <div className="text-center space-y-2">
          <p className="text-sm md:text-base font-medium text-muted-foreground uppercase tracking-widest">
            Welcome to
          </p>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground">
            Nandan Trader
          </h1>
        </div>

        {/* Loading Indicator (Optional Subtle Bar) */}
        <div className="w-24 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-4">
          <div className="h-full bg-primary animate-[shimmer_1.5s_infinite] w-1/2 rounded-full" />
        </div>
      </div>
    </div>
  );
}