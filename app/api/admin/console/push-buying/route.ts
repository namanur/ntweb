import { NextResponse } from 'next/server';
import { ERPFetcher } from '@/lib/erp/fetcher';
import fs from 'fs';
import path from 'path';

// Initialize ERP Fetcher
const erp = new ERPFetcher(
    process.env.ERP_NEXT_URL || '',
    process.env.ERP_API_KEY || '',
    process.env.ERP_API_SECRET || ''
);

const COOLDOWN_FILE = path.join(process.cwd(), 'data', 'console-meta.json');
const COOLDOWN_HOURS = 12;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { priceUpdates, stockUpdates } = body;

        // 1. Check Cooldown
        if (fs.existsSync(COOLDOWN_FILE)) {
            const meta = JSON.parse(fs.readFileSync(COOLDOWN_FILE, 'utf-8'));
            if (meta.lastPush) {
                const lastPush = new Date(meta.lastPush).getTime();
                const now = Date.now();
                const diffHours = (now - lastPush) / (1000 * 60 * 60);

                if (diffHours < COOLDOWN_HOURS) {
                    return NextResponse.json({
                        success: false,
                        message: `Cooldown active. Try again in ${(COOLDOWN_HOURS - diffHours).toFixed(1)} hours.`
                    }, { status: 429 });
                }
            }
        }

        // 2. Validate Input
        if (!Array.isArray(priceUpdates) || !Array.isArray(stockUpdates)) {
            return NextResponse.json({ success: false, message: "Invalid payload format" }, { status: 400 });
        }

        console.log(`[Buying Console] Processing ${priceUpdates.length} price updates and ${stockUpdates.length} stock updates...`);

        // 3. Execute Updates
        let priceResult = { success: 0, failed: 0, errors: [] as string[] };
        if (priceUpdates.length > 0) {
            priceResult = await erp.updateBuyingPrices(priceUpdates);
        }

        let stockResult: { success: boolean; docName: string | null; error: string | null } = { success: true, docName: null, error: null };
        if (stockUpdates.length > 0) {
            // Stock Reconciliation is all-or-nothing
            const res = await erp.updateStock(stockUpdates);
            stockResult = { success: res.success, docName: res.docName || null, error: res.error || null };
        }

        // 4. Update Cooldown & Meta
        if ((priceResult.success > 0 || stockResult.success) && !stockResult.error) {
            let meta: any = {};
            if (fs.existsSync(COOLDOWN_FILE)) {
                meta = JSON.parse(fs.readFileSync(COOLDOWN_FILE, 'utf-8'));
            }
            meta.lastPushedAt = new Date().toISOString();
            // We do NOT clear lastPulledAt, as the snapshot is technically still the base.
            // However, after a push, the snapshot is stale relative to ERP.
            // Advanced: We could update the snapshot here, but for now we rely on the user to Pull again later.

            if (!fs.existsSync(path.dirname(COOLDOWN_FILE))) {
                fs.mkdirSync(path.dirname(COOLDOWN_FILE), { recursive: true });
            }
            fs.writeFileSync(COOLDOWN_FILE, JSON.stringify(meta, null, 2));
        }

        return NextResponse.json({
            success: true,
            priceResult,
            stockResult,
            meta: { cooldownSet: true, timestamp: new Date().toISOString() }
        });

    } catch (error: any) {
        console.error('API Error:', error.message);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
