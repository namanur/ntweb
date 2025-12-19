import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function inspect() {
    try {
        const { findCustomerByPhone } = await import('../lib/erp');
        const phone = "9876543210";
        const customer = await findCustomerByPhone(phone);

        if (customer) {
            console.log("Customer Keys:", Object.keys(customer));
            console.log("Customer Data:", JSON.stringify(customer, null, 2));
        } else {
            console.log("Customer not found.");
        }
    } catch (e) {
        console.error(e);
    }
}
inspect();
