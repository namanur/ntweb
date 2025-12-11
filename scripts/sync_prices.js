const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

// --- 🔧 CONFIGURATION ---
const PRODUCTS_PATH = path.join(__dirname, '../src/data/products.json');
const MAP_PATH = path.join(__dirname, '../src/data/price_map.json');
const ITEM_CSV_PATH = path.join(__dirname, '../Item.csv'); 

// 💰 PRICING FORMULA
const TRANSPORT_RATE = 0.08; // 8%
const GST_RATE = 0.18;       // 18%
const MARKUP_RATE = 0.25;    // 25%

// HELPER: Clean text for fuzzy matching
function normalize(str) {
    if (!str) return "";
    let s = str.toString().toLowerCase();
    s = s.replace(/maxfresh|max fresh|tibros|sigma/g, ''); // Remove Brands
    s = s.replace(/with\s+glass\s+lid/g, ' '); 
    s = s.replace(/with\s+lid/g, ' ');         
    s = s.replace(/stainless\s+steel/g, ' '); 
    s = s.replace(/\b(s\.s\.|ss)\b/g, ' '); 
    s = s.replace('rank', 'rack'); 
    s = s.replace(/(\d+)(ml|g|kg|l)\b/g, '$1'); 
    return s.replace(/[^a-z0-9]/g, ''); 
}

function normalizeSorted(str) {
    if (!str) return "";
    let s = str.toString().toLowerCase();
    s = s.replace(/maxfresh|max fresh|tibros|sigma/g, ''); 
    s = s.replace(/with\s+glass\s+lid/g, ' '); 
    s = s.replace(/with\s+lid/g, ' ');         
    return s.replace(/[^a-z0-9 ]/g, '').split(/\s+/).sort().join('');
}

function cleanPrice(priceStr) {
    if (!priceStr) return 0;
    return parseFloat(priceStr.toString().replace(/[^0-9.]/g, '')) || 0;
}

async function syncPrices() {
    console.log("🚀 Starting Master Price Sync (v7 - Auto Calc)...");

    if (!fs.existsSync(PRODUCTS_PATH) || !fs.existsSync(ITEM_CSV_PATH)) {
        console.error("❌ Error: Missing Product or CSV file.");
        return;
    }

    // 1. Load Data
    const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf-8'));
    const csvFile = fs.readFileSync(ITEM_CSV_PATH, 'utf-8');
    const { data: items } = Papa.parse(csvFile, { header: true, skipEmptyLines: true });
    
    let priceMap = { fixed_prices: {}, manual_buy_prices: {}, csv_name_map: {} };
    if (fs.existsSync(MAP_PATH)) {
        priceMap = JSON.parse(fs.readFileSync(MAP_PATH, 'utf-8'));
    }

    // 2. Create CSV Lookup Maps
    const costMap = new Map();
    const sortedCostMap = new Map();
    const rawNameMap = new Map(); 

    items.forEach(row => {
        const name = row['Item Name'];
        const purchaseRate = cleanPrice(row['Purchase Rate']);
        if (name) {
            rawNameMap.set(name, purchaseRate);
            costMap.set(normalize(name), purchaseRate);
            sortedCostMap.set(normalizeSorted(name), purchaseRate);
        }
    });

    // 3. Process Items
    let updated = 0;
    let missing = 0;
    const missingList = [];

    const updatedProducts = products.map(p => {
        const itemName = p.item_name;
        let buyingPrice = -1;

        // PRIORITY 1: Manual Override (Final Sell Price)
        if (priceMap.fixed_prices && priceMap.fixed_prices[itemName]) {
            p.standard_rate = priceMap.fixed_prices[itemName];
            updated++;
            return p;
        }

        // PRIORITY 2: Manual Buying Price (Run Logic)
        if (priceMap.manual_buy_prices && priceMap.manual_buy_prices[itemName]) {
            buyingPrice = priceMap.manual_buy_prices[itemName];
        }

        // PRIORITY 3: Map from CSV
        if (buyingPrice === -1 && priceMap.csv_name_map && priceMap.csv_name_map[itemName]) {
            const mappedName = priceMap.csv_name_map[itemName];
            if (rawNameMap.has(mappedName)) {
                buyingPrice = rawNameMap.get(mappedName);
            }
        }

        // PRIORITY 4: Auto-Match from CSV
        if (buyingPrice === -1) {
            const key = normalize(itemName);
            const sortedKey = normalizeSorted(itemName);

            if (costMap.has(key)) {
                buyingPrice = costMap.get(key);
            } else if (sortedCostMap.has(sortedKey)) {
                buyingPrice = sortedCostMap.get(sortedKey);
            }
        }

        // 4. Calculate Final Price (Only if we have a buying price)
        if (buyingPrice > 0) {
            const landedCost = buyingPrice * (1 + TRANSPORT_RATE);
            const costWithTax = landedCost * (1 + GST_RATE);
            let finalSellingPrice = costWithTax * (1 + MARKUP_RATE);
            finalSellingPrice = Math.ceil(finalSellingPrice);

            if (p.standard_rate !== finalSellingPrice) {
                p.standard_rate = finalSellingPrice;
                updated++;
            }
        } else {
            missing++;
            missingList.push(itemName);
        }
        return p;
    });

    // 5. Save & Report
    fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(updatedProducts, null, 2));

    console.log(`\n✅ UPDATE COMPLETE`);
    console.log(`-----------------------------------`);
    console.log(`💰 Prices Updated: ${updated}`);
    console.log(`⚠️  Still Missing:  ${missing}`);
    console.log(`-----------------------------------`);

    if (missing > 0) {
        fs.writeFileSync(path.join(__dirname, '../missing_items.txt'), missingList.join("\n"));
        console.log(`\n👉 Missing items list saved to: missing_items.txt`);
    }
}

syncPrices();