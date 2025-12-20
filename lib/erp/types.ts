/**
 * Type definitions for ERPNext sync system
 */

// Raw item data from ERPNext API
export interface ERPItem {
    item_code: string;
    item_name: string;
    item_group: string;
    description?: string;
    standard_rate: number;
    valuation_rate?: number;
    stock_uom?: string;
    brand?: string;
    image?: string;
    disabled: number;
    is_stock_item?: number;
}

// Image attachment from ERPNext
export interface ERPAttachment {
    name: string;
    file_name: string;
    file_url: string;
    is_private: number;
}

// Normalized product format for catalog
export interface NormalizedProduct {
    item_code: string;
    item_name: string;
    description: string;
    item_group: string;
    brand: string;
    standard_rate: number;
    wholesale_rate: number;
    stock_uom: string;
    images: string[]; // Public URLs to optimized images
    in_stock?: boolean;
    stock_qty?: number;
    threshold?: number;
    is_hot?: boolean;
}

// Sync configuration
export interface SyncConfig {
    erpUrl: string;
    apiKey: string;
    apiSecret: string;
    imageQuality: number;
    imageMaxWidth: number;
    gitAutoPush: boolean;
    outputPath: string;
    imagesPath: string;
}

// Sync result metadata
export interface SyncResult {
    success: boolean;
    itemsProcessed: number;
    itemsSkipped: number;
    imagesDownloaded: number;
    imagesOptimized: number;
    errors: string[];
    timestamp: string;
    duration: number; // milliseconds
}

// Sync statistics for logging
export interface SyncStats {
    totalItems: number;
    successfulItems: number;
    failedItems: number;
    totalImages: number;
    successfulImages: number;
    failedImages: number;
    startTime: number;
    endTime?: number;
}
