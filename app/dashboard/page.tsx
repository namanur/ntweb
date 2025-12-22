'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet, Package, Clock, LogOut, Loader2, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { logoutAction } from '../login/actions' // Reuse if possible or call API

export default function DashboardPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        // 1. Get Phone from LocalStorage
        const saved = localStorage.getItem("nandan_customer_details");
        let phone = "";

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.phone) phone = parsed.phone;
            } catch (e) {
                console.error("Failed to parse local customer details");
            }
        }

        if (!phone) {
            // No local identity -> Redirect to Shop
            router.push('/');
            return;
        }

        // 2. Fetch Data using Phone
        fetch(`/api/customer/dashboard?phone=${phone}`)
            .then(res => {
                if (res.status === 401) {
                    router.push('/');
                    throw new Error("Unauthorized");
                }
                if (!res.ok) {
                    throw new Error("Failed to fetch dashboard data");
                }
                return res.json()
            })
            .then(data => {
                // Defensive: Ensure defaults
                setData({
                    outstanding: data.outstanding || 0,
                    stats: data.stats || { totalOrders: 0, activeOrders: 0 },
                    orders: data.orders || []
                })
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                // Set safe empty defaults if error
                setData({ outstanding: 0, stats: { totalOrders: 0, activeOrders: 0 }, orders: [] });
                setLoading(false);
            })
    }, [router])

    const handleBack = () => {
        router.push('/');
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <Loader2 className="animate-spin text-zinc-500" size={32} />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 pb-20 sm:p-8">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
                            <Image src="/logo.png" alt="Logo" width={30} height={30} className="invert brightness-0" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold uppercase tracking-widest">Device History</h1>
                            <p className="text-zinc-500 text-sm">Recent orders from this device</p>
                        </div>
                    </div>
                    <button onClick={handleBack} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white">
                        <ArrowRight size={20} className="rotate-180" />
                    </button>
                </div>

                {/* Disclaimer Banner */}
                <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3 text-yellow-500">
                    <LogOut className="shrink-0" size={24} />
                    <div className="space-y-1">
                        <p className="font-bold text-sm">Only showing orders placed from this browser.</p>
                        <p className="text-xs text-yellow-500/80 leading-relaxed">
                            For a complete history or to check status, please check your WhatsApp messages or contact us directly.
                            Clearing your browser cache will remove this list.
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {/* Outstanding Balance */}
                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 p-4 transition-transform group-hover:scale-110 ${data.outstanding > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            <Wallet size={32} />
                        </div>
                        <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Total Due</p>
                        <h2 className={`text-3xl font-black mt-1 ${data.outstanding > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            ₹{data.outstanding.toLocaleString()}
                        </h2>
                    </div>

                    {/* Active Orders */}
                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 text-blue-500 transition-transform group-hover:scale-110">
                            <Clock size={32} />
                        </div>
                        <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Active Orders</p>
                        <h2 className="text-3xl font-black mt-1 text-white">{data.stats.activeOrders}</h2>
                    </div>

                    {/* Total Orders */}
                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 text-purple-500 transition-transform group-hover:scale-110">
                            <Package size={32} />
                        </div>
                        <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Total Orders</p>
                        <h2 className="text-3xl font-black mt-1 text-white">{data.stats.totalOrders}</h2>
                    </div>
                </div>

                {/* Recent Orders */}
                <h3 className="text-lg font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-zinc-500" /> Recent Activity
                </h3>

                <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
                    {data.orders.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500">No orders found.</div>
                    ) : (
                        <div className="divide-y divide-zinc-800">
                            {data.orders.map((order: any) => (
                                <div key={order.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white">{order.id}</span>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${order.status === 'Completed' ? 'bg-green-900/30 text-green-400' :
                                                order.status === 'Cancelled' ? 'bg-red-900/30 text-red-400' :
                                                    'bg-yellow-900/30 text-yellow-400'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <p className="text-zinc-500 text-xs mt-1">{new Date(order.date).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-white">₹{(order.total || 0).toLocaleString()}</p>
                                        <p className="text-[10px] text-zinc-500 uppercase flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            View <ArrowRight size={10} />
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-center mt-8">
                    <a href="/" className="px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-zinc-200 transition-colors">
                        Shop Now
                    </a>
                </div>

            </div>
        </div>
    )
}
