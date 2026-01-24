import mysql from 'mysql2/promise';

// Global connection pool
let pool: mysql.Pool;

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

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const db = getDb();
    const [rows] = await db.execute(sql, params);
    return rows as T[];
}

export async function execute(sql: string, params?: any[]): Promise<mysql.ResultSetHeader> {
    const db = getDb();
    const [result] = await db.execute(sql, params);
    return result as mysql.ResultSetHeader;
}
