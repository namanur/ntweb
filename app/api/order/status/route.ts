import { NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/erp";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: Request) {
    try {
        const { orderId, status } = await req.json();

        if (!orderId || !status) {
            return NextResponse.json({ error: "Missing orderId or status" }, { status: 400 });
        }

        console.log(`Updating Order ${orderId} status to: ${status}`);

        // 1. Update Local Status
        try {
            await updateOrderStatus(orderId, status);
        } catch (e) {
            console.warn("Failed to update local status:", e);
        }

        // 2. Send Telegram Alert
        // We use 'alert' type so it goes to the delivery/update channel
        const msg = `🚀 <b>ORDER UPDATE</b>\n` +
            `🆔 <b>ID:</b> ${orderId}\n` +
            `🔄 <b>New Status:</b> ${status}\n\n` +
            `<i>(This message was triggered automatically)</i>`;

        await sendTelegramMessage(msg, 'alert');

        return NextResponse.json({ success: true, message: "Status updated" });

    } catch (error: any) {
        console.error("Status Update Failed:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
