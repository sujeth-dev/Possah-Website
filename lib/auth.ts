import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── NextAuth type extensions ──────────────────────────────────────────────────
// Adds isAdmin to the JWT so middleware can read it without a DB call per request.
declare module 'next-auth/jwt' {
  interface JWT {
    isAdmin?: boolean
  }
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      isAdmin: boolean
    }
  }
}

// Dev mock session — never used in production
export const DEV_SESSION = {
  user: {
    id: 'dev-user-001',
    name: 'Dev User',
    email: 'dev@thepossah.com',
    image: null,
    isAdmin: true,
  },
  expires: '2099-01-01T00:00:00.000Z',
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // `user` is only present on the initial sign-in — use it to embed isAdmin
      // into the JWT so every subsequent request reads from the token, not the DB.
      if (user) {
        token.sub = user.id

        try {
          const supabase = createAdminClient()
          const { data } = await supabase
            .from('admin_users')
            .select('id')
            .eq('email', user.email ?? '')
            .eq('is_active', true)  // FIX-SEC-05: deactivated admins must not get JWT flag
            .maybeSingle()

          token.isAdmin = !!data
        } catch (err) {
          console.error('[auth] Admin check failed:', err)
          token.isAdmin = false
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        const user = session.user as typeof session.user & { id: string; isAdmin: boolean }
        user.id = token.sub
        user.isAdmin = token.isAdmin ?? false
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
}