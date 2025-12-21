export interface CartItem {
    item_code: string;
    qty: number;
    standard_rate: number;
    [key: string]: any;
}

// 1. MINIMUM QUANTITY RULE
export const MIN_QTY = 6;

// 2. DISCOUNT RULE
export const BULK_QTY_THRESHOLD = 24;
export const BULK_DISCOUNT_FACTOR = 0.975; // 2.5% Discount

/**
 * Calculates the effective rate for a single unit based on quantity.
 * Apply 2.5% discount if qty > 24.
 */
export function getEffectiveRate(qty: number, standardRate: number): number {
    if (qty > BULK_QTY_THRESHOLD) {
        return standardRate * BULK_DISCOUNT_FACTOR;
    }
    return standardRate;
}

/**
 * Calculates the bulk rate for a product (display only).
 */
export function calculateBulkRate(standardRate: number): number {
    return standardRate * BULK_DISCOUNT_FACTOR;
}

/**
 * Calculates the total price for a line item.
 */
export function calculateItemTotal(item: CartItem): number {
    const rate = getEffectiveRate(item.qty, item.standard_rate);
    return rate * item.qty;
}

/**
 * Calculates the total order amount.
 */
export function calculateOrderTotal(cart: CartItem[]): number {
    return cart.reduce((sum, item) => sum + calculateItemTotal(item), 0);
}

/**
 * Validates the cart against business rules.
 * Returns an array of error messages. Empty array means valid.
 */
export function validateCart(cart: CartItem[]): string[] {
    const errors: string[] = [];

    if (!cart || cart.length === 0) {
        errors.push("Cart is empty");
        return errors;
    }

    const invalidItems = cart.filter(item => item.qty < MIN_QTY);
    if (invalidItems.length > 0) {
        errors.push(`Minimum order quantity is ${MIN_QTY} per item.`);
    }

    return errors;
}
