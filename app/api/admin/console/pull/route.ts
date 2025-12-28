import { NextResponse } from 'next/server';
import { ERPFetcher } from '@/lib/erp/fetcher';
import fs from 'fs';
import path from 'path';

// Initialize ERP Fetcher
const erp = new ERPFetcher(
    process.env.ERP_NEXT_URL || '',
    process.env.ERP_API_KEY || '',
    process.env.ERP_API_SECRET || ''
);

const DATA_DIR = path.join(process.cwd(), 'data');
const SNAPSHOT_FILE = path.join(DATA_DIR, 'buying-snapshot.json');
const META_FILE = path.join(DATA_DIR, 'console-meta.json');
// Spec: Pulls allowed independently, but we enforce a reasonable rate-limit (e.g. 5 minutes) 
// to prevent spam, while pushes have the strict 12h limit.
const PULL_COOLDOWN_MINUTES = 5;

export async function POST() {
    try {
        // 0. Ensure data directory exists
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        // 1. Check Pull Cooldown (Rate Limiting)
        if (fs.existsSync(META_FILE)) {
            const meta = JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
            if (meta.lastPulledAt) {
                const lastPull = new Date(meta.lastPulledAt).getTime();
                const now = Date.now();
                const diffMinutes = (now - lastPull) / (1000 * 60);

                if (diffMinutes < PULL_COOLDOWN_MINUTES) {
                    return NextResponse.json({
                        success: false,
                        message: `Pull rate-limited. Try again in ${(PULL_COOLDOWN_MINUTES - diffMinutes).toFixed(1)} minutes.`
                    }, { status: 429 });
                }
            }
        }

        // 2. Fetch Live Data
        if (!process.env.ERP_NEXT_URL) {
            return NextResponse.json({ success: false, message: 'ERPNext not configured' }, { status: 500 });
        }
        const items = await erp.fetchBuyingItems();

        // 3. Save Snapshot
        fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(items, null, 2));

        // 4. Update Meta
        const meta = fs.existsSync(META_FILE) ? JSON.parse(fs.readFileSync(META_FILE, 'utf-8')) : {};
        meta.lastPulledAt = new Date().toISOString();
        if (!meta.lastPushedAt) meta.lastPushedAt = null; // Initialize checks
        fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2));

        return NextResponse.json({
            success: true,
            count: items.length,
            data: items,
            meta
        });

    } catch (error: any) {
        console.error('Pull API Error:', error.message);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
