import { query } from '@/lib/db';
import { Card, CardBody, CardHeader } from "@heroui/react";
import { Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export interface OrderRow {
    id: string;
    order_number: string;
    customer_name_input: string;
    customer_mobile_input: string;
    items_json: string;
    total_amount: number;
    status: 'Pending' | 'Approved' | 'Rejected';
    created_at: string;
}

/**
 * Render the admin "Command Center" dashboard showing order statistics and a recent orders table.
 *
 * The component fetches all orders (ordered by creation time) and displays aggregate counts
 * for pending and approved orders, plus a horizontally scrollable table of recent orders with
 * customer info, item counts (parsed from `items_json`), totals, status badges, and review links.
 *
 * @returns A JSX element containing the admin dashboard UI.
 */
export default async function AdminDashboard() {
    const orders = await query<OrderRow>('SELECT * FROM orders ORDER BY created_at DESC');

    return (
        <div className="p-8 space-y-8 min-h-screen bg-zinc-950 text-white" style={{ backgroundImage: "url('/background.svg')", backgroundSize: '40px 40px' }}>
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black uppercase tracking-tight">Command Center</h1>
                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <span className="text-xs text-zinc-500 uppercase tracking-widest block">Status</span>
                        <span className="text-green-500 font-bold flex items-center gap-2">● Online</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <Card className="bg-black border border-zinc-800">
                    <CardBody className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-zinc-900 rounded-lg"><Clock size={20} className="text-blue-500" /></div>
                            <span className="text-2xl font-mono font-bold">{orders.filter((o) => o.status === 'Pending').length}</span>
                        </div>
                        <h3 className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Pending Review</h3>
                    </CardBody>
                </Card>
                <Card className="bg-black border border-zinc-800">
                    <CardBody className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-zinc-900 rounded-lg"><CheckCircle size={20} className="text-green-500" /></div>
                            <span className="text-2xl font-mono font-bold">{orders.filter((o) => o.status === 'Approved').length}</span>
                        </div>
                        <h3 className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Approved Today</h3>
                    </CardBody>
                </Card>
            </div>

            {/* Orders List */}
            <Card className="bg-black border border-zinc-800">
                <CardHeader className="px-6 py-4 border-b border-zinc-900">
                    <h2 className="text-lg font-bold uppercase tracking-tight">Recent Orders</h2>
                </CardHeader>
                <CardBody className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-900/50 text-zinc-500 uppercase text-xs tracking-wider font-medium">
                                <tr>
                                    <th className="px-6 py-3">Ref</th>
                                    <th className="px-6 py-3">Customer (Web)</th>
                                    <th className="px-6 py-3">Items</th>
                                    <th className="px-6 py-3">Total</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900">
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-600 italic">
                                            No orders found.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => (
                                        <tr key={order.id} className="group hover:bg-zinc-900/30 transition-colors">
                                            <td className="px-6 py-4 font-mono text-zinc-400">{order.order_number}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-white">{order.customer_name_input}</div>
                                                <div className="text-xs text-zinc-600">{order.customer_mobile_input}</div>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-400">
                                                {JSON.parse(order.items_json).length} items
                                            </td>
                                            <td className="px-6 py-4 font-mono text-white">₹{order.total_amount}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${order.status === 'Pending' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                    order.status === 'Approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                        'bg-red-500/10 text-red-500 border-red-500/20'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    className="inline-block px-3 py-1 bg-white text-black text-xs font-bold rounded hover:bg-zinc-200 transition-colors"
                                                >
                                                    Review
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>
        </div >
    );
}