# Possah — Phase 4 Summary + Phase 5 Continuation Prompt

**Date:** 2026-06-12
**Status:** Phase 4 shipped. Phase 5 ready to start.
**Reference:** Full execution plan at `docs/EXEC_PLAN_2026_06_11.md`.

---

## PART A — What Phase 4 delivered

### Phase 4 files created
- `supabase/migrations/028_order_status_history.sql` — audit table for all fulfillment status changes
- `lib/email.ts` — added `sendShippedEmail` + `sendDeliveredEmail`
- `app/api/admin/orders/[id]/route.ts` — PATCH handler extended with history insert + email triggers
- `app/api/admin/orders/[id]/resend-confirmation/route.ts` — POST, rate-limited 60s, logs history, sends email
- `app/api/admin/email-preview/route.ts` — POST, sends test confirmation email tagged `test=true`, no DB side-effects
- `app/admin/email-preview/page.tsx` + `EmailPreviewForm.tsx` — admin page with order picker + send test
- `app/admin/orders/[id]/OrderDetailClient.tsx` — status timeline + resend button with toast
- `components/pdp/MagnifierLens.tsx` — portal-based hover zoom, rAF throttled, desktop only

### Phase 4 files edited
- `app/admin/orders/[id]/page.tsx` — fetches `order_status_history` server-side via `Promise.all`, passes to client
- `components/pdp/ProductGallery.tsx` — main image wrapped in `<MagnifierLens>`, separate zoom button removed
- `lib/store/cartStore.ts` — `availableVariants` field on `CartItem`, `updateVariant` action
- `components/pdp/ProductInfo.tsx` — passes `availableVariants` array at `addToCart` time
- `app/(shop)/cart/CartView.tsx` — size shown as `<select>` dropdown when variants > 1, out-of-stock disabled

### Issues shipped
1. **Issue 19 — Order status history + auto-emails on Shipped/Delivered**
   - Every fulfillment status change is logged in `order_status_history` with `from_status`, `to_status`, `changed_by`, timestamp
   - `toStatus === 'shipped'` → fires `sendShippedEmail` (any non-cancelled/delivered from_status — allows skipping processing)
   - `toStatus === 'delivered'` → fires `sendDeliveredEmail`
   - De-dupe: checks for same `to_status` on same order within last 1 hour before sending
   - Emails are fire-and-forget (`.catch(console.error)`) — never block HTTP response
   - Status timeline visible on admin order detail page (dot + from→to + relative time + changed_by)

2. **Issue 16 — Resend confirmation button + email preview tool**
   - "Resend confirmation email" button on admin order detail. 10s UI cooldown. Toast shows result.
   - Rate-limited server-side: 429 if same order was resent within 60s.
   - Every resend logged as `to_status='confirmation_resent'` in history.
   - `/admin/email-preview` — pick any recent order + override email → sends test tagged `test=true` in Resend, no DB changes.

3. **Issue 8 — Hover magnifier on PDP**
   - `MagnifierLens` wraps main gallery image. Detects `(hover: hover) and (pointer: fine)` on mount.
   - Desktop: crosshair cursor, 300×400px zoom panel rendered via `createPortal` to `document.body` (avoids overflow:hidden clipping). Positioned right of image, clamped to viewport. `background-size: 250%`.
   - Mobile/touch: click → lightbox unchanged.
   - rAF throttled mousemove. Panel cleaned up on mouseleave.

4. **G8 — Cart size swap**
   - `availableVariants` stored on cart item at `addToCart` time (same colour group).
   - Cart shows `<select>` for items with 2+ size options. Out-of-stock options disabled.
   - `updateVariant` action: if target variant already in cart → merges qty; otherwise swaps in-place.

### Email flow summary
| Trigger | Email | De-dupe |
|---|---|---|
| Payment confirmed (webhook + verify race) | Order confirmation | `confirmation_email_sent_at` atomic claim |
| Admin sets status → `shipped` | Shipped email | History check: same to_status within 1 hour |
| Admin sets status → `delivered` | Delivered email | History check: same to_status within 1 hour |
| Admin clicks "Resend confirmation" | Confirmation email | Rate-limit: 60s cooldown via history table |
| Admin `/email-preview` | Test confirmation (tagged test=true) | None — dev tool |

