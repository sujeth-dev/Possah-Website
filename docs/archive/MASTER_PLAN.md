# Possah 1.0 — Master Execution Plan

**Type:** Sprint-sequenced execution roadmap  
**Reference document:** `PLAN_AUDIT.md` — every fix ID referenced here has exact code, file paths, and SQL there  
**Go-live target:** End of Sprint 4  
**Last Updated:** May 2026

---

## How to Use This Document

This is the **execution sequence** — what to do, in what order, in what sprint. For exact code, line numbers, SQL, and verification commands, open `PLAN_AUDIT.md` and find the referenced FIX-ID.

**Rule:** Nothing ships to production until the Go-Live Gate (end of Sprint 4) is passed. Staging runs continuous deployment from `main`. Production is a manual deploy after the gate.

---

## Fix Registry Quick Reference

| Fix ID | Severity | One-line summary |
|---|---|---|
| FIX-SEC-01 | 🔴 CRITICAL | Remove dev admin bypass in middleware.ts |
| FIX-SEC-02 | 🔴 CRITICAL | Add security response headers to next.config.mjs |
| FIX-SEC-03 | 🔴 CRITICAL | RLS policies migration 018 — all 17 tables |
| FIX-SEC-04 | 🔴 CRITICAL | Drop `password_hash NOT NULL` from admin_users |
| FIX-SEC-05 | 🔴 CRITICAL | Filter `is_active=true` in auth.ts JWT callback |
| FIX-SEC-06 | ~~🔴 CRITICAL~~ REMOVED | Rate limiting removed — not needed at current scale. Vercel DDoS + Razorpay fraud controls are sufficient. |
| FIX-SEC-07 | 🟠 HIGH | Migrate from @supabase/auth-helpers-nextjs (deprecated) to @supabase/ssr |
| FIX-SEC-08 | 🟠 HIGH | Add Database generic to all Supabase client calls |
| FIX-PAY-01 | 🔴 CRITICAL | Add payment.failed listener in CheckoutForm.tsx |
| FIX-PAY-02 | 🟠 HIGH | Send customer email on payment.failed webhook |
| FIX-PAY-03 | 🟡 MEDIUM | Move coupon code out of URL query params |
| FIX-DB-01 | 🟠 HIGH | Add updated_at column + trigger to categories table |
| FIX-DB-02 | 🟠 HIGH | Add updated_at trigger to all remaining tables lacking it |
| FIX-DB-03 | 🟡 MEDIUM | Add composite indexes for common query patterns |
| FIX-FE-01 | 🟠 HIGH | Add loading.tsx to all major route segments |
| FIX-FE-02 | 🟠 HIGH | Add error.tsx to all major route segments |
| FIX-FE-03 | 🟠 HIGH | Add generateStaticParams + revalidate to product/category pages |
| FIX-FE-04 | 🟡 MEDIUM | Add Radix UI packages to optimizePackageImports in next.config.mjs |
| FIX-FE-05 | 🟡 MEDIUM | Wire GA4 measurement ID — currently env var exists but zero gtag calls |
| FIX-FE-06 | 🟡 MEDIUM | Sitemap: fix categories.updated_at (undefined) after FIX-DB-01 |
| FIX-FE-07 | 🟡 MEDIUM | Add structured data (JSON-LD) to product pages |
| FIX-FE-08 | 🟡 MEDIUM | Add Open Graph image meta to product pages |
| FIX-FE-09 | 🔵 LOW | Add `<link rel="preload">` for hero images on homepage |
| FIX-FE-10 | 🔵 LOW | Replace inline styles with Tailwind utility classes where mixed |
| FIX-INFRA-01 | 🔴 CRITICAL | Add GitHub Actions CI — lint + typecheck + test gates |
| FIX-INFRA-02 | 🟠 HIGH | Add Sentry DSN + instrument server/client error tracking |
| FIX-INFRA-03 | 🟠 HIGH | Set up Vercel project: env vars, bom1 region, branch protection |
| FIX-INFRA-04 | 🟡 MEDIUM | Add health check endpoint /api/health |
| FIX-TEST-01 | 🔴 CRITICAL | Install Vitest + write unit tests for razorpay.ts, auth.ts, coupon calc |
| FIX-TEST-02 | 🔴 CRITICAL | Write integration tests for all 7 API route groups |
| FIX-TEST-03 | 🟠 HIGH | Install Playwright + write E2E for checkout, auth, admin flows |
| FIX-TEST-04 | 🟡 MEDIUM | Add k6 load test for /api/orders/create |
| FIX-OPS-01 | 🟠 HIGH | Write admin seeding runbook — exact SQL with correct schema |
| FIX-OPS-02 | 🟡 MEDIUM | Document Razorpay webhook registration steps for production |

