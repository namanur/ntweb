import { NextResponse } from "next/server";
import { getCustomerOrders, getCustomerOutstanding } from "@/lib/erp";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const customerId = decodeURIComponent(id);

        // Fetch in parallel for speed
        const [orders, outstanding] = await Promise.all([
            getCustomerOrders(customerId),
            getCustomerOutstanding(customerId)
        ]);

        return NextResponse.json({
            orders: orders || [],
            outstanding: outstanding || 0
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch customer data" }, { status: 500 });
    }
}
