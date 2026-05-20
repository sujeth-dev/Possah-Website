-- Store settings singleton table
-- One row only, id = fixed UUID for easy upsert
CREATE TABLE IF NOT EXISTS store_settings (
  id                        uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  announcement_text         text NOT NULL DEFAULT 'FREE SHIPPING ACROSS INDIA · MADE-TO-MEASURE AVAILABLE',
  store_email               text NOT NULL DEFAULT '',
  whatsapp_number           text NOT NULL DEFAULT '',
  free_shipping_threshold   integer NOT NULL DEFAULT 5000,
  express_delivery_fee      integer NOT NULL DEFAULT 499,
  seo_title                 text NOT NULL DEFAULT 'The Possah — Luxury Indian Fashion',
  seo_description           text NOT NULL DEFAULT '',
  seo_og_image              text,
  updated_at                timestamptz NOT NULL DEFAULT now()
);

-- Seed the single settings row if not already present
INSERT INTO store_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- RLS: service role only (admin API uses service role key)
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON store_settings
  USING (auth.role() = 'service_role');
