import 'dotenv/config';
import { searchDocs } from '../lib/erpnext';

async function main() {
    const phone = "6204188728";
    console.log(`Searching Contact List for: ${phone}`);

    try {
        // Search in Contact doctype
        // Try 'mobile_no' and 'phone' fields
        // Search in Contact doctype
        // Try 'mobile_no' and 'phone' fields
        const contacts = await searchDocs<any>("Contact",
            [["mobile_no", "like", `%${phone}%`]],
            ["name", "first_name", "last_name", "mobile_no", "is_primary_contact", "links"]
        );
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
