/**
 * Test module 4: POST /api/payments/webhook — payment.captured event
 *
 * Simulates Razorpay calling our webhook after a successful payment.
 * All webhook signatures computed with RAZORPAY_WEBHOOK_SECRET.
 *
 * Cases covered:
 *   CAPTURED-OK      — valid captured event → 200, order marked paid
 *   CAPTURED-DB      — DB has payment_status=paid after webhook
 *   CAPTURED-IDEM    — duplicate captured event (already paid) → 200 idempotent
 *   CAPTURED-DB-IDEM — DB still paid, not corrupted by duplicate
 *   BAD-SIG          — invalid webhook signature → 400
 *   TAMPERED-BODY    — signature valid for different body → 400
 *   UNKNOWN-ORDER    — order not in DB → 200 (ack, log, don't retry)
 *   MISSING-SIG-HDR  — no x-razorpay-signature header → 400
 */

import { webhook } from '../lib/http.mjs'
import { db, dbGet } from '../lib/db.mjs'
import { signWebhook, tamper } from '../lib/crypto.mjs'
import { ENV } from '../lib/env.mjs'
import { makeAssertCollection, printHeader } from '../lib/assert.mjs'

function makeCapturedEvent(razorpayOrderId, paymentId = 'pay_webhook_test_001') {
  return {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: razorpayOrderId,
          amount: 250000,
          status: 'captured',
          email: 'paytest@thepossah.com',
          contact: '+919876543210',
        },
      },
    },
  }
}

export async function run(ctx) {
  printHeader('4 / 5  WEBHOOK: PAYMENT.CAPTURED')
  const A = makeAssertCollection('WebhookCaptured')

  const secret = ENV.RAZORPAY_WEBHOOK_SECRET

  // Reset PAY-TEST-PENDING to pending before tests
  await db.from('orders')
    .update({ payment_status: 'pending', gateway_payment_id: null })
    .eq('order_number', 'PAY-TEST-PENDING')

  // ── CAPTURED-OK ────────────────────────────────────────────────────────────
  {
    const body = JSON.stringify(makeCapturedEvent('order_paytest_pending_001', 'pay_webhook_cap_001'))
    const sig  = signWebhook(body, secret)
    const res  = await webhook(body, sig)
    A.status('CAPTURED-OK', 'valid payment.captured webhook → 200', res, 200)
    A.field('CAPTURED-OK', 'received: true', res.data, 'received', true)
  }

  // ── CAPTURED-DB ────────────────────────────────────────────────────────────
  {
    const order = await dbGet('orders', { order_number: 'PAY-TEST-PENDING' })
    A.ok('CAPTURED-DB', 'payment_status = paid in DB',
      order.payment_status === 'paid',
      'Webhook must update payment_status to "paid". Check webhook handler update query.')
    A.ok('CAPTURED-DB', 'gateway_payment_id saved',
      order.gateway_payment_id === 'pay_webhook_cap_001',
      'gateway_payment_id must be saved from the webhook payload.')
  }

  // ── CAPTURED-IDEM ──────────────────────────────────────────────────────────
  // Send exact same webhook again — must not crash, must return 200
  {
    const body = JSON.stringify(makeCapturedEvent('order_paytest_pending_001', 'pay_webhook_cap_001'))
    const sig  = signWebhook(body, secret)
    const res  = await webhook(body, sig)
    A.status('CAPTURED-IDEM', 'duplicate captured event → 200 (idempotent)', res, 200)
    A.field('CAPTURED-IDEM', 'received: true', res.data, 'received', true)
  }

  // ── CAPTURED-DB-IDEM ──────────────────────────────────────────────────────
  {
    const order = await dbGet('orders', { order_number: 'PAY-TEST-PENDING' })
    A.ok('CAPTURED-DB-IDEM', 'payment_status still paid after duplicate webhook',
      order.payment_status === 'paid',
      'Idempotent check failed — second webhook overwrote paid status.')
  }

  // ── BAD-SIG ────────────────────────────────────────────────────────────────
  {
    const body   = JSON.stringify(makeCapturedEvent('order_paytest_pending_001'))
    const validSig = signWebhook(body, secret)
    const badSig   = tamper(validSig)
    const res = await webhook(body, badSig)
    A.status('BAD-SIG', 'tampered signature → 400', res, 400)
    A.field('BAD-SIG', 'received: false', res.data, 'received', false)
  }

  // ── TAMPERED-BODY ──────────────────────────────────────────────────────────
  // Sign original body, then send different body — signature mismatch
  {
    const originalBody = JSON.stringify(makeCapturedEvent('order_paytest_pending_001'))
    const sig          = signWebhook(originalBody, secret)
    const tamperedBody = JSON.stringify(makeCapturedEvent('order_COMPLETELY_DIFFERENT'))
    const res = await webhook(tamperedBody, sig)
    A.status('TAMPERED-BODY', 'valid sig for different body → 400', res, 400)
    A.field('TAMPERED-BODY', 'received: false', res.data, 'received', false)
  }

  // ── UNKNOWN-ORDER ─────────────────────────────────────────────────────────
  // Order ID not in our DB — Razorpay retries are harmless, we must ack
  {
    const body = JSON.stringify(makeCapturedEvent('order_does_not_exist_in_db'))
    const sig  = signWebhook(body, secret)
    const res  = await webhook(body, sig)
    A.status('UNKNOWN-ORDER', 'unknown order_id → 200 (ack, do not retry)', res, 200)
    A.ok('UNKNOWN-ORDER', 'received: true (graceful ack for unknown order)',
      res.data?.received === true,
      'Webhook must return 200 for unknown orders to prevent Razorpay retry storms.')
  }

  // ── MISSING-SIG-HDR ───────────────────────────────────────────────────────
  // Send webhook with empty signature header
  {
    const body = JSON.stringify(makeCapturedEvent('order_paytest_pending_001'))
    const res  = await webhook(body, '')  // empty signature
    A.status('MISSING-SIG-HDR', 'missing/empty signature header → 400', res, 400)
  }

  return A.results
}
