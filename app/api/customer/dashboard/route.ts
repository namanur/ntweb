import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/auth";
import { getCustomerOrders, getCustomerOutstanding } from "@/lib/erp";

export async function GET() {
    try {
        // 1. Check Session
        const session = await getCustomerSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { customerId } = session;

        // 2. Fetch Data in Parallel
        const [orders, outstanding] = await Promise.all([
            getCustomerOrders(customerId),
            getCustomerOutstanding(customerId)
        ]);

        // 3. Compute Stats
        const activeOrders = orders.filter((o: any) => o.status !== "Completed" && o.status !== "Cancelled").length;
        const totalOrders = orders.length;

        return NextResponse.json({
            orders,
            outstanding,
            stats: {
                totalOrders,
                activeOrders
            }
        });

    } catch (error: any) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
    }
}
