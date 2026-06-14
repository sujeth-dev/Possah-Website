-- Add gender column to categories for URL-scoped routing (/women/, /men/, /kids/)
ALTER TABLE categories ADD COLUMN gender TEXT NOT NULL DEFAULT 'women';
