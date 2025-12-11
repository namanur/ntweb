const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

// --- 🔧 CONFIGURATION ---
const PRODUCTS_PATH = path.join(__dirname, '../src/data/products.json');
const ITEM_CSV_PATH = path.join(__dirname, '../Item.csv'); 

// 💰 PRICING FORMULA FACTORS
const TRANSPORT_RATE = 0.08; // 8%
const GST_RATE = 0.18;       // 18%
const MARKUP_RATE = 0.25;    // 25%

// HELPER: Clean text for fuzzy matching
function normalize(str) {
    if (!str) return "";
    let s = str.toString().toLowerCase();
    
    // 🔧 FIX 1: Auto-fix common typos found in your CSV
    s = s.replace('rank', 'rack'); // Fixes "Shoe Rank" -> "Shoe Rack"
    
    // 🔧 FIX 2: Remove units and special chars
    // We remove 'ml', 'g', 'kg' if they are at the end, and all symbols
    s = s.replace(/(\d+)(ml|g|kg|l)$/, '$1'); // "2000ml" -> "2000"
    s = s.replace(/[^a-z0-9]/g, ''); // Remove all non-alphanumeric chars
    
    return s;
}

// HELPER: Clean currency strings
function cleanPrice(priceStr) {
    if (!priceStr) return 0;
    return parseFloat(priceStr.toString().replace(/[^0-9.]/g, '')) || 0;
}

async function syncPrices() {
    console.log("🚀 Starting Smart Price Sync (v2)...");

    if (!fs.existsSync(PRODUCTS_PATH) || !fs.existsSync(ITEM_CSV_PATH)) {
        console.error("❌ Error: Missing files.");
        return;
    }

    const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf-8'));
    const csvFile = fs.readFileSync(ITEM_CSV_PATH, 'utf-8');
    const { data: items } = Papa.parse(csvFile, { header: true, skipEmptyLines: true });

    // 1. Create Cost Map
    const costMap = new Map();
    items.forEach(row => {
        const name = row['Item Name'];
        const purchaseRate = cleanPrice(row['Purchase Rate']);
        
        if (name && purchaseRate > 0) {
            // We map the NORMALIZED name to the price
            costMap.set(normalize(name), purchaseRate);
        }
    });

    // 2. Apply Formula
    let updatedCount = 0;
    let missingCount = 0;
    const missingItems = [];

    const updatedProducts = products.map(p => {
        const key = normalize(p.item_name);
        
        // Try exact match on normalized key
        if (costMap.has(key)) {
            const buyingPrice = costMap.get(key);

            // Calculation
            const landedCost = buyingPrice * (1 + TRANSPORT_RATE);
            const costWithTax = landedCost * (1 + GST_RATE);
            let finalSellingPrice = costWithTax * (1 + MARKUP_RATE);
            finalSellingPrice = Math.ceil(finalSellingPrice);

            if (p.standard_rate !== finalSellingPrice) {
                p.standard_rate = finalSellingPrice;
                updatedCount++;
            }
        } else {
            // If still no match, log it
            missingCount++;
            missingItems.push(p.item_name);
        }
        return p;
    });

    // 3. Save
    fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(updatedProducts, null, 2));

    console.log(`\n✅ UPDATE COMPLETE`);
    console.log(`-----------------------------------`);
    console.log(`💰 Updated Prices: ${updatedCount}`);
    console.log(`⚠️  Still No Match: ${missingCount}`);
    console.log(`-----------------------------------`);

    if (missingCount > 0) {
        console.log("\n⚠️  Items still missing (Check Item.csv names):");
        console.log(missingItems.slice(0, 15).join("\n"));
    }
}

syncPrices();