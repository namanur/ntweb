import { NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { getPendingOrders, removePendingOrder } from '@/lib/order-queue';

/**
 * Cron Job: Sync Queued Orders to MariaDB
 * Runs every 30 minutes via Vercel Cron
 */
export async function GET(req: Request) {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (!process.env.CRON_SECRET && process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Unauthorized: No Secret Configured' }, { status: 401 });
    }

    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
        // ... (rest of logic same)

        for (const order of pendingOrders) {
            try {
                // Idempotent Insert using ON DUPLICATE KEY UPDATE
                await execute(
                    `INSERT INTO orders (
                        id, order_number, customer_name_input, customer_mobile_input, 
                        items_json, total_amount, status, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?)
                    ON DUPLICATE KEY UPDATE
                        customer_name_input = VALUES(customer_name_input),
                        customer_mobile_input = VALUES(customer_mobile_input),
                        items_json = VALUES(items_json),
                        total_amount = VALUES(total_amount),
                        status = VALUES(status), -- Careful overwriting status if changed locally
                        created_at = VALUES(created_at)
                    `,
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
