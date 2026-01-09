import { RateLimiterRes, IRateLimiterOptions } from 'rate-limiter-flexible';
import db from '../db';

/**
 * Custom Rate Limiter Driver for better-sqlite3
 * Implements the minimal interface needed for 'rate-limiter-flexible' 
 * or mimics its behavior if we build a custom class (simpler for this specific DB).
 */
export class SQLiteRateLimiter {
    private keyPrefix: string;
    private points: number;
    private duration: number;

    constructor(opts: { keyPrefix: string, points: number, duration: number }) {
        this.keyPrefix = opts.keyPrefix;
        this.points = opts.points;
        this.duration = opts.duration;
    }

    /**
     * Consume points for a key
     */
    async consume(key: string, pointsToConsume: number = 1): Promise<RateLimiterRes> {
        const now = Date.now();
        const namespacedKey = `${this.keyPrefix}:${key}`;
        const expiry = now + (this.duration * 1000);

        // Transaction to ensure atomicity
        const result = db.transaction(() => {
            // Cleanup expired
            db.prepare('DELETE FROM rate_limits WHERE key = ? AND expire <= ?').run(namespacedKey, now);

            // Get current
            const row = db.prepare('SELECT points, expire FROM rate_limits WHERE key = ?').get(namespacedKey) as { points: number, expire: number } | undefined;

            let currentPoints = row ? row.points : 0;
            let currentExpire = row ? row.expire : expiry;

            if (currentPoints + pointsToConsume > this.points) {
                // BLOCKED
                throw new Error('Blocked'); // Throw to signal rejection
            }

            // UPDATE
            if (row) {
                db.prepare('UPDATE rate_limits SET points = points + ? WHERE key = ?').run(pointsToConsume, namespacedKey);
            } else {
                db.prepare('INSERT INTO rate_limits (key, points, expire) VALUES (?, ?, ?)').run(namespacedKey, pointsToConsume, expiry);
            }

            return {
                remainingPoints: this.points - (currentPoints + pointsToConsume),
                msBeforeNext: Math.max(0, currentExpire - now),
                consumedPoints: currentPoints + pointsToConsume,
                isFirstInDuration: !row
            };
        })();

        return new RateLimiterRes(
            result.remainingPoints,
            result.msBeforeNext,
            result.consumedPoints,
            result.isFirstInDuration
        );
    }
}

// -- DEFINITIONS -- 

// 1. IP Whitelist/Blacklist Logic can go here (skipped for now)

// 2. Limiters
export const limiters = {
    // Standard API Limit (60/min)
    global: new SQLiteRateLimiter({
        keyPrefix: 'global',
        points: 60,
        duration: 60
    }),

    // OTP Request Limit per IP (3/min)
    otpIp: new SQLiteRateLimiter({
        keyPrefix: 'otp_ip',
        points: 3,
        duration: 60
    }),

    // OTP Request Limit per Phone (3/min) - Prevents SMS spam even if IP rotates
    otpPhone: new SQLiteRateLimiter({
        keyPrefix: 'otp_phone',
        points: 3,
        duration: 60
    }),

    // OTP Hard Limit per Phone (10/day) - Cost control
    otpDay: new SQLiteRateLimiter({
        keyPrefix: 'otp_day',
        points: 10,
        duration: 86400 // 24 hours
    })
};
