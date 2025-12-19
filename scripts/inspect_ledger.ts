import 'dotenv/config';
import { erp, findCustomerByPhone } from '../lib/erp';

async function main() {
    const phone = "9876543210";
    const customer = await findCustomerByPhone(phone);

    if (!customer) {
        console.error("Customer not found!");
        process.exit(1);
    }

    console.log(`Fetching Ledger for: ${customer.name}`);

    try {
        const res = await erp.get('/api/resource/GL Entry', {
            params: {
                filters: JSON.stringify([
                    ["party_type", "=", "Customer"],
                    ["party", "=", customer.name]
                ]),
                fields: JSON.stringify(["posting_date", "voucher_type", "voucher_no", "debit", "credit", "is_opening"]),
                limit_page_length: 50
            }
        });

        const entries = res.data.data;
        console.log(`Found ${entries.length} GL Entries.`);

        let balance = 0;
        entries.forEach((e: any) => {
            const amount = e.debit - e.credit;
            balance += amount;
            console.log(`[${e.posting_date}] ${e.voucher_type} (${e.voucher_no}) ${e.is_opening ? '[OPENING]' : ''}: ${amount} (Bal: ${balance})`);
        });

        console.log(`\nCALCULATED BALANCE: ${balance}`);

    } catch (e: any) {
        console.error("Error fetching ledger:", e.response?.data || e.message);
    }
}

main();
