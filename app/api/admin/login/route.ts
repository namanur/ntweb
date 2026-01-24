import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { password } = body;

        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword || typeof password !== 'string') {
            return NextResponse.json({ success: false, message: "Invalid Request" }, { status: 401 });
        }

        if (password === adminPassword) {
            // Set simple cookie
            (await cookies()).set('admin_session', 'true', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/admin',
                maxAge: 60 * 60 * 24 // 1 day
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false }, { status: 401 });
    } catch (e) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
