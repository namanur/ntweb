const { execSync } = require('child_process');

console.log("\x1b[36m%s\x1b[0m", "🚀 Starting Full Deployment...");

try {
    // 0. Import CSV (Resets catalog to base state)
    try {
        console.log("🔄 Step 1: Importing data from products.csv...");
        execSync('node scripts/import_csv.js', { stdio: 'inherit' });
    } catch (e) {
        console.log("⚠️ CSV Import skipped. Proceeding...");
    }

    // 1. Sync Prices (Calculates formulas & applies manual prices) -> THIS WAS MISSING
    try {
        console.log("💰 Step 2: Calculating Prices & Margins...");
        execSync('node scripts/sync_prices.js', { stdio: 'inherit' });
    } catch (e) {
        console.error("❌ Price Sync Failed! Stopping deployment to prevent bad data.");
        process.exit(1); // Stop everything if prices fail
    }

    // 2. Add ALL changes (Code + Data + Images)
    console.log("📸 Step 3: Staging all changes...");
    execSync('git add .');

    // 3. Commit changes
    const date = new Date().toISOString().split('T')[0];
    console.log("💾 Step 4: Committing snapshot...");
    
    try {
        execSync(`git commit -m "Site Update: ${date}"`);
    } catch (e) {
        console.log("  - No new changes to commit. Proceeding to push...");
    }

    // 4. Push to GitHub
    console.log("☁️ Step 5: Pushing to Cloud...");
    execSync('git push origin main');

    console.log("\x1b[32m%s\x1b[0m", "✅ Deployment Triggered!");
    console.log("   - Your site will update in ~2 minutes.");

} catch (error) {
    console.error("\x1b[31m%s\x1b[0m", "❌ Deployment Failed:");
    console.error(error.message);
}