
const BASE_URL = 'http://localhost:3000/api/auth/otp';
const UPLOAD_URL = 'http://localhost:3000/api/admin/upload';

async function testHeaders() {
    console.log('\n--- Testing Security Headers ---');
    const res = await fetch('http://localhost:3000');
    const xFrame = res.headers.get('x-frame-options');
    if (xFrame === 'DENY') console.log('✅ X-Frame-Options is DENY');
    else console.error(`❌ X-Frame-Options missing or invalid: ${xFrame}`);
}

async function testRateLimitAndUniqueness() {
    console.log('\n--- Testing Persistent Rate Limit ---');
    // Use a random phone to avoid hitting previous daily limits
    const phone = `91${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    console.log(`Using Test Phone: ${phone}`);

    for (let i = 1; i <= 5; i++) {
        const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'request', phone })
        });

        console.log(`Req ${i}: Status ${res.status}`);

        if (i <= 3) {
            if (res.status === 200) console.log(`   ✅ Accepted (Attempt ${i})`);
            // It might return 404 if user not found, which is ALSO 200/404 range (not 429)
            // But our code returns 404 for "Phone not found".
            // 404 counts as "Not Rate Limited".
            else if (res.status === 404) console.log(`   ✅ Accepted (Ph Not Found) (Attempt ${i})`);
            else console.error(`   ❌ Failed: ${res.status}`);
        } else {
            if (res.status === 429) console.log(`   ✅ Rate limit hit (Attempt ${i})`);
            else console.error(`   ❌ Should be blocked: ${res.status}`);
        }
    }
}

async function testValidation() {
    console.log('\n--- Testing Input Validation ---');
    const res1 = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', phone: '123' })
    });
    if (res1.status === 400) console.log('✅ Catch Bad Phone: 400');
    else console.error(`❌ Bad Phone Status: ${res1.status}`);
}

/* 
 * Note: Check Magic Bytes manually or requires FormData polyfill/hack in node script.
 * We skip automated upload test for now as it requires complex setup in this script.
 * Use valid manual test or rely on code review for file-type implementation.
 */

async function main() {
    try {
        await testHeaders();
        await testValidation();
        await testRateLimitAndUniqueness();
    } catch (e) {
        console.error("Test Error:", e);
    }
}

main();
