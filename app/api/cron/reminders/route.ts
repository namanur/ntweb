import { NextResponse } from "next/server";
import { getOrders } from "@/lib/erp";
import { sendTelegramMessage } from "@/lib/telegram";

export async function GET() {
  try {
    const orders = await getOrders();
    const now = new Date().getTime();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    const stuckOrders = orders.filter(o => 
      o.status === "Out for Delivery" && 
      (now - new Date(o.date).getTime() > ONE_DAY)
    );

    if (stuckOrders.length > 0) {
      let msg = `🚨 <b>DELIVERY ALERT</b> 🚨\nThe following orders are pending > 24hrs:\n\n`;
      stuckOrders.forEach(o => {
        msg += `• <b>#${o.id}</b> (${o.customer.name}) - ₹${o.total}\n`;
      });
      msg += `\nPlease update status to Delivered!`;
      
      // ✨ Uses ALERT BOT because type is 'alert'
      await sendTelegramMessage(msg, 'alert'); 
      return NextResponse.json({ sent: true, count: stuckOrders.length });
    }

    return NextResponse.json({ sent: false, message: "No pending deliveries." });

  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}