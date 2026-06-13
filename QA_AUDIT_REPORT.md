# The Possah — Full-Stack A→Z Verification Report

**Date:** 12 June 2026
**Audited build:** `90b4d4e` (live on `possah-website-dev.vercel.app`, verified responding)
**Scope:** Architecture, static analysis, payment/order flow, auth, DB, security, performance, accessibility, production readiness.
**Method:** Static code review of the full repo + live black-box probing of the dev deployment via browser (API status codes, auth bypass attempts, input fuzzing, render/console checks).

> **Verdict in one line:** The storefront is well-built and works. There are **no confirmed critical/exploitable holes** — auth is solid, payment signatures are verified, prices are server-authoritative. But inventory correctness hangs on a single webhook, a retry edge can orphan a real payment, coupons leak usage, and a few input-handling/SEO gaps need closing before this is "production-clean." Decide based on the High items first.

---

## 1. Executive Summary

What's genuinely good (verified, not assumed):

- **Auth is correct.** With no session cookie, every `/api/admin/*` and `/api/account/*` route returns `401`. The earlier-feared dev bypass (`FIX-SEC-01`) is gone from middleware; `isAdmin` is gated on `admin_users.is_active = true`. Confirmed live: `credentials:'omit'` → 401 across the board.
- **Payment trust model is sound.** Server always re-fetches DB prices (ignores client price), HMAC signature is verified on both the client callback (`/verify`) and the webhook, signature comparison is timing-safe, and paid orders cannot be downgraded by a late `payment.failed`.
- **Idempotent email dispatch.** The `confirmation_email_sent_at` atomic claim means the verify/webhook race cannot double-send.
- **Build hygiene.** `tsc --noEmit` → 0 errors. `eslint` → 0 warnings. CI gate exists (lint → typecheck → test). Security headers (HSTS, X-Frame-Options DENY, nosniff, Permissions-Policy) present on live responses.
- **Storefront renders clean.** Category, PDP (with JSON-LD + OpenGraph), cart all 200; 404 returns 404; no console errors; no broken images; `lang`, `h1`, form labels and button aria-labels present on sampled pages.

What needs a decision (the rest of this report):

- **2 High** issues — both in the money path (inventory + a payment-orphaning retry edge).
- **6 Medium** — coupon usage leak, email HTML injection, search filter injection, dev site indexable, unvalidated pagination, stock TOCTOU.
- **~8 Low** + test gaps + tech debt.

---

## 2. Critical Bugs

**None confirmed.** The classes that would normally be critical here (auth bypass, price tampering, signature skip, secret exposure) were each tested and are correctly handled. Do not read this as "nothing serious" — read the High section, which is where real money/inventory risk lives.

---

## 3. High-Priority Issues

### H-1 — Inventory only decrements in the webhook; if the webhook doesn't fire, paid orders never reduce stock
- **Severity:** High
- **Category:** Reliability / Inventory correctness
- **Location:** `app/api/payments/webhook/route.ts` (only place `decrement_variant_stock` is called) vs `app/api/payments/verify/route.ts` (marks paid, sends email, **no stock decrement**)
- **Reproduction:** Disable/misconfigure the Razorpay webhook (or let it fail delivery). Complete a payment. `/verify` marks the order `paid` and emails the customer, but stock is never decremented. The item stays purchasable at its old quantity.
- **Expected:** A paid order always reduces stock exactly once, regardless of which path confirms it.
- **Actual:** Stock decrement is exclusively webhook-driven. The webhook is a single point of failure for inventory. Master doc itself flags Vercel/webhook setup as "Sprint 4 partial / deploy TBD."
- **Root cause:** Stock side-effect was placed only on the backup path, not the primary one.
- **Suggested fix:** Move stock decrement into `sendOrderConfirmationIfNotSent`-style idempotent claim (decrement keyed on a `stock_decremented_at` guard on the order), so whichever of verify/webhook wins also does the stock decrement exactly once. Then both paths are safe and idempotent.
- **Confidence:** High (verified verify route contains no decrement).

