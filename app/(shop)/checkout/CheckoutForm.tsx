'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cartStore'
import { useCouponStore } from '@/lib/store/couponStore'
import { trackBeginCheckout, trackPurchase } from '@/lib/analytics'
import { formatPrice } from '@/lib/utils'

import {
  checkoutSchema,
  type CheckoutFields,
  SHIPPING_THRESHOLD,
  STANDARD_COST,
  EXPRESS_COST,
  GIFT_WRAP_COST,
} from './checkoutTypes'
import { Field, inputStyle } from './CheckoutField'
import { CheckoutContactFields } from './CheckoutContactFields'
import { CheckoutAddressFields } from './CheckoutAddressFields'
import { CheckoutDeliveryOptions } from './CheckoutDeliveryOptions'
import { CheckoutOrderSummary } from './CheckoutOrderSummary'

// ─── Razorpay helper ─────────────────────────────────────────────────────────

interface RazorpayOptions {
  orderId: string
  amount: number
  orderNumber: string
  name: string
  email: string
  phone: string
  onSuccess: (paymentId: string, signature: string) => void
  onPaymentFailed: (code: string, description: string) => void
  onDismiss: () => void
}

function initRazorpay({
  orderId,
  amount,
  orderNumber,
  name,
  email,
  phone,
  onSuccess,
  onPaymentFailed,
  onDismiss,
}: RazorpayOptions) {
  type RzpInstance = {
    open: () => void
    on: (event: string, handler: (resp: Record<string, unknown>) => void) => void
  }
  const RzpCtor = (window as Window & typeof globalThis & { Razorpay: new (opts: Record<string, unknown>) => RzpInstance }).Razorpay

  const rz = new RzpCtor({
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    order_id: orderId,
    amount,
    currency: 'INR',
    name: 'The Possah',
    description: `Order #${orderNumber}`,
    image: 'https://thepossah.com/images/logo-rp.png',
    prefill: { name, email, contact: phone },
    theme: { color: '#1F3A2D' },
    handler: (response: Record<string, unknown>) => {
      onSuccess(response.razorpay_payment_id as string, response.razorpay_signature as string)
    },
    modal: { ondismiss: onDismiss },
  })

  // FIX-PAY-01: capture payment.failed event from the modal
  rz.on('payment.failed', (response: Record<string, unknown>) => {
    const err = (response.error ?? {}) as Record<string, string>
    onPaymentFailed(err.code ?? 'UNKNOWN', err.description ?? 'Payment failed')
  })

  rz.open()
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CheckoutForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items, subtotal, clearCart } = useCartStore()
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const hasGiftWrap = searchParams.get('gift') === '1'
  const coupon = useCouponStore()
  const [couponInput, setCouponInput]       = useState(coupon.code)
  const [couponApplying, setCouponApplying] = useState(false)
  const [couponError, setCouponError]       = useState<string | null>(null)

  const sub   = subtotal()
  const count = items.reduce((s, i) => s + i.qty, 0)

  let couponDiscount = 0
  if (coupon.code && coupon.discountType) {
    if (coupon.discountType === 'percent') {
      couponDiscount = Math.round((sub * coupon.discountValue) / 100)
    } else if (coupon.discountType === 'flat') {
      couponDiscount = coupon.discountValue
    }
  }

  // GA4: begin_checkout fires once on mount when cart is non-empty
  useEffect(() => {
    if (items.length === 0) return
    trackBeginCheckout({
      value: sub,
      items: items.map((i) => ({
        item_id: i.productId,
        item_name: i.name,
        item_variant: `${i.colour} / ${i.size}`,
        price: i.price,
        quantity: i.qty,
      })),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFields>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { delivery_option: 'standard' },
  })

  const deliveryOption = watch('delivery_option')
  const freeShipping   = sub >= SHIPPING_THRESHOLD || coupon.isFreeShipping
  const shippingCost   = freeShipping ? 0 : deliveryOption === 'express' ? EXPRESS_COST : STANDARD_COST
  const giftCost       = hasGiftWrap ? GIFT_WRAP_COST : 0
  const total          = sub + shippingCost + giftCost - couponDiscount

  const applyCoupon = async () => {
    if (!couponInput.trim()) return
    setCouponApplying(true)
    setCouponError(null)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput.trim().toUpperCase(), subtotal: sub }),
      })
      const data = await res.json()
      if (data.valid) {
        coupon.setCoupon(couponInput.trim().toUpperCase(), data.discount_type, data.discount_value ?? 0)
      } else {
        setCouponError(data.message ?? 'Invalid coupon code')
        coupon.clearCoupon()
      }
    } catch {
      setCouponError('Could not validate coupon. Check your connection.')
    } finally {
      setCouponApplying(false)
    }
  }

  const removeCoupon = () => {
    setCouponInput('')
    setCouponError(null)
    coupon.clearCoupon()
  }

  // Redirect to cart if empty
  useEffect(() => {
    if (count === 0) router.replace('/cart')
  }, [count, router])

  const onSubmit = async (data: CheckoutFields) => {
    if (items.length === 0) return
    setSubmitting(true)
    setServerError(null)

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone,
          },
          address: {
            line1: data.address_line1,
            line2: data.address_line2 ?? '',
            city: data.city,
            state: data.state,
            pincode: data.pincode,
          },
          items: items.map((item) => ({
            product_id: item.productId,
            variant_id: item.variantId,
            name: item.name,
            image: item.image,
            price: item.price,
            qty: item.qty,
            colour: item.colour,
            size: item.size,
          })),
          delivery_option: data.delivery_option,
          gift_wrap: hasGiftWrap,
          coupon_code: coupon.code || null,
          notes: data.notes ?? '',
          subtotal: sub,
          shipping: shippingCost,
          coupon_discount: couponDiscount,
          gift_wrap_cost: giftCost,
          total,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        setServerError(result.message ?? 'Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }

      const { razorpay_order_id, order_number, amount } = result

      if (typeof window !== 'undefined' && (window as Window & typeof globalThis & { Razorpay?: unknown }).Razorpay) {
        initRazorpay({
          orderId: razorpay_order_id,
          amount,
          orderNumber: order_number,
          name: `${data.first_name} ${data.last_name}`,
          email: data.email,
          phone: data.phone,
          onPaymentFailed: (code, description) => {
            // FIX-PAY-01: surface failure to user — do NOT clear cart
            setServerError(
              code === 'BAD_REQUEST_ERROR'
                ? 'Payment failed due to a technical issue. Please try again.'
                : `Payment declined: ${description}. Try a different card or UPI.`
            )
            setSubmitting(false)
          },
          onSuccess: async (paymentId: string, signature: string) => {
            try {
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: razorpay_order_id,
                  razorpay_payment_id: paymentId,
                  razorpay_signature: signature,
                  order_number,
                }),
              })
              if (!verifyRes.ok) {
                console.error('[checkout] Verify endpoint error — webhook will reconcile')
              }
            } catch {
              // Network error: webhook reconciles
            }
            trackPurchase({
              transactionId: order_number,
              value: amount / 100,
              items: items.map((i) => ({
                item_id: i.productId,
                item_name: i.name,
                item_variant: `${i.colour} / ${i.size}`,
                price: i.price,
                quantity: i.qty,
              })),
            })
            clearCart()
            coupon.clearCoupon()
            router.push(`/order/confirmation?order=${order_number}`)
          },
          onDismiss: () => {
            setSubmitting(false)
            setServerError('Payment was cancelled. Your order is saved — complete payment to confirm.')
          },
        })
      } else {
        // Fallback: Razorpay script not loaded
        clearCart()
        coupon.clearCoupon()
        router.push(`/order/confirmation?order=${order_number}`)
      }
    } catch {
      setServerError('Network error. Check your connection and try again.')
      setSubmitting(false)
    }
  }

  if (count === 0) return null

  return (
    <>
      {/* Razorpay script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      <div className="container-site py-10 pb-20">
        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 mb-6 hover:opacity-60 transition-opacity duration-200"
          style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}
        >
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M1 5h12M1 5L5 1M1 5l4 4" />
          </svg>
          Back to bag
        </Link>

        <h1
          className="mb-10"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: '400',
            color: 'var(--color-text)',
            letterSpacing: '-0.01em',
          }}
        >
          Checkout
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid lg:grid-cols-[1fr_380px] gap-10 xl:gap-16 items-start">
            {/* ─── Left: Form fields ─────────────────────────────── */}
            <div className="flex flex-col gap-8">
              <CheckoutContactFields register={register} errors={errors} />
              <CheckoutAddressFields register={register} errors={errors} />

              {/* Coupon code */}
              <section aria-labelledby="coupon-heading">
                <h2
                  id="coupon-heading"
                  className="mb-4"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text)',
                  }}
                >
                  Coupon Code
                </h2>
                {coupon.code ? (
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ border: '1px solid var(--color-success)', borderRadius: 'var(--radius-card)', backgroundColor: 'rgba(39,174,96,0.06)' }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-success)' }}>
                      ✓ {coupon.code} applied
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyCoupon())}
                      placeholder="ENTER CODE"
                      style={{ ...inputStyle, flex: 1, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}
                      aria-label="Coupon code"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponApplying || !couponInput.trim() || !!coupon.code}
                      style={{
                        padding: '0 20px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        backgroundColor: 'var(--color-green)',
                        color: 'var(--color-bg)',
                        border: 'none',
                        borderRadius: 'var(--radius-btn)',
                        cursor: couponApplying ? 'wait' : 'pointer',
                        opacity: !couponInput.trim() ? 0.5 : 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {couponApplying ? '…' : 'Apply'}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-error)', marginTop: 6 }}>
                    {couponError}
                  </p>
                )}
              </section>

              <CheckoutDeliveryOptions
                register={register}
                deliveryOption={deliveryOption}
                freeShipping={freeShipping}
              />

              {/* Order notes */}
              <Field label="Order Notes (optional)" error={errors.notes?.message}>
                <textarea
                  {...register('notes')}
                  rows={3}
                  placeholder="Special instructions, e.g. colour preferences for made-to-measure"
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    minHeight: 80,
                  }}
                />
              </Field>

              {/* Server error */}
              {serverError && (
                <div
                  role="alert"
                  className="px-4 py-3"
                  style={{
                    border: '1px solid var(--color-rose)',
                    borderRadius: 'var(--radius-card)',
                    backgroundColor: 'rgba(201, 154, 153, 0.08)',
                  }}
                >
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-rose)' }}>
                    {serverError}
                  </p>
                </div>
              )}
            </div>

            {/* ─── Right: Order summary ──────────────────────────── */}
            <CheckoutOrderSummary
              items={items}
              sub={sub}
              shippingCost={shippingCost}
              giftCost={giftCost}
              total={total}
              freeShipping={freeShipping}
              couponDiscount={couponDiscount}
              coupon={coupon}
              submitting={submitting}
            />
          </div>
        </form>
      </div>
    </>
  )
}
