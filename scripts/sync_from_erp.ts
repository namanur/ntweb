
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fetchAllDocs } from '../lib/erpnext';

// --- CONFIGURATION ---
const PRODUCTS_PATH = path.join(process.cwd(), 'src/data/products.json');

// --- HELPER FUNCTIONS ---

// 🧠 IMPROVED CATEGORIZATION LOGIC (Ported from legacy script)
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

// 🏷️ BRAND DETECTION LOGIC (Ported from legacy script)
function getBrand(name: string, originalBrand: string): string {
    const n = name.toLowerCase();
    const b = (originalBrand || "").toLowerCase();
    if (n.includes('maxfresh') || b.includes('maxfresh')) return "MaxFresh";
    if (n.includes('tibros') || b.includes('tibros') || n.includes('tb ') || n.startsWith('tb-')) return "Tibros";
    if (n.includes('sigma') || b.includes('sigma')) return "Sigma";
    return originalBrand && originalBrand.trim() !== "" ? originalBrand : "Other";
}

async function syncFromErp() {
    console.log("🚀 Starting Authoritative Sync from ERPNext...");

    try {
        // 1. Fetch ERP (Single Source of Truth)
        console.log("🔄 Fetching items from ERP...");

        const erpItems = await fetchAllDocs<any>(
            "Item",
            ["item_code", "item_name", "item_group", "description", "standard_rate", "valuation_rate", "stock_uom", "brand", "image", "disabled", "is_stock_item"],
            [["disabled", "=", 0]]
        );

        console.log(`✅ Fetched ${erpItems.length} items from ERP.`);

        // 2. Transform Data (Normalize)
        const products = erpItems.map((item: any) => {
            const itemName = item.item_name;
            return {
                item_code: item.item_code,
                item_name: itemName,
                description: item.description || itemName,
                stock_uom: item.stock_uom,
                standard_rate: item.standard_rate || 0,
                wholesale_rate: item.valuation_rate || 0, // Keeping for reference
                item_group: getAutoCategory(itemName, item.item_group),
                brand: getBrand(itemName, item.brand),
                image: item.image,
                is_hot: false, // Default value
                source: 'ERPNext'
            };
        });

        // 3. Validation
        const zeroPriceCount = products.filter((p: any) => !p.standard_rate).length;
        if (zeroPriceCount > 0) {
            console.warn(`⚠️ Warning: ${zeroPriceCount} items have 0 standard_rate.`);
        }

        // 4. Overwrite products.json with Metadata
        const dir = path.dirname(PRODUCTS_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const payload = {
            metadata: {
                generated_at: new Date().toISOString(),
                source: "ERPNext",
                sync_script: "sync_from_erp.ts"
            },
            products: products
        };

        fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(payload, null, 2));

        console.log(`✅ Success! Overwrote products.json with ${products.length} items and metadata.`);

        console.log(`   Strict Mode: CSV files were IGNORED.`);
        console.log(`📁 Saved to: ${PRODUCTS_PATH}`);

    } catch (error: any) {
        if (error.name === "ERPAuthError") {
            console.error("❌ CRITICAL: Authentication Failed. Check ERP_API_KEY/SECRET.");
        } else if (error.name === "ERPTimeoutError") {
            console.error("❌ TIMEOUT: ERPNext is too slow or down.");
        } else if (error.name === "ERPPartialDataError") {
            console.error("❌ DATA ERROR: ERP returned malformed data.");
        }
        console.error("❌ Sync Failed:", error.message);
        process.exit(1);
    }
}

syncFromErp();
