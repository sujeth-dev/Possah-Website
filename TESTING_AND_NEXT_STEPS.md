# Possah — Testing Guide, Further Plan & Operating Guide

**Date:** 12 June 2026
**Covers:** the audit fixes just shipped (see `AUDIT_FIXES_CHANGELOG.md`) — how to test them, what to do next and in what order, and how to run the project.

---

# PART 1 — Testing Guide

Test in two layers: **(A) automated** (run now, before deploy) and **(B) manual** (run after migration 029 + a preview deploy, because they exercise the live payment/DB path).

## A. Automated — run these now

```bash
npm run typecheck     # tsc --noEmit — must print nothing / exit 0
npm run lint          # ESLint — 0 errors (3 pre-existing warnings are fine)
npm test              # Vitest — 81 tests, all pass
```

What each new test proves:

| Test file | Proves |
|---|---|
| `tests/unit/html-escape.test.ts` | S-1 — user input is neutralised before it reaches email HTML |
| `tests/unit/stock.test.ts` | H-1 — stock decrements once on the winner, no-ops on every later/duplicate call |
| `tests/unit/coupons.test.ts` | coupon-leak — usage is released for a real code, no-op for empty/unknown |
| `tests/integration/payment-webhook.test.ts` (updated) | H-2 — a capture is reconciled by receipt when `gateway_order_id` no longer matches |

If `npm test` ever fails with `Cannot find module @rollup/rollup-linux-x64-gnu` or a bus error, that's the known npm optional-dep bug (your CI already works around it) — run `npm install --no-save @rollup/rollup-linux-x64-gnu@4` once and retry. It does **not** indicate a code problem.

Also run the existing suites before a release:

```bash
npm run test:api       # admin API suite (needs local Supabase + seed)
npm run test:payment   # payment flow suite
npm run test:e2e       # Playwright (needs dev server running)
```

## B. Manual — after running migration 029 on a preview/staging DB

> Do these on a **preview deployment**, never first-time on production. Order matters: run the migration first, then deploy, then test.

### B1. H-1 — stock decrements exactly once (the most important check)
1. Pick a product variant, note its `stock_qty` in Supabase.
2. Place a test order through checkout and pay (Razorpay test mode).
3. Confirm `stock_qty` dropped by the ordered quantity **once**.
4. In Supabase, confirm the order row now has `stock_decremented_at` set.
5. **Webhook-down simulation:** temporarily disable the Razorpay webhook, place + pay another order. Stock should *still* drop (the `/verify` path now decrements). Re-enable the webhook afterwards — the order's `stock_decremented_at` guard means the late webhook will **not** double-decrement.
   - Expected: every paid order reduces stock once, regardless of whether verify, the webhook, or both fire.

### B2. H-2 — payment is not orphaned by a retry
1. Start checkout (Razorpay order A created on the row).
2. Without paying, trigger a retry / re-submit so the row's `gateway_order_id` becomes order B.
3. Now pay the **old** modal (order A).
4. Expected: the order flips to `paid`, the confirmation email sends, stock decrements. (Webhook reconciles A → your order_number → the row.) Check the order is not stuck `pending`.

### B3. Coupon usage is released
1. Create a coupon with `usage_limit = 1`, `usage_count = 0`.
2. Start a checkout applying it (this increments `usage_count` to 1).
3. Abandon it, then start a fresh checkout for the same email (triggers the lazy-expiry sweep) — **or** call cancel on the pending order.
4. Expected: `usage_count` returns to 0; the coupon is usable again.

### B4. S-1 — email injection is closed
1. Submit the contact form with name `<b>x</b><a href="https://evil.test">click</a>`.
2. Open the email that lands in `hello@thepossah.com`.
3. Expected: the angle brackets show as literal text (`&lt;b&gt;…`), **no** bold rendering and **no** live link. Same check applies to placing an order with a name containing `<` `>`.

### B5. S-2 — search injection is closed
- `GET /api/search?q=a%2Cis_active.eq.false` (a `,` + extra condition) returns normal/empty results, never inactive products or anything outside the intended name/fabric/description match.

### B6. U-1 / P-2 — pagination + filters
- `GET /api/products?page=abc` and `?page=-1` → behave like page 1 (no "total but zero products").
- `GET /api/products?category=sarees&occasion=Cocktail&page=1` → `total` matches the number of products actually returned across pages (no partially-empty pages).

### B7. U-2 — checkout doesn't fake success
- Block `checkout.razorpay.com` in devtools (Network → block request URL), then try to pay.
- Expected: a clear retryable error appears and the **cart stays full** — you are **not** sent to the confirmation page.

