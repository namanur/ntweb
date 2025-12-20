import { NextResponse } from 'next/server';
import { sync } from '@/lib/erp/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes timeout for Vercel

export async function POST(request: Request) {
    try {
        console.log("🔄 Manual sync triggered via API");
        const stats = await sync();
        return NextResponse.json({ success: true, message: "Sync completed successfully", stats });
    } catch (error: any) {
        console.error("❌ Manual sync failed:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Sync failed" },
            { status: 500 }
        );
    }
}
