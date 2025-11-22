const fs = require('fs');
const path = require('path');

// CONFIGURATION
const ERP_URL = "http://localhost:8080"; // Local connection!
const API_KEY = "a739a7505a066e5";       // Replace with your ACTUAL Key
const API_SECRET = "8f78a5ce0da272f"; // Replace with your ACTUAL Secret

async function syncProducts() {
  console.log("🔄 Connecting to ERPNext...");

  try {
    // 1. Dynamic Import for 'node-fetch' (since it's an ESM module)
    const { default: fetch } = await import('node-fetch');

    // 2. Fetch Data
    const response = await fetch(`${ERP_URL}/api/resource/Item?fields=["item_code","item_name","description","stock_uom","standard_rate","item_group"]&filters=[["disabled","=",0]]&limit_page_length=1000`, {
      headers: {
        'Authorization': `token ${API_KEY}:${API_SECRET}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const json = await response.json();
    const products = json.data || [];

    // 3. Save to File
    const outputPath = path.join(__dirname, '../src/data/products.json');
    
    // Ensure folder exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));
    
    console.log(`✅ Success! Downloaded ${products.length} items.`);
    console.log(`Ns📁 Saved to: src/data/products.json`);

  } catch (error) {
    console.error("❌ Sync Failed:", error.message);
  }
}

syncProducts();