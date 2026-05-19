-- Migration 014: Lookbooks and individual looks

CREATE TABLE IF NOT EXISTS lookbooks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_name  TEXT NOT NULL,
  season           TEXT NOT NULL,   -- e.g. 'Spring', 'Festive', 'Resort'
  year             INTEGER NOT NULL,
  theme_word       TEXT NOT NULL,   -- e.g. 'Veil', 'Ember', 'Drift'
  chapter_number   INTEGER NOT NULL,
  hero_image       TEXT,
  concept_text     TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lookbooks_chapter ON lookbooks(chapter_number);
CREATE INDEX IF NOT EXISTS idx_lookbooks_is_active      ON lookbooks(is_active);

CREATE TABLE IF NOT EXISTS lookbook_looks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lookbook_id  UUID NOT NULL REFERENCES lookbooks(id) ON DELETE CASCADE,
  look_number  INTEGER NOT NULL,
  image_url    TEXT,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lookbook_id, look_number)
);

CREATE INDEX IF NOT EXISTS idx_lookbook_looks_lookbook_id ON lookbook_looks(lookbook_id);
