/**
 * Catalog builder module
 * Generates catalog.json from normalized products
 */

import fs from 'fs';
import path from 'path';
import { NormalizedProduct } from './types';

export interface CatalogMetadata {
    syncTimestamp: string;
    itemCount: number;
    version: string;
}

export interface Catalog {
    metadata: CatalogMetadata;
    products: NormalizedProduct[];
}

/**
 * Build and save catalog.json
 */
export async function buildCatalog(
    products: NormalizedProduct[],
    outputPath: string
): Promise<void> {
    console.log('📦 Building catalog...');

    // Sort products by category and name
    const sortedProducts = products.sort((a, b) => {
        if (a.item_group !== b.item_group) {
            return a.item_group.localeCompare(b.item_group);
        }
        return a.item_name.localeCompare(b.item_name);
    });

    // Create catalog with metadata
    const catalog: Catalog = {
        metadata: {
            syncTimestamp: new Date().toISOString(),
            itemCount: products.length,
            version: '1.0',
        },
        products: sortedProducts,
    };

    // Ensure output directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Write catalog to file
    fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2));

    console.log(`✅ Catalog saved to ${outputPath}`);
    console.log(`   Items: ${products.length}`);

    // Generate statistics
    const stats = generateStats(products);
    console.log(`   Categories: ${stats.categoryCount}`);
    console.log(`   Brands: ${stats.brandCount}`);
    console.log(`   Items with images: ${stats.itemsWithImages}`);
    console.log(`   Total images: ${stats.totalImages}`);
}

/**
 * Generate statistics from products
 */
function generateStats(products: NormalizedProduct[]) {
    const categories = new Set<string>();
    const brands = new Set<string>();
    let itemsWithImages = 0;
    let totalImages = 0;

    for (const product of products) {
        categories.add(product.item_group);
        brands.add(product.brand);

        if (product.images && product.images.length > 0) {
            itemsWithImages++;
            totalImages += product.images.length;
        }
    }

    return {
        categoryCount: categories.size,
        brandCount: brands.size,
        itemsWithImages,
        totalImages,
    };
}

/**
 * Validate catalog structure
 */
export function validateCatalog(catalogPath: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
        if (!fs.existsSync(catalogPath)) {
            errors.push('Catalog file does not exist');
            return { valid: false, errors };
        }

        const content = fs.readFileSync(catalogPath, 'utf-8');
        const catalog = JSON.parse(content);

        if (!catalog.metadata) {
            errors.push('Missing metadata');
        }

        if (!Array.isArray(catalog.products)) {
            errors.push('Products is not an array');
        }

        if (catalog.products.length === 0) {
            errors.push('Catalog is empty');
        }

    } catch (error: any) {
        errors.push(`Failed to validate catalog: ${error.message}`);
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
