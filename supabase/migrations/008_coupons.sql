-- Migration 008: Coupons / discount codes

CREATE TABLE IF NOT EXISTS coupons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT NOT NULL UNIQUE,
  type             TEXT NOT NULL CHECK (type IN ('percent', 'flat', 'free_shipping')),
  value            NUMERIC(10, 2) NOT NULL DEFAULT 0,
  min_order_value  NUMERIC(10, 2) NOT NULL DEFAULT 0,
  expiry_date      DATE,
  usage_limit      INTEGER,                  -- NULL = unlimited
  usage_count      INTEGER NOT NULL DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code      ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
