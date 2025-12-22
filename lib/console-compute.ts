import { ERPItemSnapshot, WorkingItemState, ConsoleRow } from "@/types/pricing-console";
import { calculatePricing } from "./pricing-engine";
import { validateItem } from "./pricing-validation";

export function computeConsoleRow(
    snapshot: ERPItemSnapshot,
    working: Partial<WorkingItemState> | undefined
): ConsoleRow {
    // 1. Merge snapshot + working values
    const cost_price = working?.cost_price ?? snapshot.cost_price;
    const stock_quantity = working?.stock_quantity ?? snapshot.stock_quantity;
    const gst_rate = snapshot.gst_rate; // GST is usually not edited in working state for now, per M.1.2 notes

    // 2. Call pricing-engine
    // We use the merged values to calculate pricing
    const pricingInput = {
        cost_price,
        gst_rate,
    };

    // catch errors in calculation if any (though engine seems pure math)
    let derived_pricing = null;
    try {
        derived_pricing = calculatePricing(pricingInput);
    } catch (e) {
        console.error("Pricing calculation failed", e);
    }

    // 3. Call pricing-validation
    const validationInput = {
        cost_price,
        gst_rate,
        stock_quantity,
        calculated_pricing: derived_pricing || undefined,
    };

    const validationContext = {
        previous_base_selling_price: snapshot.previous_base_selling_price,
    };

    const validation_result = validateItem(validationInput, validationContext);

    // 4. Return ConsoleRow
    return {
        item_code: snapshot.item_code,
        item_name: snapshot.item_name,
        cost_price,
        stock_quantity,
        gst_rate,
        derived_pricing,
        validation_result,
        is_modified: !!working && Object.keys(working).length > 0,
    };
}
