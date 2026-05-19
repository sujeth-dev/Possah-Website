import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Server-side Supabase client — use in Server Components and API routes.
// Database generic is intentionally omitted here; the Database type isn't fully
// set up with Relationships yet, so joined selects resolve to `never`. Each
// query function uses an explicit return type for type safety instead.
export const createServerClient = () =>
  createServerComponentClient({ cookies })
