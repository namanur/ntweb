import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // --- SECURITY HEADERS (Global) ---
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // --- STRICT CONTENT-TYPE (Global) ---
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentType = request.headers.get('content-type');
    if (contentType && !contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
      // Log or handle mismatch
    }
  }

  // 1. Define protected paths
  const protectedPaths = ['/admin', '/api/admin', '/api/products/update'];
  const isProtected = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  // 2. Allow public access to everything else
  if (!isProtected) {
    return response; // Return response with headers
  }

  // 3. Verify Session using JWT
  const cookie = request.cookies.get("admin_session")?.value;
  const session = cookie ? await decrypt(cookie) : null;

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    } else {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response; // Return response with headers
}

export const config = {
  matcher: ['/:path*'], // Apply to all paths for security headers
}