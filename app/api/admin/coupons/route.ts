import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

function requireAdminAuth(request: Request): boolean {
  if (process.env.NODE_ENV === 'development') return true
  const cookie = request.headers.get('cookie') ?? ''
  return cookie.includes('next-auth.session-token') || cookie.includes('__Secure-next-auth.session-token')
}

const CouponSchema = z.object({
  code:            z.string().min(2).max(32).regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase alphanumeric'),
  type:            z.enum(['percent', 'flat', 'free_shipping']),
  value:           z.number().min(0).max(100000),
  min_order_value: z.number().min(0).default(0),
  usage_limit:     z.number().int().min(1).optional().nullable(),
  expiry_date:     z.string().datetime({ offset: true }).optional().nullable(),
  is_active:       z.boolean().default(true),
})

type CouponInput = z.infer<typeof CouponSchema>

// GET /api/admin/coupons — list all
export async function GET(request: Request) {
  if (!requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/coupons — create
export async function POST(request: Request) {
  if (!requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body   = await request.json()
    const parsed = CouponSchema.safeParse({ ...body, code: (body.code as string)?.toUpperCase() })

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.flatten().fieldErrors }, { status: 422 })
    }

    const supabase = createAdminClient()

    // Check for code uniqueness
    const { count } = await supabase
      .from('coupons')
      .select('id', { count: 'exact', head: true })
      .eq('code', parsed.data.code)

    if ((count ?? 0) > 0) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 })
    }

    const { data: created, error } = await supabase
      .from('coupons')
      .insert({
        code:            parsed.data.code,
        type:            parsed.data.type,
        value:           parsed.data.value,
        min_order_value: parsed.data.min_order_value,
        usage_limit:     parsed.data.usage_limit ?? null,
        usage_count:     0,
        expiry_date:     parsed.data.expiry_date ?? null,
        is_active:       parsed.data.is_active,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: created.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
