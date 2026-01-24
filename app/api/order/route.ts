import { NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { queueOrder, QueuedOrder } from '@/lib/order-queue';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a short human-readable order number for web orders.
 *
 * @returns An order number string in the format `WEB-<year>-<XXXX>` where `<year>` is the current year and `<XXXX>` is a random 4-character uppercase alphanumeric segment.
 */
function generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `WEB-${year}-${random}`;
}

/**
 * Handle incoming order submissions: validate input, persist to MariaDB, and fall back to queuing if the database is unavailable.
 *
 * @param req - HTTP request whose JSON body must include `customer` (with `name` and `mobile`) and a non-empty `cart` array of items
 * @returns On success: an object with `success: true`, `orderId` (the generated order number), `message`, and `storage` set to `"database"` or `"queue"`. 
 *          On client validation failure: `{ success: false, message: "Invalid order data" }` with HTTP 400.
 *          On system failure: `{ success: false, message: "System Error: Could not save order.", details }` with HTTP 500.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { customer, cart } = body;

        // 1. Basic Validation
        if (!customer?.name || !customer?.mobile || !cart || cart.length === 0) {
            return NextResponse.json(
                { success: false, message: "Invalid order data" },
                { status: 400 }
            );
        }

        // 2. Prepare Data
        const orderId = uuidv4();
        const orderNumber = generateOrderNumber();
        const itemsJson = JSON.stringify(cart);
        const totalAmount = cart.reduce((sum: number, item: any) => sum + (item.qty * item.standard_rate), 0);

        // 3. Try MariaDB First
        try {
            console.log(`📝 Writing Order ${orderNumber} to MariaDB...`);

            await execute(
                `INSERT INTO orders (
                    id, order_number, customer_name_input, customer_mobile_input, 
                    items_json, total_amount, status
                ) VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
                [
                    orderId,
                    orderNumber,
                    customer.name.trim(),
                    customer.mobile.trim(),
                    itemsJson,
                    totalAmount
                ]
            );

            console.log(`✅ Order ${orderNumber} saved to MariaDB.`);

            return NextResponse.json({
                success: true,
                orderId: orderNumber,
                message: "Order placed successfully",
                storage: "database"
            });

        } catch (dbError: any) {
            // 4. MariaDB Failed - Fallback to Vercel KV Queue
            console.warn(`⚠️ MariaDB unavailable: ${dbError.message}. Queueing order...`);

            const queuedOrder: QueuedOrder = {
                id: orderId,
                orderNumber,
                customerName: customer.name.trim(),
                customerMobile: customer.mobile.trim(),
                itemsJson,
                totalAmount,
                createdAt: new Date().toISOString()
            };

            try {
                await queueOrder(queuedOrder);

                return NextResponse.json({
                    success: true,
                    orderId: orderNumber,
                    message: "Order queued! Our team will process it shortly.",
                    storage: "queue"
                });
            } catch (kvError: any) {
                // Both DB and KV failed
                console.error(`❌ Both MariaDB and Vercel KV failed:`, kvError);
                throw new Error("All storage backends unavailable");
            }
        }

    } catch (error: any) {
        console.error("❌ Order Submission Failed:", error);
        return NextResponse.json(
            {
                success: false,
                message: "System Error: Could not save order.",
                details: error.message
            },
            { status: 500 }
        );
    }
}