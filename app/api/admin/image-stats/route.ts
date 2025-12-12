import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const productsPath = path.join(process.cwd(), 'src/data/products.json');
        const imagesDir = path.join(process.cwd(), 'public/images');

        if (!fs.existsSync(productsPath)) {
            return NextResponse.json({ error: "Products file not found" }, { status: 404 });
        }

        const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
        
        // Get list of existing images (normalized to lowercase)
        const existingImages = new Set<string>();
        if (fs.existsSync(imagesDir)) {
            const files = fs.readdirSync(imagesDir);
            files.forEach(file => existingImages.add(file.toLowerCase()));
        }

        let missingCount = 0;
        const missingItemCodes: string[] = [];

        products.forEach((p: any) => {
            const expectedFilename = `${p.item_code}.jpg`.toLowerCase();
            if (!existingImages.has(expectedFilename)) {
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