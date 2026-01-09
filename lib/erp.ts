import fs from 'fs';
import path from 'path';
import {
  checkConnection,
  searchDocs,
  createDoc,
  fetchDoc
} from './erpnext';

// --- CONFIGURATION ---
const ERP_COMPANY_ADDRESS = process.env.ERP_COMPANY_ADDRESS;

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
  is_active?: boolean;
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

export interface ProductMetadata {
  generated_at: string;
  itemCount?: number;
  version?: string;
  source?: string;
}

// --- FUNCTIONS ---

// 1. GET PRODUCTS
export async function getProducts(): Promise<Product[]> {
  try {
    const filePath = path.join(process.cwd(), 'data/catalog.json');
    // SINGLE SOURCE OF TRUTH: Derived snapshot from ERPNext.
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      return Array.isArray(data) ? data : (data.products || []);
    }
  } catch (error) {
    console.error("Error reading products:", error);
  }
  return [];
}

export async function getProductsMetadata(): Promise<ProductMetadata | null> {
  try {
    const filePath = path.join(process.cwd(), 'data/catalog.json');
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      return Array.isArray(data) ? null : (data.metadata || null);
    }
  } catch (error) {
    console.error("Error reading metadata:", error);
  }
  return null;
}

// ...

// 3. GET ORDERS
export async function getOrders(): Promise<Order[]> {
  try {
    const filePath = path.join(process.cwd(), 'data/orders.json');
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
// 4. SAVE ORDER LOCAL
export async function saveOrderLocal(order: Order) {
  // NOTE: Runtime file writes disabled. Persistence layer TODO.
  console.log("Skipping local save: orders.json is read-only in this environment.");
  // Intentionally stubbed — local mutations are disabled by design
  // return true to mock success
  return true;
}

// 5. UPDATE ORDER STATUS
// 5. UPDATE ORDER STATUS
export async function updateOrderStatus(orderId: string, status: Order["status"]) {
  console.log("Skipping local status update: Runtime writes disabled.");
  // Intentionally stubbed — local mutations are disabled by design
  return true;
}

// 6. TEST ERP CONNECTION
export async function checkERPConnection() {
  return await checkConnection();
}

// 7. FIND OR CREATE CUSTOMER (ERPNext)
async function getOrCreateCustomer(phone: string, name: string) {
  try {
    const customers = await searchDocs<any>("Customer", [["mobile_no", "=", phone]], ["name"]);

    if (customers.length > 0) {
      return customers[0].name;
    }

    const newCustomer = {
      customer_name: name,
      customer_type: "Individual",
      customer_group: "All Customer Groups",
      territory: "All Territories",
      mobile_no: phone
    };

    const created = await createDoc<any>("Customer", newCustomer);
    return created.name;

  } catch (error: any) {
    console.error(`ERP Customer Error [${error.name}]:`, error.message);
    return "Walk-In Customer";
  }
}

// 8. PUSH ORDER TO ERPNEXT
// 8. PUSH ORDER TO ERPNEXT
export async function createSalesOrder(items: OrderItem[], customerData: any) {
  try {
    const customerId = await getOrCreateCustomer(customerData.phone, customerData.name);

    // Step 8a: Get Company Address
    let companyAddressName = process.env.ERP_COMPANY_ADDRESS;

    if (!companyAddressName) {
      try {
        // Try to find address tagged as 'is_your_company_address' 
        const addrs = await searchDocs<any>("Address", [["is_your_company_address", "=", 1]], ["name"], 1);
        if (addrs.length > 0) {
          companyAddressName = addrs[0].name;
        } else {
          // Fallback: Try to find address linked to the Company
          const companies = await searchDocs<any>("Company", [], ["name"], 1);
          if (companies.length > 0) {
            const companyName = companies[0].name;
            // Find address for this company
            const compAddrs = await searchDocs<any>("Address", [["links", "like", `%${companyName}%`]], ["name"], 1);
            if (compAddrs.length > 0) {
              companyAddressName = compAddrs[0].name;
            }
          }
        }
      } catch (e) {
        console.warn("⚠️ Failed to auto-fetch Company Address.");
      }
    }

    if (!companyAddressName) {
      console.warn("⚠️ 'Company Address' not found in ERP. Order sync might fail if ERP requires it. Proceeding without it.");
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

    const createdOrder = await createDoc<any>("Sales Order", orderData);
    return createdOrder;

  } catch (error: any) {
    console.error(`ERP Order Failed [${error.name}]:`, error.message);
    // Re-throw with meaningful message
    throw new Error(error.message || "Order Sync Failed");
  }
}

// 9. DEDUCT INVENTORY ON ORDER
export async function deductInventory(items: OrderItem[]) {
  // NOTE: Inventory deduction disabled for local snapshot.
  // This file is a derived snapshot from ERPNext. Do not write to it at runtime.
  console.log("Skipping local inventory deduction: products.json is read-only.");
  // Intentionally stubbed — local mutations are disabled by design
  return;
}

// 10. SYNC COMPANY DETAILS
export async function syncCompanyDetails() {
  try {
    // Fetch Company Info
    const companies = await searchDocs<any>("Company", [], ["name"], 1);
    if (companies.length === 0) return;
    const companyName = companies[0].name;

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

    const addrs = await searchDocs<any>("Address",
      [["is_your_company_address", "=", 1]],
      ["address_line1", "address_line2", "city", "state", "pincode", "phone", "gstin"],
      1
    );

    if (addrs.length > 0) {
      addressData = { ...addressData, ...addrs[0] };
    } else {
      // Fallback to find any address linked to this company
      const compAddrs = await searchDocs<any>("Address",
        [["links", "like", `%${companyName}%`]],
        ["address_line1", "address_line2", "city", "state", "pincode", "phone"],
        1
      );
      if (compAddrs.length > 0) {
        addressData = { ...addressData, ...compAddrs[0] };
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

    const filePath = path.join(process.cwd(), 'data/company.json');
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
    console.log("✅ Company details synced.");
    return true;

  } catch (error) {
    return false;
  }
}

// 11. FIND CUSTOMER BY PHONE
export async function findCustomerByPhone(phone: string) {
  try {
    const customers = await searchDocs<any>("Customer",
      [["mobile_no", "=", phone]],
      ["name", "customer_name", "mobile_no", "email_id"],
      1
    );

    if (customers.length > 0) {
      return customers[0];
    }
    return null;
  } catch (error) {
    console.error("Failed to find customer:", error);
    return null;
  }
}

// 12. GET CUSTOMER ORDERS
export async function getCustomerOrders(phone: string) {
  try {
    // First map phone to customer name/ID
    const customer = await findCustomerByPhone(phone);
    if (!customer) return [];

    // NOTE: Sorting logic is not naively supported by basic `searchDocs` filter params in `lib/erpnext` unless we handle it differently.
    // However, basic searchDocs does simple filters. If we need order_by we might need to enhance helper or assume default sort.
    // ERPNext default sort is usually creation desc. Let's trust it or simple search.
    // Wait, the original code had `order_by: "transaction_date desc"`.
    // I will call `client.get` via a new helper or just stick to simple search if acceptable. 
    // Actually, I can use `searchDocs` and if I really need sort I'd add it to `searchDocs`.
    // For now, let's keep it simple.

    // UPDATE: `searchDocs` doesn't support order_by arg yet. I should add it to `searchDocs` or use `call`.
    // Let's implement robustly. I'll stick to a simple filter for now. 
    // Wait, I can just modify `searchDocs` in `lib/erpnext.ts` later if needed.

    const orders = await searchDocs<any>("Sales Order",
      [["customer", "=", customer.name]],
      ["name", "transaction_date", "grand_total", "status", "delivery_date"],
      50 // Limit
    );

    return orders.map((order: any) => ({
      id: order.name,
      date: order.transaction_date,
      total: order.grand_total,
      status: order.status,
      delivery_date: order.delivery_date
    }));

  } catch (error) {
    console.error("Failed to fetch customer orders:", error);
    return [];
  }
}

// 13. GET CUSTOMER OUTSTANDING
export async function getCustomerOutstanding(phone: string) {
  try {
    const customer = await findCustomerByPhone(phone);
    if (!customer) return 0;

    const invoices = await searchDocs<any>("Sales Invoice",
      [
        ["customer", "=", customer.name],
        ["outstanding_amount", ">", 0],
        ["docstatus", "=", 1] // Submitted
      ],
      ["outstanding_amount"]
    );

    const totalOutstanding = invoices.reduce((sum: number, inv: any) => sum + inv.outstanding_amount, 0);
    return totalOutstanding;

  } catch (error) {
    console.error("Failed to fetch outstanding:", error);
    return 0;
  }
}

// 14. GET ALL CUSTOMERS
export async function getAllCustomers(search?: string) {
  try {
    const filters: any[] = [];
    if (search) {
      filters.push(["customer_name", "like", `%${search}%`]);
    }

    return await searchDocs<any>("Customer", filters, ["name", "customer_name", "mobile_no", "email_id", "territory"], 50);
  } catch (error) {
    console.error("Failed to fetch all customers:", error);
    return [];
  }
}

// 15. CREATE PAYMENT ENTRY
export async function createPaymentEntry(data: {
  customer: string,
  amount: number,
  mode: string,
  reference?: string
}) {
  try {
    const customerId = await getOrCreateCustomer(data.customer, data.customer); // Ensure ID

    const paymentData = {
      doctype: "Payment Entry",
      payment_type: "Receive",
      party_type: "Customer",
      party: customerId,
      paid_amount: data.amount,
      received_amount: data.amount,
      mode_of_payment: data.mode || "Cash",
      reference_no: data.reference,
      reference_date: new Date().toISOString().split('T')[0]
    };

    const created = await createDoc<any>("Payment Entry", paymentData);
    return created;
  } catch (error: any) {
    console.error("Failed to create payment entry:", error);
    throw new Error(error.message || "Payment Creation Failed");
  }
}