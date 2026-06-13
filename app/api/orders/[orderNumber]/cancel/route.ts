import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, DEV_AUTH_BYPASS } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import { releaseCouponUsage } from '@/lib/coupons'

// =============================================================================
// POST /api/orders/:orderNumber/cancel
//
// Customer-initiated cancel for an open pending / failed order.
//
// Auth — session.user.email must match orders.customer_email.
// Refuses if the order is paid, refunded, or already shipped/delivered. (Those
// cases need a refund flow, not a self-serve cancel.)
//
// Sets fulfillment_status='cancelled'. The customer then typically follows
// with /api/orders/hide to remove the row from their list.
// =============================================================================

type CancelRow = {
  id: string
  customer_email: string
  payment_status: string
  fulfillment_status: string
  coupon_code: string | null
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { orderNumber: string } },
) {
  const isDev = DEV_AUTH_BYPASS
  const session = isDev
    ? { user: { email: process.env.ADMIN_EMAIL ?? 'dev@thepossah.com' } }
    : await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ success: false, message: 'Sign in required.' }, { status: 401 })
  }

  const orderNumber = params.orderNumber

  try {
    const supabase = createServerClient()

    const { data: row } = await supabase
      .from('orders')
      .select('id, customer_email, payment_status, fulfillment_status, coupon_code')
      .eq('order_number', orderNumber)
      .maybeSingle<CancelRow>()

    if (!row) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 })
    }

    if (row.customer_email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 })
    }

    if (row.payment_status === 'paid') {
      return NextResponse.json(
        { success: false, message: 'Paid orders cannot be cancelled here. Contact us for a refund.' },
        { status: 409 },
      )
    }
    if (row.fulfillment_status === 'cancelled') {
      return NextResponse.json({ success: true, already_cancelled: true })
    }
    if (!['unfulfilled', 'processing'].includes(row.fulfillment_status)) {
      return NextResponse.json(
        { success: false, message: 'This order is in progress and cannot be cancelled here.' },
        { status: 409 },
      )
    }

    const { error } = await supabase
      .from('orders')
      .update({ fulfillment_status: 'cancelled' })
      .eq('id', row.id)
      .neq('payment_status', 'paid')

    if (error) {
      console.error('[orders/cancel] UPDATE failed:', error)
      return NextResponse.json(
        { success: false, message: 'Could not cancel order. Please try again.' },
        { status: 500 },
      )
    }

    // Release the coupon usage this pending/failed order was holding (audit:
    // coupon usage leak). Best-effort — never fail the cancel for this.
    await releaseCouponUsage(supabase, row.coupon_code).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[orders/cancel] Unexpected error:', err)
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 },
    )
  }
}
