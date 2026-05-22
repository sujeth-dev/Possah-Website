/**
 * cleanup.mjs — removes all test rows from the live Supabase instance.
 *
 * Safe to run anytime, even if seed was never run.
 * Deletes by stable test markers (slugs, codes, order numbers).
 * Also restores Settings and Homepage to safe defaults.
 *
 * Standalone:  node scripts/admin_test/cleanup.mjs
 */

import { db } from './lib/db.mjs'
import { SEEDS } from './seed.mjs'

// Default states to restore singletons after testing
const DEFAULT_SETTINGS = {
  id: '00000000-0000-0000-0000-000000000001',
  announcement_text: 'FREE SHIPPING ACROSS INDIA · MADE-TO-MEASURE AVAILABLE',
  store_email: '',
  whatsapp_number: '',
  free_shipping_threshold: 5000,
  express_delivery_fee: 499,
  seo_title: 'The Possah — Luxury Indian Fashion',
  seo_description: '',
  seo_og_image: null,
}

const DEFAULT_HOMEPAGE = {
  id: '00000000-0000-0000-0000-000000000001',
  hero_slides: [],
  collection_banner: {},
  new_arrival_ids: [],
  occasion_tiles: Array.from({ length: 8 }, (_, i) => ({
    image_url: null, label: `Occasion ${i + 1}`, link: '/shop'
  })),
}

export async function cleanup() {
  console.log('\n🧹 Cleaning up test data...\n')

  // ── Journal articles ────────────────────────────────────────────────────────
  const { error: artErr } = await db.from('journal_articles')
    .delete()
    .in('slug', [SEEDS.articleA.slug, SEEDS.articleB.slug])
  log('journal_articles', artErr)

  // ── Reviews (linked to test products — cascade handles it, but explicit) ────
  const { data: testProducts } = await db.from('products')
    .select('id').in('slug', [SEEDS.productA.slug, SEEDS.productB.slug])
  if (testProducts?.length) {
    const ids = testProducts.map(p => p.id)
    const { error: revErr } = await db.from('reviews').delete().in('product_id', ids)
    log('reviews', revErr)
  }

  // ── Products (cascade deletes images, variants, tags) ───────────────────────
  const { error: prodErr } = await db.from('products')
    .delete()
    .in('slug', [SEEDS.productA.slug, SEEDS.productB.slug])
  log('products (alpha + beta)', prodErr)

  // Any extra test products created by the product CREATE test
  const { error: extraProdErr } = await db.from('products')
    .delete().ilike('slug', 'test-product-%')
  log('products (extra test-%)', extraProdErr)

  // ── Categories ──────────────────────────────────────────────────────────────
  const { error: catErr } = await db.from('categories')
    .delete().ilike('slug', 'test-cat-%')
  log('categories', catErr)

  // ── Orders ──────────────────────────────────────────────────────────────────
  const { error: ordErr } = await db.from('orders')
    .delete().ilike('order_number', 'TEST-%')
  log('orders', ordErr)

  // ── Coupons ─────────────────────────────────────────────────────────────────
  const { error: couErr } = await db.from('coupons')
    .delete().in('code', [SEEDS.couponA.code, SEEDS.couponB.code])
  log('coupons (seeded)', couErr)

  // Any extra test coupons created during coupon CREATE test
  const { error: extraCouErr } = await db.from('coupons')
    .delete().ilike('code', 'TEST%')
  log('coupons (extra TEST*)', extraCouErr)

  // ── Restore Settings singleton ───────────────────────────────────────────────
  const { error: setErr } = await db.from('store_settings')
    .upsert(DEFAULT_SETTINGS, { onConflict: 'id' })
  log('store_settings (restored)', setErr)

  // ── Restore Homepage singleton ───────────────────────────────────────────────
  const { error: hpErr } = await db.from('homepage_config')
    .upsert(DEFAULT_HOMEPAGE, { onConflict: 'id' })
  log('homepage_config (restored)', hpErr)

  console.log('\n✅ Cleanup complete.\n')
}

function log(label, error) {
  if (error) {
    console.log(`  ✗ ${label.padEnd(36)} ERROR: ${error.message}`)
  } else {
    console.log(`  ✓ ${label}`)
  }
}

// ─── Standalone run ───────────────────────────────────────────────────────────
if (process.argv[1].endsWith('cleanup.mjs')) {
  cleanup().catch(err => { console.error(err.message); process.exit(1) })
}
