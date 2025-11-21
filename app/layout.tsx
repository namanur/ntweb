import type { Metadata } from "next";
import { Outfit } from "next/font/google"; // ✅ IMPORT MODERN FONT
import "./globals.css";
import { Providers } from "./providers";

// Configure the font
const font = Outfit({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"], // Load multiple weights
});

export const metadata: Metadata = {
  title: "Nandan Traders | Wholesale Store",
  description: "Premium Wholesale in Hazaribagh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${font.className} bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}