
import 'dotenv/config';
import axios from 'axios';

const ERP_URL = process.env.ERP_NEXT_URL || "http://127.0.0.1:8080";
const API_KEY = process.env.ERP_API_KEY;
const API_SECRET = process.env.ERP_API_SECRET;

const call = axios.create({
    baseURL: ERP_URL,
    headers: {
        'Authorization': `token ${API_KEY}:${API_SECRET}`,
        'Content-Type': 'application/json',
    },
});

async function inspectItems() {
    try {
        console.log("Fetching items from ERP...");
        // Fetch a few items with all fields to inspect structure
        const res = await call.get(`/api/resource/Item?fields=["*"]&limit_page_length=5`);
        console.log(JSON.stringify(res.data.data, null, 2));
    } catch (error) {
        console.error("Error fetching items:", error.message);
        if (error.response) console.error(error.response.data);
    }
}

inspectItems();
