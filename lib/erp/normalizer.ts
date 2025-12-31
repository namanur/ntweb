/**
 * Data normalization module
 * Transforms ERPNext data into standardized product format
 */

import { ERPItem, NormalizedProduct } from './types';

/**
 * Normalize an ERPNext item to the website's product format
 */
export function normalizeItem(erpItem: ERPItem, imageUrls: string[] = []): NormalizedProduct {
    const itemName = erpItem.item_name || erpItem.item_code;
    const standardRate = erpItem.standard_rate || 0;
    const wholesaleRate = erpItem.valuation_rate || 0;

    return {
        item_code: erpItem.item_code,
        item_name: itemName,
        description: erpItem.description || itemName,
        item_group: getAutoCategory(itemName, erpItem.item_group),
        brand: getBrand(itemName, erpItem.brand),
        standard_rate: standardRate,
        wholesale_rate: wholesaleRate,
        stock_uom: erpItem.stock_uom || 'PCS',
        images: imageUrls,
        in_stock: true, // Default to true, can be updated based on stock levels
        is_active: true,
    };
}

/**
 * Auto-categorize items based on name and original group
 * Reuses logic from scripts/sync_erp.ts
 */
function getAutoCategory(name: string, originalGroup: string): string {
    const n = name.toLowerCase();

    if (n.includes('lunch') || n.includes('tiffin')) return "Lunch Box";
    if (n.includes('bottle') || n.includes('flask') || n.includes('sipper') || n.includes('jug')) return "Bottle";
    if (n.includes('knife') || n.includes('cutter') || n.includes('peeler') || n.includes('slicer') || n.includes('grater') || n.includes('scissors')) return "Knife & Cutter";
    if (n.includes('chopper') || n.includes('blender') || n.includes('beater')) return "Chopper";
    if (n.includes('mug') || n.includes('cup') || n.includes('glass') || n.includes('tea')) return "Cups & Mugs";
    if (n.includes('tray') || n.includes('plate') || n.includes('dining') || n.includes('bowl') || n.includes('dinner')) return "Dining & Serving";
    if (n.includes('masala') || n.includes('container') || n.includes('jar') || n.includes('storage') || n.includes('canister') || n.includes('basket')) return "Storage & Boxes";
    if (n.includes('box') && !n.includes('packing')) return "Storage & Boxes";
    if (n.includes('stand') || n.includes('rack') || n.includes('holder') || n.includes('hook')) return "Kitchen Organizers";
    if (n.includes('stool') || n.includes('patla') || n.includes('chair') || n.includes('mat')) return "Household";
    if (n.includes('lighter') || n.includes('gas') || n.includes('trolley')) return "Gas Accessories";
    if (originalGroup === "Plastic kitchenware") return "General Kitchenware";

    return originalGroup || "General";
}

/**
 * Detect brand from item name or original brand
 * Reuses logic from scripts/sync_erp.ts
 */
function getBrand(name: string, originalBrand?: string): string {
    const n = name.toLowerCase();
    const b = (originalBrand || "").toLowerCase();

    if (n.includes('maxfresh') || b.includes('maxfresh')) return "MaxFresh";
    if (n.includes('tibros') || b.includes('tibros') || n.includes('tb ') || n.startsWith('tb-')) return "Tibros";
    if (n.includes('sigma') || b.includes('sigma')) return "Sigma";

    return originalBrand && originalBrand.trim() !== "" ? originalBrand : "Generic";
}

/**
 * Validate that a normalized product has all required fields
 */
export function validateProduct(product: NormalizedProduct): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!product.item_code) errors.push('Missing item_code');
    if (!product.item_name) errors.push('Missing item_name');
    if (!product.item_group) errors.push('Missing item_group');
    if (product.standard_rate === undefined || product.standard_rate < 0) {
        errors.push('Invalid standard_rate');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Batch normalize multiple items
 */
export function normalizeItems(
    erpItems: ERPItem[],
    imageMap: Map<string, string[]> = new Map()
): NormalizedProduct[] {
    const products: NormalizedProduct[] = [];
    const skipped: string[] = [];

    for (const item of erpItems) {
        try {
            const imageUrls = imageMap.get(item.item_code) || [];
            const product = normalizeItem(item, imageUrls);

            const validation = validateProduct(product);
            if (validation.valid) {
                products.push(product);
            } else {
                console.warn(`⚠️  Skipping ${item.item_code}: ${validation.errors.join(', ')}`);
                skipped.push(item.item_code);
            }
        } catch (error: any) {
            console.error(`❌ Error normalizing ${item.item_code}:`, error.message);
            skipped.push(item.item_code);
        }
    }

    if (skipped.length > 0) {
        console.log(`⚠️  Skipped ${skipped.length} items due to validation errors`);
    }

    return products;
}
