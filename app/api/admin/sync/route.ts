import { NextResponse } from 'next/server';
import { sync } from '@/lib/erp/sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes timeout for Vercel

import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
    // Strict Auth Check
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

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
