-- Migration 028: Order status history
-- Tracks every fulfillment status change for audit trail and email de-duplication.

CREATE TABLE IF NOT EXISTS order_status_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status   TEXT NOT NULL,
  changed_by  TEXT,          -- 'admin:email@example.com', 'system', or 'confirmation_resent'
  note        TEXT,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_history_order
  ON order_status_history(order_id, changed_at DESC);