---

## Sprint 0 — Environment Bootstrap (Day 1, 4 hours)

**Goal:** Every developer can run the project. CI exists. No code change ships without a passing gate.

**Do not skip this sprint.** Without CI, every subsequent fix risks regression.

### Tasks

**0.1 — Verify local dev works end-to-end**
- `npm install` — zero errors
- `npm run dev` — starts on :3000
- Load `/` — renders
- Load `/admin` — confirms admin redirect
- Document any environment variables missing from `.env.local.example`

**0.2 — FIX-INFRA-01: GitHub Actions CI**  
See `PLAN_AUDIT.md → FIX-INFRA-01` for full YAML.  
File: `.github/workflows/ci.yml`  
Gates: `npm run lint` → `npm run typecheck` → `npm test` (will fail until Sprint 1 adds tests — that is correct and expected, but the gate itself must exist)

**0.3 — FIX-INFRA-03: Vercel staging setup**  
See `PLAN_AUDIT.md → FIX-INFRA-03`.
- Create Vercel project linked to repo
- Set all 14 env vars from `.env.local.example` with staging values
- Set region to `bom1` (Mumbai)
- Enable branch protection: `main` requires CI green + 1 review

**Done when:**
- `git push` to any branch triggers CI workflow
- `git push main` deploys to staging URL
- `/admin` on staging redirects to `/auth/signin`

---

## Sprint 1 — Critical Security (Days 2–4, ~2 days)

**Goal:** The five CRITICAL security bugs are gone. No dev bypass. RLS live. Rate limiting active.

**Dependency:** Sprint 0 complete. Staging deployed.

### Tasks in order

**1.1 — FIX-SEC-04: Fix admin_users schema** ← Do this FIRST, blocks seeding  
`ALTER TABLE admin_users DROP COLUMN password_hash;`  
Run on local Supabase. Add migration `019_fix_admin_users.sql`.  
After: `INSERT INTO admin_users (email, is_active) VALUES ('dev@email.com', true);` must succeed.

**1.2 — FIX-OPS-01: Seed admin user in dev and staging**  
After FIX-SEC-04: insert admin emails in local and staging Supabase.  
Confirm: sign in with that Google account → `/admin` loads → other Google accounts are redirected.

**1.3 — FIX-SEC-01: Remove dev admin bypass**  
Delete `middleware.ts` lines 17–19.  
Remove `isDev` variable if only used for bypass.  
Verify locally: navigate to `/admin` without session → redirect to `/auth/signin`.

**1.4 — FIX-SEC-05: Filter is_active in JWT callback**  
`lib/auth.ts` — add `.eq('is_active', true)` to the `admin_users` query.  
Test: deactivate an admin in DB → their session must lose admin access on next sign-in.

**1.5 — FIX-SEC-02: Security headers**  
Add `headers()` to `next.config.mjs`.  
No CSP yet — that comes after cataloguing third-party origins.  
Verify on staging: `curl -I https://[staging-url] | grep X-Frame`

**1.6 — FIX-SEC-03: RLS migration**  
Create `supabase/migrations/018_rls_policies.sql` with full policy set from `PLAN_AUDIT.md`.  
Run locally. Verify with anon client: `from('orders').select('*')` returns empty, not all rows.  
Push migration. Apply to staging Supabase.

