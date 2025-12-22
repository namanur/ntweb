import { useState } from "react";
import { ChangeSummaryRow } from "@/lib/console-diff";

type IntentLockModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason?: string) => void;
    changes: ChangeSummaryRow[];
    warnedCount: number;
};

export function IntentLockModal({
    isOpen,
    onClose,
    onConfirm,
    changes,
    warnedCount,
}: IntentLockModalProps) {
    const [confirmed, setConfirmed] = useState(false);
    const [reason, setReason] = useState("");

    if (!isOpen) return null;

    // Compute stats
    const priceUpdates = changes.filter((c) => c.field === "price").length;
    const stockUpdates = changes.filter((c) => c.field === "stock").length;
    const totalItems = changes.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
                <h3 className="text-xl font-bold text-gray-900">Confirm Sync</h3>

                <div className="bg-gray-50 p-4 rounded-md space-y-2 text-sm border">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Total Items Affected:</span>
                        <span className="font-semibold">{totalItems}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Price Updates:</span>
                        <span className="font-semibold">{priceUpdates}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Stock Updates:</span>
                        <span className="font-semibold">{stockUpdates}</span>
                    </div>
                    {warnedCount > 0 && (
                        <div className="flex justify-between text-yellow-700 bg-yellow-50 px-2 py-1 -mx-2 rounded">
                            <span className="font-semibold">⚠️ Warnings Ignored:</span>
                            <span className="font-bold">{warnedCount}</span>
                        </div>
                    )}
                </div>

                <div className="space-y-3 pt-2">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Reason for change (Optional)</label>
                        <input
                            type="text"
                            className="w-full mt-1 border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Weekly price adjustment"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>

                    <label className="flex items-start gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            className="mt-1 w-4 h-4 text-blue-600"
                            checked={confirmed}
                            onChange={(e) => setConfirmed(e.target.checked)}
                        />
                        <span className="text-sm text-gray-700">
                            I understand these changes are <span className="font-bold">permanent</span> and will immediately affect the ERP.
                        </span>
                    </label>
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(reason)}
                        disabled={!confirmed}
                        className="flex-1 px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirm Sync
                    </button>
                </div>
            </div>
        </div>
    );
}
