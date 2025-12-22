import { ERPItemSnapshot, ConsoleRow } from "@/types/pricing-console";
import { pricingConsoleReducer, initialPricingConsoleState } from "@/stores/pricingConsoleStore";

// Using console-compute to check consistency visually, but we use computedRows directly
// The prompt asks for: Input: ERP snaphot, Working state, Derived pricing output
// This effectively maps to ConsoleRow[] which already merges them, but we want EXPLICIT deltas.

export type ChangeSummaryRow = {
    item_code: string;
    item_name: string;
    field: "price" | "stock"; // We don't change 'status' directly, it's a result.
    before: string | number;
    after: string | number;
};

/**
 * Deterministic diff builder for Pricing Console sync preview.
 * Only includes rows with actual deltas.
 */
export function buildSyncPayload(
    snapshot: ERPItemSnapshot[],
    computedRows: ConsoleRow[]
): ChangeSummaryRow[] {
    const changes: ChangeSummaryRow[] = [];

    // Create a map of snapshot for easy lookup (though order likely matches)
    const snapshotMap = new Map(snapshot.map(s => [s.item_code, s]));

    for (const row of computedRows) {
        if (!row.is_modified) continue;

        const snap = snapshotMap.get(row.item_code);
        if (!snap) continue; // Should not happen

        // Check Price Delta
        // Comparison must be numeric (rounded)
        // We compare snap.cost_price vs row.cost_price
        // Only if cost_price changed? Or if resulting price changed?
        // "field (price | stock | status)"
        // Usually "price" implies selling price in the context of "Pricing Console", 
        // BUT we are editing 'cost_price'.
        // The prompt says "field (price | stock | status)".
        // If we edit Cost Price, teh Selling Price changes.
        // Let's assume we report the *output* change (Selling Price) and/or the Input change?
        // "Count of price updates" usually means "How many items have a new Price".
        // Let's track the Base Selling Price delta, as that's what we sync to ERP (valuation_rate/standard_rate update?).
        // Wait, M.1/M.2 didn't specify exactly WHAT we write back.
        // "ERP Write Integration" is M.4.
        // For M.3 Diff, we simply show what changed.
        // If I change Cost Price, the "Price" (Selling Price) changes.
        // Let's include BOTH or focus on what the user cares about.
        // The User edits Cost Price. The System calculates Selling Price.
        // Let's diff the *Actions* (Inputs) or the *Effects* (Outputs)?
        // "Count of price updates" in M.3.3 implies output.

        // Let's diff Base Selling Price (BSP).
        const prevBSP = snap.previous_base_selling_price || 0;
        const newBSP = row.derived_pricing?.base_selling_price || 0;

        // Use epsilon for float comparison or just strict inequality if properly rounded
        if (Math.abs(newBSP - prevBSP) > 0.01) {
            changes.push({
                item_code: row.item_code,
                item_name: row.item_name,
                field: "price",
                before: prevBSP.toFixed(2),
                after: newBSP.toFixed(2),
            });
        }

        // Check Stock Delta
        const prevStock = snap.stock_quantity;
        const newStock = row.stock_quantity;

        // "Stock comparison must be absolute"
        if (prevStock !== newStock) {
            changes.push({
                item_code: row.item_code,
                item_name: row.item_name,
                field: "stock",
                before: prevStock,
                after: newStock,
            });
        }
    }

    return changes;
}
