'use server';

interface SalesOrderItem {
    item_code: string;
    qty: number;
    rate: number;
    delivery_date: string;
}

export async function createERPSalesOrder(
    erpCustomerId: string,
    items: SalesOrderItem[],
    webOrderNumber: string
): Promise<{ success: boolean; id?: string; message?: string }> {

    const erpUrl = process.env.ERP_NEXT_URL;
    const apiKey = process.env.ERP_API_KEY;
    const apiSecret = process.env.ERP_API_SECRET;

    if (!erpUrl || !apiKey || !apiSecret) {
        return { success: false, message: "ERP Config Missing" };
    }

    // Construct Payload
    const payload = {
        doctype: "Sales Order",
        customer: erpCustomerId,
        transaction_date: new Date().toISOString().split('T')[0],
        delivery_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // +1 Day
        po_no: webOrderNumber, // Link to Web Order
        items: items.map(i => ({
            item_code: i.item_code,
            qty: i.qty,
            rate: i.rate,
            delivery_date: i.delivery_date
        })),
        company: "Nandan Traders" // Or from env
    };

    try {
        console.log("📤 Syncing to ERPNext:", webOrderNumber);

        const res = await fetch(`${erpUrl}/api/resource/Sales Order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `token ${apiKey}:${apiSecret}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok && data.data) {
            console.log("✅ Sales Order Created:", data.data.name);
            return { success: true, id: data.data.name };
        } else {
            console.error("❌ ERP Error:", JSON.stringify(data));
            return { success: false, message: data.exception || "ERP Sync Failed" };
        }

    } catch (e: any) {
        console.error("ERP Network Error:", e.message);
        return { success: false, message: "Network Error" };
    }
}
