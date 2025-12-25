"use client";

import { useReducer, useMemo, useEffect, useCallback, useState } from "react";
import { Toolbar } from "./Toolbar";
import { PricingGrid } from "./PricingGrid";
import { IntentLockModal } from "./IntentLockModal";
import { SyncTimelinePanel, SyncHistoryEntry } from "./SyncTimelinePanel";
import { GuardrailsWrapper } from "./Guardrails";
import { IssuesDrawer, Issue } from "./IssuesDrawer";
import {
    pricingConsoleReducer,
    initialPricingConsoleState,
    selectSyncEligibility,
} from "@/stores/pricingConsoleStore";
import { computeConsoleRow } from "@/lib/console-compute";
import { buildSyncPayload } from "@/lib/console-diff";
import { executeSync } from "@/controllers/pricingConsoleSync";
import { fetchConsoleItems } from "@/lib/erp-console-fetch";
import { ConsoleRow, WorkingItemState } from "@/types/pricing-console";

export function PricingConsole() {
    const [state, dispatch] = useReducer(
        pricingConsoleReducer,
        initialPricingConsoleState
    );

    // Async States
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastFetched, setLastFetched] = useState<Date | null>(null);
    const [syncStatus, setSyncStatus] = useState<"IDLE" | "SENDING" | "SUCCESS" | "ERROR">("IDLE");
    const [syncError, setSyncError] = useState<string | null>(null);

    // Safety Controls
    const envReadOnly = process.env.NEXT_PUBLIC_PRICING_READ_ONLY === "true";
    const [emergencyStop, setEmergencyStop] = useState(false);
    const isReadOnly = envReadOnly || emergencyStop;

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filters
    const [activeFilter, setActiveFilter] = useState<"ALL" | "MODIFIED" | "WARN" | "BLOCK">("ALL");

    // History
    const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([]);
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);

    // Issues
    const [isIssuesDrawerOpen, setIsIssuesDrawerOpen] = useState(false);

    // Guardrails & Activation
    const [isActivated, setIsActivated] = useState(false); // In reality, check LocalStorage/DB
    const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);

    useEffect(() => {
        // M.4.2 Check for previous activation
        const activated = localStorage.getItem("PRICING_CONSOLE_ACTIVATED") === "true";
        setIsActivated(activated);
    }, []);


    // --- Data Loading ---
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            setSyncStatus("IDLE"); // Reset sync status on reload
            const snapshots = await fetchConsoleItems();
            dispatch({ type: "LOAD_SNAPSHOT", payload: snapshots });
            setLastFetched(new Date());
        } catch (err: any) {
            console.error("Pricing Console Fetch Error", err);
            setError(err.message || "Unable to reach ERP. Try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // --- Computed Rows ---
    const rows = useMemo(() => {
        return state.snapshot.map((item) => {
            const workingState = state.working.get(item.item_code);
            return computeConsoleRow(item, workingState);
        });
    }, [state.snapshot, state.working]);

    // --- Derived Selectors ---
    const syncEligibility = useMemo(() => {
        return selectSyncEligibility(state);
    }, [state]);

    // --- Filtering ---
    const filteredRows = useMemo(() => {
        if (activeFilter === "ALL") return rows;
        return rows.filter((row) => {
            if (activeFilter === "MODIFIED") return row.is_modified;
            if (activeFilter === "WARN") return row.validation_result.status === "WARN";
            if (activeFilter === "BLOCK") return row.validation_result.status === "BLOCK";
            return true;
        });
    }, [rows, activeFilter]);

    // --- Compute Issues ---
    const issues = useMemo<Issue[]>(() => {
        const computed: Issue[] = [];

        // Validation issues from grid rows
        rows.forEach((row) => {
            if (row.validation_result.status === "BLOCK") {
                computed.push({
                    id: `validation-block-${row.item_code}`,
                    type: "VALIDATION",
                    severity: "BLOCK",
                    title: "Validation Failed",
                    itemCode: row.item_code,
                    message: row.validation_result.messages[0] || "Item has blocking validation errors",
                    location: "Pricing Console Grid",
                    resolution: "Review the item's derived pricing and correct the source values",
                });
            } else if (row.validation_result.status === "WARN") {
                computed.push({
                    id: `validation-warn-${row.item_code}`,
                    type: "VALIDATION",
                    severity: "WARN",
                    title: "Validation Warning",
                    itemCode: row.item_code,
                    message: row.validation_result.messages[0] || "Item has validation warnings",
                    location: "Pricing Console Grid",
                    resolution: "Review and verify the values are acceptable",
                });
            }
        });

        return computed;
    }, [rows]);


    // --- Handlers ---

    const handleCellChange = useCallback((itemCode: string, field: string, value: number) => {
        if (isReadOnly) return; // Guard
        if (field === "cost_price" || field === "stock_quantity") {
            dispatch({
                type: "UPDATE_CELL",
                payload: {
                    item_code: itemCode,
                    field: field as keyof WorkingItemState,
                    value,
                }
            });
        }
    }, [isReadOnly]);

    const handleResetRow = useCallback((itemCode: string) => {
        if (isReadOnly) return;
        dispatch({
            type: "RESET_ROW",
            payload: { item_code: itemCode }
        });
    }, [isReadOnly]);

    const handleSyncClick = () => {
        if (isReadOnly) return;

        if (!isActivated) {
            setIsActivationModalOpen(true);
            return;
        }

        setIsModalOpen(true);
    };

    const handleActivate = () => {
        localStorage.setItem("PRICING_CONSOLE_ACTIVATED", "true");
        setIsActivated(true);
        setIsActivationModalOpen(false);
        setIsModalOpen(true); // Proceed to sync
    };

    const handleConfirmSync = async (reason?: string) => {
        if (isReadOnly) return;
        setIsModalOpen(false);
        setSyncStatus("SENDING");
        setSyncError(null);

        // Build Payload
        const changes = buildSyncPayload(state.snapshot, rows);

        // Execute Sync
        const result = await executeSync(changes, reason);

        const newEntry: SyncHistoryEntry = {
            id: new Date().toISOString(),
            timestamp: new Date(),
            status: result.success ? "SUCCESS" : "ERROR",
            itemsCount: changes.length,
            error: result.success ? undefined : result.message,
        };
        setSyncHistory(prev => [newEntry, ...prev]);

        if (result.success) {
            setSyncStatus("SUCCESS");
            // Refetch truth
            await loadData();
        } else {
            setSyncStatus("ERROR");
            setSyncError(result.message);
            // Alert?
            alert(`Sync Failed: ${result.message}\n${result.details || ''}`);
        }
    };

    // --- Render ---

    if (loading && state.snapshot.length === 0) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-8 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 font-medium">Fetching ERP data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-8 space-y-4">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex flex-col items-center">
                    <p className="font-semibold text-lg">Infrastructure Error</p>
                    <p>{error}</p>
                    <button
                        onClick={loadData}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    // Pre-calculate changes for Modal preview
    const pendingChanges = isModalOpen ? buildSyncPayload(state.snapshot, rows) : [];

    return (
        <GuardrailsWrapper>
            <div className="flex flex-col h-full gap-4 relative">
                {/* Safety Banner */}
                {isReadOnly && (
                    <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-900 p-3 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="font-bold">
                                Pricing Console is in Read-Only Mode.
                                {emergencyStop ? " (Emergency Stop Active)" : " (Configured)"}
                            </span>
                        </div>
                    </div>
                )}

                <Toolbar
                    lastFetched={lastFetched}
                    syncEligibility={syncEligibility}
                    onSyncClick={handleSyncClick}
                    syncStatus={syncStatus}
                    readOnly={isReadOnly}
                    emergencyStop={emergencyStop}
                    onToggleEmergencyStop={() => setEmergencyStop(!emergencyStop)}
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    onShowHistory={() => setIsHistoryPanelOpen(true)}
                />

                {/* Disable grid during sync or read-only */}
                <div className={(syncStatus === "SENDING" || isReadOnly) ? "pointer-events-none opacity-50 select-none" : ""}>
                    <PricingGrid
                        rows={filteredRows}
                        onCellChange={handleCellChange}
                        readOnly={isReadOnly}
                        onResetRow={handleResetRow}
                    />
                </div>

                <IntentLockModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleConfirmSync}
                    changes={pendingChanges}
                    warnedCount={syncEligibility.warnedCount}
                />

                <SyncTimelinePanel
                    isOpen={isHistoryPanelOpen}
                    onClose={() => setIsHistoryPanelOpen(false)}
                    history={syncHistory}
                />

                <IssuesDrawer
                    isOpen={isIssuesDrawerOpen}
                    onClose={() => setIsIssuesDrawerOpen(false)}
                    issues={issues}
                />

                {/* Bottom-left Issues Indicator */}
                {issues.length > 0 && (
                    <button
                        onClick={() => setIsIssuesDrawerOpen(true)}
                        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all hover:scale-105 font-medium text-sm"
                        title="Click to inspect issues"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{issues.length} {issues.length === 1 ? "Issue" : "Issues"}</span>
                    </button>
                )}

                {/* Activation Modal */}
                {isActivationModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-t-8 border-blue-600">
                            <div className="mb-4">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Initialize Pricing Console</h3>
                                <p className="text-gray-600 text-sm">
                                    This appears to be the first time you are syncing from this console.
                                </p>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                                <p className="text-blue-800 text-sm font-medium">
                                    By proceeding, you designate this Pricing Console as the <strong>Source of Truth</strong> for item prices and stock.
                                </p>
                            </div>

                            <div className="mb-6">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                                        I understand that manual edits in ERPNext will be overwritten by this console.
                                    </span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsActivationModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleActivate}
                                    className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all transform active:scale-95"
                                >
                                    Activate & Input Reason
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </GuardrailsWrapper>
    );
}

