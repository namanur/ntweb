const fs = require('fs');
const path = require('path');

// CONFIGURATION
const CSV_FILE_PATH = path.join(__dirname, '../products.csv');
const OUTPUT_PATH = path.join(__dirname, '../src/data/products.json');

// 🧠 AUTO-CATEGORIZATION LOGIC
function getAutoCategory(name, originalGroup) {
    const n = name.toLowerCase();

    if (n.includes('lunch') || n.includes('tiffin') || n.includes('box')) return "Lunch Box";
    if (n.includes('bottle') || n.includes('flask') || n.includes('sipper')) return "Bottle";
    if (n.includes('knife') || n.includes('cutter') || n.includes('peeler') || n.includes('slicer') || n.includes('grater')) return "Knife & Cutter";
    if (n.includes('chopper') || n.includes('blender') || n.includes('beater')) return "Chopper";
    if (n.includes('mug') || n.includes('cup') || n.includes('glass')) return "Cups & Mugs";
    if (n.includes('masala') || n.includes('container') || n.includes('jar') || n.includes('storage')) return "Storage";
    if (n.includes('tray') || n.includes('plate') || n.includes('dining')) return "Dining & Serving";
    if (n.includes('stand') || n.includes('rack') || n.includes('holder')) return "Kitchen Organizers";
    if (n.includes('lighter') || n.includes('gas')) return "Gas Accessories";
    if (n.includes('stool')) return "Household";

    if (originalGroup === "Plastic kitchenware") return "General Kitchenware";
    
    return originalGroup;
}

// 🏷️ NEW BRAND DETECTION LOGIC
function getBrand(name, originalBrand) {
    const n = name.toLowerCase();
    const b = (originalBrand || "").toLowerCase();

    // Check MaxFresh
    if (n.includes('maxfresh') || b.includes('maxfresh')) {
        return "MaxFresh";
    }

    // Check Tibros (Includes "Tibros" OR "TB")
    if (n.includes('tibros') || b.includes('tibros') || n.includes('tb ') || n.startsWith('tb-') || n.startsWith('tb ')) {
        return "Tibros";
    }

    // Check Sigma
    if (n.includes('sigma') || b.includes('sigma')) {
        return "Sigma";
    }

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

        products.push({
            item_code: cols[0],
            item_name: itemName,
            description: cols[8] ? cols[8].replace(/^"|"$/g, '') : itemName,
            stock_uom: cols[4],
            standard_rate: parseFloat(cols[7]) || 0,
            item_group: getAutoCategory(itemName, originalGroup),
            brand: getBrand(itemName, originalBrand)
        });
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(products, null, 2));
    
    console.log(`✅ Success! Imported ${products.length} items.`);
    console.log(`📁 Saved to: src/data/products.json`);

  } catch (error) {
    console.error("❌ Import Failed:", error.message);
  }
}

importCsv();