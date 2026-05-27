/**
 * PHASE 5 — SEED 4 BRACKET TEST ORDERS
 *
 * Covers all payment × fulfillment status combinations:
 *   Order 1: paid     × delivered
 *   Order 2: paid     × shipped
 *   Order 3: pending  × unfulfilled
 *   Order 4: failed   × cancelled
 *
 * Looks up real product + variant IDs from DB by slug + size.
 * Idempotent: deletes existing test orders (PSH-2026-000X) before inserting.
 *
 * Run: node scripts/data_ops/05_seed_orders.mjs
 */
import { supabase, check } from './lib/db.mjs'

const TEST_ORDER_NUMBERS = [
  'PSH-2026-0001',
  'PSH-2026-0002',
  'PSH-2026-0003',
  'PSH-2026-0004',
]

const ORDER_SPECS = [
  {
    order_number: 'PSH-2026-0001',
    customer_name: 'Priya Sharma',
    customer_email: 'priya.sharma@example.com',
    customer_phone: '+91 98200 11234',
    shipping_address: {
      line1: '12, Linking Road',
      line2: 'Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      country: 'India',
    },
    product_slug: 'amber-glow-button-top',
    size: 'M',
    qty: 1,
    shipping_cost: 0,
    discount_amount: 0,
    payment_status: 'paid',
    fulfillment_status: 'delivered',
    payment_provider: 'razorpay',
    payment_id: 'pay_test_001_priya',
    coupon_code: null,
    notes: 'Bracket test order — paid / delivered',
  },
  {
    order_number: 'PSH-2026-0002',
    customer_name: 'Ananya Iyer',
    customer_email: 'ananya.iyer@example.com',
    customer_phone: '+91 98440 22345',
    shipping_address: {
      line1: '7, MG Road',
      line2: 'Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      country: 'India',
    },
    product_slug: 'peach-art-deco-dress',
    size: 'S',
    qty: 1,
    shipping_cost: 99,
    discount_amount: 0,
    payment_status: 'paid',
    fulfillment_status: 'shipped',
    payment_provider: 'razorpay',
    payment_id: 'pay_test_002_ananya',
    coupon_code: null,
    notes: 'Bracket test order — paid / shipped',
  },
  {
    order_number: 'PSH-2026-0003',
    customer_name: 'Neha Gupta',
    customer_email: 'neha.gupta@example.com',
    customer_phone: '+91 99100 33456',
    shipping_address: {
      line1: '45, Connaught Place',
      line2: 'Block A',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      country: 'India',
    },
    product_slug: 'botanical-grace-midi',
    size: 'L',
    qty: 1,
    shipping_cost: 99,
    discount_amount: 0,
    payment_status: 'pending',
    fulfillment_status: 'unfulfilled',
    payment_provider: 'razorpay',
    payment_id: null,
    coupon_code: null,
    notes: 'Bracket test order — pending / unfulfilled',
  },
  {
    order_number: 'PSH-2026-0004',
    customer_name: 'Kavya Reddy',
    customer_email: 'kavya.reddy@example.com',
    customer_phone: '+91 94400 44567',
    shipping_address: {
      line1: '33, Jubilee Hills',
      line2: 'Road No. 36',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500033',
      country: 'India',
    },
    product_slug: 'olive-top-skirt-coord',
    size: 'M',
    qty: 1,
    shipping_cost: 99,
    discount_amount: 0,
    payment_status: 'failed',
    fulfillment_status: 'cancelled',
    payment_provider: 'razorpay',
    payment_id: 'pay_test_004_kavya_fail',
    coupon_code: null,
    notes: 'Bracket test order — failed / cancelled',
  },
]

async function seedOrders() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  PHASE 5 — SEED TEST ORDERS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // Delete existing test orders (idempotent)
  const { error: delErr } = await supabase
    .from('orders')
    .delete()
    .in('order_number', TEST_ORDER_NUMBERS)
  check('delete existing test orders', delErr)
  console.log('  Cleared existing test orders.\n')

  const errors = []

  for (const spec of ORDER_SPECS) {
    process.stdout.write(`  [${spec.order_number}] ${spec.customer_name} ...`)

    try {
      // Look up product
      const { data: product, error: pErr } = await supabase
        .from('products')
        .select('id, name, price')
        .eq('slug', spec.product_slug)
        .single()
      if (pErr || !product) throw new Error(`Product not found: ${spec.product_slug}`)

      // Look up variant
      const { data: variant, error: vErr } = await supabase
        .from('product_variants')
        .select('id')
        .eq('product_id', product.id)
        .eq('size', spec.size)
        .single()
      if (vErr || !variant) throw new Error(`Variant not found: ${spec.product_slug} / ${spec.size}`)

      const unitPrice = product.price
      const subtotal = unitPrice * spec.qty
      const total = subtotal + spec.shipping_cost - spec.discount_amount

      const line_items = [
        {
          product_id: product.id,
          variant_id: variant.id,
          name: product.name,
          size: spec.size,
          qty: spec.qty,
          unit_price: unitPrice,
          line_total: unitPrice * spec.qty,
        },
      ]

      const { error: insertErr } = await supabase.from('orders').insert({
        order_number: spec.order_number,
        customer_name: spec.customer_name,
        customer_email: spec.customer_email,
        customer_phone: spec.customer_phone,
        shipping_address: spec.shipping_address,
        line_items,
        subtotal,
        shipping_fee: spec.shipping_cost,
        discount_amount: spec.discount_amount,
        total,
        payment_status: spec.payment_status,
        fulfillment_status: spec.fulfillment_status,
        payment_gateway: spec.payment_provider,
        gateway_payment_id: spec.payment_id,
        coupon_code: spec.coupon_code,
        internal_notes: spec.notes,
      })
      check(`insert order ${spec.order_number}`, insertErr)

      console.log(` ✓  ${spec.payment_status} / ${spec.fulfillment_status}  ₹${total.toLocaleString('en-IN')}`)
    } catch (e) {
      console.log(` ✗`)
      console.error(`    ${e.message}`)
      errors.push({ order: spec.order_number, error: e.message })
    }
  }

  const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true })
  console.log(`\n  Orders in DB: ${count}`)

  if (errors.length > 0) {
    console.error('\n  Errors:')
    for (const e of errors) console.error(`    ${e.order}: ${e.error}`)
    process.exit(1)
  }

  console.log('\n  PHASE 5 COMPLETE ✓\n')
}

seedOrders().catch((e) => { console.error('\n✗ FATAL:', e.message); process.exit(1) })
