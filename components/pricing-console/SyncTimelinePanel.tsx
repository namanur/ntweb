import { clsx } from "clsx";

export type SyncHistoryEntry = {
    id: string; // usually timestamp or uuid
    timestamp: Date;
    status: "SUCCESS" | "ERROR";
    itemsCount: number;
    error?: string;
};

export type SyncTimelinePanelProps = {
    isOpen: boolean;
    onClose: () => void;
    history: SyncHistoryEntry[];
};

export function SyncTimelinePanel({ isOpen, onClose, history }: SyncTimelinePanelProps) {
    return (
        <div
            className={clsx(
                "fixed inset-y-0 right-0 w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}
        >
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-lg text-gray-800">Sync History (Session)</h3>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {history.length === 0 && (
                    <div className="text-center text-gray-400 mt-10">
                        <p>No syncs performed in this session.</p>
                    </div>
                )}

                {history.map((entry) => (
                    <div
                        key={entry.id}
                        className={clsx(
                            "border rounded-lg p-3 text-sm",
                            entry.status === "SUCCESS" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                        )}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-mono text-xs text-gray-500">{entry.timestamp.toLocaleTimeString()}</span>
                            <span
                                className={clsx(
                                    "px-2 py-0.5 rounded textxs font-bold",
                                    entry.status === "SUCCESS" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                )}
                            >
                                {entry.status}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="text-gray-700">
                                <span className="font-semibold">{entry.itemsCount}</span> items synced
                            </div>
                            {entry.error && (
                                <div className="mt-2 text-red-600 bg-red-100/50 p-2 rounded text-xs font-mono break-words">
                                    {entry.error}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
