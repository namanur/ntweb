import { ERPItemSnapshot, WorkingItemState } from "@/types/pricing-console";
import { computeConsoleRow } from "@/lib/console-compute";

export type PricingConsoleState = {
    snapshot: ERPItemSnapshot[];
    // Using Map for working state for efficient lookups
    // item_code -> Partial<WorkingItemState>
    working: Map<string, Partial<WorkingItemState>>;
    // Track which rows have been modified for quick visual cues
    modifiedRows: Set<string>;
};

export type PricingConsoleAction =
    | { type: "LOAD_SNAPSHOT"; payload: ERPItemSnapshot[] }
    | { type: "UPDATE_CELL"; payload: { item_code: string; field: keyof WorkingItemState; value: number } }
    | { type: "RESET_ROW"; payload: { item_code: string } }
    | { type: "RESET_ALL" };

export const initialPricingConsoleState: PricingConsoleState = {
    snapshot: [],
    working: new Map(),
    modifiedRows: new Set(),
};

export function pricingConsoleReducer(
    state: PricingConsoleState,
    action: PricingConsoleAction
): PricingConsoleState {
    switch (action.type) {
        case "LOAD_SNAPSHOT":
            return {
                ...state,
                snapshot: action.payload,
                working: new Map(),
                modifiedRows: new Set(),
            };

        case "UPDATE_CELL": {
            const { item_code, field, value } = action.payload;

            const distinctWorking = new Map(state.working);
            const currentItemWorking = distinctWorking.get(item_code) || {};

            // Update the specific field
            const newItemWorking = { ...currentItemWorking, [field]: value };
            distinctWorking.set(item_code, newItemWorking);

            const distinctModified = new Set(state.modifiedRows);
            distinctModified.add(item_code);

            return {
                ...state,
                working: distinctWorking,
                modifiedRows: distinctModified,
            };
        }

        case "RESET_ROW": {
            const { item_code } = action.payload;

            const distinctWorking = new Map(state.working);
            distinctWorking.delete(item_code); // Removing from working state reverts to snapshot

            const distinctModified = new Set(state.modifiedRows);
            distinctModified.delete(item_code);

            return {
                ...state,
                working: distinctWorking,
                modifiedRows: distinctModified,
            };
        }

        case "RESET_ALL":
            return {
                ...state,
                working: new Map(),
                modifiedRows: new Set(),
            };

        default:
            return state;
    }
}

// M.3.1 - Pre-Sync Gate Selector
export type SyncEligibility = {
    canSync: boolean;
    blockedCount: number;
    warnedCount: number;
    modifiedCount: number;
};

export function selectSyncEligibility(state: PricingConsoleState): SyncEligibility {
    // 1. Basic Checks
    if (state.snapshot.length === 0) {
        return { canSync: false, blockedCount: 0, warnedCount: 0, modifiedCount: 0 };
    }

    if (state.modifiedRows.size === 0) {
        // Nothing to sync
        return { canSync: false, blockedCount: 0, warnedCount: 0, modifiedCount: 0 };
    }

    // 2. Compute Validation for Checks
    let blockedCount = 0;
    let warnedCount = 0;

    // We must iterate ALL items, because even unmodified items might be in BLOCK state (from ERP)
    // and we might interpret "canSync" as "System is healthy enough to sync changes".
    // However, usually we only care if *modified* items are valid, or if the *entire* batch is valid.
    // The prompt says: "canSync MUST be false if: Any item has ValidationResult.status === 'BLOCK'"
    // "Any item" usually implies any item in the list, not just modified ones.

    for (const item of state.snapshot) {
        const workingState = state.working.get(item.item_code);

        // We strictly use the same compute logic as the UI
        const row = computeConsoleRow(item, workingState);

        if (row.validation_result.status === "BLOCK") {
            blockedCount++;
        } else if (row.validation_result.status === "WARN") {
            warnedCount++;
        }
    }

    const modifiedCount = state.modifiedRows.size;

    const canSync = blockedCount === 0 && modifiedCount > 0;

    return {
        canSync,
        blockedCount,
        warnedCount,
        modifiedCount,
    };
}
