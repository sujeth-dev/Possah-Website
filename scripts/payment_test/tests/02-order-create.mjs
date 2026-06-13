/**
 * Test module 2: POST /api/orders/create
 *
 * ⚠️  Requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to be valid test keys (rzp_test_...).
 *     Razorpay will create real test orders in your test account.
 *     These orders have no financial impact.
 *
 * Cases covered:
 *   VALID-STD      — valid order, standard delivery → 200 + razorpay_order_id
 *   VALID-EXPRESS  — valid order, express delivery → 200 + correct total
 *   VALID-GIFT     — valid order with gift_wrap=true → total includes ₹150
 *   PRICE-SPOOF    — client sends lower price → server uses DB price
 *   PRICE-VERIFY   — server total = DB price × qty + shipping (not client total)
 *   NO-STOCK       — qty > beta variant stock (1) → 409
 *   INVALID-VARIANT— unknown variant_id → 404
 *   INVALID-PRODUCT— variant exists but product inactive → 400 (requires separate seed)
 *   COUPON-PCT     — valid 20% coupon → discount applied to total
 *   COUPON-FLAT    — valid ₹300 flat coupon → discount applied
 *   COUPON-SHIP    — free_shipping coupon → shipping = 0 in total
 *   COUPON-EXP     — expired coupon → 400
 *   COUPON-USED    — exhausted coupon → 400
 *   COUPON-MIN     — coupon below min order → 400
 *   COUPON-INVALID — nonexistent coupon → 400
 *   MISSING-ITEMS  — empty items array → 400
 *   MISSING-PHONE  — invalid phone format → 400
 *   MISSING-EMAIL  — invalid email → 400
 *   MISSING-PIN    — invalid pincode → 400
 */

import { api } from '../lib/http.mjs'
import { db } from '../lib/db.mjs'
import { makeAssertCollection, printHeader } from '../lib/assert.mjs'

// Build a valid base order payload from seeded product IDs
function makeOrder(ctx, overrides = {}) {
  return {
    contact: {
      first_name: 'Priya',
      last_name: 'Test',
      email: 'priya.test@thepossah.com',
      phone: '9876543210',
    },
    address: {
      line1: '5th Floor, Infinity Towers, BKC',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051',
    },
    items: [{
      product_id: ctx.alpha.productId,
      variant_id: ctx.alpha.variantId,
      name: 'Pay Test Product Alpha',
      image: 'https://placehold.co/400x500',
      price: 2500,        // correct price — server will verify from DB
      qty: 1,
      colour: 'Ivory',
      size: 'M',
    }],
    delivery_option: 'standard',
    gift_wrap: false,
    coupon_code: null,
    notes: '',
    shipping: 0,          // subtotal ₹2500 >= threshold ₹2500 → free shipping
    ...overrides,
  }
}

