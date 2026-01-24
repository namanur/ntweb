'use server';

import { query } from '@/lib/db';

interface ERPItemStock {
    item_code: string;
    actual_qty: number;
    projected_qty: number;
}

export async function checkLiveStock(itemCodes: string[]): Promise<Record<string, number>> {
    if (itemCodes.length === 0) return {};

    try {
        console.log(`📡 Checking ERP Stock for ${itemCodes.length} items...`);

        // Fetch from ERPNext via API
        // Using "Bin" doctype or a report
        // For efficiency, we'll try a bulk fetch if possible, or parallel requests

        const erpUrl = process.env.ERP_NEXT_URL;
        const apiKey = process.env.ERP_API_KEY;
        const apiSecret = process.env.ERP_API_SECRET;

        if (!erpUrl || !apiKey || !apiSecret) {
            console.warn("ERP Credentials missing for stock check");
            return {};
        }

        const stockMap: Record<string, number> = {};

        // Parallel fetch for prototype (Simulating bulk endpoint would be better)
        // In real deployment, create a server script in ERPNext to return map
        await Promise.all(itemCodes.map(async (code) => {
            try {
                // Fetch Bin for item
                // filters=[["item_code","=",code]]
                const res = await fetch(`${erpUrl}/api/resource/Bin?filters=[["item_code","=","${encodeURIComponent(code)}"]]&fields=["actual_qty"]&limit_page_length=1`, {
                    headers: {
                        'Authorization': `token ${apiKey}:${apiSecret}`
                    },
                    cache: 'no-store'
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.data && data.data.length > 0) {
                        stockMap[code] = data.data[0].actual_qty;
                    } else {
                        stockMap[code] = 0; // Not in bin = 0
                    }
                }
            } catch (e) {
                console.error(`Failed to fetch stock for ${code}`, e);
            }
        }));

        return stockMap;

    } catch (e) {
        console.error("Stock Check Failed", e);
        return {};
    }
}
