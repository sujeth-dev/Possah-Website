import { NextResponse, NextRequest } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const CouponUpdateSchema = z.object({
  code:            z.string().min(2).max(32).regex(/^[A-Z0-9_-]+$/).optional(),
  type:            z.enum(['percent', 'flat', 'free_shipping']).optional(),
  value:           z.number().min(0).max(100000).optional(),
  min_order_value: z.number().min(0).optional(),
  usage_limit:     z.number().int().min(1).optional().nullable(),
  expiry_date:     z.string().datetime({ offset: true }).optional().nullable(),
  is_active:       z.boolean().optional(),
})

// PATCH /api/admin/coupons/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body   = await request.json()
    const parsed = CouponUpdateSchema.safeParse(
      body.code ? { ...body, code: (body.code as string).toUpperCase() } : body
    )

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const supabase = createAdminClient()
    const updates: Record<string, unknown> = {}

    const d = parsed.data
    if (d.code            !== undefined) updates.code            = d.code
    if (d.type            !== undefined) updates.type            = d.type
    if (d.value           !== undefined) updates.value           = d.value
    if (d.min_order_value !== undefined) updates.min_order_value = d.min_order_value
    if (d.usage_limit     !== undefined) updates.usage_limit     = d.usage_limit
    if (d.expiry_date     !== undefined) updates.expiry_date     = d.expiry_date
    if (d.is_active       !== undefined) updates.is_active       = d.is_active

    if (Object.keys(updates).length === 0) return NextResponse.json({ ok: true })

    const { error } = await supabase.from('coupons').update(updates).eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/coupons/[id] — hard delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('coupons').delete().eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
