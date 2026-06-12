import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import { OrderProgressBar } from '@/components/account/OrderProgressBar'
import { OrderCardActions } from '@/components/account/OrderCardActions'

export const metadata: Metadata = {
  title: 'Order Detail',
  robots: { index: false, follow: false },
}

type LineItem = {
  product_id: string
  variant_id: string
  name: string
  image: string
  colour: string
  size: string
  qty: number
  price: number
}

type ShippingAddress = {
  line1?: string
  line2?: string | null
  city?: string
  state?: string
  pincode?: string
}

type OrderRow = {
  id: string
  order_number: string
  created_at: string
  customer_email: string
  customer_name: string
  customer_phone: string
  payment_status: string
  fulfillment_status: string
  subtotal: number
  shipping_fee: number
  discount_amount: number
  tax: number
  total: number
  coupon_code: string | null
  is_gift: boolean
  gift_message: string | null
  tracking_number: string | null
  courier: string | null
  line_items: unknown
  shipping_address: unknown
  internal_notes: string | null
  customer_hidden_at: string | null
}

function coerceLineItems(raw: unknown): LineItem[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((it): it is Record<string, unknown> => typeof it === 'object' && it !== null)
    .map((it) => ({
      product_id: String(it.product_id ?? ''),
      variant_id: String(it.variant_id ?? ''),
      name: String(it.name ?? ''),
      image: String(it.image ?? ''),
      colour: String(it.colour ?? ''),
      size: String(it.size ?? ''),
      qty: Number(it.qty ?? 0),
      price: Number(it.price ?? 0),
    }))
    .filter((it) => it.name)
}

function coerceAddress(raw: unknown): ShippingAddress {
  if (typeof raw !== 'object' || raw === null) return {}
  const o = raw as Record<string, unknown>
  return {
    line1: o.line1 != null ? String(o.line1) : undefined,
    line2: o.line2 != null ? String(o.line2) : null,
    city: o.city != null ? String(o.city) : undefined,
    state: o.state != null ? String(o.state) : undefined,
    pincode: o.pincode != null ? String(o.pincode) : undefined,
  }
}

async function loadOrder(orderNumber: string, email: string): Promise<OrderRow | null> {
  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('orders')
      .select(
        'id, order_number, created_at, customer_email, customer_name, customer_phone, payment_status, fulfillment_status, subtotal, shipping_fee, discount_amount, tax, total, coupon_code, is_gift, gift_message, tracking_number, courier, line_items, shipping_address, internal_notes, customer_hidden_at',
      )
      .eq('order_number', orderNumber)
      .maybeSingle<OrderRow>()
    if (!data) return null
    if (data.customer_email.toLowerCase() !== email.toLowerCase()) return null
    return data
  } catch {
    return null
  }
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function courierTrackingUrl(courier: string | null, tracking: string | null): string | null {
  if (!tracking) return null
  const c = (courier ?? '').toLowerCase()
  if (c.includes('bluedart'))  return `https://www.bluedart.com/tracking?awb=${encodeURIComponent(tracking)}`
  if (c.includes('delhivery')) return `https://www.delhivery.com/track-v2/package/${encodeURIComponent(tracking)}`
  if (c.includes('dtdc'))      return `https://www.dtdc.in/tracking/tracking.asp?strCnno=${encodeURIComponent(tracking)}`
  if (c.includes('shiprocket'))return `https://shiprocket.co/tracking/${encodeURIComponent(tracking)}`
  if (c.includes('xpressbees'))return `https://www.xpressbees.com/track?awb=${encodeURIComponent(tracking)}`
  if (c.includes('india post') || c.includes('indiapost'))
    return `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?ID=${encodeURIComponent(tracking)}`
  return null
}

