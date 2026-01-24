'use server';

interface ERPCustomer {
    name: string;
    customer_name: string;
    mobile_no: string;
    customer_group: string;
    territory: string;
}

export async function searchERPCustomers(query: string): Promise<ERPCustomer[]> {
    if (!query || query.length < 3) return [];

    const erpUrl = process.env.ERP_NEXT_URL;
    const apiKey = process.env.ERP_API_KEY;
    const apiSecret = process.env.ERP_API_SECRET;

    if (!erpUrl || !apiKey || !apiSecret) return [];

    try {
        // Search by name or mobile
        // Using 'Customer' doctype
        // filters=[["customer_name", "like", "%query%"]]
        const encodedQuery = encodeURIComponent(`%${query}%`);
        const url = `${erpUrl}/api/resource/Customer?filters=[["customer_name","like","${encodedQuery}"]]&fields=["name","customer_name","mobile_no","customer_group","territory"]&limit_page_length=10`;

        const res = await fetch(url, {
            headers: { 'Authorization': `token ${apiKey}:${apiSecret}` },
            cache: 'no-store'
        });

        if (res.ok) {
            const data = await res.json();
            return data.data || [];
        }
        return [];
    } catch (e) {
        console.error("ERP Customer Search Failed", e);
        return [];
    }
}
