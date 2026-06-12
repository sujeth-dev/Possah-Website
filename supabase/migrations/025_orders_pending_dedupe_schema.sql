-- =============================================================================
-- Migration 025: orders — pending-order dedupe + soft-hide + email-sent guard
-- =============================================================================
--
-- Adds columns + supporting indexes for Phase 2 of the order experience overhaul:
--   • cart_fingerprint            — deterministic hash of cart intent (items + delivery + coupon + gift + total)
--   • expires_at                  — when a pending order is considered abandoned
--   • payment_attempts            — counter for retries on the same order
--   • customer_hidden_at          — soft-hide flag for customer-facing orders list
--   • confirmation_email_sent_at  — idempotency guard for confirmation email
--
-- This migration is SAFE on a populated table: it adds columns + indexes only.
-- It does NOT add the unique partial index that enforces "one pending per
-- customer" — that lives in scripts/dedupe-finalize.sql and must be run
-- manually AFTER scripts/dedupe-preview.sql confirms how many duplicate rows
-- will be cancelled by the pre-cleanup UPDATE.
--
-- The app-level upsert logic in app/api/orders/create/route.ts handles dedupe
-- correctly without the unique index; the index is a race-condition safety net.
-- =============================================================================

BEGIN;

-- A. Cart fingerprint
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cart_fingerprint TEXT;

-- B. Expiry on pending orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- C. Payment-attempt counter (analytics + abuse detection)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_attempts INT NOT NULL DEFAULT 0;

-- D. Customer-facing soft-hide
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_hidden_at TIMESTAMPTZ;

-- E. Confirmation-email idempotency guard
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ;

-- F. Backfill expires_at on existing pending orders (7-day window from creation)
UPDATE orders
   SET expires_at = created_at + INTERVAL '7 days'
 WHERE payment_status = 'pending'
   AND expires_at IS NULL;

-- G. Supporting index for the customer-facing list query
--    (customer_email + customer_hidden_at IS NULL filter)
CREATE INDEX IF NOT EXISTS idx_orders_customer_hidden
  ON orders(customer_email, customer_hidden_at);

-- H. Supporting index for lazy-expiry UPDATE in create/route.ts
CREATE INDEX IF NOT EXISTS idx_orders_pending_expires_at
  ON orders(expires_at)
 WHERE payment_status = 'pending';

-- I. Supporting index for the dedupe lookup in create/route.ts
--    (find existing open pending order for a given email)
CREATE INDEX IF NOT EXISTS idx_orders_pending_lookup
  ON orders(customer_email, created_at DESC)
 WHERE payment_status = 'pending' AND fulfillment_status = 'unfulfilled';

COMMIT;
