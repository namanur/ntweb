"use client";

import React, { useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react'; // Core Logic
import "ag-grid-community/styles/ag-grid.css"; // Core CSS
import "ag-grid-community/styles/ag-theme-balham.css"; // Theme
import { BuyingItem } from '@/lib/erp/types';

interface BuyingGridProps {
    items: BuyingItem[];
    edits: Record<string, Partial<BuyingItem>>;
    onCellChange: (itemCode: string, field: keyof BuyingItem, value: number) => void;
    readOnly?: boolean;
}

export function BuyingGrid({ items, edits, onCellChange, readOnly }: BuyingGridProps) {

    // Merge API data with local edits
    const rowData = useMemo(() => {
        return items.map(item => {
            const edit = edits[item.item_code] || {};
            return {
                ...item,
                ...edit,
                original_buying_price: item.current_buying_price,
                original_stock_qty: item.current_stock_qty,
                original_stock_value: item.current_stock_value,
                is_modified: Object.keys(edit).length > 0
            };
        });
    }, [items, edits]);

    const columnDefs = useMemo(() => [
        {
            headerName: "Item Details",
            children: [
                { field: "item_code", headerName: "Code", width: 120, pinned: 'left' },
                { field: "item_name", headerName: "Name", width: 200, pinned: 'left' },
                { field: "brand", headerName: "Brand", width: 100 },
                { field: "item_group", headerName: "Group", width: 120 },
            ]
        },
        {
            headerName: "Pricing (Standard Buying)",
            children: [
                {
                    field: "current_buying_price",
                    headerName: "Buying Rate",
                    editable: !readOnly,
                    cellClass: (params: any) => params.data.is_modified && params.data.current_buying_price !== params.data.original_buying_price ? 'bg-amber-100 text-amber-900 font-bold' : '',
                    valueParser: (params: any) => Number(params.newValue),
                    width: 120
                }
            ]
        },
        {
            headerName: "Opening Stock (Reconciliation)",
            children: [
                {
                    field: "current_stock_qty",
                    headerName: "Qty",
                    editable: !readOnly,
                    cellClass: (params: any) => params.data.is_modified && params.data.current_stock_qty !== params.data.original_stock_qty ? 'bg-amber-100 text-amber-900 font-bold' : '',
                    valueParser: (params: any) => Number(params.newValue),
                    width: 100
                },
                {
                    field: "current_stock_value",
                    headerName: "Total Value",
                    editable: !readOnly,
                    cellClass: (params: any) => params.data.is_modified && params.data.current_stock_value !== params.data.original_stock_value ? 'bg-amber-100 text-amber-900 font-bold' : '',
                    valueParser: (params: any) => Number(params.newValue),
                    width: 120
                },
                {
                    headerName: "Valuation Rate",
                    valueGetter: (params: any) => {
                        const qty = params.data.current_stock_qty;
                        const val = params.data.current_stock_value;
                        return qty > 0 ? (val / qty).toFixed(2) : 0;
                    },
                    width: 120
                }
            ]
        }
    ], [readOnly]);

    const onCellValueChanged = useCallback((event: any) => {
        const { data, colDef, newValue } = event;
        onCellChange(data.item_code, colDef.field, Number(newValue));
    }, [onCellChange]);

    return (
        <div className="ag-theme-balham-dark w-full h-full">
            <AgGridReact
                theme="legacy"
                rowData={rowData}
                columnDefs={columnDefs as any}
                defaultColDef={{
                    sortable: true,
                    filter: true,
                    resizable: true,
                }}
                onCellValueChanged={onCellValueChanged}
                animateRows={true}
            />
        </div>
    );
}
