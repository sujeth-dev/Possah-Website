-- Migration 010: Homepage configuration (admin-editable)
-- Single-row config table — enforced by RLS policy in production

CREATE TABLE IF NOT EXISTS homepage_config (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_slides       JSONB NOT NULL DEFAULT '[]',
  collection_banner JSONB NOT NULL DEFAULT '{}',
  new_arrival_ids   JSONB NOT NULL DEFAULT '[]',
  occasion_tiles    JSONB NOT NULL DEFAULT '[]',
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER homepage_config_updated_at
  BEFORE UPDATE ON homepage_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
