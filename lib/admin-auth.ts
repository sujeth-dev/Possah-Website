import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

/**
 * Verifies that the incoming request carries a valid NextAuth JWT with isAdmin=true.
 * Used in every /api/admin/* route handler as the primary auth guard.
 *
 * Note: middleware.ts only protects /admin/* page routes, not /api/admin/* API routes,
 * so this function is the sole auth check for admin API endpoints.
 *
 * Test harness bypass: when ADMIN_TEST_SECRET is set in .env.local AND the runtime
 * is not production, requests carrying a matching X-Admin-Test-Token header are
 * admitted. This lets the scripts/admin_test harness authenticate without a real
 * Google OAuth session. The secret is never present in the Vercel production env,
 * so this path is unreachable in production.
 */
export async function requireAdminAuth(request: NextRequest): Promise<boolean> {
  const testSecret = process.env.ADMIN_TEST_SECRET
  if (testSecret && process.env.NODE_ENV !== 'production') {
    if (request.headers.get('x-admin-test-token') === testSecret) return true
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  return token?.isAdmin === true
}
