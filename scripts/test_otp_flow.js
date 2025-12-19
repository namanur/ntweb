async function test() {
    console.log("🔐 Testing OTP Flow...");
    const baseUrl = 'http://localhost:3000/api/auth/otp';
    const testPhone = "9876543210"; // Known customer from previous test

    try {
        // 1. Request OTP
        console.log(`\n1. Requesting OTP for ${testPhone}...`);
        const reqOtp = await fetch(baseUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'request', phone: testPhone })
        });
        const reqData = await reqOtp.json();
        console.log("Response:", reqData);

        if (!reqData.success) {
            console.error("❌ Request Failed");
            return;
        }

        const otp = reqData.debug_otp;
        console.log(`🔑 Received Debug OTP: ${otp}`);

        if (!otp) {
            console.warn("⚠️ No debug OTP returned (Are you in production?). Cannot proceed identifying OTP.");
            return;
        }

        // 2. Verify OTP (With Cookie!)
        // Fetch in Node doesn't automatically handle cookies unless we use a cookie jar, 
        // but for a quick test we might fail here because the cookie isn't passed back.
        // HACK: We can manually grab the cookie from the response headers and send it back.

        const cookieHeader = reqOtp.headers.get('set-cookie');
        console.log("🍪 Set-Cookie:", cookieHeader);

        console.log(`\n2. Verifying OTP ${otp}...`);
        const verifyOtp = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Cookie': cookieHeader || ""
            },
            body: JSON.stringify({ action: 'verify', phone: testPhone, otp })
        });
        const verifyData = await verifyOtp.json();
        console.log("Response:", verifyData);

        if (verifyData.success) {
            console.log("✅ OTP Verification SUCCESS");
        } else {
            console.error("❌ OTP Verification FAILED");
        }

    } catch (e) {
        console.error("Test Failed:", e);
    }
}

test();
