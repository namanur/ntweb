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

// 🧠 TOKENIZER: Breaks names into meaningful keywords
function getTokens(str) {
    if (!str) return [];
    let s = str.toString().toLowerCase();
    
    // 1. Remove Brands (Focus on product identity)
    s = s.replace(/maxfresh|max fresh|tibros|sigma|tb\-|tb\s/g, ''); 
    
    // 2. Separate numbers (e.g., "1000ml" -> "1000 ml")
    s = s.replace(/([0-9]+)([a-zA-Z]+)/g, '$1 $2');
    s = s.replace(/([a-zA-Z]+)([0-9]+)/g, '$1 $2');

    // 3. Remove Special Chars (keep spaces)
    s = s.replace(/[^a-z0-9\s]/g, ' ');

    // 4. Split and Filter Stop Words
    // These words add noise to the match (e.g., "with lid" matches everything)
    const ignore = new Set(['with', 'lid', 'glass', 'steel', 'ss', 'ml', 'g', 'kg', 'ltr', 'pcs', 'set', 'of', 'color', 'colour', 'no', 'number', 'in', 'mm', 'cm']);
    
    return s.split(/\s+/).filter(t => t.length > 0 && !ignore.has(t));
}

// 🔍 SCORING ALGORITHM
// Returns a score from 0 to 1 (1 = Perfect Match)
function calculateScore(productName, csvName) {
    const tokensP = getTokens(productName);
    const tokensC = getTokens(csvName);

    if (tokensP.length === 0 || tokensC.length === 0) return 0;

    // Count how many tokens from Product exist in CSV
    let matches = 0;
    tokensP.forEach(tp => {
        if (tokensC.includes(tp)) matches++;
    });

    // Score = (Matches / Total Product Tokens)
    // We prioritize checking if the Product is a "Subset" of the CSV entry
    return matches / tokensP.length;
}

function cleanPrice(priceStr) {
    if (!priceStr) return 0;
    return parseFloat(priceStr.toString().replace(/[^0-9.]/g, '')) || 0;
}

async function syncPrices() {
    console.log("🚀 Starting Smart Price Sync (Scoring Logic)...");

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

    // 2. Build Searchable CSV List
    const csvItems = items.map(row => ({
        name: row['Item Name'],
        rate: cleanPrice(row['Purchase Rate'] || row['Rate'])
    })).filter(i => i.name && i.rate > 0);

    // 3. Process Items
    let updated = 0;
    let missing = 0;
    const missingList = [];

    const updatedProducts = products.map(p => {
        const itemName = p.item_name;
        let buyingPrice = -1;
        let matchMethod = "";

        // PRIORITY 1: Manual Fixed Price
        if (priceMap.fixed_prices && priceMap.fixed_prices[itemName]) {
            p.standard_rate = priceMap.fixed_prices[itemName];
            updated++;
            return p;
        }

        // PRIORITY 2: Manual Buying Price
        if (priceMap.manual_buy_prices && priceMap.manual_buy_prices[itemName]) {
            buyingPrice = priceMap.manual_buy_prices[itemName];
            matchMethod = "Manual";
        }

        // PRIORITY 3: Explicit Name Mapping
        if (buyingPrice === -1 && priceMap.csv_name_map && priceMap.csv_name_map[itemName]) {
            const mappedName = priceMap.csv_name_map[itemName];
            const found = csvItems.find(i => i.name === mappedName);
            if (found) {
                buyingPrice = found.rate;
                matchMethod = "Map";
            }
        }

        // PRIORITY 4: Smart Scoring Match
        if (buyingPrice === -1) {
            let bestMatch = null;
            let bestScore = 0;

            csvItems.forEach(csvItem => {
                const score = calculateScore(itemName, csvItem.name);
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = csvItem;
                }
            });

            // Threshold: 0.8 means 80% of the words in the Product Name must exist in the CSV Name
            // e.g. "Vacuum Flask 1000" (tokens: vacuum, flask, 1000)
            // vs "Vacuum Flask 1000ml Red" (tokens: vacuum, flask, 1000, red) -> 3/3 match = Score 1.0
            if (bestScore >= 0.75 && bestMatch) {
                buyingPrice = bestMatch.rate;
                matchMethod = `Smart (${(bestScore*100).toFixed(0)}%)`;
                // Optional: Log tricky matches to verify
                // if (bestScore < 1.0) console.log(`   🔸 Fuzzy: "${itemName}" -> "${bestMatch.name}"`);
            }
        }

        // 4. Calculate Final Price
        if (buyingPrice > 0) {
            const landedCost = buyingPrice * (1 + TRANSPORT_RATE);
            const costWithTax = landedCost * (1 + GST_RATE);
            let finalSellingPrice = costWithTax * (1 + MARKUP_RATE);
            finalSellingPrice = Math.ceil(finalSellingPrice);

            // Update if price is different or was 0
            if (p.standard_rate !== finalSellingPrice) {
                p.standard_rate = finalSellingPrice;
                updated++;
            }
        } else {
            // Only count as missing if price is still 0
            if (!p.standard_rate || p.standard_rate === 0) {
                missing++;
                missingList.push(itemName);
            }
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
        const missingPath = path.join(__dirname, '../missing_items.txt');
        fs.writeFileSync(missingPath, missingList.join("\n"));
        console.log(`👉 Missing list saved to: ${missingPath}`);
    }
}

syncPrices();