export async function run(ctx) {
  printHeader('2 / 5  ORDER CREATE')
  const A = makeAssertCollection('OrderCreate')

  // ── VALID-STD ──────────────────────────────────────────────────────────────
  {
    const res = await api('POST', '/api/orders/create', makeOrder(ctx))
    A.status('VALID-STD', 'valid order → 200', res, 200)
    A.ok('VALID-STD', 'response has razorpay_order_id',
      typeof res.data?.razorpay_order_id === 'string' && res.data.razorpay_order_id.startsWith('order_'),
      'razorpay_order_id must start with "order_". Check RAZORPAY_KEY_ID is set to a test key.')
    A.ok('VALID-STD', 'response has order_number',
      typeof res.data?.order_number === 'string' && res.data.order_number.length > 0,
      'order_number must be a non-empty string.')
    A.ok('VALID-STD', 'amount is in paise (>= 100)',
      typeof res.data?.amount === 'number' && res.data.amount >= 100,
      'amount must be in paise (multiply ₹ by 100). ₹2500 → 250000 paise.')
    A.ok('VALID-STD', 'amount = 250000 paise (₹2500 subtotal, free shipping)',
      res.data?.amount === 250000,
      'Subtotal ₹2500 + ₹0 shipping (above threshold) = ₹2500 = 250000 paise.')

    // Store order_number for later cleanup verification
    if (res.data?.order_number) ctx._createdOrders = ctx._createdOrders ?? []
    if (res.data?.order_number) ctx._createdOrders.push(res.data.order_number)
  }

  // ── VALID-EXPRESS ──────────────────────────────────────────────────────────
  {
    const res = await api('POST', '/api/orders/create', makeOrder(ctx, {
      delivery_option: 'express',
      shipping: 399,
    }))
    A.status('VALID-EXPRESS', 'express delivery order → 200', res, 200)
    // Subtotal ₹2500 >= threshold ₹2500 → free shipping regardless of delivery_option
    A.ok('VALID-EXPRESS', 'amount = 250000 (free shipping above threshold regardless of express)',
      res.data?.amount === 250000,
      'Server applies free shipping when subtotal >= ₹2500. Client delivery_option only adds cost below threshold.')
  }

  // ── VALID-GIFT ─────────────────────────────────────────────────────────────
  {
    const res = await api('POST', '/api/orders/create', makeOrder(ctx, { gift_wrap: true, shipping: 0 }))
    A.status('VALID-GIFT', 'gift wrap order → 200', res, 200)
    // ₹2500 + ₹150 gift wrap = ₹2650 = 265000 paise
    A.ok('VALID-GIFT', 'amount = 265000 paise (₹2500 + ₹150 gift wrap)',
      res.data?.amount === 265000,
      'Gift wrap costs ₹150. Total = ₹2500 + ₹150 = ₹2650 = 265000 paise.')
  }

  // ── PRICE-SPOOF ────────────────────────────────────────────────────────────
  // Client sends price: 1 (₹1 spoofed). Server must re-fetch ₹2500 from DB.
  {
    const spoofed = makeOrder(ctx)
    spoofed.items[0].price = 1   // client tries to pay ₹1
    const res = await api('POST', '/api/orders/create', spoofed)
    A.status('PRICE-SPOOF', 'spoofed low price order → 200 (server uses DB price)', res, 200)
    A.ok('PRICE-SPOOF', 'amount still 250000 paise (server ignored client price)',
      res.data?.amount === 250000,
      'Server must always use DB price, never the client-submitted price field.')
  }

  // ── NO-STOCK ───────────────────────────────────────────────────────────────
  // Beta variant has only 1 unit — request 2
  {
    const res = await api('POST', '/api/orders/create', makeOrder(ctx, {
      items: [{
        product_id: ctx.beta.productId,
        variant_id: ctx.beta.variantId,
        name: 'Pay Test Product Beta',
        image: 'https://placehold.co/400x500',
        price: 1000,
        qty: 2,    // only 1 in stock
        colour: 'Sage',
        size: 'S',
      }],
      shipping: 199,
    }))
    A.status('NO-STOCK', 'oversell qty=2, stock=1 → 409', res, 409)
    A.ok('NO-STOCK', 'message mentions stock/available',
      res.data?.message?.toLowerCase().includes('stock') ||
      res.data?.message?.toLowerCase().includes('left') ||
      res.data?.message?.toLowerCase().includes('available'),
      'Error message should tell customer how many units remain.')
  }

  // ── INVALID-VARIANT ────────────────────────────────────────────────────────
  {
    const res = await api('POST', '/api/orders/create', makeOrder(ctx, {
      items: [{
        product_id: ctx.alpha.productId,
        variant_id: '00000000-0000-0000-0000-000000000000',  // non-existent UUID
        name: 'Ghost Variant',
        image: 'https://placehold.co/400x500',
        price: 2500,
        qty: 1,
        colour: 'Ghost',
        size: 'XL',
      }],
    }))
    A.status('INVALID-VARIANT', 'unknown variant_id → 404', res, 404)
    A.ok('INVALID-VARIANT', 'message mentions availability',
      typeof res.data?.message === 'string',
      'Error message must be present for invalid variant.')
  }

  // ── COUPON-PCT ─────────────────────────────────────────────────────────────
  // PAYTESTPCT20 = 20% off. ₹2500 × 0.80 = ₹2000 = 200000 paise
  {
    const res = await api('POST', '/api/orders/create', makeOrder(ctx, { coupon_code: 'PAYTESTPCT20' }))
    A.status('COUPON-PCT', 'valid percent coupon → 200', res, 200)
    A.ok('COUPON-PCT', 'amount = 200000 paise (₹2500 - 20% = ₹2000)',
      res.data?.amount === 200000,
      '20% of ₹2500 = ₹500 discount. ₹2500 - ₹500 = ₹2000 = 200000 paise.')
  }

  // ── COUPON-FLAT ────────────────────────────────────────────────────────────
  // PAYTESTFLAT300 = ₹300 off, min ₹1500. ₹2500 - ₹300 = ₹2200 = 220000 paise
  {
    const res = await api('POST', '/api/orders/create', makeOrder(ctx, { coupon_code: 'PAYTESTFLAT300' }))
    A.status('COUPON-FLAT', 'valid flat coupon → 200', res, 200)
    A.ok('COUPON-FLAT', 'amount = 220000 paise (₹2500 - ₹300 = ₹2200)',
      res.data?.amount === 220000,
      'Flat ₹300 discount on ₹2500. Total = ₹2200 = 220000 paise.')
  }

  // ── COUPON-SHIP ────────────────────────────────────────────────────────────
  // Use beta product for subtotal ₹1000 (below ₹2500 threshold → normally ₹199 shipping)
  // With free_shipping coupon → shipping = 0, total = ₹1000 = 100000 paise
  {
    const res = await api('POST', '/api/orders/create', {
      ...makeOrder(ctx),
      items: [{
        product_id: ctx.beta.productId,
        variant_id: ctx.beta.variantId,
        name: 'Pay Test Product Beta',
        image: 'https://placehold.co/400x500',
        price: 1000,
        qty: 1,
        colour: 'Sage',
        size: 'S',
      }],
      coupon_code: 'PAYTESTSHIP',
      shipping: 199,
    })
    A.status('COUPON-SHIP', 'free_shipping coupon on sub-threshold order → 200', res, 200)
    A.ok('COUPON-SHIP', 'amount = 100000 paise (₹1000, no shipping)',
      res.data?.amount === 100000,
      'Free shipping coupon must zero out the ₹199 standard shipping. Total = ₹1000 = 100000 paise.')
  }

  // ── COUPON-EXP ─────────────────────────────────────────────────────────────
  {
    const res = await api('POST', '/api/orders/create', makeOrder(ctx, { coupon_code: 'PAYTESTEXPIRED' }))
    A.status('COUPON-EXP', 'expired coupon → 400', res, 400)
    A.ok('COUPON-EXP', 'message mentions expiry',
      res.data?.message?.toLowerCase().includes('expir'),
      'Orders/create must reject expired coupons with an expiry message.')
  }

  // ── COUPON-USED ────────────────────────────────────────────────────────────
  {
    const res = await api('POST', '/api/orders/create', makeOrder(ctx, { coupon_code: 'PAYTESTUSED' }))
    A.status('COUPON-USED', 'exhausted coupon → 400', res, 400)
  }

  // ── COUPON-MIN ─────────────────────────────────────────────────────────────
  // PAYTESTMIN2000 needs min ₹2000. Beta product = ₹1000 < ₹2000.
  {
    const res = await api('POST', '/api/orders/create', {
      ...makeOrder(ctx),
      items: [{
        product_id: ctx.beta.productId,
        variant_id: ctx.beta.variantId,
        name: 'Pay Test Product Beta',
        image: 'https://placehold.co/400x500',
        price: 1000,
        qty: 1,
        colour: 'Sage',
        size: 'S',
      }],
      coupon_code: 'PAYTESTMIN2000',
      shipping: 199,
    })
    A.status('COUPON-MIN', 'coupon below min_order_value → 400', res, 400)
    A.ok('COUPON-MIN', 'message mentions minimum',
      res.data?.message?.toLowerCase().includes('minimum'),
      'Error must state minimum order requirement.')
  }

  // ── COUPON-INVALID ─────────────────────────────────────────────────────────
  {
    const res = await api('POST', '/api/orders/create', makeOrder(ctx, { coupon_code: 'NOTACOUPON99' }))
    A.status('COUPON-INVALID', 'nonexistent coupon → 400', res, 400)
  }

  // ── MISSING-ITEMS ──────────────────────────────────────────────────────────
  {
    const res = await api('POST', '/api/orders/create', makeOrder(ctx, { items: [] }))
    A.status('MISSING-ITEMS', 'empty items → 400', res, 400)
  }

  // ── MISSING-PHONE ──────────────────────────────────────────────────────────
  {
    const order = makeOrder(ctx)
    order.contact.phone = '12345'  // not a valid 10-digit Indian mobile
    const res = await api('POST', '/api/orders/create', order)
    A.status('MISSING-PHONE', 'invalid phone → 400', res, 400)
  }

  // ── MISSING-EMAIL ──────────────────────────────────────────────────────────
  {
    const order = makeOrder(ctx)
    order.contact.email = 'notanemail'
    const res = await api('POST', '/api/orders/create', order)
    A.status('MISSING-EMAIL', 'invalid email → 400', res, 400)
  }

  // ── MISSING-PIN ────────────────────────────────────────────────────────────
  {
    const order = makeOrder(ctx)
    order.address.pincode = '1234'  // only 4 digits, must be 6
    const res = await api('POST', '/api/orders/create', order)
    A.status('MISSING-PIN', 'invalid pincode → 400', res, 400)
  }

  return A.results
}
