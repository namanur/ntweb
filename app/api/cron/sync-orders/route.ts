import { NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { getPendingOrders, removePendingOrder } from '@/lib/order-queue';

/**
 * Syncs queued orders from the pending queue into the MariaDB `orders` table.
 *
 * Attempts to insert each pending order as a new `Pending` order, removes successfully synced orders from the pending queue, and returns a summary of synced and failed counts.
 *
 * Authentication: if `process.env.CRON_SECRET` is defined, the request must include an `Authorization` header matching `Bearer ${process.env.CRON_SECRET}`; if no secret is defined, the handler skips authentication.
 *
 * @returns A JSON object with one of the following shapes:
 * - `{ synced: number, failed: number, message: string }` when the job completes (counts of successfully synced and failed orders and a summary message).
 * - `{ synced: 0, message: 'No pending orders' }` when there are no pending orders.
 * - `{ error: 'Unauthorized' }` with HTTP 401 when authentication fails.
 * - `{ error: 'Sync failed', details: string }` with HTTP 500 for unexpected errors.
 */
export async function GET(req: Request) {
    // Verify cron secret (optional but recommended)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Allow if no CRON_SECRET is set (for testing)
        if (process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    console.log('🔄 Starting order sync job...');

    try {
        const pendingOrders = await getPendingOrders();

        if (pendingOrders.length === 0) {
            console.log('✅ No pending orders to sync.');
            return NextResponse.json({ synced: 0, message: 'No pending orders' });
        }

        console.log(`📦 Found ${pendingOrders.length} pending orders.`);

        let syncedCount = 0;
        let failedCount = 0;

        for (const order of pendingOrders) {
            try {
                await execute(
                    `INSERT INTO orders (
                        id, order_number, customer_name_input, customer_mobile_input, 
                        items_json, total_amount, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?)`,
                    [
                        order.id,
                        order.orderNumber,
                        order.customerName,
                        order.customerMobile,
                        order.itemsJson,
                        order.totalAmount,
                        order.createdAt
                    ]
                );

                await removePendingOrder(order.id);
                syncedCount++;
                console.log(`✅ Synced order ${order.orderNumber}`);

            } catch (dbError: any) {
                failedCount++;
                console.error(`❌ Failed to sync order ${order.orderNumber}:`, dbError.message);
                // Keep in queue for next retry
            }
        }

        const message = `Synced ${syncedCount} orders, ${failedCount} failed.`;
        console.log(`🏁 Sync job complete: ${message}`);

        return NextResponse.json({
            synced: syncedCount,
            failed: failedCount,
            message
        });

    } catch (error: any) {
        console.error('❌ Sync job error:', error);
        return NextResponse.json(
            { error: 'Sync failed', details: error.message },
            { status: 500 }
        );
    }
}