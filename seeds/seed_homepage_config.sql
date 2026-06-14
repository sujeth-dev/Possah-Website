-- Seed: Homepage configuration
-- Run AFTER seed_products.sql

INSERT INTO homepage_config (
  hero_slides,
  collection_banner,
  new_arrival_ids,
  occasion_tiles
) VALUES (
  -- Hero slides
  '[
    {
      "id": "slide-1",
      "image": "https://cdn.thepossah.com/ui/placeholder.svg",
      "headline": "she wants what she wants.",
      "subheadline": "Couture, off-duty. Spring ''26",
      "ctaLabel": "Shop the Collection",
      "ctaLink": "/women"
    }
  ]'::jsonb,

  -- Collection banner
  '{
    "image": "https://cdn.thepossah.com/ui/placeholder.svg",
    "headline": "Chapter 04: Veil",
    "subtitle": "The Spring Collection",
    "ctaLabel": "Shop the Collection",
    "ctaLink": "/festive"
  }'::jsonb,

  -- New arrival product IDs
  '[]'::jsonb, -- set via admin after products are seeded

  -- Occasion tiles (8 tiles)
  '[
    { "id": "everyday",  "label": "EVERYDAY",  "image": "https://cdn.thepossah.com/ui/placeholder.svg", "link": "/shop/sarees?occasion=Everyday"  },
    { "id": "brunch",    "label": "BRUNCH",    "image": "https://cdn.thepossah.com/ui/placeholder.svg", "link": "/shop/sarees?occasion=Brunch"    },
    { "id": "workwear",  "label": "WORKWEAR",  "image": "https://cdn.thepossah.com/ui/placeholder.svg", "link": "/shop/co-ords?occasion=Workwear" },
    { "id": "evening",   "label": "EVENING",   "image": "https://cdn.thepossah.com/ui/placeholder.svg", "link": "/shop/lehengas?occasion=Evening"  },
    { "id": "sangeet",   "label": "SANGEET",   "image": "https://cdn.thepossah.com/ui/placeholder.svg", "link": "/shop/lehengas?occasion=Sangeet"  },
    { "id": "mehendi",   "label": "MEHENDI",   "image": "https://cdn.thepossah.com/ui/placeholder.svg", "link": "/shop/sarees?occasion=Mehendi"   },
    { "id": "haldi",     "label": "HALDI",     "image": "https://cdn.thepossah.com/ui/placeholder.svg", "link": "/shop/kurta-sets?occasion=Haldi" },
    { "id": "wedding",   "label": "WEDDING",   "image": "https://cdn.thepossah.com/ui/placeholder.svg", "link": "/shop/lehengas?occasion=Wedding"  },
    { "id": "cocktail",  "label": "COCKTAIL",  "image": "https://cdn.thepossah.com/ui/placeholder.svg", "link": "/shop/sarees?occasion=Cocktail"  }
  ]'::jsonb
);

-- Seed: Sample lookbook
INSERT INTO lookbooks (
  id, collection_name, season, year, theme_word, chapter_number,
  hero_image, concept_text, is_active
) VALUES (
  'cccccccc-0001-0001-0001-000000000001',
  'Possah Spring 26', 'Spring', 2026, 'Veil', 4,
  'https://cdn.thepossah.com/ui/placeholder.svg',
  'Veil is about the moment before — the pause, the preparation, the quiet certainty. These are not clothes for blending in. They are for the woman who has already decided.',
  TRUE
) ON CONFLICT DO NOTHING;

-- Seed: Sample journal articles
INSERT INTO journal_articles (slug, title, category, author, body, is_featured, published_at) VALUES
(
  'the-art-of-draping-a-chikankari-saree',
  'The Art of Draping a Chikankari Saree',
  'Craft',
  'The Possah Atelier',
  'Chikankari is not embroidery. It is a language. Each motif — the murghabi, the kangan, the rahet — carries a meaning passed down through generations of Lucknow artisans...',
  TRUE,
  NOW()
),
(
  '5-ways-to-wear-a-saree-to-work',
  '5 Ways to Wear a Saree to Work',
  'Style',
  'The Possah Atelier',
  'The office saree is having a moment — and we are here for it. Here are five draping styles that work from 9am to 9pm without missing a beat...',
  FALSE,
  NOW() - INTERVAL '7 days'
),
(
  'behind-the-stitch-our-artisans-in-lucknow',
  'Behind the Stitch: Our Artisans in Lucknow',
  'Behind the Scenes',
  'The Possah Atelier',
  'We visited the workshops of Lucknow in January 2026. What we found was not a factory — it was a family. Forty artisans, three generations, one craft...',
  FALSE,
  NOW() - INTERVAL '14 days'
)
ON CONFLICT (slug) DO NOTHING;

-- Seed: Sample reviews
-- Reviews referencing placeholder product IDs removed.
-- Add real reviews via admin panel once products are seeded.

-- Seed: Sample coupons
INSERT INTO coupons (code, type, value, min_order_value, usage_limit, is_active) VALUES
  ('WELCOME10',    'percent',      10, 5000,  NULL, TRUE),
  ('FLAT500',      'flat',        500, 10000, 100,  TRUE),
  ('FREESHIP',     'free_shipping', 0,  3000,  NULL, TRUE),
  ('NOOR20',       'percent',      20, 40000,  50,  TRUE)
ON CONFLICT (code) DO NOTHING;

-- Seed: Sample gift sets
INSERT INTO gift_sets (name, slug, description, price, includes, is_active) VALUES
(
  'The Signature Box',
  'the-signature-box',
  'Our most loved pieces, curated into one beautiful gift.',
  8500,
  '["Linen Kurta Set", "Dust bag", "Signature wrapping", "Handwritten note"]'::jsonb,
  TRUE
),
(
  'The Celebration Set',
  'the-celebration-set',
  'A celebration, gift-wrapped.',
  15000,
  '["Co-Ord Set of choice", "Rose Separate Top", "Dust bag", "Signature box", "Handwritten note"]'::jsonb,
  TRUE
),
(
  'The Custom Gift',
  'the-custom-gift',
  'Tell us who she is. We''ll curate something just for her.',
  20000,
  '["Personalised curation consultation", "2 pieces of your choice", "Custom packaging", "Handwritten card"]'::jsonb,
  TRUE
)
ON CONFLICT (slug) DO NOTHING;
