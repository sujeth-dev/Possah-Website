/**
 * Supabase admin client — uses service role key (bypasses RLS).
 * Import this in every script.
 */
import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
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

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
})

/** Upload buffer to Cloudflare R2. Overwrites if exists. Returns public CDN URL. */
export async function uploadToStorage(storagePath, buffer, contentType = 'image/webp') {
  const bucket = process.env.R2_BUCKET_NAME ?? 'possah-media'
  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL

  if (!process.env.CF_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error('R2 credentials missing (CF_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)')
  }
  if (!publicUrl) {
    throw new Error('Missing NEXT_PUBLIC_R2_PUBLIC_URL in .env.local')
  }

  await r2Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: storagePath,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }))

  return `${publicUrl}/${storagePath}`
}

/** Tiny helper — throws on Supabase error. */
export function check(label, error) {
  if (error) throw new Error(`[${label}] ${error.message}`)
}
