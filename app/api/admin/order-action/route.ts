import { NextResponse } from "next/server";
import { getOrders, updateOrderStatus, createSalesOrder } from "@/lib/erp";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const { action, orderId } = await req.json();
    
    // 1. Validate Input
    if (!action || !orderId) {
        return NextResponse.json({ error: "Missing action or orderId" }, { status: 400 });
    }

    const orders = await getOrders();
    const order = orders.find(o => o.id === orderId);

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    let message = "";

    // 2. Handle Actions
    if (action === "sync_erp") {
      try {
        console.log(`Syncing Order ${orderId} to ERP...`);
        // Note: This relies on createSalesOrder in lib/erp.ts working correctly
        await createSalesOrder(order.items, order.customer); 
        await updateOrderStatus(orderId, "Packed"); 
        message = "Synced to ERP & Marked as Packed";
      } catch (e: any) {
        console.error("ERP Sync Failed:", e);
        // Return the specific error message from ERP/Axios
        const errMsg = e.response?.data?.message || e.message || "ERP Connection Refused";
        return NextResponse.json({ error: "ERP Sync Failed: " + errMsg }, { status: 500 });
      }
    }

    else if (action === "mark_out_for_delivery") {
      await updateOrderStatus(orderId, "Out for Delivery");
      
      const msg = `🚚 <b>ORDER DISPATCHED</b>\n` +
                  `#${orderId}\n` +
                  `Customer: ${order.customer.name}\n` +
                  `Amount: ₹${order.total.toLocaleString()}\n\n` +
                  `<i>Delivery started.</i>`;

      try { await sendTelegramMessage(msg, 'alert'); } catch (e) { console.warn("Telegram failed", e); }
      
      message = "Marked Out for Delivery";
    }

    else if (action === "mark_delivered") {
      await updateOrderStatus(orderId, "Delivered");
      
      const msg = `✅ <b>ORDER DELIVERED</b>\n` +
                  `#${orderId}\n` +
                  `Revenue: ₹${order.total.toLocaleString()}\n\n` +
                  `<i>Transaction Complete.</i>`;

      try { await sendTelegramMessage(msg, 'alert'); } catch (e) { console.warn("Telegram failed", e); }

      message = "Order Completed";
    }
    else {
        return NextResponse.json({ error: "Invalid Action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message });

  } catch (error: any) {
    // 3. Robust Error Handling (Fixes the {} error)
    console.error("Critical Action Error:", error);
    
    // Safely extract error message even if it's not a standard Error object
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errorMessage || "Unknown Server Error" }, { status: 500 });
  }
}