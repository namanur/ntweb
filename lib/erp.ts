import fs from 'fs';
import path from 'path';

export interface Product {
  item_code: string;
  item_name: string;
  description?: string;
  stock_uom: string;
  standard_rate: number;
  actual_qty?: number;
  item_group: string; 
}

export const getProducts = async (): Promise<Product[]> => {
  try {
    // Define path to the JSON file
    const filePath = path.join(process.cwd(), 'src/data/products.json');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.warn("⚠️ products.json not found. Returning empty list.");
      return [];
    }

    // Read and parse the file
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const products = JSON.parse(fileContents);

    return products;
  } catch (error) {
    console.error("❌ Error reading local product file:", error);
    return [];
  }
};