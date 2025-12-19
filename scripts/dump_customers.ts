import 'dotenv/config';
import { erp } from '../lib/erp';

async function main() {
    console.log("Dumping ALL Customers...");
    try {
        const res = await erp.get('/api/resource/Customer', {
            params: {
                fields: JSON.stringify(["name", "customer_name", "mobile_no", "email_id"])
            }
        });
        console.log(JSON.stringify(res.data.data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

main();
