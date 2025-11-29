import { NextResponse } from "next/server";
import { getOrders, updateOrderStatus, saveOrderLocal, Order } from "@/lib/erp";
import { createSalesOrder } from "@/lib/erp"; // We'll reuse this
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: Request) {
  try {
    const { action, orderId } = await req.json();
    const orders = await getOrders();
    const order = orders.find(o => o.id === orderId);

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    let message = "";

    // 1. SYNC TO ERP
    if (action === "sync_erp") {
      await createSalesOrder(order.items, order.customer); // Pushes to ERPNext
      await updateOrderStatus(orderId, "Packed"); // Or "Invoiced"
      message = "Synced to ERP & Marked as Packed";
    }

    // 2. PRINT INVOICE (Marks as Out for Delivery)
    else if (action === "mark_out_for_delivery") {
      await updateOrderStatus(orderId, "Out for Delivery");
      
      // Update the "Last Updated" time so we can track the 24h timer
      // We can repurpose the 'date' field or add a new 'statusDate' field. 
      // For simplicity, let's just assume we check the order date for now or add a note.
      
      await sendTelegramMessage(`🚚 <b>Order Dispatched</b>\n#${orderId}\nCustomer: ${order.customer.name}\nAmount: ₹${order.total}`);
      message = "Marked Out for Delivery";
    }

    // 3. MARK DELIVERED
    else if (action === "mark_delivered") {
      await updateOrderStatus(orderId, "Delivered");
      await sendTelegramMessage(`✅ <b>Order Delivered</b>\n#${orderId}\nRevenue: ₹${order.total}`);
      message = "Order Completed";
    }

    return NextResponse.json({ success: true, message });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}