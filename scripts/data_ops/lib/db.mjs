/**
 * Supabase admin client — uses service role key (bypasses RLS).
 * Import this in every script.
 */
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from './env.mjs'

loadEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL in .env.local')
if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in .env.local')

export const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export const STORAGE_BUCKET = 'possah-media'

/** Upload buffer to Supabase Storage. Overwrites if exists (upsert). Returns public URL. */
export async function uploadToStorage(storagePath, buffer, contentType = 'image/webp') {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: true })
  if (error) throw new Error(`Storage upload failed [${storagePath}]: ${error.message}`)
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

/** Tiny helper — throws on Supabase error. */
export function check(label, error) {
  if (error) throw new Error(`[${label}] ${error.message}`)
}
