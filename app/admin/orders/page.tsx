import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { FulfillmentBadge, PaymentBadge } from '@/components/admin/FulfillmentBadge'
import { formatPrice } from '@/lib/utils'

export const metadata: Metadata = { title: 'Orders' }
export const dynamic = 'force-dynamic'

type FulfillmentStatus = 'unfulfilled' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
type PaymentStatus     = 'pending' | 'paid' | 'failed' | 'refunded'

interface OrderRow {
  id:                 string
  order_number:       string
  customer_name:      string
  customer_email:     string
  customer_phone:     string
  total:              number
  payment_status:     PaymentStatus
  fulfillment_status: FulfillmentStatus
  coupon_code:        string | null
  is_gift:            boolean
  created_at:         string
  payment_attempts:   number | null
}

interface PageProps {
  searchParams: {
    status?:  string
    payment?: string
    q?:       string
    from?:    string
    to?:      string
    page?:    string
  }
}

const TABS: { label: string; value: string }[] = [
  { label: 'All',         value: '' },
  // 'Attempted' = customer started checkout but never paid in the last 14 days.
  // Shows pending/failed payment, not yet cancelled. Lives separate from the
  // real fulfilment statuses so it never gets confused with shippable work.
  { label: 'Attempted',   value: 'attempted' },
  { label: 'Unfulfilled', value: 'unfulfilled' },
  { label: 'Processing',  value: 'processing' },
  { label: 'Shipped',     value: 'shipped' },
  { label: 'Delivered',   value: 'delivered' },
  { label: 'Cancelled',   value: 'cancelled' },
]

async function getOrders(params: PageProps['searchParams']): Promise<{
  orders:     OrderRow[]
  total:      number
  page:       number
  page_count: number
}> {
  try {
    const supabase    = createAdminClient()
    const page        = Math.max(1, parseInt(params.page ?? '1', 10))
    const perPage     = 25
    const offset      = (page - 1) * perPage

    let query = supabase
      .from('orders')
      .select(
        'id, order_number, customer_name, customer_email, customer_phone, total, payment_status, fulfillment_status, coupon_code, is_gift, created_at, payment_attempts',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })

    // 'Attempted' is a derived status: pending/failed payment within the last
    // 14 days that hasn't been explicitly cancelled. Handled before the regular
    // fulfilment-status filter so the two paths can't collide.
    if (params.status === 'attempted') {
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      query = query
        .in('payment_status', ['pending', 'failed'])
        .neq('fulfillment_status', 'cancelled')
        .gte('created_at', fourteenDaysAgo)
    } else {
      const validStatuses = ['unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled']
      if (params.status && validStatuses.includes(params.status)) {
        query = query.eq('fulfillment_status', params.status)
      }
      // Default: hide pending/failed payment orders — they live in "Attempted" tab.
      // Admin can still drill in by explicitly picking ?payment=pending or ?payment=failed.
      if (!params.payment) {
        query = query.in('payment_status', ['paid', 'refunded'])
      }
    }

    const validPayment = ['pending', 'paid', 'failed', 'refunded']
    if (params.payment && validPayment.includes(params.payment)) {
      query = query.eq('payment_status', params.payment)
    }

    if (params.q?.trim()) {
      const q = params.q.trim()
      query = query.or(
        `order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%`
      )
    }

    if (params.from) query = query.gte('created_at', `${params.from}T00:00:00.000Z`)
    if (params.to)   query = query.lte('created_at', `${params.to}T23:59:59.999Z`)

    const { data, error, count } = await query.range(offset, offset + perPage - 1)

    if (error) {
      console.error('[Admin Orders]', error)
      return { orders: [], total: 0, page: 1, page_count: 1 }
    }

    return {
      orders:     (data ?? []) as OrderRow[],
      total:      count ?? 0,
      page,
      page_count: Math.ceil((count ?? 0) / perPage),
    }
  } catch (err) {
    console.error('[Admin Orders] unexpected:', err)
    return { orders: [], total: 0, page: 1, page_count: 1 }
  }
}

function buildUrl(base: PageProps['searchParams'], override: Record<string, string>): string {
  const params = new URLSearchParams()
  const merged = { ...base, ...override }
  for (const [k, v] of Object.entries(merged)) {
    if (v) params.set(k, v)
  }
  return `/admin/orders?${params.toString()}`
}

