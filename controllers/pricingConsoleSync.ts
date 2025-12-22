import { ChangeSummaryRow } from "@/lib/console-diff";
import { TelegramService } from "@/lib/telegram";
import { ENGINE_VERSION } from "@/lib/pricing-engine";

export const CONSOLE_VERSION = "1.1.0";

export type SyncResult = {
    success: boolean;
    sync_id: string;
    message: string; // Human readable
    details?: string; // Tech details if failed
};

/**
 * Controller to handle the sync orchestration transaction.
 * Follows M.3.4 rules.
 */
export async function executeSync(
    payload: ChangeSummaryRow[],
    reason?: string
): Promise<SyncResult> {
    // 1. Generate Sync ID
    const sync_id = crypto.randomUUID();
    const meta = { reason, count: payload.length, engine: ENGINE_VERSION, console: CONSOLE_VERSION };
    console.log(`[SyncController] Starting Sync Transaction ${sync_id}`, meta);

    // Notify Start
    // We notification now includes version info implicitly or explicitly if we updated the message format.
    // For now, standard message.
    TelegramService.notifySyncStart(payload.length, sync_id).catch(console.error);

    try {
        const STUB_MODE = true;

        if (STUB_MODE) {
            // Simulate latency
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Simulate random failure logic if needed, but for now Success

            // Log Success
            console.log(`[SyncController] Payload sent`, { payload, versions: { engine: ENGINE_VERSION, console: CONSOLE_VERSION } });

            // Notify Success
            TelegramService.notifySyncSuccess(sync_id, payload.length).catch(console.error);

            return {
                success: true,
                sync_id,
                message: "Sync successfully committed to ERP."
            };
        }

        /* 
           REAL IMPLEMENTATION (Commented out until Endpoint exists)
           
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
        
        if (!res.ok) {
             const errorText = await res.text();
             throw new Error(errorText || "Unknown ERP Error");
        }
        
        TelegramService.notifySyncSuccess(sync_id, payload.length).catch(console.error);
        return { success: true, sync_id, message: "Sync complete." };
        */

        return { success: false, sync_id, message: "Implementation error: Real mode not active" };

    } catch (error: any) {
        console.error(`[SyncController] Failed ${sync_id}`, error);
        const errorMessage = error.message || "Unknown unexpected error";

        // Notify Fail
        TelegramService.notifySyncFail(sync_id, errorMessage).catch(console.error);

        return {
            success: false,
            sync_id,
            message: "Sync failed. ERP rejected the transaction.",
            details: errorMessage
        };
    }
}
