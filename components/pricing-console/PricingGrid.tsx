"use client";

import { useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-theme-quartz.css";
import clsx from "clsx";

import { ColDef, ValueFormatterParams, CellValueChangedEvent } from "ag-grid-community";
import { ConsoleRow } from "@/types/pricing-console";
import { ValidationBadge } from "./ValidationBadge";

// Note: AG Grid modules are registered globally in lib/agGridModules.ts

type PricingGridProps = {
    rows?: ConsoleRow[];
    onCellChange?: (itemCode: string, field: string, value: number) => void;
    readOnly?: boolean;
    onResetRow?: (itemCode: string) => void;
};

export function PricingGrid({ rows = [], onCellChange, readOnly = false, onResetRow }: PricingGridProps) {

    const handleCellValueChanged = useCallback((event: CellValueChangedEvent<ConsoleRow>) => {
        if (!onCellChange) return;
        const { data, colDef, newValue } = event;
        if (!data || !colDef.field) return;

        // Convert to number if needed (AG Grid usually handles this based on type, but safe to cast)
        const numValue = Number(newValue);
        if (!isNaN(numValue)) {
            onCellChange(data.item_code, colDef.field, numValue);
        }
    }, [onCellChange]);

    const colDefs = useMemo<ColDef<ConsoleRow>[]>(
        () => [
            {
                field: "item_code",
                headerName: "Item Code",
                pinned: "left",
                width: 140,
                minWidth: 120,
                headerClass: "text-left",
                cellClass: "text-left",
            },
            {
                field: "item_name",
                headerName: "Name",
                flex: 2,
                minWidth: 220,
                headerClass: "text-left",
                cellClass: "text-left",
            },
            {
                field: "cost_price",
                headerName: "Cost Price",
                type: "numericColumn",
                width: 120,
                minWidth: 100,
                headerClass: "text-right",
                cellClass: "text-right",
                valueFormatter: (p: ValueFormatterParams) =>
                    p.value ? `₹${p.value.toFixed(2)}` : "-",
                editable: !readOnly,
                cellEditor: "agNumberCellEditor",
            },
            {
                field: "stock_quantity",
                headerName: "Stock",
                type: "numericColumn",
                width: 100,
                minWidth: 80,
                headerClass: "text-right",
                cellClass: "text-right",
                editable: !readOnly,
                cellEditor: "agNumberCellEditor",
            },
            {
                field: "gst_rate",
                headerName: "GST",
                width: 90,
                minWidth: 70,
                headerClass: "text-center",
                cellClass: "text-center",
                valueFormatter: (p: ValueFormatterParams) =>
                    p.value ? `${(p.value * 100).toFixed(0)}%` : "-",
            },
            {
                field: "derived_pricing.base_selling_price",
                headerName: "BSP",
                type: "numericColumn",
                width: 120,
                minWidth: 100,
                headerClass: "text-right",
                cellClass: "text-right",
                valueFormatter: (p: ValueFormatterParams) =>
                    p.value ? `₹${p.value.toFixed(2)}` : "-",
            },
            {
                field: "derived_pricing.effective_margin_percent",
                headerName: "Margin %",
                type: "numericColumn",
                width: 110,
                minWidth: 90,
                headerClass: "text-right",
                cellClass: "text-right",
                valueFormatter: (p: ValueFormatterParams) =>
                    p.value ? `${(p.value * 100).toFixed(1)}%` : "-",
                cellStyle: (params) => {
                    const val = params.value;
                    if (val === undefined || val === null) return null;
                    if (val < 0.1) return { color: "#ef4444", fontWeight: "bold" };
                    if (val > 0.8) return { color: "#eab308", fontWeight: "bold" };
                    return { color: "#22c55e", fontWeight: "bold" };
                }
            },
            {
                field: "validation_result",
                headerName: "Status",
                flex: 1,
                minWidth: 140,
                headerClass: "text-left",
                cellClass: "text-left",
                cellRenderer: (params: any) => {
                    if (!params.value) return null;
                    return <ValidationBadge status={params.value.status} message={params.value.messages?.[0]} />;
                },
            },
            {
                headerName: "Action",
                width: 90,
                minWidth: 80,
                pinned: "right",
                headerClass: "text-center",
                cellClass: "text-center",
                cellRenderer: (params: any) => {
                    const data = params.data as ConsoleRow;
                    if (!data.is_modified || readOnly) return null;
                    return (
                        <button
                            onClick={() => onResetRow?.(data.item_code)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            title="Reset Row"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                            </svg>
                        </button>
                    );
                }
            }
        ],
        [readOnly, onResetRow]
    );

    return (
        <div
            className="ag-theme-quartz flex-1 w-full"
            style={{ height: "100%", minHeight: "500px" }}
        >
            <AgGridReact
                rowData={rows}
                columnDefs={colDefs}
                defaultColDef={{
                    sortable: true,
                    filter: true,
                    resizable: true,
                }}
                rowSelection="single"
                onCellValueChanged={handleCellValueChanged}
                stopEditingWhenCellsLoseFocus={true}

                // Density & UX
                rowHeight={35}
                getRowClass={(params) => {
                    if (params.data?.is_modified) return 'bg-blue-50/50';
                    return undefined;
                }}

                // Keyboard config
                enterNavigatesVertically={false}
                enterNavigatesVerticallyAfterEdit={false}
            />
        </div>
    );
}
