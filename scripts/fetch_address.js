const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Read .env manually
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
    console.error('.env file not found');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    const key = parts[0];
    const value = parts.slice(1).join('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const ERP_URL = env.ERP_NEXT_URL || "http://127.0.0.1:8080";
const ERP_API_KEY = env.ERP_API_KEY;
const ERP_API_SECRET = env.ERP_API_SECRET;

// Debug: Print keys (masked)
console.log(`Using ERP_URL: ${ERP_URL}`);
console.log(`Using API Key: ${ERP_API_KEY ? 'Set' : 'Missing'}`);
console.log(`Using API Secret: ${ERP_API_SECRET ? 'Set' : 'Missing'}`);

if (!ERP_API_KEY || !ERP_API_SECRET) {
    console.error('API credentials missing in .env');
    process.exit(1);
}

const erp = axios.create({
    baseURL: ERP_URL,
    headers: {
        'Authorization': `token ${ERP_API_KEY}:${ERP_API_SECRET}`,
        'Content-Type': 'application/json',
    },
});

async function getAddress() {
    try {
        console.log('Fetching address from:', ERP_URL);
        const res = await erp.get('/api/resource/Address', {
            params: {
                filters: JSON.stringify([["is_your_company_address", "=", 1]]),
                fields: JSON.stringify(["name", "address_line1", "address_line2", "city", "state", "pincode", "phone", "gstin"])
            }
        });

        if (res.data.data.length > 0) {
            console.log('Found Company Address:', JSON.stringify(res.data.data[0], null, 2));
        } else {
            console.log('No address found with is_your_company_address=1');

            // Try fetching associated Company
            try {
                const companyRes = await erp.get('/api/resource/Company');
                console.log('Companies found:', companyRes.data.data.map(c => c.name));
            } catch (e) {
                console.log('Could not fetch companies');
            }
        }
    } catch (e) {
        console.error('Error fetching address:', e.response?.data || e.message);
    }
}

getAddress();
