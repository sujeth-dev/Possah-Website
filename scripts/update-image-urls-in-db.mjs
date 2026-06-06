/**
 * ONE-TIME DB UPDATE: Rewrite Supabase storage URLs → Cloudflare R2 CDN URLs
 *
 * Run dry-run first to see what would change:
 *   node scripts/update-image-urls-in-db.mjs --dry
 *
 * Then apply:
 *   node scripts/update-image-urls-in-db.mjs
 *
 * IMPORTANT: Back up Supabase DB before running the apply step.
 * The Supabase dashboard has a one-click backup under Project Settings → Backups.
 */
import { createClient } from '@supabase/supabase-js'
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

const isDry = process.argv.includes('--dry')

// ─── Validate env ─────────────────────────────────────────────────────────────
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_R2_PUBLIC_URL',
]
const missing = required.filter((k) => !process.env[k])
if (missing.length) {
  console.error('✗ Missing env vars:', missing.join(', '))
  process.exit(1)
}

const OLD_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/possah-media/`
const NEW_PREFIX = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/`

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

// ─── Tables/columns to update ─────────────────────────────────────────────────
const TARGETS = [
  { table: 'product_images',    column: 'url',              idCol: 'id' },
  { table: 'categories',        column: 'hero_image_url',   idCol: 'id' },
  { table: 'articles',          column: 'featured_image',   idCol: 'id' },
  { table: 'products',          column: 'craft_story_image', idCol: 'id' },
  { table: 'gift_sets',         column: 'image_url',        idCol: 'id' },
  { table: 'site_settings',     column: 'seo_og_image',     idCol: 'id' },
]

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(isDry ? '  DB URL Update — DRY RUN (no changes)' : '  DB URL Update — APPLYING CHANGES')
  console.log(`  OLD: ${OLD_PREFIX}`)
  console.log(`  NEW: ${NEW_PREFIX}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  let totalFound = 0
  let totalUpdated = 0

  for (const { table, column, idCol } of TARGETS) {
    // Fetch rows with Supabase URLs in this column
    const { data, error } = await supabase
      .from(table)
      .select(`${idCol}, ${column}`)
      .like(column, `${OLD_PREFIX}%`)

    if (error) {
      // Table might not exist (e.g. articles, gift_sets) — skip gracefully
      if (error.code === '42P01') {
        console.log(`  [ ${table}.${column} ] — table not found, skipping`)
        continue
      }
      console.error(`  ✗ ${table}.${column}: ${error.message}`)
      continue
    }

    const rows = data ?? []
    totalFound += rows.length
    console.log(`  [ ${table}.${column} ] — ${rows.length} row(s) to update`)

    if (rows.length === 0 || isDry) continue

    for (const row of rows) {
      const oldUrl = row[column]
      if (!oldUrl || !oldUrl.startsWith(OLD_PREFIX)) continue
      const newUrl = NEW_PREFIX + oldUrl.slice(OLD_PREFIX.length)

      const { error: upErr } = await supabase
        .from(table)
        .update({ [column]: newUrl })
        .eq(idCol, row[idCol])

      if (upErr) {
        console.error(`    ✗ ${row[idCol]}: ${upErr.message}`)
      } else {
        totalUpdated++
      }
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  if (isDry) {
    console.log(`  Would update: ${totalFound} row(s) across all tables`)
    console.log('  Re-run without --dry to apply.\n')
  } else {
    console.log(`  Updated: ${totalUpdated} / ${totalFound} row(s)`)
    console.log(totalUpdated === totalFound ? '  Complete ✓\n' : '  ⚠ Some rows failed — check errors above.\n')
  }
}

main().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1) })
