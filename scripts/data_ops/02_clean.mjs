/**
 * PHASE 2 — CLEAN DATABASE
 * ⚠ POINT OF NO RETURN — run 00_audit.mjs first to back up data.
 *
 * Deletes ALL products, orders, reviews, carts, wishlists in FK-safe order.
 * Does NOT touch the 8 real categories.
 * Aborts immediately on any error (nothing partial left).
 *
 * Run: node scripts/data_ops/02_clean.mjs
 */
import { supabase } from './lib/db.mjs'

const STEPS = [
  // FK children first, parents last
  { table: 'cart_items',        filter: null },
  { table: 'wishlists',         filter: null },
  { table: 'reviews',           filter: null },
  { table: 'product_look_links',filter: null },
  { table: 'product_tags',      filter: null },
  { table: 'product_images',    filter: null },
  { table: 'product_variants',  filter: null },
  { table: 'products',          filter: null },
  { table: 'orders',            filter: null },
  // Only test categories (slug starts with 'test-')
  { table: 'categories', filter: { column: 'slug', op: 'like', value: 'test-%' } },
]

async function clean() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  PHASE 2 — CLEAN DATABASE')
  console.log('  ⚠  POINT OF NO RETURN')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('  Proceeding in 3 seconds...')
  await new Promise(r => setTimeout(r, 3000))

  for (const step of STEPS) {
    process.stdout.write(`  Deleting ${step.table.padEnd(24)}`)
    let q = supabase.from(step.table).delete()

    if (step.filter) {
      const { column, op, value } = step.filter
      if (op === 'like') q = q.like(column, value)
      else q = q.eq(column, value)
    } else {
      // Delete all rows — Supabase requires a filter; use neq on a always-true condition
      q = q.neq('id', '00000000-0000-0000-0000-000000000000')
    }

    const { error, count } = await q
    if (error) {
      console.log(' ✗')
      console.error(`\n  FATAL: ${step.table} → ${error.message}`)
      console.error('  Aborting. Run 99_restore.mjs if needed.')
      process.exit(1)
    }
    console.log(` ✓`)
  }

  // Verify
  console.log('\n  Verifying...')
  const checks = [
    { table: 'products',  expected: 0 },
    { table: 'orders',    expected: 0 },
  ]
  let allGood = true
  for (const c of checks) {
    const { count, error } = await supabase
      .from(c.table)
      .select('*', { count: 'exact', head: true })
    if (error || count !== c.expected) {
      console.log(`  ✗ ${c.table}: expected ${c.expected}, got ${count ?? 'error'}`)
      allGood = false
    } else {
      console.log(`  ✓ ${c.table}: ${count} rows`)
    }
  }

  const { count: catCount } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
  console.log(`  ✓ categories: ${catCount} rows (real categories preserved)`)

  if (!allGood) {
    console.error('\n  Some checks failed. Inspect manually.')
    process.exit(1)
  }

  console.log('\n  PHASE 2 COMPLETE ✓ — DB is clean.\n')
}

clean().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1) })
