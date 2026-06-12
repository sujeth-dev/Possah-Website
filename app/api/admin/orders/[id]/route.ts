import { NextResponse, NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { getToken } from 'next-auth/jwt'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendShippedEmail, sendDeliveredEmail } from '@/lib/email'

const OrderUpdateSchema = z.object({
  fulfillment_status: z.enum(['unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  tracking_number:    z.string().max(100).optional().nullable(),
  courier:            z.string().max(100).optional().nullable(),
  internal_notes:     z.string().max(2000).optional().nullable(),
})

// GET /api/admin/orders/[id] — order detail
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/orders/[id] — update fulfillment fields + write status history + trigger emails
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const adminEmail = (token?.email as string | undefined) ?? 'admin'

  try {
    const body   = await request.json()
    const parsed = OrderUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', issues: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const data     = parsed.data
    const supabase = createAdminClient()

    const updateFields: Record<string, unknown> = {}
    if (data.fulfillment_status !== undefined) updateFields.fulfillment_status = data.fulfillment_status
    if (data.tracking_number    !== undefined) updateFields.tracking_number    = data.tracking_number
    if (data.courier            !== undefined) updateFields.courier            = data.courier
    if (data.internal_notes     !== undefined) updateFields.internal_notes     = data.internal_notes

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ ok: true })
    }

    // When changing fulfillment status: fetch current state for history + email context
    let fromStatus: string | null = null
    let orderInfo: {
      customer_email: string
      customer_name: string
      order_number: string
      tracking_number: string | null
      courier: string | null
    } | null = null

    if (data.fulfillment_status !== undefined) {
      const { data: current } = await supabase
        .from('orders')
        .select('fulfillment_status, customer_email, customer_name, order_number, tracking_number, courier')
        .eq('id', params.id)
        .single()

      if (current) {
        fromStatus = current.fulfillment_status as string
        orderInfo = {
          customer_email:  current.customer_email,
          customer_name:   current.customer_name,
          order_number:    current.order_number,
          // Prefer new values if included in this update
          tracking_number: data.tracking_number !== undefined ? (data.tracking_number ?? null) : current.tracking_number,
          courier:         data.courier         !== undefined ? (data.courier         ?? null) : current.courier,
        }
      }
    }

    const { error } = await supabase
      .from('orders')
      .update(updateFields)
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Insert history row + conditionally fire email when status actually changed
    if (data.fulfillment_status !== undefined && fromStatus !== data.fulfillment_status && orderInfo) {
      const toStatus = data.fulfillment_status

      // Allow skipping 'processing' (unfulfilled → shipped fires the email too)
      const isEmailTransition =
        (toStatus === 'shipped'   && fromStatus !== 'delivered' && fromStatus !== 'cancelled') ||
        (toStatus === 'delivered' && fromStatus !== 'cancelled')

      // De-dupe: check for the same to_status on this order in the last hour
      let alreadyEmailed = false
      if (isEmailTransition) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
        const { data: recent } = await supabase
          .from('order_status_history')
          .select('id')
          .eq('order_id', params.id)
          .eq('to_status', toStatus)
          .gt('changed_at', oneHourAgo)
          .limit(1)
        alreadyEmailed = (recent?.length ?? 0) > 0
      }

      // Always insert history
      await supabase.from('order_status_history').insert({
        order_id:    params.id,
        from_status: fromStatus,
        to_status:   toStatus,
        changed_by:  `admin:${adminEmail}`,
      })

      // Fire email (best-effort — never block the 200 response)
      if (isEmailTransition && !alreadyEmailed) {
        if (toStatus === 'shipped') {
          sendShippedEmail({
            to:             orderInfo.customer_email,
            customerName:   orderInfo.customer_name,
            orderNumber:    orderInfo.order_number,
            trackingNumber: orderInfo.tracking_number,
            courier:        orderInfo.courier,
          }).catch(err => console.error('[order PATCH] shipped email failed:', err))
        } else if (toStatus === 'delivered') {
          sendDeliveredEmail({
            to:           orderInfo.customer_email,
            customerName: orderInfo.customer_name,
            orderNumber:  orderInfo.order_number,
          }).catch(err => console.error('[order PATCH] delivered email failed:', err))
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
