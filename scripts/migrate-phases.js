const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

/**
 * Run database migrations by applying predefined SQL files to the configured MariaDB instance.
 *
 * Connects to the database using environment variables, attempts to apply the SQL files
 * 'data/phase4_schemes.sql' and 'data/phase6_tasks.sql' (skipping any that are missing),
 * logs and continues when a table already exists (error code `ER_TABLE_EXISTS_ERROR`),
 * logs other per-file errors, closes the connection on completion, and exits the process
 * with code 1 on a fatal connection error.
 */
async function run() {
    console.log("🚀 Starting Database Migration...");
    console.log(`🔌 Connecting to ${process.env.MARIADB_HOST}:${process.env.MARIADB_PORT} as ${process.env.MARIADB_USER}`);

    try {
        const connection = await mysql.createConnection({
            host: process.env.MARIADB_HOST,
            user: process.env.MARIADB_USER,
            password: process.env.MARIADB_PASSWORD,
            database: process.env.MARIADB_DATABASE,
            port: Number(process.env.MARIADB_PORT),
            multipleStatements: true
        });

        console.log("✅ Bonded to Database.");

        const files = ['data/phase4_schemes.sql', 'data/phase6_tasks.sql'];

        for (const file of files) {
            const filePath = path.join(process.cwd(), file);
            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️  Skipping ${file}: File not found.`);
                continue;
            }

            const sql = fs.readFileSync(filePath, 'utf8');
            try {
                await connection.query(sql);
                console.log(`✨ Applied Schema: ${file}`);
            } catch (e) {
                // Ignore "Table already exists"
                if (e.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log(`ℹ️  ${file}: Table already exists.`);
                } else {
                    console.error(`❌ Failed ${file}:`, e.message);
                }
            }
        }

        await connection.end();
        console.log("🏁 Migration Complete.");

    } catch (e) {
        console.error("🔥 Fatal Connection Error:", e.message);
        process.exit(1);
    }
}

run();