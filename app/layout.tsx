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

/**
 * Defines the application's root HTML layout, composing global providers, an initial splash screen, a premium animated background, and the main content wrapper.
 *
 * @param children - The page or route content to render inside the layout
 * @returns The complete HTML document for the app root containing providers, the splash screen, decorative background layers, and the rendered children
 */
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

          {/* 🌟 PREMIUM ANIMATED BACKGROUND */}
          <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden">
            {/* Gradient Orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[120px] animate-pulse duration-10000" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-purple-600/10 rounded-full blur-[120px] animate-pulse duration-7000" />

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.4]" />

            {/* Noise Texture for Texture */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.png')]" />
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