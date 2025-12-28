#!/usr/bin/env node

/**
 * Main ERPNext sync script
 * Orchestrates the entire sync process from ERPNext to static catalog
 */

import 'dotenv/config';
import { execSync } from 'child_process';
import path from 'path';
import { ERPFetcher } from './fetcher';
import { ImageProcessor } from './image-processor';
import { normalizeItems } from './normalizer';
import { buildCatalog, validateCatalog } from './catalog-builder';
import { SyncConfig, SyncStats } from './types';

// Load configuration from environment
const config: SyncConfig = {
    erpUrl: process.env.ERP_NEXT_URL || 'http://127.0.0.1:8080',
    apiKey: process.env.ERP_API_KEY || '',
    apiSecret: process.env.ERP_API_SECRET || '',
    imageQuality: parseInt(process.env.SYNC_IMAGE_QUALITY || '80'),
    imageMaxWidth: parseInt(process.env.SYNC_IMAGE_MAX_WIDTH || '1200'),
    gitAutoPush: process.env.SYNC_GIT_AUTO_PUSH !== 'false',
    outputPath: path.join(process.cwd(), 'public/catalog.json'),
    imagesPath: path.join(process.cwd(), 'public/images/items'),
};

// Validate required configuration
if (!config.apiKey || !config.apiSecret) {
    console.error('❌ Missing required environment variables: ERP_API_KEY, ERP_API_SECRET');
    console.error('❌ Missing required environment variables: ERP_API_KEY, ERP_API_SECRET');
    throw new Error('Missing required environment variables');
}

/**
 * Main sync function
 */
async function sync() {
    const stats: SyncStats = {
        totalItems: 0,
        successfulItems: 0,
        failedItems: 0,
        totalImages: 0,
        successfulImages: 0,
        failedImages: 0,
        startTime: Date.now(),
    };

    console.log('🚀 Starting ERPNext Sync...');
    console.log(`   ERP URL: ${config.erpUrl}`);
    console.log(`   Output: ${config.outputPath}`);
    console.log(`   Images: ${config.imagesPath}`);
    console.log('');

    try {
        // Step 1: Initialize fetcher and test connection
        console.log('📡 Step 1: Testing ERPNext connection...');
        const fetcher = new ERPFetcher(config.erpUrl, config.apiKey, config.apiSecret);
        const connected = await fetcher.testConnection();

        if (!connected) {
            throw new Error('Failed to connect to ERPNext');
        }
        console.log('');

        // Step 2: Fetch all items from ERPNext
        console.log('📥 Step 2: Fetching items from ERPNext...');
        const erpItems = await fetcher.fetchItems();
        stats.totalItems = erpItems.length;

        if (erpItems.length === 0) {
            console.warn('⚠️  No items found in ERPNext');
            console.warn('⚠️  No items found in ERPNext');
            return stats;
        }
        console.log('');

        // Step 3: Process images for each item
        console.log('🖼️  Step 3: Processing images...');
        const imageProcessor = new ImageProcessor(
            fetcher,
            config.imagesPath,
            config.imageQuality,
            config.imageMaxWidth
        );

        const imageMap = new Map<string, string[]>();
        let processedCount = 0;

        for (const item of erpItems) {
            try {
                // Fetch attachments for this item
                const attachments = await fetcher.fetchItemAttachments(item.item_code);
                stats.totalImages += attachments.length;

                // Process images
                const imageUrls = await imageProcessor.processItemImages(item.item_code, attachments);
                stats.successfulImages += imageUrls.length;
                stats.failedImages += attachments.length - imageUrls.length;

                if (imageUrls.length > 0) {
                    imageMap.set(item.item_code, imageUrls);
                }

                processedCount++;

                // Progress indicator
                if (processedCount % 50 === 0) {
                    console.log(`   Processed ${processedCount}/${erpItems.length} items...`);
                }
            } catch (error: any) {
                console.error(`   ❌ Failed to process images for ${item.item_code}:`, error.message);
                stats.failedItems++;
            }
        }

        console.log(`   ✅ Processed ${processedCount} items`);
        console.log('');

        // Step 4: Normalize items
        console.log('🔄 Step 4: Normalizing product data...');
        const products = normalizeItems(erpItems, imageMap);
        stats.successfulItems = products.length;
        stats.failedItems = stats.totalItems - stats.successfulItems;
        console.log(`   ✅ Normalized ${products.length} products`);
        console.log('');

        // Step 5: Build catalog
        console.log('📦 Step 5: Building catalog...');
        await buildCatalog(products, config.outputPath);
        console.log('');

        // Step 6: Validate catalog
        console.log('✅ Step 6: Validating catalog...');
        const validation = validateCatalog(config.outputPath);
        if (!validation.valid) {
            throw new Error(`Catalog validation failed: ${validation.errors.join(', ')}`);
        }
        console.log('   ✅ Catalog is valid');
        console.log('');

        // Step 7: Cleanup old images
        console.log('🗑️  Step 7: Cleaning up old images...');
        const itemCodes = new Set(products.map(p => p.item_code));
        await imageProcessor.cleanupOldImages(itemCodes);
        console.log('');

        // Step 8: Git commit and push
        if (config.gitAutoPush) {
            console.log('📤 Step 8: Committing and pushing to GitHub...');
            try {
                gitCommitAndPush();
                console.log('   ✅ Changes pushed to GitHub');
            } catch (error: any) {
                console.error('   ⚠️  Git push failed:', error.message);
                console.error('   You may need to manually commit and push changes');
            }
        } else {
            console.log('⏭️  Step 8: Skipping git push (disabled in config)');
        }
        console.log('');

        // Final statistics
        stats.endTime = Date.now();
        printStats(stats);

        console.log('');
        console.log('✅ Sync completed successfully!');
        console.log('✅ Sync completed successfully!');
        return stats;

    } catch (error: any) {
        console.error('');
        console.error('❌ Sync failed:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        if (error.stack) {
            console.error(error.stack);
        }
        throw error;
    }
}

/**
 * Commit and push changes to git
 */
function gitCommitAndPush() {
    const timestamp = new Date().toISOString();
    const message = `Sync from ERPNext: ${timestamp}`;

    try {
        // Stage changes
        execSync('git add public/catalog.json public/images/items/', { stdio: 'inherit' });

        // Commit
        try {
            execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
        } catch (error) {
            // No changes to commit
            console.log('   (No changes to commit)');
            return;
        }

        // Push
        execSync('git push origin main', { stdio: 'inherit' });
    } catch (error: any) {
        throw new Error(`Git operation failed: ${error.message}`);
    }
}

/**
 * Print sync statistics
 */
function printStats(stats: SyncStats) {
    const duration = stats.endTime ? (stats.endTime - stats.startTime) / 1000 : 0;

    console.log('📊 Sync Statistics:');
    console.log('   ─────────────────────────────────');
    console.log(`   Total Items:       ${stats.totalItems}`);
    console.log(`   Successful:        ${stats.successfulItems}`);
    console.log(`   Failed:            ${stats.failedItems}`);
    console.log(`   Total Images:      ${stats.totalImages}`);
    console.log(`   Images Processed:  ${stats.successfulImages}`);
    console.log(`   Images Failed:     ${stats.failedImages}`);
    console.log(`   Duration:          ${duration.toFixed(2)}s`);
    console.log('   ─────────────────────────────────');
}

// Run sync if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    sync().catch(() => process.exit(1));
}

export { sync };
