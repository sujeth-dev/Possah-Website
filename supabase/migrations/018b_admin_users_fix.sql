-- FIX-SEC-04: Drop password_hash NOT NULL constraint from admin_users.
--
-- Problem: admin_users.password_hash TEXT NOT NULL has no default.
-- This makes seeding an admin by email impossible:
--   INSERT INTO admin_users (email, is_active) VALUES ('x@y.com', true);
--   → ERROR: null value in column "password_hash" violates not-null constraint
--
-- The column is unused — auth is Google OAuth via NextAuth. Drop it entirely.

ALTER TABLE admin_users DROP COLUMN IF EXISTS password_hash;

-- ─── Seed admin user ─────────────────────────────────────────────────────────
-- After running this migration, insert your Google account email:
--
--   INSERT INTO admin_users (email, is_active)
--   VALUES ('thedenn0007@gmail.com', true)
--   ON CONFLICT (email) DO UPDATE SET is_active = true;
--
-- Run the INSERT above manually in the Supabase SQL editor for each environment.
-- Do NOT include the INSERT in this migration file — it is environment-specific.
