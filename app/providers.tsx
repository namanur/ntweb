"use client";
import { ThemeProvider } from "next-themes";
import { HeroUIProvider } from "@heroui/react";
import { useRouter } from "next/navigation";
import { CartProvider } from "@/contexts/CartContext";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <CartProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </CartProvider>
      </ThemeProvider>
    </HeroUIProvider>
  );
}