### H-2 — Payment retry overwrites `gateway_order_id`; a payment against a stale Razorpay order is orphaned
- **Severity:** High
- **Category:** Payment correctness
- **Location:** `app/api/orders/[orderNumber]/retry-payment/route.ts` and the UPDATE branch of `app/api/orders/create/route.ts` (both overwrite `gateway_order_id` with a fresh Razorpay order id); webhook/verify look the order up **by `gateway_order_id`**.
- **Reproduction:** Customer opens checkout (Razorpay order A created, stored on row). Modal stays open. They retry / re-submit → Razorpay order B created, row now stores B. Customer then completes payment on the **old** modal (order A). Razorpay captures A. Webhook arrives with `order_id = A`, but the row now holds B → `.eq('gateway_order_id', A).single()` finds nothing → "order not found", acked `200`, no mark-paid, no email, no stock decrement. Money captured, order stuck pending.
- **Expected:** Any captured payment maps back to its order.
- **Actual:** Only the most recent gateway order id is retained; older valid attempts become unresolvable.
- **Root cause:** One-to-one `gateway_order_id` column overwritten on each attempt; no history of issued gateway order ids.
- **Suggested fix:** Keep a `gateway_order_ids TEXT[]` (or a child table) and look up by membership, or reconcile unmatched captures by `receipt` (= `order_number`, already passed to Razorpay). At minimum, on webhook "order not found," fall back to a lookup by `payment.notes`/receipt before acking.
- **Confidence:** Medium-High (logic confirmed by reading all three routes; not reproduced against live Razorpay).

---

## 4. Security Vulnerabilities

### S-1 — Email HTML injection (contact form + order emails)
- **Severity:** Medium
- **Category:** Stored/email XSS, phishing
- **Location:** `app/api/contact/route.ts` (`html: ...${name} (${email})... ${message}`), `lib/email.ts` (interpolates `customerName`, `item.name`, `courier`, etc. raw into HTML).
- **Detail:** `name`, `email`, `subject`, `message` from the contact form, and `customer_name` from checkout, are inserted into HTML emails without escaping. The checkout name validator (`/[a-zA-Z]/`) only requires *one* letter — it permits `<`, `>`, `"`. An attacker can inject markup/links into the email delivered to `hello@thepossah.com` and to customers (e.g. a fake "click here" phishing link in an order confirmation).
- **Fix:** HTML-escape all user-supplied values before interpolation into email templates (a 5-line `escapeHtml` helper applied at every `${userValue}` site).
- **Confidence:** High.

### S-2 — PostgREST `.or()` filter injection in search
- **Severity:** Medium
- **Category:** Input handling / data-scope manipulation
- **Location:** `app/api/search/route.ts` → `.or(\`name.ilike.%${q}%,fabric.ilike.%${q}%,description.ilike.%${q}%\`)` with raw user `q`.
- **Detail:** Commas/parentheses/dots in `q` are interpreted by PostgREST as additional filter syntax inside the `or()` group, not as literal search text. This lets a caller append OR-conditions to the query. The outer `.eq('is_active', true)` still ANDs, so it's not a full data breach (catalog is public), but it is malformed query behaviour and a hardening gap. Classic SQLi was tested (`a%' OR '1'='1`) and is safely neutralised (returns empty) — this is the PostgREST-specific variant.
- **Fix:** Sanitise `q` (strip/escape `,`, `(`, `)`, `.`, `:`) or use `.textSearch()` against the existing `search_vector` tsvector column (migration 020 already added it) instead of building an `or()` string.
- **Confidence:** Medium-High.

### S-3 — No rate limiting / bot protection on public POST endpoints
- **Severity:** Medium
- **Category:** Abuse / availability
- **Location:** `/api/contact`, `/api/coupons/validate`, `/api/orders/create`.
- **Detail:** No throttling or CAPTCHA. Contact → email spam to your inbox via Resend (and Resend quota burn). Coupon validate → code enumeration (responses are generic, which is good, but unlimited attempts). Orders/create → Razorpay order spam.
- **Fix:** Add IP/edge rate limiting (Vercel middleware or Upstash) on these three. CAPTCHA on contact.
- **Confidence:** High (no limiter present in code).

### S-4 — Latent dev-session bypass
- **Severity:** Low (currently safe)
- **Location:** `app/api/account/addresses/route.ts`, `[id]/route.ts`, `orders/hide`, `cancel`, `retry-payment`, `lib/auth.ts` `DEV_SESSION`.
- **Detail:** These routes use `const isDev = process.env.NODE_ENV === 'development' ? DEV_SESSION : getServerSession()`. Verified safe in prod (Vercel forces `NODE_ENV=production`; live returns 401). Risk is purely a misconfiguration footgun — if `NODE_ENV` were ever set to `development` on a deployed env, all customer order/address routes would auth as the admin dev user.
- **Fix:** Gate on an explicit, non-standard flag (e.g. `ALLOW_DEV_SESSION=1`) that is never set in any deployed environment, rather than `NODE_ENV`.
- **Confidence:** High.

