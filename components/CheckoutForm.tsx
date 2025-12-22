import React, { useState, useEffect } from "react";
import { PlusCircle, ArrowRight, ChevronDown, CheckCircle, AlertCircle } from "lucide-react";
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

    // Success State
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderId, setOrderId] = useState("");
    const [orderDate, setOrderDate] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    // Calculate Total Price (Logic from ProductGridClient)
    const totalPrice = calculateOrderTotal(cart);

    useEffect(() => {
        const saved = localStorage.getItem("nandan_customer_details");
        if (saved) try { setFormData(JSON.parse(saved)); } catch { }
    }, []);

    const submitOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        const finalData = { ...formData, address: showAddressLine2 ? `${formData.address}, ${formData.addressLine2}` : formData.address };

        try {
            localStorage.setItem("nandan_customer_details", JSON.stringify(finalData));
            const res = await fetch('/api/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cart, customer: finalData })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // Success Flow
                setOrderId(data.orderId);
                setOrderDate(new Date().toLocaleString());
                setOrderSuccess(true);
                clearCart();
            } else {
                // Use specific details if available, otherwise the generic error
                const message = data.details || data.error || "Failed to place order. Please try again.";
                setErrorMsg(message);
            }
        } catch (err) {
            setErrorMsg("We couldn't reach the server. Please check your internet connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    // --- SUCCESS VIEW ---
    if (orderSuccess) {
        return (
            <div className="h-full absolute inset-0 z-[100] bg-card p-6 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="w-24 h-24 bg-green-500/10 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-600 dark:text-green-500 animate-in zoom-in duration-500 delay-100">
                    <CheckCircle size={48} strokeWidth={3} />
                </div>

                <h2 className="text-3xl font-black uppercase tracking-tight mb-3 text-foreground">Order Received!</h2>
                <p className="text-muted-foreground font-medium mb-8 max-w-[280px] leading-relaxed">
                    Thank you, {formData.name}.<br />We will contact you shortly to confirm the details.
                </p>

                <div className="bg-default-100/50 dark:bg-default-50/10 rounded-2xl p-6 w-full max-w-sm mb-8 border border-border/50 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Order ID</span>
                        <span className="font-mono font-bold text-foreground bg-background px-2 py-1 rounded border border-border">{orderId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Placed On</span>
                        <span className="text-xs font-bold text-foreground">{orderDate}</span>
                    </div>
                </div>

                <Button
                    size="lg"
                    color="primary"
                    className="font-black w-full max-w-sm shadow-xl hover:scale-105 transition-transform"
                    onPress={onSuccess}
                >
                    Done
                </Button>
            </div>
        )
    }

    return (
        <div className={`border-t border-border bg-card transition-all duration-300 ease-in-out flex flex-col relative ${showMoreDetails ? 'h-full absolute inset-0 z-50' : 'flex-none h-[30%] min-h-[240px]'}`}>

            {/* Header when expanded */}
            {showMoreDetails && (
                <div className="p-5 border-b border-border flex justify-between items-center bg-card flex-none">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                        Order Details
                    </h3>
                    <Button size="sm" variant="flat" onPress={() => setShowMoreDetails(false)} startContent={<ChevronDown size={14} />}>Minimize</Button>
                </div>
            )}

            <form onSubmit={submitOrder} className="flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto p-5 pb-0 scrollbar-hide">

                    {/* Compact View Total */}
                    {!showMoreDetails && (
                        <div className="flex justify-between items-end mb-4 pb-4 border-b border-border border-dashed flex-none">
                            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Pay</span>
                            <span className="text-3xl font-black text-foreground">₹{totalPrice.toLocaleString()}</span>
                        </div>
                    )}

                    {/* Error Message */}
                    {errorMsg && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400">
                            <AlertCircle size={18} className="shrink-0" />
                            <p className="text-xs font-bold">{errorMsg}</p>
                        </div>
                    )}

                    <div className="space-y-3 pb-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Input isRequired label="Name" placeholder="Your Name" value={formData.name} onValueChange={(v: string) => setFormData({ ...formData, name: v })} classNames={{ inputWrapper: "bg-default-100" }} />
                            <Input isRequired label="Phone" placeholder="10 digits" type="tel" value={formData.phone} onChange={(e) => { const val = e.target.value; if (/^\d*$/.test(val) && val.length <= 10) setFormData({ ...formData, phone: val }); }} classNames={{ inputWrapper: "bg-default-100" }} />
                        </div>

                        {!showMoreDetails && (
                            <Button variant="bordered" onPress={() => setShowMoreDetails(true)} className="w-full font-bold text-muted-foreground border-dashed" startContent={<PlusCircle size={14} />}>Add Address & GST</Button>
                        )}

                        {showMoreDetails && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex justify-between items-center py-2 bg-default-100 px-3 rounded-lg">
                                    <span className="text-xs font-bold text-muted-foreground uppercase">Cart Total</span>
                                    <span className="text-xl font-black text-foreground">₹{totalPrice.toLocaleString()}</span>
                                </div>

                                <div>
                                    <Input label="GST Number (Optional)" placeholder="Ex: 22AAAAA0000A1Z5" value={formData.gst} onValueChange={(v: string) => setFormData({ ...formData, gst: v })} classNames={{ inputWrapper: "bg-default-100" }} />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-bold text-muted-foreground uppercase">Address</span>
                                        <span onClick={() => setShowAddressLine2(!showAddressLine2)} className="text-primary text-tiny cursor-pointer hover:underline flex items-center gap-1"><PlusCircle size={10} /> Add Line 2</span>
                                    </div>
                                    <div className="space-y-2">
                                        <textarea placeholder="Street, Building, Area..." rows={2} className="w-full p-3 bg-default-100 rounded-xl outline-none text-sm font-medium resize-none focus:ring-2 ring-primary/50 transition-all" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                        {showAddressLine2 && (<Input placeholder="Landmark / City / Pincode" value={formData.addressLine2} onValueChange={(v: string) => setFormData({ ...formData, addressLine2: v })} classNames={{ inputWrapper: "bg-default-100" }} />)}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase mb-1 block">Order Notes</label>
                                    <textarea placeholder="Special instructions..." rows={2} className="w-full p-3 bg-default-100 rounded-xl outline-none text-sm font-medium resize-none focus:ring-2 ring-primary/50" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-5 border-t border-border bg-card flex-none pb-8 sm:pb-6">
                    <Button type="submit" color="primary" size="lg" fullWidth isLoading={loading} isDisabled={cart.length === 0} className="font-black text-lg shadow-xl" endContent={!loading && <ArrowRight size={20} />}>
                        {loading ? "Processing..." : "Confirm Order"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
