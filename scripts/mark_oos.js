const fs = require('fs');
const path = require('path');

// Adjust path if necessary
const file = path.join(__dirname, '../src/data/products.json'); 

if (!process.argv[2]) {
  console.error('❌ Usage: node scripts/mark_oos.js <ITEM_CODE>');
  process.exit(1);
}

const sku = process.argv[2].trim().toUpperCase();

try {
  const raw = fs.readFileSync(file, 'utf8');
  const products = JSON.parse(raw);
  let found = false;

  const updated = products.map(p => {
    if (p.item_code && p.item_code.toUpperCase() === sku) {
      found = true;
      return { ...p, in_stock: false, stock_qty: 0 };
    }
    return p;
  });

  if (!found) {
    console.error(`❌ SKU "${sku}" not found.`);
    process.exit(2);
  }

  fs.writeFileSync(file, JSON.stringify(updated, null, 2), 'utf8');
  console.log(`✅ Success! Marked "${sku}" as Out of Stock.`);

} catch (err) {
  console.error("Error:", err.message);
}
