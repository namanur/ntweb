import { query } from '@/lib/db';
import { Card, CardBody, CardHeader } from "@heroui/react";
import Link from 'next/link';
import { OrderRow } from '../dashboard/page';

export const dynamic = 'force-dynamic';

/**
 * Render the admin Orders page that displays all orders in a styled, sortable layout.
 *
 * Fetches all orders ordered by creation time (newest first) and renders a responsive table
 * showing each order's reference, customer name and mobile, item count, total amount,
 * status (with a color-coded badge), and a link to view details. Shows a centered empty
 * state message when no orders exist.
 *
 * @returns A JSX element representing the Orders admin page UI.
 */
export default async function OrdersPage() {
    const orders = await query<OrderRow>('SELECT * FROM orders ORDER BY created_at DESC');

    return (
        <div className="p-8 space-y-8 min-h-screen bg-zinc-950 text-white" style={{ backgroundImage: "url('/background.svg')", backgroundSize: '40px 40px' }}>
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tight mb-2">All Orders</h1>
                <p className="text-zinc-400">Manage and track all customer orders.</p>
            </div>

            <Card className="bg-black border border-zinc-800">
                <CardHeader className="px-6 py-4 border-b border-zinc-900">
                    <h2 className="text-lg font-bold uppercase tracking-tight">Order Database</h2>
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
                                                    View Details
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
        </div>
    );
}