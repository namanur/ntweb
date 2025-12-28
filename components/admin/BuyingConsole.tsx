"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { BuyingGrid } from './BuyingGrid';
import { BuyingItem } from '@/lib/erp/types';
import { RefreshCw, Upload, AlertTriangle, Clock } from 'lucide-react';

export function BuyingConsole() {
    const [items, setItems] = useState<BuyingItem[]>([]);
    const [edits, setEdits] = useState<Record<string, Partial<BuyingItem>>>({});
    const [loading, setLoading] = useState(false);
    const [pulling, setPulling] = useState(false);
    const [pushing, setPushing] = useState(false);
    const [pushResult, setPushResult] = useState<any>(null);
    const [meta, setMeta] = useState<any>({});
    const [error, setError] = useState<string | null>(null);

    // 1. Load Snapshot (View Mode)
    const loadSnapshot = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/console/buying');
            if (res.status === 404) {
                // Not an error, just no data yet
                setItems([]);
            } else {
                const data = await res.json();
                if (data.success) {
                    setItems(data.data);
                    setMeta(data.meta || {});
                    setEdits({});
                } else {
                    setError(data.message);
                }
            }
        } catch (e: any) {
            setError(e.message);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadSnapshot();
    }, [loadSnapshot]);

    // 2. Action: Pull from ERP (Write Mode)
    const handlePull = async () => {
        setPulling(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/console/pull', { method: 'POST' });
            const data = await res.json();

            if (res.status === 429) {
                alert(`Cooldown Active: ${data.message}`);
            } else if (data.success) {
                setItems(data.data);
                setMeta(data.meta || {});
                setEdits({});
                setPushResult(null); // Clear previous results
            } else {
                setError(data.message);
            }
        } catch (e: any) {
            setError(e.message);
        }
        setPulling(false);
    };

    // 3. Handle Cell Edits
    const handleCellChange = (itemCode: string, field: keyof BuyingItem, value: number) => {
        setEdits(prev => ({
            ...prev,
            [itemCode]: {
                ...prev[itemCode],
                [field]: value
            }
        }));
    };

    // 4. Safety: Warn on Navigation
    const pendingChanges = Object.keys(edits).length;
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (pendingChanges > 0) {
                e.preventDefault();
                e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [pendingChanges]);

    // 5. Action: Push to ERP
    const handlePush = async () => {
        if (!confirm(`Are you sure you want to PERMANENTLY overwrite ERPNext data for ${pendingChanges} items?`)) return;

        setPushing(true);
        setPushResult(null);

        // Prepare Payload
        const priceUpdates: any[] = [];
        const stockUpdates: any[] = [];

        Object.entries(edits).forEach(([code, changes]) => {
            if (changes.current_buying_price !== undefined) {
                priceUpdates.push({ item_code: code, price: changes.current_buying_price });
            }
            if (changes.current_stock_qty !== undefined || changes.current_stock_value !== undefined) {
                const baseItem = items.find(i => i.item_code === code);
                if (baseItem) {
                    stockUpdates.push({
                        item_code: code,
                        qty: changes.current_stock_qty ?? baseItem.current_stock_qty,
                        value: changes.current_stock_value ?? baseItem.current_stock_value
                    });
                }
            }
        });

        try {
            const res = await fetch('/api/admin/console/push-buying', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceUpdates, stockUpdates })
            });

            const result = await res.json();

            if (res.status === 429) {
                setPushResult({ error: result.message });
            } else if (result.success) {
                setPushResult(result);
                if (result.meta) setMeta(result.meta);
                // We reload the snapshot to indicate sync (in theory snapshot should update)
                // For now, we keep local state but show success
            } else {
                setPushResult({ error: result.message });
            }

        } catch (e: any) {
            setPushResult({ error: e.message });
        }
        setPushing(false);
    };

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg">
                <div className="flex items-center gap-6">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            🛡️ Admin Buying Console
                            <span className="text-xs font-normal text-zinc-500 border border-zinc-700 px-2 py-0.5 rounded-full uppercase bg-zinc-950">
                                {meta.lastPulledAt ? "Snapshot Mode" : "No Data"}
                            </span>
                        </h2>
                        {meta.lastPulledAt && (
                            <p className="text-xs text-zinc-400 mt-1">
                                Snapshot: {new Date(meta.lastPulledAt).toLocaleString()}
                            </p>
                        )}
                    </div>

                    <div className="h-8 w-px bg-zinc-800"></div>

                    <button
                        onClick={handlePull}
                        disabled={loading || pulling || pushing}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 rounded-lg transition-colors disabled:opacity-50"
                        title="Updates local snapshot from ERPNext (5m cooldown)"
                    >
                        <RefreshCw size={14} className={pulling ? "animate-spin" : ""} />
                        {pulling ? "Pulling..." : "Pull Snapshot"}
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end mr-4">
                        <div className="flex items-center gap-2 text-amber-500 text-xs bg-amber-950/30 px-3 py-1 rounded-lg border border-amber-900/30 mb-1">
                            <Clock size={12} />
                            <span>12h Lock</span>
                        </div>
                        {meta.lastPushedAt && (
                            <span className="text-[10px] text-zinc-500">
                                Last Push: {new Date(meta.lastPushedAt).toLocaleTimeString()}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={handlePush}
                        disabled={pendingChanges === 0 || pushing}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                        {pushing ? (
                            <>Pushing...</>
                        ) : (
                            <><Upload size={16} /> Push {pendingChanges} Updates</>
                        )}
                    </button>
                </div>
            </div>

            {/* Results / Error Banner */}
            {error && (
                <div className="p-4 rounded-xl border bg-red-950/30 border-red-900/50 text-red-200 flex items-center gap-3">
                    <AlertTriangle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {pushResult && (
                <div className={`p-4 rounded-xl border ${pushResult.error ? 'bg-red-950/30 border-red-900/50 text-red-200' : 'bg-green-950/30 border-green-900/50 text-green-200'}`}>
                    {pushResult.error ? (
                        <div className="flex items-center gap-2"><AlertTriangle size={18} /> <strong>Push Failed:</strong> {pushResult.error}</div>
                    ) : (
                        <div>
                            <strong>✅ Sync Successful! </strong>
                            Prices: {pushResult.priceResult.success} |
                            Stock: {pushResult.stockResult.success ? "Reconciled" : "Failed"}
                        </div>
                    )}
                </div>
            )}

            {/* Grid */}
            <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden relative shadow-inner">
                {(loading || pulling) && (
                    <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        <p className="text-zinc-400 font-medium animate-pulse">
                            {pulling ? "Fetching live data from ERPNext..." : "Loading Snapshot..."}
                        </p>
                    </div>
                )}
                {items.length === 0 && !loading && !pulling && !error && (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-500">
                        <div className="text-center">
                            <p className="mb-2">No Snapshot Data</p>
                            <button onClick={handlePull} className="text-blue-400 hover:underline">Pull from ERP</button>
                        </div>
                    </div>
                )}

                <BuyingGrid
                    items={items}
                    edits={edits}
                    onCellChange={handleCellChange}
                    readOnly={pushing}
                />
            </div>

            {/* Unsaved Changes Indicator */}
            {pendingChanges > 0 && (
                <div className="fixed bottom-6 left-6 z-50 bg-amber-600 text-white px-4 py-2 rounded-full shadow-xl font-bold animate-bounce">
                    {pendingChanges} Unsaved Change{pendingChanges > 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
}
