import 'dotenv/config';
import { erp } from '../lib/erp';

async function main() {
    const phone = "6204188728";
    const name = "TestCustomerTwo";

    console.log(`Creating Customer: ${name} (${phone})`);

    try {
        const newCustomer = {
            customer_name: name,
            customer_type: "Individual",
            customer_group: "All Customer Groups",
            territory: "All Territories",
            mobile_no: phone
        };

        const res = await erp.post('/api/resource/Customer', newCustomer);
        console.log("✅ Customer Created Successfully!");
        console.log("Name:", res.data.data.name);

    } catch (e: any) {
        console.log("❌ Failed to create customer:", e.response?.data?.exception || e.message);
    }
}

main();
