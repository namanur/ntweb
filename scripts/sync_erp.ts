
import 'dotenv/config';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// --- CONFIGURATION ---
const ERP_URL = process.env.ERP_NEXT_URL || "http://127.0.0.1:8080";
const API_KEY = process.env.ERP_API_KEY;
const API_SECRET = process.env.ERP_API_SECRET;
const PRODUCTS_PATH = path.join(__dirname, '../src/data/products.json');
const CSV_FILE_PATH = path.join(__dirname, '../products.csv');

const call = axios.create({
    baseURL: ERP_URL,
    headers: {
        'Authorization': `token ${API_KEY}:${API_SECRET}`,
        'Content-Type': 'application/json',
    },
});

// --- HELPER FUNCTIONS ---

function parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
        else current += char;
    }
    result.push(current.trim());
    return result;
}

function readCsvProducts(): Map<string, any> {
    const map = new Map();
    if (!fs.existsSync(CSV_FILE_PATH)) return map;

    try {
        const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
        const lines = fileContent.split(/\r?\n/);
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;
            const cols = parseCSVLine(line);
            if (cols.length < 8) continue;

            const itemName = cols[1].replace(/^"|"$/g, '');
            const csvRate = parseFloat(cols[7]) || 0;
            const publicRate = Math.ceil(csvRate * 1.07);

            map.set(cols[0], {
                item_code: cols[0],
                item_name: itemName,
                description: cols[8] ? cols[8].replace(/^"|"$/g, '') : itemName,
                stock_uom: cols[4],
                standard_rate: publicRate,
                wholesale_rate: csvRate,
                item_group: getAutoCategory(itemName, cols[2]),
                brand: getBrand(itemName, cols[3]),
                source: 'CSV'
            });
        }
        console.log(`✅ Loaded ${map.size} items from CSV.`);
    } catch (e) {
        console.error("⚠️ Failed to read CSV:", e);
    }
    return map;
}

// 🧠 IMPROVED CATEGORIZATION LOGIC
function getAutoCategory(name: string, originalGroup: string): string {
    const n = name.toLowerCase();
    if (n.includes('lunch') || n.includes('tiffin')) return "Lunch Box";
    if (n.includes('bottle') || n.includes('flask') || n.includes('sipper') || n.includes('jug')) return "Bottle";
    if (n.includes('knife') || n.includes('cutter') || n.includes('peeler') || n.includes('slicer') || n.includes('grater') || n.includes('scissors')) return "Knife & Cutter";
    if (n.includes('chopper') || n.includes('blender') || n.includes('beater')) return "Chopper";
    if (n.includes('mug') || n.includes('cup') || n.includes('glass') || n.includes('tea')) return "Cups & Mugs";
    if (n.includes('tray') || n.includes('plate') || n.includes('dining') || n.includes('bowl') || n.includes('dinner')) return "Dining & Serving";
    if (n.includes('masala') || n.includes('container') || n.includes('jar') || n.includes('storage') || n.includes('canister') || n.includes('basket')) return "Storage & Boxes";
    if (n.includes('box') && !n.includes('packing')) return "Storage & Boxes";
    if (n.includes('stand') || n.includes('rack') || n.includes('holder') || n.includes('hook')) return "Kitchen Organizers";
    if (n.includes('stool') || n.includes('patla') || n.includes('chair') || n.includes('mat')) return "Household";
    if (n.includes('lighter') || n.includes('gas') || n.includes('trolley')) return "Gas Accessories";
    if (originalGroup === "Plastic kitchenware") return "General Kitchenware";
    return originalGroup || "General";
}

// 🏷️ BRAND DETECTION LOGIC
function getBrand(name: string, originalBrand: string): string {
    const n = name.toLowerCase();
    const b = (originalBrand || "").toLowerCase();
    if (n.includes('maxfresh') || b.includes('maxfresh')) return "MaxFresh";
    if (n.includes('tibros') || b.includes('tibros') || n.includes('tb ') || n.startsWith('tb-')) return "Tibros";
    if (n.includes('sigma') || b.includes('sigma')) return "Sigma";
    return originalBrand && originalBrand.trim() !== "" ? originalBrand : "Other";
}

async function syncErp() {
    console.log("🚀 Starting Smart Product Sync (Restricted to CSV List)...");

    try {
        // 1. Load CSV (Master List)
        const productsMap = readCsvProducts();

        // 2. Fetch ERP (Data Source)
        console.log("🔄 Fetching items from ERP...");
        const res = await call.get(`/api/resource/Item`, {
            params: {
                fields: JSON.stringify(["item_code", "item_name", "item_group", "description", "standard_rate", "valuation_rate", "stock_uom", "brand", "image", "disabled"]),
                limit_page_length: 5000,
                filters: JSON.stringify([["disabled", "=", 0]])
            }
        });

        const erpItems = res.data.data;
        console.log(`✅ Fetched ${erpItems.length} items from ERP.`);

        // 3. Update Existing Items Only
        let erpUpdates = 0;
        let erpIgnored = 0;

        erpItems.forEach((item: any) => {
            const existing = productsMap.get(item.item_code);

            // STRICT MODE: Only update items that exist in CSV
            if (existing) {
                const itemName = item.item_name;
                const erpPrice = item.standard_rate || 0;

                // Logic: ERP wins if price > 0. If ERP price is 0, keep CSV price.
                const finalPrice = erpPrice > 0 ? erpPrice : existing.standard_rate;

                const mergedProduct = {
                    ...existing,
                    item_name: itemName,
                    description: item.description || itemName,
                    stock_uom: item.stock_uom || existing.stock_uom,
                    standard_rate: finalPrice,
                    wholesale_rate: item.valuation_rate || 0,
                    source: 'ERP_UPDATED'
                };

                productsMap.set(item.item_code, mergedProduct);
                erpUpdates++;
            } else {
                erpIgnored++;
            }
        });

        const finalProducts = Array.from(productsMap.values());

        // 4. Validation
        const zeroPriceCount = finalProducts.filter((p: any) => !p.standard_rate).length;
        if (zeroPriceCount > 0) {
            console.warn(`⚠️ Warning: ${zeroPriceCount} items have 0 standard_rate.`);
        }

        fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(finalProducts, null, 2));

        console.log(`✅ Success! Synced ${finalProducts.length} items.`);
        console.log(`   - Updates from ERP: ${erpUpdates}`);
        console.log(`   - Ignored (Not in CSV): ${erpIgnored}`);
        console.log(`📁 Saved to: src/data/products.json`);

    } catch (error: any) {
        console.error("❌ Sync Failed:", error.message);
        if (error.response) console.error(error.response.data);
        process.exit(1);
    }
}

syncErp();
