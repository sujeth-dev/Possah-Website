-- =============================================================================
-- Migration 029: orders.stock_decremented_at — idempotent stock-decrement guard
-- =============================================================================
--
-- AUDIT H-1: stock was decremented only by the Razorpay webhook. If the webhook
-- failed or was unconfigured, paid orders never reduced inventory (oversell).
-- Both /api/payments/verify and the webhook now decrement via a shared helper
-- (lib/stock.ts) guarded by an atomic claim on this column, so the decrement
-- runs EXACTLY once regardless of which path confirms payment or how many
-- retries occur.
--
-- Safe on a populated table: adds one nullable column + a backfill.
-- =============================================================================

BEGIN;

-- A. The guard column.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stock_decremented_at TIMESTAMPTZ;

-- B. Backfill: existing PAID orders already had their stock decremented by the
--    old webhook path. Stamp them so the new helper will NOT decrement again.
UPDATE orders
   SET stock_decremented_at = COALESCE(updated_at, created_at, NOW())
 WHERE payment_status = 'paid'
   AND stock_decremented_at IS NULL;

-- C. Supporting partial index for the atomic claim lookup.
CREATE INDEX IF NOT EXISTS idx_orders_stock_undecremented
  ON orders(order_number)
 WHERE payment_status = 'paid' AND stock_decremented_at IS NULL;

COMMIT;
