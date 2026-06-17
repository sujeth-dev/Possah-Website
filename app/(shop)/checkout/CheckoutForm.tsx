'use client'

import { useState, useEffect, useRef, useId, cloneElement, isValidElement } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cartStore'
import { useCouponStore } from '@/lib/store/couponStore'
import { trackBeginCheckout, trackPurchase } from '@/lib/analytics'
import { formatPrice } from '@/lib/utils'
import {
  INDIAN_STATES,
  SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_COST as STANDARD_COST,
  EXPRESS_SHIPPING_COST as EXPRESS_COST,
  GIFT_WRAP_COST,
} from '@/lib/constants'
import { useSession } from 'next-auth/react'
import { openRazorpayCheckout } from '@/lib/razorpay-client'

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const checkoutSchema = z.object({
  first_name: z.string().trim().min(1, 'First name required').min(2, 'First name too short').max(60)
    .regex(/[a-zA-Z]/, 'Enter a valid first name'),
  last_name: z.string().trim().min(1, 'Last name required').max(60)
    .regex(/[a-zA-Z]/, 'Enter a valid last name'),
  email: z.string().trim().email('Invalid email'),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number'),
  address_line1: z.string().trim().min(5, 'Address required').max(200),
  address_line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2, 'City required').max(80)
    .regex(/^[a-zA-Z\s\-.]+$/, 'Enter a valid city name'),
  state: z.enum(INDIAN_STATES, { errorMap: () => ({ message: 'Select your state' }) }),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter valid 6-digit pincode'),
  delivery_option: z.enum(['standard', 'express']),
  notes: z.string().trim().max(500).optional(),
})

type CheckoutFields = z.infer<typeof checkoutSchema>

