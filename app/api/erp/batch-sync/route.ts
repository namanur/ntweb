import { NextResponse } from 'next/server';
import { ERPFetcher } from '@/lib/erp/fetcher';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Load env vars
const ERP_URL = process.env.ERP_NEXT_URL || 'http://127.0.0.1:8080';
const API_KEY = process.env.ERP_API_KEY || '';
const API_SECRET = process.env.ERP_API_SECRET || '';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { sync_id, changes } = body;

        if (!changes || !Array.isArray(changes) || changes.length === 0) {
            return NextResponse.json({ success: false, message: "No changes provided" }, { status: 400 });
        }

        console.log(`[BatchSync] Processing ${changes.length} updates (Sync ID: ${sync_id})`);

        const fetcher = new ERPFetcher(ERP_URL, API_KEY, API_SECRET);

        // 1. Validate Connection
        const connected = await fetcher.testConnection();
        if (!connected) {
            return NextResponse.json({ success: false, message: "Could not connect to ERPNext" }, { status: 503 });
        }

        // 2. Execute Updates
        // Note: fetcher.updatePrices needs to be implemented in Step 3
        const result = await fetcher.updatePrices(changes);

        return NextResponse.json({
            success: true,
            message: "Batch update processed",
            details: result
        });

    } catch (error: any) {
        console.error("[BatchSync] Error:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
