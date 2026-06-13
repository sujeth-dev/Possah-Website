// Audit H-1: stock must decrement exactly once across verify + webhook callers.
import { describe, it, expect, vi } from 'vitest'
import { decrementOrderStockOnce } from '@/lib/stock'

function makeSupabase(claimResult: { data: unknown; error: unknown }) {
  const rpc = vi.fn().mockResolvedValue({ data: true, error: null })
  const chain: Record<string, unknown> = {}
  for (const m of ['update', 'eq', 'is', 'select']) {
    chain[m] = () => chain
  }
  chain.maybeSingle = () => Promise.resolve(claimResult)
  const supabase = { from: () => chain, rpc }
  return { supabase, rpc }
}

describe('decrementOrderStockOnce', () => {
  it('decrements each line item when it wins the atomic claim', async () => {
    const { supabase, rpc } = makeSupabase({
      data: {
        order_number: 'PSH-1',
        line_items: [
          { variant_id: 'v1', qty: 2, name: 'Saree' },
          { variant_id: 'v2', qty: 1, name: 'Blouse' },
        ],
      },
      error: null,
    })
    const res = await decrementOrderStockOnce(supabase as never, 'PSH-1')
    expect(res.decremented).toBe(true)
    expect(rpc).toHaveBeenCalledTimes(2)
    expect(rpc).toHaveBeenCalledWith('decrement_variant_stock', { p_variant_id: 'v1', p_qty: 2 })
    expect(rpc).toHaveBeenCalledWith('decrement_variant_stock', { p_variant_id: 'v2', p_qty: 1 })
  })

  it('no-ops when the claim returns no row (already decremented / not paid)', async () => {
    const { supabase, rpc } = makeSupabase({ data: null, error: null })
    const res = await decrementOrderStockOnce(supabase as never, 'PSH-1')
    expect(res.decremented).toBe(false)
    expect(rpc).not.toHaveBeenCalled()
  })

  it('no-ops on claim error without throwing', async () => {
    const { supabase, rpc } = makeSupabase({ data: null, error: { message: 'boom' } })
    const res = await decrementOrderStockOnce(supabase as never, 'PSH-1')
    expect(res.decremented).toBe(false)
    expect(rpc).not.toHaveBeenCalled()
  })
})
