import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay'
import { sendOrderConfirmationEmail } from '@/lib/email'

/**
 * Razorpay webhook — backup payment confirmation.
 *
 * Handles two cases:
 *   1. payment.captured — user paid successfully (primary path)
 *   2. payment.failed   — payment explicitly failed
 *
 * This runs even if the client never redirected back (network drops, tab closed, etc.)
 * Razorpay retries webhooks for up to 3 days with exponential backoff.
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
  const supabase = createServerClient()

  if (event.event === 'payment.captured') {
    // Find order by gateway_order_id
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_number, payment_status, customer_name, customer_email, line_items, subtotal, shipping_fee, discount_amount, total')
      .eq('gateway_order_id', razorpayOrderId)
      .single()

    if (fetchError || !order) {
      console.error('[webhook] Order not found for razorpay_order_id:', razorpayOrderId)
      // Return 200 — so Razorpay doesn't retry. Data mismatch is logged separately.
      return NextResponse.json({ received: true })
    }

    // Idempotent — skip if already marked paid
    if (order.payment_status === 'paid') {
      return NextResponse.json({ received: true })
    }

    // Mark paid
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        gateway_payment_id: razorpayPaymentId,
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('[webhook] Failed to update payment_status:', updateError)
      // Return 500 so Razorpay retries
      return NextResponse.json({ received: false }, { status: 500 })
    }

    // Send confirmation email (best-effort — never fail webhook for email errors)
    try {
      const lineItems = (order.line_items as {
        name: string
        colour: string
        size: string
        qty: number
        price: number
      }[]) ?? []

      await sendOrderConfirmationEmail({
        to: order.customer_email,
        customerName: order.customer_name,
        orderNumber: order.order_number,
        items: lineItems,
        subtotal: order.subtotal,
        shippingFee: order.shipping_fee ?? 0,
        discountAmount: order.discount_amount ?? 0,
        tax: 0,
        total: order.total,
        estimatedDelivery: '5–7 business days',
      })
    } catch (emailErr) {
      console.error('[webhook] Email send failed (non-fatal):', emailErr)
    }
  }

  if (event.event === 'payment.failed') {
    // Mark order as payment_failed — do NOT delete, customer may retry
    await supabase
      .from('orders')
      .update({ payment_status: 'failed' })
      .eq('gateway_order_id', razorpayOrderId)
      .eq('payment_status', 'pending') // only update if still pending
  }

  return NextResponse.json({ received: true })
}
