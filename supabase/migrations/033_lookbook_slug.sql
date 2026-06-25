-- Migration 033: add slug to lookbooks for clean URLs
ALTER TABLE lookbooks ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_lookbooks_slug ON lookbooks(slug);
