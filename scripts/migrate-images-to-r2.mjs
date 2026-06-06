/**
 * ONE-TIME MIGRATION: Supabase possah-media bucket → Cloudflare R2
 *
 * - Downloads every file from Supabase storage
 * - Uploads to R2 with the same key/path
 * - Does NOT delete source files (safe to re-run)
 *
 * Prerequisites: R2 env vars set in .env.local
 *   CF_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 *   R2_BUCKET_NAME (defaults to "possah-media")
 *   NEXT_PUBLIC_R2_PUBLIC_URL (e.g. "https://cdn.thepossah.com")
 *
 * Run: node scripts/migrate-images-to-r2.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ─── Load env ─────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')
try {
  const lines = readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const k = trimmed.slice(0, eq).trim()
    const v = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '')
    if (k && !process.env[k]) process.env[k] = v
  }
} catch {
  console.warn('Could not load .env.local — falling back to process env')
}

// ─── Validate env ─────────────────────────────────────────────────────────────
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'CF_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'NEXT_PUBLIC_R2_PUBLIC_URL',
]
const missing = required.filter((k) => !process.env[k])
if (missing.length) {
  console.error('✗ Missing env vars:', missing.join(', '))
  process.exit(1)
}

// ─── Clients ──────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const SB_BUCKET  = 'possah-media'
const R2_BUCKET  = process.env.R2_BUCKET_NAME ?? 'possah-media'
const SUBFOLDERS = ['products']

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function r2Exists(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}

async function migrateFolder(folder) {
  const { data, error } = await supabase.storage
    .from(SB_BUCKET)
    .list(folder || '', { limit: 1000 })

  if (error) {
    console.error(`  ✗ list "${folder}": ${error.message}`)
    return { ok: 0, skipped: 0, failed: 0 }
  }

  const files = (data ?? []).filter(
    (f) => f.name !== '.emptyFolderPlaceholder' && !f.name.endsWith('/'),
  )

  let ok = 0, skipped = 0, failed = 0

  for (const file of files) {
    const path = folder ? `${folder}/${file.name}` : file.name

    if (await r2Exists(path)) {
      process.stdout.write(`  ~ ${path} (already in R2, skipping)\n`)
      skipped++
      continue
    }

    const { data: blob, error: dlErr } = await supabase.storage
      .from(SB_BUCKET)
      .download(path)

    if (dlErr || !blob) {
      console.error(`  ✗ download ${path}: ${dlErr?.message ?? 'no data'}`)
      failed++
      continue
    }

    try {
      const buffer = Buffer.from(await blob.arrayBuffer())
      await r2.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: path,
        Body: buffer,
        ContentType: blob.type || 'application/octet-stream',
        CacheControl: 'public, max-age=31536000, immutable',
      }))
      process.stdout.write(`  ✓ ${path}\n`)
      ok++
    } catch (upErr) {
      console.error(`  ✗ upload ${path}: ${upErr.message}`)
      failed++
    }
  }

  return { ok, skipped, failed }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Supabase → R2 Image Migration')
  console.log(`  Source : ${SB_BUCKET} (Supabase)`)
  console.log(`  Target : ${R2_BUCKET} (R2)`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  const folders = ['', ...SUBFOLDERS]
  let totalOk = 0, totalSkipped = 0, totalFailed = 0

  for (const folder of folders) {
    console.log(`\n[ ${folder || 'root'} ]`)
    const { ok, skipped, failed } = await migrateFolder(folder)
    totalOk += ok
    totalSkipped += skipped
    totalFailed += failed
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  Migrated : ${totalOk}`)
  console.log(`  Skipped  : ${totalSkipped} (already in R2)`)
  console.log(`  Failed   : ${totalFailed}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  if (totalFailed > 0) {
    console.error(`\n  ⚠ ${totalFailed} file(s) failed — re-run to retry (idempotent).\n`)
    process.exit(1)
  }

  console.log('\n  Migration complete ✓')
  console.log(`  Verify images at: ${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/products/\n`)
}

main().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1) })
