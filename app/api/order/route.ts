import { NextResponse } from "next/server";
import axios from "axios";

// Helper to get ERP Client
const getErpClient = () => {
  return axios.create({
    baseURL: process.env.ERP_NEXT_URL,
    headers: {
      Authorization: `token ${process.env.ERP_API_KEY}:${process.env.ERP_API_SECRET}`,
      "Content-Type": "application/json",
    },
    timeout: 3000, // Give up after 3 seconds if laptop is offline
  });
};

export async function POST(req: Request) {
  try {
    console.log("1. Order Received. Processing..."); // Debug Log

    const body = await req.json();
    const { cart, customer } = body;

    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // --- DEFAULT STATE (Assume Offline) ---
    let orderId = `WEB-${Date.now().toString().slice(-6)}`; // Temporary ID
    let erpStatus = "❌ ERP Offline (Laptop not reachable)";

    // --- TRY CONNECTING TO ERPNEXT (Optional) ---
    try {
      console.log("2. Attempting ERP Connection..."); // Debug Log
      const client = getErpClient();
      let customerName = "";

      // 1. Find/Create Customer
      const searchRes = await client.get(`/api/resource/Customer`, {
        params: { filters: `[["mobile_no", "=", "${customer.phone}"]]`, fields: '["name"]' }
      });

      if (searchRes.data.data?.length > 0) {
        customerName = searchRes.data.data[0].name;
      } else {
        const createRes = await client.post('/api/resource/Customer', {
          customer_name: customer.name,
          customer_type: "Individual",
          customer_group: "All Customer Groups",
          territory: "All Territories",
          mobile_no: customer.phone,
        });
        customerName = createRes.data.data.name;
      }

      // 2. Create Sales Order
      const salesOrderItems = cart.map((item: any) => ({
        item_code: item.item_code,
        qty: item.qty,
        rate: item.standard_rate,
        delivery_date: new Date().toISOString().split('T')[0]
      }));

      const orderRes = await client.post('/api/resource/Sales Order', {
        customer: customerName,
        transaction_date: new Date().toISOString().split('T')[0],
        delivery_date: new Date().toISOString().split('T')[0],
        items: salesOrderItems,
        ...(customer.note ? { remarks: customer.note } : {})
      });

      orderId = orderRes.data.data.name;
      erpStatus = "✅ Saved in ERPNext";
      console.log("3. ERP Success. Order ID:", orderId); // Debug Log

    } catch (erpError) {
      console.warn("⚠️ ERPNext Connection Failed. Proceeding with Telegram only.");
      // console.error(erpError); // Uncomment to see full error if needed
    }

    // --- STEP 3: SEND TELEGRAM NOTIFICATION (Critical) ---
    const total = cart.reduce((sum: number, item: any) => sum + (item.standard_rate * item.qty), 0);
    const itemLines = cart.map((item: any) => `• ${item.item_name} (x${item.qty})`).join("\n");

    const message = `
📦 *NEW ORDER: ${orderId}*
------------------
👤 *Name:* ${customer.name}
📞 *Phone:* ${customer.phone}
${customer.address ? `📍 *Addr:* ${customer.address}` : ""}
${customer.note ? `📝 *Note:* ${customer.note}` : ""}

🛒 *Items:*
${itemLines}

💰 *Total: ₹${total}*
Status: ${erpStatus}
`;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    console.log("4. Checking Telegram Keys..."); // Debug Log
    console.log("   - Bot Token:", botToken ? "Found" : "MISSING");
    console.log("   - Chat ID:", chatId ? "Found" : "MISSING");

    if (botToken && chatId) {
      console.log("5. Sending to Telegram...");
      const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "Markdown" }),
      });
      const tgData = await tgRes.json();
      console.log("6. Telegram Response:", tgData);
    } else {
      console.error("❌ TELEGRAM KEYS MISSING IN VERCEL");
    }

    return NextResponse.json({ success: true, orderId });
    
  } catch (error) {
    console.error("Global Order Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