**1.7 — FIX-SEC-06: Rate limiting — REMOVED**  
Decision: not needed at current scale. Upstash Redis adds operational overhead without meaningful benefit for a low-traffic boutique. Vercel's CDN-level DDoS protection and Razorpay's fraud controls are sufficient. Can be re-added if traffic grows significantly.

**1.8 — FIX-PAY-01: payment.failed client listener** ← CRITICAL payment bug  
`app/(shop)/checkout/CheckoutForm.tsx` — add `rz.on('payment.failed', handler)` inside `initRazorpay`.  
See `PLAN_AUDIT.md → FIX-PAY-01` for exact Razorpay event handler code.  
Also: update order status to `failed` via API call in that handler.

**1.9 — FIX-PAY-02: payment.failed webhook email**  
`app/api/payments/webhook/route.ts` — in `payment.failed` branch, add Resend email to customer.  
See `PLAN_AUDIT.md → FIX-PAY-02` for email template and Resend call.

**Sprint 1 exit criteria:**
- [ ] No admin bypass in middleware
- [ ] Active-only admins get JWT flag
- [ ] 4 security headers on all responses
- [ ] RLS enabled on all 17 tables
- [ ] Rate limiting returns 429 on abuse
- [ ] payment.failed triggers client state + customer email
- [ ] All changes green on CI

---

## Sprint 2 — Test Infrastructure + Database (Days 5–8, ~4 days)

**Goal:** Zero test files becomes a real test suite. DB timestamps fixed. Indexes in.

**Dependency:** Sprint 1 complete. RLS live.

### Tasks

**2.1 — FIX-TEST-01: Install Vitest + unit tests**  
```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom msw
```
Create `vitest.config.ts`. See `TESTING_PLAN.md → Section 2` for config.  
Write unit tests for:
- `lib/razorpay.ts` — `verifyRazorpayWebhookSignature`, `verifyRazorpayPaymentSignature` (target: 100% coverage)
- `lib/auth.ts` — JWT callback with active/inactive admin fixture
- Coupon discount calculation — percent, flat, free_shipping, min_order_value edge cases
- Shipping cost calculation — below/above threshold, express, gift wrap combinations

**2.2 — FIX-TEST-02: API route integration tests**  
Use `msw` to mock Supabase and Razorpay.  
Cover all 7 route groups:
- `/api/orders/create` — valid order, price spoofing attempt, insufficient stock, invalid coupon
- `/api/payments/webhook` — captured idempotency, failed branch, bad signature
- `/api/payments/verify` — valid signature, tampered signature, duplicate verify
- `/api/coupons/validate` — valid, expired, usage exhausted, below min_order
- `/api/admin/*` — auth required, rejects non-admin token
- `/api/reviews/*` — user can submit, anon cannot
- `/api/wishlist/*` — user-scoped, anon rejected

**2.3 — FIX-TEST-03: Playwright E2E**  
```bash
npm install -D @playwright/test
npx playwright install chromium
```
Create `playwright.config.ts`. See `TESTING_PLAN.md → Section 4` for config.  
Write E2E tests for 3 critical flows (remaining 3 flows are Sprint 3):
- Guest browses catalog → PDP → add to cart → checkout form renders
- Google OAuth sign-in → account page loads → sign out
- Admin sign-in → `/admin/orders` loads → order detail opens

**2.4 — FIX-DB-01: categories updated_at**  
Create migration `020_categories_timestamps.sql`:
```sql
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```
Apply locally and staging.

**2.5 — FIX-DB-02: updated_at on all remaining tables**  
Audit which tables lack the column. Add `021_missing_timestamps.sql`.  
After this: `FIX-FE-06` (sitemap) can be completed.

**2.6 — FIX-DB-03: Composite indexes**  
Create migration `022_indexes.sql`.  
See `PLAN_AUDIT.md → FIX-DB-03` for full index list (orders by user_id+created_at, products by is_active+category, variants by product_id+sku, etc.).

**2.7 — Update CI to run full test suite**  
After tests exist, CI `npm test` gate will actually pass. Confirm green.  
Add coverage threshold to `vitest.config.ts`: `razorpay.ts` must hit 100%, global 70%.

