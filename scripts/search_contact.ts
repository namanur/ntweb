import 'dotenv/config';
import { erp } from '../lib/erp';

async function main() {
    const phone = "6204188728";
    console.log(`Searching Contact List for: ${phone}`);

    try {
        // Search in Contact doctype
        // Try 'mobile_no' and 'phone' fields
        const res = await erp.get('/api/resource/Contact', {
            params: {
                filters: JSON.stringify([
                    ["mobile_no", "like", `%${phone}%`]
                ]),
                fields: JSON.stringify(["name", "first_name", "last_name", "mobile_no", "is_primary_contact", "links"])
            }
        });

        const contacts = res.data.data;
        if (contacts.length > 0) {
            console.log("✅ Found Contact matches:");
            console.log(JSON.stringify(contacts, null, 2));
        } else {
            console.log("❌ No Contact found for this number.");
        }

    } catch (e) {
        console.error(e);
    }
}

main();
