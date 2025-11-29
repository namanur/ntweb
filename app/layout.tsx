import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Image from "next/image";
import SplashScreen from "@/components/SplashScreen"; // Import the new component

const font = Outfit({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Nandan Traders | Wholesale Store",
  description: "Premium Wholesale in Hazaribagh",
  icons: {
    icon: '/logo.png', 
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${font.className} bg-background text-foreground transition-colors duration-300 min-h-screen relative overflow-x-hidden`}>
        <Providers>
          
          {/* 🚀 SPLASH SCREEN (Covers everything initially) */}
          <SplashScreen />

          {/* 🌟 MEGA BACKGROUND WATERMARK */}
          <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
            <div className="relative w-[150vw] h-[150vw] md:w-[100vw] md:h-[100vw] opacity-[0.15] dark:opacity-[0.1] transition-all duration-500 animate-in fade-in zoom-in-50 duration-1000">
              <Image 
                src="/watermark.svg" 
                alt="Background Pattern"
                fill
                className="object-contain dark:invert opacity-80" 
                priority
              />
            </div>
          </div>

          {/* MAIN CONTENT WRAPPER */}
          <div className="relative z-10 flex flex-col min-h-screen">
            {children}
          </div>

        </Providers>
      </body>
    </html>
  );
}