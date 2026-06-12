-- Migration 026: Address book — delivery_notes + single-default constraint

ALTER TABLE user_addresses ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_default_per_user
  ON user_addresses(user_id)
  WHERE is_default = TRUE;
