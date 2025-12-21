import 'dotenv/config';
import { findCustomerByPhone } from '../lib/erp';
import { fetchDoc } from '../lib/erpnext';

async function main() {
    const phone = "9876543210";
    console.log(`Searching for customer with phone: ${phone}...`);
    const customer = await findCustomerByPhone(phone);

    if (!customer) {
        console.error("Customer not found!");
        process.exit(1);
    }

    console.log(`Found Customer: ${customer.name}`);

    // Fetch ALL fields for this customer
    try {
        const fullData = await fetchDoc<any>("Customer", customer.name);
        if (!fullData) throw new Error("Customer not found (fetch returned null)");

        console.log("--- All Keys ---");
        console.log(Object.keys(fullData));

        console.log("--- Balance Check ---");
        // Check specific known ERPNext fields
        ['total_unpaid', 'outstanding_amount', 'balance', 'grand_total', 'total_due'].forEach(k => {
            if (fullData[k] !== undefined) console.log(`${k}: ${fullData[k]}`);
        });

        console.log("\n--- FULL DATA DUMP ---");
        // console.log(JSON.stringify(fullData, null, 2));

    } catch (e: any) {
        console.error("Error fetching full customer details:", e.response?.data || e.message);
    }
}

main();
