import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

function requireAdminAuth(request: Request): boolean {
  if (process.env.NODE_ENV === 'development') return true
  const cookie = request.headers.get('cookie') ?? ''
  return cookie.includes('next-auth.session-token') || cookie.includes('__Secure-next-auth.session-token')
}

const VALID_STATUSES = ['unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled'] as const
const VALID_PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const

// GET /api/admin/orders — list with filters + pagination + CSV export
export async function GET(request: Request) {
  if (!requireAdminAuth(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const status         = searchParams.get('status')   // fulfillment_status filter
    const paymentStatus  = searchParams.get('payment')  // payment_status filter
    const search         = searchParams.get('q')?.trim()
    const dateFrom       = searchParams.get('from')     // ISO date string
    const dateTo         = searchParams.get('to')       // ISO date string
    const page           = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const perPage        = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') ?? '25', 10)))
    const format         = searchParams.get('format')   // 'csv' = export
    const offset         = (page - 1) * perPage

    const supabase = createServerClient()

    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Fulfillment status filter
    if (status && (VALID_STATUSES as readonly string[]).includes(status)) {
      query = query.eq('fulfillment_status', status)
    }

    // Payment status filter
    if (paymentStatus && (VALID_PAYMENT_STATUSES as readonly string[]).includes(paymentStatus)) {
      query = query.eq('payment_status', paymentStatus)
    }

    // Search: order_number, customer_name, customer_email
    if (search) {
      query = query.or(
        `order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`
      )
    }

    // Date range
    if (dateFrom) {
      query = query.gte('created_at', `${dateFrom}T00:00:00.000Z`)
    }
    if (dateTo) {
      query = query.lte('created_at', `${dateTo}T23:59:59.999Z`)
    }

    // CSV export: fetch all matching rows (no pagination)
    if (format === 'csv') {
      const { data, error } = await query

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      const rows = data ?? []
      const csvLines: string[] = [
        [
          'Order #', 'Date', 'Customer', 'Email', 'Phone',
          'Total', 'Payment', 'Fulfillment', 'Coupon', 'Tracking', 'Courier',
        ].join(','),
        ...rows.map((o) => [
          `"${o.order_number}"`,
          `"${new Date(o.created_at).toISOString()}"`,
          `"${o.customer_name.replace(/"/g, '""')}"`,
          `"${o.customer_email}"`,
          `"${o.customer_phone}"`,
          o.total,
          `"${o.payment_status}"`,
          `"${o.fulfillment_status}"`,
          `"${o.coupon_code ?? ''}"`,
          `"${o.tracking_number ?? ''}"`,
          `"${o.courier ?? ''}"`,
        ].join(',')),
      ]

      return new Response(csvLines.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="possah-orders-${Date.now()}.csv"`,
        },
      })
    }

    // Paginated JSON response
    const { data, error, count } = await query.range(offset, offset + perPage - 1)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      data:       data ?? [],
      total:      count ?? 0,
      page,
      per_page:   perPage,
      page_count: Math.ceil((count ?? 0) / perPage),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
