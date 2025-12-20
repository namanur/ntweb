/**
 * ERPNext API fetcher module
 * Handles all interactions with ERPNext REST API
 */

import axios, { AxiosInstance } from 'axios';
import { ERPItem, ERPAttachment } from './types';

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
            const response = await this.retryRequest(async () => {
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
                        limit_page_length: 5000, // Fetch up to 5000 items
                    },
                });
            });

            const items: ERPItem[] = response.data.data;
            console.log(`✅ Fetched ${items.length} items from ERPNext`);
            return items;
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
}
