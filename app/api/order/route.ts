import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cart, customer } = body;

    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // 1. Generate a Simple Web ID
    const orderId = `WEB-${Date.now().toString().slice(-6)}`;

    // 2. Calculate Total
    const total = cart.reduce((sum: number, item: any) => sum + (item.standard_rate * item.qty), 0);
    
    // 3. Format Item List
    const itemLines = cart.map((item: any) => `• ${item.item_name} (x${item.qty})`).join("\n");

    // 4. Format Customer Details
    const addressLine = customer.address ? `\n📍 *Addr:* ${customer.address}` : "";
    const gstLine = customer.gst ? `\n🏢 *GST:* ${customer.gst}` : "";
    const noteLine = customer.note ? `\n📝 *Note:* ${customer.note}` : "";

    // 5. Construct the Message
    const message = `
📦 *NEW ORDER: ${orderId}*
------------------
👤 *Name:* ${customer.name}
📞 *Phone:* ${customer.phone}
${addressLine}${gstLine}${noteLine}

🛒 *Items:*
${itemLines}

💰 *Total: ₹${total}*
(Pending Manual Bill 📝)
`;

    // 6. Send to Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (botToken && chatId) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "Markdown" }),
      });
    } else {
      console.error("❌ Telegram Keys Missing in Vercel");
    }

    return NextResponse.json({ success: true, orderId });
    
  } catch (error) {
    console.error("Order Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
