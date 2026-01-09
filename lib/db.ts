import 'server-only';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize persistence DB (Singleton for HMR)
const dbPath = path.join(dbDir, 'security.db');

const globalForDb = globalThis as unknown as { __securityDb?: Database.Database };
const db = globalForDb.__securityDb ?? new Database(dbPath);

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__securityDb = db;
}

// Enable WAL for concurrency
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

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

// --- CLEANUP TASKS ---

/**
 * Removes expired OTP sessions to prevent table bloat.
 */
export function cleanupExpiredOtpSessions() {
  try {
    const now = Date.now();
    const info = db.prepare('DELETE FROM otp_sessions WHERE expires_at <= ?').run(now);
    if (info.changes > 0) {
      // console.log(`[DB] Cleaned up ${info.changes} expired OTP sessions`);
    }
  } catch (error) {
    console.error('Failed to cleanup OTP sessions:', error);
  }
}

/**
 * Removes stale IP reputation entries.
 * @param retentionMs - How long to keep IP records (default: 7 days)
 */
export function cleanupStaleIpReputation(retentionMs: number = 7 * 24 * 60 * 60 * 1000) {
  try {
    const threshold = Date.now() - retentionMs;
    const info = db.prepare('DELETE FROM ip_reputation WHERE last_seen <= ?').run(threshold);
    if (info.changes > 0) {
      // console.log(`[DB] Cleaned up ${info.changes} stale IP records`);
    }
  } catch (error) {
    console.error('Failed to cleanup IP reputation:', error);
  }
}

// Schedule cleanup jobs (only in production/dev server, not build/test)
if (process.env.NODE_ENV !== 'test') {
  // Run cleanup every hour
  const CLEANUP_INTERVAL = 60 * 60 * 1000;

  // Initial cleanup on boot (delayed slightly to not block startup)
  setTimeout(() => {
    cleanupExpiredOtpSessions();
    cleanupStaleIpReputation();
  }, 10000).unref();

  setInterval(() => {
    cleanupExpiredOtpSessions();
    cleanupStaleIpReputation();
  }, CLEANUP_INTERVAL).unref();
}
