const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Helper to load env
function loadEnv() {
    const env = {};
    ['.env', '.env.local'].forEach(file => {
        const p = path.join(__dirname, '..', file);
        if (fs.existsSync(p)) {
            console.log(`Loading env from ${file}`);
            const content = fs.readFileSync(p, 'utf-8');
            content.split('\n').forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
                    if (key && val) env[key] = val;
                }
            });
        }
    });
    return env;
}

const env = loadEnv();
const ERP_URL = env.ERP_NEXT_URL || "http://127.0.0.1:8080";
const ERP_API_KEY = env.ERP_API_KEY;
const ERP_API_SECRET = env.ERP_API_SECRET;

console.log(`\n--- ERPNext Diagnosis ---`);
console.log(`URL: ${ERP_URL}`);
console.log(`API Key: ${ERP_API_KEY ? '******' : 'MISSING'}`);
console.log(`API Secret: ${ERP_API_SECRET ? '******' : 'MISSING'}`);

if (!ERP_API_KEY || !ERP_API_SECRET) {
    console.error("❌ Credentials missing. logic will fail.");
    process.exit(1);
}

const erp = axios.create({
    baseURL: ERP_URL,
    headers: {
        'Authorization': `token ${ERP_API_KEY}:${ERP_API_SECRET}`,
        'Content-Type': 'application/json',
    },
});

async function diagnose() {
    try {
        console.log(`\n1. Pinging ERPNext...`);
        const ping = await erp.get('/api/method/ping');
        console.log(`✅ Ping Success: ${ping.data.message}`);
    } catch (e) {
        console.error(`❌ Ping Failed: ${e.message}`);
        if (e.response) console.error(`   Status: ${e.response.status} - ${e.response.statusText}`);
        return;
    }

    try {
        console.log(`\n2. Checking Company Address configuration...`);
        console.log(`   Searching for Address with 'is_your_company_address=1'...`);

        const addrRes = await erp.get('/api/resource/Address', {
            params: {
                filters: JSON.stringify([["is_your_company_address", "=", 1]]),
                fields: JSON.stringify(["name", "address_line1", "city", "state", "pincode", "phone"]),
                limit: 5
            }
        });

        const addresses = addrRes.data.data;
        if (addresses.length > 0) {
            console.log(`✅ Found ${addresses.length} Company Address(es):`);
            addresses.forEach(a => console.log(JSON.stringify(a, null, 2)));
        } else {
            console.warn(`⚠️  No Address found with 'is_your_company_address=1'.`);
            console.log(`   Detailed Error: Request for '/api/resource/Sales Order' likely fails because code expects this address.`);
        }

    } catch (e) {
        console.error(`❌ Address Scan Failed: ${e.response?.data?.exc || e.message}`);
    }

    try {
        console.log(`\n3. Checking 'Company' DocType default address...`);
        const companyRes = await erp.get('/api/resource/Company', {
            params: { limit_page_length: 1 }
        });

        if (companyRes.data.data.length > 0) {
            const company = companyRes.data.data[0];
            console.log(`   Found Company: ${company.name}`);
            // detailed fetch
            const compDetails = await erp.get(`/api/resource/Company/${company.name}`);
            console.log(`   Company Details (Partial):`, {
                name: compDetails.data.data.name,
                default_currency: compDetails.data.data.default_currency,
                default_letter_head: compDetails.data.data.default_letter_head
            });
        }
    } catch (e) {
        console.error(`❌ Company Scan Failed: ${e.message}`);
    }
}

diagnose();
