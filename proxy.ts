import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const adminToken = request.cookies.get('admin_token')?.value
  const adminPassword = process.env.ADMIN_PASSWORD

  // 🔒 SECURITY FIX: 
  // 1. Ensure adminPassword exists (is not undefined/empty)
  // 2. Ensure adminToken exists
  // 3. Ensure they match
  const isAuthenticated =
    adminPassword &&
    adminToken &&
    (adminToken === adminPassword);

  // Protect Admin Routes
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Protect API Routes
  if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/products/update')) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/products/update'],
}