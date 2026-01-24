import mysql from 'mysql2/promise';

// Global connection pool
let pool: mysql.Pool;

/**
 * Lazily initializes and returns the shared MariaDB connection pool.
 *
 * @returns The singleton `mysql.Pool` instance configured from environment variables.
 * @throws Error if `MARIADB_HOST` is not defined in the environment variables.
 */
export function getDb() {
    if (!pool) {
        if (!process.env.MARIADB_HOST) {
            throw new Error("MARIADB_HOST is not defined in environment variables");
        }

        pool = mysql.createPool({
            host: process.env.MARIADB_HOST,
            user: process.env.MARIADB_USER,
            password: process.env.MARIADB_PASSWORD,
            database: process.env.MARIADB_DATABASE,
            port: Number(process.env.MARIADB_PORT) || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });
        console.log(`🔌 Connected to MariaDB at ${process.env.MARIADB_HOST}`);
    }
    return pool;
}

/**
 * Execute a SQL query and return the resulting rows.
 *
 * @param sql - The SQL statement to execute, may contain parameter placeholders
 * @param params - Optional array of values to bind to the statement's placeholders
 * @returns The rows returned by the query as an array of `T`
 */
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const db = getDb();
    const [rows] = await db.execute(sql, params);
    return rows as T[];
}

/**
 * Execute a SQL statement and return the resulting MySQL result header.
 *
 * @param sql - The SQL statement to execute (may contain parameter placeholders).
 * @param params - Optional array of values to bind to the statement's placeholders.
 * @returns The MySQL ResultSetHeader describing execution outcome (e.g., affectedRows, insertId, warningCount).
 */
export async function execute(sql: string, params?: any[]): Promise<mysql.ResultSetHeader> {
    const db = getDb();
    const [result] = await db.execute(sql, params);
    return result as mysql.ResultSetHeader;
}