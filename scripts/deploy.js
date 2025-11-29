const { execSync } = require('child_process');

console.log("\x1b[36m%s\x1b[0m", "🚀 Starting Catalog Deployment...");

try {
    // 1. Add new products and images to Git staging area
    console.log("📸 Staging local data (products.json & images)...");
    execSync('git add src/data/products.json public/images');

    // 2. Commit changes
    const date = new Date().toISOString().split('T')[0];
    console.log("💾 Committing snapshot...");
    
    try {
        execSync(`git commit -m "Catalog Update: ${date}"`);
    } catch (e) {
        console.log("  - No new changes to commit. Proceeding to push...");
    }

    // 3. Push to GitHub (This triggers Vercel/Cloudflare build)
    console.log("☁️ Pushing to Cloud...");
    execSync('git push origin main');

    console.log("\x1b[32m%s\x1b[0m", "✅ Deployment Triggered!");
    console.log("   - Your public site will update in ~2 minutes.");
    console.log("   - Customers can view changes at: https://catalog.nandantrader.in");

} catch (error) {
    console.error("\x1b[31m%s\x1b[0m", "❌ Deployment Failed:");
    console.error(error.message);
}