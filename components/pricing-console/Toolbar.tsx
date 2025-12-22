import { SyncEligibility } from "@/stores/pricingConsoleStore";
import clsx from "clsx";

export type ToolbarProps = {
    lastFetched: Date | null;
    syncEligibility?: SyncEligibility; // M.3.1 Gate
    onSyncClick?: () => void;
    syncStatus?: "IDLE" | "SENDING" | "SUCCESS" | "ERROR";
    readOnly?: boolean;
    emergencyStop?: boolean;
    onToggleEmergencyStop?: () => void;
    activeFilter?: "ALL" | "MODIFIED" | "WARN" | "BLOCK";
    onFilterChange?: (filter: "ALL" | "MODIFIED" | "WARN" | "BLOCK") => void;
    onShowHistory?: () => void;
};

export function Toolbar({
    lastFetched,
    syncEligibility,
    onSyncClick,
    syncStatus = "IDLE",
    readOnly = false,
    emergencyStop = false,
    onToggleEmergencyStop,
    activeFilter = "ALL",
    onFilterChange,
    onShowHistory
}: ToolbarProps) {

    // derived state for button
    const canSync = !readOnly && syncEligibility?.canSync && syncStatus !== "SENDING";
    const isSyncing = syncStatus === "SENDING";

    const FilterButton = ({ filter, label, count, colorClass }: { filter: "ALL" | "MODIFIED" | "WARN" | "BLOCK", label: string, count?: number, colorClass: string }) => (
        <button
            onClick={() => onFilterChange?.(filter)}
            className={clsx(
                "px-3 py-1.5 text-xs font-semibold rounded border transition-colors flex items-center gap-2",
                activeFilter === filter
                    ? `bg-gray-800 text-white border-gray-800`
                    : `bg-white text-gray-600 border-gray-200 hover:bg-gray-50`,
                activeFilter === filter ? "" : colorClass // Apply color tint on hover/inactive? No, keeping simple.
            )}
        >
            {label}
            {count !== undefined && count > 0 && (
                <span className={clsx(
                    "px-1.5 py-0.5 rounded-full text-[10px]",
                    activeFilter === filter ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                )}>
                    {count}
                </span>
            )}
        </button>
    );

    return (
        <div className="flex items-center justify-between p-4 border rounded bg-white shadow-sm">
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between min-w-[300px]">
                    <h2 className="text-xl font-bold text-gray-800">Pricing Console</h2>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                        {lastFetched && (
                            <span title={`Fetched at ${lastFetched.toLocaleTimeString()}`}>
                                Updated: {lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                        <button
                            onClick={onShowHistory}
                            className="text-blue-600 hover:text-blue-800 hover:underline ml-2"
                        >
                            History
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                    <FilterButton filter="ALL" label="All Items" colorClass="" />
                    <FilterButton
                        filter="MODIFIED"
                        label="Modified"
                        count={syncEligibility?.modifiedCount}
                        colorClass="text-blue-600"
                    />
                    <FilterButton
                        filter="WARN"
                        label="Warnings"
                        count={syncEligibility?.warnedCount}
                        colorClass="text-amber-600"
                    />
                    <FilterButton
                        filter="BLOCK"
                        label="Blocked"
                        count={syncEligibility?.blockedCount}
                        colorClass="text-red-600"
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* Emergency Stop Switch */}
                <div className="flex items-center gap-2 border-r pr-6 border-gray-200">
                    <span className={clsx("text-xs font-bold uppercase tracking-wider", emergencyStop ? "text-red-600" : "text-gray-400")}>
                        Kill Switch
                    </span>
                    <button
                        onClick={onToggleEmergencyStop}
                        className={clsx(
                            "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
                            emergencyStop ? "bg-red-600" : "bg-gray-200"
                        )}
                        role="switch"
                        aria-checked={emergencyStop}
                    >
                        <span className="sr-only">Use setting</span>
                        <span
                            aria-hidden="true"
                            className={clsx(
                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                emergencyStop ? "translate-x-5" : "translate-x-0"
                            )}
                        />
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    {/* Sync Feedback Banner M.3.5 */}
                    {syncStatus === "SUCCESS" && (
                        <span className="text-sm text-green-600 font-medium animate-pulse">
                            Sync successful
                        </span>
                    )}
                    {syncStatus === "ERROR" && (
                        <span className="text-sm text-red-600 font-medium">
                            Sync failed
                        </span>
                    )}

                    <button
                        onClick={onSyncClick}
                        disabled={!canSync}
                        className={clsx(
                            "px-4 py-2 text-sm font-medium text-white rounded transition-colors flex items-center gap-2",
                            canSync ? "bg-blue-600 hover:bg-blue-700 shadow-sm" : "bg-gray-400 cursor-not-allowed opacity-70"
                        )}
                        title={
                            readOnly
                                ? "Sync disabled in Read-Only mode"
                                : !syncEligibility
                                    ? "Loading..."
                                    : syncEligibility.blockedCount > 0
                                        ? `${syncEligibility.blockedCount} items have BLOCK errors`
                                        : syncEligibility.modifiedCount === 0
                                            ? "No changes to sync"
                                            : "Ready to sync"
                        }
                    >
                        {isSyncing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Syncing...
                            </>
                        ) : (
                            "Sync to Store"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
