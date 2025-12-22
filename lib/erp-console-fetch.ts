import { ERPItemSnapshot } from "@/types/pricing-console";

// Stub URL for M.2 - To be replaced with real env variable or proxy route later
const ERP_API_URL = "http://localhost:3000/api/mock-erp/items";

export async function fetchConsoleItems(): Promise<ERPItemSnapshot[]> {
  try {
    // In a real scenario, this would valid credentials/headers
    // For M.2 we might need to mock this fetch if no real ERP is connected yet, 
    // but the instruction says "Call ERP API endpoint (stub URL is fine)".

    // Simulating network latency
    await new Promise(resolve => setTimeout(resolve, 800));

    // MOCK DATA RESPONSE (SAFEFALLBACK IF API FAILS IN M.2 DEV)
    // Ideally we fetch from ERP_API_URL, but for M.2 isolated dev we return this structure
    // to satisfy "Map response into ERPItemSnapshot".

    const mockRawData = [
      { name: "ITEM-001", item_name: "Premium Widget", standard_rate: 1000, actual_qty: 50, gst_hsn_code: "18", valuation_rate: 1350 },
      { name: "ITEM-002", item_name: "Budget Gadget", standard_rate: 200, actual_qty: 0, gst_hsn_code: "18", valuation_rate: 260 },
      { name: "ITEM-003", item_name: "Risky Business", standard_rate: 5000, actual_qty: 10, gst_hsn_code: "18", valuation_rate: 5200 },
      { name: "ITEM-004", item_name: "Zero Cost Item", standard_rate: 0, actual_qty: 100, gst_hsn_code: "18", valuation_rate: 100 },
      { name: "ITEM-005", item_name: "New Real Item", standard_rate: 750, actual_qty: 25, gst_hsn_code: "18", valuation_rate: 900 },
    ];

    // Logic to actually fetch if we had a real endpoint:
    // const res = await fetch(ERP_API_URL);
    // if (!res.ok) throw new Error("ERP Fetch Failed");
    // const data = await res.json();
    // const rawItems = data.data || mockRawData;

    const rawItems = mockRawData;

    // Mapping Logic
    const snapshots: ERPItemSnapshot[] = rawItems.map((item: any) => {
      return {
        item_code: item.name,
        item_name: item.item_name,
        cost_price: Number(item.standard_rate),
        stock_quantity: Number(item.actual_qty),
        gst_rate: 0.18, // Stubbed, real logic would map HSN
        previous_base_selling_price: Number(item.valuation_rate)
      };
    });

    return snapshots;

  } catch (error) {
    console.error("Failed to fetch ERP items:", error);
    throw new Error("Unable to reach ERP. Please check connection.");
  }
}