### B8. S-4 — dev bypass stays off
- On the deployed preview, `GET /api/account/addresses` with no session → `401`. (It should only ever bypass locally when you explicitly set `ALLOW_DEV_SESSION=1` and `NODE_ENV !== production`.)

### Always, after any major action (per the original A→Z brief)
Open devtools and confirm: no console errors, no failed network requests, no React hydration warnings.

---

# PART 2 — Further Plan (sequenced)

Do these top to bottom. Each line says who acts.

### Step 1 — Ship the fixes (you + me)
1. **You:** run `supabase/migrations/029_orders_stock_decrement_guard.sql` on **staging** Supabase. *(DB change — needs you.)*
2. **You:** deploy the branch to a **Vercel preview**.
3. **You/me:** run Part 1B manual tests against that preview.
4. **You:** run migration 029 on **production**, then promote the deploy.

### Step 2 — Security patch: bump Next.js (me, on your go)
- `next@14.2.5` has a published advisory. Bump to the latest patched `14.2.x`, re-run `npm test` + `typecheck` + `lint`, verify build. *(Code change — I can do it; it touches `package.json`/lockfile, so say go.)*

### Step 3 — Close remaining audit Mediums (mix)
| Item | Who | Note |
|---|---|---|
| **Rate limiting** (S-3) on `/api/contact`, `/api/coupons/validate`, `/api/orders/create` | me to write, you to wire | Needs a limiter — Vercel edge middleware or an Upstash Redis token bucket. Decide the provider; I'll implement. |
| **Dev-site `noindex`** | you | Add `X-Robots-Tag: noindex` for non-production deploys (Vercel env-gated header). Stops Google indexing `possah-website-dev`. |
| **Razorpay webhook** registered for the new deploy URL | you | Dashboard → Webhooks → `payment.captured`, `payment.failed`. Confirms H-1/H-2 backup path is live. |

### Step 4 — Verification at scale (you to run, me to analyse)
- **k6 load test** (`scripts/load_test/k6.js`) against staging: 1 → 10 → 100 → 1000 users on `orders/create` + `payments/webhook`. Watch for the DB latency we saw (~1.1s on health) and connection limits.
- **Accessibility pass:** run the `design:accessibility-review` skill on checkout + PDP; fix any AA contrast failures (the small mono labels in muted colours are the likely offenders). Colour changes are a brand decision — your call.

### Step 5 — Re-score & close out (me)
- After Steps 1–4, re-run the A→Z audit and update the scores in `QA_AUDIT_REPORT.md` (target: Reliability and Security both ≥ 8).

### Not doing unless you ask (prohibited / your hands only)
Entering secrets, changing access controls, hard-deleting data, executing payments/transfers. I'll always hand these back to you.

---

# PART 3 — Operating Guide (how to run things)

### Everyday commands
```bash
npm run dev            # local dev server → localhost:3000  (admin at /admin)
npm run build          # production build
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint
npm test               # unit + integration (Vitest)
npm run test:e2e       # Playwright (dev server must be running)
```

### Running a migration (the safe way)
1. Open the `.sql` file under `supabase/migrations/` and read it.
2. Run it in the Supabase SQL editor on **staging** first.
3. Verify the change (for 029: `SELECT column_name FROM information_schema.columns WHERE table_name='orders' AND column_name='stock_decremented_at';` returns one row).
4. Repeat on production.
5. Migrations are append-only and idempotent (`IF NOT EXISTS`), so re-running is safe.

### Where the new code lives
| File | What |
|---|---|
| `lib/stock.ts` | `decrementOrderStockOnce()` — idempotent stock guard (H-1) |
| `lib/coupons.ts` | `releaseCouponUsage()` — coupon-leak fix |
| `lib/html-escape.ts` | `escapeHtml()` — email injection fix (S-1) |
| `lib/constants.ts` | shared `INDIAN_STATES` + pricing constants |
| `lib/razorpay.ts` | `fetchRazorpayOrder()` — webhook reconcile (H-2) |
| `supabase/migrations/029_*.sql` | the column H-1 depends on |

### A note on this folder (OneDrive)
This project lives in a OneDrive-synced folder. The sync can occasionally race a file write and truncate it. If you ever see a file end in a block of null characters or a syntax error at the very last line right after an edit, that's the cause — restore from git (`git checkout -- <file>`) and re-apply. Running `npm run typecheck` after any bulk edit catches it immediately. All files I delivered were verified clean this way.

### Definition of done for a release
`typecheck` + `lint` + `test` all green → migration run on staging → preview deploy → Part 1B manual tests pass → console clean → promote to production.