### ⚠️ MANUAL DB ACTION REQUIRED for production

Run in Supabase SQL Editor (in order):

```sql
-- 1. If not already done from Phase 2:
-- supabase/migrations/025_orders_pending_dedupe_schema.sql

-- 2. Phase 4 (new):
-- supabase/migrations/028_order_status_history.sql
```

Without migration 028:
- Status timeline on admin order detail shows empty (gracefully handled)
- Shipped/delivered emails still fire (de-dupe check fails silently → `alreadyEmailed = false`)
- Resend rate-limit won't work (history INSERT fails silently)

### Email domain status
- API key `re_ZBHDqpHc_MjGZVihk7SRwkSYCPmyCf3tX` confirmed working (test email sent and received)
- Domain `thepossah.com` — verify status at resend.com/domains
- If domain shows Pending: add DKIM + SPF DNS records from Resend dashboard

---

## PART B — Phase 5 plan

### Scope: 3 issues

---

### Phase 5-A — Issue 10: SEO

**Why:** Products, categories, and editorial pages have no structured data. Google can't show rich results. Sitemap missing.

**Tasks:**
1. **JSON-LD** — add `Product` schema to PDP (`/shop/[category]/[slug]`), `BreadcrumbList` to category + PDP pages
2. **`<meta>` audit** — ensure every page has unique `title`, `description`, `og:image`, `og:title`. Check: home, PDP, category, about, bridal, festive, FAQ, account pages.
3. **`sitemap.xml`** — create `app/sitemap.ts` (Next.js 14 sitemap API). Include: all products (from DB), all categories, static pages. Exclude: `/admin/*`, `/api/*`, `/account/*`.
4. **`robots.txt`** — create `app/robots.ts`. Disallow: `/admin`, `/api`, `/account`. Allow everything else. Sitemap pointer.
5. **Alt text audit** — grep for `alt=""` or missing `alt` on `<Image>` components across shop pages. Fix any product images with empty alt.

**Key files:**
- `app/(shop)/[category]/[slug]/page.tsx` — add `generateMetadata` + JSON-LD `<script type="application/ld+json">`
- `app/(shop)/[category]/page.tsx` — add `generateMetadata`
- `app/sitemap.ts` — new file
- `app/robots.ts` — new file

---

### Phase 5-B — Issue 12: Speed optimisation

**Why:** LCP (Largest Contentful Paint) and INP affect Google ranking and conversion.

**Tasks:**
1. **Hero image `priority`** — confirm `loading="eager"` + `priority` on the first hero slide image only (currently may be eager on all slides).
2. **Font loading** — check `next/font` is used (not `@import` from Google Fonts). Confirm `display: 'swap'` + `preload: true`.
3. **Image sizes audit** — check all `<Image>` components have correct `sizes` prop. Oversized `sizes="100vw"` on narrow elements wastes bandwidth.
4. **Unused JS** — run `next build` and check bundle sizes. If any page >300KB first load JS, investigate.
5. **`next/dynamic` for heavy client components** — `ProductGallery`, `CartView`, checkout form: confirm they're not in the server bundle unnecessarily.

---

### Phase 5-C — Issue 15: DB field audit + cleanup migration

**Why:** Early schema had some placeholder columns that are now unused or misnamed.

**Tasks:**
1. **Audit:** run `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders'` and compare to what the code actually reads/writes.
2. **Migration `029_schema_cleanup.sql`:** rename-then-drop any confirmed-dead columns (rename first, deploy, wait 1 week, then drop in a follow-up migration to avoid breaking live reads).
3. **Check:** `products` table for any unused columns from earlier iterations.

---

## PART C — Phase 5 execution order

1. SEO (5-A) — highest impact for organic traffic
2. Speed (5-B) — quick wins, don't over-engineer
3. DB cleanup (5-C) — last, safest approach is rename→deploy→drop

---

## PART D — Phase 5 continuation prompt

