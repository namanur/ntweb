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
 * Queue an order to Vercel KV when MariaDB is unavailable
 */
export async function queueOrder(order: QueuedOrder): Promise<void> {
    const key = `${ORDER_PREFIX}${order.id}`;
    await kv.set(key, order, { ex: 60 * 60 * 24 * 7 }); // 7-day expiry
    console.log(`📦 Order ${order.orderNumber} queued to Vercel KV`);
}

/**
 * Get all pending orders from the queue
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
 * Remove an order from the queue after successful sync
 */
export async function removePendingOrder(orderId: string): Promise<void> {
    const key = `${ORDER_PREFIX}${orderId}`;
    await kv.del(key);
    console.log(`✅ Order ${orderId} removed from queue`);
}

/**
 * Check if Vercel KV is available
 */
export async function isKVAvailable(): Promise<boolean> {
    try {
        await kv.ping();
        return true;
    } catch {
        return false;
    }
}
