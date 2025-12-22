"use client";

import { useMemo, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-theme-quartz.css";
import clsx from "clsx";

import { ColDef, ModuleRegistry, ValueFormatterParams, CellValueChangedEvent } from "ag-grid-community";
import { ClientSideRowModelModule, RowSelectionModule, ValidationModule, NumberEditorModule, TextEditorModule, TextFilterModule, NumberFilterModule } from "ag-grid-community";
import { ConsoleRow } from "@/types/pricing-console";
import { ValidationBadge } from "./ValidationBadge";

ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    RowSelectionModule,
    ValidationModule,
    NumberEditorModule,
    TextEditorModule,
    TextFilterModule,
    NumberFilterModule
]);

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
            { field: "item_code", headerName: "Item Code", pinned: "left", width: 120 },
            { field: "item_name", headerName: "Name", flex: 2, minWidth: 200 },
            {
                field: "cost_price",
                headerName: "Cost Price",
                type: "numericColumn",
                valueFormatter: (p: ValueFormatterParams) =>
                    p.value ? `₹${p.value.toFixed(2)}` : "-",
                editable: !readOnly,
                cellEditor: "agNumberCellEditor",
                cellClass: (params) => clsx(
                    "bg-white border-2 border-transparent",
                    !readOnly && "focus-within:border-blue-500",
                    readOnly && "bg-gray-50 text-gray-500"
                ),
            },
            {
                field: "stock_quantity",
                headerName: "Stock",
                type: "numericColumn",
                editable: !readOnly,
                cellEditor: "agNumberCellEditor",
                cellClass: (params) => clsx(
                    "bg-white border-2 border-transparent",
                    !readOnly && "focus-within:border-blue-500",
                    readOnly && "bg-gray-50 text-gray-500"
                ),
            },
            {
                field: "gst_rate",
                headerName: "GST",
                valueFormatter: (p: ValueFormatterParams) =>
                    p.value ? `${(p.value * 100).toFixed(0)}%` : "-",
                width: 80,
            },
            {
                field: "derived_pricing.base_selling_price",
                headerName: "BSP",
                type: "numericColumn",
                valueFormatter: (p: ValueFormatterParams) =>
                    p.value ? `₹${p.value.toFixed(2)}` : "-",
            },
            {
                field: "derived_pricing.effective_margin_percent",
                headerName: "Margin %",
                type: "numericColumn",
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
                cellRenderer: (params: any) => {
                    if (!params.value) return null;
                    return <ValidationBadge status={params.value.status} message={params.value.messages?.[0]} />;
                },
                flex: 1,
            },
            {
                headerName: "Action",
                width: 80,
                pinned: "right",
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
