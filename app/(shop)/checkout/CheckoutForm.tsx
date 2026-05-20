'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cartStore'
import { formatPrice } from '@/lib/utils'

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const checkoutSchema = z.object({
  first_name: z.string().min(1, 'First name required').max(60),
  last_name: z.string().min(1, 'Last name required').max(60),
  email: z.string().email('Invalid email'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number'),
  address_line1: z.string().min(5, 'Address required').max(200),
  address_line2: z.string().max(200).optional(),
  city: z.string().min(2, 'City required').max(80),
  state: z.string().min(2, 'State required').max(60),
  pincode: z.string().regex(/^\d{6}$/, 'Enter valid 6-digit pincode'),
  delivery_option: z.enum(['standard', 'express']),
  notes: z.string().max(500).optional(),
})

type CheckoutFields = z.infer<typeof checkoutSchema>

// ─── Constants ───────────────────────────────────────────────────────────────

const SHIPPING_THRESHOLD = 2500
const STANDARD_COST = 199
const EXPRESS_COST = 399
const GIFT_WRAP_COST = 150

const DELIVERY_OPTIONS = [
  {
    value: 'standard' as const,
    label: 'Standard Delivery',
    sub: '5–7 business days',
    price: STANDARD_COST,
  },
  {
    value: 'express' as const,
    label: 'Express Delivery',
    sub: '2–3 business days',
    price: EXPRESS_COST,
  },
]

// ─── Field component ─────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: error ? 'var(--color-rose)' : 'var(--color-text-muted)',
        }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p
          role="alert"
          style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-rose)' }}
        >
          {error}
        </p>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '16px', // prevents iOS zoom
  color: 'var(--color-text)',
  backgroundColor: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-btn)',
  padding: '12px 14px',
  width: '100%',
  outline: 'none',
}

