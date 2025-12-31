import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const productsPath = path.join(process.cwd(), 'public/catalog.json');
        const imagesDir = path.join(process.cwd(), 'public/images/yarp/optimized');

        if (!fs.existsSync(productsPath)) {
            return NextResponse.json({ error: "Catalog file not found" }, { status: 404 });
        }

        const json = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
        const products = Array.isArray(json) ? json : (json.products || []);

        // Get list of existing images (normalized to lowercase)
        const existingImages = new Set<string>();
        if (fs.existsSync(imagesDir)) {
            const files = fs.readdirSync(imagesDir);
            files.forEach(file => existingImages.add(file.toLowerCase()));
        }

        let missingCount = 0;
        const missingItemCodes: string[] = [];

        products.forEach((p: any) => {
            // Check for WebP in new structure (fallback logic can be added if needed, but strict for now)
            const expectedFilename = `${p.item_code}.webp`.toLowerCase();
            if (!existingImages.has(expectedFilename)) {
                // Also check for legacy JPG in root if needed? 
                // For now, STRICT MODE: only count new optimized images
                missingCount++;
                missingItemCodes.push(p.item_code);
            }
        });

        return NextResponse.json({
            total: products.length,
            found: products.length - missingCount,
            missing: missingCount,
            missingItemCodes: missingItemCodes // Send this list to frontend for filtering
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}