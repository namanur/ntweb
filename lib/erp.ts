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
  wholesale_rate?: number;
  brand?: string;
  description?: string;
  stock_uom?: string;
  imageVersion?: number;
  in_stock?: boolean;
  stock_qty?: number;
  threshold?: number;
  images?: string[];
  is_hot?: boolean; // ✅ NEW: Support for Hot/New items
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

// 2. UPDATE PRODUCT
export async function updateProductLocal(itemCode: string, updates: Partial<Product>) {
  try {
    const filePath = path.join(process.cwd(), 'src/data/products.json');
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const products: Product[] = JSON.parse(fileContent);

      const updatedProducts = products.map(p => {
        if (p.item_code === itemCode) {
          const updated = { ...p, ...updates };
          if (updates.stock_qty !== undefined) updated.stock_qty = Number(updates.stock_qty);
          if (updates.threshold !== undefined) updated.threshold = Number(updates.threshold);

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

// 5. UPDATE ORDER STATUS
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
    let companyAddressName = process.env.ERP_COMPANY_ADDRESS;

    if (!companyAddressName) {
      // Use cached company details if available to find the address name, 
      // OR try to fetch it dynamically if not found.
      try {
        // Try to find address tagged as 'is_your_company_address' 
        const addrRes = await erp.get('/api/resource/Address', {
          params: {
            filters: JSON.stringify([["is_your_company_address", "=", 1]]),
            fields: JSON.stringify(["name"]),
            limit: 1
          }
        });
        if (addrRes.data.data.length > 0) {
          companyAddressName = addrRes.data.data[0].name;
        } else {
          // Fallback: Try to find address linked to the Company
          const companyRes = await erp.get('/api/resource/Company', { params: { limit: 1 } });
          if (companyRes.data.data.length > 0) {
            const companyName = companyRes.data.data[0].name;
            // Find address for this company
            const compAddrRes = await erp.get('/api/resource/Address', {
              params: {
                filters: JSON.stringify([["links", "like", `%${companyName}%`]]),
                fields: JSON.stringify(["name"]),
                limit: 1
              }
            });
            if (compAddrRes.data.data.length > 0) {
              companyAddressName = compAddrRes.data.data[0].name;
            }
          }
        }
      } catch (e) {
        console.warn("⚠️ Failed to auto-fetch Company Address.");
      }
    }

    if (!companyAddressName) {
      console.warn("⚠️ 'Company Address' not found in ERP. Order sync might fail if ERP requires it. Proceeding without it.");
      // We do NOT throw here anymore, let ERPNext decide if it wants to reject it.
      // Some configurations might auto-assign address.
    }

    // Future Date (Tomorrow)
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 1);
    const dateStr = deliveryDate.toISOString().split('T')[0];

    const orderData = {
      customer: customerId,
      company_address: companyAddressName,
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
    const frappeError = error.response?.data?.exc_type === 'ValidationError'
      ? error.response.data.exception.split('ValidationError: ')[1]
      : error.response?.data?.message || error.message;

    const errorDetails = error.response?.data?.exc || frappeError || error.message;
    console.error("ERP Order Failed Detailed:", errorDetails);
    if (error.config) console.error("Failed URL:", error.config.url);
    if (error.response?.data) console.error("Full Response:", JSON.stringify(error.response.data, null, 2));

    throw new Error(frappeError || JSON.stringify(errorDetails));
  }
}

// 9. DEDUCT INVENTORY ON ORDER
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

// 10. SYNC COMPANY DETAILS
export async function syncCompanyDetails() {
  try {
    // Fetch Company Info
    const companyRes = await erp.get('/api/resource/Company', {
      params: { limit_page_length: 1 }
    });

    if (companyRes.data.data.length === 0) return;
    const companyName = companyRes.data.data[0].name;

    // Fetch Address
    let addressData = {
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      pincode: "",
      phone: "",
      gstin: "" // Not always available in standard Address
    };

    const addrRes = await erp.get('/api/resource/Address', {
      params: {
        filters: JSON.stringify([["is_your_company_address", "=", 1]]),
        fields: JSON.stringify(["address_line1", "address_line2", "city", "state", "pincode", "phone", "gstin"])
      }
    });

    if (addrRes.data.data.length > 0) {
      addressData = { ...addressData, ...addrRes.data.data[0] };
    } else {
      // Fallback to find any address linked to this company
      const compAddrRes = await erp.get('/api/resource/Address', {
        params: {
          filters: JSON.stringify([["links", "like", `%${companyName}%`]]),
          fields: JSON.stringify(["address_line1", "address_line2", "city", "state", "pincode", "phone"])
        }
      });
      if (compAddrRes.data.data.length > 0) {
        addressData = { ...addressData, ...compAddrRes.data.data[0] };
      }
    }

    // Save to JSON
    const dataToSave = {
      name: companyName,
      address_line1: addressData.address_line1,
      address_line2: `${addressData.city}, ${addressData.state} - ${addressData.pincode}`,
      gstin: addressData.gstin || "NOT SET",
      phone: addressData.phone || ""
    };

    const filePath = path.join(process.cwd(), 'src/data/company.json');
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
    console.log("✅ Company details synced.");
    return true;

  } catch (error) {
    console.error("Failed to sync company details:", error);
    return false;
  }
}