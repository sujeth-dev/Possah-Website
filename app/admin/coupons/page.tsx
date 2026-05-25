import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { CouponManager } from './CouponManager'

export const metadata: Metadata = { title: 'Coupons' }
export const dynamic = 'force-dynamic'

async function getCoupons() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) { console.error('[Admin Coupons]', error); return [] }
    return data ?? []
  } catch (err) {
    console.error('[Admin Coupons] unexpected:', err)
    return []
  }
}

export default async function AdminCouponsPage() {
  const coupons = await getCoupons()

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

      <CouponManager initialCoupons={coupons} />
    </div>
  )
}
