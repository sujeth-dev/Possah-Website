import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'

// =============================================================================
// POST /api/orders/hide
//
// Soft-hides an order from the customer's /account/orders list.
//
// Eligibility — only the customer-facing soft-hide. Admin always sees it.
//   • payment_status IN ('pending', 'failed', 'refunded')        OR
//   • fulfillment_status = 'cancelled'
// Paid + in-progress orders cannot be hidden (we don't want customers to lose
// track of an active shipment).
//
// Auth — session.user.email must match orders.customer_email. We never accept
// an email from the request body.
// =============================================================================

const schema = z.object({
  order_number: z.string().min(1).max(40),
})

type HideableRow = {
  id: string
  customer_email: string
  payment_status: string
  fulfillment_status: string
  customer_hidden_at: string | null
}

export async function POST(req: NextRequest) {
  // 1. Auth
  const isDev = process.env.NODE_ENV === 'development'
  const session = isDev
    ? { user: { email: process.env.ADMIN_EMAIL ?? 'dev@thepossah.com' } }
    : await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Sign in required.' }, { status: 401 })
  }
  const sessionEmail = session.user.email

  // 2. Parse + validate
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Missing order_number.' }, { status: 400 })
  }
  const { order_number } = parsed.data

  try {
    const supabase = createServerClient()

    // 3. Load the row to verify ownership + eligibility
    const { data: row } = await supabase
      .from('orders')
      .select('id, customer_email, payment_status, fulfillment_status, customer_hidden_at')
      .eq('order_number', order_number)
      .maybeSingle<HideableRow>()

    if (!row) {
      // 404 (not 403) — don't leak existence of someone else's order
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
    }

    if (row.customer_email.toLowerCase() !== sessionEmail.toLowerCase()) {
      // Same 404 — never reveal that this order_number exists under another email
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
    }

    const isEligible =
      ['pending', 'failed', 'refunded'].includes(row.payment_status) ||
      row.fulfillment_status === 'cancelled'

    if (!isEligible) {
      return NextResponse.json(
        { message: 'This order is in progress and cannot be hidden. Contact support if you need help.' },
        { status: 422 },
      )
    }

    if (row.customer_hidden_at) {
      // Already hidden — idempotent success
      return NextResponse.json({ ok: true, already_hidden: true })
    }

    // 4. Soft-hide
    const { error } = await supabase
      .from('orders')
      .update({ customer_hidden_at: new Date().toISOString() })
      .eq('id', row.id)
      .is('customer_hidden_at', null)

    if (error) {
      console.error('[orders/hide] update failed:', error)
      return NextResponse.json({ message: 'Could not hide order. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[orders/hide] unexpected error:', err)
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 })
  }
}
