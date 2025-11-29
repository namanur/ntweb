import { NextResponse } from "next/server";
import { saveOrderLocal, Order, createSalesOrder, deductInventory } from "@/lib/erp";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cart, customer } = body;

    // 1. CHECK ENVIRONMENT
    // We will set this variable in Vercel to 'public'
    const isPublicSite = process.env.NEXT_PUBLIC_APP_MODE === 'public';

    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // 2. PREPARE ORDER OBJECT
    const newOrder: Order = {
      id: "ORD-" + Date.now().toString().slice(-6),
      customer: {
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        gst: customer.gst || "N/A",
        notes: customer.note || "None"
      },
      items: cart.map((item: any) => ({
        item_code: item.item_code,
        item_name: item.item_name,
        qty: item.qty,
        rate: item.standard_rate
      })),
      total: cart.reduce((sum: number, item: any) => sum + (item.standard_rate * item.qty), 0),
      status: "Pending",
      date: new Date().toISOString(),
      erp_synced: false
    };

    let syncStatus = "❌ Not Synced (Offline)";

    // 3. PRIORITY: TRY ERP SYNC (Even if on Public Site)
    try {
        // If laptop is OFF, this will fail/timeout quickly
        console.log("Attempting ERP Sync...");
        await createSalesOrder(newOrder.items, newOrder.customer);
        
        newOrder.erp_synced = true;
        syncStatus = "✅ Synced to ERP";
    } catch (erpError) {
        console.warn("ERP Sync Failed (Laptop likely offline).");
        // We continue to Telegram fallback
        syncStatus = "⚠️ ERP Offline (Saved to Chat)";
    }

    // 4. FALLBACK: TELEGRAM NOTIFICATION (Always works)
    const itemsList = newOrder.items
      .map(i => `• ${i.item_name} (x${i.qty})`)
      .join("\n");

    const msg = `🛒 <b>NEW ORDER (${isPublicSite ? 'PUBLIC' : 'LOCAL'})</b>\n` +
                `🆔 <b>ID:</b> ${newOrder.id}\n` +
                `👤 <b>Customer:</b> ${newOrder.customer.name}\n` +
                `📞 <b>Phone:</b> ${newOrder.customer.phone}\n` +
                `📍 <b>Address:</b> ${newOrder.customer.address}\n\n` +
                `📦 <b>Items:</b>\n${itemsList}\n\n` +
                `💰 <b>Total: ₹${newOrder.total.toLocaleString()}</b>\n` +
                `🔄 <b>Status:</b> ${syncStatus}`;
                
    await sendTelegramMessage(msg, 'order'); 

    // 5. LOCAL FILE SAVE (Only if running Locally)
    // Public sites cannot write to disk, so we skip this step there.
    if (!isPublicSite) {
        await saveOrderLocal(newOrder);
        await deductInventory(newOrder.items);
    }

    return NextResponse.json({ 
      success: true, 
      orderId: newOrder.id,
      message: "Order placed successfully!"
    });
    
  } catch (error: any) {
    console.error("Order API Error:", error);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}

import { getOrders } from "@/lib/erp";
export async function GET() {
  // If public, return empty to prevent errors reading local files
  if (process.env.NEXT_PUBLIC_APP_MODE === 'public') {
      return NextResponse.json([]); 
  }
  const orders = await getOrders();
  return NextResponse.json(orders);
}