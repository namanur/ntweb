'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Card, CardBody, CardHeader, Spinner, useDisclosure } from "@heroui/react";
import { ArrowLeft, Check, X, RefreshCw, Package } from 'lucide-react';
import { toast } from 'sonner';
import { performAdminAction, updateOrderCustomer } from '@/actions/admin-mutations';
import { checkLiveStock } from '@/actions/admin-actions';
import CustomerSearchModal from "@/components/admin/CustomerSearchModal";

// Type definition (simplified)
interface Order {
    id: string;
    order_number: string;
    customer_name_input: string;
    customer_mobile_input: string;
    items_json: string;
    total_amount: number;
    status: string;
    created_at: string;
    erp_customer_id?: string | null;
}

export default function OrderDetail() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [stockMap, setStockMap] = useState<Record<string, number>>({});
    const [checkingStock, setCheckingStock] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();

    const handleCustomerSelect = async (customer: any) => {
        try {
            // Optimistic update
            setOrder(prev => prev ? ({ ...prev, erp_customer_id: customer.name }) : null);
            onClose();

            // Server Update (Phase 3 Requirement)
            const res = await updateOrderCustomer(order!.id, customer.name);
            if (res.success) toast.success("Linked to " + customer.customer_name);
            else toast.error("Link failed");
        } catch (e) {
            toast.error("Failed to link customer");
        }
    };

    // Fetch Order Data (Client-side for this phase, could be server component)
    useEffect(() => {
        if (params.id) {
            fetchOrder(params.id as string);
        }
    }, [params.id]);

    const fetchOrder = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/order/${id}`);
            const data = await res.json();
            if (data.success) {
                setOrder(data.order);
                // Trigger stock check immediately
                const items = JSON.parse(data.order.items_json);
                const codes = items.map((i: any) => i.item_code);
                checkStock(codes);
            }
        } catch (e) {
            toast.error("Failed to load order");
        } finally {
            setLoading(false);
        }
    };

    const checkStock = async (codes: string[]) => {
        setCheckingStock(true);
        try {
            const map = await checkLiveStock(codes);
            setStockMap(map);
        } catch (e) {
            toast.error("Stock check failed");
        } finally {
            setCheckingStock(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-white"><Spinner /></div>;
    if (!order) return <div className="p-8 text-white">Order not found</div>;

    const items = JSON.parse(order.items_json);

    return (
        <div className="p-8 space-y-6 min-h-screen bg-zinc-950 text-white">
            <div className="flex items-center gap-4">
                <Button isIconOnly variant="flat" onPress={() => router.back()} className="rounded-full bg-zinc-900 text-white">
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                        {order.order_number}
                        <span className={`text-xs px-2 py-1 rounded border uppercase tracking-wider ${order.status === 'Pending' ? 'text-blue-500 border-blue-500/30' :
                            order.status === 'Approved' ? 'text-green-500 border-green-500/30' : 'text-red-500'
                            }`}>
                            {order.status}
                        </span>
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content: Items & Stock */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-black border border-zinc-800">
                        <CardHeader className="flex justify-between border-b border-zinc-900 p-6">
                            <h2 className="font-bold uppercase tracking-tight flex items-center gap-2">
                                <Package size={18} /> Order Items
                            </h2>
                            <Button
                                size="sm"
                                variant="flat"
                                className="bg-zinc-900 text-zinc-400"
                                isLoading={checkingStock}
                                onPress={() => checkStock(items.map((i: any) => i.item_code))}
                            >
                                <RefreshCw size={14} className={checkingStock ? "animate-spin" : ""} /> Refresh Stock
                            </Button>
                        </CardHeader>
                        <CardBody className="p-0">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-900/30 text-zinc-500 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-3">Item</th>
                                        <th className="px-6 py-3 text-right">Req Qty</th>
                                        <th className="px-6 py-3 text-right">Rate</th>
                                        <th className="px-6 py-3 text-right">ERP Stock</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-900 text-zinc-300">
                                    {items.map((item: any, idx: number) => {
                                        const stock = stockMap[item.item_code];
                                        const hasStock = stock >= item.qty;
                                        return (
                                            <tr key={idx} className="hover:bg-zinc-900/20">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-white">{item.item_name}</div>
                                                    <div className="text-xs font-mono text-zinc-500">{item.item_code}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-white">{item.qty}</td>
                                                <td className="px-6 py-4 text-right font-mono">₹{item.standard_rate}</td>
                                                <td className="px-6 py-4 text-right">
                                                    {stock === undefined ? (
                                                        <span className="text-zinc-600">...</span>
                                                    ) : (
                                                        <span className={`font-mono font-bold ${hasStock ? 'text-green-500' : 'text-red-500'}`}>
                                                            {stock}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </CardBody>
                    </Card>
                </div>

                {/* Sidebar: Customer & Actions */}
                <div className="space-y-6">
                    <Card className="bg-black border border-zinc-800">
                        <CardHeader className="p-6 border-b border-zinc-900 font-bold uppercase tracking-tight">Customer Details (Web)</CardHeader>
                        <CardBody className="p-6 space-y-4">
                            <div>
                                <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-1">Name</label>
                                <div className="text-lg font-bold text-white">{order.customer_name_input}</div>
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-1">Mobile</label>
                                <div className="text-lg font-mono text-blue-400">{order.customer_mobile_input}</div>
                            </div>

                            {/* Phase 3: Customer Mapping */}
                            <div className="pt-4 border-t border-zinc-900">
                                <label className="text-xs text-zinc-500 uppercase tracking-widest block mb-2">ERP Customer Link</label>
                                <div className="space-y-3">
                                    {order.erp_customer_id ? (
                                        <div className="p-3 bg-green-900/20 rounded-lg border border-green-900/50 text-green-500 text-sm flex items-center justify-between">
                                            <span className="font-bold">{order.erp_customer_id}</span>
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800 border-dashed text-zinc-500 text-sm flex items-center justify-between">
                                            <span>Not Linked</span>
                                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        </div>
                                    )}

                                    <Button
                                        variant="flat"
                                        size="sm"
                                        className="w-full bg-zinc-800 text-zinc-300 hover:text-white"
                                        onPress={onOpen}
                                    >
                                        {order.erp_customer_id ? 'Change Link' : 'Search ERP Customer'}
                                    </Button>
                                    {/* Modal */}
                                    <CustomerSearchModal
                                        isOpen={isOpen}
                                        onClose={onClose}
                                        onSelect={handleCustomerSelect}
                                    />
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Actions */}
                    <Card className="bg-black border border-zinc-800">
                        <CardHeader className="p-6 border-b border-zinc-900 font-bold uppercase tracking-tight">Actions</CardHeader>
                        <CardBody className="p-6 gap-3">
                            <Button
                                className="w-full bg-green-600 text-white font-bold"
                                size="lg"
                                startContent={<Check size={20} />}
                                isDisabled={order.status !== 'Pending'}
                            >
                                Approve & Create Order
                            </Button>
                            <Button
                                className="w-full bg-red-900/20 text-red-500 border border-red-900/50 font-bold"
                                size="lg"
                                startContent={<X size={20} />}
                                isDisabled={order.status !== 'Pending'}
                            >
                                Reject Order
                            </Button>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}
