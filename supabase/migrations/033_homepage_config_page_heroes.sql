-- Migration 033: add page_heroes column for editorial collection page hero images
-- Allows admin to configure hero banners for /women, /new-in, /best-sellers, /festive, /bridal
ALTER TABLE homepage_config
  ADD COLUMN IF NOT EXISTS page_heroes JSONB NOT NULL DEFAULT '{}';

-- page_heroes shape:
-- {
--   "women_hub_hero":    "<url>",   -- hero for /women hub page
--   "new_in_hero":       "<url>",   -- hero for /new-in page
--   "best_sellers_hero": "<url>",   -- hero for /best-sellers page
--   "festive_hero":      "<url>",   -- hero for /festive page
--   "bridal_hero":       "<url>"    -- hero for /bridal page
-- }