// ─── Constants ───────────────────────────────────────────────────────────────
// Pricing constants now live in lib/constants.ts (shared with the server-side
// order calculation in app/api/orders/create) so the displayed total and the
// charged total can never drift.

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
  required,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: error ? 'var(--color-rose)' : 'var(--color-text-muted)',
        }}
      >
        {label}
        {required && (
          <span style={{ color: 'var(--color-rose)', marginLeft: 2 }} aria-hidden="true">
            *
          </span>
        )}
      </label>
      {isValidElement(children)
        ? cloneElement(children as React.ReactElement<{ id?: string }>, { id })
        : children}
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
  const { data: session } = useSession()
  const { items, subtotal, clearCart } = useCartStore()
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const paymentDone = useRef(false)

  // Zustand persist rehydrates synchronously from localStorage during client-side init,
  // but on the first SSR render count===0 which would fire the redirect before items load.
  // A simple mount flag is enough: by the time useEffect runs, the store has hydrated.
  const [storeHydrated, setStoreHydrated] = useState(false)
  useEffect(() => { setStoreHydrated(true) }, [])

  const hasGiftWrap = searchParams.get('gift') === '1'
  const coupon = useCouponStore()
  const [couponInput, setCouponInput]     = useState(coupon.code)
  const [couponApplying, setCouponApplying] = useState(false)
  const [couponError, setCouponError]     = useState<string | null>(null)

  const sub   = subtotal()
  const count = items.reduce((s, i) => s + i.qty, 0)

  // Derive discount from persisted coupon store
  let couponDiscount = 0
  if (coupon.code && coupon.discountType) {
    if (coupon.discountType === 'percent') {
      couponDiscount = Math.round((sub * coupon.discountValue) / 100)
    } else if (coupon.discountType === 'flat') {
      couponDiscount = coupon.discountValue
    }
  }

  // Fetch saved addresses on mount — also tracks login state
  useEffect(() => {
    fetch('/api/account/addresses')
      .then((r) => { if (r.ok) setIsLoggedIn(true); return r.ok ? r.json() : null })
      .then((d) => {
        if (!d?.addresses?.length) return
        setSavedAddresses(d.addresses)
        const def = d.addresses.find((a: { is_default: boolean }) => a.is_default) ?? d.addresses[0]
        setSelectedAddressId(def.id)
        const parts = def.full_name.trim().split(/\s+/)
        setValue('first_name', parts[0] ?? '', { shouldValidate: false })
        setValue('last_name', parts.slice(1).join(' ') || parts[0], { shouldValidate: false })
        setValue('phone', def.phone, { shouldValidate: false })
        setValue('address_line1', def.address_line1, { shouldValidate: false })
        setValue('address_line2', def.address_line2 ?? '', { shouldValidate: false })
        setValue('city', def.city, { shouldValidate: false })
        setValue('state', def.state as CheckoutFields['state'], { shouldValidate: false })
        setValue('pincode', def.pincode, { shouldValidate: false })
      })
      .catch(() => {})
  }, [])

  // localStorage draft — restore on mount
  const draftRestored = useRef(false)
  useEffect(() => {
    if (draftRestored.current) return
    draftRestored.current = true
    try {
      const raw = localStorage.getItem('possah-checkout-draft')
      if (!raw) return
      const saved = JSON.parse(raw) as Partial<CheckoutFields>
      reset({ delivery_option: 'standard', ...saved })
      setDraftBanner(true)
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<Array<{
    id: string; label: string | null; full_name: string; phone: string
    address_line1: string; address_line2: string | null; city: string
    state: string; pincode: string; delivery_notes: string | null; is_default: boolean
  }>>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [draftBanner, setDraftBanner] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CheckoutFields>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { delivery_option: 'standard' },
  })

  const deliveryOption = watch('delivery_option')

  // Pre-fill contact fields from session when no saved address / draft covers them
  useEffect(() => {
    if (!session?.user) return
    if (session.user.email && !getValues('email')) {
      setValue('email', session.user.email, { shouldValidate: false })
    }
    if (session.user.name && !getValues('first_name')) {
      const parts = session.user.name.trim().split(/\s+/)
      setValue('first_name', parts[0] ?? '', { shouldValidate: false })
      if (!getValues('last_name') && parts.length > 1) {
        setValue('last_name', parts.slice(1).join(' '), { shouldValidate: false })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  // localStorage draft — persist on change (must be after useForm)
  const formValues = watch()
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (draftTimer.current) clearTimeout(draftTimer.current)
    draftTimer.current = setTimeout(() => {
      try { localStorage.setItem('possah-checkout-draft', JSON.stringify(formValues)) } catch {}
    }, 500)
    return () => { if (draftTimer.current) clearTimeout(draftTimer.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(formValues)])

  const freeShipping = sub >= SHIPPING_THRESHOLD || coupon.isFreeShipping
  const shippingCost = freeShipping ? 0 : deliveryOption === 'express' ? EXPRESS_COST : STANDARD_COST
  const giftCost = hasGiftWrap ? GIFT_WRAP_COST : 0
  const total = sub + shippingCost + giftCost - couponDiscount

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

  // Redirect to cart if empty — skip after successful payment (paymentDone prevents race with clearCart).
  // storeHydrated guard prevents premature redirect before Zustand loads from localStorage.
  useEffect(() => {
    if (!storeHydrated) return
    if (paymentDone.current) return
    if (count === 0) router.replace('/cart')
  }, [count, router, storeHydrated])

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

      // Razorpay payment flow
      const { razorpay_order_id, order_number, amount } = result

      // Auto-save address on Pay button press — logged-in users only, fire-and-forget
      if (isLoggedIn) {
        const isDuplicate = savedAddresses.some(
          (a) => a.address_line1 === data.address_line1 && a.pincode === data.pincode
        )
        if (!isDuplicate) {
          fetch('/api/account/addresses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              label: '',
              full_name: `${data.first_name} ${data.last_name}`,
              phone: data.phone,
              address_line1: data.address_line1,
              address_line2: data.address_line2 ?? '',
              city: data.city,
              state: data.state,
              pincode: data.pincode,
              delivery_notes: '',
              is_default: savedAddresses.length === 0,
            }),
          }).catch(() => {})
        }
      }

      // openRazorpayCheckout loads the script if needed, then opens the modal.
      // Throws if the script fails — the catch block handles the U-2 case.
      try {
        await openRazorpayCheckout({
          orderId: razorpay_order_id,
          amount,
          orderNumber: order_number,
          name: `${data.first_name} ${data.last_name}`,
          email: data.email,
          phone: data.phone,
          // Stricter modal options for checkout (vs. the retry flow which uses defaults)
          modalOptions: {
            backdropclose: false,
            escape: false,
            handleback: true,
            confirm_close: true,
          },
          onPaymentFailed: (code, description) => {
            setServerError(
              code === 'BAD_REQUEST_ERROR'
                ? 'Payment failed due to a technical issue. Please try again.'
                : `Payment declined: ${description}. Try a different card or UPI.`
            )
            setSubmitting(false)
          },
          onSuccess: async (paymentId, signature) => {
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
            paymentDone.current = true
            clearCart()
            coupon.clearCoupon()
            try { localStorage.removeItem('possah-checkout-draft') } catch {}
            router.push(`/order/confirmation?order=${order_number}`)
          },
          onDismiss: () => {
            setSubmitting(false)
            setServerError('Payment was cancelled. Your order is saved — complete payment to confirm.')
          },
        })
      } catch {
        // U-2 fix: script failed to load or Razorpay constructor unavailable.
        // Do NOT fake success — surface a clear retryable error.
        setServerError(
          'Payment could not be started — the secure payment window failed to load. Please check your connection and try again.',
        )
        setSubmitting(false)
      }
    } catch {
      setServerError('Network error. Check your connection and try again.')
      setSubmitting(false)
    }
  }

  if (!storeHydrated || count === 0) return null

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

              {/* Draft restore banner */}
              {draftBanner && (
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', backgroundColor: 'rgba(31,58,45,0.04)' }}
                >
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    We saved your details — continue where you left off.
                  </p>
                  <button
                    type="button"
                    onClick={() => setDraftBanner(false)}
                    aria-label="Dismiss"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 18, lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Saved address picker */}
              {savedAddresses.length > 0 && (
                <section aria-labelledby="saved-address-heading">
                  <h2
                    id="saved-address-heading"
                    className="mb-3"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-text)' }}
                  >
                    Saved Addresses
                  </h2>
                  <div className="flex flex-col gap-2">
                    {savedAddresses.map((addr) => {
                      const selected = selectedAddressId === addr.id
                      return (
                        <label
                          key={addr.id}
                          className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-all duration-150"
                          style={{
                            border: `1.5px solid ${selected ? 'var(--color-green)' : 'var(--color-border)'}`,
                            borderRadius: 'var(--radius-card)',
                            backgroundColor: selected ? 'rgba(31,58,45,0.04)' : 'transparent',
                          }}
                        >
                          <span
                            className="flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{
                              width: 18, height: 18, borderRadius: '50%',
                              border: `1.5px solid ${selected ? 'var(--color-green)' : 'var(--color-border)'}`,
                              backgroundColor: selected ? 'var(--color-green)' : 'transparent',
                            }}
                          >
                            {selected && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--color-white)', display: 'block' }} />}
                          </span>
                          <input
                            type="radio"
                            name="saved_address"
                            value={addr.id}
                            checked={selected}
                            onChange={() => {
                              setSelectedAddressId(addr.id)
                              setValue('address_line1', addr.address_line1, { shouldValidate: false })
                              setValue('address_line2', addr.address_line2 ?? '', { shouldValidate: false })
                              setValue('city', addr.city, { shouldValidate: false })
                              setValue('state', addr.state as CheckoutFields['state'], { shouldValidate: false })
                              setValue('pincode', addr.pincode, { shouldValidate: false })
                              setValue('phone', addr.phone, { shouldValidate: false })
                              const parts = addr.full_name.trim().split(/\s+/)
                              setValue('first_name', parts[0] ?? '', { shouldValidate: false })
                              setValue('last_name', parts.slice(1).join(' ') || parts[0], { shouldValidate: false })
                            }}
                            className="sr-only"
                          />
                          <div>
                            {addr.label && (
                              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 2 }}>
                                {addr.label}
                              </p>
                            )}
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text)', fontWeight: 500 }}>{addr.full_name}</p>
                            <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                              {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}, {addr.city}, {addr.state} {addr.pincode}
                            </p>
                          </div>
                        </label>
                      )
                    })}
                    <label
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-150"
                      style={{
                        border: `1.5px solid ${selectedAddressId === null ? 'var(--color-green)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-card)',
                        backgroundColor: selectedAddressId === null ? 'rgba(31,58,45,0.04)' : 'transparent',
                      }}
                    >
                      <span
                        className="flex items-center justify-center flex-shrink-0"
                        style={{
                          width: 18, height: 18, borderRadius: '50%',
                          border: `1.5px solid ${selectedAddressId === null ? 'var(--color-green)' : 'var(--color-border)'}`,
                          backgroundColor: selectedAddressId === null ? 'var(--color-green)' : 'transparent',
                        }}
                      >
                        {selectedAddressId === null && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--color-white)', display: 'block' }} />}
                      </span>
                      <input
                        type="radio"
                        name="saved_address"
                        value=""
                        checked={selectedAddressId === null}
                        onChange={() => setSelectedAddressId(null)}
                        className="sr-only"
                      />
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                        Enter a new address
                      </span>
                    </label>
                  </div>
                </section>
              )}

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
                  <Field label="First Name" error={errors.first_name?.message} required>
                    <input
                      {...register('first_name')}
                      type="text"
                      autoComplete="given-name"
                      style={errors.first_name ? inputErrorStyle : inputStyle}
                      aria-invalid={!!errors.first_name}
                    />
                  </Field>
                  <Field label="Last Name" error={errors.last_name?.message} required>
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
                  <Field label="Email" error={errors.email?.message} required>
                    <input
                      {...register('email')}
                      type="email"
                      autoComplete="email"
                      style={errors.email ? inputErrorStyle : inputStyle}
                      aria-invalid={!!errors.email}
                    />
                  </Field>
                  <Field label="Mobile Number" error={errors.phone?.message} required>
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
                  <Field label="Address Line 1" error={errors.address_line1?.message} required>
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
                    <Field label="City" error={errors.city?.message} required>
                      <input
                        {...register('city')}
                        type="text"
                        autoComplete="address-level2"
                        style={errors.city ? inputErrorStyle : inputStyle}
                        aria-invalid={!!errors.city}
                      />
                    </Field>
                    <Field label="Pincode" error={errors.pincode?.message} required>
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
                  {/* FIX-FE-06: Indian states dropdown */}
                  <Field label="State" error={errors.state?.message} required>
                    <select
                      {...register('state')}
                      autoComplete="address-level1"
                      style={errors.state ? inputErrorStyle : inputStyle}
                      aria-invalid={!!errors.state}
                    >
                      <option value="">Select state / UT</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </section>

              {/* FIX-SEC-07: Coupon code — state-managed, not URL */}
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
                        style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: '500', color: 'var(--color-text)' }}
                      >
                        {item.colour} · {item.size}
                      </p>

                      <p
                        style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-text)' }}
                      >
                        {formatPrice(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="flex flex-col gap-2 py-4 border-t border-b" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex justify-between">
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)' }}>Subtotal</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--color-text)' }}>{formatPrice(sub)}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)' }}>Shipping</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: freeShipping ? 'var(--color-green)' : 'var(--color-text)' }}>
                    {freeShipping ? 'FREE' : formatPrice(shippingCost)}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between">
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-green)' }}>Discount ({coupon.code})</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--color-green)' }}>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                {giftCost > 0 && (
                  <div className="flex justify-between">
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)' }}>Gift wrapping</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--color-text)' }}>{formatPrice(giftCost)}</span>
                  </div>
                )}
              </div>

              {/* Grand total */}
              <div className="flex justify-between items-center">
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text)',
                  }}
                >
                  Total
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '22px',
                    fontWeight: '500',
                    color: 'var(--color-text)',
                  }}
                >
                  {formatPrice(total)}
                </span>
              </div>

              {/* Pay CTA */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: submitting ? 'var(--color-text-muted)' : 'var(--color-green)',
                  color: 'var(--color-bg)',
                  border: 'none',
                  borderRadius: 'var(--radius-btn)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
              >
                {submitting ? 'Processing...' : `Pay ${formatPrice(total)}`}
              </button>

              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '11px',
                  color: 'var(--color-text-muted)',
                  textAlign: 'center',
                  lineHeight: 1.6,
                }}
              >
                Secured by Razorpay. Your payment info is never stored.
              </p>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}
