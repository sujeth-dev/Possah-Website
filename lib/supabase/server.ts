import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

// Server-side Supabase client — use in Server Components and API routes.
// Auth is handled by NextAuth; this client is for DB queries only.
export const createServerClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new Error('Missing Supabase credentials')
  return createClient<Database>(url, anonKey)
}
