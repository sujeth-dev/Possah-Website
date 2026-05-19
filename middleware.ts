import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development'
  const pathname = request.nextUrl.pathname
  const isAdminRoute = pathname.startsWith('/admin')

  // ─── Dev: bypass ALL admin auth — pass straight through ───
  if (isDev && isAdminRoute) {
    return NextResponse.next()
  }

  // ─── Prod: require session cookie for /admin/* ─────────────
  if (!isDev && isAdminRoute) {
    // NextAuth sets this cookie on sign-in
    const sessionToken =
      request.cookies.get('next-auth.session-token') ??
      request.cookies.get('__Secure-next-auth.session-token')

    if (!sessionToken) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  // Only run middleware on admin routes — no overhead on public pages
  matcher: ['/admin/:path*'],
}
