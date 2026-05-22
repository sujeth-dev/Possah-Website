/**
 * seed.mjs — inserts all test data into the live Supabase instance.
 *
 * Uses the service role key (bypasses RLS).
 * All rows are tagged with test- slugs / TEST_ codes so cleanup is safe.
 * Idempotent: upserts by slug/code, safe to re-run without duplicates.
 *
 * Returns a context object with all seeded IDs.
 * Can also be run standalone:  node scripts/admin_test/seed.mjs
 */

import { db } from './lib/db.mjs'

// ─── Stable identifiers ───────────────────────────────────────────────────────
export const SEEDS = {
  category: {
    slug: 'test-cat-001',
    name: 'Test Sarees',
    nav_section: 'TEST',
    position: 9999,
  },
  productA: {
    slug: 'test-product-alpha',
    name: 'Test Product Alpha',
    price: 5000,
    is_active: true,
    is_new_arrival: true,
    is_featured: false,
    is_top_selling: false,
  },
  productB: {
    slug: 'test-product-beta',
    name: 'Test Product Beta',
    price: 8000,
    is_active: false,   // inactive — used to test active=false filter
    is_new_arrival: false,
    is_featured: false,
    is_top_selling: false,
  },
  orderA: {
    order_number: 'TEST-001',
    customer_name: 'Test Customer One',
    customer_email: 'test1@possah.test',
    customer_phone: '9000000001',
    payment_status: 'paid',
    fulfillment_status: 'unfulfilled',
    total: 5000,
    subtotal: 5000,
    shipping_fee: 0,
    discount_amount: 0,
    tax: 0,
    shipping_address: { line1: '1 Test Lane', city: 'Mumbai', state: 'MH', pin: '400001' },
    line_items: [{ product_id: null, name: 'Test Product Alpha', qty: 1, price: 5000 }],
  },
  orderB: {
    order_number: 'TEST-002',
    customer_name: 'Test Customer Two',
    customer_email: 'test2@possah.test',
    customer_phone: '9000000002',
    payment_status: 'pending',
    fulfillment_status: 'processing',
    total: 8000,
    subtotal: 8000,
    shipping_fee: 0,
    discount_amount: 0,
    tax: 0,
    shipping_address: { line1: '2 Test Lane', city: 'Delhi', state: 'DL', pin: '110001' },
    line_items: [{ product_id: null, name: 'Test Product Beta', qty: 1, price: 8000 }],
  },
  couponA: { code: 'TESTPCT10', type: 'percent',        value: 10,  min_order_value: 0,    is_active: true  },
  couponB: { code: 'TESTFLAT200', type: 'flat',         value: 200, min_order_value: 1000, is_active: true  },
  articleA: { slug: 'test-article-alpha', title: 'Test Article Alpha', category: 'Craft',        author: 'Test Author', is_featured: false, published_at: new Date().toISOString() },
  articleB: { slug: 'test-article-beta',  title: 'Test Article Beta',  category: 'Inspiration',  author: 'Test Author', is_featured: false, published_at: null },
}

