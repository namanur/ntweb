"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

export type SortOption = "default" | "price_asc" | "price_desc" | "material" | "category";

export function useStoreFilters() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    // 1. Read State from URL
    const searchQuery = searchParams.get("q") || "";
    const selectedBrand = searchParams.get("brand") || "All";
    const selectedCategory = searchParams.get("category") || "All";
    const sortOption = (searchParams.get("sort") as SortOption) || "default";

    // 2. Helper to update URL
    const updateUrl = useCallback((updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams);

        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === "All" || value === "default" || value === "") {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });

        replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [searchParams, pathname, replace]);

    // 3. Setters
    const setSearchQuery = (q: string) => updateUrl({ q });
    const setSelectedBrand = (brand: string) => updateUrl({ brand });
    const setSelectedCategory = (category: string) => updateUrl({ category });
    const setSortOption = (sort: SortOption) => updateUrl({ sort });

    const clearFilters = useCallback(() => {
        replace(pathname, { scroll: true });
    }, [pathname, replace]);

    return {
        searchQuery,
        setSearchQuery,
        selectedBrand,
        setSelectedBrand,
        selectedCategory,
        setSelectedCategory,
        sortOption,
        setSortOption,
        clearFilters
    };
}
