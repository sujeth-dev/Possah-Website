-- =============================================================================
-- Dedupe finalize — run AFTER 01_preview.sql has been reviewed and approved
-- =============================================================================
--
-- DOES:
--   • For each customer_email with multiple open pending orders, keeps the
--     MOST RECENT one and marks the rest as cancelled (with an audit note in
--     internal_notes so admin can trace why they were closed).
--   • Adds the unique partial index that makes "two open pending orders for
--     the same customer" impossible at the DB level going forward.
--
-- DOES NOT:
--   • Delete any rows. Cancelled orders remain in the table for admin/audit.
--   • Touch paid, shipped, delivered, or already-cancelled orders.
--
-- Wrapped in a single transaction so failure rolls back cleanly.
-- =============================================================================

BEGIN;

-- 1. Cancel duplicate pending orders, keep the most recent per customer.
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY customer_email ORDER BY created_at DESC) AS rn
    FROM orders
   WHERE payment_status = 'pending'
     AND fulfillment_status = 'unfulfilled'
)
UPDATE orders
   SET fulfillment_status = 'cancelled',
       internal_notes     = COALESCE(internal_notes, '') || ' [auto-cancelled by dedupe-finalize]'
 WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 2. Enforce one open pending per customer going forward.
CREATE UNIQUE INDEX IF NOT EXISTS one_pending_per_email
  ON orders(customer_email)
 WHERE payment_status = 'pending'
   AND fulfillment_status = 'unfulfilled';

COMMIT;
