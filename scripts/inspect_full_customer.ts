import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const erp = axios.create({
    baseURL: process.env.ERP_NEXT_URL,
    headers: {
        'Authorization': `token ${process.env.ERP_API_KEY}:${process.env.ERP_API_SECRET}`,
        'Content-Type': 'application/json'
    }
});

async function inspect() {
    try {
        console.log("Fetching Full Customer Data...");
        // We use the ID "Test User Agent" we found earlier
        const customerId = "Test User Agent";

        const res = await erp.get(`/api/resource/Customer/${customerId}`);

        console.log("Full Data Keys:", Object.keys(res.data.data));
        // Check for specific financial keywords
        const financialKeys = Object.keys(res.data.data).filter(k => k.includes('amount') || k.includes('balance') || k.includes('outstanding'));
        console.log("Potential Financial Fields:", financialKeys);
        console.log("Financial Values:", JSON.stringify(financialKeys.reduce((obj: any, k) => { obj[k] = res.data.data[k]; return obj; }, {}), null, 2));

    } catch (e: any) {
        console.error("Failed:", e.message);
        if (e.response) console.error(e.response.data);
    }
}
inspect();