**Sprint 2 exit criteria:**
- [ ] `npm test` passes — unit + integration green
- [ ] Playwright smoke E2E green
- [ ] categories.updated_at populated
- [ ] All remaining tables have updated_at
- [ ] Composite indexes applied to staging
- [ ] CI green end-to-end

---

## Sprint 3 — Frontend Quality + SEO (Days 9–12, ~4 days)

**Goal:** Loading states, error boundaries, ISR, Open Graph, structured data, GA4 wired.

**Dependency:** Sprint 2 complete. Tests passing.

### Tasks

**3.1 — FIX-FE-01: loading.tsx**  
Add `loading.tsx` to every segment listed in `PLAN_AUDIT.md → FIX-FE-01`:
- `app/(shop)/loading.tsx`
- `app/(shop)/products/loading.tsx`
- `app/(shop)/products/[slug]/loading.tsx`
- `app/(shop)/checkout/loading.tsx`
- `app/account/loading.tsx`
- `app/admin/loading.tsx`
- `app/admin/orders/loading.tsx`
- `app/admin/products/loading.tsx`

Each file: skeleton with matching layout dimensions. No spinners-in-void.

**3.2 — FIX-FE-02: error.tsx**  
Add `error.tsx` to same segment list.  
Each: `'use client'`, receives `{ error, reset }` props, shows error message, has "Try again" button that calls `reset()`.

**3.3 — FIX-FE-03: generateStaticParams + revalidate**  
Product PDP `app/(shop)/products/[slug]/page.tsx`:
```ts
export async function generateStaticParams() {
  const { data } = await supabase.from('products').select('slug').eq('is_active', true)
  return (data ?? []).map(p => ({ slug: p.slug }))
}
export const revalidate = 3600 // 1 hour
```
Category pages: same pattern, `revalidate = 1800`.  
Homepage: `revalidate = 900`.

**3.4 — FIX-FE-04: optimizePackageImports**  
`next.config.mjs` — add to `experimental.optimizePackageImports`:
```js
['swiper', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select', '@radix-ui/react-tabs', 'lucide-react']
```

**3.5 — FIX-FE-05: GA4**  
Install: `npm install @next/third-parties`  
Add `<GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!} />` to root layout.  
Add `sendGAEvent` calls: view_item on PDP, add_to_cart, begin_checkout, purchase.  
Verify: GA4 real-time dashboard shows events in staging.

**3.6 — FIX-FE-06: Sitemap categories.updated_at**  
After FIX-DB-01 lands, `sitemap.ts` will correctly read `categories.updated_at`.  
No code change needed — verify the output: `curl https://[staging]/sitemap.xml` — category lastmod must not be `undefined`.

**3.7 — FIX-FE-07: JSON-LD structured data**  
Product PDP: add `<script type="application/ld+json">` with `Product` schema.  
Fields: name, description, image, offers (price, availability, currency INR), brand, sku.  
See `PLAN_AUDIT.md → FIX-FE-07` for exact JSON-LD template.

**3.8 — FIX-FE-08: Open Graph images**  
PDP `generateMetadata`: add `openGraph.images` with product image URL.  
Use Supabase Storage URL directly — no image proxy needed at this stage.

**3.9 — FIX-PAY-03: Coupon code out of URL**  
`CheckoutForm.tsx` line 118: remove `searchParams.get('coupon')`.  
Replace with controlled state that reads from cart store instead.  
Verify: coupon code does not appear in browser URL bar.

**3.10 — FIX-SEC-07: Migrate Supabase client**  
Replace `@supabase/auth-helpers-nextjs` with `@supabase/ssr`.  
`npm uninstall @supabase/auth-helpers-nextjs && npm install @supabase/ssr`  
Update `lib/supabase/server.ts`, `lib/supabase/client.ts`, middleware cookie handling.  
See `PLAN_AUDIT.md → FIX-SEC-07` for full before/after code.

**3.11 — Complete remaining Playwright E2E**  
3 remaining flows from `TESTING_PLAN.md`:
- Full checkout with payment modal (Razorpay test mode)
- Coupon application + discount reflected in total
- Admin order status update flow

