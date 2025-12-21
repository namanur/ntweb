"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle, ArrowRight, ChevronDown } from "lucide-react";
import { Button, Input } from "@heroui/react";
import { useCart } from "@/contexts/CartContext";
import { calculateOrderTotal } from "@/lib/shop-rules";

interface CheckoutFormProps {
    onSuccess: () => void;
}

export default function CheckoutForm({ onSuccess }: CheckoutFormProps) {
    const { cart, clearCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [showMoreDetails, setShowMoreDetails] = useState(false);
    const [showAddressLine2, setShowAddressLine2] = useState(false);
    const [formData, setFormData] = useState({ name: "", phone: "", gst: "", address: "", addressLine2: "", note: "" });

    // Calculate Total Price (Logic from ProductGridClient)
    const totalPrice = calculateOrderTotal(cart);

    useEffect(() => {
        const saved = localStorage.getItem("nandan_customer_details");
        if (saved) try { setFormData(JSON.parse(saved)); } catch { }
    }, []);

    const submitOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const finalData = { ...formData, address: showAddressLine2 ? `${formData.address}, ${formData.addressLine2}` : formData.address };
        try {
            localStorage.setItem("nandan_customer_details", JSON.stringify(finalData));
            const res = await fetch('/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart, customer: finalData }) });
            if (res.ok) {
                alert("✅ Order Placed!");
                clearCart();
                setShowMoreDetails(false);
                onSuccess(); // Close drawer
            }
            else { alert("❌ Failed to place order."); }
        } catch { alert("❌ Connection Error"); } finally { setLoading(false); }
    };

    return (
        <div className={`border-t border-border bg-card transition-all duration-300 ease-in-out flex flex-col relative ${showMoreDetails ? 'h-full absolute inset-0 z-50' : 'flex-none h-[30%] min-h-[240px]'}`}>
            {showMoreDetails && (<div className="p-5 border-b border-border flex justify-between items-center bg-card flex-none"><h3 className="font-bold text-lg flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div> Order Details</h3><Button size="sm" variant="flat" onPress={() => setShowMoreDetails(false)} startContent={<ChevronDown size={14} />}>Minimize</Button></div>)}
            <form onSubmit={submitOrder} className="flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto p-5 pb-0">
                    {!showMoreDetails && (<div className="flex justify-between items-end mb-4 pb-4 border-b border-border border-dashed flex-none"><span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Pay</span><span className="text-3xl font-black text-foreground">₹{totalPrice.toLocaleString()}</span></div>)}
                    <div className="space-y-3 pb-4">
                        <div className="grid grid-cols-2 gap-3"><Input isRequired label="Name" placeholder="Your Name" value={formData.name} onValueChange={(v: string) => setFormData({ ...formData, name: v })} /><Input isRequired label="Phone" placeholder="10 digits" type="tel" value={formData.phone} onChange={(e) => { const val = e.target.value; if (/^\d*$/.test(val) && val.length <= 10) setFormData({ ...formData, phone: val }); }} /></div>
                        {!showMoreDetails && (<Button variant="bordered" onPress={() => setShowMoreDetails(true)} className="w-full font-bold text-muted-foreground border-dashed" startContent={<PlusCircle size={14} />}>Add Address & GST</Button>)}
                        {showMoreDetails && (<div className="space-y-4 animate-in fade-in slide-in-from-bottom-4"><div className="flex justify-between items-center py-2 bg-default-100 px-3 rounded-lg"><span className="text-xs font-bold text-muted-foreground uppercase">Cart Total</span><span className="text-xl font-black text-foreground">₹{totalPrice.toLocaleString()}</span></div><div><Input label="GST Number (Optional)" placeholder="Ex: 22AAAAA0000A1Z5" value={formData.gst} onValueChange={(v: string) => setFormData({ ...formData, gst: v })} /></div><div><div className="flex justify-between items-center mb-1"><span className="text-xs font-bold text-muted-foreground uppercase">Address</span><span onClick={() => setShowAddressLine2(!showAddressLine2)} className="text-primary text-tiny cursor-pointer hover:underline flex items-center gap-1"><PlusCircle size={10} /> Add Line 2</span></div><div className="space-y-2"><textarea placeholder="Street, Building, Area..." rows={2} className="w-full p-3 bg-default-100 rounded-xl outline-none text-sm font-medium resize-none focus:ring-2 ring-primary/50 transition-all" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />{showAddressLine2 && (<Input placeholder="Landmark / City / Pincode" value={formData.addressLine2} onValueChange={(v: string) => setFormData({ ...formData, addressLine2: v })} />)}</div></div><div><label className="text-[11px] font-bold text-muted-foreground uppercase mb-1 block">Order Notes</label><textarea placeholder="Special instructions..." rows={2} className="w-full p-3 bg-default-100 rounded-xl outline-none text-sm font-medium resize-none focus:ring-2 ring-primary/50" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} /></div></div>)}
                    </div>
                </div>
                <div className="p-5 border-t border-border bg-card flex-none pb-8 sm:pb-6"><Button type="submit" color="primary" size="lg" fullWidth isLoading={loading} isDisabled={cart.length === 0} className="font-black text-lg shadow-xl" endContent={<ArrowRight size={20} />}>{loading ? "Processing..." : "Confirm Order"}</Button></div>
            </form>
        </div>
    );
}
