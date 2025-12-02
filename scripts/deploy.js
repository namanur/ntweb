const { execSync } = require('child_process');

console.log("\x1b[36m%s\x1b[0m", "🚀 Starting Full Deployment...");

try {
    // 0. Import CSV (Keep your catalog synced)
    try {
        console.log("🔄 Importing data from products.csv...");
        execSync('node scripts/import_csv.js', { stdio: 'inherit' });
    } catch (e) {
        console.log("⚠️ CSV Import skipped. Proceeding with code deployment...");
    }

    // 1. Add ALL changes (Code + Data + Images)
    // Changing specific files to "." captures everything
    console.log("📸 Staging all changes...");
    execSync('git add .');

    // 2. Commit changes
    const date = new Date().toISOString().split('T')[0];
    console.log("💾 Committing snapshot...");
    
    try {
        execSync(`git commit -m "Site Update: ${date}"`);
    } catch (e) {
        console.log("  - No new changes to commit. Proceeding to push...");
    }

    // 3. Push to GitHub
    console.log("☁️ Pushing to Cloud...");
    execSync('git push origin main');

    console.log("\x1b[32m%s\x1b[0m", "✅ Deployment Triggered!");
    console.log("   - Your site will update in ~2 minutes.");

} catch (error) {
    console.error("\x1b[31m%s\x1b[0m", "❌ Deployment Failed:");
    console.error(error.message);
}