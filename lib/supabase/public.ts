import { createClient } from '@supabase/supabase-js'

/**
 * Public server-side Supabase client.
 *
 * Use this for anonymous storefront reads that do not depend on request
 * cookies or a signed-in session. Keeping public pages on this helper avoids
 * accidental dynamic rendering from cookie access during builds.
 *
 * The Database generic is intentionally omitted here to match the existing
 * cookie-aware server helper. Relationship metadata is still incomplete in
 * `lib/supabase/types.ts`, and joined storefront selects would otherwise
 * resolve to `never` during production builds.
 */
export const createPublicClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing Supabase public credentials: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
