import { NextResponse } from "next/server";
import { findCustomerByPhone } from "@/lib/erp";
import { loginCustomer } from "@/lib/auth";
import { limiters } from "@/lib/security/rate-limit";
import { authSchema } from "@/lib/validations/auth";
import { OTPService } from "@/lib/security/otp";
import { headers } from "next/headers";

export async function POST(req: Request) {
    try {
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for") || "unknown";

        // 1. GLOBAL IP LIMIT (Cheap check first)
        try {
            await limiters.global.consume(ip, 1);
        } catch (e) {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        // 2. PARSE & VALIDATE
        const body = await req.json();
        const validation = authSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid input", details: validation.error.format() },
                { status: 400 }
            );
        }

        const { action, phone } = validation.data;

        // --- REQUEST OTP ---
        if (action === "request") {
            // A. Rate Limit: IP based (Prevent flooding)
            try {
                await limiters.otpIp.consume(ip, 1);
            } catch (e) {
                return NextResponse.json({ error: "Too many OTP requests from this IP." }, { status: 429 });
            }

            // B. Rate Limit: Phone based (Prevent SMS bombing a victim)
            try {
                await limiters.otpPhone.consume(phone, 1);
            } catch (e) {
                return NextResponse.json({ error: "Too many OTP requests for this number." }, { status: 429 });
            }

            // C. Rate Limit: Hard Daily Cap (Cost control)
            try {
                await limiters.otpDay.consume(phone, 1);
            } catch (e) {
                return NextResponse.json({ error: "Daily SMS limit reached." }, { status: 429 });
            }

            console.log(`Checking ERP for customer: ${phone}`);
            const customer = await findCustomerByPhone(phone);

            if (!customer) {
                // Ambiguous error for security vs User experience trade-off
                // Given requirements: "user-based"
                return NextResponse.json({ error: "Phone number not found." }, { status: 404 });
            }

            // D. Generate & Store (Stateful)
            try {
                const otp = await OTPService.generate(phone);

                // In Prod: Send via Twilio/WhatsApp
                console.log("========================================");
                console.log(`🔐 OTP for ${phone}: ${otp}`);
                console.log("========================================");

                return NextResponse.json({
                    success: true,
                    message: "OTP sent to your mobile.",
                    debug_otp: process.env.NODE_ENV === 'development' ? otp : undefined
                });
            } catch (error: any) {
                return NextResponse.json({ error: error.message }, { status: 429 }); // OTPService throws on lockout
            }
        }

        // --- VERIFY OTP ---
        if (action === "verify") {
            const { otp } = validation.data;

            // Rate limit verification attempts? 
            // The OTPService handles logic for "max attempts", but we might want to limit API hits too.
            // limiters.otpIp.consume(ip, 1); // Optional, maybe too aggressive sharing the bucket with requests.

            try {
                const isValid = await OTPService.verify(phone, otp);
                if (isValid) {
                    const customer = await findCustomerByPhone(phone);
                    if (!customer) return NextResponse.json({ error: "Customer record missing." }, { status: 500 });

                    await loginCustomer(customer);
                    return NextResponse.json({ success: true, message: "Login Successful" });
                }
            } catch (error: any) {
                // OTPService throws specific errors for Lockout, Expiry, Invalid
                const status = error.message.includes('locked') ? 429 : 400;
                return NextResponse.json({ error: error.message }, { status });
            }
        }

        return NextResponse.json({ error: "Invalid Action" }, { status: 400 });

    } catch (error: any) {
        console.error("Auth API Error:", error);
        return NextResponse.json({ error: "Authentication Failed" }, { status: 500 });
    }
}
