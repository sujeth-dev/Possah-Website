import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { createRazorpayOrder } from '@/lib/razorpay'
import { sendOrderConfirmationEmail } from '@/lib/email'
import { generateOrderNumber } from '@/lib/utils'

const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  variant_id: z.string().uuid(),
  name: z.string().min(1).max(200),
  image: z.string().min(1),
  qty: z.number().int().positive().max(10),
  colour: z.string().min(1).max(60),
  size: z.string().min(1).max(40),
  // price accepted from client for reference only — server always re-fetches from DB
  price: z.number().positive(),
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
  shipping: z.number().min(0),
})

const GIFT_WRAP_COST = 150
const SHIPPING_THRESHOLD = 2500
const STANDARD_COST = 199
const EXPRESS_COST = 399

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
      { status: 400 },
    )
  }

  const data = parsed.data

  try {
    const supabase = createServerClient()

    // 1. Fetch real variant prices from DB
    const variantIds = [...new Set(data.items.map((i) => i.variant_id))]

    const { data: variants, error: variantError } = await supabase
      .from('product_variants')
      .select('id, stock_qty, products(id, price, is_active)')
      .in('id', variantIds)

    if (variantError || !variants || variants.length !== variantIds.length) {
      return NextResponse.json(
        { message: 'One or more items are no longer available. Please refresh your cart.' },
        { status: 400 },
      )
    }

    const variantMap = new Map(
      variants.map((v) => {
        const product = v.products as unknown as { id: string; price: number; is_active: boolean } | null
        return [
          v.id,
          {
            price: product?.price ?? 0,
            stock_qty: v.stock_qty,
            is_active: product?.is_active ?? false,
          },
        ]
      }),
    )

    for (const item of data.items) {
      const v = variantMap.get(item.variant_id)
      if (!v) {
        return NextResponse.json(
          { message: `"${item.name}" is no longer available.` },
          { status: 400 },
        )
      }
      if (!v.is_active) {
        return NextResponse.json(
          { message: `"${item.name}" has been removed from the catalog.` },
          { status: 400 },
        )
      }
      if (v.stock_qty < item.qty) {
        return NextResponse.json(
          { message: `"${item.name}" only has ${v.stock_qty} unit(s) left. Please update your cart.` },
          { status: 400 },
        )
      }
    }

    // 2. Server subtotal
    const serverSubtotal = data.items.reduce((sum, item) => {
      return sum + variantMap.get(item.variant_id)!.price * item.qty
    }, 0)

    // 3. Shipping
    let serverShipping =
      serverSubtotal >= SHIPPING_THRESHOLD
        ? 0
        : data.delivery_option === 'express'
        ? EXPRESS_COST
        : STANDARD_COST

    // 4. Coupon
    let couponDiscount = 0
    let validatedCouponId: string | null = null

    if (data.coupon_code) {
      const today = new Date().toISOString().split('T')[0]
      const { data: coupon } = await supabase
        .from('coupons')
        .select('id, type, value, min_order_value, expiry_date, usage_limit, usage_count')
        .eq('code', data.coupon_code)
        .eq('is_active', true)
        .single()

      if (!coupon) {
        return NextResponse.json({ message: 'Coupon code is no longer valid.' }, { status: 400 })
      }
      if (coupon.expiry_date && coupon.expiry_date < today) {
        return NextResponse.json({ message: 'Coupon code has expired.' }, { status: 400 })
      }
      if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
        return NextResponse.json(
          { message: 'Coupon code has reached its usage limit.' },
          { status: 400 },
        )
      }
      if (coupon.min_order_value && serverSubtotal < coupon.min_order_value) {
        return NextResponse.json(
          {
            message: `Minimum order of \u20b9${coupon.min_order_value.toLocaleString('en-IN')} required for this code.`,
          },
          { status: 400 },
        )
      }

      validatedCouponId = coupon.id
      if (coupon.type === 'percent') {
        couponDiscount = Math.round((serverSubtotal * coupon.value) / 100)
      } else if (coupon.type === 'flat') {
        couponDiscount = Math.min(coupon.value, serverSubtotal)
      } else if (coupon.type === 'free_shipping') {
        serverShipping = 0
      }
    }

    // 5. Final total
    const giftWrapCost = data.gift_wrap ? GIFT_WRAP_COST : 0
    const serverTotal = serverSubtotal + serverShipping + giftWrapCost - couponDiscount
    const totalPaise = Math.round(serverTotal * 100)

    if (totalPaise < 100) {
      return NextResponse.json({ message: 'Order total is too low.' }, { status: 400 })
    }

    // 6. Atomic coupon increment
    if (validatedCouponId) {
      const { data: incremented, error: rpcError } = await supabase
        .rpc('increment_coupon_usage', { p_coupon_id: validatedCouponId })

      if (rpcError || !incremented) {
        return NextResponse.json(
          { message: 'Coupon is no longer valid. Please try again.' },
          { status: 400 },
        )
      }
    }

    // 7. Create Razorpay order
    const orderNumber = generateOrderNumber()
    let rzOrder: { id: string; amount: number; currency: string }

    try {
      rzOrder = await createRazorpayOrder({
        amount: totalPaise,
        currency: 'INR',
        receipt: orderNumber,
      })
    } catch (rzErr) {
      console.error('[orders/create] Razorpay order creation failed:', rzErr)
      if (validatedCouponId) {
        void supabase.rpc('decrement_coupon_usage', { p_coupon_id: validatedCouponId })
      }
      return NextResponse.json(
        { message: 'Payment gateway error. Please try again.' },
        { status: 502 },
      )
    }

    // 8. Insert order
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
      price: variantMap.get(item.variant_id)!.price,
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
        subtotal: serverSubtotal,
        shipping_fee: serverShipping,
        discount_amount: couponDiscount,
        coupon_code: data.coupon_code || null,
        tax: 0,
        total: serverTotal,
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
      return NextResponse.json(
        { message: 'Failed to save order. Please try again.' },
        { status: 500 },
      )
    }

    // 9. Confirmation email (non-blocking)
    sendOrderConfirmationEmail({
      to: data.contact.email,
      orderNumber,
      customerName: `${data.contact.first_name} ${data.contact.last_name}`,
      items: lineItems.map((item) => ({
        name: item.name,
        colour: item.colour,
        size: item.size,
        qty: item.qty,
        price: item.price,
      })),
      subtotal: serverSubtotal,
      shippingFee: serverShipping,
      discountAmount: couponDiscount,
      tax: 0,
      total: serverTotal,
      estimatedDelivery:
        data.delivery_option === 'express' ? '2\u20133 business days' : '5\u20137 business days',
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
    return NextResponse.json(
      { message: 'Internal server error. Please try again.' },
      { status: 500 },
    )
  }
}
