import 'dotenv/config';
import { getCustomerOutstanding, erp, findCustomerByPhone } from '../lib/erp';

async function main() {
    const phone = "9876543210";
    const customer = await findCustomerByPhone(phone);

    if (!customer) {
        console.log("Customer not found");
        return;
    }
    console.log(`Checking Balance for: ${customer.name}`);

    // 1. Check GL Method
    const glBalance = await getCustomerOutstanding(customer.name);
    console.log(`GL Calculated Balance: ${glBalance}`);

    // 2. Check Customer "opening_balance" field (if exists)
    try {
        const res = await erp.get(`/api/resource/Customer/${customer.name}`);
        const data = res.data.data;
        console.log(`Customer Doc 'opening_balance': ${data.opening_balance}`);
        console.log(`Customer Doc 'total_unpaid': ${data.total_unpaid}`);
        console.log(`Customer Doc 'outstanding_amount': ${data.outstanding_amount}`);
    } catch (e) {
        console.log("Error fetching customer doc");
    }
}

main();
