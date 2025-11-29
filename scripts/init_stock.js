const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/products.json');

try {
  const raw = fs.readFileSync(filePath, 'utf8');
  const products = JSON.parse(raw);

  const updatedProducts = products.map(p => ({
    ...p,
    // Add these fields if they don't exist
    in_stock: p.in_stock !== undefined ? p.in_stock : true,
    stock_qty: p.stock_qty !== undefined ? p.stock_qty : 10,
    threshold: p.threshold !== undefined ? p.threshold : 2
  }));

  fs.writeFileSync(filePath, JSON.stringify(updatedProducts, null, 2));
  console.log(`✅ Updated ${updatedProducts.length} products with stock fields.`);
} catch (error) {
  console.error("Error updating stock:", error);
}