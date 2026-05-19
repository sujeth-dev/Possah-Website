import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/supabase/types'

// Browser-side Supabase client — use in Client Components
export const createClient = () =>
  createClientComponentClient<Database>()
