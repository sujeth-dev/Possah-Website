/**
 * PHASE 6 — FINAL VERIFICATION
 * READ-ONLY. Runs all checks, prints PASS / FAIL per check.
 *
 * Run: node scripts/data_ops/06_verify.mjs
 */
import { supabase } from './lib/db.mjs'
import { ALL_PRODUCTS } from './lib/products.mjs'

const EXPECTED = {
  products: ALL_PRODUCTS.length,                         // 42
  variants: ALL_PRODUCTS.length * 4,                     // 168 (4 sizes each)
  categories: 13,
  orders: 4,
  orderStatuses: [
    { number: 'PSH-2026-0001', payment: 'paid',    fulfillment: 'delivered'   },
    { number: 'PSH-2026-0002', payment: 'paid',    fulfillment: 'shipped'     },
    { number: 'PSH-2026-0003', payment: 'pending', fulfillment: 'unfulfilled' },
    { number: 'PSH-2026-0004', payment: 'failed',  fulfillment: 'cancelled'   },
  ],
}

let passes = 0
let failures = 0

function pass(label) {
  console.log(`  ✓ PASS  ${label}`)
  passes++
}

function fail(label, detail = '') {
  console.log(`  ✗ FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
  failures++
}

async function verify() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  PHASE 6 — VERIFICATION')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // ── Products count ─────────────────────────────────────────────────────────
  const { count: pCount } = await supabase.from('products').select('*', { count: 'exact', head: true })
  pCount === EXPECTED.products
    ? pass(`products count = ${EXPECTED.products}`)
    : fail(`products count`, `expected ${EXPECTED.products}, got ${pCount}`)

  // ── Variants count ─────────────────────────────────────────────────────────
  const { count: vCount } = await supabase.from('product_variants').select('*', { count: 'exact', head: true })
  vCount === EXPECTED.variants
    ? pass(`variants count = ${EXPECTED.variants}`)
    : fail(`variants count`, `expected ${EXPECTED.variants}, got ${vCount}`)

  // ── Categories count ───────────────────────────────────────────────────────
  const { count: cCount } = await supabase.from('categories').select('*', { count: 'exact', head: true })
  cCount === EXPECTED.categories
    ? pass(`categories count = ${EXPECTED.categories}`)
    : fail(`categories count`, `expected ${EXPECTED.categories}, got ${cCount}`)

  // ── Orders count ───────────────────────────────────────────────────────────
  const { count: oCount } = await supabase.from('orders').select('*', { count: 'exact', head: true })
  oCount === EXPECTED.orders
    ? pass(`orders count = ${EXPECTED.orders}`)
    : fail(`orders count`, `expected ${EXPECTED.orders}, got ${oCount}`)

  // ── All products have category_id ──────────────────────────────────────────
  const { data: noCat } = await supabase
    .from('products')
    .select('slug')
    .is('category_id', null)
  noCat?.length === 0
    ? pass('all products have category_id')
    : fail('products missing category_id', noCat?.map(p => p.slug).join(', '))

  // ── All products have at least one image ───────────────────────────────────
  const { data: allProds } = await supabase.from('products').select('id, slug')
  const { data: allImages } = await supabase.from('product_images').select('product_id')
  const productIdsWithImages = new Set(allImages?.map(i => i.product_id) ?? [])
  const noImages = (allProds ?? []).filter(p => !productIdsWithImages.has(p.id))
  noImages.length === 0
    ? pass('all products have images')
    : fail('products without images', noImages.map(p => p.slug).join(', '))

  // ── No test slugs ──────────────────────────────────────────────────────────
  const { data: testProds } = await supabase
    .from('products')
    .select('slug')
    .like('slug', 'test-%')
  testProds?.length === 0
    ? pass('no test slugs in products')
    : fail('test slugs found', testProds?.map(p => p.slug).join(', '))

  // ── Order statuses ─────────────────────────────────────────────────────────
  const { data: orders } = await supabase
    .from('orders')
    .select('order_number, payment_status, fulfillment_status')
    .in('order_number', EXPECTED.orderStatuses.map(o => o.number))

  for (const expected of EXPECTED.orderStatuses) {
    const found = orders?.find(o => o.order_number === expected.number)
    if (!found) {
      fail(`order ${expected.number}`, 'not found')
    } else if (found.payment_status !== expected.payment && found.fulfillment_status !== expected.fulfillment) {
      fail(`order ${expected.number}`, `payment=${found.payment_status} fulfillment=${found.fulfillment_status}`)
    } else {
      pass(`order ${expected.number}  ${found.payment_status} / ${found.fulfillment_status}`)
    }
  }

  // ── Each category has at least one product ─────────────────────────────────
  const { data: cats } = await supabase.from('categories').select('id, slug')
  for (const cat of (cats ?? [])) {
    const { count: catProdCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', cat.id)
    if (catProdCount > 0) {
      pass(`category '${cat.slug}' has ${catProdCount} product(s)`)
    } else {
      console.log(`  ⚠ WARN  category '${cat.slug}' has 0 products (placeholder)`)
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  RESULT: ${passes} passed, ${failures} failed`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  if (failures > 0) process.exit(1)
}

verify().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1) })