const inputErrorStyle: React.CSSProperties = {
  ...inputStyle,
  border: '1px solid var(--color-rose)',
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CheckoutForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items, subtotal, clearCart } = useCartStore()
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const couponCode = searchParams.get('coupon') ?? ''
  const hasGiftWrap = searchParams.get('gift') === '1'
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [isFreeShippingCoupon, setIsFreeShippingCoupon] = useState(false)

  const sub = subtotal()
  const count = items.reduce((s, i) => s + i.qty, 0)

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
  const freeShipping = sub >= SHIPPING_THRESHOLD || isFreeShippingCoupon
  const shippingCost = freeShipping ? 0 : deliveryOption === 'express' ? EXPRESS_COST : STANDARD_COST
  const giftCost = hasGiftWrap ? GIFT_WRAP_COST : 0
  const total = sub + shippingCost + giftCost - couponDiscount

  // Re-validate coupon from URL param
  useEffect(() => {
    if (!couponCode) return
    fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode, subtotal: sub }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          if (data.discount_type === 'free_shipping') {
            setIsFreeShippingCoupon(true)
            setCouponDiscount(0)
          } else if (data.discount_type === 'percent') {
            setCouponDiscount(Math.round((sub * data.discount_value) / 100))
          } else {
            setCouponDiscount(data.discount_value ?? 0)
          }
        }
      })
      .catch(() => {})
  }, [couponCode, sub])

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
          coupon_code: couponCode || null,
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

      // Razorpay payment flow
      const { razorpay_order_id, order_number, amount } = result

      if (typeof window !== 'undefined' && (window as Window & typeof globalThis & { Razorpay?: unknown }).Razorpay) {
        // Razorpay script loaded
        initRazorpay({
          orderId: razorpay_order_id,
          amount,
          orderNumber: order_number,
          name: `${data.first_name} ${data.last_name}`,
          email: data.email,
          phone: data.phone,
          onSuccess: async (paymentId: string, signature: string) => {
            // Server-side HMAC verification before clearing cart
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
              // Even if verify call fails, redirect — webhook is the safety net
              if (!verifyRes.ok) {
                console.error('[checkout] Verify endpoint error — webhook will reconcile')
              }
            } catch {
              // Network error: webhook reconciles
            }
            clearCart()
            router.push(`/order/confirmation?order=${order_number}`)
          },
          onDismiss: () => {
            setSubmitting(false)
            setServerError('Payment was cancelled. Your order is saved — complete payment to confirm.')
          },
        })
      } else {
        // Fallback: COD / Razorpay script not loaded — still go to confirmation
        clearCart()
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

              {/* Contact */}
              <section aria-labelledby="contact-heading">
                <h2
                  id="contact-heading"
                  className="mb-4"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text)',
                  }}
                >
                  Contact
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="First Name" error={errors.first_name?.message}>
                    <input
                      {...register('first_name')}
                      type="text"
                      autoComplete="given-name"
                      style={errors.first_name ? inputErrorStyle : inputStyle}
                      aria-invalid={!!errors.first_name}
                    />
                  </Field>
                  <Field label="Last Name" error={errors.last_name?.message}>
                    <input
                      {...register('last_name')}
                      type="text"
                      autoComplete="family-name"
                      style={errors.last_name ? inputErrorStyle : inputStyle}
                      aria-invalid={!!errors.last_name}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Field label="Email" error={errors.email?.message}>
                    <input
                      {...register('email')}
                      type="email"
                      autoComplete="email"
                      style={errors.email ? inputErrorStyle : inputStyle}
                      aria-invalid={!!errors.email}
                    />
                  </Field>
                  <Field label="Mobile Number" error={errors.phone?.message}>
                    <input
                      {...register('phone')}
                      type="tel"
                      autoComplete="tel"
                      maxLength={10}
                      style={errors.phone ? inputErrorStyle : inputStyle}
                      aria-invalid={!!errors.phone}
                    />
                  </Field>
                </div>
              </section>

              {/* Shipping address */}
              <section aria-labelledby="address-heading">
                <h2
                  id="address-heading"
                  className="mb-4"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text)',
                  }}
                >
                  Shipping Address
                </h2>
                <div className="flex flex-col gap-4">
                  <Field label="Address Line 1" error={errors.address_line1?.message}>
                    <input
                      {...register('address_line1')}
                      type="text"
                      autoComplete="address-line1"
                      placeholder="House / Flat no., Street"
                      style={errors.address_line1 ? inputErrorStyle : inputStyle}
                      aria-invalid={!!errors.address_line1}
                    />
                  </Field>
                  <Field label="Address Line 2 (optional)" error={errors.address_line2?.message}>
                    <input
                      {...register('address_line2')}
                      type="text"
                      autoComplete="address-line2"
                      placeholder="Landmark, Area"
                      style={inputStyle}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="City" error={errors.city?.message}>
                      <input
                        {...register('city')}
                        type="text"
                        autoComplete="address-level2"
                        style={errors.city ? inputErrorStyle : inputStyle}
                        aria-invalid={!!errors.city}
                      />
                    </Field>
                    <Field label="Pincode" error={errors.pincode?.message}>
                      <input
                        {...register('pincode')}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        autoComplete="postal-code"
                        style={errors.pincode ? inputErrorStyle : inputStyle}
                        aria-invalid={!!errors.pincode}
                      />
                    </Field>
                  </div>
                  <Field label="State" error={errors.state?.message}>
                    <input
                      {...register('state')}
                      type="text"
                      autoComplete="address-level1"
                      style={errors.state ? inputErrorStyle : inputStyle}
                      aria-invalid={!!errors.state}
                    />
                  </Field>
                </div>
              </section>

              {/* Delivery options */}
              <section aria-labelledby="delivery-heading">
                <h2
                  id="delivery-heading"
                  className="mb-4"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text)',
                  }}
                >
                  Delivery
                </h2>
                <div className="flex flex-col gap-3">
                  {DELIVERY_OPTIONS.map((opt) => {
                    const selected = deliveryOption === opt.value
                    const cost = freeShipping ? 0 : opt.price
                    return (
                      <label
                        key={opt.value}
                        className="flex items-center justify-between gap-4 cursor-pointer px-4 py-3.5 transition-all duration-150"
                        style={{
                          border: `1.5px solid ${selected ? 'var(--color-green)' : 'var(--color-border)'}`,
                          borderRadius: 'var(--radius-card)',
                          backgroundColor: selected ? 'rgba(31,58,45,0.04)' : 'transparent',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {/* Radio dot */}
                          <span
                            className="flex items-center justify-center flex-shrink-0"
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              border: `1.5px solid ${selected ? 'var(--color-green)' : 'var(--color-border)'}`,
                              backgroundColor: selected ? 'var(--color-green)' : 'transparent',
                            }}
                          >
                            {selected && (
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  backgroundColor: 'var(--color-white)',
                                  display: 'block',
                                }}
                              />
                            )}
                          </span>
                          <input
                            {...register('delivery_option')}
                            type="radio"
                            value={opt.value}
                            className="sr-only"
                          />
                          <div>
                            <p
                              style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '14px',
                                fontWeight: '500',
                                color: 'var(--color-text)',
                              }}
                            >
                              {opt.label}
                            </p>
                            <p
                              style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '12px',
                                color: 'var(--color-text-muted)',
                              }}
                            >
                              {opt.sub}
                            </p>
                          </div>
                        </div>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '12px',
                            letterSpacing: '0.08em',
                            color: freeShipping ? 'var(--color-green)' : 'var(--color-text)',
                          }}
                        >
                          {freeShipping ? 'FREE' : formatPrice(cost)}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </section>

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
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '13px',
                      color: 'var(--color-rose)',
                    }}
                  >
                    {serverError}
                  </p>
                </div>
              )}
            </div>

            {/* ─── Right: Order summary ──────────────────────────── */}
            <div
              className="flex flex-col gap-5 lg:sticky lg:top-[120px]"
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-card)',
                padding: '24px',
                backgroundColor: 'var(--color-bg)',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text)',
                }}
              >
                Order Summary
              </h2>

              {/* Items */}
              <div className="flex flex-col gap-3 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex gap-3 items-start">
                    <div
                      className="relative flex-shrink-0 overflow-hidden"
                      style={{
                        width: 56,
                        height: 72,
                        borderRadius: 'var(--radius-card)',
                        backgroundColor: 'var(--color-border)',
                      }}
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover object-center"
                        sizes="56px"
                      />
                      {/* Qty badge */}
                      <span
                        className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 rounded-full text-[10px]"
                        style={{
                          backgroundColor: 'var(--color-text)',
                          color: 'var(--color-bg)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {item.qty}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="truncate"
                        style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text)' }}
                      >
                        {item.name}
                      </p>
                      <p
                        style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)' }}
                      >
                        {item.colour} · {item.size}
                      </p>
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text)', flexShrink: 0 }}>
                      {formatPrice(item.price * item.qty)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price breakdown */}
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between">
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>Subtotal</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text)' }}>{formatPrice(sub)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>Shipping</span>
                  {freeShipping
                    ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-green)', letterSpacing: '0.1em' }}>FREE</span>
                    : <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text)' }}>{formatPrice(shippingCost)}</span>
                  }
                </div>
                {hasGiftWrap && (
                  <div className="flex justify-between">
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>Gift wrap</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text)' }}>{formatPrice(GIFT_WRAP_COST)}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between">
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-green)' }}>Discount ({couponCode})</span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-green)' }}>−{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div
                  className="flex justify-between pt-3 border-t"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: '500', color: 'var(--color-text)' }}>Total</span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '18px', fontWeight: '600', color: 'var(--color-text)' }}>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-4 transition-opacity duration-200 hover:opacity-85 disabled:opacity-60"
                style={{
                  backgroundColor: 'var(--color-green)',
                  color: 'var(--color-white)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  borderRadius: 'var(--radius-btn)',
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
                aria-busy={submitting}
              >
                {submitting ? (
                  <>
                    <span
                      className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                      aria-hidden="true"
                    />
                    Processing…
                  </>
                ) : (
                  `Pay ${formatPrice(total)}`
                )}
              </button>

              <p
                className="text-center"
                style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-text-muted)' }}
              >
                Secured by Razorpay · 256-bit SSL
              </p>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}

// ─── Razorpay helper ──────────────────────────────────────────────────────────

function initRazorpay({
  orderId,
  amount,
  orderNumber,
  name,
  email,
  phone,
  onSuccess,
  onDismiss,
}: {
  orderId: string
  amount: number
  orderNumber: string
  name: string
  email: string
  phone: string
  onSuccess: (paymentId: string, signature: string) => void
  onDismiss: () => void
}) {
  const RazorpayConstructor = ((window as unknown) as Record<string, unknown>).Razorpay as (new (opts: unknown) => { open(): void }) | undefined
  if (!RazorpayConstructor) {
    onDismiss()
    return
  }

  const rz = new RazorpayConstructor({
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    amount,
    currency: 'INR',
    order_id: orderId,
    name: 'The Possah',
    description: `Order ${orderNumber}`,
    image: '/images/logo-dark.svg',
    prefill: { name, email, contact: `+91${phone}` },
    theme: { color: '#1F3A2D' },
    modal: {
      ondismiss: onDismiss,
      escape: true,
    },
    handler: (response: { razorpay_payment_id: string; razorpay_signature: string }) => {
      onSuccess(response.razorpay_payment_id, response.razorpay_signature)
    },
  })
  rz.open()
}
