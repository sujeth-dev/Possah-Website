'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/lib/store/cartStore'
import { useCouponStore } from '@/lib/store/couponStore'
import { formatPrice, calculateDiscount } from '@/lib/utils'

const SHIPPING_THRESHOLD = 2500
const SHIPPING_COST = 199

export function CartView() {
  const { items, removeItem, updateQty, clearCart, subtotal, itemCount } = useCartStore()
  const coupon = useCouponStore()
  const [couponInput, setCouponInput] = useState(coupon.code)
  const [couponError, setCouponError]   = useState<string | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [giftWrap, setGiftWrap] = useState(false)
  const GIFT_WRAP_COST = 150

  const sub = subtotal()
  const count = itemCount()
  const freeShipping = sub >= SHIPPING_THRESHOLD || coupon.isFreeShipping
  const shipping = freeShipping ? 0 : SHIPPING_COST

  // Derive discount from store
  let couponDiscount = 0
  if (coupon.code && coupon.discountType) {
    if (coupon.discountType === 'percent') {
      couponDiscount = Math.round((sub * coupon.discountValue) / 100)
    } else if (coupon.discountType === 'flat') {
      couponDiscount = coupon.discountValue
    }
  }

  const total = sub + shipping + (giftWrap ? GIFT_WRAP_COST : 0) - couponDiscount

  const validateCoupon = useCallback(async () => {
    if (!couponInput.trim()) return
    setCouponLoading(true)
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
      }
    } catch {
      setCouponError('Could not validate code. Try again.')
    } finally {
      setCouponLoading(false)
    }
  }, [couponInput, sub, coupon])

  const removeCoupon = () => {
    setCouponInput('')
    setCouponError(null)
    coupon.clearCoupon()
  }

  // Empty cart
  if (count === 0) {
    return (
      <div className="container-site py-24 flex flex-col items-center gap-6 text-center">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="var(--color-border)" strokeWidth="1.5">
          <path d="M12 8h40l8 16H4L12 8z" />
          <rect x="4" y="24" width="56" height="34" rx="2" />
          <path d="M26 40h12M32 34v12" />
        </svg>
        <div>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(22px, 4vw, 32px)',
              fontWeight: '400',
              color: 'var(--color-text)',
              marginBottom: 8,
            }}
          >
            Your bag is empty.
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Let&apos;s fix that.
          </p>
        </div>
        <Link
          href="/shop/sarees"
          className="inline-flex items-center justify-center px-10 py-3.5 transition-opacity duration-200 hover:opacity-80"
          style={{
            backgroundColor: 'var(--color-green)',
            color: 'var(--color-white)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            borderRadius: 'var(--radius-btn)',
          }}
        >
          Explore The Edit
        </Link>
      </div>
    )
  }

  return (
    <div className="container-site py-10 pb-20">
      {/* Page heading */}
      <div className="flex items-baseline justify-between mb-8">
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: '400',
            color: 'var(--color-text)',
            letterSpacing: '-0.01em',
          }}
        >
          Your Bag
        </h1>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.14em',
            color: 'var(--color-text-muted)',
          }}
        >
          {count} {count === 1 ? 'piece' : 'pieces'}
        </span>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-10 xl:gap-16 items-start">
        {/* Cart line items */}
        <div className="flex flex-col gap-0">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId}`}
              className="flex gap-4 py-6 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {/* Product image */}
              <Link href={`/shop/${item.slug}`} className="flex-shrink-0 block" tabIndex={-1} aria-hidden="true">
                <div
                  className="relative overflow-hidden"
                  style={{
                    width: 96,
                    height: 128,
                    borderRadius: 'var(--radius-card)',
                    backgroundColor: 'var(--color-border)',
                  }}
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover object-center"
                    sizes="96px"
                  />
                </div>
              </Link>

              {/* Info + controls */}
              <div className="flex-1 flex flex-col gap-2 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/shop/${item.slug}`}
                    className="hover:opacity-70 transition-opacity duration-150"
                  >
                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: 'var(--color-text)',
                        lineHeight: 1.3,
                      }}
                    >
                      {item.name}
                    </p>
                  </Link>
                  <button
                    onClick={() => removeItem(item.productId, item.variantId)}
                    className="flex-shrink-0 hover:opacity-60 transition-opacity duration-150"
                    aria-label={`Remove ${item.name}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M1 1l10 10M11 1L1 11" />
                    </svg>
                  </button>
                </div>

                {/* Variant details */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className="flex items-center gap-1.5"
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '12px',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <span
                      className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.colourHex, border: '1px solid var(--color-border)' }}
                      aria-hidden="true"
                    />
                    {item.colour}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '12px',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {item.size}
                  </span>
                </div>

                {/* Qty + price row */}
                <div className="flex items-center justify-between mt-auto pt-1">
                  {/* Qty stepper */}
                  <div
                    className="flex items-center"
                    style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-btn)' }}
                    role="group"
                    aria-label="Quantity"
                  >
                    <button
                      onClick={() => {
                        if (item.qty <= 1) removeItem(item.productId, item.variantId)
                        else updateQty(item.productId, item.variantId, item.qty - 1)
                      }}
                      className="flex items-center justify-center w-8 h-8 hover:opacity-60 transition-opacity duration-150"
                      aria-label="Decrease quantity"
                    >
                      <svg width="10" height="2" viewBox="0 0 10 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M1 1h8" />
                      </svg>
                    </button>
                    <span
                      className="w-8 text-center"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '12px',
                        color: 'var(--color-text)',
                      }}
                      aria-live="polite"
                    >
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.productId, item.variantId, item.qty + 1)}
                      className="flex items-center justify-center w-8 h-8 hover:opacity-60 transition-opacity duration-150"
                      aria-label="Increase quantity"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M5 1v8M1 5h8" />
                      </svg>
                    </button>
                  </div>

                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: 'var(--color-text)',
                    }}
                  >
                    {formatPrice(item.price * item.qty)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* The Possah Promise strip */}
          <div
            className="mt-6 grid grid-cols-3 gap-4 py-5 px-4"
            style={{
              backgroundColor: 'rgba(31, 58, 45, 0.04)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-border)',
            }}
          >
            {[
              { icon: '✦', label: 'Ethically Made', sub: 'By artisans in Bengaluru' },
              { icon: '✦', label: 'Easy Returns', sub: '7-day return window' },
              { icon: '✦', label: 'Secure Checkout', sub: 'Razorpay encrypted' },
            ].map(({ icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center text-center gap-1">
                <span style={{ color: 'var(--color-gold)', fontSize: '14px' }}>{icon}</span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text)',
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '11px',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {sub}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Order summary sidebar */}
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

          {/* Promo code */}
          <div className="flex flex-col gap-2">
            {coupon.code ? (
              <div
                className="flex items-center justify-between py-2 px-3"
                style={{
                  backgroundColor: 'rgba(31, 58, 45, 0.06)',
                  border: '1px solid var(--color-green)',
                  borderRadius: 'var(--radius-btn)',
                }}
              >
                <div className="flex items-center gap-2">
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="var(--color-green)" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M1 5l3.5 4L11 1" />
                  </svg>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      letterSpacing: '0.1em',
                      color: 'var(--color-green)',
                    }}
                  >
                    {coupon.code} applied
                  </span>
                </div>
                <button
                  onClick={removeCoupon}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-text-muted)' }}
                  className="hover:opacity-60 transition-opacity duration-150"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value)
                    if (couponError) setCouponError(null)
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') validateCoupon() }}
                  placeholder="PROMO CODE"
                  maxLength={20}
                  className="flex-1 px-3 py-2.5"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    border: `1px solid ${couponError ? 'var(--color-rose)' : 'var(--color-border)'}`,
                    borderRadius: 'var(--radius-btn)',
                    backgroundColor: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    outline: 'none',
                  }}
                  aria-label="Promo code"
                />
                <button
                  onClick={validateCoupon}
                  disabled={!couponInput.trim() || couponLoading}
                  className="px-4 py-2.5 transition-opacity duration-150 hover:opacity-80 disabled:opacity-40"
                  style={{
                    backgroundColor: 'var(--color-green)',
                    color: 'var(--color-white)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    borderRadius: 'var(--radius-btn)',
                    border: 'none',
                    flexShrink: 0,
                  }}
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
            )}
            {couponError && (
              <p
                role="alert"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  color: 'var(--color-rose)',
                }}
              >
                {couponError}
              </p>
            )}
          </div>

          {/* Gift wrap toggle */}
          <label
            className="flex items-center justify-between cursor-pointer py-3 border-t border-b"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="flex flex-col gap-0.5">
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  color: 'var(--color-text)',
                }}
              >
                Gift wrapping
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  color: 'var(--color-text-muted)',
                }}
              >
                Ivory tissue + satin ribbon — {formatPrice(GIFT_WRAP_COST)}
              </span>
            </div>
            {/* Toggle switch */}
            <button
              role="switch"
              aria-checked={giftWrap}
              onClick={() => setGiftWrap((g) => !g)}
              className="flex-shrink-0 transition-all duration-200"
              style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                backgroundColor: giftWrap ? 'var(--color-green)' : 'var(--color-border)',
                border: 'none',
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              <span
                className="absolute top-0.5 transition-all duration-200"
                style={{
                  left: giftWrap ? 20 : 2,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </label>

          {/* Price breakdown */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span
                style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}
              >
                Subtotal
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text)' }}>
                {formatPrice(sub)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span
                style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}
              >
                Shipping
              </span>
              {freeShipping ? (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-green)', letterSpacing: '0.1em' }}>
                  FREE
                </span>
              ) : (
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text)' }}>
                  {formatPrice(SHIPPING_COST)}
                </span>
              )}
            </div>

            {!freeShipping && (
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '11px',
                  color: 'var(--color-text-muted)',
                }}
              >
                Add {formatPrice(SHIPPING_THRESHOLD - sub)} more for free shipping
              </p>
            )}

            {giftWrap && (
              <div className="flex items-center justify-between">
                <span
                  style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}
                >
                  Gift wrap
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text)' }}>
                  {formatPrice(GIFT_WRAP_COST)}
                </span>
              </div>
            )}

            {coupon.code && couponDiscount > 0 && (
              <div className="flex items-center justify-between">
                <span
                  style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-green)' }}
                >
                  Discount
                </span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-green)' }}>
                  −{formatPrice(couponDiscount)}
                </span>
              </div>
            )}
            {coupon.isFreeShipping && (
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-green)' }}>
                  Free shipping applied
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-green)', letterSpacing: '0.1em' }}>
                  FREE
                </span>
              </div>
            )}

            {/* Total */}
            <div
              className="flex items-center justify-between pt-3 border-t"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: 'var(--color-text)',
                }}
              >
                Total
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: 'var(--color-text)',
                }}
              >
                {formatPrice(total)}
              </span>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                textAlign: 'right',
              }}
            >
              Taxes included, where applicable
            </p>
          </div>

          {/* Checkout CTA */}
          <Link
            href={{
              pathname: '/checkout',
              query: {
                ...(giftWrap ? { gift: '1' } : {}),
              },
            }}
            className="w-full flex items-center justify-center py-4 transition-opacity duration-200 hover:opacity-85"
            style={{
              backgroundColor: 'var(--color-green)',
              color: 'var(--color-white)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              borderRadius: 'var(--radius-btn)',
            }}
          >
            Proceed to Checkout
          </Link>

          <Link
            href="/shop/sarees"
            className="text-center hover:opacity-60 transition-opacity duration-200"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              color: 'var(--color-text-muted)',
              textDecoration: 'underline',
              textDecorationColor: 'var(--color-border)',
            }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
