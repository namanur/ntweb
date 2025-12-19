const fetch = require('node-fetch');

async function test() {
    console.log("Testing Print Notification API...");

    // We need the local dev server running for this, OR we can test the logic by invoking the function directly if we were in a TS environment.
    // Since we are in JS script, let's assuming we are testing against localhost:3000
    // BUT the user might not have port 3000 open or mapped. 
    // SAFEST BET: Create a standalone script that imports the logic like we did for Telegram.

    // Let's do the Standalone "Mock" approach to test the logic without needing a running server.
    // Actually, we can just reuse the telegram logic directly to verify the message format, 
    // since the API just calls that.

    // Better yet, let's try to hit the actual API if the dev server is running?
    // The user has `npm run dev` running.

    try {
        const res = await fetch('http://localhost:3000/api/order/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: 'TEST-PRINT-001',
                status: 'Out for Delivery (Test)'
            })
        });

        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", data);

    } catch (e) {
        console.error("Failed to connect to localhost:3000. Is the server running?");
        console.error(e.message);
    }
}

test();
