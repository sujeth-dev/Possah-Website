import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { rateLimit, getIp } from '@/lib/rate-limit'

const schema = z.object({
  code: z.string().min(1).max(32).transform(s => s.toUpperCase()),
  subtotal: z.number().positive(),
})

export async function POST(req: NextRequest) {
  // 20 attempts per IP per 5 minutes — enough for legitimate use, blocks enumeration
  const { success } = rateLimit(`coupon:${getIp(req)}`, 20, 5 * 60 * 1000)
  if (!success) {
    return NextResponse.json({ valid: false, message: 'Too many requests. Please wait.' }, { status: 429 })
  }

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
    // DATE comparison — always compare 'YYYY-MM-DD' to 'YYYY-MM-DD'.
    // Coupon is valid ALL DAY on expiry_date, expires at start of the next day.
    const today = new Date().toISOString().split('T')[0]

    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (!coupon) {
      return NextResponse.json({ valid: false, message: 'This code is not valid.' })
    }

    if (coupon.expiry_date && coupon.expiry_date < today) {
      return NextResponse.json({ valid: false, message: 'This code has expired.' })
    }

    if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
      return NextResponse.json({ valid: false, message: 'This code has reached its usage limit.' })
    }

    if (coupon.min_order_value && subtotal < coupon.min_order_value) {
      return NextResponse.json({
        valid: false,
        message: `Minimum order of Rs.${coupon.min_order_value.toLocaleString('en-IN')} required for this code.`,
      })
    }

    const discountType: 'percent' | 'flat' | 'free_shipping' =
      coupon.type as 'percent' | 'flat' | 'free_shipping'
    const discountValue: number = coupon.value

    let message: string
    if (discountType === 'percent') {
      message = `${discountValue}% off your order`
    } else if (discountType === 'flat') {
      message = `Rs.${discountValue.toLocaleString('en-IN')} off your order`
    } else {
      message = 'Free shipping applied'
    }

    return NextResponse.json({
      valid: true,
      discount_type: discountType,
      discount_value: discountValue,
      message,
    })
  } catch (err) {
    console.error('[coupons/validate] Error:', err)
    return NextResponse.json(
      { valid: false, message: 'Unable to validate coupon. Please try again.' },
      { status: 500 },
    )
  }
}
