import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

type StockLineItem = { variant_id: string; name?: string; qty: number }

/**
 * Decrement variant stock for a paid order EXACTLY ONCE, idempotently across
 * every caller (the /payments/verify client callback and the Razorpay webhook).
 *
 * HIGH FIX (audit H-1): stock was previously decremented only inside the
 * webhook. If the webhook was misconfigured or failed to deliver, a paid order
 * never reduced inventory → systemic oversell. Now both the verify path and the
 * webhook call this helper, and an atomic claim on `orders.stock_decremented_at`
 * (NULL → NOW()) guarantees the decrement runs once and only once no matter how
 * many callers race or retry.
 *
 * decrement_variant_stock returns FALSE if stock would go negative; we log the
 * oversell for manual reconciliation but never throw — the payment is already
 * captured and must not be rolled back.
 *
 * Requires migration 029 (adds orders.stock_decremented_at).
 */
export async function decrementOrderStockOnce(
  supabase: SupabaseClient<Database>,
  orderNumber: string,
): Promise<{ decremented: boolean }> {
  const nowIso = new Date().toISOString()

  // Atomic claim — only the first caller flips NULL → NOW() and gets the row.
  const { data: claimed, error } = await supabase
    .from('orders')
    .update({ stock_decremented_at: nowIso })
    .eq('order_number', orderNumber)
    .eq('payment_status', 'paid')
    .is('stock_decremented_at', null)
    .select('order_number, line_items')
    .maybeSingle<{ order_number: string; line_items: unknown }>()

  if (error) {
    console.error('[stock] claim error for order', orderNumber, error)
    return { decremented: false }
  }
  if (!claimed) {
    // Not paid yet, doesn't exist, or another caller already decremented.
    return { decremented: false }
  }

  const items: StockLineItem[] = Array.isArray(claimed.line_items)
    ? (claimed.line_items as StockLineItem[])
    : []

  await Promise.all(
    items.map(async (item) => {
      if (!item?.variant_id || !item?.qty) return
      const { data: ok, error: stockErr } = await supabase.rpc('decrement_variant_stock', {
        p_variant_id: item.variant_id,
        p_qty: item.qty,
      })
      if (stockErr) {
        console.error(
          `[stock] RPC error for variant ${item.variant_id} (order ${orderNumber}):`,
          stockErr,
        )
      } else if (!ok) {
        console.error(
          `[stock] OVERSELL: variant ${item.variant_id} ("${item.name ?? ''}") ` +
            `qty=${item.qty} order=${orderNumber} — manual reconciliation required`,
        )
      }
    }),
  )

  return { decremented: true }
}
