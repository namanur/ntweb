import React from 'react';
import { getOrders } from '@/lib/erp';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

import company from '@/data/company.json';

export default async function OrderSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const orders = await getOrders();
  const order = orders.find(o => o.id === resolvedParams.id);

  if (!order) return <div className="p-10 text-center font-bold text-red-500">Order not found: {resolvedParams.id}</div>;

  return (
    <div className="bg-white min-h-screen text-black p-6 font-mono max-w-2xl mx-auto print:p-0">

      {/* Header with Updated Address */}
      <div className="border-b-4 border-black pb-4 mb-6">
        <h1 className="text-4xl font-black uppercase tracking-tighter">{company.name.toUpperCase()}</h1>
        <div className="text-sm mt-1 space-y-0.5">
          <p>{company.address_line1},</p>
          <p>{company.address_line2}</p>
          <p className="font-bold pt-1">GST: {company.gstin} | Ph: {company.phone}</p>
        </div>

        <div className="flex justify-between items-end mt-4 border-t border-dashed border-gray-400 pt-2">
          <span className="text-lg font-bold">ORDER #{order.id}</span>
          <span className="text-sm">{new Date(order.date).toLocaleString()}</span>
        </div>
      </div>

      {/* Customer Info Box */}
      <div className="border-2 border-black p-4 mb-6">
        <h3 className="font-bold border-b border-black mb-2 uppercase text-xs">Customer Details</h3>
        <p className="text-xl font-bold">{order.customer.name}</p>
        <p className="text-sm mt-1">{order.customer.address}</p>
        <p className="text-sm font-bold mt-1">Ph: {order.customer.phone}</p>
        {order.customer.gst && <p className="text-sm mt-1">GSTIN: {order.customer.gst}</p>}
        {order.customer.notes && (
          <div className="mt-3 bg-gray-100 p-2 text-sm italic border-l-4 border-black">
            " {order.customer.notes} "
          </div>
        )}
      </div>

      {/* Picking List */}
      <h3 className="font-bold text-lg mb-2 uppercase border-b-2 border-black inline-block">Items to Pack</h3>
      <table className="w-full mb-8 text-left text-sm">
        <thead>
          <tr className="border-b border-black uppercase text-xs">
            <th className="py-2 w-10">#</th>
            <th className="py-2">Item Name</th>
            <th className="py-2 text-right">Qty</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={i} className="border-b border-gray-300">
              <td className="py-3 text-gray-500">{i + 1}</td>
              <td className="py-3 font-bold text-lg">
                {item.item_name}
                <div className="text-xs font-normal text-gray-500 font-mono">{item.item_code}</div>
              </td>
              <td className="py-3 text-right text-xl font-black">{item.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer Info */}
      <div className="text-right border-t-4 border-black pt-4">
        <p className="text-sm text-gray-500">Total Value</p>
        <p className="text-2xl font-black">₹{order.total.toLocaleString()}</p>
      </div>

      {/* Print Button */}
      <div className="fixed bottom-8 right-8 print:hidden">
        <PrintButton />
      </div>
    </div>
  );
}