import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { checkERPConnection } from "@/lib/erp";

export async function POST(req: Request) {
  try {
    const { target } = await req.json();

    if (target === 'telegram') {
      await sendTelegramMessage("🔔 <b>Test Notification</b>\nIf you see this, your Telegram Bot is connected!", 'alert');
      return NextResponse.json({ success: true, message: "Test Message Sent" });
    }

    if (target === 'erp') {
      const isConnected = await checkERPConnection();
      if (isConnected) {
        return NextResponse.json({ success: true, message: "ERPNext is Online" });
      } else {
        return NextResponse.json({ success: false, message: "ERPNext Connection Failed (Check URL/VPN)" }, { status: 503 });
      }
    }

    return NextResponse.json({ error: "Invalid Target" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}