import 'dotenv/config';
import { erp, findCustomerByPhone } from '../lib/erp';

async function main() {
    const phone = "6204188728";
    console.log(`Checking logic for phone: ${phone}`);

    // 1. Try standard find
    const customer = await findCustomerByPhone(phone);
    if (customer) {
        console.log("✅ Custom Found via Standard Search:");
        console.log(customer);
    } else {
        console.log("❌ Customer NOT FOUND via Standard Search");
    }

    // 2. Try loose search (wildcard) to see if it exists with prefix/formatting
    console.log("Searching with Wildcard %6204188728% ...");
    try {
        const res = await erp.get('/api/resource/Customer', {
            params: {
                filters: JSON.stringify([["mobile_no", "like", `%${phone}%`]]),
                fields: JSON.stringify(["name", "customer_name", "mobile_no"])
            }
        });
        if (res.data.data.length > 0) {
            console.log("⚠️ Found similar matches:");
            console.log(res.data.data);
        } else {
            console.log("❌ No matches found even with wildcard.");
        }
    } catch (e) {
        console.error(e);
    }
}

main();
