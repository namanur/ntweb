
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './lib/auth';

export async function middleware(request: NextRequest) {
    // 1. Define protected paths
    const protectedPaths = ['/admin', '/api/admin'];
    const isProtected = protectedPaths.some((path) =>
        request.nextUrl.pathname.startsWith(path)
    );

    // 2. Allow public access to everything else
    if (!isProtected) {
        return NextResponse.next();
    }

    // 3. Verify Session
    // Note: getSession uses cookies(), which is available in middleware
    const session = await getSession();

    if (!session) {
        // 4. Handle Unauthorized
        if (request.nextUrl.pathname.startsWith('/api/')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        } else {
            const loginUrl = new URL('/login', request.url);
            // Optional: Add ?next=... handling here if desired
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/api/admin/:path*'],
};
