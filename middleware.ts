import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 1. Get the token from cookies
  const adminToken = request.cookies.get('admin_token')?.value
  
  // 2. Check if it matches the env password
  // (This ensures only people who logged in with the REAL password get access)
  const isAuthenticated = adminToken === process.env.ADMIN_PASSWORD

  // 3. Protect Admin Routes
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // 4. Protect API Routes (Optional but recommended)
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