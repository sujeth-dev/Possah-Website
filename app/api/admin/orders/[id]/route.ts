import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

function requireAdminAuth(request: Request): boolean {
  if (process.env.NODE_ENV === 'development') return true
  const cookie = request.headers.get('cookie') ?? ''
  return cookie.includes('next-auth.session-token') || cookie.includes('__Secure-next-auth.session-token')
}

const OrderUpdateSchema = z.object({
  // Admin can update these — NEVER payment_status (that belongs to Razorpay/webhook)
  fulfillment_status: z.enum(['unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  tracking_number:    z.string().max(100).optional().nullable(),
  courier:            z.string().max(100).optional().nullable(),
  internal_notes:     z.string().max(2000).optional().nullable(),
})

// GET /api/admin/orders/[id] — order detail
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createServerClient()
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

// PATCH /api/admin/orders/[id] — update fulfillment fields
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
    const supabase = createServerClient()

    const updateFields: Record<string, unknown> = {}
    if (data.fulfillment_status !== undefined) updateFields.fulfillment_status = data.fulfillment_status
    if (data.tracking_number    !== undefined) updateFields.tracking_number    = data.tracking_number
    if (data.courier            !== undefined) updateFields.courier            = data.courier
    if (data.internal_notes     !== undefined) updateFields.internal_notes     = data.internal_notes

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ ok: true }) // nothing to update
    }

    const { error } = await supabase
      .from('orders')
      .update(updateFields)
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
