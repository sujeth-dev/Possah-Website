import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { createRazorpayOrder } from '@/lib/razorpay'

// =============================================================================
// POST /api/orders/:orderNumber/retry-payment
//
// Generates a fresh Razorpay order id for an existing open pending order so
// the customer can re-open the Razorpay modal without going through the full
// checkout form again.
//
// Auth — session.user.email must match orders.customer_email.
// Refuses if the order is already paid, cancelled, refunded, or has fulfilment
// progress beyond unfulfilled.
//
// Retries are uncapped by design (DEN: "retry is fine") — the unique partial
// index `one_pending_per_email` plus this endpoint's single-row UPDATE keep
// the DB clean regardless of how many times the modal is reopened.
//
// Returns the standard checkout-ready payload:
//   { success, order_id, order_number, razorpay_order_id, amount }
// Client opens Razorpay → on success POST /api/payments/verify (same as the
// first attempt).
// =============================================================================

const PENDING_TTL_HOURS = 24 * 7

type RetryRow = {
  id: string
  order_number: string
  customer_email: string
  payment_status: string
  fulfillment_status: string
  total: number
  payment_attempts: number | null
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { orderNumber: string } },
) {
  // 1. Auth
  const isDev = process.env.NODE_ENV === 'development'
  const session = isDev
    ? { user: { email: 'dev@thepossah.com' } }
    : await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ success: false, message: 'Sign in required.' }, { status: 401 })
  }

  const orderNumber = params.orderNumber

  try {
    const supabase = createServerClient()

    const { data: row } = await supabase
      .from('orders')
      .select('id, order_number, customer_email, payment_status, fulfillment_status, total, payment_attempts')
      .eq('order_number', orderNumber)
      .maybeSingle<RetryRow>()

    if (!row) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 })
    }

    if (row.customer_email.toLowerCase() !== session.user.email.toLowerCase()) {
      // Treat as not-found — never reveal that this order_number exists.
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 })
    }

    if (row.payment_status === 'paid') {
      return NextResponse.json(
        { success: false, message: 'This order is already paid.' },
        { status: 409 },
      )
    }
    if (row.payment_status === 'refunded') {
      return NextResponse.json(
        { success: false, message: 'This order was refunded and cannot be retried.' },
        { status: 409 },
      )
    }
    if (row.fulfillment_status === 'cancelled') {
      return NextResponse.json(
        { success: false, message: 'This order was cancelled.' },
        { status: 409 },
      )
    }
    if (row.fulfillment_status !== 'unfulfilled') {
      return NextResponse.json(
        { success: false, message: 'This order is in progress and cannot be retried.' },
        { status: 409 },
      )
    }

    // 2. Generate a fresh Razorpay order id for the stored total.
    const totalPaise = Math.round(row.total * 100)
    if (totalPaise < 100) {
      return NextResponse.json(
        { success: false, message: 'Order total is too low to charge.' },
        { status: 400 },
      )
    }

    let rzOrder: { id: string; amount: number; currency: string }
    try {
      rzOrder = await createRazorpayOrder({
        amount: totalPaise,
        currency: 'INR',
        receipt: row.order_number,
      })
    } catch (rzErr) {
      console.error('[orders/retry-payment] Razorpay create failed:', rzErr)
      return NextResponse.json(
        { success: false, message: 'Payment gateway error. Please try again.' },
        { status: 502 },
      )
    }

    // 3. Persist the new gateway_order_id, bump attempts, refresh expiry.
    const expiresAt = new Date(Date.now() + PENDING_TTL_HOURS * 60 * 60 * 1000).toISOString()
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        gateway_order_id: rzOrder.id,
        payment_attempts: (row.payment_attempts ?? 0) + 1,
        expires_at: expiresAt,
        // Reset to pending in the edge case it was 'failed' — Razorpay treats
        // each attempt as independent and we want the verify path to flip it
        // back to 'paid' on success.
        payment_status: 'pending',
      })
      .eq('id', row.id)
      .neq('payment_status', 'paid')

    if (updateError) {
      console.error('[orders/retry-payment] UPDATE failed:', updateError)
      return NextResponse.json(
        { success: false, message: 'Could not prepare retry. Please try again.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      order_id: row.id,
      order_number: row.order_number,
      razorpay_order_id: rzOrder.id,
      amount: totalPaise,
    })
  } catch (err) {
    console.error('[orders/retry-payment] Unexpected error:', err)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    )
  }
}