**RLS note:** Most tables have RLS off by design (server uses service-role key). This is acceptable at current scale per the master doc, but it means every server-side query is the *only* thing standing between a customer and another customer's data — orders are keyed by `customer_email` and read through service-role, so a missing `.eq('customer_email', ...)` anywhere is an IDOR. The order routes audited (`hide`, `cancel`, `retry`) all correctly enforce the email match and return 404 (not 403) to avoid existence leaks — good. Keep this discipline on any new order route.

---

## 5. Performance Issues

- **P-1 (Medium):** `/api/health` DB round-trip measured **~1130 ms** live. Could be cold start, but if representative it's a slow categories read on a tiny table — check Supabase region vs Vercel `bom1`, and connection pooling.
- **P-2 (Low):** `/api/products` does the `size` filter and `occasion`/`fabric` filters partly in JS *after* fetching the page (`mapped.filter(...)`), so post-filtering can return fewer than `PAGE_SIZE` rows while `total` reflects the pre-filter count — pagination math is then wrong for those filters. Move occasion/fabric into the DB query (tags join / `ilike`).
- **P-3 (Low):** `sitemap.ts` fetches all products + categories + articles on every sitemap request with no cache hint — fine at 42 products, revisit as catalog grows.
- **Good:** ISR/OG/JSON-LD present, AVIF/WebP, 1-year edge image cache, composite indexes + FTS column (migration 020), `optimizePackageImports` configured.

---

## 6. Accessibility Issues

- Sampled live pages (`/shop/sarees`): `lang="en"` set, single `h1`, 0 buttons without accessible name, 0 inputs without a label, 0 broken images. Checkout form uses `role="alert"` on field errors and 16px inputs (prevents iOS zoom). **Baseline is decent.**
- **A-1 (Medium):** No automated a11y test in the suite and no full keyboard/focus/contrast audit was run. The brand palette (green `#1F3A2D`, gold, rose on cream) should be contrast-checked against WCAG AA, especially the mono micro-labels at 10–11px in muted colours — small + low-contrast is the likely failure. **Recommend running the `design:accessibility-review` skill on checkout + PDP.**
- **A-2 (Low):** Razorpay modal is third-party; verify focus trap / escape behaviour with `confirm_close:true`.

---

## 7. UX Issues

