'use server';

import { execute } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { createERPSalesOrder } from './erp-sales-order';

export async function updateOrderCustomer(orderId: string, erpCustomerId: string) {
    try {
        await execute(
            'UPDATE orders SET erp_customer_id = ? WHERE id = ?',
            [erpCustomerId, orderId]
        );
        revalidatePath(`/admin/orders/${orderId}`);
        return { success: true };
    } catch (e) {
        console.error("Update Customer Failed", e);
        return { success: false };
    }
}

export async function performAdminAction(orderId: string, action: 'approve' | 'reject') {
    console.log(`Action: ${action} on Order ${orderId}`);

    if (action === 'reject') {
        try {
            await execute('UPDATE orders SET status = ? WHERE id = ?', ['Rejected', orderId]);
            revalidatePath(`/admin/orders/${orderId}`);
            return { success: true };
        } catch (e) {
            return { success: false, message: "DB Error" };
        }
    }

    // Approval Flow (Phase 5)
    try {
        // 1. Fetch Order Data
        const orders = await execute('SELECT * FROM orders WHERE id = ?', [orderId]);
        // @ts-ignore
        const order = orders[0];

        if (!order) return { success: false, message: "Order not found" };

        // Phase 3 Check
        if (!order.erp_customer_id) return { success: false, message: "Link ERP Customer first" };

        const items = JSON.parse(order.items_json);

        // 2. Sync to ERP
        const syncRes = await createERPSalesOrder(
            order.erp_customer_id,
            items.map((i: any) => ({
                item_code: i.item_code,
                qty: i.qty,
                rate: i.standard_rate,
                delivery_date: new Date().toISOString().split('T')[0]
            })),
            order.order_number
        );

        if (!syncRes.success) {
            return { success: false, message: syncRes.message };
        }

        // 3. Update MariaDB
        await execute(
            'UPDATE orders SET status = ?, erp_sales_order_id = ? WHERE id = ?',
            ['Approved', syncRes.id, orderId]
        );

        revalidatePath(`/admin/orders/${orderId}`);
        revalidatePath('/admin/dashboard');
        return { success: true };

    } catch (e) {
        console.error("Approval flow failed", e);
        return { success: false, message: "Internal Error" };
    }
}
