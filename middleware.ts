import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Admin route guard.
 *
 * Dev:  all /admin/* routes pass through without auth (fast iteration).
 * Prod: decodes the NextAuth JWT from the session cookie, verifies token.isAdmin === true.
 *       isAdmin is embedded at sign-in time by checking the admin_users table (see lib/auth.ts).
 *       Cookie presence alone is NOT sufficient — any authenticated Google user could otherwise
 *       access /admin/* by knowing the URL.
 */
export async function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development'
  const pathname = request.nextUrl.pathname
  const isAdminRoute = pathname.startsWith('/admin')

  // ─── Dev: bypass ALL admin auth ───────────────────────────────────────────
  if (isDev && isAdminRoute) {
    return NextResponse.next()
  }

  // ─── Prod: verify JWT + isAdmin flag ──────────────────────────────────────
  if (!isDev && isAdminRoute) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token || !token.isAdmin) {
      const loginUrl = new URL('/auth/signin', request.url)
      loginUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  // Only run middleware on admin routes — zero overhead on public/shop pages
  matcher: ['/admin/:path*'],
}
