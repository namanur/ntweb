#!/usr/bin/env node
/**
 * Test script for ERPNext sync system
 * Performs dry-run validation without making changes
 */

import 'dotenv/config';
import { ERPFetcher } from './fetcher';
import { normalizeItem } from './normalizer';

async function test() {
    console.log('🧪 Testing ERPNext Sync System\n');

    // Check environment variables
    console.log('1️⃣  Checking configuration...');
    const erpUrl = process.env.ERP_NEXT_URL;
    const apiKey = process.env.ERP_API_KEY;
    const apiSecret = process.env.ERP_API_SECRET;

    if (!erpUrl || !apiKey || !apiSecret) {
        console.error('❌ Missing required environment variables:');
        if (!erpUrl) console.error('   - ERP_NEXT_URL');
        if (!apiKey) console.error('   - ERP_API_KEY');
        if (!apiSecret) console.error('   - ERP_API_SECRET');
        process.exit(1);
    }

    console.log(`   ERP URL: ${erpUrl}`);
    console.log('   API Key: ✓');
    console.log('   API Secret: ✓\n');

    // Test connection
    console.log('2️⃣  Testing ERPNext connection...');
    const fetcher = new ERPFetcher(erpUrl, apiKey, apiSecret);
    const connected = await fetcher.testConnection();

    if (!connected) {
        console.error('❌ Failed to connect to ERPNext');
        console.error('   Please check your ERP_NEXT_URL and credentials\n');
        process.exit(1);
    }
    console.log('   ✅ Connection successful\n');

    // Fetch sample items
    console.log('3️⃣  Fetching sample items...');
    try {
        const items = await fetcher.fetchItems();
        console.log(`   ✅ Fetched ${items.length} items\n`);

        if (items.length > 0) {
            // Test normalization on first item
            console.log('4️⃣  Testing normalization...');
            const sampleItem = items[0];
            console.log(`   Sample item: ${sampleItem.item_code} - ${sampleItem.item_name}`);

            const normalized = normalizeItem(sampleItem, []);
            console.log(`   Normalized category: ${normalized.item_group}`);
            console.log(`   Normalized brand: ${normalized.brand}`);
            console.log(`   ✅ Normalization working\n`);

            // Test attachment fetching
            console.log('5️⃣  Testing attachment fetching...');
            const attachments = await fetcher.fetchItemAttachments(sampleItem.item_code);
            console.log(`   Found ${attachments.length} attachments for ${sampleItem.item_code}`);
            if (attachments.length > 0) {
                console.log(`   Sample attachment: ${attachments[0].file_name}`);
            }
            console.log('   ✅ Attachment fetching working\n');
        }

        console.log('✅ All tests passed!');
        console.log('\nYou can now run the full sync with:');
        console.log('   npm run sync\n');

    } catch (error: any) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

test();
