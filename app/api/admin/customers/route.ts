import { NextResponse } from "next/server";
import { getAllCustomers } from "@/lib/erp";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || undefined;

        const customers = await getAllCustomers(search);
        return NextResponse.json(customers);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
    }
}
