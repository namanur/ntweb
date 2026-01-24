'use server';

interface ERPCustomer {
    name: string;
    customer_name: string;
    mobile_no: string;
    customer_group: string;
    territory: string;
}

/**
 * Search ERP customers by name using a case-insensitive "like" match.
 *
 * @param query - The search term used to match `customer_name`; must be at least 3 characters to perform a request.
 * @returns An array of `ERPCustomer` objects whose `customer_name` matches the query. Returns an empty array for queries shorter than 3 characters, when ERP connection credentials are missing, if the ERP API responds with a non-OK status, or on errors.
 */
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