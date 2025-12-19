const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const { sendTelegramMessage } = require('../lib/telegram');

async function test() {
    console.log("--- Testing Telegram Split ---");

    console.log("1. Sending Order Message (Expected: Order Group)");
    await sendTelegramMessage("🧪 Test Message: <b>New Order</b>", 'order');

    console.log("\n2. Sending Delivery Alert (Expected: Delivery Group)");
    await sendTelegramMessage("🧪 Test Message: <b>Out for Delivery</b>", 'alert');

    console.log("\nDone. Please check your generic Telegram groups.");
}

test();
