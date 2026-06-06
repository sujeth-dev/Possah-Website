import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import type { CartItem } from '@/lib/store/cartStore'

interface CouponState {
  code: string
  discountType: string | null
  isFreeShipping: boolean
}

interface Props {
  items: CartItem[]
  sub: number
  shippingCost: number
  giftCost: number
  total: number
  freeShipping: boolean
  couponDiscount: number
  coupon: CouponState
  submitting: boolean
}

export function CheckoutOrderSummary({
  items,
  sub,
  shippingCost,
  giftCost,
  total,
  freeShipping,
  couponDiscount,
  coupon,
  submitting,
}: Props) {
  return (
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
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {item.colour} · {item.size}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-text)' }}>
                {formatPrice(item.price)}
              </p>
            </div>
          </div>
        ))}
      </div>

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
  )
}
