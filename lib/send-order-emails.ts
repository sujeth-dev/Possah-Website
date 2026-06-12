import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from '@/lib/email'

// =============================================================================
// Idempotent post-payment email dispatch.
//
// Called from:
//   • app/api/payments/verify/route.ts  (HMAC-verified client callback)
//   • app/api/payments/webhook/route.ts (Razorpay server webhook)
//
// Both callers may race after a successful payment. The first to flip
// `orders.confirmation_email_sent_at` from NULL to NOW() wins and dispatches
// the emails; the other returns early.
//
// Email failures are logged but do not throw — payment recording is the
// source-of-truth event, the email is a courtesy follow-up.
// =============================================================================

type OrderRow = {
  order_number: string
  customer_email: string
  customer_name: string
  total: number
  subtotal: number
  shipping_fee: number
  discount_amount: number
  tax: number
  line_items: unknown
  shipping_address: unknown
  internal_notes: string | null
  confirmation_email_sent_at: string | null
}

type EmailLineItem = {
  name: string
  colour: string
  size: string
  qty: number
  price: number
}

function coerceLineItems(raw: unknown): EmailLineItem[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((it): it is Record<string, unknown> => typeof it === 'object' && it !== null)
    .map((it) => ({
      name: String(it.name ?? ''),
      colour: String(it.colour ?? ''),
      size: String(it.size ?? ''),
      qty: Number(it.qty ?? 0),
      price: Number(it.price ?? 0),
    }))
    .filter((it) => it.name && it.qty > 0)
}

function coerceShippingAddress(raw: unknown): Record<string, string> {
  if (typeof raw !== 'object' || raw === null) return {}
  const o = raw as Record<string, unknown>
  const out: Record<string, string> = {}
  for (const key of ['line1', 'line2', 'city', 'state', 'pincode']) {
    if (o[key] != null) out[key] = String(o[key])
  }
  return out
}

function estimatedDeliveryFromNotes(notes: string | null): string {
  return notes?.toLowerCase().includes('express') ? '2–3 business days' : '5–7 business days'
}

interface SendResult {
  sent: boolean
  reason?: 'already_sent' | 'not_found' | 'race_lost' | 'email_failed'
  error?: string
}

/**
 * Atomically dispatches the customer confirmation + admin notification emails
 * for the given order_number, exactly once across all concurrent callers.
 *
 * Returns `{ sent: true }` if THIS call dispatched the emails, `{ sent: false,
 * reason }` otherwise.
 */
export async function sendOrderConfirmationIfNotSent(
  supabase: SupabaseClient<Database>,
  orderNumber: string,
): Promise<SendResult> {
  // 1. Atomic claim: flip confirmation_email_sent_at NULL -> NOW() and return the row.
  //    .is('confirmation_email_sent_at', null) ensures only the first caller wins.
  const nowIso = new Date().toISOString()
  const { data: claimed, error: claimError } = await supabase
    .from('orders')
    .update({ confirmation_email_sent_at: nowIso })
    .eq('order_number', orderNumber)
    .eq('payment_status', 'paid')
    .is('confirmation_email_sent_at', null)
    .select(
      'order_number, customer_email, customer_name, total, subtotal, shipping_fee, discount_amount, tax, line_items, shipping_address, internal_notes, confirmation_email_sent_at',
    )
    .maybeSingle<OrderRow>()

  if (claimError) {
    console.error('[send-order-emails] claim error:', claimError, 'order:', orderNumber)
    return { sent: false, reason: 'race_lost', error: claimError.message }
  }
  if (!claimed) {
    // Either the order isn't paid yet, doesn't exist, or another caller already
    // sent the email. All three are "do nothing" from this function's POV.
    return { sent: false, reason: 'already_sent' }
  }

  // 2. Dispatch customer confirmation email (best-effort).
  const lineItems = coerceLineItems(claimed.line_items)
  const shippingAddress = coerceShippingAddress(claimed.shipping_address)
  const estimatedDelivery = estimatedDeliveryFromNotes(claimed.internal_notes)

  try {
    await sendOrderConfirmationEmail({
      to: claimed.customer_email,
      customerName: claimed.customer_name,
      orderNumber: claimed.order_number,
      items: lineItems,
      subtotal: claimed.subtotal,
      shippingFee: claimed.shipping_fee,
      discountAmount: claimed.discount_amount,
      tax: claimed.tax,
      total: claimed.total,
      estimatedDelivery,
    })
  } catch (err) {
    console.error('[send-order-emails] customer email failed:', err, 'order:', orderNumber)
    // Note: we intentionally do NOT reset confirmation_email_sent_at on failure.
    // Resetting would cause a retry storm. Admin can resend manually (Phase 4).
  }

  // 3. Admin notification (also best-effort).
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail) {
    try {
      await sendAdminOrderNotification({
        to: adminEmail,
        orderNumber: claimed.order_number,
        customerName: claimed.customer_name,
        customerEmail: claimed.customer_email,
        items: lineItems,
        total: claimed.total,
        shippingAddress,
      })
    } catch (err) {
      console.error('[send-order-emails] admin email failed:', err, 'order:', orderNumber)
    }
  }

  return { sent: true }
}
