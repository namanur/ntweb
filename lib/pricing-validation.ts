
import { PricingInput, PricingOutput } from './pricing-engine';

export type ValidationStatus = 'PASS' | 'WARN' | 'BLOCK';

export type ValidationResult = {
    status: ValidationStatus;
    messages: string[];
};

export type ValidationContext = {
    previous_base_selling_price?: number; // From ERP, if available
};

export type ValidationInput = {
    cost_price: number;
    gst_rate: 0.05 | 0.18 | number; // Allowing number to catch invalid inputs
    stock_quantity: number;
    calculated_pricing?: PricingOutput; // If pricing calc succeeded
};

/**
 * Validates pricing and stock data against safety rules.
 * Returns a BLOCK status if any critical rule is violated.
 * Returns a WARN status if manual confirmation is needed.
 * Returns PASS if all safe.
 */
export function validateItem(
    input: ValidationInput,
    context: ValidationContext = {}
): ValidationResult {
    const messages: string[] = [];
    let status: ValidationStatus = 'PASS';

    const { cost_price, gst_rate, stock_quantity, calculated_pricing } = input;

    // --- 1. Cost Price Rules ---
    if (!Number.isFinite(cost_price) || cost_price <= 0) {
        // If CP is 0 or invalid, it's a BLOCK for pricing sync, logic handles OOS elsewhere?
        // "Zero cost -> auto Out of Stock", "Zero cost items cannot sync"
        // So this is a BLOCK for the *pricing sync* specifically.
        return { status: 'BLOCK', messages: ['Cost Price must be positive and non-zero'] };
    }

    // --- 3. GST Rules (Check early) ---
    if (gst_rate !== 0.05 && gst_rate !== 0.18) {
        return { status: 'BLOCK', messages: [`Invalid GST Rate: ${gst_rate}. Must be 0.05 or 0.18`] };
    }

    // Stock Validation
    if (!Number.isInteger(stock_quantity) || stock_quantity < 0) {
        return { status: 'BLOCK', messages: ['Stock must be a non-negative integer'] };
    }
    // Note: Stock === 0 is valid, just results in OOS. Not a validator block.

    // If we don't have calculated pricing (e.g. engine failed), block
    if (!calculated_pricing) {
        return { status: 'BLOCK', messages: ['Pricing calculation missing'] };
    }

    const { effective_margin_percent, base_selling_price } = calculated_pricing;

    // --- 2. Margin Sanity Rules ---
    const margin_pct = effective_margin_percent * 100;

    if (effective_margin_percent < 0) {
        // Margin < 0% -> BLOCK
        return { status: 'BLOCK', messages: [`Negative Margin: ${margin_pct.toFixed(2)}%`] };
    }
    if (effective_margin_percent > 2.0) {
        // Margin > 200% -> BLOCK
        return { status: 'BLOCK', messages: [`Margin too high: ${margin_pct.toFixed(2)}% (>200%)`] };
    }

    // Warnings
    if (effective_margin_percent < 0.10) {
        if (status !== 'BLOCK') status = 'WARN';
        messages.push(`Low Margin Warning: ${margin_pct.toFixed(2)}% (<10%)`);
    }
    if (effective_margin_percent > 0.80) {
        if (status !== 'BLOCK') status = 'WARN';
        messages.push(`High Margin Warning: ${margin_pct.toFixed(2)}% (>80%)`);
    }

    // --- 4. Price Delta Rules ---
    if (context.previous_base_selling_price !== undefined) {
        const prev = context.previous_base_selling_price;
        const current = base_selling_price;

        // Avoid division by zero if prev was 0 (though ideally shouldn't happen for active items)
        if (prev > 0) {
            const deltaPercent = (current - prev) / prev;
            const absDelta = Math.abs(deltaPercent);

            if (absDelta > 0.60) {
                return { status: 'BLOCK', messages: [`Price change > 60%: ${(deltaPercent * 100).toFixed(2)}%`] };
            }
            if (absDelta > 0.30) {
                if (status !== 'BLOCK') status = 'WARN';
                messages.push(`Price change > 30%: ${(deltaPercent * 100).toFixed(2)}%`);
            }
        }
    }

    return { status, messages };
}
