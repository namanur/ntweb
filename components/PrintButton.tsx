"use client";

import React from "react";
import { Printer } from "lucide-react";

export default function PrintButton({ orderId }: { orderId?: string }) {
  const handlePrint = async () => {
    // If orderId is provided, notify backend that printing started (Out for Delivery)
    if (orderId) {
      try {
        await fetch('/api/order/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderId,
            status: 'Out for Delivery'
          })
        });
      } catch (e) {
        console.error("Failed to notify print status", e);
      }
    }

    // Proceed to print
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className="bg-black text-white px-6 py-3 rounded-full font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
    >
      <Printer size={18} /> Print & Notify
    </button>
  );
}
