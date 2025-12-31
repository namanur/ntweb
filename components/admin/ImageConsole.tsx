"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { ImageUploader } from './ImageUploader';
import { CheckCircle2, RefreshCw, Image as ImageIcon, Search } from 'lucide-react';

interface ImageConsoleProps {
    stats: {
        total: number;
        found: number;
        missing: number;
        missingItemCodes: string[];
    } | null;
    refreshStats: () => void;
    products: any[]; // Used to look up fully item details from stats codes
}

export function ImageConsole({ stats, refreshStats, products }: ImageConsoleProps) {
    const [selectedItemCode, setSelectedItemCode] = useState<string | null>(null);
    const [unsyncedChanges, setUnsyncedChanges] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Derived state: The list of actual missing product objects
    const missingProducts = useMemo(() => {
        if (!stats || !stats.missingItemCodes) return [];
        let items = stats.missingItemCodes
            .map(code => products.find(p => p.item_code === code))
            .filter(Boolean); // Filter out any not found

        if (searchQuery.trim()) {
            const lowerQ = searchQuery.toLowerCase();
            items = items.filter((p: any) =>
                (p.item_name || "").toLowerCase().includes(lowerQ) ||
                (p.item_code || "").toLowerCase().includes(lowerQ)
            );
        }
        return items;
    }, [stats, products, searchQuery]);

    // Derived state: The currently active target
    const activeTarget = useMemo(() => {
        if (!selectedItemCode) return missingProducts[0] || null;
        return missingProducts.find(p => p.item_code === selectedItemCode) || missingProducts[0] || null;
    }, [selectedItemCode, missingProducts]);

    // Auto-select first item if selection is invalid or empty (e.g. after an upload removes the current head)
    useEffect(() => {
        if (!activeTarget && missingProducts.length > 0) {
            setSelectedItemCode(missingProducts[0].item_code);
        }
    }, [activeTarget, missingProducts]);

    const handleCopyName = (name: string) => {
        navigator.clipboard.writeText(name);
        // Could add a toast here but keep it zero-click/fast
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch('/api/admin/sync', { method: 'POST' });
            if (res.ok) {
                setUnsyncedChanges(0);
                window.location.reload();
            }
        } catch (e) {
            console.error("Sync failed", e);
        }
        setIsSyncing(false);
    };

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-4 flex-shrink-0">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter">Task Queue</h2>
                    <p className="text-zinc-500 text-sm">Zero-Click Workflow • {stats?.missing || 0} remaining</p>
                </div>
                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${unsyncedChanges > 0
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 animate-pulse'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                >
                    <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                    {isSyncing ? "Syncing..." : `Sync Catalog ${unsyncedChanges > 0 ? `(${unsyncedChanges})` : ''}`}
                </button>
            </div>

            <div className="flex-1 min-h-0 flex gap-6">

                {/* LEFT PANE: Task Queue (Missing List) */}
                <div className="w-1/3 flex flex-col bg-zinc-950/30 rounded-2xl border border-zinc-800/50 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800/50 bg-zinc-900/20 space-y-3">
                        <h3 className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Queue</h3>
                        <div className="relative group">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" />
                            <input
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-zinc-700 focus:bg-zinc-800 transition-all placeholder:text-zinc-600"
                                placeholder="Filter queue..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {missingProducts.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500">
                                <CheckCircle2 size={32} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">All Clear!</p>
                            </div>
                        ) : (
                            missingProducts.map((p: any) => {
                                const isActive = activeTarget && activeTarget.item_code === p.item_code;
                                return (
                                    <button
                                        key={p.item_code}
                                        onClick={() => setSelectedItemCode(p.item_code)}
                                        className={`w-full text-left p-3 rounded-xl border transition-all duration-200 group relative ${isActive
                                            ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_15px_-3px_rgba(37,99,235,0.2)]'
                                            : 'bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900 hover:border-zinc-700'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`font-mono text-[10px] font-bold ${isActive ? 'text-blue-400' : 'text-zinc-500'}`}>
                                                {p.item_code}
                                            </span>
                                            {isActive && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                                        </div>
                                        <div className={`text-xs font-bold line-clamp-2 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                                            {p.item_name}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* RIGHT PANE: Active Workspace */}
                <div className="flex-1 flex flex-col bg-zinc-950/30 rounded-2xl border border-zinc-800/50 overflow-hidden relative">

                    {activeTarget ? (
                        <div className="flex-1 flex flex-col relative">
                            {/* Target Header */}
                            <div className="p-6 border-b border-zinc-800/50 flex justify-between items-start bg-zinc-900/20">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] font-mono font-bold uppercase tracking-wider">
                                            Active Target
                                        </span>
                                        <h3 className="text-2xl font-black tracking-tight text-white">{activeTarget.item_name}</h3>
                                    </div>
                                    <div className="font-mono text-zinc-500 text-sm flex items-center gap-2">
                                        {activeTarget.item_code}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleCopyName(activeTarget.item_name)}
                                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors active:scale-95 border border-zinc-700"
                                >
                                    Copy Name <RefreshCw size={12} className="opacity-0" /> {/* Hack for spacing */}
                                </button>
                            </div>

                            {/* DROPZONE */}
                            <div className="flex-1 relative">
                                <ImageUploader
                                    targetProduct={activeTarget} // ALWAYS set
                                    onUploadComplete={() => {
                                        refreshStats();
                                        setUnsyncedChanges(c => c + 1);
                                        // Auto-advance is handled by useEffect when stats update
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
                            <CheckCircle2 size={64} className="mb-4 text-green-500/20" />
                            <h3 className="text-xl font-bold text-zinc-500">Queue Complete</h3>
                            <p className="text-sm mt-2">No missing images found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
