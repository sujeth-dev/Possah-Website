-- Migration 013: Journal / blog articles

CREATE TABLE IF NOT EXISTS journal_articles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  category        TEXT NOT NULL CHECK (category IN ('Style', 'Craft', 'Culture', 'Women', 'Occasions', 'Behind the Scenes', 'Inspiration')),
  author          TEXT NOT NULL DEFAULT 'The Possah Atelier',
  body            TEXT,               -- rich text / markdown
  featured_image  TEXT,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  published_at    TIMESTAMPTZ,        -- NULL = draft
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_slug        ON journal_articles(slug);
CREATE INDEX IF NOT EXISTS idx_journal_published   ON journal_articles(published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_journal_is_featured ON journal_articles(is_featured);
CREATE INDEX IF NOT EXISTS idx_journal_category    ON journal_articles(category);
