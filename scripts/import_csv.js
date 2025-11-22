const fs = require('fs');
const path = require('path');

// CONFIGURATION
const CSV_FILE_PATH = path.join(__dirname, '../products.csv');
const OUTPUT_PATH = path.join(__dirname, '../src/data/products.json');

function parseCSVLine(line) {
    // Basic CSV parsing handling commas inside quotes
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

    // Skip header row (index 0) and process lines
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Columns based on your file: 
        // 0: item_code, 1: item_name, 2: item_group, 3: brand, 
        // 4: stock_uom, 5: hsn_code, 6: valuation_rate, 7: standard_rate, 8: description
        const cols = parseCSVLine(line);

        if (cols.length < 8) continue; // Skip malformed lines

        products.push({
            item_code: cols[0],
            item_name: cols[1].replace(/^"|"$/g, ''), // Remove surrounding quotes
            description: cols[8] ? cols[8].replace(/^"|"$/g, '') : cols[1],
            stock_uom: cols[4],
            standard_rate: parseFloat(cols[7]) || 0,
            item_group: cols[2]
        });
    }

    // Save to products.json
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(products, null, 2));
    
    console.log(`✅ Success! Imported ${products.length} items.`);
    console.log(`📁 Saved to: src/data/products.json`);

  } catch (error) {
    console.error("❌ Import Failed:", error.message);
  }
}

importCsv();
