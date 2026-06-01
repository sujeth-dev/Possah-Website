import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'

export const metadata: Metadata = {
  title: 'My Orders',
  robots: { index: false, follow: false },
}

type FulfillmentStatus = 'unfulfilled' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

type OrderRow = {
  id: string
  order_number: string
  created_at: string
  fulfillment_status: string | null
  payment_status: string | null
  total: number
  line_items: unknown
}

async function getOrders(email: string): Promise<OrderRow[]> {
  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, created_at, fulfillment_status, payment_status, total, line_items')
      .eq('customer_email', email)
      .order('created_at', { ascending: false })
      .limit(20)
    return (data ?? []) as OrderRow[]
  } catch {
    return []
  }
}

const STATUS_BADGE_MAP: Record<FulfillmentStatus, 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'pending'> = {
  unfulfilled: 'pending',
  processing:  'processing',
  shipped:     'shipped',
  delivered:   'delivered',
  cancelled:   'cancelled',
}

export default async function OrdersPage() {
  const isDev = process.env.NODE_ENV === 'development'
  const session = isDev
    ? { user: { email: 'dev@thepossah.com' } }
    : await getServerSession(authOptions)

  if (!session?.user?.email) {
    return (
      <div className="container-site py-24 text-center">
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--color-text-muted)' }}>
          Please <Link href="/auth/signin?callbackUrl=%2Faccount%2Forders" style={{ color: 'var(--color-green)', textDecoration: 'underline' }}>sign in</Link> to view your orders.
        </p>
      </div>
    )
  }

  const orders = await getOrders(session.user.email)

  return (
    <div className="container-site py-12 pb-24">
      <div className="flex items-baseline gap-3 mb-8">
        <Link
          href="/account"
          className="hover:opacity-60 transition-opacity duration-200"
          style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}
        >
          ← Account
        </Link>
      </div>

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
        My Orders
      </h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-start gap-4 py-12">
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
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const itemsArr = Array.isArray(order.line_items) ? order.line_items as { name: string; qty: number }[] : []
            const itemPreview = itemsArr.slice(0, 2).map((i) => i.name).join(', ')
            const overflow = itemsArr.length > 2 ? ` +${itemsArr.length - 2} more` : ''
            const statusKey = (order.fulfillment_status ?? 'unfulfilled') as FulfillmentStatus
            const badgeVariant = STATUS_BADGE_MAP[statusKey] ?? 'pending'
            const createdAt = new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            })

            return (
              <div
                key={order.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5"
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-card)',
                }}
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3 flex-wrap">
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
                    <Badge variant={badgeVariant} />
                  </div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    {itemPreview}{overflow}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {createdAt}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '15px',
                      fontWeight: '500',
                      color: 'var(--color-text)',
                    }}
                  >
                    {formatPrice(order.total)}
                  </span>
                  <Link
                    href={`/order/confirmation?order=${order.order_number}`}
                    className="transition-opacity duration-200 hover:opacity-60"
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
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
