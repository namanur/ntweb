'use client';

import React, { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { Button, Modal, ModalContent, useDisclosure } from '@heroui/react';
import { calculateOrderTotal } from '@/lib/shop-rules';
import { toast } from 'sonner';
import CheckoutForm from './CheckoutForm';

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { cart, removeFromCart, updateQty } = useCart();
    const totalPrice = calculateOrderTotal(cart);
    const { isOpen: isCheckoutOpen, onOpen: onCheckoutOpen, onOpenChange: onCheckoutChange } = useDisclosure();

    return (
        <>
            {/* --- CART DRAWER OVERLAY --- */}
            <div
                className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* --- CART DRAWER PANEL --- */}
            <div className={`fixed top-0 right-0 z-[101] h-full w-full max-w-md bg-white dark:bg-zinc-950 shadow-2xl transform transition-transform duration-300 ease-out border-l border-zinc-200 dark:border-zinc-800 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-2 text-lg font-bold">
                        <ShoppingBag size={20} />
                        Your Cart <span className="text-zinc-400 font-normal text-sm">({cart.length})</span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition"><X size={20} /></button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-4">
                            <ShoppingBag size={48} className="opacity-20" />
                            <p>Your cart is empty.</p>
                            <Button onPress={onClose} variant="flat">Start Browsing</Button>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.item_code} className="flex gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Image Placeholder */}
                                <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    <span className="text-[10px] text-zinc-400 text-center px-1 truncate max-w-full">{item.item_code}</span>
                                </div>

                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-bold text-sm line-clamp-2">{item.item_name}</h4>
                                        <p className="text-xs text-zinc-500 mt-1">{item.brand}</p>
                                    </div>
                                    <div className="flex justify-between items-end mt-2">
                                        <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1">
                                            <button
                                                onClick={() => updateQty(item.item_code, item.qty - 1)}
                                                className="w-6 h-6 flex items-center justify-center hover:bg-white dark:hover:bg-zinc-800 rounded-md transition shadow-sm disabled:opacity-50"
                                                disabled={item.qty <= 1}
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className="text-sm font-semibold w-4 text-center">{item.qty}</span>
                                            <button
                                                onClick={() => updateQty(item.item_code, item.qty + 1)}
                                                className="w-6 h-6 flex items-center justify-center hover:bg-white dark:hover:bg-zinc-800 rounded-md transition shadow-sm"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold">₹{(item.standard_rate * item.qty).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item.item_code)}
                                    className="text-zinc-400 hover:text-red-500 self-start p-1"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {cart.length > 0 && (
                    <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-4">
                        <div className="flex justify-between items-center text-lg font-bold">
                            <span>Total</span>
                            <span>₹{totalPrice.toLocaleString()}</span>
                        </div>
                        <Button
                            size="lg"
                            className="w-full font-bold bg-black text-white dark:bg-white dark:text-black shadow-lg"
                            onPress={onCheckoutOpen}
                            endContent={<ArrowRight size={18} />}
                        >
                            Proceed to Checkout
                        </Button>
                    </div>
                )}
            </div>

            {/* --- CHECKOUT DETAILS MODAL --- */}
            <Modal
                isOpen={isCheckoutOpen}
                onOpenChange={onCheckoutChange}
                placement="center"
                backdrop="blur"
                size="2xl"
                scrollBehavior="inside"
                classNames={{
                    base: "bg-transparent shadow-none",
                    wrapper: "z-[200]"
                }}
            >
                <ModalContent className="p-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
                    {(onCloseModal: () => void) => (
                        <CheckoutForm onSuccess={() => {
                            onCloseModal();
                            onClose();
                        }} />
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}