- **U-1 (Medium):** `page=abc` (NaN) on `/api/products` returns `total:42` but `0` products; `page=-1`/`page=99` return `total:0`. Inconsistent and silently empty. No clamp/validation on `page`. Add `Math.max(1, parseInt || 1)`.
- **U-2 (Low):** Checkout "fallback" branch (`else` when Razorpay JS didn't load) clears the cart and routes to confirmation **without any payment** — a script-load failure looks like a successful free order to the customer until reconciliation. Should show an error, not a confirmation.
- **U-3 (Low):** Coupon discount is computed twice (client `CheckoutForm` for display, server for charge). `free_shipping` is handled on the client via a separate `isFreeShipping` flag; drift between the two is possible. Server is authoritative (good) but the displayed total can mislead.

---

## 8. Missing Tests

Existing: 3 unit files (utils, razorpay, ProductGallery), 2 integration (orders-create price-spoof/stock/validation, payment-webhook idempotency/failed/bad-sig), 1 e2e (checkout happy path + auth redirect + storefront smoke). Solid core, but **the highest-risk logic is untested**:

- Stock decrement / oversell path (H-1) — no test.
- Retry-payment + reused-order `gateway_order_id` overwrite (H-2) — no test.
- Coupon usage increment/decrement lifecycle, incl. abandonment leak (M below) — no test.
- IDOR coverage on `orders/hide`, `cancel`, `retry-payment`, `account/addresses/[id]` (wrong-email → 404) — no test.
- `requireAdminAuth` guard present on **every** admin route — assert 401 without token (audit shows guards exist, but no test locks it in).
- Search route incl. injection/empty/min-length — no test.
- E2E is happy-path only; no failed-payment, dismiss, retry, slow-network, multi-tab.
- No automated accessibility test; k6 load script exists (`scripts/load_test/k6.js`) but no evidence it was executed (1/10/100/1000 users).

---

## 9. Technical Debt

- **40-state `INDIAN_STATES` array duplicated** in `CheckoutForm.tsx`, `account/addresses/route.ts`, `account/addresses/[id]/route.ts` (and the checkout zod schema). Extract to `lib/constants.ts`.
- **Shipping/gift/coupon constants duplicated** between `CheckoutForm.tsx` and `orders/create/route.ts` (`SHIPPING_THRESHOLD`, `STANDARD_COST`, etc.). Single source of truth needed — drift here is a pricing bug.
- **Heavy inline `style={{...}}`** throughout components despite a CSS-token system in `globals.css`. Maintainability cost; harder to theme/audit contrast.
- **Doc drift:** Master doc lists `/api/reviews` (POST) and `/api/wishlist` (GET/POST/DELETE) endpoints that **do not exist** in the codebase. Wishlist is client-only (`wishlistStore`); review *submission* is absent (`ReviewsSection` only displays). Either build them or correct the doc.
- **Fire-and-forget RPCs:** `void supabase.rpc('decrement_coupon_usage', ...)` in the orders/create UPDATE branch is unawaited; failures are silently lost.

---

## 10. Architectural Concerns

- **Inventory consistency model is fragile (ties to H-1 + the TOCTOU below).** Stock is *checked* at order create and *decremented* at payment, on different requests, with the decrement on the backup path only. Two buyers can both pass the check and both pay; the second is an oversell (logged, not prevented). For luxury single-quantity pieces this matters. Consider: reserve stock at order-create (decrement into a "reserved" state with TTL), confirm on payment, release on expiry.
- **Coupon usage leak (Medium, business logic):** `usage_count` is incremented at order-create (INSERT branch and on coupon change), but the lazy-expiry sweep and `/orders/cancel` only set `fulfillment_status='cancelled'` — **neither decrements the coupon.** A limited-use coupon is permanently consumed by every abandoned/expired checkout. Decrement coupon usage in the expiry sweep and cancel path.
- **`getOrCreateUserId` race:** two concurrent first-time address writes both attempt `users` insert; `email UNIQUE` makes the loser fail → null → 404 to a legitimate user. Use upsert/`onConflict`.
- **Webhook as single source of truth for two side-effects** (stock + email) while being the explicitly "TBD/partial" piece of infra. De-risk before relying on it in production.

---

## Scores (/10)

| Dimension | Score | One-line justification |
|---|---:|---|
| **Production readiness** | **6.5** | CI, health check, headers, ISR all present; but dev site indexable, monitoring removed (Sentry dropped), no rate limiting, webhook deploy "TBD." |
| **Security** | **7.0** | Auth + payment trust model genuinely solid; dragged down by email HTML injection, search filter injection, no rate limiting, latent dev-session footgun. |
| **Performance** | **7.0** | Good caching/indexing/image strategy; DB latency high in probe, post-fetch JS filtering breaks paginated filters. |
| **Reliability** | **6.0** | Idempotent emails are excellent; inventory depends on a single webhook, retry edge can orphan a payment, coupon leak. |
| **Overall application health** | **6.5** | A well-engineered storefront that is *close*. Nothing is on fire, but the money/inventory path has two High issues that should block a clean prod sign-off until fixed. |

---

## Recommended order of action (highest leverage first)

1. **H-1** make stock decrement idempotent and present on the verify path (not webhook-only).
2. **H-2** stop orphaning payments on retry — reconcile by receipt / keep gateway-order-id history.
3. **Coupon leak** — decrement usage on expiry + cancel.
4. **S-1** HTML-escape all user input in emails.
5. **S-3** rate-limit contact / coupon / order-create.
6. **SEO** add `X-Robots-Tag: noindex` to the dev deployment (env-gated) — it is currently fully crawlable.
7. **S-2 / U-1** sanitise search input; clamp `page`.
8. Backfill tests for items 1–5; run the a11y skill and the k6 load script.

> **Note on the SEO item:** Live check confirmed `possah-website-dev.vercel.app` serves `robots.txt` with `Allow: /` and **no** `x-robots-tag: noindex` header. The dev/staging site can be indexed by Google → duplicate content + pre-release exposure. Add an env-gated noindex on non-production deployments.

---

*Scores are judgement calls to aid prioritisation, not absolute grades. Every High/Medium above was traced to a specific file/line or reproduced live; confidence levels are stated per finding so you can weigh them yourself.*
