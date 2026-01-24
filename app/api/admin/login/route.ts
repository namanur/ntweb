import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Authenticate an admin by validating the request body password and setting an `admin_session` cookie when valid.
 *
 * On successful authentication sets an `httpOnly` cookie named `admin_session` (secure in production) with a 1-day expiry.
 *
 * @returns `{ success: true }` on successful authentication; `{ success: false }` with status `401` if the password is incorrect, or `{ success: false }` with status `500` if an error occurs.
 */
export async function POST(req: Request) {
    try {
        const { password } = await req.json();

        if (password === process.env.ADMIN_PASSWORD) {
            // Set simple cookie
            (await cookies()).set('admin_session', 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 // 1 day
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false }, { status: 401 });
    } catch (e) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}