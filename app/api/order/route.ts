import { NextResponse } from "next/server";
import { saveOrderLocal, Order, createSalesOrder, deductInventory } from "@/lib/erp"; // <--- Import deductInventory
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cart, customer } = body;

    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    let isSynced = false;

    // 1. Prepare Order Object
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

    // 2. AUTO-SYNC ATTEMPT
    try {
        console.log("Auto-syncing to ERP...");
        await createSalesOrder(newOrder.items, newOrder.customer);
        newOrder.erp_synced = true;
        isSynced = true;
    } catch (erpError) {
        console.warn("Auto-sync failed (ERP might be offline). Saving locally only.");
    }
    
    // 3. DEDUCT INVENTORY (NEW DEDUCTION LOGIC)
    await deductInventory(newOrder.items);


    // 4. Save Locally
    await saveOrderLocal(newOrder);

    // 5. Send Telegram Notification
    const itemsList = newOrder.items
      .map(i => `• ${i.item_name} (x${i.qty})`)
      .join("\n");

    const syncStatusIcon = isSynced ? "✅ ERP Synced" : "⚠️ Local Only (ERP Fail)";

    const msg = `🛒 <b>NEW ORDER RECEIVED</b>\n` +
                `🆔 <b>ID:</b> ${newOrder.id}\n` +
                `👤 <b>Customer:</b> ${newOrder.customer.name}\n` +
                `📞 <b>Phone:</b> ${newOrder.customer.phone}\n` +
                `📍 <b>Address:</b> ${newOrder.customer.address}\n` +
                `📝 <b>Note:</b> ${newOrder.customer.notes}\n\n` +
                `📦 <b>Items:</b>\n${itemsList}\n\n` +
                `💰 <b>Total: ₹${newOrder.total.toLocaleString()}</b>\n` +
                `🔄 <b>Status:</b> ${syncStatusIcon}`;
                
    try {
        await sendTelegramMessage(msg, 'order'); 
    } catch (e) {
        console.error("Telegram Failed:", e);
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
  const orders = await getOrders();
  return NextResponse.json(orders);
}