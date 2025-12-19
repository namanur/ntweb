import 'dotenv/config';
import { erp, findCustomerByPhone } from '../lib/erp';

async function main() {
    const phone = "9876543210";
    const customer = await findCustomerByPhone(phone);

    if (!customer) {
        console.log("Customer not found");
        return;
    }

    console.log(`Creating Opening Balance for: ${customer.name}`);

    try {
        // 1. Determine Accounts
        const DEBTOR_ACCOUNT = "Debtors - NT"; // Assumption
        const OPENING_ACCOUNT = "Temporary Opening - NT"; // Assumption

        // Check if accounts exist, else use defaults or fail
        // For this test, I'll try to use standard accounts if possible, or just standard names.
        // Usually "Debtors" and "Temporary Opening" exist.

        const jeData = {
            doctype: "Journal Entry",
            posting_date: new Date().toISOString().split('T')[0],
            voucher_type: "Opening Entry",
            accounts: [
                {
                    account: DEBTOR_ACCOUNT,
                    party_type: "Customer",
                    party: customer.name,
                    debit_in_account_currency: 500, // ₹500 Opening Balance
                    credit_in_account_currency: 0
                },
                {
                    account: OPENING_ACCOUNT,
                    debit_in_account_currency: 0,
                    credit_in_account_currency: 500
                }
            ]
        };

        const res = await erp.post('/api/resource/Journal Entry', jeData);
        const jeName = res.data.data.name;
        console.log(`Created JE: ${jeName}`);

        // Submit it
        await erp.put(`/api/resource/Journal Entry/${jeName}`, { docstatus: 1 });
        console.log("Journal Entry Submitted!");

    } catch (e: any) {
        console.error("Failed to create JE:", e.response?.data?.exception || e.message);
    }
}

main();
