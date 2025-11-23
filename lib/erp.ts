import fs from 'fs';
import path from 'path';

export interface Product {
  item_code: string;
  item_name: string;
  description: string;
  stock_uom: string;
  standard_rate: number;
  item_group: string;
  brand?: string; // ✅ Added optional Brand field
}

export async function getProducts(): Promise<Product[]> {
  try {
    // Define path to the local JSON file
    const filePath = path.join(process.cwd(), 'src/data/products.json');
    
    // Read and parse the file
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error("Error reading local products file:", error);
  }

  return [];
}