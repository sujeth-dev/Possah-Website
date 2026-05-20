-- Migration 015: Atomic RPC functions for coupon usage and stock management
-- These functions use row-level locking to prevent race conditions under concurrent load.

-- ─── increment_coupon_usage ───────────────────────────────────────────────────
-- Atomically increments usage_count only if the coupon is still within its limit.
-- Returns TRUE if the increment succeeded, FALSE if the limit was already reached
-- or the coupon doesn't exist / is inactive.
--
-- Usage: SELECT increment_coupon_usage('coupon-uuid-here');

CREATE OR REPLACE FUNCTION increment_coupon_usage(p_coupon_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE coupons
  SET usage_count = usage_count + 1
  WHERE id = p_coupon_id
    AND is_active = TRUE
    AND (usage_limit IS NULL OR usage_count < usage_limit);

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- ─── decrement_coupon_usage ──────────────────────────────────────────────────
-- Atomically decrements usage_count by 1, clamped at 0.
-- Used as a best-effort rollback when Razorpay order creation fails after
-- increment_coupon_usage already ran.

CREATE OR REPLACE FUNCTION decrement_coupon_usage(p_coupon_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE coupons
  SET usage_count = GREATEST(usage_count - 1, 0)
  WHERE id = p_coupon_id;
END;
$$;

-- ─── decrement_variant_stock ──────────────────────────────────────────────────
-- Atomically decrements stock_qty for a product variant by p_qty.
-- Enforces stock_qty >= 0 (will NOT go negative).
-- Returns TRUE if the decrement succeeded (enough stock was available).
-- Returns FALSE if stock was insufficient — caller should log as oversell event.
--
-- Usage: SELECT decrement_variant_stock('variant-uuid-here', 2);

CREATE OR REPLACE FUNCTION decrement_variant_stock(p_variant_id UUID, p_qty INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE product_variants
  SET stock_qty = stock_qty - p_qty
  WHERE id = p_variant_id
    AND stock_qty >= p_qty;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;
