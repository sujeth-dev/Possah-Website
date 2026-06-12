import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { OrderProgressBar } from '@/components/account/OrderProgressBar'
import { OrderCardActions } from '@/components/account/OrderCardActions'
import { IncompleteOrderCard } from '@/components/account/IncompleteOrderCard'

export const metadata: Metadata = {
  title: 'My Orders',
  robots: { index: false, follow: false },
}

type OrderRow = {
  id: string
  order_number: string
  created_at: string
  customer_email: string
  customer_name: string
  customer_phone: string
  fulfillment_status: string
  payment_status: string
  total: number
  line_items: unknown
  customer_hidden_at: string | null
}

async function getOrders(email: string): Promise<OrderRow[]> {
  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('orders')
      .select(
        'id, order_number, created_at, customer_email, customer_name, customer_phone, fulfillment_status, payment_status, total, line_items, customer_hidden_at',
      )
      .eq('customer_email', email)
      .is('customer_hidden_at', null)
      .order('created_at', { ascending: false })
      .limit(40)
    return (data ?? []) as OrderRow[]
  } catch {
    return []
  }
}

function itemsPreview(raw: unknown): string {
  if (!Array.isArray(raw)) return ''
  const names = raw
    .filter((it): it is Record<string, unknown> => typeof it === 'object' && it !== null)
    .map((it) => String(it.name ?? ''))
    .filter(Boolean)
  if (names.length === 0) return ''
  const first = names.slice(0, 2).join(', ')
  const overflow = names.length > 2 ? ` +${names.length - 2} more` : ''
  return `${first}${overflow}`
}

function isHideable(order: OrderRow): boolean {
  return (
    ['pending', 'failed', 'refunded'].includes(order.payment_status) ||
    order.fulfillment_status === 'cancelled'
  )
}

function isIncomplete(order: OrderRow): boolean {
  return (
    (order.payment_status === 'pending' || order.payment_status === 'failed') &&
    order.fulfillment_status !== 'cancelled'
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default async function OrdersPage() {
  const isDev = process.env.NODE_ENV === 'development'
  const session = isDev
    ? { user: { email: process.env.ADMIN_EMAIL ?? 'dev@thepossah.com' } }
    : await getServerSession(authOptions)

  if (!session?.user?.email) {
    return (
      <div className="container-site py-24 text-center">
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-muted)' }}>
          Please{' '}
          <Link
            href="/auth/signin?callbackUrl=%2Faccount%2Forders"
            style={{ color: 'var(--color-green)', textDecoration: 'underline' }}
          >
            sign in
          </Link>{' '}
          to view your orders.
        </p>
      </div>
    )
  }

  const allOrders = await getOrders(session.user.email)
  const incomplete = allOrders.filter(isIncomplete)
  const visible = allOrders.filter((o) => !isIncomplete(o))

  return (
    <div className="container-site py-10 pb-20">
      <div className="flex items-baseline gap-3 mb-6">
        <Link
          href="/account"
          className="hover:opacity-60 transition-opacity duration-200"
          style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}
        >
          ← Account
        </Link>
      </div>

      <h1
        className="mb-8"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 400,
          color: 'var(--color-text)',
          letterSpacing: '-0.01em',
        }}
      >
        My Orders
      </h1>

      {/* ── Empty state ───────────────────────────────────────────── */}
      {allOrders.length === 0 && (
        <div className="flex flex-col items-start gap-4 py-8">
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-muted)' }}>
            No orders yet.
          </p>
          <Link
            href="/shop/sarees"
            className="inline-flex items-center justify-center px-8 py-3 transition-opacity duration-200 hover:opacity-80"
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
            Start Shopping
          </Link>
        </div>
      )}

      {/* ── Paid + in-progress + delivered + cancelled ────────────── */}
      {visible.length > 0 && (
        <section aria-labelledby="confirmed-heading" className="mb-12">
          <h2
            id="confirmed-heading"
            className="sr-only"
          >
            Your orders
          </h2>
          <ul className="flex flex-col gap-4">
            {visible.map((order) => {
              const preview = itemsPreview(order.line_items)
              const hideable = isHideable(order)
              return (
                <li
                  key={order.id}
                  className="flex flex-col gap-3 p-5"
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-card)',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex flex-col gap-1">
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '13px',
                          letterSpacing: '0.08em',
                          color: 'var(--color-text)',
                        }}
                      >
                        {order.order_number}
                      </span>
                      {preview && (
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                          {preview}
                        </p>
                      )}
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    {hideable && (
                      <OrderCardActions orderNumber={order.order_number} isHideable={hideable} />
                    )}
                  </div>

                  <OrderProgressBar
                    paymentStatus={order.payment_status}
                    fulfillmentStatus={order.fulfillment_status}
                    size="mini"
                  />

                  <div className="flex items-center justify-between gap-3 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}>
                      {formatPrice(order.total)}
                    </span>
                    <Link
                      href={`/account/orders/${encodeURIComponent(order.order_number)}`}
                      className="hover:opacity-60 transition-opacity duration-200"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'var(--color-green)',
                        textDecoration: 'underline',
                      }}
                    >
                      Details
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* ── Payment incomplete (retry / cancel) ───────────────────── */}
      {incomplete.length > 0 && (
        <section aria-labelledby="incomplete-heading" className="mb-10">
          <h2
            id="incomplete-heading"
            className="mb-3"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--color-orange)',
            }}
          >
            Payment incomplete
          </h2>
          <p
            className="mb-4"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              lineHeight: 1.6,
            }}
          >
            Retry to finish the payment, or cancel to clear it. Only one open pending order is kept at a time — placing a fresh order will update this one.
          </p>
          <ul className="flex flex-col gap-3">
            {incomplete.map((order) => (
              <li key={order.id}>
                <IncompleteOrderCard
                  orderNumber={order.order_number}
                  createdAt={formatDate(order.created_at)}
                  itemsPreview={itemsPreview(order.line_items)}
                  total={order.total}
                  paymentStatus={order.payment_status}
                  customerName={order.customer_name}
                  customerEmail={order.customer_email}
                  customerPhone={order.customer_phone}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
