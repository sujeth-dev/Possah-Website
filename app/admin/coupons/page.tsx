import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { CouponManager } from './CouponManager'

export const metadata: Metadata = { title: 'Coupons' }
export const dynamic = 'force-dynamic'

interface Coupon {
  id:              string
  code:            string
  type:            'percent' | 'flat' | 'free_shipping'
  value:           number
  min_order_value: number
  usage_limit:     number | null
  usage_count:     number
  expiry_date:     string | null
  is_active:       boolean
  created_at:      string
}

async function getCoupons(): Promise<{ coupons: Coupon[]; dbError: string | null }> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return { coupons: [], dbError: error.message }
    return { coupons: data ?? [], dbError: null }
  } catch (err) {
    return { coupons: [], dbError: String(err) }
  }
}

export default async function AdminCouponsPage() {
  const { coupons, dbError } = await getCoupons()

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 style={{ fontFamily: 'var(--font-body)', fontSize: '22px', fontWeight: '600', color: 'var(--color-text)' }}>
          Coupons
        </h1>
        <p className="mt-0.5" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          {coupons.length} coupon{coupons.length !== 1 ? 's' : ''}. Create discount codes for your customers.
        </p>
      </div>

      {dbError && (
        <p className="text-red-600 mb-4" style={{ fontFamily: 'var(--font-body)', fontSize: '13px' }}>
          Error loading coupons: {dbError}
        </p>
      )}

      <CouponManager initialCoupons={coupons} />
    </div>
  )
}
