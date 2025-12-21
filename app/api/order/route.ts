import { NextResponse } from "next/server";
import { saveOrderLocal, Order, createSalesOrder, deductInventory } from "@/lib/erp";
import { sendTelegramMessage } from "@/lib/telegram";

import { validateCart, getEffectiveRate, calculateOrderTotal, CartItem } from "@/lib/shop-rules";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cart, customer } = body;

    const isPublicSite = process.env.NEXT_PUBLIC_APP_MODE === 'public' || !!process.env.VERCEL;

    // ✅ VALIDATION: Use shared validation rules
    const validationErrors = validateCart(cart);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors[0] }, { status: 400 });
    }

    // ✅ CALCULATION: Use shared pricing rules
    const items = cart.map((item: CartItem) => {
      const rate = getEffectiveRate(item.qty, item.standard_rate);
      return {
        item_code: item.item_code,
        item_name: item.item_name || item.item_code, // Fallback if name missing
        qty: item.qty,
        rate: rate,
        original_rate: item.standard_rate
      };
    });

    const total = calculateOrderTotal(items as CartItem[]);

    const newOrder: Order = {
      id: "ORD-" + Date.now().toString().slice(-6),
      customer: {
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        gst: customer.gst || "N/A",
        notes: customer.note || "None"
      },
      items: items,
      total: total,
      status: "Pending",
      date: new Date().toISOString(),
      erp_synced: false
    };

    let syncStatus = "❌ Not Synced (Offline)";

    try {
      console.log("Attempting ERP Sync...");
      await createSalesOrder(newOrder.items, newOrder.customer);
      newOrder.erp_synced = true;
      syncStatus = "✅ Synced to ERP";
    } catch (erpError) {
      console.warn("ERP Sync Failed (Laptop likely offline).");
      syncStatus = "⚠️ ERP Offline (Saved to Chat)";
    }

    // 7. Send Telegram Notification
    try {
      console.log("Sending Telegram Notification...");
      const itemsList = newOrder.items
        .map((i: any) => `• ${i.item_name} (x${i.qty}) - ₹${i.rate.toFixed(2)}`)
        .join("\n");

      const msg = `🛒 <b>NEW ORDER (${isPublicSite ? 'PUBLIC' : 'LOCAL'})</b>\n` +
        `🆔 <b>ID:</b> ${newOrder.id}\n` +
        `👤 <b>Customer:</b> ${newOrder.customer.name}\n` +
        `📞 <b>Phone:</b> ${newOrder.customer.phone}\n` +
        `📍 <b>Address:</b> ${newOrder.customer.address}\n\n` +
        `📦 <b>Items:</b>\n${itemsList}\n\n` +
        `💰 <b>Total: ₹${newOrder.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b>\n` +
        `🔄 <b>Status:</b> ${syncStatus}`;

      await sendTelegramMessage(msg, 'order');
      console.log("Telegram Notification Sent.");
    } catch (telegramError) {
      console.error("❌ Telegram Notification Failed:", telegramError);
      // Don't fail the order just because telegram failed, but log it.
    }

    if (!isPublicSite) {
      try {
        console.log("Saving Order Locally...");
        await saveOrderLocal(newOrder);
        console.log("Order Saved Locally.");
      } catch (saveError) {
        console.error("❌ Failed to Save Order Locally:", saveError);
        throw new Error("Local Save Failed"); // This IS critical for local ops
      }

      try {
        console.log("Deducting Inventory...");
        await deductInventory(newOrder.items);
        console.log("Inventory Deducted.");
      } catch (inventoryError) {
        console.error("❌ Failed to Deduct Inventory:", inventoryError);
        // Non-critical (?)
      }
    }

    return NextResponse.json({
      success: true,
      orderId: newOrder.id,
      message: "Order placed successfully!"
    });

  } catch (error: any) {
    console.error("🔥 CRITICAL ORDER API ERROR:", error);
    return NextResponse.json({
      error: "Failed to place order",
      details: error.message || "Unknown Error"
    }, { status: 500 });
  }
}

import { getOrders } from "@/lib/erp";
export async function GET() {
  if (process.env.NEXT_PUBLIC_APP_MODE === 'public') {
    return NextResponse.json([]);
  }
  const orders = await getOrders();
  return NextResponse.json(orders);
}