"use client"; // This directive makes it a Client Component

import React from "react";
import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="bg-black text-white px-6 py-3 rounded-full font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
    >
      <Printer size={18} /> Print Invoice
    </button>
  );
}