**Sprint 3 exit criteria:**
- [ ] Every route segment has loading.tsx and error.tsx
- [ ] Product/category/homepage pages use ISR with revalidate
- [ ] GA4 events fire in staging real-time
- [ ] JSON-LD appears on PDP
- [ ] sitemap.xml has valid lastmod for all categories
- [ ] Supabase client on @supabase/ssr
- [ ] Full Playwright suite green

---

## Sprint 4 — Infrastructure Hardening + Go-Live Gate (Days 13–16, ~4 days)

**Goal:** Sentry live, health check live, final security audit, production deploy.

**Dependency:** Sprints 1–3 complete. All CI gates green. Staging validated.

### Tasks

**4.1 — FIX-INFRA-02: Sentry**  
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```
Configure `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`.  
Set `SENTRY_DSN` in Vercel env vars.  
Wrap custom error pages to capture boundary errors.  
Test: throw a deliberate error in a server component → Sentry dashboard shows it.

**4.2 — FIX-INFRA-04: Health check endpoint**  
Create `app/api/health/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { error } = await supabase.from('store_settings').select('id').limit(1).single()
  if (error) {
    return NextResponse.json({ status: 'degraded', db: 'error' }, { status: 503 })
  }
  return NextResponse.json({
    status: 'ok',
    db: 'connected',
    timestamp: new Date().toISOString(),
  })
}
```
Add to Vercel health check URL. Add to uptime monitor (UptimeRobot free tier sufficient for launch).

**4.3 — FIX-OPS-02: Razorpay webhook registration**  
See `PLAN_AUDIT.md → FIX-OPS-02`.  
Staging: register `https://[staging-url]/api/payments/webhook` with events: `payment.captured`, `payment.failed`.  
Copy webhook secret → `RAZORPAY_WEBHOOK_SECRET` env var on Vercel.  
Test: use Razorpay dashboard test event → confirm order updates in staging DB.

**4.4 — FIX-SEC-08: Database generic type**  
Generate Supabase types: `npx supabase gen types typescript --project-id [id] > types/supabase.ts`  
Update all `createClient()` calls to `createClient<Database>()`.  
Run `npm run typecheck` — must pass.

**4.5 — FIX-TEST-04: k6 load test**  
Install k6 locally (not in CI — too slow). See `TESTING_PLAN.md → Section 5`.  
Run 50 VUs x 60s against `/api/orders/create` on staging.  
Acceptable: p95 < 2s, zero 5xx.  
Document results. Tune if needed.

---

## Go-Live Gate Checklist

**All items must be ✅ before production deploy.**

### Security
- [ ] FIX-SEC-01: Dev bypass removed — verified on staging
- [ ] FIX-SEC-02: Security headers — `curl -I` confirms all 4 headers
- [ ] FIX-SEC-03: RLS active — anon `orders` query returns empty
- [ ] FIX-SEC-04: admin_users schema fixed — seeding works without password_hash
- [ ] FIX-SEC-05: is_active filter in JWT callback
- [x] FIX-SEC-06: Rate limiting — REMOVED (not needed at current scale)
- [ ] FIX-SEC-07: @supabase/ssr migration complete
- [ ] FIX-PAY-01: payment.failed client listener wired
- [ ] FIX-PAY-02: payment.failed webhook sends customer email

### Testing
- [ ] `npm run lint` — 0 errors, 0 warnings
- [ ] `npm run typecheck` — 0 errors
- [ ] `npm test` — all unit + integration tests pass
- [ ] `npm run test:coverage` — razorpay.ts at 100%, global ≥70%
- [ ] Playwright E2E — all 6 flows green
- [ ] Manual checkout test with Razorpay test card 4111 1111 1111 1111

### Infrastructure
- [ ] Vercel project configured — correct region (bom1), all env vars set
- [ ] GitHub Actions CI green on `main`
- [ ] Branch protection on `main` enforced
- [ ] Sentry receiving errors from staging
- [ ] Health check `/api/health` returns `{"status":"ok"}`
- [ ] Uptime monitor configured

