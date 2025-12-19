import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { Product } from '../lib/erp'; // We might need to just redefine the interface if lib/erp has issues, but trying to reuse.

// Load env
dotenv.config({ path: path.join(process.cwd(), '.env') });

const ERP_URL = process.env.ERP_NEXT_URL;
const API_KEY = process.env.ERP_API_KEY;
const API_SECRET = process.env.ERP_API_SECRET;

const HEADERS = {
    'Authorization': `token ${API_KEY}:${API_SECRET}`,
    'Content-Type': 'application/json'
};

async function getProducts(): Promise<any[]> {
    const filePath = path.join(process.cwd(), 'src/data/products.json');
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    return [];
}

const itemGroupsRaw = new Set<string>();

async function ensureItemGroup(groupName: string) {
    if (!groupName) groupName = "All Item Groups";

    // Simple cache to avoid spamming checks
    if (itemGroupsRaw.has(groupName)) return;

    try {
        // Check existence
        await axios.get(`${ERP_URL}/api/resource/Item Group/${encodeURIComponent(groupName)}`, { headers: HEADERS });
        itemGroupsRaw.add(groupName);
    } catch (e: any) {
        if (e.response && e.response.status === 404) {
            console.log(`Creating Item Group: ${groupName}`);
            try {
                await axios.post(`${ERP_URL}/api/resource/Item Group`, {
                    item_group_name: groupName,
                    parent_item_group: "All Item Groups",
                    is_group: 0
                }, { headers: HEADERS });
                itemGroupsRaw.add(groupName);
            } catch (createErr: any) {
                console.error(`Failed to create Group ${groupName}:`, createErr.response?.data || createErr.message);
            }
        }
    }
}

async function syncItem(p: any) {
    if (!p.item_code) return;

    try {
        // Check if item exists
        await axios.get(`${ERP_URL}/api/resource/Item/${encodeURIComponent(p.item_code)}`, { headers: HEADERS });
        process.stdout.write('.'); // Exists
    } catch (e: any) {
        if (e.response && e.response.status === 404) {
            console.log(`\nCreating Item: ${p.item_code} (${p.item_name})`);

            await ensureItemGroup(p.item_group);

            const payload = {
                item_code: p.item_code,
                item_name: p.item_name,
                item_group: p.item_group || "All Item Groups",
                stock_uom: p.stock_uom || "Nos",
                standard_rate: p.standard_rate,
                description: p.description,
                is_stock_item: 1,
                has_batch_no: 0,
                has_serial_no: 0,
                opening_stock: 0,
                gst_hsn_code: "392410" // Default fallback for plastic kitchenware to satisfy mandatory field
            };

            try {
                await axios.post(`${ERP_URL}/api/resource/Item`, payload, { headers: HEADERS });
                console.log(`✅ Created: ${p.item_code}`);
            } catch (createErr: any) {
                console.error(`❌ Failed to create ${p.item_code}:`, createErr.response?.data?.exception || createErr.message);
            }
        } else {
            console.error(`\nError checking ${p.item_code}:`, e.message);
        }
    }
}

async function main() {
    console.log(`Starting Sync to ${ERP_URL}...`);
    const products = await getProducts();
    console.log(`Found ${products.length} products locally.`);

    // Sequential to be safe
    for (const p of products) {
        await syncItem(p);
    }
    console.log("\nDone.");
}

main();
