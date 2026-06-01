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
      "image": "/images/placeholder-hero.jpg",
      "headline": "she wants what she wants.",
      "subheadline": "Couture, off-duty. Spring ''26",
      "ctaLabel": "Shop the Collection",
      "ctaLink": "/shop/sarees"
    }
  ]'::jsonb,

  -- Collection banner
  '{
    "image": "/images/placeholder-banner.jpg",
    "headline": "Chapter 04: Veil",
    "subtitle": "The Spring Collection",
    "ctaLabel": "Shop the Collection",
    "ctaLink": "/lookbook/spring-26"
  }'::jsonb,

  -- New arrival product IDs
  '["aaaaaaaa-0001-0001-0001-000000000001", "aaaaaaaa-0002-0002-0002-000000000002", "aaaaaaaa-0004-0004-0004-000000000004", "aaaaaaaa-0005-0005-0005-000000000005", "aaaaaaaa-0009-0009-0009-000000000009", "aaaaaaaa-0010-0010-0010-000000000010"]'::jsonb,

  -- Occasion tiles (8 tiles)
  '[
    { "id": "everyday",  "label": "EVERYDAY",  "image": "/images/placeholder-occasion.jpg", "link": "/shop/sarees?occasion=Everyday"  },
    { "id": "brunch",    "label": "BRUNCH",    "image": "/images/placeholder-occasion.jpg", "link": "/shop/sarees?occasion=Brunch"    },
    { "id": "workwear",  "label": "WORKWEAR",  "image": "/images/placeholder-occasion.jpg", "link": "/shop/co-ords?occasion=Workwear" },
    { "id": "evening",   "label": "EVENING",   "image": "/images/placeholder-occasion.jpg", "link": "/shop/lehengas?occasion=Evening"  },
    { "id": "sangeet",   "label": "SANGEET",   "image": "/images/placeholder-occasion.jpg", "link": "/shop/lehengas?occasion=Sangeet"  },
    { "id": "mehendi",   "label": "MEHENDI",   "image": "/images/placeholder-occasion.jpg", "link": "/shop/sarees?occasion=Mehendi"   },
    { "id": "haldi",     "label": "HALDI",     "image": "/images/placeholder-occasion.jpg", "link": "/shop/kurta-sets?occasion=Haldi" },
    { "id": "wedding",   "label": "WEDDING",   "image": "/images/placeholder-occasion.jpg", "link": "/shop/lehengas?occasion=Wedding"  },
    { "id": "cocktail",  "label": "COCKTAIL",  "image": "/images/placeholder-occasion.jpg", "link": "/shop/sarees?occasion=Cocktail"  }
  ]'::jsonb
);

-- Seed: Sample lookbook
INSERT INTO lookbooks (
  id, collection_name, season, year, theme_word, chapter_number,
  hero_image, concept_text, is_active
) VALUES (
  'cccccccc-0001-0001-0001-000000000001',
  'Possah Spring 26', 'Spring', 2026, 'Veil', 4,
  '/images/placeholder-hero.jpg',
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
INSERT INTO reviews (product_id, reviewer_name, reviewer_city, rating, body, is_approved) VALUES
(
  'aaaaaaaa-0001-0001-0001-000000000001',
  'Priya M.',
  'Mumbai',
  5,
  'I wore this to my cousin''s wedding and I have never felt more like myself. The drape holds beautifully all day. Absolutely worth every rupee.',
  TRUE
),
(
  'aaaaaaaa-0001-0001-0001-000000000001',
  'Anjali S.',
  'Delhi',
  5,
  'The quality is exceptional. You can feel the difference the moment you unfold it. The chikankari work is incredibly fine. Will be ordering again.',
  TRUE
),
(
  'aaaaaaaa-0003-0003-0003-000000000003',
  'Roshni K.',
  'Bangalore',
  5,
  'This lehenga is a piece of art. I wore it for my sangeet and got compliments all night. The embroidery detail is unreal — you have to see it in person.',
  TRUE
)
ON CONFLICT DO NOTHING;

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
