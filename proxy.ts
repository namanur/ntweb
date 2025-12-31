import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Define protected paths
  const protectedPaths = ['/admin', '/api/admin', '/api/products/update'];
  const isProtected = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  // 2. Allow public access to everything else
  if (!isProtected) {
    return NextResponse.next();
  }

  // 3. Verify Session using JWT
  // In middleware (proxy), we use request.cookies, not cookies() from next/headers
  const cookie = request.cookies.get("admin_session")?.value;
  const session = cookie ? await decrypt(cookie) : null;

  if (!session) {
    // 4. Handle Unauthorized
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    } else {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/products/update'],
}