-- Migration 016: Add is_ready_to_ship flag to products
-- Run in Supabase SQL Editor after 015_rpc_functions.sql

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_ready_to_ship BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_products_is_ready_to_ship
  ON products(is_ready_to_ship);

-- Update the updated_at trigger to cover this column (already exists from 001)
-- No action needed — trigger fires on any UPDATE to the row.

COMMENT ON COLUMN products.is_ready_to_ship IS
  'When true the product appears on /ready-to-ship in addition to its category page.';
