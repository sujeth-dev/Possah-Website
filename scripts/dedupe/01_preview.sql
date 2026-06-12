-- =============================================================================
-- Dedupe preview — run BEFORE 02_finalize.sql
-- =============================================================================
--
-- Reports how many existing rows the finalize step will touch.
-- Nothing is changed. Read-only.
--
-- Run via Supabase SQL Editor or psql. Save the output before approving the
-- finalize step.
-- =============================================================================

-- 1. Summary: customers with more than one open pending order
SELECT
  customer_email,
  COUNT(*) AS open_pending_count,
  MIN(created_at) AS oldest_pending_at,
  MAX(created_at) AS newest_pending_at,
  SUM(total) AS total_value_inr
FROM orders
WHERE payment_status = 'pending'
  AND fulfillment_status = 'unfulfilled'
GROUP BY customer_email
HAVING COUNT(*) > 1
ORDER BY open_pending_count DESC, total_value_inr DESC;

-- 2. Aggregate: how many rows will be cancelled by finalize
WITH ranked AS (
  SELECT id, customer_email,
         ROW_NUMBER() OVER (PARTITION BY customer_email ORDER BY created_at DESC) AS rn
    FROM orders
   WHERE payment_status = 'pending'
     AND fulfillment_status = 'unfulfilled'
)
SELECT
  COUNT(*) FILTER (WHERE rn = 1)  AS kept_rows,
  COUNT(*) FILTER (WHERE rn > 1)  AS will_be_cancelled,
  COUNT(DISTINCT customer_email)  AS unique_customers
FROM ranked;

-- 3. Sample of rows that will be cancelled (first 25)
WITH ranked AS (
  SELECT *,
         ROW_NUMBER() OVER (PARTITION BY customer_email ORDER BY created_at DESC) AS rn
    FROM orders
   WHERE payment_status = 'pending'
     AND fulfillment_status = 'unfulfilled'
)
SELECT order_number, customer_email, total, created_at, rn
  FROM ranked
 WHERE rn > 1
 ORDER BY customer_email, created_at DESC
 LIMIT 25;
