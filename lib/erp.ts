import axios from 'axios';
import fs from 'fs';
import path from 'path';

// --- CONFIGURATION ---
const ERP_URL = process.env.ERP_NEXT_URL || "http://127.0.0.1:8080";
const API_KEY = process.env.ERP_API_KEY;
const API_SECRET = process.env.ERP_API_SECRET;

const erp = axios.create({
  baseURL: ERP_URL,
  headers: {
    'Authorization': `token ${API_KEY}:${API_SECRET}`,
    'Content-Type': 'application/json',
  },
});

export interface Product {
  item_code: string;
  item_name: string;
  item_group: string;
  standard_rate: number;
  brand?: string;
  description?: string;
  stock_uom?: string;
}

// 1. GET PRODUCTS (FROM LOCAL JSON FILE)
export async function getProducts(): Promise<Product[]> {
  try {
    const filePath = path.join(process.cwd(), 'src/data/products.json');
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error("Error reading local products file:", error);
  }
  return [];
}

// 2. UPDATE PRODUCT (LOCAL JSON + OPTIONAL ERP SYNC)
export async function updateProductLocal(itemCode: string, updates: Partial<Product>) {
    try {
        const filePath = path.join(process.cwd(), 'src/data/products.json');
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const products: Product[] = JSON.parse(fileContent);
            
            const updatedProducts = products.map(p => 
                p.item_code === itemCode ? { ...p, ...updates } : p
            );
            
            fs.writeFileSync(filePath, JSON.stringify(updatedProducts, null, 2));
            return true;
        }
    } catch (error) {
        console.error("Failed to update local JSON", error);
        throw new Error("Local Update Failed");
    }
}

// 3. FIND OR CREATE CUSTOMER (ERPNext)
async function getOrCreateCustomer(phone: string, name: string) {
  try {
    // Search
    const searchRes = await erp.get('/api/resource/Customer', {
      params: {
        filters: JSON.stringify([["mobile_no", "=", phone]]),
        fields: JSON.stringify(["name"])
      }
    });

    if (searchRes.data.data.length > 0) {
      return searchRes.data.data[0].name;
    }

    // Create
    const newCustomer = {
      customer_name: name,
      customer_type: "Individual",
      customer_group: "All Customer Groups",
      territory: "All Territories",
      mobile_no: phone
    };

    const createRes = await erp.post('/api/resource/Customer', newCustomer);
    return createRes.data.data.name;

  } catch (error) {
    console.error("ERP Customer Error (Using Fallback):", error);
    return "Walk-In Customer"; // Ensure this exists in ERPNext!
  }
}

// 4. PUSH ORDER TO ERPNEXT
export async function createSalesOrder(cart: any[], customerData: any) {
  try {
    const customerId = await getOrCreateCustomer(customerData.phone, customerData.name);
    
    // Future Date (Tomorrow)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 1);
    const dateStr = deliveryDate.toISOString().split('T')[0];

    const orderData = {
      customer: customerId,
      docstatus: 0, // Draft
      transaction_date: new Date().toISOString().split('T')[0],
      delivery_date: dateStr,
      items: cart.map((item: any) => ({
        item_code: item.item_code,
        qty: item.qty,
        rate: item.standard_rate,
        delivery_date: dateStr
      })),
      // We can put address in a hidden field or specific address doctype logic later
      // For now, simple order creation
    };

    const response = await erp.post('/api/resource/Sales Order', orderData);
    return response.data.data;

  } catch (error: any) {
    console.error("ERP Order Failed:", error.response?.data || error.message);
    throw new Error("ERP Order Failed"); // Frontend will see this
  }
}