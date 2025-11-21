import { NextResponse } from "next/server";
import axios from 'axios';

export async function GET() {
  const erpClient = axios.create({
    baseURL: process.env.ERP_NEXT_URL,
    headers: {
      'Authorization': `token ${process.env.ERP_API_KEY}:${process.env.ERP_API_SECRET}`,
      'Content-Type': 'application/json',
    },
  });

  // CHANGED: Using "Nos" for everything to prevent 417 Errors
  const itemsToCreate = [
    { item_code: "RICE-BASMATI-25", item_name: "Premium Basmati Rice (25kg)", item_group: "All Item Groups", stock_uom: "Nos", standard_rate: 1250 },
    { item_code: "DAL-MASOOR-1KG", item_name: "Red Masoor Dal (1kg)", item_group: "All Item Groups", stock_uom: "Nos", standard_rate: 90 },
    { item_code: "SALT-TATA-1KG", item_name: "Tata Salt (1kg)", item_group: "All Item Groups", stock_uom: "Nos", standard_rate: 28 },
    { item_code: "SPICE-CHILLI-500", item_name: "Everest Red Chilli Powder (500g)", item_group: "All Item Groups", stock_uom: "Nos", standard_rate: 220 },
    // These two already exist, script will skip them
    { item_code: "OIL-SUNFLOWER-1L", item_name: "Fortune Sunflower Oil (1L)", item_group: "All Item Groups", stock_uom: "Nos", standard_rate: 145 },
    { item_code: "SOAP-DETTOL-4", item_name: "Dettol Soap Original (4x75g)", item_group: "All Item Groups", stock_uom: "Box", standard_rate: 160 },
  ];

  const results = [];

  for (const item of itemsToCreate) {
    try {
      // Check if item exists first
      try {
        await erpClient.get(`/api/resource/Item/${item.item_code}`);
        results.push(`Skipped: ${item.item_name} (Already Exists)`);
      } catch (e) {
        // If error (404), it doesn't exist, so create it
        await erpClient.post('/api/resource/Item', item);
        results.push(`✅ Created: ${item.item_name}`);
      }
    } catch (error: any) {
      // Capture the detailed error message from ERPNext
      const errorMsg = error.response?.data?.exception || error.message;
      results.push(`❌ Failed: ${item.item_name} - ${errorMsg}`);
    }
  }

  return NextResponse.json({ 
    message: "Seeding Attempt 2 Complete", 
    details: results 
  });
}