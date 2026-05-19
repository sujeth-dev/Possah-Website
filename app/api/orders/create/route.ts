import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { createRazorpayOrder } from '@/lib/razorpay'
import { sendOrderConfirmationEmail } from '@/lib/email'
import { generateOrderNumber } from '@/lib/utils'

const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string(),
  name: z.string().min(1).max(200),
  image: z.string(),
  price: z.number().positive(),
  qty: z.number().int().positive().max(10),
  colour: z.string().min(1).max(60),
  size: z.string().min(1).max(40),
})

const createOrderSchema = z.object({
  contact: z.object({
    first_name: z.string().min(1).max(60),
    last_name: z.string().min(1).max(60),
    email: z.string().email(),
    phone: z.string().regex(/^[6-9]\d{9}$/),
  }),
  address: z.object({
    line1: z.string().min(5).max(200),
    line2: z.string().max(200).optional().default(''),
    city: z.string().min(2).max(80),
    state: z.string().min(2).max(60),
    pincode: z.string().regex(/^\d{6}$/),
  }),
  items: z.array(orderItemSchema).min(1).max(50),
  delivery_option: z.enum(['standard', 'express']),
  gift_wrap: z.boolean().default(false),
  coupon_code: z.string().nullable().optional(),
  notes: z.string().max(500).optional().default(''),
  subtotal: z.number().positive(),
  shipping: z.number().min(0),
  coupon_discount: z.number().min(0).default(0),
  gift_wrap_cost: z.number().min(0).default(0),
  total: z.number().positive(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 })
  }

  const parsed = createOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid order data.', errors: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const data = parsed.data
  const GIFT_WRAP_COST = 150

  // Server-side total sanity check (±1 rounding drift allowed)
  const expectedTotal =
    data.subtotal + data.shipping + (data.gift_wrap ? GIFT_WRAP_COST : 0) - data.coupon_discount
  if (Math.abs(expectedTotal - data.total) > 1) {
    return NextResponse.json({ message: 'Order total mismatch. Please refresh and try again.' }, { status: 400 })
  }

  try {
    const supabase = createServerClient()

    // Validate coupon still active
    if (data.coupon_code) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('id, usage_count, usage_limit')
        .eq('code', data.coupon_code)
        .eq('is_active', true)
        .single()
      if (!coupon) {
        return NextResponse.json({ message: 'Coupon code is no longer valid.' }, { status: 400 })
      }
    }

    const orderNumber = generateOrderNumber()
    const totalPaise = Math.round(data.total * 100)

    // Create Razorpay order
    const rzOrder = await createRazorpayOrder({
      amount: totalPaise,
      currency: 'INR',
      receipt: orderNumber,
    })

    // Map to actual DB schema columns
    const shippingAddress = {
      line1: data.address.line1,
      line2: data.address.line2,
      city: data.address.city,
      state: data.address.state,
      pincode: data.address.pincode,
    }

    const lineItems = data.items.map((item) => ({
      product_id: item.product_id,
      variant_id: item.variant_id,
      name: item.name,
      image: item.image,
      price: item.price,
      qty: item.qty,
      colour: item.colour,
      size: item.size,
    }))

    const { data: insertedOrder, error: insertError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: `${data.contact.first_name} ${data.contact.last_name}`,
        customer_email: data.contact.email,
        customer_phone: data.contact.phone,
        shipping_address: shippingAddress,
        line_items: lineItems,
        subtotal: data.subtotal,
        shipping_fee: data.shipping,
        discount_amount: data.coupon_discount,
        coupon_code: data.coupon_code ?? null,
        tax: 0,
        total: data.total,
        payment_status: 'pending',
        fulfillment_status: 'unfulfilled',
        gateway_order_id: rzOrder.id,
        is_gift: data.gift_wrap,
        gift_message: data.notes || null,
        internal_notes: data.delivery_option === 'express' ? 'Express delivery requested' : null,
      })
      .select('id')
      .single()

    if (insertError || !insertedOrder) {
      console.error('[orders/create] DB insert error:', insertError)
      return NextResponse.json({ message: 'Failed to save order. Please try again.' }, { status: 500 })
    }

    // Increment coupon usage (non-blocking)
    if (data.coupon_code) {
      supabase
        .from('coupons')
        .select('id, usage_count')
        .eq('code', data.coupon_code)
        .single()
        .then(({ data: coupon }) => {
          if (coupon) {
            supabase
              .from('coupons')
              .update({ usage_count: (coupon.usage_count ?? 0) + 1 })
              .eq('id', coupon.id)
              .then(() => {})
          }
        })
    }

    // Send confirmation email (non-blocking, never blocks response)
    sendOrderConfirmationEmail({
      to: data.contact.email,
      orderNumber,
      customerName: `${data.contact.first_name} ${data.contact.last_name}`,
      items: data.items.map((item) => ({
        name: item.name,
        colour: item.colour,
        size: item.size,
        qty: item.qty,
        price: item.price,
      })),
      subtotal: data.subtotal,
      shippingFee: data.shipping,
      discountAmount: data.coupon_discount,
      tax: 0,
      total: data.total,
      estimatedDelivery: data.delivery_option === 'express' ? '2–3 business days' : '5–7 business days',
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      order_id: insertedOrder.id,
      order_number: orderNumber,
      razorpay_order_id: rzOrder.id,
      amount: totalPaise,
    })
  } catch (err) {
    console.error('[orders/create] Unexpected error:', err)
    return NextResponse.json({ message: 'An unexpected error occurred. Please try again.' }, { status: 500 })
  }
}
