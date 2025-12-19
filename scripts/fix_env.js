const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
let content = fs.readFileSync(envPath, 'utf-8');

// Fix missing newline issue
content = content.replace('ERP_API_SECRET= 70472235319b1e6TELEGRAM', 'ERP_API_SECRET= 70472235319b1e6\nTELEGRAM');

fs.writeFileSync(envPath, content);
console.log("Fixed .env newlines");
