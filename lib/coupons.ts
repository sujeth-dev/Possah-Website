import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/**
 * Release one unit of coupon usage previously claimed by an order.
 *
 * BUSINESS LOGIC (audit — coupon usage leak): `usage_count` is incremented when
 * an order is created (or when its coupon changes). Previously, when a pending
 * order was abandoned (lazy-expired on the customer's next attempt) or
 * cancelled, the order row was marked cancelled but the coupon's usage_count
 * was never given back — so a limited-use coupon was permanently consumed by
 * checkouts that never paid. This helper returns the unit.
 *
 * Best-effort + idempotent-at-the-floor: decrement_coupon_usage uses
 * GREATEST(usage_count - 1, 0) so it can never drive the counter negative.
 * Callers should only invoke this on a genuine pending→cancelled/expired
 * transition (never on an already-cancelled row) to avoid releasing twice.
 */
export async function releaseCouponUsage(
  supabase: SupabaseClient<Database>,
  code: string | null | undefined,
): Promise<void> {
  const trimmed = code?.trim()
  if (!trimmed) return

  const { data } = await supabase
    .from('coupons')
    .select('id')
    .eq('code', trimmed)
    .maybeSingle<{ id: string }>()

  if (data?.id) {
    await supabase.rpc('decrement_coupon_usage', { p_coupon_id: data.id })
  }
}
