"use client";

import React, { useEffect } from "react";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@heroui/react";
import { useCart } from "@/contexts/CartContext";
import CheckoutForm from "./CheckoutForm";
import { calculateItemTotal } from "@/lib/shop-rules";

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const { cart, updateQty } = useCart();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; }
    }, [isOpen]);

    // Calculate total items for display
    const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="fixed top-0 left-0 h-full w-full sm:w-[450px] glass-panel z-[101] border-r-0 transform transition-transform duration-300 animate-in slide-in-from-left overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-border flex justify-between items-center bg-card flex-none h-[10%] min-h-[70px]">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">Cart</h2>
                        <p className="text-xs text-muted-foreground font-medium mt-1">{totalItems} items selected</p>
                    </div>
                    <Button isIconOnly variant="light" onPress={onClose}><X size={24} /></Button>
                </div>

                {/* Items List */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-default-50 h-[60%]">
                    {cart.map(item => (
                        <div key={item.item_code} className="flex gap-3 p-3 bg-card rounded-2xl border border-border items-start group shadow-sm">
                            <div className="flex-1">
                                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 truncate">{item.item_code}</div>
                                <h4 className="font-bold text-sm text-foreground leading-snug line-clamp-2">{item.item_name}</h4>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs font-mono bg-default-100 px-2 py-1 rounded text-muted-foreground border border-border">₹{item.standard_rate} {item.stock_uom ? `/ ${item.stock_uom}` : ''}</span>
                                    <span className="text-xs text-muted-foreground">x {item.qty}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className="font-black text-base">₹{calculateItemTotal(item).toLocaleString()}</span>
                                <div className="flex items-center gap-1 bg-default-100 rounded-lg border border-border p-1">
                                    <Button isIconOnly size="sm" variant="light" onPress={() => updateQty(item.item_code, -1)} className="h-9 w-9 min-w-9"><Minus size={14} /></Button>
                                    <span className="w-8 text-center text-xs font-bold">{item.qty}</span>
                                    <Button isIconOnly size="sm" variant="light" onPress={() => updateQty(item.item_code, 1)} className="h-9 w-9 min-w-9"><Plus size={14} /></Button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                            <ShoppingBag size={64} strokeWidth={1} className="mb-4" />
                            <p className="text-lg font-medium">Your cart is empty</p>
                            <Button variant="light" onPress={onClose} className="mt-4 font-bold underline">Start Shopping</Button>
                        </div>
                    )}
                </div>

                {/* Checkout Form */}
                <CheckoutForm onSuccess={onClose} />
            </div>
        </>
    );
}
