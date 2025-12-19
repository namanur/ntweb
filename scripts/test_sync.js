const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const { syncCompanyDetails } = require('../lib/erp');

setTimeout(async () => {
    console.log("Running Sync Test...");
    if (process.env.ERP_API_KEY) {
        await syncCompanyDetails();
        console.log("Done.");
    } else {
        console.log("Skipping sync: No API Key in env.");
    }
}, 1000);
