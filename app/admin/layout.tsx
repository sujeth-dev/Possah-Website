import type { Metadata } from 'next'
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient'

export const metadata: Metadata = {
  title: {
    template: '%s - Possah Admin',
    default: 'Admin - The Possah',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic = 'force-dynamic'

/**
 * Admin layout server component.
 *
 * Reads NODE_ENV once on the server, passes isDev to the client shell.
 * All /admin/* routes inherit this layout.
 * Middleware already handles the auth guard:
 *   - Dev: all /admin/* pass through
 *   - Prod: JWT + isAdmin check, redirect to /auth/signin if absent
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <AdminLayoutClient isDev={isDev}>
      {children}
    </AdminLayoutClient>
  )
}
