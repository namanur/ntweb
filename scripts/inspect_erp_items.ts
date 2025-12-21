
import 'dotenv/config';
import { searchDocs } from '../lib/erpnext';

async function inspectItems() {
    try {
        console.log("Fetching items from ERP...");
        // Fetch a few items
        const items = await searchDocs<any>("Item", [], ["*"], 5); // Assuming * works or list typical fields
        console.log(JSON.stringify(items, null, 2));
    } catch (error: any) {
        console.error("Error fetching items:", error.message);
    }
}

inspectItems();
