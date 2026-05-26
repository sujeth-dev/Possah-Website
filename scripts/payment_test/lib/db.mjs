import { createClient } from '@supabase/supabase-js'
import { ENV } from './env.mjs'

// Service-role client — bypasses RLS, used for seed/cleanup/verify
export const db = createClient(
  ENV.NEXT_PUBLIC_SUPABASE_URL,
  ENV.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

/**
 * Fetch a single row and throw if not found.
 * @param {string} table
 * @param {Record<string,unknown>} match
 */
export async function dbGet(table, match) {
  let q = db.from(table).select('*')
  for (const [k, v] of Object.entries(match)) q = q.eq(k, v)
  const { data, error } = await q.single()
  if (error || !data) throw new Error(`[db] ${table} not found: ${JSON.stringify(match)}`)
  return data
}

/**
 * Fetch rows by match.
 */
export async function dbList(table, match = {}) {
  let q = db.from(table).select('*')
  for (const [k, v] of Object.entries(match)) q = q.eq(k, v)
  const { data, error } = await q
  if (error) throw new Error(`[db] list ${table}: ${error.message}`)
  return data ?? []
}