### Database
- [ ] 018_rls_policies.sql applied to production Supabase
- [ ] 019–022 migrations applied to production Supabase
- [ ] Admin user seeded in production Supabase
- [ ] Razorpay production webhook registered with production URL

### Business Readiness
- [ ] Razorpay account KYC complete — live keys obtained
- [ ] `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` switched to live keys in Vercel production env
- [ ] Test purchase made end-to-end with live keys (₹1 product)
- [ ] Confirmation email received by buyer
- [ ] Order appears in admin `/admin/orders`
- [ ] Custom domain DNS pointing to Vercel
- [ ] SSL certificate active (Vercel auto-provisions)

---

## Production Deploy Sequence

Run in order. No skips.

```bash
# 1. Final staging smoke test
curl https://[staging-url]/api/health

# 2. Apply all pending migrations to production Supabase
npx supabase db push --project-ref [prod-project-ref]

# 3. Seed production admin user
# Run in Supabase SQL editor (production):
INSERT INTO admin_users (email, is_active) VALUES ('admin@thepossah.com', true);

# 4. Register Razorpay production webhook
# Dashboard → Webhooks → Add new webhook
# URL: https://thepossah.com/api/payments/webhook
# Events: payment.captured, payment.failed
# Copy secret → set RAZORPAY_WEBHOOK_SECRET in Vercel production env

# 5. Switch Razorpay keys to live in Vercel production env
# RAZORPAY_KEY_ID=rzp_live_...
# RAZORPAY_KEY_SECRET=...

# 6. Deploy to production in Vercel dashboard (promote staging → production)

# 7. DNS cutover (if needed)
# A record or CNAME pointing to Vercel

# 8. Post-deploy smoke test (production)
curl https://thepossah.com/api/health
# Open https://thepossah.com — homepage loads
# Complete test purchase

# 9. Watch Sentry for 15 minutes — zero new errors
```

**Rollback:** In Vercel dashboard → Deployments → click previous deployment → Promote to Production. Takes <60 seconds.

---

## Post-Launch: Month 1 Improvements

These do not block go-live. Execute after first week of live traffic confirms stability.

| Priority | Fix ID | Task |
|---|---|---|
| 1 | FIX-FE-09 | Preload hero images |
| 2 | FIX-FE-10 | Clean up inline styles |
| 3 | FIX-FE-04 | Expand optimizePackageImports list |
| 4 | FIX-TEST-04 | k6 load test — run against production traffic |
| 5 | — | CSP header — catalogue all third-party origins, add in report-only first |
| 6 | — | Shiprocket integration — replace manual fulfillment with automated tracking |
| 7 | — | GST invoice generation on order confirmation email |
| 8 | — | UPI intent flow for mobile (reduces friction vs redirect flow) |
| 9 | — | Full Supabase database type generation wired into dev workflow |

---

## File Cleanup

The three original plan files are superseded by this document and `PLAN_AUDIT.md`. Archive after Sprint 0:

```bash
mkdir -p docs/archive
mv PLAN_01_DEVELOPMENT_COMPLETION.md docs/archive/
mv PLAN_02_DEPLOYMENT.md docs/archive/
mv PLAN_03_PAYMENT_AND_ECOMMERCE_COMPLETION.md docs/archive/
```

Keep `TESTING_PLAN.md` — it contains vitest/playwright configs that developers reference directly.

---

## Sprint Summary

| Sprint | Days | Focus | Gate |
|---|---|---|---|
| Sprint 0 | 1 | CI + staging environment | Vercel staging live |
| Sprint 1 | 2–4 | All CRITICAL security + payment bugs | Zero critical open |
| Sprint 2 | 5–8 | Test suite + database timestamps + indexes | Tests green, CI passing |
| Sprint 3 | 9–12 | Frontend quality + SEO + Supabase migration | Lighthouse ≥85, full E2E |
| Sprint 4 | 13–16 | Sentry + health check + go-live gate | ✅ All gate items checked |
| Post-launch | Week 3+ | Month 1 improvements | — |

**Total pre-launch:** 16 working days (~3.5 weeks solo, ~10 days with 2 devs parallel on Sprint 2+3.
