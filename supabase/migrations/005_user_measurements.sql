-- Migration 005: User measurements (feeds M2M pre-fill)

CREATE TABLE IF NOT EXISTS user_measurements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bust_cm     NUMERIC(5, 1),
  waist_cm    NUMERIC(5, 1),
  hips_cm     NUMERIC(5, 1),
  height_cm   NUMERIC(5, 1),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE TRIGGER user_measurements_updated_at
  BEFORE UPDATE ON user_measurements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
