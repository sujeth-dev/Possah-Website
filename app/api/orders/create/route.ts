import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { createRazorpayOrder } from '@/lib/razorpay'
import { generateOrderNumber } from '@/lib/utils'
import { computeCartFingerprint } from '@/lib/cart-fingerprint'
import { releaseCouponUsage } from '@/lib/coupons'
import {
  SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_COST as STANDARD_COST,
  EXPRESS_SHIPPING_COST as EXPRESS_COST,
  GIFT_WRAP_COST,
} from '@/lib/constants'
import { rateLimit, getIp } from '@/lib/rate-limit'

// =============================================================================
// POST /api/orders/create
//
// Upsert-style flow — at most ONE open pending order per customer email.
//
//   1. Validate input + re-fetch real prices from DB.
//   2. Compute server-authoritative totals + cart_fingerprint.
//   3. Lazy-expire any stale pending orders for this email (expires_at < NOW()).
//      This keeps the one_pending_per_email unique index slot free without
//      needing an external cron job.
//   4. Look up existing open pending order for this customer_email.
//      • Found, same fingerprint   → REUSE: regenerate Razorpay order id,
//                                    UPDATE attempt count + expiry, return
//                                    existing order_number.
//      • Found, different intent   → UPDATE: rewrite cart / address / totals,
//                                    handle coupon delta, regenerate Razorpay,
//                                    keep order_number.
//      • Not found                 → INSERT a fresh row.
//   5. Confirmation email is NEVER sent here — it is fired from
//      app/api/payments/verify and the Razorpay webhook AFTER payment_status
//      flips to 'paid', gated by orders.confirmation_email_sent_at.
//
// Pending orders expire after 7 days (see scripts/dedupe).
// =============================================================================

const PENDING_TTL_HOURS = 24 * 7 // 7 days

