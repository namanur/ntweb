"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/lib/erp';

export interface CartItem extends Product {
    qty: number;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (item: Product, qtyToAdd?: number) => void;
    updateQty: (code: string, newQty: number) => void;
    removeFromCart: (code: string) => void;
    clearCart: () => void;
    getCartQty: (itemCode: string) => number;
}
const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load from LocalStorage on Mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem("nandan_cart");
            if (saved) {
                setCart(JSON.parse(saved));
            }
        } catch (e) {
            console.warn("Failed to load cart from localStorage", e);
        } finally {
            setIsInitialized(true);
        }
    }, []);

    // Save to LocalStorage on Change
    useEffect(() => {
        if (!isInitialized) return; // Don't save empty array over existing data on first render
        try {
            localStorage.setItem("nandan_cart", JSON.stringify(cart));
        } catch (e) {
            console.warn("Failed to save cart to localStorage", e);
        }
    }, [cart, isInitialized]);

    const addToCart = (item: Product, qtyToAdd?: number) => {
        setCart(prev => {
            const exists = prev.find(p => p.item_code === item.item_code);
            const addAmount = qtyToAdd !== undefined ? qtyToAdd : (exists ? 1 : 2);

            if (exists) {
                return prev.map(p =>
                    p.item_code === item.item_code ? { ...p, qty: p.qty + addAmount } : p
                );
            }
            return [...prev, { ...item, qty: addAmount }];
        });
    };

    const updateQty = (code: string, newQty: number) => {
        setCart(prev => prev.map(item => {
            if (item.item_code !== code) return item;
            return { ...item, qty: newQty };
        }).filter(i => i.qty > 0));
    };

    const removeFromCart = (code: string) => {
        setCart(prev => prev.filter(item => item.item_code !== code));
    };

    const clearCart = () => {
        setCart([]);
    };

    const getCartQty = (itemCode: string) => {
        return cart.find(i => i.item_code === itemCode)?.qty || 0;
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, updateQty, removeFromCart, clearCart, getCartQty }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
