/**
 * Payment test seed — inserts stable test data for all payment flow tests.
 * Idempotent: uses upsert by slug/code so safe to re-run.
 */

import { db } from './lib/db.mjs'

const YESTERDAY = new Date(Date.now() - 86400000).toISOString().split('T')[0]

async function seedCategory() {
  const { data, error } = await db
    .from('categories')
    .upsert({ name: 'Payment Test Cat', slug: 'test-pay-cat-001', position: 999 }, { onConflict: 'slug' })
    .select('id')
    .single()
  if (error) throw new Error(`Category seed: ${error.message}`)
  console.log(`  ✓ category  test-pay-cat-001  ${data.id}`)
  return data.id
}

async function seedProducts(categoryId) {
  // Product Alpha — ₹2500, 20 units
  const { data: pa, error: paErr } = await db
    .from('products')
    .upsert({
      slug: 'test-pay-product-alpha',
      name: 'Pay Test Product Alpha',
      price: 2500,
      category_id: categoryId,
      is_active: true,
      is_new_arrival: false,
      is_top_selling: false,
      is_ready_to_ship: true,
      stock_qty: 20,
    }, { onConflict: 'slug' })
    .select('id')
    .single()
  if (paErr) throw new Error(`Product alpha seed: ${paErr.message}`)
  console.log(`  ✓ product   test-pay-product-alpha  ${pa.id}`)

  // Variant for Alpha — delete any existing then insert fresh
  await db.from('product_variants').delete().eq('product_id', pa.id)
  const { data: va, error: vaErr } = await db
    .from('product_variants')
    .insert({ product_id: pa.id, colour_name: 'Ivory', colour_hex: '#FFFFF0', size: 'M', stock_qty: 20 })
    .select('id')
    .single()
  if (vaErr) throw new Error(`Variant alpha seed: ${vaErr.message}`)
  console.log(`  ✓ variant   pay-alpha-M-ivory  ${va.id}`)

  // Product Beta — ₹1000, 1 unit (low stock / oversell tests)
  const { data: pb, error: pbErr } = await db
    .from('products')
    .upsert({
      slug: 'test-pay-product-beta',
      name: 'Pay Test Product Beta',
      price: 1000,
      category_id: categoryId,
      is_active: true,
      is_new_arrival: false,
      is_top_selling: false,
      is_ready_to_ship: true,
      stock_qty: 1,
    }, { onConflict: 'slug' })
    .select('id')
    .single()
  if (pbErr) throw new Error(`Product beta seed: ${pbErr.message}`)
  console.log(`  ✓ product   test-pay-product-beta   ${pb.id}`)

  // Variant for Beta — 1 unit only
  await db.from('product_variants').delete().eq('product_id', pb.id)
  const { data: vb, error: vbErr } = await db
    .from('product_variants')
    .insert({ product_id: pb.id, colour_name: 'Sage', colour_hex: '#B2AC88', size: 'S', stock_qty: 1 })
    .select('id')
    .single()
  if (vbErr) throw new Error(`Variant beta seed: ${vbErr.message}`)
  console.log(`  ✓ variant   pay-beta-S-sage    ${vb.id}`)

  return { alpha: { productId: pa.id, variantId: va.id }, beta: { productId: pb.id, variantId: vb.id } }
}

async function seedCoupons() {
  const coupons = [
    { code: 'PAYTESTPCT20',   type: 'percent',      value: 20,  min_order_value: 0,    expiry_date: null, usage_limit: 100, usage_count: 0,  is_active: true },
    { code: 'PAYTESTFLAT300', type: 'flat',          value: 300, min_order_value: 1500, expiry_date: null, usage_limit: 100, usage_count: 0,  is_active: true },
    { code: 'PAYTESTSHIP',    type: 'free_shipping', value: 0,   min_order_value: 0,    expiry_date: null, usage_limit: 100, usage_count: 0,  is_active: true },
    { code: 'PAYTESTMIN2000', type: 'flat',          value: 200, min_order_value: 2000, expiry_date: null, usage_limit: 100, usage_count: 0,  is_active: true },
    { code: 'PAYTESTEXPIRED', type: 'flat',          value: 100, min_order_value: 0,    expiry_date: YESTERDAY, usage_limit: 100, usage_count: 0, is_active: true },
    { code: 'PAYTESTUSED',    type: 'flat',          value: 100, min_order_value: 0,    expiry_date: null, usage_limit: 2,   usage_count: 2,  is_active: true },
    { code: 'PAYTESTINACT',   type: 'flat',          value: 100, min_order_value: 0,    expiry_date: null, usage_limit: 100, usage_count: 0,  is_active: false },
  ]

  const { error } = await db.from('coupons').upsert(coupons, { onConflict: 'code' })
  if (error) throw new Error(`Coupons seed: ${error.message}`)
  for (const c of coupons) console.log(`  ✓ coupon    ${c.code}`)
}

async function seedOrders() {
  const baseOrder = {
    customer_name: 'Pay Test Customer',
    customer_email: 'paytest@thepossah.com',
    customer_phone: '9876543210',
    shipping_address: { line1: '123 Test St', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
    line_items: [{ name: 'Pay Test Product Alpha', colour: 'Ivory', size: 'M', qty: 1, price: 2500 }],
    subtotal: 2500,
    shipping_fee: 0,
    discount_amount: 0,
    tax: 0,
    total: 2500,
    is_gift: false,
  }

  const orders = [
    {
      ...baseOrder,
      order_number: 'PAY-TEST-PENDING',
      payment_status: 'pending',
      fulfillment_status: 'unfulfilled',
      gateway_order_id: 'order_paytest_pending_001',
    },
    {
      ...baseOrder,
      order_number: 'PAY-TEST-PAID',
      payment_status: 'paid',
      fulfillment_status: 'unfulfilled',
      gateway_order_id: 'order_paytest_paid_001',
      gateway_payment_id: 'pay_paytest_already_paid',
    },
  ]

  const { error } = await db.from('orders').upsert(orders, { onConflict: 'order_number' })
  if (error) throw new Error(`Orders seed: ${error.message}`)
  for (const o of orders) console.log(`  ✓ order     ${o.order_number}  (${o.payment_status})`)
}

export async function seed() {
  console.log('\n🌱 Seeding payment test data…\n')
  const categoryId = await seedCategory()
  const products = await seedProducts(categoryId)
  await seedCoupons()
  await seedOrders()

  const ctx = {
    alpha: products.alpha,
    beta: products.beta,
    orders: {
      pending: { order_number: 'PAY-TEST-PENDING', gateway_order_id: 'order_paytest_pending_001' },
      paid:    { order_number: 'PAY-TEST-PAID',    gateway_order_id: 'order_paytest_paid_001' },
    },
  }
  console.log('\n✅ Seed complete.\n')
  return ctx
}

// Allow running standalone: node scripts/payment_test/seed.mjs
if (process.argv[1].endsWith('seed.mjs')) {
  seed().catch(err => { console.error('\n❌ Seed failed:', err.message); process.exit(1) })
}
