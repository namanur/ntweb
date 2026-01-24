'use server';

import { kv } from '@vercel/kv';

export interface QueuedOrder {
    id: string;
    orderNumber: string;
    customerName: string;
    customerMobile: string;
    itemsJson: string;
    totalAmount: number;
    createdAt: string;
}

const ORDER_PREFIX = 'pending_order:';

/**
 * Store a queued order in Vercel KV for later processing.
 *
 * The order is persisted in KV and set to expire after seven days.
 *
 * @param order - The queued order to store; its `id` is used to identify the KV entry
 */
export async function queueOrder(order: QueuedOrder): Promise<void> {
    const key = `${ORDER_PREFIX}${order.id}`;
    await kv.set(key, order, { ex: 60 * 60 * 24 * 7 }); // 7-day expiry
    console.log(`📦 Order ${order.orderNumber} queued to Vercel KV`);
}

/**
 * Retrieve all queued pending orders stored in Vercel KV.
 *
 * @returns An array of `QueuedOrder` objects for each stored pending order; an empty array if none are found.
 */
export async function getPendingOrders(): Promise<QueuedOrder[]> {
    const keys = await kv.keys(`${ORDER_PREFIX}*`);
    if (keys.length === 0) return [];

    const orders: QueuedOrder[] = [];
    for (const key of keys) {
        const order = await kv.get<QueuedOrder>(key);
        if (order) orders.push(order);
    }

    return orders;
}

/**
 * Remove a pending order from the KV queue by its order id.
 *
 * @param orderId - The queued order's `id` used to construct the KV key to delete
 */
export async function removePendingOrder(orderId: string): Promise<void> {
    const key = `${ORDER_PREFIX}${orderId}`;
    await kv.del(key);
    console.log(`✅ Order ${orderId} removed from queue`);
}

/**
 * Determine whether Vercel KV is reachable.
 *
 * @returns `true` if KV responds to a ping, `false` otherwise.
 */
export async function isKVAvailable(): Promise<boolean> {
    try {
        await kv.ping();
        return true;
    } catch {
        return false;
    }
}