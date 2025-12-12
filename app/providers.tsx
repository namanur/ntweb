"use client";
import { ThemeProvider } from "next-themes";
import { HeroUIProvider } from "@heroui/react";
import { useRouter } from "next/navigation";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </HeroUIProvider>
  );
}