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

// --- TYPES ---
export interface Product {
  item_code: string;
  item_name: string;
  item_group: string;
  standard_rate: number;
  brand?: string;
  description?: string;
  stock_uom?: string;
  imageVersion?: number;
  in_stock?: boolean;
  stock_qty?: number; // <--- ADDED
  threshold?: number; // <--- ADDED
}

export interface OrderItem {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
}

export interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    gst?: string;
    notes?: string;
  };
  items: OrderItem[];
  total: number;
  status: "Pending" | "Packed" | "Out for Delivery" | "Delivered" | "Cancelled";
  date: string;
  erp_synced?: boolean;
}

// --- FUNCTIONS ---

// 1. GET PRODUCTS
export async function getProducts(): Promise<Product[]> {
  try {
    const filePath = path.join(process.cwd(), 'src/data/products.json');
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error("Error reading products:", error);
  }
  return [];
}

// 2. UPDATE PRODUCT (Adjusted for stock fields and auto-OOS logic)
export async function updateProductLocal(itemCode: string, updates: Partial<Product>) {
    try {
        const filePath = path.join(process.cwd(), 'src/data/products.json');
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const products: Product[] = JSON.parse(fileContent);
            
            const updatedProducts = products.map(p => {
                if (p.item_code === itemCode) {
                    const updated = { ...p, ...updates };
                    // Ensure numerical fields are parsed as numbers
                    if (updates.stock_qty !== undefined) updated.stock_qty = Number(updates.stock_qty);
                    if (updates.threshold !== undefined) updated.threshold = Number(updates.threshold);
                    
                    // Auto-OOS logic (Mark out of stock if stock_qty is 0 or less)
                    if (updated.stock_qty !== undefined && updated.stock_qty <= 0) {
                        updated.in_stock = false;
                    }

                    return updated;
                }
                return p;
            });
            
            fs.writeFileSync(filePath, JSON.stringify(updatedProducts, null, 2));
            return true;
        }
    } catch (error) {
        console.error("Failed to update local JSON", error);
        throw new Error("Local Update Failed");
    }
}

// 3. GET ORDERS
export async function getOrders(): Promise<Order[]> {
  try {
    const filePath = path.join(process.cwd(), 'src/data/orders.json');
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent).reverse(); 
    }
  } catch (error) {
    console.error("Error reading orders:", error);
  }
  return [];
}

// 4. SAVE ORDER LOCAL
export async function saveOrderLocal(order: Order) {
  try {
    const filePath = path.join(process.cwd(), 'src/data/orders.json');
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    let orders: Order[] = [];
    if (fs.existsSync(filePath)) {
      orders = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    
    const existingIndex = orders.findIndex(o => o.id === order.id);
    if (existingIndex >= 0) {
        orders[existingIndex] = order;
    } else {
        orders.push(order);
    }

    fs.writeFileSync(filePath, JSON.stringify(orders, null, 2));
    return true;
  } catch (error) {
    console.error("Failed to save order locally:", error);
    throw new Error("Order Save Failed");
  }
}

// 5. UPDATE ORDER STATUS (Fixed: Explicit Error on missing file)
export async function updateOrderStatus(orderId: string, status: Order["status"]) {
  try {
    const filePath = path.join(process.cwd(), 'src/data/orders.json');
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const orders: Order[] = JSON.parse(fileContent);
      
      const updatedOrders = orders.map(o => 
        o.id === orderId ? { ...o, status } : o
      );
      
      fs.writeFileSync(filePath, JSON.stringify(updatedOrders, null, 2));
      return true;
    }
    throw new Error("Orders file not found");
  } catch (error) {
    console.error("Failed to update order status:", error);
    throw error;
  }
}

// 6. TEST ERP CONNECTION
export async function checkERPConnection() {
    try {
        await erp.get('/api/method/ping');
        return true;
    } catch (e) {
        return false;
    }
}

// 7. FIND OR CREATE CUSTOMER (ERPNext)
async function getOrCreateCustomer(phone: string, name: string) {
  try {
    const searchRes = await erp.get('/api/resource/Customer', {
      params: {
        filters: JSON.stringify([["mobile_no", "=", phone]]),
        fields: JSON.stringify(["name"])
      }
    });

    if (searchRes.data.data.length > 0) {
      return searchRes.data.data[0].name;
    }

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
    return "Walk-In Customer"; 
  }
}

// 8. PUSH ORDER TO ERPNEXT
export async function createSalesOrder(items: OrderItem[], customerData: any) {
  try {
    const customerId = await getOrCreateCustomer(customerData.phone, customerData.name);
    
    // Step 8a: Get Company Address
    let companyAddressName = process.env.ERP_COMPANY_ADDRESS || "";

    if (!companyAddressName) {
        try {
            const addrRes = await erp.get('/api/resource/Address', {
                params: {
                    filters: JSON.stringify([["is_your_company_address", "=", 1]]),
                    fields: JSON.stringify(["name"]),
                    limit: 1
                }
            });
            if (addrRes.data.data.length > 0) {
                companyAddressName = addrRes.data.data[0].name;
            }
        } catch (e) {
            console.warn("⚠️ Failed to auto-fetch Company Address.");
        }
    }

    if (!companyAddressName) {
        throw new Error("Configuration Error: 'Company Address' not found. Please set ERP_COMPANY_ADDRESS in .env file.");
    }

    // Future Date (Tomorrow)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 1);
    const dateStr = deliveryDate.toISOString().split('T')[0];

    const orderData = {
      customer: customerId,
      company_address: companyAddressName, // Uses the resolved address
      docstatus: 0, 
      transaction_date: new Date().toISOString().split('T')[0],
      delivery_date: dateStr,
      items: items.map((item) => ({
        item_code: item.item_code,
        qty: item.qty,
        rate: item.rate,
        delivery_date: dateStr
      })),
    };

    const response = await erp.post('/api/resource/Sales Order', orderData);
    return response.data.data;

  } catch (error: any) {
    // UPDATED: Use the specific validation error message from Frappe
    const frappeError = error.response?.data?.exc_type === 'ValidationError' 
        ? error.response.data.exception.split('ValidationError: ')[1]
        : error.response?.data?.message || error.message;

    const errorDetails = error.response?.data?.exc || frappeError || error.message;
    console.error("ERP Order Failed Detailed:", errorDetails);
    
    throw new Error(frappeError || JSON.stringify(errorDetails));
  }
}

// 9. DEDUCT INVENTORY ON ORDER (NEW Function)
export async function deductInventory(items: OrderItem[]) {
    try {
        const filePath = path.join(process.cwd(), 'src/data/products.json');
        if (!fs.existsSync(filePath)) return;

        let products: Product[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        const itemMap = new Map(items.map(item => [item.item_code, item.qty]));

        products = products.map(p => {
            const deductionQty = itemMap.get(p.item_code);
            if (deductionQty !== undefined && p.stock_qty !== undefined) {
                const newQty = Math.max(0, p.stock_qty - deductionQty);
                p.stock_qty = newQty;
                
                // Auto Mark OOS if deduction takes it to or below zero
                if (newQty <= 0) {
                    p.in_stock = false;
                }
            }
            return p;
        });

        fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
    } catch (error) {
        console.error("Failed to deduct inventory:", error);
    }
}