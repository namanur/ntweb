"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // 1. Minimum wait time (1.2 seconds)
    const minTime = new Promise((resolve) => setTimeout(resolve, 1200));

    // 2. Actual page load time
    const loadTime = new Promise((resolve) => {
      if (document.readyState === "complete") {
        resolve(true);
      } else {
        window.addEventListener("load", () => resolve(true));
      }
    });

    Promise.all([minTime, loadTime]).then(() => {
      setIsVisible(false); // Start fade out
      setTimeout(() => setShouldRender(false), 700); // Unmount after fade out
    });
  }, []);

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-700 ease-in-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* ✨ ADJUSTED SIZE: 85% of Viewport Width (85vw)
         - This ensures the text "Nandan Traders" is visible and not cut off.
         - opacity-15: Subtle branding.
      */}
      <div className="relative w-[85vw] h-[85vw] md:w-[60vw] md:h-[60vw] animate-pulse opacity-[0.15]">
        <Image
          src="/logo.png"
          alt="Nandan Traders Loading"
          fill
          className="object-contain dark:invert"
          priority
        />
      </div>
    </div>
  );
}