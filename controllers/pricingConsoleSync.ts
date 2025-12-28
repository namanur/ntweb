import { ChangeSummaryRow } from "@/lib/console-diff";
import { TelegramService } from "@/lib/telegram";
import { ENGINE_VERSION } from "@/lib/pricing-engine";

export const CONSOLE_VERSION = "1.2.0";

export type SyncResult = {
    success: boolean;
    sync_id: string;
    message: string;
    details?: string;
};

export async function executeSync(
    payload: ChangeSummaryRow[],
    reason?: string
): Promise<SyncResult> {
    const sync_id = crypto.randomUUID();
    const meta = { reason, count: payload.length, engine: ENGINE_VERSION, console: CONSOLE_VERSION };
    console.log(`[SyncController] Starting Sync Transaction ${sync_id}`, meta);

    TelegramService.notifySyncStart(payload.length, sync_id).catch(console.error);

    try {
        // REAL MODE: Call the local Next.js API route which handles the ERPNext authentication & handshake
        const res = await fetch("/api/erp/batch-sync", {
            method: "POST",
            body: JSON.stringify({
                sync_id,
                reason,
                changes: payload,
                meta: { engine_version: ENGINE_VERSION, console_version: CONSOLE_VERSION }
            }),
            headers: { "Content-Type": "application/json" }
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || data.details || "Unknown ERP Error");
        }

        TelegramService.notifySyncSuccess(sync_id, payload.length).catch(console.error);

        return {
            success: true,
            sync_id,
            message: "Sync successfully committed to ERP."
        };

    } catch (error: any) {
        console.error(`[SyncController] Failed ${sync_id}`, error);
        const errorMessage = error.message || "Unknown unexpected error";

        TelegramService.notifySyncFail(sync_id, errorMessage).catch(console.error);

        return {
            success: false,
            sync_id,
            message: "Sync failed. ERP rejected the transaction.",
            details: errorMessage
        };
    }
}
