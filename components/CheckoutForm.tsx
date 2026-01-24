'use client';

import React, { useState } from "react";
import { ArrowRight, CheckCircle, Smartphone, User, ShoppingBag, Loader2 } from "lucide-react";
import { Button, Input } from "@heroui/react";
import { useCart } from "@/contexts/CartContext";
import { calculateOrderTotal } from "@/lib/shop-rules";
import { toast } from "sonner";

interface CheckoutFormProps {
    onSuccess: () => void;
}

/**
 * Checkout form component that submits the current cart and customer details to create an order and presents a confirmation view on success.
 *
 * Displays validation, success, and error toast notifications; clears the cart when an order is successfully placed and shows an order reference with customer details. After success, the user can continue shopping via the provided callback.
 *
 * @param onSuccess - Callback invoked when the user chooses to continue shopping after a successful order
 * @returns The checkout form React element
 */
export default function CheckoutForm({ onSuccess }: CheckoutFormProps) {
    const { cart, clearCart } = useCart();
    const [loading, setLoading] = useState(false);

    // Simple Form State (No complex address yet, as per Phase 1)
    const [formData, setFormData] = useState({ name: "", mobile: "" });

    // Success State
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderNumber, setOrderNumber] = useState("");

    const totalPrice = calculateOrderTotal(cart);

    const submitOrder = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.mobile) {
            toast.error("Name and Mobile are required");
            return;
        }

        if (formData.mobile.length !== 10) {
            toast.error("Please enter a valid 10-digit mobile number");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cart,
                    customer: formData
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // Success Flow
                setOrderNumber(data.orderId);
                setOrderSuccess(true);
                clearCart();
                toast.success("Order Placed Successfully!");
            } else {
                toast.error(data.message || "Failed to place order");
            }
        } catch (err) {
            toast.error("Connection failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // --- SUCCESS VIEW ---
    if (orderSuccess) {
        return (
            <div className="h-full absolute inset-0 z-[100] bg-zinc-950/90 backdrop-blur-xl p-6 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                    <CheckCircle size={48} strokeWidth={3} />
                </div>

                <h2 className="text-3xl font-black uppercase tracking-tight mb-2 text-white">Order Received!</h2>
                <p className="text-zinc-400 font-medium mb-8">
                    Ref: <span className="text-white font-mono font-bold bg-white/10 px-2 py-1 rounded ml-1">{orderNumber}</span>
                </p>

                <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/10 w-full max-w-sm mb-8 space-y-4">
                    <p className="text-sm text-zinc-300">
                        Thank you, <span className="font-bold text-white">{formData.name}</span>.
                    </p>
                    <p className="text-xs text-zinc-500">
                        We have received your order request. Our team will verify stock and contact you at <span className="font-mono text-zinc-400">{formData.mobile}</span> shortly.
                    </p>
                </div>

                <Button
                    size="lg"
                    className="font-bold w-full max-w-sm bg-white text-black hover:bg-zinc-200"
                    onPress={onSuccess}
                >
                    Continue Shopping
                </Button>
            </div>
        )
    }

    return (
        <form onSubmit={submitOrder} className="flex flex-col h-full bg-zinc-950/50 backdrop-blur-md">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-900/30">
                <h3 className="font-bold text-lg flex items-center gap-2 text-white">
                    <ShoppingBag size={20} className="text-blue-500" />
                    Place Order Request
                </h3>
            </div>

            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {/* Total Summary */}
                <div className="flex justify-between items-end pb-4 border-b border-white/10 border-dashed">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Est. Amount</span>
                    <span className="text-3xl font-black text-white tracking-tight">₹{totalPrice.toLocaleString()}</span>
                </div>

                <div className="space-y-4">
                    <Input
                        isRequired
                        label="Your Name"
                        placeholder="Full Name"
                        value={formData.name}
                        onValueChange={(v) => setFormData({ ...formData, name: v })}
                        startContent={<User size={16} className="text-zinc-500" />}
                        classNames={{
                            inputWrapper: "bg-zinc-900/50 border border-white/10 hover:border-white/20 group-data-[focus=true]:border-blue-500",
                            label: "text-zinc-400",
                            input: "text-white"
                        }}
                    />
                    <Input
                        isRequired
                        label="Mobile Number"
                        placeholder="10 digit number"
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d*$/.test(val) && val.length <= 10) setFormData({ ...formData, mobile: val });
                        }}
                        startContent={<Smartphone size={16} className="text-zinc-500" />}
                        classNames={{
                            inputWrapper: "bg-zinc-900/50 border border-white/10 hover:border-white/20 group-data-[focus=true]:border-blue-500",
                            label: "text-zinc-400",
                            input: "text-white"
                        }}
                    />

                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <p className="text-xs text-blue-300 leading-relaxed">
                            <strong>Note:</strong> This is an order request. Payment and final confirmation will be done after stock verification.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-black/20">
                <Button
                    type="submit"
                    size="lg"
                    fullWidth
                    isLoading={loading}
                    isDisabled={cart.length === 0}
                    className="font-black text-lg shadow-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-none"
                    endContent={!loading && <ArrowRight size={20} />}
                >
                    {loading ? "Submitting..." : "Submit Request"}
                </Button>
            </div>
        </form>
    );
}