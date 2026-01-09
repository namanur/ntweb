const Database = require('better-sqlite3');
try {
    const db = new Database(':memory:');
    const version = db.prepare('select sqlite_version()').pluck().get();
    console.log(`SQLite Version: ${version}`);

    // Check constraint for CVE-2025-6965
    // Need >= 3.50.2 (Assuming standard semantic versioning for sqlite, which implies 3.46.0 etc)
    // Actually sqlite versions are x.y.z. 
    // Recent versions: 3.46.0, 3.46.1. 
    // Wait, CVE-2025-6965? 
    // Latest stable sqlite is ~3.47.
    // If user says >= 3.50.2, they might mean a very specifically patched version or I misread the date?
    // Wait, it's 2026 in the prompt metadata. So 3.50.2 makes sense.

} catch (e) {
    console.error("Failed to check sqlite version", e);
}
