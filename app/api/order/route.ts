import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cart, customer } = body;

    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // 1. Calculate Total
    const total = cart.reduce((sum: number, item: any) => sum + (item.standard_rate * item.qty), 0);

    // 2. Format Item List
    const itemLines = cart.map((item: any) => 
      `• ${item.item_name} (x${item.qty}) - ₹${item.standard_rate * item.qty}`
    ).join("\n");

    // 3. Format Customer Details (✅ UPDATED LOGIC)
    let customerSection = `👤 *Customer Details:*
Name: ${customer.name}
Phone: ${customer.phone}`;

    // Only add these lines if the user actually filled them out
    if (customer.address && customer.address.trim() !== "") {
      customerSection += `\n📍 *Address:* ${customer.address}`;
    }
    
    if (customer.gst && customer.gst.trim() !== "") {
      customerSection += `\n🏢 *GST:* ${customer.gst}`;
    }

    if (customer.note && customer.note.trim() !== "") {
      customerSection += `\n📝 *Note:* ${customer.note}`;
    }

    // 4. Construct Final Message
    const message = `
📦 *NEW ORDER RECEIVED*
------------------
${customerSection}

🛒 *Order Items:*
${itemLines}

💰 *Total Value: ₹${total}*
(Sent via Nandan Traders Web)
`;

    // 5. Send to Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!botToken || !chatId) {
        console.error("Telegram keys missing");
        return NextResponse.json({ error: "Server Config Error" }, { status: 500 });
    }

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown", // Allows bolding
      }),
    });

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Order Error:", error);
    return NextResponse.json({ error: "Failed to process order" }, { status: 500 });
  }
}