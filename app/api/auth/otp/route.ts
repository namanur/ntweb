import { NextResponse } from "next/server";
import { findCustomerByPhone } from "@/lib/erp";
import { encrypt, decrypt, loginCustomer } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const { action, phone, otp } = await req.json();

        if (!phone) {
            return NextResponse.json({ error: "Phone Number is required" }, { status: 400 });
        }

        // --- REQUEST OTP ---
        if (action === "request") {
            console.log(`Checking ERP for customer: ${phone}`);
            const customer = await findCustomerByPhone(phone);

            // START: DEMO MODE (Allow login even if not found in ERP for testing if needed? No, stick to requirements)
            // STRICT MODE: Only existing customers
            if (!customer) {
                return NextResponse.json({ error: "Phone number not found in our records." }, { status: 404 });
            }

            // Generate OTP
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

            // In Prod: Send via Twilio/WhatsApp
            console.log("========================================");
            console.log(`🔐 OTP for ${phone}: ${generatedOtp}`);
            console.log("========================================");

            // Store OTP in a short-lived (5 min) secure cookie
            const expires = new Date(Date.now() + 5 * 60 * 1000);
            const otpSession = await encrypt({ phone, otp: generatedOtp, expires });

            (await cookies()).set("otp_pending", otpSession, {
                expires,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
            });

            return NextResponse.json({
                success: true,
                message: "OTP sent to your mobile.",
                debug_otp: process.env.NODE_ENV === 'development' ? generatedOtp : undefined // Helper for dev
            });
        }

        // --- VERIFY OTP ---
        if (action === "verify") {
            if (!otp) return NextResponse.json({ error: "OTP is required" }, { status: 400 });

            const cookieStore = await cookies();
            const otpSessionEncrypted = cookieStore.get("otp_pending")?.value;

            if (!otpSessionEncrypted) {
                return NextResponse.json({ error: "OTP expired. Please request again." }, { status: 400 });
            }

            const payload = await decrypt(otpSessionEncrypted);

            if (!payload || payload.phone !== phone) {
                return NextResponse.json({ error: "Invalid Session. Retry." }, { status: 400 });
            }

            if (payload.otp !== otp) {
                return NextResponse.json({ error: "Incorrect OTP." }, { status: 400 });
            }

            // OTP Valid! Fetch customer again to get full details for session
            const customer = await findCustomerByPhone(phone);
            if (!customer) return NextResponse.json({ error: "Customer record missing." }, { status: 500 });

            await loginCustomer(customer);

            // Clear OTP cookie
            cookieStore.delete("otp_pending");

            return NextResponse.json({ success: true, message: "Login Successful" });
        }

        return NextResponse.json({ error: "Invalid Action" }, { status: 400 });

    } catch (error: any) {
        console.error("Auth API Error:", error);
        return NextResponse.json({ error: "Authentication Failed" }, { status: 500 });
    }
}
