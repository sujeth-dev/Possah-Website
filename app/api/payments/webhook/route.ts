import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyRazorpayWebhookSignature, fetchRazorpayOrder } from '@/lib/razorpay'
import { sendPaymentFailureEmail } from '@/lib/email'
import { sendOrderConfirmationIfNotSent } from '@/lib/send-order-emails'
import { decrementOrderStockOnce } from '@/lib/stock'

/**
 * Razorpay webhook — backup payment confirmation.
 *
 * Handles two cases:
 *   1. payment.captured — user paid successfully (primary path)
 *   2. payment.failed   — payment explicitly failed
 *
 * This runs even if the client never redirected back (network drops, tab
 * closed, etc.). Razorpay retries webhooks for up to 3 days with exponential
 * backoff, so the order-confirmation email is dispatched via
 * `sendOrderConfirmationIfNotSent` which is idempotent — the same call from
 * /api/payments/verify and from here cannot send two emails for one order.
 *
 * Register in Razorpay Dashboard → Settings → Webhooks:
 *   URL: https://thepossah.com/api/payments/webhook
 *   Events: payment.captured, payment.failed
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[webhook] RAZORPAY_WEBHOOK_SECRET not set — rejecting')
    return NextResponse.json({ received: false }, { status: 500 })
  }

  // Read raw body — must be string for HMAC
  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''

  // Verify webhook authenticity
  const isValid = verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret)
  if (!isValid) {
    console.warn('[webhook] Invalid Razorpay signature')
    return NextResponse.json({ received: false }, { status: 400 })
  }

  let event: {
    event: string
    payload: {
      payment: {
        entity: {
          id: string
          order_id: string
          amount: number
          status: string
          email: string
          contact: string
          notes?: Record<string, string>
        }
      }
    }
  }

  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ received: false }, { status: 400 })
  }

  const payment = event.payload.payment.entity
  const razorpayOrderId = payment.order_id
  const razorpayPaymentId = payment.id

  // Always acknowledge receipt first — idempotency handled inside
  const supabase = createAdminClient()

  if (event.event === 'payment.captured') {
    // Find order by gateway_order_id
    let { data: order } = await supabase
      .from('orders')
      .select('id, order_number, payment_status, line_items')
      .eq('gateway_order_id', razorpayOrderId)
      .maybeSingle()

    // H-2: a retry/reuse rotates gateway_order_id, so a capture against an older
    // (still-open) Razorpay order would not match. Reconcile via the Razorpay
    // order's receipt (= our order_number) before giving up, so the payment is
    // never orphaned.
    if (!order) {
      const rzOrder = await fetchRazorpayOrder(razorpayOrderId).catch(() => null)
      if (rzOrder?.receipt) {
        const { data: byReceipt } = await supabase
          .from('orders')
          .select('id, order_number, payment_status, line_items')
          .eq('order_number', rzOrder.receipt)
          .maybeSingle()
        order = byReceipt ?? null
      }
    }

    if (!order) {
      console.error('[webhook] Order not found for razorpay_order_id:', razorpayOrderId)
      // Return 200 — so Razorpay doesn't retry. Data mismatch is logged.
      return NextResponse.json({ received: true })
    }

    // Idempotent — skip if already marked paid
    if (order.payment_status !== 'paid') {
      // Mark paid
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          gateway_payment_id: razorpayPaymentId,
        })
        .eq('id', order.id)
        .eq('payment_status', 'pending')

      if (updateError) {
        console.error('[webhook] Failed to update payment_status:', updateError)
        // Return 500 so Razorpay retries
        return NextResponse.json({ received: false }, { status: 500 })
      }
    }

    // H-1: decrement stock exactly once, idempotently. Safe to call on every
    // delivery — the atomic claim on stock_decremented_at no-ops after the
    // first success (whether it happened here or on the verify path).
    await decrementOrderStockOnce(supabase, order.order_number).catch((err) => {
      console.error('[webhook] stock decrement failed:', err)
    })

    // Await so the function doesn't terminate before the email completes.
    // Idempotent — second caller (verify vs webhook race) no-ops via
    // the confirmation_email_sent_at atomic claim.
    await sendOrderConfirmationIfNotSent(supabase, order.order_number).catch((err) => {
      console.error('[webhook] email dispatch failed:', err)
    })

    return NextResponse.json({ received: true })
  }

  if (event.event === 'payment.failed') {
    // FIX-PAY-02: find order and send payment-failure email to customer
    const { data: order } = await supabase
      .from('orders')
      .select('id, order_number, payment_status, customer_name, customer_email, total')
      .eq('gateway_order_id', razorpayOrderId)
      .single()

    if (!order) {
      // No matching order — log and ack (don't retry)
      console.warn('[webhook] payment.failed: no order for razorpay_order_id', razorpayOrderId)
      return NextResponse.json({ received: true })
    }

    // Only mark failed if still pending — never downgrade a paid order.
    // A late payment.failed can arrive after payment.captured (race condition
    // on Razorpay's side). Guard: only transition pending → failed.
    // paid stays paid. failed stays failed (idempotent).
    if (order.payment_status === 'pending') {
      await supabase
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('id', order.id)

      try {
        await sendPaymentFailureEmail({
          to: order.customer_email,
          customerName: order.customer_name,
          orderNumber: order.order_number,
          amount: order.total,
        })
      } catch {
        // non-fatal
      }
    }

    return NextResponse.json({ received: true })
  }

  // Unknown event type — ack and ignore
  return NextResponse.json({ received: true })
}
