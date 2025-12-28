/**
 * ERPNext API fetcher module
 * Handles all interactions with ERPNext REST API
 */

import axios, { AxiosInstance } from 'axios';
import { ERPItem, ERPAttachment, BuyingItem } from './types';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

export class ERPFetcher {
    private client: AxiosInstance;
    private baseUrl: string;

    constructor(erpUrl: string, apiKey: string, apiSecret: string) {
        this.baseUrl = erpUrl;
        this.client = axios.create({
            baseURL: erpUrl,
            headers: {
                'Authorization': `token ${apiKey}:${apiSecret}`,
                'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 second timeout
        });
    }

    /**
     * Fetch all active items from ERPNext with pagination
     */
    async fetchItems(): Promise<ERPItem[]> {
        console.log('📥 Fetching items from ERPNext...');

        try {
            // 1. Fetch Items
            const itemsResponse = await this.retryRequest(async () => {
                return await this.client.get('/api/resource/Item', {
                    params: {
                        fields: JSON.stringify([
                            'item_code',
                            'item_name',
                            'item_group',
                            'description',
                            'standard_rate',
                            'valuation_rate',
                            'stock_uom',
                            'brand',
                            'image',
                            'disabled',
                            'is_stock_item'
                        ]),
                        filters: JSON.stringify([['disabled', '=', 0]]),
                        limit_page_length: 5000,
                    },
                });
            });
            const items: ERPItem[] = itemsResponse.data.data;

            // 2. Fetch Prices (Item Price)
            const TARGET_PRICE_LIST = "Standard Selling";

            console.log(`📥 Fetching prices (Price List: ${TARGET_PRICE_LIST})...`);

            const pricesResponse = await this.retryRequest(async () => {
                return await this.client.get('/api/resource/Item Price', {
                    params: {
                        fields: JSON.stringify(['item_code', 'price_list_rate', 'price_list', 'valid_from']),
                        filters: JSON.stringify([
                            ['price_list', '=', TARGET_PRICE_LIST],
                            ['selling', '=', 1]
                        ]),
                        limit_page_length: 5000
                    }
                });
            });

            const prices: any[] = pricesResponse.data.data || [];

            // 3. Map Prices to Items
            const priceMap = new Map<string, number>();
            prices.forEach(p => {
                priceMap.set(p.item_code, p.price_list_rate);
            });

            // 4. Merge
            const enrichedItems = items.map(item => {
                const realPrice = priceMap.get(item.item_code);
                if (realPrice !== undefined) {
                    return { ...item, standard_rate: realPrice };
                }
                return item; // Fallback to Item.standard_rate
            });

            console.log(`✅ Fetched ${enrichedItems.length} items from ERPNext (Prices merged)`);
            return enrichedItems;

        } catch (error: any) {
            console.error('❌ Failed to fetch items from ERPNext:', error.message);
            throw new Error(`ERPNext fetch failed: ${error.message}`);
        }
    }

    /**
     * Fetch image attachments for a specific item
     */
    async fetchItemAttachments(itemCode: string): Promise<ERPAttachment[]> {
        try {
            const response = await this.retryRequest(async () => {
                return await this.client.get('/api/resource/File', {
                    params: {
                        fields: JSON.stringify(['name', 'file_name', 'file_url', 'is_private']),
                        filters: JSON.stringify([
                            ['attached_to_doctype', '=', 'Item'],
                            ['attached_to_name', '=', itemCode]
                        ]),
                    },
                });
            });

            return response.data.data || [];
        } catch (error: any) {
            console.warn(`⚠️  Failed to fetch attachments for ${itemCode}:`, error.message);
            return [];
        }
    }

    /**
     * Download image binary data from ERPNext
     */
    async downloadImage(fileUrl: string): Promise<Buffer> {
        try {
            // Handle relative URLs
            const url = fileUrl.startsWith('http') ? fileUrl : `${this.baseUrl}${fileUrl}`;

            const response = await this.retryRequest(async () => {
                return await this.client.get(url, {
                    responseType: 'arraybuffer',
                });
            });

            return Buffer.from(response.data);
        } catch (error: any) {
            throw new Error(`Failed to download image from ${fileUrl}: ${error.message}`);
        }
    }

    /**
     * Retry a request with exponential backoff
     */
    private async retryRequest<T>(
        requestFn: () => Promise<T>,
        retries: number = MAX_RETRIES
    ): Promise<T> {
        try {
            return await requestFn();
        } catch (error: any) {
            if (retries > 0 && this.isRetryableError(error)) {
                const delay = RETRY_DELAY * (MAX_RETRIES - retries + 1);
                console.log(`⏳ Retrying in ${delay}ms... (${retries} retries left)`);
                await this.sleep(delay);
                return this.retryRequest(requestFn, retries - 1);
            }
            throw error;
        }
    }

    /**
     * Update Item Prices in ERPNext
     * Expects changes in format: { item_code: string, new_price: number }
     */
    async updatePrices(changes: any[]): Promise<any> {
        const results = { success: 0, failed: 0, errors: [] as string[] };

        console.log(`📤 Pushing ${changes.length} price updates to ERPNext...`);

        // Process sequentially to avoid rate limits, or use Promise.all for speed if server permits
        for (const change of changes) {
            try {
                const priceList = "Standard Selling";

                // 1. Search for existing price
                const searchRes = await this.client.get('/api/resource/Item Price', {
                    params: {
                        filters: JSON.stringify([
                            ['item_code', '=', change.item_code],
                            ['price_list', '=', priceList]
                        ]),
                        fields: JSON.stringify(['name', 'price_list_rate'])
                    }
                });

                const existing = searchRes.data.data[0];

                if (existing) {
                    // 2. Update existing record
                    await this.client.put(`/api/resource/Item Price/${existing.name}`, {
                        price_list_rate: change.new_price
                    });
                } else {
                    // 3. Create new record if it doesn't exist
                    await this.client.post('/api/resource/Item Price', {
                        item_code: change.item_code,
                        price_list: priceList,
                        price_list_rate: change.new_price
                    });
                }

                results.success++;
            } catch (error: any) {
                console.error(`❌ Failed to update ${change.item_code}:`, error.message);
                results.failed++;
                results.errors.push(`${change.item_code}: ${error.message}`);
            }
        }

        return results;
    }

    /**
     * Fetch raw item prices
     */
    async fetchItemPrices(priceList: string = "Standard Selling"): Promise<Record<string, number>> {
        try {
            const response = await this.client.get('/api/resource/Item Price', {
                params: {
                    fields: JSON.stringify(['item_code', 'price_list_rate']),
                    filters: JSON.stringify([['price_list', '=', priceList]]),
                    limit_page_length: 5000
                }
            });

            const priceMap: Record<string, number> = {};
            response.data.data.forEach((p: any) => {
                priceMap[p.item_code] = p.price_list_rate;
            });

            return priceMap;
        } catch (error: any) {
            console.error("Failed to fetch prices:", error.message);
            return {};
        }
    }

    /**
     * Check if error is retryable (network issues, timeouts, etc.)
     */
    private isRetryableError(error: any): boolean {
        if (!error.response) {
            // Network error, timeout, etc.
            return true;
        }

        const status = error.response.status;
        // Retry on 5xx server errors and 429 rate limiting
        return status >= 500 || status === 429;
    }

    /**
     * Sleep utility for retry delays
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Test connection to ERPNext
     */
    async testConnection(): Promise<boolean> {
        try {
            await this.client.get('/api/method/ping');
            console.log('✅ ERPNext connection successful');
            return true;
        } catch (error: any) {
            console.error('❌ ERPNext connection failed:', error.message);
            return false;
        }
    }

    /**
     * Fetch items enriched with Standard Buying Rate and Actual Stock
     */
    async fetchBuyingItems(): Promise<BuyingItem[]> {
        console.log('📥 Fetching Buying & Stock data from ERPNext...');
        try {
            // 1. Fetch Basic Items
            const itemsRes = await this.client.get('/api/resource/Item', {
                params: {
                    fields: JSON.stringify(['item_code', 'item_name', 'item_group', 'brand', 'modified']),
                    filters: JSON.stringify([['disabled', '=', 0], ['is_stock_item', '=', 1]]),
                    limit_page_length: 5000
                }
            });
            const items = itemsRes.data.data;

            // 2. Fetch Standard Buying Prices
            const pricesRes = await this.client.get('/api/resource/Item Price', {
                params: {
                    fields: JSON.stringify(['item_code', 'price_list_rate']),
                    filters: JSON.stringify([['price_list', '=', 'Standard Buying'], ['buying', '=', 1]]),
                    limit_page_length: 5000
                }
            });
            const priceMap = new Map(pricesRes.data.data.map((p: any) => [p.item_code, p.price_list_rate]));

            // 3. Fetch Stock (Bin)
            const binRes = await this.client.get('/api/resource/Bin', {
                params: {
                    fields: JSON.stringify(['item_code', 'actual_qty', 'stock_value']),
                    limit_page_length: 5000
                }
            });
            const binMap = new Map(binRes.data.data.map((b: any) => [
                b.item_code,
                { qty: b.actual_qty, value: b.stock_value }
            ]));

            // 4. Merge
            return items.map((item: any) => {
                const stock = binMap.get(item.item_code) as { qty: number, value: number } | undefined || { qty: 0, value: 0 };
                return {
                    item_code: item.item_code,
                    item_name: item.item_name,
                    item_group: item.item_group,
                    brand: item.brand,
                    current_buying_price: priceMap.get(item.item_code) || 0,
                    current_stock_qty: stock.qty,
                    current_stock_value: stock.value,
                    last_updated: item.modified
                };
            });

        } catch (e: any) {
            console.error("❌ Failed to fetch buying items:", e.message);
            throw e;
        }
    }

    /**
     * Batch Update Buying Prices (Item Price)
     */
    async updateBuyingPrices(updates: { item_code: string; price: number }[]) {
        const results = { success: 0, failed: 0, errors: [] as string[] };
        const PRICE_LIST = "Standard Buying";

        console.log(`📤 Updating ${updates.length} buying prices...`);

        for (const update of updates) {
            try {
                // Check specific price list entry
                const check = await this.client.get('/api/resource/Item Price', {
                    params: {
                        filters: JSON.stringify([
                            ['item_code', '=', update.item_code],
                            ['price_list', '=', PRICE_LIST]
                        ]),
                        fields: JSON.stringify(['name'])
                    }
                });

                if (check.data.data.length > 0) {
                    await this.client.put(`/api/resource/Item Price/${check.data.data[0].name}`, {
                        price_list_rate: update.price
                    });
                } else {
                    await this.client.post('/api/resource/Item Price', {
                        item_code: update.item_code,
                        price_list: PRICE_LIST,
                        buying: 1,
                        price_list_rate: update.price
                    });
                }
                results.success++;
            } catch (e: any) {
                results.failed++;
                results.errors.push(`Price for ${update.item_code}: ${e.message}`);
            }
        }
        return results;
    }

    /**
     * Batch Update Stock (Stock Reconciliation)
     * Creates ONE Stock Reconciliation document for all items
     */
    async updateStock(items: { item_code: string; qty: number; value: number }[]) {
        console.log(`__ Updating stock for ${items.length} items via Reconciliation...`);
        try {
            const payload = {
                doctype: "Stock Reconciliation",
                purpose: "Opening Stock",
                set_posting_time: 1,
                company: "Nandan Traders", // Hardcoded for now
                items: items.map(i => ({
                    item_code: i.item_code,
                    qty: i.qty,
                    valuation_rate: i.qty > 0 ? (i.value / i.qty) : 0
                }))
            };

            const res = await this.client.post('/api/resource/Stock Reconciliation', payload);

            // Submit the document to apply changes
            const docName = res.data.data.name;
            await this.client.put(`/api/resource/Stock Reconciliation/${docName}`, { docstatus: 1 });

            return { success: true, docName };
        } catch (e: any) {
            console.error("❌ Stock Reconciliation failed:", e.response?.data || e.message);
            return { success: false, error: e.message };
        }
    }
}
