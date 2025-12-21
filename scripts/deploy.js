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

const args = process.argv.slice(2);
const isQuick = args.includes('--quick');
const isErp = args.includes('--erp');
const customMessage = args.filter(arg => arg !== '--quick' && arg !== '--erp').join(' ');

try {
    if (!isQuick) {
        // STEP 1: Sync from ERP (Single Source of Truth)
        console.log("\n🔄 1. Syncing Product Data from ERPNext...");
        run('npx tsx scripts/sync_from_erp.ts');
    } else {
        console.log("\n⏩ Skipping Data Sync (--quick mode enabled)");
    }

    // STEP 2: Stage All Changes
    // "git add ." catches new files (images), modified files (code), and deletions.
    console.log("\n📸 2. Staging all changes (Code, Images, Data)...");
    run('git add .');

    // STEP 3: Commit
    // Automatically adds the current date and time to the commit message.
    const date = new Date().toLocaleString();
    const message = customMessage ? `${customMessage} (${date})` : `Auto Update: ${date}`;

    console.log(`\n💾 3. Committing snapshot: "${message}"...`);
    run(`git commit -m "${message}"`);

    // STEP 4: Push
    console.log("\n☁️ 4. Pushing to GitHub...");
    run('git push origin main');

    console.log("\n\x1b[32m%s\x1b[0m", "✅ Deployment Complete! Your changes are live.");

} catch (e) {
    console.error("\n❌ Deployment Failed:", e.message);
    process.exit(1);
}