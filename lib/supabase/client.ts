import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

// Browser-side Supabase client — use in Client Components
export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
