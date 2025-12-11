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

// HELPER: Master Cleaning Function
// Applies all cleaning rules BEFORE we decide to sort or not
function cleanString(str) {
    if (!str) return "";
    let s = str.toString().toLowerCase();
    
    // 1. Remove Brands
    s = s.replace(/maxfresh|max fresh|tibros|sigma/g, '');

    // 2. Remove "With..." phrases (e.g., "with glass lid")
    // We replace them with space to prevent words merging
    s = s.replace(/with\s+glass\s+lid/g, ' '); 
    s = s.replace(/with\s+lid/g, ' ');         

    // 3. Remove "Stainless Steel" / "SS" safely
    s = s.replace(/stainless\s+steel/g, ' '); 
    // ✅ FIX: Only remove "ss" if it's a whole word (prevents "caSSerole" -> "caerole")
    s = s.replace(/\b(s\.s\.|ss)\b/g, ' '); 

    // 4. Fix specific typos
    s = s.replace('rank', 'rack'); 

    // 5. Remove units at the end of words (e.g., 2000ml -> 2000)
    s = s.replace(/(\d+)(ml|g|kg|l)\b/g, '$1'); 

    return s;
}

// STRATEGY A: Standard Normalize (Remove non-alphanumeric)
function normalize(str) {
    let s = cleanString(str);
    return s.replace(/[^a-z0-9]/g, ''); 
}

// STRATEGY B: Sorted Normalize (Sort words, then remove non-alphanumeric)
function normalizeSorted(str) {
    let s = cleanString(str);
    // Split by spaces, sort alphabetically, then join
    return s.split(/\s+/).sort().join('').replace(/[^a-z0-9]/g, '');
}

// HELPER: Clean currency strings
function cleanPrice(priceStr) {
    if (!priceStr) return 0;
    return parseFloat(priceStr.toString().replace(/[^0-9.]/g, '')) || 0;
}

async function syncPrices() {
    console.log("🚀 Starting Smart Price Sync (v5 - The Fixer)...");

    if (!fs.existsSync(PRODUCTS_PATH) || !fs.existsSync(ITEM_CSV_PATH)) {
        console.error("❌ Error: Missing files.");
        return;
    }

    const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf-8'));
    const csvFile = fs.readFileSync(ITEM_CSV_PATH, 'utf-8');
    const { data: items } = Papa.parse(csvFile, { header: true, skipEmptyLines: true });

    // 1. Create Cost Maps
    const costMap = new Map();
    const sortedCostMap = new Map(); 

    items.forEach(row => {
        const name = row['Item Name'];
        const purchaseRate = cleanPrice(row['Purchase Rate']);
        
        if (name) {
            costMap.set(normalize(name), purchaseRate);
            sortedCostMap.set(normalizeSorted(name), purchaseRate);
        }
    });

    // 2. Apply Formula
    let updatedCount = 0;
    let missingCount = 0;
    let zeroPriceInCSVCount = 0;
    
    const missingItems = [];
    const zeroPriceItems = [];

    const updatedProducts = products.map(p => {
        const key = normalize(p.item_name);
        const sortedKey = normalizeSorted(p.item_name);
        
        let buyingPrice = -1;

        // Try Exact Match First
        if (costMap.has(key)) {
            buyingPrice = costMap.get(key);
        } 
        // Try Sorted Match Second (e.g. "Fruit Basket" == "Basket Fruit")
        else if (sortedCostMap.has(sortedKey)) {
            buyingPrice = sortedCostMap.get(sortedKey);
        }

        if (buyingPrice !== -1) {
            if (buyingPrice <= 0) {
                zeroPriceInCSVCount++;
                if (zeroPriceInCSVCount <= 5) zeroPriceItems.push(`${p.item_name}`);
                return p; // Skip update if price is 0
            }

            const landedCost = buyingPrice * (1 + TRANSPORT_RATE);
            const costWithTax = landedCost * (1 + GST_RATE);
            let finalSellingPrice = costWithTax * (1 + MARKUP_RATE);
            finalSellingPrice = Math.ceil(finalSellingPrice);

            if (p.standard_rate !== finalSellingPrice) {
                p.standard_rate = finalSellingPrice;
                updatedCount++;
            }
        } else {
            missingCount++;
            if (missingCount <= 10) {
                missingItems.push(`${p.item_name} \n   -> Key: ${key}\n   -> Sort: ${sortedKey}`);
            }
        }
        return p;
    });

    // 3. Save
    fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(updatedProducts, null, 2));

    console.log(`\n✅ UPDATE COMPLETE`);
    console.log(`-----------------------------------`);
    console.log(`💰 Updated Prices:     ${updatedCount}`);
    console.log(`⚠️  Still No Match:     ${missingCount}`);
    console.log(`🛑  Zero Price in CSV:  ${zeroPriceInCSVCount}`);
    console.log(`-----------------------------------`);

    if (zeroPriceInCSVCount > 0) {
        console.log("\n🛑 Found in CSV but Rate is 0 (Sample):");
        console.log(zeroPriceItems.join("\n"));
    }

    if (missingCount > 0) {
        console.log("\n⚠️  Items still missing (First 10):");
        console.log(missingItems.join("\n\n"));
    }
}

syncPrices();