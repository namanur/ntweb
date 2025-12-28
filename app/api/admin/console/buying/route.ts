import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), 'data');
const SNAPSHOT_FILE = path.join(DATA_DIR, 'buying-snapshot.json');
const META_FILE = path.join(DATA_DIR, 'console-meta.json');

export async function GET() {
    try {
        if (!fs.existsSync(SNAPSHOT_FILE)) {
            return NextResponse.json({
                success: false,
                message: 'No local snapshot found. Please perform an initial Pull.',
                code: 'NO_SNAPSHOT'
            }, { status: 404 });
        }

        const items = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf-8'));

        let meta = {};
        if (fs.existsSync(META_FILE)) {
            meta = JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
        }

        return NextResponse.json({ success: true, count: items.length, data: items, meta });

    } catch (error: any) {
        console.error('API Error:', error.message);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
