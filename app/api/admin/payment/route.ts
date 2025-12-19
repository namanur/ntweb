import { NextResponse } from "next/server";
import { createPaymentEntry } from "@/lib/erp";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = await createPaymentEntry(body);
        return NextResponse.json({ success: true, id: result.name });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Payment Failed" }, { status: 500 });
    }
}
