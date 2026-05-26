/**
 * Test module 3: POST /api/payments/verify
 *
 * Simulates what the Razorpay client sends back to the server after payment.
 * All signatures are computed using HMAC SHA256 with RAZORPAY_KEY_SECRET — same
 * algorithm the server uses. We can generate both valid and invalid sigs locally.
 *
 * Cases covered:
 *   VALID-SIG      — correct HMAC signature → 200, order marked paid
 *   IDEMPOTENT     — verify same order twice → 200 (no double-update)
 *   TAMPERED-PAY   — payment_id changed after signing → 400
 *   TAMPERED-ORD   — order_id changed after signing → 400
 *   WRONG-SECRET   — signature from different secret → 400
 *   EMPTY-SIG      — empty signature string → 400
 *   MISSING-FIELDS — missing razorpay_payment_id → 400
 *   DB-VERIFY      — after valid verify, DB row has payment_status='paid'
 *   DB-IDEMPOTENT  — already-paid order stays paid after second verify
 */

import { api } from '../lib/http.mjs'
import { db, dbGet } from '../lib/db.mjs'
import { signPayment, tamper } from '../lib/crypto.mjs'
import { ENV } from '../lib/env.mjs'
import { makeAssertCollection, printHeader } from '../lib/assert.mjs'

export async function run(ctx) {
  printHeader('3 / 5  PAYMENT VERIFY')
  const A = makeAssertCollection('PaymentVerify')

  const secret = ENV.RAZORPAY_KEY_SECRET

  // Use the seeded PAY-TEST-PENDING order
  const ORDER_NUMBER   = 'PAY-TEST-PENDING'
  const RZ_ORDER_ID    = 'order_paytest_pending_001'
  const RZ_PAYMENT_ID  = 'pay_paytest_fake_001'

  // Reset order to pending before this module runs
  await db.from('orders')
    .update({ payment_status: 'pending', gateway_payment_id: null })
    .eq('order_number', ORDER_NUMBER)

  // ── VALID-SIG ──────────────────────────────────────────────────────────────
  {
    const sig = signPayment(RZ_ORDER_ID, RZ_PAYMENT_ID, secret)
    const res = await api('POST', '/api/payments/verify', {
      razorpay_order_id:  RZ_ORDER_ID,
      razorpay_payment_id: RZ_PAYMENT_ID,
      razorpay_signature: sig,
      order_number: ORDER_NUMBER,
    })
    A.status('VALID-SIG', 'valid HMAC signature → 200', res, 200)
    A.field('VALID-SIG', 'success: true', res.data, 'success', true)
  }

  // ── DB-VERIFY ──────────────────────────────────────────────────────────────
  {
    const order = await dbGet('orders', { order_number: ORDER_NUMBER })
    A.ok('DB-VERIFY', 'payment_status = paid in DB',
      order.payment_status === 'paid',
      'After /verify, order.payment_status must be "paid" in Supabase.')
    A.ok('DB-VERIFY', 'gateway_payment_id set in DB',
      order.gateway_payment_id === RZ_PAYMENT_ID,
      'gateway_payment_id must be saved to the order row.')
  }

  // ── IDEMPOTENT ─────────────────────────────────────────────────────────────
  // Call verify again with same data — must return 200, not crash or double-update
  {
    const sig = signPayment(RZ_ORDER_ID, RZ_PAYMENT_ID, secret)
    const res = await api('POST', '/api/payments/verify', {
      razorpay_order_id:  RZ_ORDER_ID,
      razorpay_payment_id: RZ_PAYMENT_ID,
      razorpay_signature: sig,
      order_number: ORDER_NUMBER,
    })
    A.status('IDEMPOTENT', 'second verify on same order → 200', res, 200)
    A.field('IDEMPOTENT', 'success: true (idempotent)', res.data, 'success', true)
  }

  // ── DB-IDEMPOTENT ──────────────────────────────────────────────────────────
  {
    const order = await dbGet('orders', { order_number: ORDER_NUMBER })
    A.ok('DB-IDEMPOTENT', 'payment_status still paid after double verify',
      order.payment_status === 'paid',
      'Double verify must not corrupt order state.')
  }

  // ── TAMPERED-PAY ──────────────────────────────────────────────────────────
  {
    const sig = signPayment(RZ_ORDER_ID, RZ_PAYMENT_ID, secret)
    const res = await api('POST', '/api/payments/verify', {
      razorpay_order_id:  RZ_ORDER_ID,
      razorpay_payment_id: 'pay_tampered_different', // changed after signing
      razorpay_signature: sig,
      order_number: ORDER_NUMBER,
    })
    A.status('TAMPERED-PAY', 'tampered payment_id → 400', res, 400)
    A.field('TAMPERED-PAY', 'success: false', res.data, 'success', false)
  }

  // ── TAMPERED-ORD ──────────────────────────────────────────────────────────
  {
    const sig = signPayment(RZ_ORDER_ID, RZ_PAYMENT_ID, secret)
    const res = await api('POST', '/api/payments/verify', {
      razorpay_order_id:  'order_tampered_different', // changed after signing
      razorpay_payment_id: RZ_PAYMENT_ID,
      razorpay_signature: sig,
      order_number: ORDER_NUMBER,
    })
    A.status('TAMPERED-ORD', 'tampered order_id → 400', res, 400)
    A.field('TAMPERED-ORD', 'success: false', res.data, 'success', false)
  }

  // ── WRONG-SECRET ───────────────────────────────────────────────────────────
  {
    const badSig = signPayment(RZ_ORDER_ID, RZ_PAYMENT_ID, 'wrong_secret_key_xxx')
    const res = await api('POST', '/api/payments/verify', {
      razorpay_order_id:  RZ_ORDER_ID,
      razorpay_payment_id: RZ_PAYMENT_ID,
      razorpay_signature: badSig,
      order_number: ORDER_NUMBER,
    })
    A.status('WRONG-SECRET', 'signature from wrong secret → 400', res, 400)
    A.field('WRONG-SECRET', 'success: false', res.data, 'success', false)
  }

  // ── EMPTY-SIG ─────────────────────────────────────────────────────────────
  {
    const res = await api('POST', '/api/payments/verify', {
      razorpay_order_id:  RZ_ORDER_ID,
      razorpay_payment_id: RZ_PAYMENT_ID,
      razorpay_signature: '',
      order_number: ORDER_NUMBER,
    })
    A.status('EMPTY-SIG', 'empty signature → 400', res, 400)
  }

  // ── MISSING-FIELDS ─────────────────────────────────────────────────────────
  {
    const res = await api('POST', '/api/payments/verify', {
      razorpay_order_id: RZ_ORDER_ID,
      // missing razorpay_payment_id and razorpay_signature
      order_number: ORDER_NUMBER,
    })
    A.status('MISSING-FIELDS', 'missing required fields → 400', res, 400)
  }

  return A.results
}
