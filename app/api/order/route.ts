import { NextResponse } from "next/server";
import axios from "axios";

// 1. Setup ERP Connection Helper
const getErpClient = () => {
  return axios.create({
    baseURL: process.env.ERP_NEXT_URL,
    headers: {
      Authorization: `token ${process.env.ERP_API_KEY}:${process.env.ERP_API_SECRET}`,
      "Content-Type": "application/json",
    },
  });
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cart, customer } = body;
    const client = getErpClient();

    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // --- STEP 1: FIND OR CREATE CUSTOMER ---
    let customerName = ""; // This will hold the unique ID (e.g., "CUST-0001" or "Ram Nandan")

    try {
      // A. Search by Phone Number
      const searchRes = await client.get(`/api/resource/Customer`, {
        params: {
          filters: `[["mobile_no", "=", "${customer.phone}"]]`,
          fields: '["name", "customer_name"]'
        }
      });

      if (searchRes.data.data && searchRes.data.data.length > 0) {
        // Found existing customer! Use their ID.
        customerName = searchRes.data.data[0].name;
        console.log(`✅ Found existing customer: ${customerName}`);
      } else {
        // Not found. Create new customer.
        console.log("Creating new customer...");
        const createRes = await client.post('/api/resource/Customer', {
          customer_name: customer.name,
          customer_type: "Individual",
          customer_group: "All Customer Groups",
          territory: "All Territories",
          mobile_no: customer.phone, // Save phone for next time
          email_id: "", // Optional
        });
        customerName = createRes.data.data.name;
        console.log(`✅ Created new customer: ${customerName}`);
      }
    } catch (err) {
      console.error("❌ Error handling customer:", err);
      // Fallback: If this fails, we can't create an order nicely, but let's try to proceed or fail.
      return NextResponse.json({ error: "Failed to create customer profile" }, { status: 500 });
    }

    // --- STEP 2: CREATE SALES ORDER ---
    let orderId = "PENDING";
    
    try {
      // Format items for ERPNext
      const salesOrderItems = cart.map((item: any) => ({
        item_code: item.item_code,
        qty: item.qty,
        rate: item.standard_rate,
        delivery_date: new Date().toISOString().split('T')[0] // Set delivery to Today
      }));

      const orderRes = await client.post('/api/resource/Sales Order', {
        customer: customerName,
        transaction_date: new Date().toISOString().split('T')[0],
        delivery_date: new Date().toISOString().split('T')[0],
        items: salesOrderItems,
        // Optional: Add the note if present
        ...(customer.note ? { set_warehouse: "Stores - NT", remarks: customer.note } : {})
      });

      orderId = orderRes.data.data.name; // e.g., SO-2025-0001
      console.log(`✅ Created Sales Order: ${orderId}`);

    } catch (err) {
      console.error("❌ Error creating Sales Order:", err);
      return NextResponse.json({ error: "Failed to generate Sales Order" }, { status: 500 });
    }

    // --- STEP 3: SEND TELEGRAM NOTIFICATION ---
    const total = cart.reduce((sum: number, item: any) => sum + (item.standard_rate * item.qty), 0);
    const itemLines = cart.map((item: any) => `• ${item.item_name} (x${item.qty})`).join("\n");

    // Check optional fields
    const addressLine = customer.address ? `\n📍 Address: ${customer.address}` : "";
    const gstLine = customer.gst ? `\n🏢 GST: ${customer.gst}` : "";
    const noteLine = customer.note ? `\n📝 Note: ${customer.note}` : "";

    const message = `
📦 *NEW ORDER: ${orderId}*
------------------
👤 *Customer:* ${customer.name} (${customerName})
📞 *Phone:* ${customer.phone}${addressLine}${gstLine}${noteLine}

🛒 *Items:*
${itemLines}

💰 *Total: ₹${total}*
(Saved in ERPNext ✅)
`;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (botToken && chatId) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "Markdown" }),
      });
    }

    return NextResponse.json({ success: true, orderId });
    
  } catch (error) {
    console.error("Global Order Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}