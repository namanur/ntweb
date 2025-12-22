/**
 * Pricing Console Data Types
 * FROZEN: 2025-12-22
 * DO NOT MODIFY WITHOUT PLATFORM TEAM APPROVAL
 */
import { PricingOutput } from "@/lib/pricing-engine";
import { ValidationResult } from "@/lib/pricing-validation";

export type ERPItemSnapshot = {
    item_code: string;
    item_name: string;
    cost_price: number;
    stock_quantity: number;
    gst_rate: 0.05 | 0.18;
    // Used for validation comparison (price jump checks)
    previous_base_selling_price: number;
};

export type WorkingItemState = {
    cost_price: number;
    stock_quantity: number;
    // We might allow GST edits later, but for now mostly C.P. and Stock
};

export type DerivedPricing = PricingOutput;



export type ConsoleRow = {
    item_code: string;
    item_name: string;

    // Inputs (Merged Snapshot + Working)
    cost_price: number;
    stock_quantity: number;
    gst_rate: 0.05 | 0.18;

    // Outputs
    derived_pricing: DerivedPricing | null; // null if calculation failed
    validation_result: ValidationResult;

    // Formatting helpers or flags can go here if needed, but keeping it pure data for now
    is_modified: boolean;
};
