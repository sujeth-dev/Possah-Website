import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

/**
 * Verifies that the incoming request carries a valid NextAuth JWT with isAdmin=true.
 * Used in every /api/admin/* route handler as the primary auth guard.
 *
 * Note: middleware.ts only protects /admin/* page routes, not /api/admin/* API routes,
 * so this function is the sole auth check for admin API endpoints.
 */
export async function requireAdminAuth(request: NextRequest): Promise<boolean> {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  return token?.isAdmin === true
}
