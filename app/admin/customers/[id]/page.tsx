"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, Wallet, ShoppingCart, TrendingUp, Calendar, CheckCircle2, Clock, Truck, Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function AdminCustomerDetail() {
    const params = useParams();
    const customerId = decodeURIComponent(params.id as string);

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Payment State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentForm, setPaymentForm] = useState({ amount: 0, mode: 'Cash', date: new Date().toISOString().split('T')[0], reference: '' });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchData();
    }, [customerId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/customers/${encodeURIComponent(customerId)}`);
            if (res.ok) setData(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handlePayment = async () => {
        if (paymentForm.amount <= 0) return alert("Enter valid amount");
        setProcessing(true);
        try {
            const res = await fetch('/api/admin/payment', {
                method: 'POST',
                body: JSON.stringify({ customer: customerId, ...paymentForm })
            });
            const result = await res.json();
            if (res.ok) {
                alert("Payment Recorded Successfully! ID: " + result.id);
                setShowPaymentModal(false);
                fetchData(); // Refresh data
                setPaymentForm({ amount: 0, mode: 'Cash', date: new Date().toISOString().split('T')[0], reference: '' });
            } else {
                alert("Failed: " + result.error);
            }
        } catch (e) { alert("Error connecting to server"); }
        finally { setProcessing(false); }
    };

    if (!data && !loading) return <div className="p-10 text-white">Failed to load data.</div>;

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/customers" className="p-2 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">{customerId}</h1>
                        <p className="text-zinc-500 text-sm">Customer Overview</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowPaymentModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-900/20"
                >
                    <Plus size={18} /> Record Payment
                </button>
            </div>

            {loading ? (
                <div className="animate-pulse space-y-4">
                    <div className="h-32 bg-zinc-900 rounded-2xl w-full"></div>
                    <div className="h-64 bg-zinc-900 rounded-2xl w-full"></div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* STAT CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                            <div className="flex items-center gap-3 mb-2 text-zinc-400">
                                <Wallet size={18} /> <span className="text-xs font-bold uppercase tracking-wider">Outstanding Balance</span>
                            </div>
                            <div className={`text-4xl font-black ${data.outstanding > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                ₹{data.outstanding.toLocaleString()}
                            </div>
                            <div className="text-xs text-zinc-500 mt-2">Total unpaid invoices</div>
                        </div>

                        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                            <div className="flex items-center gap-3 mb-2 text-zinc-400">
                                <ShoppingCart size={18} /> <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
                            </div>
                            <div className="text-4xl font-black text-white">
                                {data.orders.length}
                            </div>
                            <div className="text-xs text-zinc-500 mt-2">Lifetime order count</div>
                        </div>

                        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
                            <div className="flex items-center gap-3 mb-2 text-zinc-400">
                                <TrendingUp size={18} /> <span className="text-xs font-bold uppercase tracking-wider">Total Spent</span>
                            </div>
                            <div className="text-4xl font-black text-blue-400">
                                ₹{data.orders.reduce((acc: any, o: any) => acc + o.grand_total, 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-zinc-500 mt-2">Lifetime revenue</div>
                        </div>
                    </div>

                    {/* ORDERS TABLE */}
                    <div className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-zinc-900 text-lg font-bold">Recent Orders</div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-900/50 text-zinc-500 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-900">
                                <tr>
                                    <th className="p-4">Order ID</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900">
                                {data.orders.map((o: any) => (
                                    <tr key={o.name} className="hover:bg-zinc-900/30 transition-colors">
                                        <td className="p-4 font-mono font-bold text-white">{o.name}</td>
                                        <td className="p-4 text-zinc-400 flex items-center gap-2"><Calendar size={14} /> {o.transaction_date}</td>
                                        <td className="p-4">
                                            <span className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-bold w-fit ${o.status === "Completed" ? "bg-green-900/20 text-green-400" :
                                                o.status === "Cancelled" ? "bg-red-900/20 text-red-400" : "bg-yellow-900/20 text-yellow-400"
                                                }`}>
                                                {o.status === "Completed" ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                {o.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-bold text-zinc-300">₹{o.grand_total.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
