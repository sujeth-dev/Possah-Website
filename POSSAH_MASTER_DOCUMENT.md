# The Possah - Master Project Document

**Last Updated:** May 20, 2026  
**Project:** `thepossah.com`  
**Stack:** Next.js 14, Supabase, NextAuth, Razorpay, Resend

This is the primary product and architecture reference for the repository. It replaces older scattered status notes as the single source of truth for the live codebase.

## 1. Project Summary

The Possah is a custom luxury Indian fashion storefront with an integrated admin dashboard. The codebase includes:

- editorial storefront pages for shopping and brand storytelling
- Supabase-backed catalog, content, order, coupon, review, and settings data
- NextAuth Google sign-in for customer access and admin allowlisting
- Razorpay-backed checkout and payment verification
- admin tooling for products, categories, orders, homepage content, coupons, reviews, journal content, media, and store settings

## 2. Current State

### Production build status

- `npm run lint`: passing
- `npm run build`: passing
- public storefront pages no longer depend on cookie-bound Supabase reads during build

### Build hardening completed

- public catalog and content reads now use a dedicated server-side public Supabase client
- `sitemap.xml` now uses the public client and statically builds cleanly
- admin routing now consistently points to `/auth/signin`
- an explicit `/auth/signin` page exists and routes users into Google sign-in with callback support
- the admin app tree is intentionally marked dynamic

### Remaining environment blocker

- local Docker-backed Supabase reset is still dependent on elevated Docker access in this environment

## 3. Architecture Overview

### Frontend

- `app/(shop)/`: storefront routes
- `components/`: reusable UI and page sections
- `styles/globals.css`: design tokens and global styling

### Admin

- `app/admin/`: admin dashboard pages
- `app/api/admin/`: admin CRUD endpoints
- middleware protects `/admin/*` in production via NextAuth JWT plus `isAdmin`

### Data and integrations

- `supabase/migrations/`: schema source of truth
- `seeds/`: local development seed data
- `lib/supabase/server.ts`: cookie-aware server client for session-dependent flows
- `lib/supabase/public.ts`: anonymous server-side client for public storefront reads
- `lib/supabase/admin.ts`: service-role client for privileged server operations
- `lib/auth.ts`: NextAuth config and `admin_users` allowlist logic
- `lib/razorpay.ts`: order creation and signature verification helpers
- `lib/email.ts`: transactional email sending

## 4. Route Map

### Storefront

- `/`: homepage
- `/women`, `/bridal`, `/festive`, `/new-in`, `/ready-to-ship`
- `/shop/[category]`
- `/shop/[category]/[slug]`
- `/journal` and `/journal/[slug]`
- `/lookbook`
- `/cart`, `/checkout`, `/order/confirmation`
- `/account`, `/account/orders`
- `/search`, `/wishlist`, `/about`, `/faq`, `/contact`, `/size-guide`

### Auth and admin

- `/auth/signin`: Google sign-in entry point
- `/admin`: dashboard home
- `/admin/products`
- `/admin/categories`
- `/admin/orders`
- `/admin/homepage`
- `/admin/coupons`
- `/admin/reviews`
- `/admin/journal`
- `/admin/media`
- `/admin/settings`

## 5. Authentication and Security

### Admin auth model

- Google sign-in is the canonical auth flow
- production admin access depends on `token.isAdmin`
- `token.isAdmin` is derived from whether the signed-in email exists in `admin_users`
- development mode still bypasses admin guards for faster local iteration

### Supabase client rules

- use `createServerClient()` only when request cookies or session state matter
- use `createPublicClient()` for public server-side reads in pages, metadata, and sitemap generation
- use `createAdminClient()` only inside server-only privileged flows

## 6. Database Notes

The database shape is defined by:

- `supabase/migrations/001_products.sql`
- `supabase/migrations/002_categories.sql`
- `supabase/migrations/003_orders.sql`
- `supabase/migrations/004_users.sql`
- `supabase/migrations/005_user_measurements.sql`
- `supabase/migrations/006_user_addresses.sql`
- `supabase/migrations/007_wishlists.sql`
- `supabase/migrations/008_coupons.sql`
- `supabase/migrations/009_reviews.sql`
- `supabase/migrations/010_homepage_config.sql`
- `supabase/migrations/011_admin_users.sql`
- `supabase/migrations/012_gift_sets.sql`
- `supabase/migrations/013_journal_articles.sql`
- `supabase/migrations/014_lookbooks.sql`
- `supabase/migrations/015_rpc_functions.sql`
- `supabase/migrations/016_add_ready_to_ship.sql`
- `supabase/migrations/017_store_settings.sql`

Core functional areas:

- product catalog and variants
- categories and homepage config
- orders and payment state
- customer profile support tables
- wishlists, reviews, coupons
- journal content and lookbooks
- admin allowlist and store settings

## 7. Local Development Model

The intended local workflow is Docker-backed Supabase plus the Next.js app.

### App commands

```bash
npm install
npm run dev
npm run lint
npm run build
```

### Supabase local commands

```bash
supabase start
supabase db reset
supabase status
```

After `supabase start`, copy the printed local Supabase URL, anon key, and service-role key into `.env.local`.

## 8. Known Gaps

- Docker/Supabase reset still needs elevated execution on this machine
- local storage bucket verification for admin media remains part of the blocked Docker-backed Supabase validation step
- several docs from earlier phases have been archived and should no longer be treated as primary instructions

## 9. Primary References

Only these documents are canonical:

- `POSSAH_MASTER_DOCUMENT.md`
- `POSSAH_BUILD_STATUS_GUIDE.md`
