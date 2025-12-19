import { NextResponse } from "next/server";
import { getCustomerSession, getSession } from "@/lib/auth";

export async function GET() {
    // 1. Check Customer Session
    const customer = await getCustomerSession();
    if (customer) {
        return NextResponse.json({
            isLoggedIn: true,
            role: 'customer',
            details: {
                name: customer.customerName,
                phone: customer.phone
            }
        });
    }

    // 2. Check Admin Session
    const admin = await getSession();
    if (admin) {
        return NextResponse.json({
            isLoggedIn: true,
            role: 'admin'
        });
    }

    return NextResponse.json({ isLoggedIn: false });
}
