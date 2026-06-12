import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay'
import { sendPaymentFailureEmail } from '@/lib/email'
import { sendOrderConfirmationIfNotSent } from '@/lib/send-order-emails'

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
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_number, payment_status, line_items')
      .eq('gateway_order_id', razorpayOrderId)
      .single()

    if (fetchError || !order) {
      console.error('[webhook] Order not found for razorpay_order_id:', razorpayOrderId)
      // Return 200 — so Razorpay doesn't retry. Data mismatch is logged
      // separately.
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

      // ─── Decrement stock for every line item (atomic, parallel) ─────────
      // decrement_variant_stock returns FALSE if stock_qty would go negative
      // (oversell). We log oversells for manual reconciliation but do NOT
      // fail the webhook — Razorpay would retry and attempt double-decrement.
      const lineItemsRaw = (order.line_items as {
        variant_id: string
        name: string
        colour: string
        size: string
        qty: number
        price: number
      }[]) ?? []

      await Promise.all(
        lineItemsRaw.map(async (item) => {
          const { data: decremented, error: stockErr } = await supabase
            .rpc('decrement_variant_stock', {
              p_variant_id: item.variant_id,
              p_qty: item.qty,
            })

          if (stockErr) {
            console.error(
              `[webhook] Stock RPC error for variant ${item.variant_id} (order ${order.order_number}):`,
              stockErr,
            )
          } else if (!decremented) {
            // Oversell — stock hit 0 before this decrement could run
            console.error(
              `[webhook] OVERSELL: variant ${item.variant_id} ("${item.name}") ` +
                `qty=${item.qty} order=${order.order_number} — manual reconciliation required`,
            )
          }
        }),
      )
    }

    // Fire confirmation + admin emails. Idempotent across verify-callback +
    // webhook — `sendOrderConfirmationIfNotSent` atomically claims the send
    // via orders.confirmation_email_sent_at, so the second caller no-ops.
    void sendOrderConfirmationIfNotSent(supabase, order.order_number).catch((err) => {
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
