-- Migration 003: Orders table

CREATE TABLE IF NOT EXISTS orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number        TEXT NOT NULL UNIQUE,
  customer_name       TEXT NOT NULL,
  customer_email      TEXT NOT NULL,
  customer_phone      TEXT NOT NULL,
  shipping_address    JSONB NOT NULL DEFAULT '{}',
  line_items          JSONB NOT NULL DEFAULT '[]',
  subtotal            NUMERIC(10, 2) NOT NULL DEFAULT 0,
  shipping_fee        NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_amount     NUMERIC(10, 2) NOT NULL DEFAULT 0,
  coupon_code         TEXT,
  tax                 NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total               NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_status      TEXT NOT NULL DEFAULT 'pending'
                        CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  fulfillment_status  TEXT NOT NULL DEFAULT 'unfulfilled'
                        CHECK (fulfillment_status IN ('unfulfilled', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_gateway     TEXT,
  gateway_order_id    TEXT,
  gateway_payment_id  TEXT,
  tracking_number     TEXT,
  courier             TEXT,
  internal_notes      TEXT,
  is_gift             BOOLEAN NOT NULL DEFAULT FALSE,
  gift_message        TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number       ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email     ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status     ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at         ON orders(created_at DESC);
