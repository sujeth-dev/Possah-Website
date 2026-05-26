/**
 * Test module 5: POST /api/payments/webhook — payment.failed event
 *
 * Cases covered:
 *   FAILED-OK       — valid failed event → 200, order marked failed
 *   FAILED-DB       — DB has payment_status=failed after webhook
 *   FAILED-IDEM     — duplicate failed event (already failed) → 200 idempotent
 *   FAILED-DB-IDEM  — DB still failed, not reset to pending by duplicate
 *   FAILED-BAD-SIG  — invalid webhook signature → 400
 *   FAILED-UNKNOWN  — order not in DB → 200 (ack gracefully)
 *   UNKNOWN-EVENT   — unrecognised event type → 200 (ignored)
 */

import { webhook } from '../lib/http.mjs'
import { db, dbGet } from '../lib/db.mjs'
import { signWebhook, tamper } from '../lib/crypto.mjs'
import { ENV } from '../lib/env.mjs'
import { makeAssertCollection, printHeader } from '../lib/assert.mjs'

function makeFailedEvent(razorpayOrderId, paymentId = 'pay_failed_test_001') {
  return {
    event: 'payment.failed',
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: razorpayOrderId,
          amount: 250000,
          status: 'failed',
          email: 'paytest@thepossah.com',
          contact: '+919876543210',
          error_code: 'BAD_REQUEST_ERROR',
          error_description: 'Your payment was declined by the bank.',
        },
      },
    },
  }
}

export async function run(ctx) {
  printHeader('5 / 5  WEBHOOK: PAYMENT.FAILED')
  const A = makeAssertCollection('WebhookFailed')

  const secret = ENV.RAZORPAY_WEBHOOK_SECRET

  // Reset PAY-TEST-PENDING to pending before tests
  await db.from('orders')
    .update({ payment_status: 'pending', gateway_payment_id: null })
    .eq('order_number', 'PAY-TEST-PENDING')

  // ── FAILED-OK ──────────────────────────────────────────────────────────────
  {
    const body = JSON.stringify(makeFailedEvent('order_paytest_pending_001', 'pay_failed_001'))
    const sig  = signWebhook(body, secret)
    const res  = await webhook(body, sig)
    A.status('FAILED-OK', 'valid payment.failed webhook → 200', res, 200)
    A.field('FAILED-OK', 'received: true', res.data, 'received', true)
  }

  // ── FAILED-DB ──────────────────────────────────────────────────────────────
  {
    const order = await dbGet('orders', { order_number: 'PAY-TEST-PENDING' })
    A.ok('FAILED-DB', 'payment_status = failed in DB',
      order.payment_status === 'failed',
      'Webhook must update payment_status to "failed". Check payment.failed handler.')
  }

  // ── FAILED-IDEM ────────────────────────────────────────────────────────────
  // Send same failed event again — must stay failed, not go back to pending
  {
    const body = JSON.stringify(makeFailedEvent('order_paytest_pending_001', 'pay_failed_001'))
    const sig  = signWebhook(body, secret)
    const res  = await webhook(body, sig)
    A.status('FAILED-IDEM', 'duplicate failed event → 200 (idempotent)', res, 200)
    A.field('FAILED-IDEM', 'received: true', res.data, 'received', true)
  }

  // ── FAILED-DB-IDEM ────────────────────────────────────────────────────────
  {
    const order = await dbGet('orders', { order_number: 'PAY-TEST-PENDING' })
    A.ok('FAILED-DB-IDEM', 'payment_status still failed after duplicate',
      order.payment_status === 'failed',
      'Duplicate failed webhook must not corrupt order state.')
  }

  // ── FAILED-BAD-SIG ────────────────────────────────────────────────────────
  {
    const body   = JSON.stringify(makeFailedEvent('order_paytest_pending_001'))
    const goodSig = signWebhook(body, secret)
    const badSig  = tamper(goodSig)
    const res = await webhook(body, badSig)
    A.status('FAILED-BAD-SIG', 'tampered sig on failed event → 400', res, 400)
    A.field('FAILED-BAD-SIG', 'received: false', res.data, 'received', false)
  }

  // ── FAILED-UNKNOWN ────────────────────────────────────────────────────────
  {
    const body = JSON.stringify(makeFailedEvent('order_does_not_exist_xyz'))
    const sig  = signWebhook(body, secret)
    const res  = await webhook(body, sig)
    A.status('FAILED-UNKNOWN', 'failed event for unknown order → 200 (ack)', res, 200)
    A.ok('FAILED-UNKNOWN', 'received: true for unknown order',
      res.data?.received === true,
      'Unknown order on failed event must still return 200 to prevent retry loops.')
  }

  // ── ALREADY-PAID → FAILED (should not downgrade) ──────────────────────────
  // A paid order should not have its status set back to failed by a late webhook
  {
    const body = JSON.stringify(makeFailedEvent('order_paytest_paid_001', 'pay_late_fail_001'))
    const sig  = signWebhook(body, secret)
    const res  = await webhook(body, sig)
    A.status('PAID-NO-DOWNGRADE', 'failed event on already-paid order → 200', res, 200)
    // Verify DB not downgraded
    const order = await dbGet('orders', { order_number: 'PAY-TEST-PAID' })
    A.ok('PAID-NO-DOWNGRADE', 'paid order NOT downgraded to failed',
      order.payment_status === 'paid',
      'A paid order must never be set to failed by a late payment.failed webhook. Check idempotency guard in handler.')
  }

  // ── UNKNOWN-EVENT ─────────────────────────────────────────────────────────
  // Razorpay may send other event types in future — must ack gracefully
  {
    const unknownEvent = {
      event: 'order.paid',
      payload: { payment: { entity: { id: 'pay_unknown', order_id: 'order_unknown', amount: 100 } } },
    }
    const body = JSON.stringify(unknownEvent)
    const sig  = signWebhook(body, secret)
    const res  = await webhook(body, sig)
    A.status('UNKNOWN-EVENT', 'unknown event type → 200 (ack and ignore)', res, 200)
  }

  return A.results
}
