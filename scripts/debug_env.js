const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env
const envConfig = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env')));
for (const k in envConfig) {
    process.env[k] = envConfig[k]
}

console.log("--- Env Debug ---");
console.log("ORDER_BOT_TOKEN:", process.env.TELEGRAM_ORDER_BOT_TOKEN ? "SET" : "MISSING");
console.log("ALERT_BOT_TOKEN:", process.env.TELEGRAM_ALERT_BOT_TOKEN ? "SET" : "MISSING");
console.log("ORDER_CHAT_ID:", process.env.TELEGRAM_ORDER_CHAT_ID);
console.log("DELIVERY_CHAT_ID:", process.env.TELEGRAM_DELIVERY_CHAT_ID);
