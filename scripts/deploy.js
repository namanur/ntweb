const { execSync } = require('child_process');

// Helper to run shell commands and show their output in the terminal
const run = (command) => {
    try {
        execSync(command, { stdio: 'inherit' });
    } catch (e) {
        // We allow 'git commit' to fail if there are no changes to commit
        if (command.startsWith('git commit')) {
            console.log("   (No new changes to commit, proceeding...)");
            return;
        }
        throw e;
    }
};

console.log("\x1b[36m%s\x1b[0m", "🚀 Starting One-Click Deployment...");

try {
    // STEP 1: Sync Data from CSV
    // This ensures that if you updated products.csv, the JSON is regenerated immediately.
    console.log("\n🔄 1. Syncing Product Data...");
    run('node scripts/import_csv.js');

    // STEP 2: Stage All Changes
    // "git add ." catches new files (images), modified files (code), and deletions.
    console.log("\n📸 2. Staging all changes (Code, Images, Data)...");
    run('git add .');

    // STEP 3: Commit
    // Automatically adds the current date and time to the commit message.
    const date = new Date().toLocaleString();
    console.log(`\n💾 3. Committing snapshot: "Auto Update ${date}"...`);
    run(`git commit -m "Auto Update: ${date}"`);

    // STEP 4: Push
    console.log("\n☁️ 4. Pushing to GitHub...");
    run('git push origin main');

    console.log("\n\x1b[32m%s\x1b[0m", "✅ SUCCESS! Your site is updating.");
    console.log("   It should be live in ~2 minutes.");

} catch (error) {
    console.error("\n\x1b[31m%s\x1b[0m", "❌ Deployment Failed:");
    console.error(error.message);
    process.exit(1);
}