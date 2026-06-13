// Audit coupon-leak: usage is released on abandon/cancel.
import { describe, it, expect, vi } from 'vitest'
import { releaseCouponUsage } from '@/lib/coupons'

function makeSupabase(couponRow: { data: unknown; error?: unknown }) {
  const rpc = vi.fn().mockResolvedValue({ data: undefined, error: null })
  const chain: Record<string, unknown> = {}
  for (const m of ['select', 'eq']) chain[m] = () => chain
  chain.maybeSingle = () => Promise.resolve(couponRow)
  const supabase = { from: () => chain, rpc }
  return { supabase, rpc }
}

describe('releaseCouponUsage', () => {
  it('decrements usage for a known coupon code', async () => {
    const { supabase, rpc } = makeSupabase({ data: { id: 'c1' } })
    await releaseCouponUsage(supabase as never, 'SAVE500')
    expect(rpc).toHaveBeenCalledWith('decrement_coupon_usage', { p_coupon_id: 'c1' })
  })

  it('is a no-op for empty / null codes', async () => {
    const { supabase, rpc } = makeSupabase({ data: null })
    await releaseCouponUsage(supabase as never, '')
    await releaseCouponUsage(supabase as never, null)
    await releaseCouponUsage(supabase as never, undefined)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('does not decrement when the coupon code is unknown', async () => {
    const { supabase, rpc } = makeSupabase({ data: null })
    await releaseCouponUsage(supabase as never, 'GHOST')
    expect(rpc).not.toHaveBeenCalled()
  })
})
