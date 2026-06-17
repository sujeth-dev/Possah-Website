-- Migration 032: add image columns for CategorySplit, CategoryCircles, and MtmCta sections
-- These three homepage sections previously had hardcoded placeholder images with no admin control.
ALTER TABLE homepage_config
  ADD COLUMN IF NOT EXISTS category_split   JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS category_circles JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mtm_cta          JSONB NOT NULL DEFAULT '{}';

-- category_split   shape: { "ethnic_image": "<url>", "western_image": "<url>" }
-- category_circles shape: { "sarees": "<url>", "lehengas": "<url>", "co_ords": "<url>",
--                           "dresses": "<url>", "kurta_sets": "<url>", "tops": "<url>" }
-- mtm_cta          shape: { "image_url": "<url>" }