Copy from `--- BEGIN PROMPT ---` to `--- END PROMPT ---` and paste into Claude Code.

```
--- BEGIN PROMPT ---
You are continuing Possah e-commerce work. Phases 1, 2, 3, and 4 are fully shipped.

Project rules:
- No filler. Complete code only. No partials.
- All edge cases: loading, error, empty state.
- Read existing files before editing.
- Don't touch out-of-scope files.
- TypeScript must pass clean (npx tsc --noEmit).

CONTEXT
Full plan: docs/EXEC_PLAN_2026_06_11.md. Read it.
Phase 4 handover: docs/HANDOVER_PHASE4_TO_PHASE5.md. Read it.

KEY FILES TO READ FIRST
- app/(shop)/[category]/[slug]/page.tsx — PDP, add JSON-LD + generateMetadata
- app/(shop)/[category]/page.tsx — category page, add generateMetadata
- app/sitemap.ts — create (does not exist yet)
- app/robots.ts — create (does not exist yet)
- app/layout.tsx — global font/meta setup
- lib/supabase/server.ts or equivalent — pattern for DB reads in server components

KEY FACTS
- Next.js 14 App Router. Server components by default. Force-dynamic where needed.
- createAdminClient() for server-side DB reads that bypass RLS (use for sitemap — no user context).
- createServerClient() for user-scoped reads.
- Images served from Cloudflare R2 (NEXT_PUBLIC_R2_PUBLIC_URL). Also Supabase storage URLs exist from early data.
- Google Analytics: trackViewItem / trackAddToCart / trackPurchase helpers in lib/analytics.ts. NEXT_PUBLIC_GA_MEASUREMENT_ID must be set in Vercel.
- No cron. No CRON_SECRET.

PHASE 5 SCOPE — 3 issues

ISSUE 10 — SEO

1. app/sitemap.ts — new file. Next.js MetadataRoute.Sitemap. Include:
   - All published products (select id, slug, category_slug, updated_at from products)
   - All categories (select slug from categories)
   - Static pages: /, /about, /faq, /bridal, /festive, /shop/sarees
   Exclude: /admin/*, /api/*, /account/*
   changeFrequency: products='weekly', categories='weekly', static='monthly'
   priority: home=1.0, categories=0.8, products=0.7, static=0.5

2. app/robots.ts — new file. Disallow /admin, /api, /account. Sitemap: https://thepossah.com/sitemap.xml.

3. app/(shop)/[category]/[slug]/page.tsx — add generateMetadata:
   - title: `${product.name} — The Possah`
   - description: product.description (trim to 160 chars)
   - openGraph: title, description, images: [{ url: product.images[0].url }]
   - Add JSON-LD Product schema as <script type="application/ld+json"> in page JSX

4. app/(shop)/[category]/page.tsx — add generateMetadata:
   - title: `${category.name} — The Possah`
   - description: `Shop ${category.name} at The Possah. Handcrafted in Bengaluru.`

5. Alt text audit: grep for alt="" across shop pages. Fix product images to use product name.

ISSUE 12 — Speed

1. Confirm hero first slide has priority + loading="eager". All other slides: loading="lazy".
2. Confirm next/font setup in app/layout.tsx — not @import.
3. Audit <Image> sizes props: any "100vw" on narrow containers? Fix to actual display size.
4. Run next build and check .next/analyze if bundle analyser is set up.

ISSUE 15 — DB field audit

1. Run SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' ORDER BY ordinal_position and compare to what route handlers actually use.
2. Create supabase/migrations/029_schema_cleanup.sql — rename suspected dead columns with _deprecated suffix. Do NOT drop yet.
3. Same audit for products table.

VERIFICATION
- npx tsc --noEmit must pass clean.
- curl https://thepossah.com/sitemap.xml returns valid XML with product + category URLs.
- curl https://thepossah.com/robots.txt shows correct disallow rules.
- PDP page source contains <script type="application/ld+json"> with Product schema.
- Lighthouse SEO score improves (target 90+).

After phase ships: create docs/HANDOVER_PHASE5_TO_PHASE6.md.
--- END PROMPT ---
```