export default async function OrderDetailPage({
  params,
}: {
  params: { orderNumber: string }
}) {
  const isDev = process.env.NODE_ENV === 'development'
  const session = isDev
    ? { user: { email: 'dev@thepossah.com' } }
    : await getServerSession(authOptions)

  if (!session?.user?.email) {
    return (
      <div className="container-site py-24 text-center">
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-muted)' }}>
          Please{' '}
          <Link
            href={`/auth/signin?callbackUrl=%2Faccount%2Forders%2F${params.orderNumber}`}
            style={{ color: 'var(--color-green)', textDecoration: 'underline' }}
          >
            sign in
          </Link>{' '}
          to view this order.
        </p>
      </div>
    )
  }

  const order = await loadOrder(params.orderNumber, session.user.email)
  if (!order) notFound()

  const items = coerceLineItems(order.line_items)
  const address = coerceAddress(order.shipping_address)
  const trackingUrl = courierTrackingUrl(order.courier, order.tracking_number)
  const isHideable =
    ['pending', 'failed', 'refunded'].includes(order.payment_status) ||
    order.fulfillment_status === 'cancelled'

  return (
    <div className="container-site py-10 pb-24">
      {/* Breadcrumb back */}
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 mb-6 hover:opacity-60 transition-opacity duration-200"
        style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}
      >
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M1 5h12M1 5L5 1M1 5l4 4" />
        </svg>
        All orders
      </Link>

      {/* Heading + meta */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
        <div>
          <p
            className="section-label mb-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            ORDER
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 400,
              color: 'var(--color-text)',
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}
          >
            #{order.order_number}
          </h1>
          <p
            className="mt-2"
            style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}
          >
            Placed {formatDateTime(order.created_at)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <section
        aria-label="Order progress"
        className="mb-10 px-2 py-6"
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
        }}
      >
        <OrderProgressBar
          paymentStatus={order.payment_status}
          fulfillmentStatus={order.fulfillment_status}
          size="full"
        />
      </section>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8 lg:gap-12 items-start">

        {/* ── Left column: items, address, tracking ─────────────────── */}
        <div className="flex flex-col gap-8">

          {/* Tracking */}
          {order.tracking_number ? (
            <section
              aria-labelledby="tracking-heading"
              className="px-5 py-4"
              style={{
                backgroundColor: 'rgba(31,58,45,0.04)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-card)',
              }}
            >
              <h2
                id="tracking-heading"
                className="mb-2"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                }}
              >
                Tracking
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text)' }}>
                    {order.courier ?? 'Courier'} ·{' '}
                    <span style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
                      {order.tracking_number}
                    </span>
                  </p>
                </div>
                {trackingUrl && (
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-60 transition-opacity duration-200"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: 'var(--color-green)',
                      textDecoration: 'underline',
                    }}
                  >
                    Track →
                  </a>
                )}
              </div>
            </section>
          ) : null}

          {/* Items */}
          <section aria-labelledby="items-heading">
            <h2
              id="items-heading"
              className="mb-4"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--color-text)',
              }}
            >
              Items
            </h2>
            <ul className="flex flex-col">
              {items.map((item, idx) => (
                <li
                  key={`${item.variant_id}-${idx}`}
                  className="flex gap-4 py-4"
                  style={{ borderBottom: '1px solid var(--color-border)' }}
                >
                  <div
                    className="relative flex-shrink-0 overflow-hidden"
                    style={{
                      width: 72,
                      height: 96,
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
                        sizes="72px"
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
                        {item.colour}{item.colour && item.size ? ' · ' : ''}{item.size} · Qty {item.qty}
                      </p>
                    </div>
                    <p
                      className="mt-2"
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
          </section>

          {/* Shipping address */}
          <section aria-labelledby="address-heading">
            <h2
              id="address-heading"
              className="mb-3"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--color-text)',
              }}
            >
              Shipping to
            </h2>
            <address
              className="not-italic"
              style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: 1.6, color: 'var(--color-text)' }}
            >
              <div>{order.customer_name}</div>
              {address.line1 && <div>{address.line1}</div>}
              {address.line2 && <div>{address.line2}</div>}
              {(address.city || address.state || address.pincode) && (
                <div>
                  {[address.city, address.state, address.pincode].filter(Boolean).join(', ')}
                </div>
              )}
              <div style={{ color: 'var(--color-text-muted)', marginTop: 6 }}>
                {order.customer_phone}
              </div>
            </address>
          </section>

          {/* Help + hide */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href={`/contact?order=${encodeURIComponent(order.order_number)}`}
              className="hover:opacity-60 transition-opacity duration-200"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'var(--color-green)',
                textDecoration: 'underline',
              }}
            >
              Need help with this order?
            </Link>
            {isHideable && (
              <div className="ml-auto">
                <OrderCardActions orderNumber={order.order_number} isHideable={isHideable} />
              </div>
            )}
          </div>
        </div>

        {/* ── Right column: payment summary ─────────────────────────── */}
        <aside
          aria-label="Payment summary"
          className="flex flex-col gap-3 lg:sticky lg:top-[120px]"
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-card)',
            padding: 24,
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
            Payment summary
          </h2>

          <div className="flex flex-col gap-2 py-3 border-t border-b" style={{ borderColor: 'var(--color-border)' }}>
            <Row label="Subtotal" value={formatPrice(order.subtotal)} />
            <Row label="Shipping" value={order.shipping_fee === 0 ? 'Free' : formatPrice(order.shipping_fee)} />
            {order.discount_amount > 0 && (
              <Row
                label={`Discount${order.coupon_code ? ` (${order.coupon_code})` : ''}`}
                value={`- ${formatPrice(order.discount_amount)}`}
                colour="var(--color-success)"
              />
            )}
            {order.tax > 0 && <Row label="Tax (GST)" value={formatPrice(order.tax)} />}
            {order.is_gift && <Row label="Gift wrap" value="Included" />}
          </div>

          <div className="flex items-center justify-between">
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--color-text)',
              }}
            >
              Total
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

          <p
            className="mt-1"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color:
                order.payment_status === 'paid'
                  ? 'var(--color-success)'
                  : order.payment_status === 'failed'
                  ? 'var(--color-orange)'
                  : 'var(--color-text-muted)',
            }}
          >
            Payment: {order.payment_status}
          </p>
        </aside>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  colour,
}: {
  label: string
  value: string
  colour?: string
}) {
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