// ─── seed() ───────────────────────────────────────────────────────────────────
export async function seed() {
  console.log('\n🌱 Seeding test data into Supabase...\n')

  const ctx = {
    category_id: null,
    product_a_id: null,
    product_b_id: null,
    order_a_id: null,
    order_b_id: null,
    coupon_a_id: null,
    coupon_b_id: null,
    review_ids: [],
    article_a_id: null,
    article_b_id: null,
  }

  // ── 1. Category ─────────────────────────────────────────────────────────────
  {
    const { data, error } = await db.from('categories')
      .upsert(SEEDS.category, { onConflict: 'slug' })
      .select('id').single()
    if (error) throw new Error(`[seed] category: ${error.message}`)
    ctx.category_id = data.id
    console.log(`  ✓ category      ${data.id}  (slug: ${SEEDS.category.slug})`)
  }

  // ── 2. Products ─────────────────────────────────────────────────────────────
  for (const [key, seed] of [['productA', SEEDS.productA], ['productB', SEEDS.productB]]) {
    const row = { ...seed, category_id: ctx.category_id, stock_qty: 10 }
    const { data, error } = await db.from('products')
      .upsert(row, { onConflict: 'slug' })
      .select('id').single()
    if (error) throw new Error(`[seed] ${key}: ${error.message}`)
    const ctxKey = key === 'productA' ? 'product_a_id' : 'product_b_id'
    ctx[ctxKey] = data.id
    console.log(`  ✓ ${key.padEnd(10)}  ${data.id}  (slug: ${seed.slug})`)

    // variants (replace)
    await db.from('product_variants').delete().eq('product_id', data.id)
    await db.from('product_variants').insert([
      { product_id: data.id, colour_name: 'Red', colour_hex: '#C0392B', size: 'S', stock_qty: 5 },
      { product_id: data.id, colour_name: 'Red', colour_hex: '#C0392B', size: 'M', stock_qty: 5 },
    ])

    // images (replace)
    await db.from('product_images').delete().eq('product_id', data.id)
    await db.from('product_images').insert([
      { product_id: data.id, url: 'https://placehold.co/600x800?text=Test', alt: 'Test image', position: 0 },
    ])

    // tags (replace)
    await db.from('product_tags').delete().eq('product_id', data.id)
    await db.from('product_tags').insert([
      { product_id: data.id, tag: 'Wedding' },
    ])
  }

  // ── 3. Orders ───────────────────────────────────────────────────────────────
  for (const [key, seed] of [['orderA', SEEDS.orderA], ['orderB', SEEDS.orderB]]) {
    // Delete existing by order_number then insert fresh (no upsert for orders — no unique index on order_number in upsert)
    await db.from('orders').delete().eq('order_number', seed.order_number)
    const { data, error } = await db.from('orders').insert(seed).select('id').single()
    if (error) throw new Error(`[seed] ${key}: ${error.message}`)
    const ctxKey = key === 'orderA' ? 'order_a_id' : 'order_b_id'
    ctx[ctxKey] = data.id
    console.log(`  ✓ ${key.padEnd(10)}  ${data.id}  (order_number: ${seed.order_number})`)
  }

  // ── 4. Coupons ──────────────────────────────────────────────────────────────
  for (const [key, seed] of [['couponA', SEEDS.couponA], ['couponB', SEEDS.couponB]]) {
    const { data, error } = await db.from('coupons')
      .upsert({ ...seed, usage_count: 0 }, { onConflict: 'code' })
      .select('id').single()
    if (error) throw new Error(`[seed] ${key}: ${error.message}`)
    const ctxKey = key === 'couponA' ? 'coupon_a_id' : 'coupon_b_id'
    ctx[ctxKey] = data.id
    console.log(`  ✓ ${key.padEnd(10)}  ${data.id}  (code: ${seed.code})`)
  }

  // ── 5. Reviews ──────────────────────────────────────────────────────────────
  // Wipe existing test reviews for product A
  await db.from('reviews').delete().eq('product_id', ctx.product_a_id)
  const reviewRows = [
    { product_id: ctx.product_a_id, reviewer_name: 'Test Reviewer One',   reviewer_city: 'Mumbai', rating: 5, body: 'Excellent quality!', is_approved: false },
    { product_id: ctx.product_a_id, reviewer_name: 'Test Reviewer Two',   reviewer_city: 'Delhi',  rating: 4, body: 'Very good.',          is_approved: false },
    { product_id: ctx.product_a_id, reviewer_name: 'Test Reviewer Three', reviewer_city: 'Pune',   rating: 3, body: 'Average.',            is_approved: true  },
  ]
  const { data: revData, error: revErr } = await db.from('reviews').insert(reviewRows).select('id')
  if (revErr) throw new Error(`[seed] reviews: ${revErr.message}`)
  ctx.review_ids = revData.map(r => r.id)
  console.log(`  ✓ reviews (3)   [${ctx.review_ids.join(', ')}]`)

  // ── 6. Journal articles ─────────────────────────────────────────────────────
  for (const [key, seed] of [['articleA', SEEDS.articleA], ['articleB', SEEDS.articleB]]) {
    const { data, error } = await db.from('journal_articles')
      .upsert(seed, { onConflict: 'slug' })
      .select('id').single()
    if (error) throw new Error(`[seed] ${key}: ${error.message}`)
    const ctxKey = key === 'articleA' ? 'article_a_id' : 'article_b_id'
    ctx[ctxKey] = data.id
    console.log(`  ✓ ${key.padEnd(10)}  ${data.id}  (slug: ${seed.slug})`)
  }

  console.log('\n✅ Seed complete.\n')
  return ctx
}

// ─── Standalone run ───────────────────────────────────────────────────────────
if (process.argv[1].endsWith('seed.mjs')) {
  seed().catch(err => { console.error(err.message); process.exit(1) })
}
