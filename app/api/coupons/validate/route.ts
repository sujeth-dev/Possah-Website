import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'

const schema = z.object({
  code: z.string().min(1).max(32).toUpperCase(),
  subtotal: z.number().positive(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ valid: false, message: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ valid: false, message: 'Invalid request.' }, { status: 400 })
  }

  const { code, subtotal } = parsed.data

  try {
    const supabase = createServerClient()
    const now = new Date().toISOString()

    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (!coupon) {
      return NextResponse.json({ valid: false, message: 'This code is not valid.' })
    }

    // Check expiry (column: expiry_date)
    if (coupon.expiry_date && coupon.expiry_date < now) {
      return NextResponse.json({ valid: false, message: 'This code has expired.' })
    }

    // Check usage limit
    if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
      return NextResponse.json({ valid: false, message: 'This code has reached its usage limit.' })
    }

    // Check minimum order value
    if (coupon.min_order_value && subtotal < coupon.min_order_value) {
      return NextResponse.json({
        valid: false,
        message: `Minimum order of ₹${coupon.min_order_value.toLocaleString('en-IN')} required for this code.`,
      })
    }

    // column: type = 'percent' | 'flat' | 'free_shipping', value = number
    const discountType: 'percent' | 'fixed' =
      coupon.type === 'percent' ? 'percent' : 'fixed'
    const discountValue: number = coupon.value

    return NextResponse.json({
      valid: true,
      discount_type: discountType,
      discount_value: discountValue,
      message: discountType === 'percent'
        ? `${discountValue}% off applied!`
        : `₹${discountValue.toLocaleString('en-IN')} off applied!`,
    })
  } catch {
    return NextResponse.json({ valid: false, message: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
