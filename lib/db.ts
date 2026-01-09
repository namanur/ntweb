import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize persistence DB
const dbPath = path.join(dbDir, 'security.db');
const db = new Database(dbPath);

// Enable WAL for concurrency
db.pragma('journal_mode = WAL');

// 1. Rate Limiting Table (compatible with RateLimiterRes)
db.exec(`
  CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    points INTEGER DEFAULT 0,
    expire INTEGER
  )
`);

// 2. OTP State Table
// Storing hashed OTPs and metadata about attempts
db.exec(`
  CREATE TABLE IF NOT EXISTS otp_sessions (
    phone TEXT PRIMARY KEY,
    hashed_otp TEXT,
    attempts INTEGER DEFAULT 0,
    locked_until INTEGER DEFAULT 0,
    expires_at INTEGER,
    created_at INTEGER
  )
`);

// 3. Blocklist / Reputation (optional for future)
db.exec(`
  CREATE TABLE IF NOT EXISTS ip_reputation (
    ip TEXT PRIMARY KEY,
    score INTEGER DEFAULT 0, 
    last_seen INTEGER
  )
`);

export default db;
