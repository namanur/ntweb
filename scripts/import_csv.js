const fs = require('fs');
const path = require('path');

// CONFIGURATION
const CSV_FILE_PATH = path.join(__dirname, '../products.csv');
const OUTPUT_PATH = path.join(__dirname, '../src/data/products.json');

// 🧠 IMPROVED CATEGORIZATION LOGIC
function getAutoCategory(name, originalGroup) {
    const n = name.toLowerCase();

    // 1. LUNCH BOXES (Strict)
    if (n.includes('lunch') || n.includes('tiffin')) return "Lunch Box";

    // 2. BOTTLES (High Priority)
    if (n.includes('bottle') || n.includes('flask') || n.includes('sipper') || n.includes('jug')) return "Bottle";

    // 3. CUTTING TOOLS
    if (n.includes('knife') || n.includes('cutter') || n.includes('peeler') || n.includes('slicer') || n.includes('grater') || n.includes('scissors')) return "Knife & Cutter";

    // 4. CHOPPERS
    if (n.includes('chopper') || n.includes('blender') || n.includes('beater')) return "Chopper";

    // 5. DRINKWARE
    if (n.includes('mug') || n.includes('cup') || n.includes('glass') || n.includes('tea')) return "Cups & Mugs";

    // 6. DINING
    if (n.includes('tray') || n.includes('plate') || n.includes('dining') || n.includes('bowl') || n.includes('dinner')) return "Dining & Serving";

    // 7. STORAGE & BOXES
    if (n.includes('masala') || n.includes('container') || n.includes('jar') || n.includes('storage') || n.includes('canister') || n.includes('basket')) return "Storage & Boxes";
    if (n.includes('box') && !n.includes('packing')) return "Storage & Boxes";

    // 8. HOUSEHOLD / ORGANIZERS
    if (n.includes('stand') || n.includes('rack') || n.includes('holder') || n.includes('hook')) return "Kitchen Organizers";
    if (n.includes('stool') || n.includes('patla') || n.includes('chair') || n.includes('mat')) return "Household";

    // 9. GAS
    if (n.includes('lighter') || n.includes('gas') || n.includes('trolley')) return "Gas Accessories";

    if (originalGroup === "Plastic kitchenware") return "General Kitchenware";
    
    return originalGroup || "General";
}

// 🏷️ BRAND DETECTION LOGIC
function getBrand(name, originalBrand) {
    const n = name.toLowerCase();
    const b = (originalBrand || "").toLowerCase();

    if (n.includes('maxfresh') || b.includes('maxfresh')) return "MaxFresh";
    if (n.includes('tibros') || b.includes('tibros') || n.includes('tb ') || n.startsWith('tb-')) return "Tibros";
    if (n.includes('sigma') || b.includes('sigma')) return "Sigma";

    return originalBrand && originalBrand.trim() !== "" ? originalBrand : "Other";
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

function importCsv() {
  console.log("🔄 Reading CSV file...");

  try {
    if (!fs.existsSync(CSV_FILE_PATH)) {
        throw new Error(`CSV file not found at: ${CSV_FILE_PATH}`);
    }

    const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8');
    const lines = fileContent.split(/\r?\n/);
    const products = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const cols = parseCSVLine(line);
        if (cols.length < 8) continue;

        const itemName = cols[1].replace(/^"|"$/g, '');
        const originalGroup = cols[2];
        const originalBrand = cols[3]; 
        
        // 💰 PRICING LOGIC
        const csvRate = parseFloat(cols[7]) || 0;
        
        // Apply 7% Markup for Public Display (Rounded up to nearest Rupee)
        const publicRate = Math.ceil(csvRate * 1.07);

        products.push({
            item_code: cols[0],
            item_name: itemName,
            description: cols[8] ? cols[8].replace(/^"|"$/g, '') : itemName,
            stock_uom: cols[4],
            standard_rate: publicRate,   // Display Price (CSV + 7%)
            wholesale_rate: csvRate,     // Original Price (Hidden for now)
            item_group: getAutoCategory(itemName, originalGroup),
            brand: getBrand(itemName, originalBrand)
        });
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(products, null, 2));
    
    console.log(`✅ Success! Imported ${products.length} items.`);
    console.log(`📈 Applied 7% Markup to all items.`);
    console.log(`📁 Saved to: src/data/products.json`);

  } catch (error) {
    console.error("❌ Import Failed:", error.message);
  }
}

importCsv();