const orderItemSchema = z.object({
  product_id: z.string().min(1),
  variant_id: z.string().min(1),
  name: z.string().min(1).max(200),
  image: z.string().min(1),
  qty: z.number().int().positive().max(10),
  colour: z.string().min(1).max(60),
  size: z.string().min(1).max(40),
  // Client-supplied price is reference only — server always re-fetches.
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

type CouponRow = {
  id: string
  type: 'percent' | 'flat' | 'free_shipping'
  value: number
  min_order_value: number | null
  expiry_date: string | null
  usage_limit: number | null
  usage_count: number
}

type ExistingPendingOrder = {
  id: string
  order_number: string
  cart_fingerprint: string | null
  coupon_code: string | null
  payment_attempts: number | null
}

export async function POST(req: NextRequest) {
  // 10 order attempts per IP per hour
  const { success } = rateLimit(`orders:${getIp(req)}`, 10, 60 * 60 * 1000)
  if (!success) {
    return NextResponse.json({ message: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  // ── 1. Parse + validate request ───────────────────────────────────────────
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

    // ── 2. Re-fetch real prices ────────────────────────────────────────────
    const variantIds = [...new Set(data.items.map((i) => i.variant_id))]

    const { data: variants, error: variantError } = await supabase
      .from('product_variants')
      .select('id, stock_qty, products(id, price, is_active)')
      .in('id', variantIds)

    if (variantError || !variants || variants.length !== variantIds.length) {
      return NextResponse.json(
        { message: 'One or more items are no longer available. Please refresh your cart.' },
        { status: 404 },
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
          { status: 409 },
        )
      }
    }

    // ── 3. Compute server-authoritative totals ─────────────────────────────
    const serverSubtotal = data.items.reduce(
      (sum, item) => sum + variantMap.get(item.variant_id)!.price * item.qty,
      0,
    )

    let serverShipping =
      serverSubtotal >= SHIPPING_THRESHOLD
        ? 0
        : data.delivery_option === 'express'
        ? EXPRESS_COST
        : STANDARD_COST

    // ── 4. Validate coupon (read-only here; increment is delayed) ─────────
    let couponDiscount = 0
    let validatedCoupon: CouponRow | null = null
    const requestedCouponCode = data.coupon_code?.trim() || null

    if (requestedCouponCode) {
      const today = new Date().toISOString().split('T')[0]
      const { data: coupon } = await supabase
        .from('coupons')
        .select('id, type, value, min_order_value, expiry_date, usage_limit, usage_count')
        .eq('code', requestedCouponCode)
        .eq('is_active', true)
        .single<CouponRow>()

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
          { message: `Minimum order of ₹${coupon.min_order_value.toLocaleString('en-IN')} required for this code.` },
          { status: 400 },
        )
      }

      validatedCoupon = coupon
      if (coupon.type === 'percent') {
        couponDiscount = Math.round((serverSubtotal * coupon.value) / 100)
      } else if (coupon.type === 'flat') {
        couponDiscount = Math.min(coupon.value, serverSubtotal)
      } else if (coupon.type === 'free_shipping') {
        serverShipping = 0
      }
    }

    const giftWrapCost = data.gift_wrap ? GIFT_WRAP_COST : 0
    const serverTotal = serverSubtotal + serverShipping + giftWrapCost - couponDiscount
    const totalPaise = Math.round(serverTotal * 100)

    if (totalPaise < 100) {
      return NextResponse.json({ message: 'Order total is too low.' }, { status: 400 })
    }

    // ── 5. Cart fingerprint ────────────────────────────────────────────────
    const fingerprint = computeCartFingerprint({
      items: data.items.map((i) => ({ variant_id: i.variant_id, qty: i.qty })),
      delivery_option: data.delivery_option,
      coupon_code: requestedCouponCode,
      gift_wrap: data.gift_wrap,
      total: serverTotal,
    })

    // ── 6. Lazy-expire stale pending orders for this email ────────────────
    // Cancels any rows where expires_at has passed before we attempt the
    // upsert lookup. Keeps the one_pending_per_email unique index slot free
    // without needing an external cron job.
    const nowIso = new Date().toISOString()

    // Release coupon usage held by orders we are about to expire (audit: coupon
    // usage leak). Fetch them first so we know which codes to give back, then
    // cancel them. Best-effort — failures here must never block checkout.
    const { data: expiringRows } = await supabase
      .from('orders')
      .select('coupon_code')
      .eq('customer_email', data.contact.email)
      .eq('payment_status', 'pending')
      .eq('fulfillment_status', 'unfulfilled')
      .lt('expires_at', nowIso)

    for (const row of expiringRows ?? []) {
      await releaseCouponUsage(supabase, row.coupon_code).catch(() => {})
    }

    await supabase
      .from('orders')
      .update({
        fulfillment_status: 'cancelled',
        internal_notes: '[auto-expired on next order]',
      })
      .eq('customer_email', data.contact.email)
      .eq('payment_status', 'pending')
      .eq('fulfillment_status', 'unfulfilled')
      .lt('expires_at', nowIso)

    // ── 7. Look up existing open pending order for this email ─────────────
    const { data: existingRow } = await supabase
      .from('orders')
      .select('id, order_number, cart_fingerprint, coupon_code, payment_attempts')
      .eq('customer_email', data.contact.email)
      .eq('payment_status', 'pending')
      .eq('fulfillment_status', 'unfulfilled')
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<ExistingPendingOrder>()

    // Build shared row state used by all three branches
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

    const expiresAt = new Date(Date.now() + PENDING_TTL_HOURS * 60 * 60 * 1000).toISOString()

    // ── 8. Create Razorpay order (always fresh — old ones may have expired)
    let rzOrderNumberForReceipt = existingRow?.order_number ?? generateOrderNumber()
    let rzOrder: { id: string; amount: number; currency: string }
    try {
      rzOrder = await createRazorpayOrder({
        amount: totalPaise,
        currency: 'INR',
        receipt: rzOrderNumberForReceipt,
      })
    } catch (rzErr) {
      console.error('[orders/create] Razorpay order creation failed:', rzErr)
      return NextResponse.json(
        { message: 'Payment gateway error. Please try again.' },
        { status: 502 },
      )
    }

    // ── 9a. UPDATE branch (existing open pending found) ───────────────────
    if (existingRow) {
      const existingCoupon = existingRow.coupon_code?.trim() || null

      // Coupon delta: only mutate counter when code changed
      if (existingCoupon !== requestedCouponCode) {
        // Decrement the previously-counted coupon
        if (existingCoupon) {
          const { data: prevCoupon } = await supabase
            .from('coupons')
            .select('id')
            .eq('code', existingCoupon)
            .maybeSingle<{ id: string }>()
          if (prevCoupon?.id) {
            void supabase.rpc('decrement_coupon_usage', { p_coupon_id: prevCoupon.id })
          }
        }
        // Increment the newly-applied coupon, atomically
        if (validatedCoupon) {
          const { data: incremented, error: rpcError } = await supabase.rpc(
            'increment_coupon_usage',
            { p_coupon_id: validatedCoupon.id },
          )
          if (rpcError || !incremented) {
            return NextResponse.json(
              { message: 'Coupon is no longer valid. Please try again.' },
              { status: 400 },
            )
          }
        }
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          customer_name: `${data.contact.first_name} ${data.contact.last_name}`,
          customer_phone: data.contact.phone,
          shipping_address: shippingAddress,
          line_items: lineItems,
          subtotal: serverSubtotal,
          shipping_fee: serverShipping,
          discount_amount: couponDiscount,
          coupon_code: requestedCouponCode,
          tax: 0,
          total: serverTotal,
          cart_fingerprint: fingerprint,
          gateway_order_id: rzOrder.id,
          is_gift: data.gift_wrap,
          gift_message: data.notes || null,
          internal_notes: data.delivery_option === 'express' ? 'Express delivery requested' : null,
          payment_attempts: (existingRow.payment_attempts ?? 0) + 1,
          expires_at: expiresAt,
        })
        .eq('id', existingRow.id)
        .eq('payment_status', 'pending') // re-assert: don't overwrite if just paid

      if (updateError) {
        console.error('[orders/create] UPDATE failed:', updateError)
        return NextResponse.json(
          { message: 'Failed to update existing pending order. Please try again.' },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        order_id: existingRow.id,
        order_number: existingRow.order_number,
        razorpay_order_id: rzOrder.id,
        amount: totalPaise,
        reused: true,
        same_cart: existingRow.cart_fingerprint === fingerprint,
      })
    }

    // ── 9b. INSERT branch (no existing open pending) ──────────────────────

    // Increment coupon only for the first attempt (fresh order)
    if (validatedCoupon) {
      const { data: incremented, error: rpcError } = await supabase.rpc(
        'increment_coupon_usage',
        { p_coupon_id: validatedCoupon.id },
      )
      if (rpcError || !incremented) {
        return NextResponse.json(
          { message: 'Coupon is no longer valid. Please try again.' },
          { status: 400 },
        )
      }
    }

    const { data: insertedOrder, error: insertError } = await supabase
      .from('orders')
      .insert({
        order_number: rzOrderNumberForReceipt,
        customer_name: `${data.contact.first_name} ${data.contact.last_name}`,
        customer_email: data.contact.email,
        customer_phone: data.contact.phone,
        shipping_address: shippingAddress,
        line_items: lineItems,
        subtotal: serverSubtotal,
        shipping_fee: serverShipping,
        discount_amount: couponDiscount,
        coupon_code: requestedCouponCode,
        tax: 0,
        total: serverTotal,
        cart_fingerprint: fingerprint,
        payment_status: 'pending',
        fulfillment_status: 'unfulfilled',
        gateway_order_id: rzOrder.id,
        is_gift: data.gift_wrap,
        gift_message: data.notes || null,
        internal_notes: data.delivery_option === 'express' ? 'Express delivery requested' : null,
        payment_attempts: 1,
        expires_at: expiresAt,
      })
      .select('id, order_number')
      .single()

    if (insertError || !insertedOrder) {
      // Race condition: another concurrent request inserted a pending order for
      // this email after our SELECT but before our INSERT. The unique partial
      // index (added by scripts/dedupe/02_finalize.sql) rejects the duplicate.
      // We refund the just-incremented coupon and retry the lookup once.
      const isUniqueViolation =
        insertError && (insertError.code === '23505' || insertError.message?.includes('one_pending_per_email'))

      if (isUniqueViolation) {
        if (validatedCoupon) {
          void supabase.rpc('decrement_coupon_usage', { p_coupon_id: validatedCoupon.id })
        }
        const { data: racedRow } = await supabase
          .from('orders')
          .select('id, order_number')
          .eq('customer_email', data.contact.email)
          .eq('payment_status', 'pending')
          .eq('fulfillment_status', 'unfulfilled')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle<{ id: string; order_number: string }>()

        if (racedRow) {
          return NextResponse.json({
            success: true,
            order_id: racedRow.id,
            order_number: racedRow.order_number,
            razorpay_order_id: rzOrder.id,
            amount: totalPaise,
            reused: true,
            same_cart: false,
            raced: true,
          })
        }
      }

      console.error('[orders/create] INSERT failed:', insertError)
      if (validatedCoupon) {
        void supabase.rpc('decrement_coupon_usage', { p_coupon_id: validatedCoupon.id })
      }
      return NextResponse.json(
        { message: 'Failed to save order. Please try again.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      order_id: insertedOrder.id,
      order_number: insertedOrder.order_number,
      razorpay_order_id: rzOrder.id,
      amount: totalPaise,
      reused: false,
      same_cart: false,
    })
  } catch (err) {
    console.error('[orders/create] Unexpected error:', err)
    return NextResponse.json(
      { message: 'Internal server error. Please try again.' },
      { status: 500 },
    )
  }
}
