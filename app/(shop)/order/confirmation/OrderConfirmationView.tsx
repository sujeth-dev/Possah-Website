import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import type { ConfirmationOrder } from './page'

function Row({ label, value, colour }: { label: string; value: string; colour?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: colour ?? 'var(--color-text-muted)' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: colour ?? 'var(--color-text)' }}>
        {value}
      </span>
    </div>
  )
}

export function OrderConfirmationView({
  order,
  orderNumber,
  paymentId,
}: {
  order: ConfirmationOrder | null
  orderNumber: string | null
  paymentId: string | null
}) {
  if (!orderNumber) {
    return (
      <div className="container-site py-24 flex flex-col items-center gap-6 text-center">
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(22px, 4vw, 32px)',
            fontWeight: '400',
            color: 'var(--color-text)',
          }}
        >
          We couldn&rsquo;t find your order.
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Please check your email for a confirmation, or contact us on WhatsApp.
        </p>
        <Link
          href="/"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--color-green)',
            textDecoration: 'underline',
          }}
        >
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="container-site py-16 pb-24 max-w-[680px] mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col items-center gap-6 text-center">
        <div
          className="flex items-center justify-center w-16 h-16 rounded-full"
          style={{ backgroundColor: 'rgba(31, 58, 45, 0.08)', border: '1.5px solid var(--color-green)' }}
        >
          <svg width="24" height="18" viewBox="0 0 24 18" fill="none" stroke="var(--color-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 9l7 7L22 2" />
          </svg>
        </div>

        <div className="flex flex-col gap-3">
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 5vw, 48px)',
              fontWeight: '400',
              color: 'var(--color-text)',
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}
          >
            Your order is confirmed.
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              lineHeight: 1.7,
              color: 'var(--color-text-muted)',
            }}
          >
            Thank you for choosing The Possah. A confirmation email is on its way to you.
            We&rsquo;ll notify you once your piece is dispatched.
          </p>
        </div>

        {/* Order number */}
        <div
          className="w-full flex flex-col items-center gap-2 py-5 px-6"
          style={{
            backgroundColor: 'rgba(31, 58, 45, 0.04)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-card)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
            }}
          >
            Order Number
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '20px',
              letterSpacing: '0.08em',
              color: 'var(--color-green)',
            }}
          >
            {orderNumber}
          </span>
          {paymentId && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.1em',
                color: 'var(--color-text-muted)',
              }}
            >
              Payment: {paymentId}
            </span>
          )}
        </div>
      </div>

      {/* Order summary — only when we successfully fetched order data */}
      {order && (
        <div
          className="flex flex-col gap-0"
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-card)',
            overflow: 'hidden',
          }}
        >
          {/* Items */}
          {order.items.length > 0 && (
            <div>
              <div
                className="px-5 py-3"
                style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'rgba(31,58,45,0.03)' }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  Items ordered
                </span>
              </div>
              <ul className="flex flex-col">
                {order.items.map((item, idx) => (
                  <li
                    key={`${item.variant_id}-${idx}`}
                    className="flex gap-4 px-5 py-4"
                    style={{
                      borderBottom:
                        idx < order.items.length - 1 ? '1px solid var(--color-border)' : undefined,
                    }}
                  >
                    <div
                      className="relative flex-shrink-0 overflow-hidden"
                      style={{
                        width: 64,
                        height: 84,
                        borderRadius: 'var(--radius-card)',
                        backgroundColor: 'var(--color-border)',
                      }}
                    >
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover object-center"
                          sizes="64px"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <p
                          className="truncate"
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '14px',
                            color: 'var(--color-text)',
                          }}
                        >
                          {item.name}
                        </p>
                        <p
                          className="mt-0.5"
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '12px',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          {item.colour}{item.colour && item.size ? ' · ' : ''}{item.size}
                          {item.qty > 1 ? ` · Qty ${item.qty}` : ''}
                        </p>
                      </div>
                      <p
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '13px',
                          color: 'var(--color-text)',
                        }}
                      >
                        {formatPrice(item.price * item.qty)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Address */}
          {(order.address.line1 || order.customer_name) && (
            <div
              className="px-5 py-4"
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              <p
                className="mb-2"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                }}
              >
                Shipping to
              </p>
              <address
                className="not-italic"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  lineHeight: 1.7,
                  color: 'var(--color-text)',
                }}
              >
                {order.customer_name && <div>{order.customer_name}</div>}
                {order.address.line1 && <div>{order.address.line1}</div>}
                {order.address.line2 && <div>{order.address.line2}</div>}
                {(order.address.city || order.address.state || order.address.pincode) && (
                  <div>
                    {[order.address.city, order.address.state, order.address.pincode]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                )}
                {order.customer_phone && (
                  <div style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
                    {order.customer_phone}
                  </div>
                )}
              </address>
            </div>
          )}

          {/* Totals */}
          <div
            className="px-5 py-4 flex flex-col gap-2"
            style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'rgba(31,58,45,0.02)' }}
          >
            <Row label="Subtotal" value={formatPrice(order.subtotal)} />
            <Row
              label="Shipping"
              value={order.shipping_fee === 0 ? 'Free' : formatPrice(order.shipping_fee)}
            />
            {order.discount_amount > 0 && (
              <Row
                label={`Discount${order.coupon_code ? ` (${order.coupon_code})` : ''}`}
                value={`- ${formatPrice(order.discount_amount)}`}
                colour="var(--color-success)"
              />
            )}
            {order.tax > 0 && <Row label="Tax (GST)" value={formatPrice(order.tax)} />}
            {order.is_gift && <Row label="Gift wrap" value="Included" />}
            <div
              className="flex items-center justify-between pt-2 mt-1"
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text)',
                }}
              >
                Total paid
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  fontWeight: 500,
                  color: 'var(--color-text)',
                }}
              >
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Packaging note */}
      <blockquote
        className="px-6 py-4 text-left w-full"
        style={{
          borderLeft: '2px solid var(--color-gold)',
          backgroundColor: 'rgba(200, 151, 58, 0.05)',
          borderRadius: '0 var(--radius-card) var(--radius-card) 0',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '15px',
            lineHeight: 1.6,
            color: 'var(--color-text)',
            fontStyle: 'italic',
          }}
        >
          &ldquo;Each Possah piece is folded with intention, wrapped with care, and sent to you as it
          deserves — in quiet, considered packaging.&rdquo;
        </p>
      </blockquote>

      {/* Estimated delivery */}
      <div className="flex flex-col gap-1 items-center">
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}
        >
          Estimated Delivery
        </span>
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: 'var(--color-text)',
          }}
        >
          5–7 business days
        </span>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Link
          href="/shop/sarees"
          className="flex-1 flex items-center justify-center py-3.5 transition-opacity duration-200 hover:opacity-80"
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
          Continue Shopping
        </Link>
        <Link
          href={`/account/orders/${encodeURIComponent(orderNumber)}`}
          className="flex-1 flex items-center justify-center py-3.5 gap-1.5 transition-opacity duration-200 hover:opacity-70"
          style={{
            border: '1.5px solid var(--color-green)',
            color: 'var(--color-green)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            borderRadius: 'var(--radius-btn)',
          }}
        >
          View Your Order →
        </Link>
      </div>
    </div>
  )
}
