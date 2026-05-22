import { createClient } from '@supabase/supabase-js'
import { env } from './env.mjs'

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('\n[db] FATAL: Missing env vars.')
  console.error('  NEXT_PUBLIC_SUPABASE_URL  →', url ? 'OK' : 'MISSING')
  console.error('  SUPABASE_SERVICE_ROLE_KEY →', key ? 'OK' : 'MISSING')
  console.error('  Check .env.local in the project root.\n')
  process.exit(1)
}

export const db = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})
