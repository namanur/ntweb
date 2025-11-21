import axios from 'axios';

const erpClient = axios.create({
  baseURL: process.env.ERP_NEXT_URL,
  headers: {
    'Authorization': `token ${process.env.ERP_API_KEY}:${process.env.ERP_API_SECRET}`,
    'Content-Type': 'application/json',
  },
});

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
    const response = await erpClient.get('/api/resource/Item', {
      params: {
        fields: '["item_code","item_name","description","stock_uom","standard_rate","item_group"]',
        filters: '[["disabled","=",0]]', 
        limit_page_length: 1000, // ✅ INCREASED LIMIT TO 1000 to catch all your products
      },
    });

    return response.data.data || []; 
  } catch (error) {
    console.error("Error fetching products from ERPNext:", error);
    return [];
  }
};