function buildCsvUrl(params: PageProps['searchParams']): string {
  const p = new URLSearchParams()
  p.set('format', 'csv')
  if (params.status)  p.set('status',  params.status)
  if (params.payment) p.set('payment', params.payment)
  if (params.q)       p.set('q',       params.q)
  if (params.from)    p.set('from',    params.from)
  if (params.to)      p.set('to',      params.to)
  return `/api/admin/orders?${p.toString()}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
    hour:  '2-digit',
    minute:'2-digit',
    hour12: true,
  })
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { orders, total, page, page_count } = await getOrders(searchParams)
  const activeStatus = searchParams.status ?? ''

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 style={{ fontFamily: 'var(--font-body)', fontSize: '22px', fontWeight: '600', color: 'var(--color-text)' }}>
            Orders
          </h1>
          <p className="mt-0.5" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            {total} order{total !== 1 ? 's' : ''}
            {searchParams.status ? ` · ${searchParams.status}` : ''}
          </p>
        </div>

        {/* CSV Export */}
        <a
          href={buildCsvUrl(searchParams)}
          style={{
            display:         'inline-flex',
            alignItems:      'center',
            gap:             '6px',
            padding:         '8px 14px',
            borderRadius:    '6px',
            border:          '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            fontFamily:      'var(--font-body)',
            fontSize:        '13px',
            fontWeight:      '500',
            color:           'var(--color-text)',
            textDecoration:  'none',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export CSV
        </a>
      </div>

      {/* Filters row */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          border:          '1px solid var(--color-border)',
          borderRadius:    '10px',
          padding:         '12px 16px',
          marginBottom:    '16px',
          display:         'flex',
          flexWrap:        'wrap',
          gap:             '10px',
          alignItems:      'center',
        }}
      >
        {/* Search */}
        <form method="GET" action="/admin/orders" style={{ display: 'flex', gap: '8px', flex: '1', minWidth: '220px' }}>
          {searchParams.status  && <input type="hidden" name="status"  value={searchParams.status} />}
          {searchParams.payment && <input type="hidden" name="payment" value={searchParams.payment} />}
          {searchParams.from    && <input type="hidden" name="from"    value={searchParams.from} />}
          {searchParams.to      && <input type="hidden" name="to"      value={searchParams.to} />}
          <input
            name="q"
            defaultValue={searchParams.q}
            placeholder="Search order #, name, email…"
            style={{
              flex:            '1',
              padding:         '7px 11px',
              border:          '1px solid var(--color-border)',
              borderRadius:    '6px',
              fontSize:        '13px',
              fontFamily:      'var(--font-body)',
              color:           'var(--color-text)',
              backgroundColor: 'var(--color-bg)',
              outline:         'none',
            }}
          />
          <button
            type="submit"
            style={{
              padding:         '7px 14px',
              borderRadius:    '6px',
              border:          '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              fontFamily:      'var(--font-body)',
              fontSize:        '13px',
              cursor:          'pointer',
              color:           'var(--color-text)',
            }}
          >
            Search
          </button>
        </form>

        {/* Date range */}
        <form method="GET" action="/admin/orders" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {searchParams.status  && <input type="hidden" name="status"  value={searchParams.status} />}
          {searchParams.payment && <input type="hidden" name="payment" value={searchParams.payment} />}
          {searchParams.q       && <input type="hidden" name="q"       value={searchParams.q} />}
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>From</span>
          <input
            type="date"
            name="from"
            defaultValue={searchParams.from}
            style={{
              padding:         '6px 10px',
              border:          '1px solid var(--color-border)',
              borderRadius:    '6px',
              fontSize:        '12px',
              fontFamily:      'var(--font-body)',
              color:           'var(--color-text)',
              backgroundColor: 'var(--color-bg)',
            }}
          />
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}>To</span>
          <input
            type="date"
            name="to"
            defaultValue={searchParams.to}
            style={{
              padding:         '6px 10px',
              border:          '1px solid var(--color-border)',
              borderRadius:    '6px',
              fontSize:        '12px',
              fontFamily:      'var(--font-body)',
              color:           'var(--color-text)',
              backgroundColor: 'var(--color-bg)',
            }}
          />
          <button
            type="submit"
            style={{
              padding:         '6px 12px',
              borderRadius:    '6px',
              border:          '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              fontFamily:      'var(--font-body)',
              fontSize:        '12px',
              cursor:          'pointer',
              color:           'var(--color-text)',
            }}
          >
            Apply
          </button>
          {(searchParams.from || searchParams.to) && (
            <Link
              href={buildUrl(searchParams, { from: '', to: '' })}
              style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', textDecoration: 'underline' }}
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Status tabs */}
      <div
        style={{
          display:      'flex',
          gap:          '2px',
          marginBottom: '16px',
          borderBottom: '1px solid var(--color-border)',
          flexWrap:     'wrap',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeStatus === tab.value
          return (
            <Link
              key={tab.value}
              href={buildUrl(searchParams, { status: tab.value, page: '1' })}
              style={{
                padding:         '9px 16px',
                fontFamily:      'var(--font-body)',
                fontSize:        '13px',
                fontWeight:      isActive ? '600' : '400',
                color:           isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
                borderBottom:    isActive ? '2px solid var(--color-gold)' : '2px solid transparent',
                marginBottom:    '-1px',
                textDecoration:  'none',
                whiteSpace:      'nowrap',
                transition:      'color 0.15s',
              }}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {/* Table */}
      {orders.length === 0 ? (
        <div
          style={{
            padding:      '64px 24px',
            textAlign:    'center',
            backgroundColor: 'var(--color-surface)',
            border:       '1px solid var(--color-border)',
            borderRadius: '10px',
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px' }}>
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            No orders found
            {searchParams.status ? ` with status "${searchParams.status}"` : ''}
            {searchParams.q ? ` matching "${searchParams.q}"` : ''}
          </p>
          {(searchParams.status || searchParams.q || searchParams.from || searchParams.to) && (
            <Link
              href="/admin/orders"
              style={{ marginTop: '8px', display: 'inline-block', fontSize: '13px', color: 'var(--color-gold)', fontFamily: 'var(--font-body)', textDecoration: 'underline' }}
            >
              Clear all filters
            </Link>
          )}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border:          '1px solid var(--color-border)',
            borderRadius:    '10px',
            overflow:        'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Order', 'Date', 'Customer', 'Total', 'Payment', 'Fulfilment', ''].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding:    '11px 16px',
                        textAlign:  'left',
                        fontFamily: 'var(--font-body)',
                        fontSize:   '11px',
                        fontWeight: '600',
                        color:      'var(--color-text-muted)',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        backgroundColor: 'var(--color-surface)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr
                    key={order.id}
                    style={{
                      borderBottom: i < orders.length - 1 ? '1px solid var(--color-border)' : 'none',
                      transition:   'background 0.1s',
                    }}
                  >
                    {/* Order # */}
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: '600', color: 'var(--color-text)' }}>
                          #{order.order_number}
                        </span>
                        {order.is_gift && (
                          <span
                            title="Gift order"
                            style={{
                              display:         'inline-flex',
                              alignItems:      'center',
                              justifyContent:  'center',
                              width:           '18px',
                              height:          '18px',
                              borderRadius:    '50%',
                              backgroundColor: '#FEE2E2',
                              fontSize:        '10px',
                            }}
                          >
                            🎁
                          </span>
                        )}
                        {(order.payment_attempts ?? 0) > 1 && (
                          <span
                            title={`${order.payment_attempts} payment attempts`}
                            style={{
                              fontFamily:      'var(--font-mono)',
                              fontSize:        '10px',
                              letterSpacing:   '0.05em',
                              padding:         '2px 6px',
                              borderRadius:    '999px',
                              backgroundColor: '#FEF3C7',
                              color:           '#92400E',
                              border:          '1px solid #FDE68A',
                            }}
                          >
                            ×{order.payment_attempts}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {formatDate(order.created_at)}
                      </span>
                    </td>

                    {/* Customer */}
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: '500', color: 'var(--color-text)' }}>
                        {order.customer_name}
                      </div>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
                        {order.customer_email}
                      </div>
                    </td>

                    {/* Total */}
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: '600', color: 'var(--color-text)' }}>
                        {formatPrice(order.total)}
                      </span>
                      {order.coupon_code && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
                          {order.coupon_code}
                        </div>
                      )}
                    </td>

                    {/* Payment */}
                    <td style={{ padding: '13px 16px' }}>
                      <PaymentBadge status={order.payment_status} />
                    </td>

                    {/* Fulfilment */}
                    <td style={{ padding: '13px 16px' }}>
                      <FulfillmentBadge status={order.fulfillment_status} />
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '13px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        style={{
                          fontFamily:     'var(--font-body)',
                          fontSize:       '12px',
                          fontWeight:     '500',
                          color:          'var(--color-gold)',
                          textDecoration: 'none',
                        }}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {page_count > 1 && (
            <div
              style={{
                display:       'flex',
                alignItems:    'center',
                justifyContent:'space-between',
                padding:       '12px 16px',
                borderTop:     '1px solid var(--color-border)',
                flexWrap:      'wrap',
                gap:           '8px',
              }}
            >
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Page {page} of {page_count}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {page > 1 && (
                  <Link
                    href={buildUrl(searchParams, { page: String(page - 1) })}
                    style={{
                      padding:         '6px 12px',
                      borderRadius:    '6px',
                      border:          '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-bg)',
                      fontFamily:      'var(--font-body)',
                      fontSize:        '12px',
                      color:           'var(--color-text)',
                      textDecoration:  'none',
                    }}
                  >
                    ← Prev
                  </Link>
                )}
                {page < page_count && (
                  <Link
                    href={buildUrl(searchParams, { page: String(page + 1) })}
                    style={{
                      padding:         '6px 12px',
                      borderRadius:    '6px',
                      border:          '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-bg)',
                      fontFamily:      'var(--font-body)',
                      fontSize:        '12px',
                      color:           'var(--color-text)',
                      textDecoration:  'none',
                    }}
                  >
                    Next →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
