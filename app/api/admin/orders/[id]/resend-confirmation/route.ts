import { NextResponse, NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { getToken } from 'next-auth/jwt'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendOrderConfirmationEmail } from '@/lib/email'

// POST /api/admin/orders/[id]/resend-confirmation
// Resends the order confirmation email. Rate-limited: 1 per 60s per order.
// Logs the resend as a history row (to_status='confirmation_resent').
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const adminEmail = (token?.email as string | undefined) ?? 'admin'

  try {
    const supabase = createAdminClient()

    // Load order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, customer_email, customer_name, total, subtotal, shipping_fee, discount_amount, tax, line_items, internal_notes')
      .eq('id', params.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Rate-limit: block if a resend was logged for this order in the last 60 seconds
    const sixtySecondsAgo = new Date(Date.now() - 60 * 1000).toISOString()
    const { data: recentResend } = await supabase
      .from('order_status_history')
      .select('id')
      .eq('order_id', params.id)
      .eq('to_status', 'confirmation_resent')
      .gt('changed_at', sixtySecondsAgo)
      .limit(1)

    if (recentResend && recentResend.length > 0) {
      return NextResponse.json(
        { error: 'Rate limited — wait 60 seconds before resending' },
        { status: 429 }
      )
    }

    // Reconstruct email props from stored order data
    const rawItems = Array.isArray(order.line_items) ? order.line_items as Record<string, unknown>[] : []
    const items = rawItems
      .filter((it) => typeof it === 'object' && it !== null && it.name)
      .map((it) => ({
        name:   String(it.name   ?? ''),
        colour: String(it.colour ?? ''),
        size:   String(it.size   ?? ''),
        qty:    Number(it.qty    ?? 0),
        price:  Number(it.unit_price ?? it.price ?? 0),
      }))
      .filter((it) => it.name && it.qty > 0)

    const notes = typeof order.internal_notes === 'string' ? order.internal_notes : ''
    const estimatedDelivery = notes.toLowerCase().includes('express') ? '2–3 business days' : '5–7 business days'

    await sendOrderConfirmationEmail({
      to:             order.customer_email,
      customerName:   order.customer_name,
      orderNumber:    order.order_number,
      items,
      subtotal:       order.subtotal,
      shippingFee:    order.shipping_fee,
      discountAmount: order.discount_amount,
      tax:            order.tax,
      total:          order.total,
      estimatedDelivery,
    })

    // Log the resend in history
    await supabase.from('order_status_history').insert({
      order_id:   params.id,
      from_status: null,
      to_status:  'confirmation_resent',
      changed_by: `admin:${adminEmail}`,
      note:       'Manual resend of confirmation email',
    })

    return NextResponse.json({ sent: true, to: order.customer_email })
  } catch (err) {
    console.error('[resend-confirmation] failed:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
