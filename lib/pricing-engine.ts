
/**
 * Pricing Engine Logic
 * FROZEN: 2025-12-22
 * DO NOT MODIFY WITHOUT PLATFORM TEAM APPROVAL
 */
export const ENGINE_VERSION = "1.0.0";

export type PricingInput = {
    cost_price: number;
    gst_rate: 0.05 | 0.18;
};

export type PricingOutput = {
    transport_cost: number;
    delivery_cost: number;
    base_selling_price: number;
    gst_amount: number;
    final_selling_price: number;
    effective_margin_percent: number;
};

const TRANSPORT_PCT = 0.09;
const DELIVERY_PCT = 0.012;
const MARGIN_PCT = 0.259;

/**
 * Rounds a number to 2 decimal places using standard currency rounding (Half Up).
 * Example: 138.877 -> 138.88
 */
function roundCurrency(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function calculatePricing(input: PricingInput): PricingOutput {
    const { cost_price, gst_rate } = input;

    // 1. transport_cost = cost_price * TRANSPORT_PCT
    // Do NOT round.
    const transport_cost = cost_price * TRANSPORT_PCT;

    // 2. delivery_cost = (cost_price + transport_cost) * DELIVERY_PCT
    // Do NOT round.
    const delivery_cost = (cost_price + transport_cost) * DELIVERY_PCT;

    // 3. adjusted_cost = cost_price + transport_cost + delivery_cost
    // Do NOT round.
    const adjusted_cost = cost_price + transport_cost + delivery_cost;

    // 4. base_selling_price = adjusted_cost * (1 + MARGIN_PCT)
    // Rounding Rule: Standard Rounding (Half Up)
    const raw_base_selling_price = adjusted_cost * (1 + MARGIN_PCT);
    const base_selling_price = roundCurrency(raw_base_selling_price);

    // 5. gst_amount = base_selling_price * gst_rate
    // Rounding Rule: Standard Rounding (Half Up)
    const raw_gst_amount = base_selling_price * gst_rate;
    const gst_amount = roundCurrency(raw_gst_amount);

    // 6. final_selling_price = base_selling_price + gst_amount
    // Rounding Rule: Standard Rounding (Half Up)
    const raw_final_selling_price = base_selling_price + gst_amount;
    const final_selling_price = roundCurrency(raw_final_selling_price);

    // 7. effective_margin_percent = (base_selling_price - cost_price) / cost_price
    const effective_margin_percent = (base_selling_price - cost_price) / cost_price;

    return {
        transport_cost,
        delivery_cost,
        base_selling_price,
        gst_amount,
        final_selling_price,
        effective_margin_percent,
    };
}
