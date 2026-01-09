import db from '../db';
import crypto from 'crypto';

const CONSTANTS = {
    OTP_TTL_SEC: 300,        // 5 Minutes
    MAX_ATTEMPTS: 3,         // 3 Guesses
    LOCKOUT_SEC: 900         // 15 Minutes Lockout
};

export class OTPService {

    /**
     * Generate, Hash, and Store OTP
     */
    static async generate(phone: string): Promise<string> {
        // 1. Check Lockout
        const existing = db.prepare('SELECT locked_until FROM otp_sessions WHERE phone = ?').get(phone) as { locked_until: number } | undefined;

        if (existing && existing.locked_until > Date.now()) {
            throw new Error('Too many failed attempts. Please try again later.');
        }

        // 2. Generate
        const code = crypto.randomInt(100000, 999999).toString();

        // 3. Hash
        const hash = crypto.createHash('sha256').update(code).digest('hex');

        // 4. Store (Upsert)
        const now = Date.now();
        const expiresAt = now + (CONSTANTS.OTP_TTL_SEC * 1000);

        db.prepare(`
            INSERT INTO otp_sessions (phone, hashed_otp, attempts, locked_until, expires_at, created_at)
            VALUES (?, ?, 0, 0, ?, ?)
            ON CONFLICT(phone) DO UPDATE SET
                hashed_otp = excluded.hashed_otp,
                attempts = 0,
                locked_until = 0,
                expires_at = excluded.expires_at,
                created_at = excluded.created_at
        `).run(phone, hash, expiresAt, now);

        return code;
    }

    /**
     * Verify OTP
     * Returns true if valid, throws error if invalid
     */
    static async verify(phone: string, code: string): Promise<boolean> {
        const row = db.prepare('SELECT hashed_otp, attempts, locked_until, expires_at FROM otp_sessions WHERE phone = ?').get(phone) as any;

        if (!row) {
            throw new Error('No OTP request found');
        }

        // 1. Check Lockout
        if (row.locked_until > Date.now()) {
            throw new Error('Account temporarily locked due to failed attempts');
        }

        // 2. Check Expiry
        if (Date.now() > row.expires_at) {
            throw new Error('OTP expired');
        }

        // 3. Check Hash
        const inputHash = crypto.createHash('sha256').update(code).digest('hex');

        if (inputHash === row.hashed_otp) {
            // SUCCESS: Clear OTP record to prevent replay
            // Actually, maybe keep it but mark as used? For now, we delete to enforce single-use.
            db.prepare('DELETE FROM otp_sessions WHERE phone = ?').run(phone);
            return true;
        } else {
            // FAIL: Increment attempts
            const newAttempts = row.attempts + 1;

            if (newAttempts >= CONSTANTS.MAX_ATTEMPTS) {
                // LOCKOUT
                const lockUntil = Date.now() + (CONSTANTS.LOCKOUT_SEC * 1000);
                db.prepare('UPDATE otp_sessions SET attempts = ?, locked_until = ? WHERE phone = ?').run(newAttempts, lockUntil, phone);
                throw new Error('Too many failed attempts. Account locked for 15 minutes.');
            } else {
                db.prepare('UPDATE otp_sessions SET attempts = ? WHERE phone = ?').run(newAttempts, phone);
                throw new Error('Incorrect OTP');
            }
        }
    }
}
