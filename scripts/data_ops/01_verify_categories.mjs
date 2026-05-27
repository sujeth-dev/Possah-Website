/**
 * PHASE 1 — VERIFY CATEGORIES
 * Checks all 8 required categories exist. Upserts any missing ones.
 * Does NOT delete anything.
 *
 * Run: node scripts/data_ops/01_verify_categories.mjs
 */
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { supabase, check } from './lib/db.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

const REQUIRED_CATEGORIES = [
  { id: '11111111-0001-0001-0001-000000000001', name: 'Sarees',     slug: 'sarees',     breadcrumb: 'Women > Ethnic',   sort_order: 1 },
  { id: '11111111-0001-0001-0001-000000000002', name: 'Lehengas',   slug: 'lehengas',   breadcrumb: 'Women > Ethnic',   sort_order: 2 },
  { id: '11111111-0001-0001-0001-000000000003', name: 'Kurta Sets', slug: 'kurta-sets', breadcrumb: 'Women > Ethnic',   sort_order: 3 },
  { id: '11111111-0001-0001-0001-000000000004', name: 'Co-Ords',    slug: 'co-ords',    breadcrumb: 'Women > Western',  sort_order: 4 },
  { id: '11111111-0001-0001-0001-000000000005', name: 'Dresses',    slug: 'dresses',    breadcrumb: 'Women > Western',  sort_order: 5 },
  { id: '11111111-0001-0001-0001-000000000006', name: 'Separates',  slug: 'separates',  breadcrumb: 'Women > Western',  sort_order: 6 },
  { id: '11111111-0001-0001-0001-000000000007', name: 'Bridal',     slug: 'bridal',     breadcrumb: 'Bridal',           sort_order: 7 },
  { id: '11111111-0001-0001-0001-000000000008', name: 'Festive',    slug: 'festive',    breadcrumb: 'Festive',          sort_order: 8 },
]

async function verifyCategories() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  PHASE 1 — VERIFY CATEGORIES')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // Fetch live categories
  const { data: existing, error } = await supabase.from('categories').select('id, slug, name')
  check('fetch categories', error)

  const existingBySlug = Object.fromEntries(existing.map(c => [c.slug, c]))

  console.log(`  Found ${existing.length} category rows in DB.\n`)

  const categoryMap = {} // slug → live DB id

  for (const cat of REQUIRED_CATEGORIES) {
    const live = existingBySlug[cat.slug]
    if (live) {
      console.log(`  ✓ ${cat.slug.padEnd(16)} → id: ${live.id}`)
      categoryMap[cat.slug] = live.id
    } else {
      // Upsert missing category
      console.log(`  ⚠ ${cat.slug.padEnd(16)} MISSING — inserting...`)
      const { data: inserted, error: insertErr } = await supabase
        .from('categories')
        .upsert({ ...cat, parent_id: null }, { onConflict: 'slug' })
        .select('id')
        .single()
      check(`upsert category ${cat.slug}`, insertErr)
      const newId = inserted?.id ?? cat.id
      console.log(`    ✓ inserted → id: ${newId}`)
      categoryMap[cat.slug] = newId
    }
  }

  // Re-fetch to confirm
  const { data: final, error: finalErr } = await supabase.from('categories').select('id, slug')
  check('re-fetch categories', finalErr)

  console.log(`\n  Final category count: ${final.length}`)
  console.log('\n  Category ID map (used by seed scripts):')
  for (const [slug, id] of Object.entries(categoryMap)) {
    console.log(`    ${slug.padEnd(16)} → ${id}`)
  }

  // Write category map for downstream scripts
  const mapPath = resolve(__dirname, 'category_map.json')
  writeFileSync(mapPath, JSON.stringify(categoryMap, null, 2), 'utf8')
  console.log(`\n  Category map saved → ${mapPath}`)
  console.log('\n  PHASE 1 COMPLETE ✓\n')
}

verifyCategories().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1) })
